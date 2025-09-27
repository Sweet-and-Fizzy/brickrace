import { serverSupabaseClient } from '#supabase/server'
import { syncAllBracketsToChallonge, syncBracketToChallonge } from '~/server/utils/challonge-sync'

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

  try {
    // Get tournament data and verify it exists
    const { data: tournament, error: tournamentError } = await client
      .from('challonge_tournaments')
      .select('race_id, status, challonge_tournament_id')
      .eq('id', tournamentId)
      .single()

    if (tournamentError || !tournament) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Tournament not found'
      })
    }

    if (tournament.status !== 'active') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Can only sync brackets for active tournaments'
      })
    }

    // Check if specific bracket IDs were provided for targeted sync
    const { bracket_ids, force_resync = false } = body

    let syncResults = []

    if (bracket_ids && Array.isArray(bracket_ids)) {
      // Sync specific brackets
      console.log(`Manual sync requested for ${bracket_ids.length} specific brackets`)
      
      for (const bracketId of bracket_ids) {
        try {
          // If force_resync is true, delete existing sync record first
          if (force_resync) {
            await client
              .from('challonge_match_sync')
              .delete()
              .eq('bracket_id', bracketId)
          }

          await syncBracketToChallonge(client, tournament.race_id, bracketId)
          syncResults.push({
            bracket_id: bracketId,
            status: 'success'
          })
        } catch (error) {
          console.error(`Failed to sync bracket ${bracketId}:`, error)
          syncResults.push({
            bracket_id: bracketId,
            status: 'error',
            error: (error as Error).message
          })
        }
      }
    } else {
      // Sync all completed brackets for the race
      console.log(`Manual bulk sync requested for race ${tournament.race_id}`)
      
      if (force_resync) {
        // Clear all existing sync records for this tournament
        await client
          .from('challonge_match_sync')
          .delete()
          .eq('challonge_tournament_id', tournamentId)
        
        console.log('Cleared existing sync records for force resync')
      }

      await syncAllBracketsToChallonge(client, tournament.race_id)
      
      // Get sync summary
      const { data: syncedBrackets } = await client
        .from('challonge_match_sync')
        .select('bracket_id, synced_at')
        .eq('challonge_tournament_id', tournamentId)

      syncResults = syncedBrackets || []
    }

    // Get final sync status
    const { data: allSyncRecords } = await client
      .from('challonge_match_sync')
      .select('bracket_id, synced_at, scores_csv')
      .eq('challonge_tournament_id', tournamentId)
      .order('synced_at', { ascending: false })

    const { data: completedBrackets } = await client
      .from('brackets')
      .select('id')
      .eq('race_id', tournament.race_id)
      .not('track1_time', 'is', null)
      .not('track2_time', 'is', null)
      .not('winner_racer_id', 'is', null)

    const totalCompleted = completedBrackets?.length || 0
    const totalSynced = allSyncRecords?.length || 0

    return {
      success: true,
      message: 'Bracket sync completed',
      summary: {
        total_completed_brackets: totalCompleted,
        total_synced_brackets: totalSynced,
        sync_coverage: totalCompleted > 0 ? (totalSynced / totalCompleted * 100).toFixed(1) + '%' : '0%'
      },
      sync_results: syncResults,
      sync_records: allSyncRecords
    }

  } catch (error: any) {
    console.error('Manual bracket sync error:', error)
    
    // Re-throw createError instances
    if (error.statusCode) {
      throw error
    }

    // Generic error fallback
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to sync brackets'
    })
  }
})