import { serverSupabaseClient } from '#supabase/server'
import { challongeApi } from '~/server/utils/challonge-client'

export default defineEventHandler(async (event) => {
  const tournamentId = getRouterParam(event, 'id')
  const client = await serverSupabaseClient(event)

  if (!tournamentId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Tournament ID is required'
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
        statusMessage: `Tournament is already ${tournament.status}. Can only start pending tournaments.`
      })
    }

    // Check if tournament has participants
    const { count: participantCount } = await client
      .from('challonge_participants')
      .select('*', { count: 'exact', head: true })
      .eq('challonge_tournament_id', tournamentId)

    if (!participantCount || participantCount < 2) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Tournament must have at least 2 participants to start'
      })
    }

    // Start tournament on Challonge
    const challongeTournament = await challongeApi.startTournament(
      tournament.challonge_tournament_id
    )

    // Update tournament status in our database
    const { data: updatedTournament, error: updateError } = await client
      .from('challonge_tournaments')
      .update({
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', tournamentId)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update tournament status:', updateError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update tournament status'
      })
    }

    // Get initial matches from Challonge
    const matches = await challongeApi.getMatches(tournament.challonge_tournament_id)

    return {
      success: true,
      tournament: updatedTournament,
      challonge: {
        id: challongeTournament.tournament.id,
        state: challongeTournament.tournament.state,
        started_at: challongeTournament.tournament.started_at,
        participants_count: challongeTournament.tournament.participants_count
      },
      matches: {
        total: matches.length,
        first_round: matches.filter((m) => m.match.round === 1).length
      },
      summary: {
        participants: participantCount,
        status: 'active',
        public_url: `https://challonge.com/${tournament.challonge_url}`,
        embed_url: tournament.embed_url
      }
    }
  } catch (error: any) {
    console.error('Tournament start error:', error)

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
      statusMessage: error.message || 'Failed to start tournament'
    })
  }
})
