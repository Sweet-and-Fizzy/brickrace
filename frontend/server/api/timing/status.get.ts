/**
 * Timing System API: Get Race Status
 * GET /api/timing/status
 *
 * Headers: { "X-API-Key": "your-timing-api-key" }
 *
 * Returns current race status, active heat, and upcoming heats
 * for the timing system to know what's happening
 */

import {
  requireTimingAuth,
  logTimingRequest,
  createTimingSupabaseClient
} from '~/server/utils/timing-auth'
import { getRacePhase, getCurrentHeat, getUpcomingHeats } from '~/server/utils/race-phase'

export default defineEventHandler(async (event) => {
  // Validate JWT token
  await requireTimingAuth(event)

  const client = await createTimingSupabaseClient(event)

  try {
    logTimingRequest(event, 'STATUS_CHECK')

    // Get active race
    const { data: activeRace, error: raceError } = await client
      .from('races')
      .select('*')
      .eq('active', true)
      .single()

    if (raceError || !activeRace) {
      return {
        race: null,
        current_heat: null,
        upcoming_heats: [],
        message: 'No active race found'
      }
    }

    // Determine race phase
    const phase = await getRacePhase(client, activeRace.id)

    // Get current heat (qualifier or bracket)
    const currentHeat = await getCurrentHeat(client, activeRace.id, phase)

    // Get upcoming heats/brackets
    const upcomingHeats = await getUpcomingHeats(client, activeRace.id, phase, 2)

    // Format for timing system
    const currentHeatFormatted = currentHeat
      ? {
          heat_number: currentHeat.heat_number,
          status: 'in_progress',
          type: currentHeat.type,
          bracket_id: currentHeat.bracket_id,
          // Add bracket-specific information
          bracket_group: currentHeat.bracket_group,
          round_number: currentHeat.round_number,
          match_number: currentHeat.match_number,
          racers: currentHeat.racers.map((r) => ({
            track_number: r.track_number,
            racer_id: r.racer_id,
            racer_name: r.racer_name,
            racer_number: r.racer_number,
            current_time: r.time
          }))
        }
      : null

    const upcomingHeatsFormatted = upcomingHeats.map((heat) => ({
      heat_number: heat.heat_number,
      scheduled_order: heat.scheduled_order,
      status: 'scheduled',
      type: heat.type,
      bracket_id: heat.bracket_id,
      // Add bracket-specific information
      bracket_group: heat.bracket_group,
      round_number: heat.round_number,
      match_number: heat.match_number,
      racers: heat.racers
    }))

    // Count total heats and completed heats for progress tracking (based on current phase)
    let uniqueHeatsTotal = 0
    let uniqueHeatsCompleted = 0

    if (phase === 'qualifying') {
      const { count: totalHeats } = await client
        .from('qualifiers')
        .select('heat_number', { count: 'exact', head: true })
        .eq('race_id', activeRace.id)
        .not('heat_number', 'is', null)

      const { count: completedHeats } = await client
        .from('qualifiers')
        .select('heat_number', { count: 'exact', head: true })
        .eq('race_id', activeRace.id)
        .eq('status', 'completed')
        .not('heat_number', 'is', null)

      uniqueHeatsTotal = totalHeats ? Math.ceil(totalHeats / 2) : 0 // 2 racers per heat
      uniqueHeatsCompleted = completedHeats ? Math.ceil(completedHeats / 2) : 0
    } else if (phase === 'brackets') {
      const { count: totalBrackets } = await client
        .from('brackets')
        .select('id', { count: 'exact', head: true })
        .eq('race_id', activeRace.id)

      const { count: completedBrackets } = await client
        .from('brackets')
        .select('id', { count: 'exact', head: true })
        .eq('race_id', activeRace.id)
        .not('winner_racer_id', 'is', null)

      uniqueHeatsTotal = totalBrackets || 0
      uniqueHeatsCompleted = completedBrackets || 0
    }

    return {
      race: {
        id: activeRace.id,
        name: activeRace.name,
        date: activeRace.race_datetime,
        phase: phase
      },
      current_heat: currentHeatFormatted,
      upcoming_heats: upcomingHeatsFormatted,
      progress: {
        total_heats: uniqueHeatsTotal,
        completed_heats: uniqueHeatsCompleted,
        remaining_heats: uniqueHeatsTotal - uniqueHeatsCompleted,
        percent_complete:
          uniqueHeatsTotal > 0 ? Math.round((uniqueHeatsCompleted / uniqueHeatsTotal) * 100) : 0
      },
      timestamp: new Date().toISOString()
    }
  } catch (error: any) {
    logTimingRequest(event, 'STATUS_ERROR', { error: error.message })

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to get race status'
    })
  }
})
