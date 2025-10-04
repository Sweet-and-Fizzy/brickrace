/**
 * Timing System API: Record Heat Times
 * POST /api/timing/record-times
 *
 * Headers: { "X-API-Key": "your-timing-api-key" }
 * Body: {
 *   heat_number: number,
 *   track1_time?: number,
 *   track2_time?: number,
 *   auto_advance?: boolean  // Default: true
 * }
 */

import {
  requireTimingAuth,
  logTimingRequest,
  createTimingSupabaseClient
} from '~/server/utils/timing-auth'
import { getRacePhase } from '~/server/utils/race-phase'
import { syncBracketByChallongeMatchId } from '~/server/utils/bracket-generator'

/**
 * Handle bracket completion - determine winner and generate next round brackets
 */
async function handleBracketCompletion(client: any, raceId: string, bracketId: string) {
  try {
    // Get the completed bracket with all details
    const { data: bracket, error: bracketError } = await client
      .from('brackets')
      .select(
        `
        *,
        track1_racer:racers!track1_racer_id(id, name, racer_number),
        track2_racer:racers!track2_racer_id(id, name, racer_number)
      `
      )
      .eq('id', bracketId)
      .single()

    if (bracketError || !bracket) {
      throw new Error('Failed to get bracket details')
    }

    // Determine winner and loser
    let winnerRacerId, loserRacerId, winnerTrack, loserTrack

    if (bracket.track1_time < bracket.track2_time) {
      winnerRacerId = bracket.track1_racer_id
      loserRacerId = bracket.track2_racer_id
      winnerTrack = 1
      loserTrack = 2
    } else {
      winnerRacerId = bracket.track2_racer_id
      loserRacerId = bracket.track1_racer_id
      winnerTrack = 2
      loserTrack = 1
    }

    // Update bracket with winner
    await client
      .from('brackets')
      .update({
        winner_track: winnerTrack,
        winner_racer_id: winnerRacerId
      })
      .eq('id', bracketId)

    console.log(`Bracket ${bracketId}: Winner is track ${winnerTrack} (${winnerRacerId})`)

    // Sync completed bracket to Challonge using match ID and regenerate brackets
    if (bracket.challonge_match_id) {
      syncBracketByChallongeMatchId(client, raceId, bracket.challonge_match_id)
        .then(async () => {
          console.log(
            `Bracket ${bracketId} synced successfully, regenerating brackets from Challonge`
          )
          // Import the bracket generator function
          const { generateBracketsFromChallonge } = await import('~/server/utils/bracket-generator')

          // Get tournament ID for this race
          const { data: tournament } = await client
            .from('challonge_tournaments')
            .select('id')
            .eq('race_id', raceId)
            .eq('status', 'active')
            .single()

          if (tournament) {
            await generateBracketsFromChallonge(client, raceId, tournament.id)
            console.log('Brackets regenerated from Challonge after sync')
          }
        })
        .catch((error) => {
          console.error(
            `Failed to sync bracket ${bracketId} to Challonge match ${bracket.challonge_match_id}:`,
            error
          )
          // Log but don't throw - timing operation should succeed even if sync fails
        })
    } else {
      console.log(`Bracket ${bracketId} has no Challonge match ID - skipping sync`)
    }

    // Note: Bracket generation is now handled by Challonge tournament structure
    // We only record times here - the brackets are pre-generated from Challonge matches
    console.log(
      `Bracket ${bracketId} completed - times recorded, winner determined, sync initiated`
    )
  } catch (error) {
    console.error('Error handling bracket completion:', error)
    // Don't throw - we don't want to fail the timing recording
  }
}

/**
 * Handle times for single race format brackets (legacy)
 */
async function handleSingleBracketTimes(
  client: any,
  bracketId: string,
  track1_time?: number,
  track2_time?: number,
  raceId?: string
) {
  // Update bracket times
  const updates: any = {}
  if (track1_time !== undefined) updates.track1_time = track1_time
  if (track2_time !== undefined) updates.track2_time = track2_time

  const { error } = await client.from('brackets').update(updates).eq('id', bracketId)

  if (error) {
    throw error
  }

  // Get the updated bracket to check if both times are now recorded
  const { data: updatedBracket } = await client
    .from('brackets')
    .select('track1_time, track2_time, winner_racer_id')
    .eq('id', bracketId)
    .single()

  // Check if both times are now recorded and determine winner + generate next round
  if (
    updatedBracket &&
    updatedBracket.track1_time !== null &&
    updatedBracket.track2_time !== null &&
    !updatedBracket.winner_racer_id &&
    raceId
  ) {
    await handleBracketCompletion(client, raceId, bracketId)
  }
}

