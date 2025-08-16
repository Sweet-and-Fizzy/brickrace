import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const user = await serverSupabaseUser(event)
  const qualifierId = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  // Check if user is race admin (match frontend auth store logic)
  const isAdmin = user.user_metadata?.isRaceAdmin || user.user_metadata?.isAdmin || false
  if (!isAdmin) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Only race admins can edit qualifiers'
    })
  }

  const { racer_id, track_number, time } = body

  try {
    const updateData: any = {}
    if (racer_id !== undefined) updateData.racer_id = racer_id
    if (track_number !== undefined) updateData.track_number = track_number
    if (time !== undefined) updateData.time = time

    const { data, error } = await client
      .from('qualifiers')
      .update(updateData)
      .eq('id', qualifierId)
      .select(
        `
        *,
        racer:racers(
          id,
          name,
          racer_number,
          image_url
        )
      `
      )
      .single()

    if (error) {
      throw error
    }

    return {
      data,
      error: null
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to update qualifier'
    })
  }
})
