/**
 * Get qualifying mode for active race
 * GET /api/admin/qualifying-mode
 */

import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // Check if user is race admin
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required'
    })
  }

  const client = await serverSupabaseClient(event)

  // Check if user is race admin (match frontend auth store logic)
  const isAdmin = user.user_metadata?.isRaceAdmin || user.user_metadata?.isAdmin || false
  if (!isAdmin) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Admin access required'
    })
  }

  try {
    // Get active race with qualifying mode
    const { data: race, error } = await client
      .from('races')
      .select('id, name, qualifying_mode')
      .eq('active', true)
      .single()

    if (error || !race) {
      throw createError({
        statusCode: 404,
        statusMessage: 'No active race found'
      })
    }

    return {
      success: true,
      data: {
        race_id: race.id,
        race_name: race.name,
        qualifying_mode: race.qualifying_mode || 'auto'
      }
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to get qualifying mode'
    })
  }
})
