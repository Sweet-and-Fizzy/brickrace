import { serverSupabaseClient } from '#supabase/server'

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
    // Get tournament with participant count
    const { data: tournament, error: tournamentError } = await client
      .from('challonge_tournaments')
      .select(`
        *,
        race:races(*)
      `)
      .eq('id', tournamentId)
      .single()

    if (tournamentError || !tournament) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Tournament not found'
      })
    }

    // Get participant count and details
    const { data: participants, count: participantCount } = await client
      .from('challonge_participants')
      .select(`
        *,
        racer:racers(*)
      `, { count: 'exact' })
      .eq('challonge_tournament_id', tournamentId)
      .order('seed_position', { ascending: true })

    return {
      tournament,
      participants: {
        count: participantCount || 0,
        list: participants || []
      },
      urls: {
        public: `https://challonge.com/${tournament.challonge_url}`,
        embed: tournament.embed_url
      },
      can_start: (participantCount || 0) >= 2 && tournament.status === 'pending',
      can_add_participants: tournament.status === 'pending'
    }
  } catch (error: any) {
    console.error('Tournament status error:', error)
    
    // Re-throw createError instances
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to get tournament status'
    })
  }
})