import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const user = await serverSupabaseUser(event)
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
      statusMessage: 'Only race admins can regenerate qualifiers'
    })
  }

  const { race_id } = body

  try {
    // Use the active race if no race_id provided
    let targetRaceId = race_id
    if (!targetRaceId) {
      const { data: activeRace } = await client
        .from('races')
        .select('id')
        .eq('active', true)
        .single()

      if (!activeRace) {
        throw new Error('No active race found')
      }
      targetRaceId = activeRace.id
    }

    // Regenerate qualifiers
    const { error } = await client.rpc('generate_qualifier_heats', {
      target_race_id: targetRaceId
    })

    if (error) {
      throw error
    }

    // Get the newly generated qualifiers
    const { data: qualifiers } = await client
      .from('qualifiers')
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
      .eq('race_id', targetRaceId)
      .eq('status', 'scheduled')
      .order('scheduled_order')

    return {
      success: true,
      message: 'Qualifiers regenerated successfully',
      data: qualifiers
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to regenerate qualifiers'
    })
  }
})
