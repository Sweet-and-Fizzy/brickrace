/**
 * Timing System API: Generate Heats
 * POST /api/timing/generate-heats
 *
 * Headers: { "X-API-Key": "your-timing-api-key" }
 * Body: { race_id?: string } // Optional, defaults to active race
 *
 * Generates qualifier heats for all checked-in racers
 */

import { serverSupabaseClient } from '#supabase/server'
import { requireTimingAuth, logTimingRequest } from '~/server/utils/timing-auth'

export default defineEventHandler(async (event) => {
  // Validate JWT token
  await requireTimingAuth(event)

  const client = await serverSupabaseClient(event)
  const body = await readBody(event)

  const { race_id } = body

  try {
    logTimingRequest(event, 'GENERATE_HEATS', { race_id })

    // Use the active race if no race_id provided
    let targetRaceId = race_id
    if (!targetRaceId) {
      const { data: activeRace } = await client
        .from('races')
        .select('id, name')
        .eq('active', true)
        .single()

      if (!activeRace) {
        throw new Error('No active race found')
      }
      targetRaceId = activeRace.id
    }

    // Get count of checked-in racers
    const { count: checkedInCount } = await client
      .from('checkins')
      .select('*', { count: 'exact', head: true })
      .eq('race_id', targetRaceId)

    if (!checkedInCount || checkedInCount === 0) {
      throw new Error('No racers checked in for this race')
    }

    // Generate heats using the database function
    const { error } = await client.rpc('generate_qualifier_heats', {
      target_race_id: targetRaceId
    })

    if (error) {
      throw error
    }

    // Get the newly generated heats count
    const { count: heatsGenerated } = await client
      .from('qualifiers')
      .select('*', { count: 'exact', head: true })
      .eq('race_id', targetRaceId)
      .eq('status', 'scheduled')

    const totalHeats = heatsGenerated ? Math.ceil(heatsGenerated / 2) : 0

    logTimingRequest(event, 'GENERATE_HEATS_SUCCESS', {
      race_id: targetRaceId,
      racers_checked_in: checkedInCount,
      heats_generated: totalHeats
    })

    return {
      success: true,
      message: 'Heats generated successfully',
      race_id: targetRaceId,
      racers_checked_in: checkedInCount,
      heats_generated: totalHeats
    }
  } catch (error: any) {
    logTimingRequest(event, 'GENERATE_HEATS_ERROR', { race_id, error: error.message })

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to generate heats'
    })
  }
})
