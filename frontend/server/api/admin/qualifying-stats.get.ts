/**
 * Get qualifying statistics for active race
 * GET /api/admin/qualifying-stats
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
    // Use the database function to get qualifying stats
    const { data: stats, error } = await client.rpc('get_qualifying_stats')

    if (error) {
      throw error
    }

    // The function returns a single row with the stats
    const statsData = stats?.[0] || {
      total_racers: 0,
      total_attempts: 0,
      min_attempts: 0,
      max_attempts: 0,
      avg_attempts: 0,
      racers_with_min_attempts: 0
    }

    return {
      success: true,
      data: {
        total_racers: statsData.total_racers,
        total_attempts: statsData.total_attempts,
        min_attempts: statsData.min_attempts,
        max_attempts: statsData.max_attempts,
        avg_attempts: Math.round(statsData.avg_attempts * 10) / 10, // Round to 1 decimal
        racers_with_min_attempts: statsData.racers_with_min_attempts
      }
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to get qualifying stats'
    })
  }
})