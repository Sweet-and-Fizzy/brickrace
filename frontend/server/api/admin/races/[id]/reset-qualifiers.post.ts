import { serverSupabaseClient } from '#supabase/server'
import { serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // Check for admin auth
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  const client = await serverSupabaseClient(event)
  const raceId = getRouterParam(event, 'id')

  if (!raceId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Race ID is required'
    })
  }

  // Check if user is race admin (match frontend auth store logic)
  const isAdmin = user.user_metadata?.isRaceAdmin || user.user_metadata?.isAdmin || false
  if (!isAdmin) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Admin access required'
    })
  }

  try {

    // Delete ALL qualifiers for this race (scheduled, in_progress, and completed)
    const { error: deleteError, count } = await client
      .from('qualifiers')
      .delete()
      .eq('race_id', raceId)

    if (deleteError) {
      console.error('Error resetting qualifiers:', deleteError)
      throw deleteError
    }

    return {
      success: true,
      message: `Reset all qualifier data. Deleted ${count || 0} qualifier records`,
      qualifiers_deleted: count || 0
    }
  } catch (error: any) {
    console.error('Error in reset-qualifiers:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to reset qualifiers'
    })
  }
})