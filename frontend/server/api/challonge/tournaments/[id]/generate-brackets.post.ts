import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { generateBracketsFromChallonge } from '~/server/utils/bracket-generator'

export default defineEventHandler(async (event) => {
  const tournamentId = getRouterParam(event, 'id')

  // Check authentication
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required'
    })
  }

  // Check admin permissions
  const isAdmin = user.user_metadata?.isAdmin || user.user_metadata?.isRaceAdmin
  if (!isAdmin) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Admin privileges required to generate brackets'
    })
  }

  const client = await serverSupabaseServiceRole(event)

  if (!tournamentId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Tournament ID is required'
    })
  }

  let tournament: any = null

  try {
    // Get tournament data and verify it exists
    const { data: tournamentData, error: tournamentError } = await client
      .from('challonge_tournaments')
      .select('race_id, status, challonge_tournament_id')
      .eq('id', tournamentId)
      .single()

    if (tournamentError || !tournamentData) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Tournament not found'
      })
    }

    tournament = tournamentData

    if (tournament.status !== 'active') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Can only generate brackets for active tournaments'
      })
    }

    // Generate brackets from Challonge structure
    const result = await generateBracketsFromChallonge(client, tournament.race_id, tournamentId)

    // Get the generated brackets with racer details
    const { data: generatedBrackets } = await client
      .from('brackets')
      .select(
        `
        *,
        track1_racer:racers!track1_racer_id(id, name, racer_number),
        track2_racer:racers!track2_racer_id(id, name, racer_number)
      `
      )
      .eq('race_id', tournament.race_id)
      .order('challonge_suggested_play_order', { ascending: true, nullsFirst: false })
      .order('challonge_round', { ascending: true })
      .order('match_number', { ascending: true })

    return {
      success: true,
      message: 'Brackets generated successfully from Challonge tournament',
      summary: {
        brackets_generated: result.bracketsGenerated,
        tournament_structure: result.tournamentStructure,
        race_id: tournament.race_id,
        challonge_tournament_id: tournament.challonge_tournament_id
      },
      brackets: generatedBrackets || []
    }
  } catch (error: any) {
    console.error('Bracket generation error:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      tournamentId,
      raceId: tournament?.race_id
    })

    // Re-throw createError instances
    if (error.statusCode) {
      throw error
    }

    // Generic error fallback with more details
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to generate brackets',
      data: {
        error: error.message,
        tournamentId,
        raceId: tournament?.race_id
      }
    })
  }
})
