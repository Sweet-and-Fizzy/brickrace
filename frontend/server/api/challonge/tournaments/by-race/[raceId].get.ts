import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const raceId = getRouterParam(event, 'raceId')
  const client = await serverSupabaseClient(event)

  if (!raceId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Race ID is required'
    })
  }

  try {
    const { data: tournament, error } = await client
      .from('challonge_tournaments')
      .select('*')
      .eq('race_id', raceId)
      .single()

    if (error || !tournament) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Tournament not found for this race'
      })
    }

    return {
      data: tournament
    }
  } catch (error: any) {
    // Re-throw createError instances
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to get tournament'
    })
  }
})