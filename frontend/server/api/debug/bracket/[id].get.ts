import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const bracketId = getRouterParam(event, 'id')
  const client = await serverSupabaseClient(event)

  if (!bracketId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bracket ID is required'
    })
  }

  try {
    const { data: bracket, error } = await client
      .from('brackets')
      .select('*')
      .eq('id', bracketId)
      .single()

    if (error) throw error

    return {
      bracket,
      has_track1_racer: !!bracket?.track1_racer_id,
      has_track2_racer: !!bracket?.track2_racer_id,
      has_winner: !!bracket?.winner_racer_id
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to get bracket'
    })
  }
})