/**
 * Handle times for best-of-3 format brackets
 */
async function handleBestOf3BracketTimes(
  client: any,
  bracket: any,
  track1_time?: number,
  track2_time?: number
) {
  const currentRound = bracket.current_round || 1

  // Get the current round details
  const { data: roundData, error: roundError } = await client
    .from('bracket_rounds')
    .select('*')
    .eq('bracket_id', bracket.id)
    .eq('round_number', currentRound)
    .single()

  if (roundError || !roundData) {
    throw new Error(`Current round ${currentRound} not found for bracket ${bracket.id}`)
  }

  // Update round times based on track assignments
  const updates: any = {}

  if (track1_time !== undefined) {
    // Find which racer is assigned to track 1 in this round
    if (roundData.racer1_track === 1) {
      updates.racer1_time = track1_time
    } else if (roundData.racer2_track === 1) {
      updates.racer2_time = track1_time
    }
  }

  if (track2_time !== undefined) {
    // Find which racer is assigned to track 2 in this round
    if (roundData.racer1_track === 2) {
      updates.racer1_time = track2_time
    } else if (roundData.racer2_track === 2) {
      updates.racer2_time = track2_time
    }
  }

  if (Object.keys(updates).length === 0) {
    throw new Error('No valid track assignments found for provided times')
  }

  // Update the round with the new times
  const { error: updateError } = await client
    .from('bracket_rounds')
    .update(updates)
    .eq('id', roundData.id)

  if (updateError) {
    throw updateError
  }

  // Get updated round data
  const updatedRound = { ...roundData, ...updates }

  // Check if both times are recorded for this round
  if (updatedRound.racer1_time && updatedRound.racer2_time && !updatedRound.completed_at) {
    await completeBestOf3Round(client, updatedRound)
  }
}

/**
 * Complete a round in best-of-3 format and check for match completion
 */
async function completeBestOf3Round(client: any, roundData: any) {
  // Determine winner of this round
  let winnerRacerId, winnerTrack
  if (roundData.racer1_time < roundData.racer2_time) {
    winnerRacerId = roundData.racer1_id
    winnerTrack = roundData.racer1_track
  } else {
    winnerRacerId = roundData.racer2_id
    winnerTrack = roundData.racer2_track
  }

  // Update round with winner and completion time
  const { error: roundUpdateError } = await client
    .from('bracket_rounds')
    .update({
      winner_racer_id: winnerRacerId,
      winner_track: winnerTrack,
      completed_at: new Date().toISOString()
    })
    .eq('id', roundData.id)

  if (roundUpdateError) {
    throw roundUpdateError
  }

  console.log(`🎯 Round ${roundData.round_number} completed: Winner = ${winnerRacerId}`)

  // The database trigger will automatically update the bracket's win counts and determine overall winner
}

