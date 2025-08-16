/**
 * Timing System API: Start Heat
 * POST /api/timing/start-heat
 *
 * Headers: { "X-API-Key": "your-timing-api-key" }
 * Body: { heat_number: number }
 */

import {
  requireTimingAuth,
  logTimingRequest,
  createTimingSupabaseClient
} from '~/server/utils/timing-auth'

export default defineEventHandler(async (event) => {
  // Validate API key
  await requireTimingAuth(event)

  const client = await createTimingSupabaseClient(event)
  const body = await readBody(event)

  const { heat_number } = body

  if (!heat_number || typeof heat_number !== 'number') {
    throw createError({
      statusCode: 400,
      statusMessage: 'heat_number is required and must be a number'
    })
  }

  try {
    logTimingRequest(event, 'START_HEAT', { heat_number })

    // Get active race first
    const { data: activeRace, error: raceError } = await client
      .from('races')
      .select('id')
      .eq('active', true)
      .single()

    if (raceError || !activeRace) {
      throw new Error('No active race found')
    }

    // Use the database function to start the heat
    const { error: startError } = await client.rpc('start_heat', {
      heat_num: heat_number
    })

    if (startError) {
      throw startError
    }

    // Get updated heat information
    const { data: currentRaceData } = await client
      .from('races')
      .select('id, name')
      .eq('active', true)
      .single()

    logTimingRequest(event, 'START_HEAT_SUCCESS', { heat_number, race: currentRaceData?.name })

    return {
      success: true,
      message: `Heat ${heat_number} started successfully`,
      heat_number,
      race: currentRaceData
    }
  } catch (error: any) {
    logTimingRequest(event, 'START_HEAT_ERROR', { heat_number, error: error.message })

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to start heat'
    })
  }
})
