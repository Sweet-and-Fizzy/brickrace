import { serverSupabaseClient } from '#supabase/server'
import { challongeApi, challongeUtils } from '~/server/utils/challonge-client'
import type { ChallongeParticipant } from '~/types/database'

export default defineEventHandler(async (event) => {
  const tournamentId = getRouterParam(event, 'id')
  const body = await readBody(event)
  const client = await serverSupabaseClient(event)

  if (!tournamentId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Tournament ID is required'
    })
  }

  if (!body.racers || !Array.isArray(body.racers)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Racers array is required'
    })
  }

  try {
    // Get tournament data
    const { data: tournament, error: tournamentError } = await client
      .from('challonge_tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single()

    if (tournamentError || !tournament) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Tournament not found'
      })
    }

    // Check if tournament is in correct state
    if (tournament.status !== 'pending') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Can only add participants to pending tournaments'
      })
    }

    // Check if participants already exist
    const { data: existingParticipants } = await client
      .from('challonge_participants')
      .select('racer_id')
      .eq('challonge_tournament_id', tournamentId)

    const existingRacerIds = new Set(existingParticipants?.map(p => p.racer_id) || [])
    const newRacers = body.racers.filter((racer: any) => !existingRacerIds.has(racer.racer_id))

    if (newRacers.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'All provided racers are already participants in this tournament'
      })
    }

    // Prepare participants for Challonge API
    const participants = challongeUtils.prepareParticipants(newRacers)

    // Add participants to Challonge
    console.log('Adding participants to Challonge tournament:', tournament.challonge_tournament_id)
    console.log('Participants to add:', participants)
    
    const challongeParticipants = await challongeApi.bulkAddParticipants(
      tournament.challonge_tournament_id,
      participants
    )

    // Save participant mappings to our database
    const participantMappings = challongeParticipants.map((cp, index) => ({
      challonge_tournament_id: tournamentId,
      racer_id: newRacers[index].racer_id,
      challonge_participant_id: cp.participant.id.toString(),
      seed_position: cp.participant.seed
    }))

    const { data: localParticipants, error: insertError } = await client
      .from('challonge_participants')
      .insert(participantMappings as Omit<ChallongeParticipant, 'id' | 'created_at'>[])
      .select(`
        *,
        racer:racers(*)
      `)

    if (insertError) {
      console.error('Failed to save participants locally:', insertError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to save participant data'
      })
    }

    // Get updated participant count
    const { count: totalParticipants } = await client
      .from('challonge_participants')
      .select('*', { count: 'exact', head: true })
      .eq('challonge_tournament_id', tournamentId)

    return {
      success: true,
      participants: localParticipants,
      summary: {
        added: newRacers.length,
        total: totalParticipants || 0,
        challonge_tournament_id: tournament.challonge_tournament_id
      },
      challonge_participants: challongeParticipants.map(cp => ({
        id: cp.participant.id,
        name: cp.participant.name,
        seed: cp.participant.seed
      }))
    }
  } catch (error: any) {
    console.error('Participant addition error:', error)
    
    // Handle Challonge-specific errors
    if (error.message?.includes('Challonge API Error')) {
      throw createError({
        statusCode: 502,
        statusMessage: `Tournament service error: ${error.message}`
      })
    }

    // Re-throw createError instances
    if (error.statusCode) {
      throw error
    }

    // Generic error fallback
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to add participants'
    })
  }
})