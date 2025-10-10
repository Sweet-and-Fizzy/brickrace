/**
 * Timing System API: Get Race Status
 * GET /api/timing/status
 *
 * Headers: { "X-API-Key": "your-timing-api-key" }
 *
 * Returns current race status, active heat, and upcoming heats
 * for the timing system to know what's happening
 *
 * Enhancements:
 * - For best-of-3 bracket matches, the response includes track swap details:
 *   current_heat.match_format: 'single' | 'best_of_3'
 *   current_heat.total_rounds: number
 *   current_heat.current_round: number
 *   current_heat.rounds_won: { track1: number; track2: number }
 *   current_heat.track_swaps: {
 *     enabled: boolean,
 *     current_round: number,
 *     current_assignment: {
 *       round_number: number,
 *       track1_assignment: { racer_slot: 1|2, racer_id: string|null },
 *       track2_assignment: { racer_slot: 1|2, racer_id: string|null },
 *       completed: boolean
 *     } | null,
 *     planned_assignments: Array<same as current_assignment>
 *   }
 * These fields allow timing hardware to display/anticipate lane swaps per round.
 */

import {
  requireTimingAuth,
  logTimingRequest,
  createTimingSupabaseClient
} from '~/server/utils/timing-auth'
import { getRacePhase, getCurrentHeat, getUpcomingHeats } from '~/server/utils/race-phase'

// Local types to keep response and internals well-typed
type TimingRacer = {
  track_number: number
  racer_id?: string | null
  racer_name?: string | null
  racer_number?: number | null
  current_time?: number | null
}

type TrackAssignment = {
  round_number: number
  track1_assignment: { racer_slot: 1 | 2; racer_id: string | null }
  track2_assignment: { racer_slot: 1 | 2; racer_id: string | null }
  completed: boolean
}

type TimingHeat = {
  heat_number: number
  status: 'in_progress' | 'scheduled'
  type: 'qualifier' | 'bracket'
  bracket_id?: string
  bracket_group?: string
  round_number?: number
  match_number?: number
  racers: TimingRacer[]
  // Optional for multi-round matches
  match_format?: 'single' | 'best_of_3'
  total_rounds?: number
  current_round?: number
  rounds_won?: { track1: number; track2: number }
  track_swaps?: {
    enabled: boolean
    current_round: number
    current_assignment: TrackAssignment | null
    planned_assignments: TrackAssignment[]
  }
}

type UpcomingHeat = Omit<TimingHeat, 'status'> & { scheduled_order?: number }

export default defineEventHandler(async (event) => {
  // Validate JWT token
  await requireTimingAuth(event)

  const client = await createTimingSupabaseClient()

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
    let currentHeatFormatted: TimingHeat | null = currentHeat
      ? {
          heat_number: currentHeat.heat_number,
          status: 'in_progress',
          type: currentHeat.type as 'qualifier' | 'bracket',
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

    // If current heat is a bracket, enrich with match round/track swap info
    if (
      currentHeatFormatted &&
      currentHeatFormatted.type === 'bracket' &&
      currentHeatFormatted.bracket_id
    ) {
      // Fetch bracket match format and round info
      const { data: bracketMeta } = await client
        .from('brackets')
        .select(
          'id, match_format, total_rounds, current_round, rounds_won_track1, rounds_won_track2, track1_racer_id, track2_racer_id'
        )
        .eq('id', currentHeatFormatted.bracket_id)
        .single()

      if (bracketMeta) {
        // Default current round to first incomplete round if missing
        let effectiveRound = bracketMeta.current_round || 1

        if (!bracketMeta.current_round && bracketMeta.match_format === 'best_of_3') {
          const { data: nextIncomplete } = await client
            .from('bracket_rounds')
            .select('round_number')
            .eq('bracket_id', bracketMeta.id)
            .is('completed_at', null)
            .order('round_number', { ascending: true })
            .limit(1)

          if (Array.isArray(nextIncomplete) && nextIncomplete.length > 0) {
            effectiveRound = nextIncomplete[0].round_number
          }
        }

        // Get current round track assignments (if multi-round)
        let currentRoundAssignment: TrackAssignment | null = null
        let allRoundAssignments: TrackAssignment[] = []

        if (bracketMeta.match_format === 'best_of_3') {
          const { data: rounds } = await client
            .from('bracket_rounds')
            .select('round_number, racer1_id, racer2_id, racer1_track, racer2_track, completed_at')
            .eq('bracket_id', bracketMeta.id)
            .order('round_number', { ascending: true })

          if (Array.isArray(rounds)) {
            allRoundAssignments = rounds.map((r) => ({
              round_number: r.round_number,
              track1_assignment: {
                racer_slot: r.racer1_track === 1 ? 1 : 2,
                racer_id: r.racer1_track === 1 ? r.racer1_id : r.racer2_id
              },
              track2_assignment: {
                racer_slot: r.racer1_track === 2 ? 1 : 2,
                racer_id: r.racer1_track === 2 ? r.racer1_id : r.racer2_id
              },
              completed: !!r.completed_at
            })) as TrackAssignment[]

            currentRoundAssignment =
              allRoundAssignments.find((r) => r.round_number === effectiveRound) || null
          }
        }

        currentHeatFormatted = {
          ...currentHeatFormatted,
          match_format: bracketMeta.match_format || 'single',
          total_rounds:
            bracketMeta.total_rounds || (bracketMeta.match_format === 'best_of_3' ? 3 : 1),
          current_round: effectiveRound,
          rounds_won: {
            track1: bracketMeta.rounds_won_track1 || 0,
            track2: bracketMeta.rounds_won_track2 || 0
          },
          track_swaps: {
            enabled: bracketMeta.match_format === 'best_of_3',
            current_round: effectiveRound,
            current_assignment: currentRoundAssignment,
            planned_assignments: allRoundAssignments
          }
        }

        // Update racer track_number to reflect the actual track in the current round
        if (
          bracketMeta.match_format === 'best_of_3' &&
          currentRoundAssignment &&
          Array.isArray(currentHeatFormatted.racers)
        ) {
          const idToTrack = new Map<string, 1 | 2>()
          if (currentRoundAssignment.track1_assignment?.racer_id) {
            idToTrack.set(currentRoundAssignment.track1_assignment.racer_id, 1)
          }
          if (currentRoundAssignment.track2_assignment?.racer_id) {
            idToTrack.set(currentRoundAssignment.track2_assignment.racer_id, 2)
          }

          const adjustedRacers = currentHeatFormatted.racers.map((r) => {
            const rid = r.racer_id || null
            const adjustedTrack = rid ? idToTrack.get(rid) : undefined
            return {
              ...r,
              track_number: adjustedTrack ?? r.track_number
            }
          })

          currentHeatFormatted = { ...currentHeatFormatted, racers: adjustedRacers }
        }
      }
    }

    const upcomingHeatsFormatted = (upcomingHeats as UpcomingHeat[]).map((heat) => ({
      heat_number: heat.heat_number,
      scheduled_order: heat.scheduled_order,
      status: 'scheduled',
      type: heat.type,
      bracket_id: heat.bracket_id,
      // Add bracket-specific information
      bracket_group: heat.bracket_group,
      round_number: heat.round_number,
      match_number: heat.match_number,
      // Optional hints for multi-round matches when available
      match_format: heat.match_format,
      total_rounds: heat.total_rounds,
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get race status'
    logTimingRequest(event, 'STATUS_ERROR', { error: message })

    throw createError({
      statusCode: 500,
      statusMessage: message
    })
  }
})
