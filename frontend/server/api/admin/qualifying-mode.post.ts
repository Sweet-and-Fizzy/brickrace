/**
 * Set qualifying mode for active race
 * POST /api/admin/qualifying-mode
 * Body: { mode: 'auto' | 'manual' | 'brackets' }
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
  const body = await readBody(event)

  // Check if user is race admin (match frontend auth store logic)
  const isAdmin = user.user_metadata?.isRaceAdmin || user.user_metadata?.isAdmin || false
  if (!isAdmin) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Admin access required'
    })
  }

  const { mode } = body

  if (!mode || !['auto', 'manual', 'brackets'].includes(mode)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Mode must be auto, manual, or brackets'
    })
  }

  try {
    // Use the database function to set qualifying mode
    const { error } = await client.rpc('set_qualifying_mode', { mode })

    if (error) {
      throw error
    }

    return {
      success: true,
      message: `Qualifying mode set to: ${mode}`,
      data: { qualifying_mode: mode }
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to set qualifying mode'
    })
  }
})