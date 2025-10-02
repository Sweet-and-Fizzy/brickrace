import { challongeApi } from '~/server/utils/challonge-client'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const tournamentId = getRouterParam(event, 'tournamentId')
  const client = await serverSupabaseClient(event)

  if (!tournamentId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Tournament ID is required'
    })
  }

  try {
    // Check if this is a race ID instead of tournament ID
    let actualTournamentId = tournamentId
    let dbInfo = null
    
    // If it looks like a race ID (small number), look up the tournament
    if (/^\d{1,2}$/.test(tournamentId)) {
      const { data: tournament } = await client
        .from('challonge_tournaments')
        .select('id, challonge_tournament_id, status, race_id')
        .eq('race_id', tournamentId)
        .single()
      
      if (tournament) {
        actualTournamentId = tournament.challonge_tournament_id
        dbInfo = tournament
      } else {
        // Show all tournaments and races to help debug
        const { data: allTournaments } = await client
          .from('challonge_tournaments')
          .select('id, challonge_tournament_id, status, race_id')
          .order('created_at', { ascending: false })
        
        const { data: allRaces } = await client
          .from('races')
          .select('id, name, slug')
          .order('created_at', { ascending: false })
        
        return {
          error: `No tournament found for race ID ${tournamentId}`,
          race_id: tournamentId,
          all_tournaments: allTournaments || [],
          all_races: allRaces || [],
          message: "Check if any of these tournaments should be linked to this race"
        }
      }
    }

    // Get raw participant data from Challonge
    const participants = await challongeApi.getParticipants(actualTournamentId)
    
    return {
      tournament_id: actualTournamentId,
      database_info: dbInfo,
      participants,
      message: 'Raw Challonge participant data (check for ranking info)'
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to get Challonge participants'
    })
  }
})