export default defineEventHandler(async (event) => {
  // Validate API key
  await requireTimingAuth(event)

  const client = await createTimingSupabaseClient()
  const body = await readBody(event)

  const { heat_number, track1_time, track2_time, auto_advance = true } = body

  if (!heat_number || typeof heat_number !== 'number') {
    throw createError({
      statusCode: 400,
      statusMessage: 'heat_number is required and must be a number'
    })
  }

  if (!track1_time && !track2_time) {
    throw createError({
      statusCode: 400,
      statusMessage: 'At least one of track1_time or track2_time is required'
    })
  }

  try {
    logTimingRequest(event, 'RECORD_TIMES', {
      heat_number,
      track1_time,
      track2_time,
      auto_advance
    })

    // Get active race with qualifying_mode
    const { data: activeRace } = await client
      .from('races')
      .select('id, qualifying_mode')
      .eq('active', true)
      .single()

    if (!activeRace) {
      throw new Error('No active race found')
    }

    // Determine race phase
    const phase = await getRacePhase(client, activeRace.id)

    // Handle based on phase (heat numbers are now sequential for both qualifiers and brackets)
    if (phase === 'qualifying') {
      // Qualifier heat
      const { error } = await client.rpc('complete_heat', {
        heat_num: heat_number,
        track1_time: track1_time || null,
        track2_time: track2_time || null
      })

      if (error) {
        throw error
      }

      // Auto-generate more heats if in auto mode and running low
      if (activeRace.qualifying_mode === 'auto') {
        // Count upcoming scheduled heats
        const { count: upcomingCount } = await client
          .from('qualifiers')
          .select('id', { count: 'exact', head: true })
          .eq('race_id', activeRace.id)
          .eq('status', 'scheduled')

        console.log(
          `🔍 Auto-gen check: mode=${activeRace.qualifying_mode}, upcoming=${upcomingCount}`
        )

        // If fewer than 3 upcoming heats, generate more (maintains buffer of 2-3 upcoming after current heat starts)
        if (upcomingCount !== null && upcomingCount < 3) {
          try {
            console.log(`🎯 Triggering auto-generation (${upcomingCount} upcoming heats)`)
            await client.rpc('add_qualifier_heats', {
              target_race_id: activeRace.id
            })
            logTimingRequest(event, 'AUTO_GENERATED_HEATS', {
              reason: `Only ${upcomingCount} upcoming heats remaining`
            })
          } catch (genError) {
            // Log but don't fail the request if auto-generation fails
            console.error('❌ Failed to auto-generate heats:', genError)
          }
        }
      }
    } else if (phase === 'brackets') {
      // Bracket heat - find current bracket by sequential position using Challonge ordering
      const { data: brackets } = await client
        .from('brackets')
        .select('id, match_format, current_round, track1_racer_id, track2_racer_id')
        .eq('race_id', activeRace.id)
        .order('challonge_suggested_play_order', { ascending: true, nullsFirst: false })
        .order('challonge_round', { ascending: true })
        .order('match_number', { ascending: true })

      const bracketIndex = heat_number - 1 // Convert heat number to 0-based index
      if (!brackets || !brackets[bracketIndex]) {
        throw new Error(`Bracket not found for heat number ${heat_number}`)
      }

      const bracket = brackets[bracketIndex]

      // Handle different match formats
      if (bracket.match_format === 'best_of_3') {
        await handleBestOf3BracketTimes(client, bracket, track1_time, track2_time)
      } else {
        // Legacy single race format
        await handleSingleBracketTimes(client, bracket.id, track1_time, track2_time, activeRace.id)
      }

      logTimingRequest(event, 'BRACKET_TIMES_RECORDED', {
        bracket_id: bracket.id,
        match_format: bracket.match_format,
        current_round: bracket.current_round,
        track1_time,
        track2_time
      })
    }

    let nextHeatInfo = null

    // If auto_advance is enabled, start the next heat automatically
    if (auto_advance) {
      try {
        const { data: nextHeat } = await client
          .from('qualifiers')
          .select('heat_number')
          .eq(
            'race_id',
            (await client.from('races').select('id').eq('active', true).single()).data?.id
          )
          .eq('status', 'scheduled')
          .order('scheduled_order')
          .limit(1)
          .single()

        if (nextHeat) {
          await client.rpc('start_heat', { heat_num: nextHeat.heat_number })
          nextHeatInfo = nextHeat

          logTimingRequest(event, 'AUTO_START_NEXT_HEAT', {
            completed_heat: heat_number,
            next_heat: nextHeat.heat_number
          })
        }
      } catch (nextHeatError) {
        // Don't fail the main operation if auto-advance fails
        logTimingRequest(event, 'AUTO_ADVANCE_WARNING', {
          heat_number,
          error: 'No next heat available or failed to start'
        })
      }
    }

    logTimingRequest(event, 'RECORD_TIMES_SUCCESS', {
      heat_number,
      track1_time,
      track2_time,
      next_heat_started: !!nextHeatInfo
    })

    return {
      success: true,
      message: `Heat ${heat_number} completed successfully`,
      heat_number,
      times: {
        track1: track1_time,
        track2: track2_time
      },
      next_heat_started: !!nextHeatInfo,
      next_heat_number: nextHeatInfo?.heat_number || null
    }
  } catch (error: any) {
    logTimingRequest(event, 'RECORD_TIMES_ERROR', {
      heat_number,
      track1_time,
      track2_time,
      error: error.message
    })

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to record heat times'
    })
  }
})
