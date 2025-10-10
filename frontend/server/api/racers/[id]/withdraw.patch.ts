import { serverSupabaseClient } from '#supabase/server'
import { syncBracketToChallonge } from '~/server/utils/challonge-sync'
import { challongeApi } from '~/server/utils/challonge-client'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const racerId = getRouterParam(event, 'id')
  const body = await readBody(event)

  const { withdrawn, race_id, reason } = body

  if (!racerId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Racer ID is required'
    })
  }

  if (!race_id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Race ID is required'
    })
  }

  if (typeof withdrawn !== 'boolean') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Withdrawn status must be a boolean'
    })
  }

  try {
    // Get current user
    const {
      data: { user },
      error: authError
    } = await client.auth.getUser()
    if (authError || !user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      })
    }

    // Check if user has permission (race admin via JWT metadata or racer owner)
    const isAdmin = user.user_metadata?.isRaceAdmin || user.user_metadata?.isAdmin || false

    // Check if user owns the racer
    const { data: racerOwnerCheck, error: racerError } = await client
      .from('racers')
      .select('id')
      .eq('id', racerId)
      .eq('user_id', user.id)
      .single()

    const isRacerOwner = !racerError && racerOwnerCheck

    if (!isAdmin && !isRacerOwner) {
      throw createError({
        statusCode: 403,
        statusMessage: 'You can only withdraw/reinstate your own racers or if you are a race admin'
      })
    }

    if (withdrawn) {
      // First get preview of heat impact
      const { data: heatImpact, error: previewError } = await client.rpc(
        'preview_withdrawal_heat_impact',
        {
          target_race_id: race_id,
          target_racer_id: racerId
        }
      )

      if (previewError) {
        console.error('Heat impact preview error:', previewError)
        // Continue anyway - this is just for information
      }

      // Withdraw racer from race - insert withdrawal record
      const { data: withdrawal, error } = await client
        .from('race_withdrawals')
        .upsert({
          race_id,
          racer_id: racerId,
          reason,
          withdrawn_by: user.id
        })
        .select('*')
        .single()

      if (error) {
        throw error
      }

      // CRITICAL: Delete participant from Challonge FIRST
      // This marks them inactive and auto-forfeits all remaining matches in Challonge,
      // preventing Challonge from creating new matches (like Loser bracket assignments)
      let challongeSync = null
      let participantDeleted = false
      try {
        // Get active tournament for this race
        const { data: tournament } = await client
          .from('challonge_tournaments')
          .select('id, challonge_tournament_id')
          .eq('race_id', race_id)
          .eq('status', 'active')
          .single()

        if (tournament) {
          try {
            // Get participant mapping
            const { data: participant } = await client
              .from('challonge_participants')
              .select('challonge_participant_id')
              .eq('challonge_tournament_id', tournament.id)
              .eq('racer_id', racerId)
              .single()

            if (participant) {
              // DELETE participant - this marks them inactive and auto-forfeits all remaining matches
              await challongeApi.deleteParticipant(
                tournament.challonge_tournament_id,
                participant.challonge_participant_id
              )
              participantDeleted = true
              console.log(
                `Deleted participant ${participant.challonge_participant_id} from Challonge (marked inactive, auto-forfeited remaining matches)`
              )
            }
          } catch (participantError) {
            console.error('Failed to delete participant from Challonge:', participantError)
          }
        }
      } catch (challongeError) {
        console.error('Challonge sync error:', challongeError)
        // Don't fail the withdrawal if Challonge sync fails
      }

      // Now handle existing heats and brackets locally (remove from scheduled heats, forfeit incomplete brackets)
      const { data: withdrawalResult, error: withdrawalError } = await client.rpc(
        'handle_racer_withdrawal',
        {
          target_race_id: race_id,
          target_racer_id: racerId
        }
      )

      if (withdrawalError) {
        console.error('Withdrawal handling error:', withdrawalError)
        // Don't fail the withdrawal, but log the issue
      }

      // Extract heat and bracket results
      const heatChanges = withdrawalResult?.heats || null
      const bracketChanges = withdrawalResult?.brackets || null

      // Sync forfeited brackets to Challonge if we have a tournament
      // Participant is already deleted/inactive, so Challonge won't create new matches
      const syncResults = []
      if (
        participantDeleted &&
        bracketChanges &&
        (bracketChanges.bracket_rounds_forfeited > 0 || bracketChanges.brackets_forfeited > 0)
      ) {
        try {
          const { data: tournament } = await client
            .from('challonge_tournaments')
            .select('id, challonge_tournament_id')
            .eq('race_id', race_id)
            .eq('status', 'active')
            .single()

          if (tournament) {
            const { data: forfeitedBrackets } = await client
              .from('brackets')
              .select('id')
              .eq('race_id', race_id)
              .or(`track1_racer_id.eq.${racerId},track2_racer_id.eq.${racerId}`)
              .eq('is_forfeit', true)

            for (const bracket of forfeitedBrackets || []) {
              try {
                await syncBracketToChallonge(client, race_id, bracket.id)
                syncResults.push({ bracket_id: bracket.id, status: 'synced' })
              } catch (syncError) {
                console.error(`Failed to sync bracket ${bracket.id}:`, syncError)
                syncResults.push({ bracket_id: bracket.id, status: 'failed' })
              }
            }
          }
        } catch (syncError) {
          console.error('Error syncing brackets to Challonge:', syncError)
        }
      }

      challongeSync = {
        participant_deleted: participantDeleted,
        brackets_synced: syncResults.filter((r) => r.status === 'synced').length
      }

      return {
        success: true,
        withdrawal,
        heatImpact: heatImpact || null,
        heatChanges,
        bracketChanges,
        challongeSync,
        message:
          'Racer withdrawn from race. Scheduled heats removed, incomplete brackets forfeited, completed results preserved.'
      }
    } else {
      // Reinstate racer - check if brackets exist first
      const { count: bracketCount } = await client
        .from('brackets')
        .select('*', { count: 'exact', head: true })
        .eq('race_id', race_id)

      if (bracketCount && bracketCount > 0) {
        throw createError({
          statusCode: 400,
          statusMessage:
            'Cannot reinstate racer after bracket phase has begun. Withdrawals are final once brackets exist.'
        })
      }

      // Remove withdrawal record
      const { error } = await client
        .from('race_withdrawals')
        .delete()
        .eq('race_id', race_id)
        .eq('racer_id', racerId)

      if (error) {
        throw error
      }

      return {
        success: true,
        message: 'Racer reinstated to race'
      }
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to update racer withdrawal status'
    })
  }
})
