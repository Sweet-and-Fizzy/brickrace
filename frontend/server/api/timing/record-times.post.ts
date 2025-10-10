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
import {
  syncBracketByChallongeMatchId,
  reconcileBracketsFromChallonge
} from '~/server/utils/bracket-generator'
import { challongeApi } from '~/server/utils/challonge-client'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Bracket as BracketRow } from '~/types/database'

/**
 * Handle bracket completion - determine winner and generate next round brackets
 */
async function handleBracketCompletion(client: SupabaseClient, raceId: string, bracketId: string) {
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

    // Determine winner
    let winnerRacerId: string | null = null
    let winnerTrack: 1 | 2 = 1

    if (bracket.track1_time < bracket.track2_time) {
      winnerRacerId = bracket.track1_racer_id
      winnerTrack = 1
    } else {
      winnerRacerId = bracket.track2_racer_id
      winnerTrack = 2
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
          // Non-destructive reconcile: update future matches' participants/order
          const { data: tournament } = await client
            .from('challonge_tournaments')
            .select('id')
            .eq('race_id', raceId)
            .eq('status', 'active')
            .single()
          if (tournament) {
            await reconcileBracketsFromChallonge(client, raceId, tournament.id)
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
  client: SupabaseClient,
  bracketId: string,
  track1_time?: number,
  track2_time?: number,
  raceId?: string
) {
  // Update bracket times
  const updates: Partial<Pick<BracketRow, 'track1_time' | 'track2_time'>> = {}
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
  client: SupabaseClient,
  bracket: Pick<BracketRow, 'id' | 'current_round' | 'track1_racer_id' | 'track2_racer_id'>,
  raceId: string,
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
  const updates: Partial<{ racer1_time: number | null; racer2_time: number | null }> = {}

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

  // Decide round outcome with null semantics (win by non-null, tie if both null)
  if (!updatedRound.completed_at) {
    await completeBestOf3Round(client, updatedRound)

    // After completing a round, compute wins now to avoid relying on async triggers
    try {
      const { data: participants } = await client
        .from('brackets')
        .select(
          'track1_racer_id, track2_racer_id, is_completed, rounds_won_track1, rounds_won_track2'
        )
        .eq('id', bracket.id)
        .single()
      const { data: roundsAll } = await client
        .from('bracket_rounds')
        .select('winner_racer_id, completed_at')
        .eq('bracket_id', bracket.id)

      if (participants && Array.isArray(roundsAll)) {
        const t1 = participants.track1_racer_id
        const t2 = participants.track2_racer_id
        let w1 = 0
        let w2 = 0
        for (const r of roundsAll) {
          if (!r.completed_at || !r.winner_racer_id) continue
          if (t1 && r.winner_racer_id === t1) w1++
          if (t2 && r.winner_racer_id === t2) w2++
        }
        const decided = w1 >= 2 || w2 >= 2
        // Persist if changed or not marked yet
        if (decided && !participants.is_completed) {
          await client
            .from('brackets')
            .update({
              rounds_won_track1: w1,
              rounds_won_track2: w2,
              is_completed: true,
              winner_racer_id: w1 >= 2 ? t1 : t2
            })
            .eq('id', bracket.id)
        } else if (!decided) {
          // Update visible wins even if not completed yet (useful if trigger lagging)
          await client
            .from('brackets')
            .update({ rounds_won_track1: w1, rounds_won_track2: w2 })
            .eq('id', bracket.id)
        }
      }
    } catch (calcErr) {
      console.warn('Failed to compute/persist best-of-3 wins immediately:', calcErr)
    }

    // Now check if match is decided (2 wins)
    const { data: updatedBracket } = await client
      .from('brackets')
      .select(
        'id, rounds_won_track1, rounds_won_track2, is_completed, challonge_match_id, track1_racer_id, track2_racer_id'
      )
      .eq('id', bracket.id)
      .single()

    if (
      updatedBracket &&
      (updatedBracket.is_completed ||
        (updatedBracket.rounds_won_track1 && updatedBracket.rounds_won_track1 >= 2) ||
        (updatedBracket.rounds_won_track2 && updatedBracket.rounds_won_track2 >= 2))
    ) {
      // Sync completed match to Challonge, then regenerate next brackets
      if (updatedBracket.challonge_match_id) {
        try {
          await syncBracketByChallongeMatchId(client, raceId, updatedBracket.challonge_match_id)
          // Non-destructive reconcile of future matches
          const { data: tournament } = await client
            .from('challonge_tournaments')
            .select('id')
            .eq('race_id', raceId)
            .eq('status', 'active')
            .single()
          if (tournament) {
            await reconcileBracketsFromChallonge(client, raceId, tournament.id)
          }
        } catch (e) {
          console.error('Post-round completion sync/regenerate failed:', e)
        }
      }
    } else {
      // Special case: after round 3, if neither racer has any wins, auto-withdraw both
      try {
        const { data: rounds } = await client
          .from('bracket_rounds')
          .select('round_number, winner_racer_id, completed_at')
          .eq('bracket_id', bracket.id)
          .order('round_number')

        const allThreeCompleted =
          Array.isArray(rounds) && rounds.filter((r) => r.completed_at).length >= 3
        const anyWins = Array.isArray(rounds) && rounds.some((r) => r.winner_racer_id)

        if (allThreeCompleted && !anyWins) {
          await handleDoubleNoPointsWithdrawal(client, raceId, {
            bracket_id: bracket.id,
            racer1_id: updatedBracket?.track1_racer_id || null,
            racer2_id: updatedBracket?.track2_racer_id || null
          })
        }
      } catch (e) {
        console.error('Failed double-no-points withdrawal check:', e)
      }
      // Not decided yet; advance bracket.current_round to the next incomplete round
      await advanceBestOf3ToNextRound(client, bracket.id)
    }
  }
}

// Ensure best-of-3 scaffold exists on a bracket (idempotent)
async function ensureBestOf3Scaffold(
  client: SupabaseClient,
  bracket: Pick<
    BracketRow,
    'id' | 'match_format' | 'total_rounds' | 'track1_racer_id' | 'track2_racer_id'
  >
) {
  try {
    // Update bracket flags if needed
    const updates: Partial<{ match_format: string; total_rounds: number }> = {}
    if (bracket.match_format !== 'best_of_3') {
      updates.match_format = 'best_of_3'
    }
    if (!bracket.total_rounds) {
      updates.total_rounds = 3
    }
    // IMPORTANT: Do NOT reset current_round or is_completed here; that caused round resets
    if (Object.keys(updates).length > 0) {
      await client.from('brackets').update(updates).eq('id', bracket.id)
    }

    // Create rounds if missing
    const { count } = await client
      .from('bracket_rounds')
      .select('id', { count: 'exact', head: true })
      .eq('bracket_id', bracket.id)

    if (!count || count === 0) {
      const rounds = [
        {
          bracket_id: bracket.id,
          round_number: 1,
          racer1_id: bracket.track1_racer_id,
          racer2_id: bracket.track2_racer_id,
          racer1_track: 1,
          racer2_track: 2
        },
        {
          bracket_id: bracket.id,
          round_number: 2,
          racer1_id: bracket.track1_racer_id,
          racer2_id: bracket.track2_racer_id,
          racer1_track: 2,
          racer2_track: 1
        },
        {
          bracket_id: bracket.id,
          round_number: 3,
          racer1_id: bracket.track1_racer_id,
          racer2_id: bracket.track2_racer_id,
          racer1_track: 1,
          racer2_track: 2
        }
      ]
      await client.from('bracket_rounds').insert(rounds)
    }
  } catch (e) {
    console.error('Failed to ensure best-of-3 scaffold:', e)
  }
}

/**
 * Complete a round in best-of-3 format and check for match completion
 */
async function completeBestOf3Round(
  client: SupabaseClient,
  roundData: {
    id: string
    bracket_id: string
    round_number: number
    racer1_id: string
    racer2_id: string
    racer1_track: 1 | 2
    racer2_track: 1 | 2
    racer1_time: number | string | null
    racer2_time: number | string | null
  }
) {
  // Determine winner with null semantics: non-null wins; both null => tie
  const hasT1 = roundData.racer1_time !== null && roundData.racer1_time !== undefined
  const hasT2 = roundData.racer2_time !== null && roundData.racer2_time !== undefined
  let winnerIsRacer1: boolean | null = null
  if (hasT1 && hasT2) {
    const t1 = Number(roundData.racer1_time)
    const t2 = Number(roundData.racer2_time)
    winnerIsRacer1 = t1 < t2
  } else if (hasT1 && !hasT2) {
    winnerIsRacer1 = true
  } else if (!hasT1 && hasT2) {
    winnerIsRacer1 = false
  } else {
    winnerIsRacer1 = null // tie
  }

  // Fetch current bracket participants to avoid relying on possibly-null round racer ids
  const { data: br, error: brErr } = await client
    .from('brackets')
    .select('track1_racer_id, track2_racer_id')
    .eq('id', roundData.bracket_id)
    .single()
  if (brErr) throw brErr

  // Backfill round participants if missing (idempotent)
  try {
    if (!roundData.racer1_id && br?.track1_racer_id) {
      await client
        .from('bracket_rounds')
        .update({ racer1_id: br.track1_racer_id })
        .eq('id', roundData.id)
        .is('racer1_id', null)
    }
    if (!roundData.racer2_id && br?.track2_racer_id) {
      await client
        .from('bracket_rounds')
        .update({ racer2_id: br.track2_racer_id })
        .eq('id', roundData.id)
        .is('racer2_id', null)
    }
  } catch (e) {
    console.warn('Unable to backfill round participant ids (non-fatal):', e)
  }

  let roundUpdateError: unknown = null
  if (winnerIsRacer1 === null) {
    // Tie: mark round completed without winner
    const res = await client
      .from('bracket_rounds')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', roundData.id)
    roundUpdateError = res.error
  } else {
    // Winner racer id comes from the round slot winner; winnerTrack is the physical track for logging only
    const winnerRacerId = winnerIsRacer1
      ? roundData.racer1_id || br?.track1_racer_id
      : roundData.racer2_id || br?.track2_racer_id
    const winnerTrack: 1 | 2 = winnerIsRacer1 ? roundData.racer1_track : roundData.racer2_track

    // Update round with winner and completion time
    const res = await client
      .from('bracket_rounds')
      .update({
        winner_racer_id: winnerRacerId,
        winner_track: winnerTrack,
        completed_at: new Date().toISOString()
      })
      .eq('id', roundData.id)
    roundUpdateError = res.error
  }

  if (roundUpdateError) {
    throw roundUpdateError
  }

  console.log(
    `🎯 Round ${roundData.round_number} completed: ${
      winnerIsRacer1 === null
        ? 'Tie (no winner)'
        : `Winner = ${
            winnerIsRacer1
              ? roundData.racer1_id || br?.track1_racer_id
              : roundData.racer2_id || br?.track2_racer_id
          }`
    }`
  )

  // The database trigger will automatically update the bracket's win counts and determine overall winner
}

// After completing a round, advance the bracket to the next incomplete round
async function advanceBestOf3ToNextRound(client: SupabaseClient, bracketId: string): Promise<void> {
  try {
    const { data: nextRounds } = await client
      .from('bracket_rounds')
      .select('round_number')
      .eq('bracket_id', bracketId)
      .is('completed_at', null)
      .order('round_number', { ascending: true })
      .limit(1)

    const nextRound = Array.isArray(nextRounds) && nextRounds.length > 0 ? nextRounds[0] : null
    if (nextRound?.round_number) {
      await client
        .from('brackets')
        .update({ current_round: nextRound.round_number })
        .eq('id', bracketId)
    }
  } catch (e) {
    console.error('Failed to advance to next round:', e)
  }
}

// When both racers fail to score any points after 3 rounds, withdraw both from tournament
async function handleDoubleNoPointsWithdrawal(
  client: SupabaseClient,
  raceId: string,
  params: { bracket_id: string; racer1_id: string | null; racer2_id: string | null }
): Promise<void> {
  try {
    const r1 = params.racer1_id
    const r2 = params.racer2_id
    if (!r1 && !r2) return

    console.warn(
      `Double no-points detected on bracket ${params.bracket_id}. Withdrawing racer(s):`,
      [r1, r2].filter(Boolean)
    )

    const reason = 'Both racers failed to score in best-of-3 match'

    // Upsert withdrawal records (without withdrawn_by since timing API is system)
    const rows = [r1, r2]
      .filter((id): id is string => Boolean(id))
      .map((id) => ({ race_id: raceId, racer_id: id, reason }))
    if (rows.length > 0) {
      await client.from('race_withdrawals').upsert(rows)
    }

    // Delete participants from Challonge to keep bracket in sync
    try {
      const { data: tournament } = await client
        .from('challonge_tournaments')
        .select('id, challonge_tournament_id')
        .eq('race_id', raceId)
        .eq('status', 'active')
        .single()

      if (tournament) {
        const { data: participantMap } = await client
          .from('challonge_participants')
          .select('racer_id, challonge_participant_id')
          .eq('challonge_tournament_id', tournament.id)
          .in(
            'racer_id',
            rows.map((r) => r.racer_id)
          )

        for (const rec of participantMap || []) {
          try {
            await challongeApi.deleteParticipant(
              tournament.challonge_tournament_id,
              rec.challonge_participant_id
            )
          } catch (delErr) {
            console.error('Failed to delete participant from Challonge:', delErr)
          }
        }
      }
    } catch (chErr) {
      console.error('Challonge participant cleanup error:', chErr)
    }

    // Invoke DB routine to forfeit all remaining matches for each racer
    for (const id of [r1, r2]) {
      if (!id) continue
      try {
        await client.rpc('handle_racer_withdrawal', {
          target_race_id: raceId,
          target_racer_id: id
        })
      } catch (wErr) {
        console.error('handle_racer_withdrawal error:', wErr)
      }
    }

    // Mark current bracket as forfeited with no winner
    try {
      await client
        .from('brackets')
        .update({
          is_forfeit: true,
          forfeit_reason: reason,
          is_completed: true,
          winner_racer_id: null
        })
        .eq('id', params.bracket_id)
    } catch (bErr) {
      console.error('Failed to mark bracket as forfeited:', bErr)
    }

    // Reconcile from Challonge to update downstream matches/participants
    try {
      const { data: tournament } = await client
        .from('challonge_tournaments')
        .select('id')
        .eq('race_id', raceId)
        .eq('status', 'active')
        .single()
      if (tournament) {
        await reconcileBracketsFromChallonge(client, raceId, tournament.id)
      }
    } catch (recErr) {
      console.error('Reconcile after double withdrawal failed:', recErr)
    }
  } catch (err) {
    console.error('Double no-points withdrawal failed:', err)
  }
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

  // Allow null to be explicitly provided; only reject when both values are truly undefined
  if (typeof track1_time === 'undefined' && typeof track2_time === 'undefined') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Provide track1_time and/or track2_time (numbers or nulls).'
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
    let nextHeatNumber: number | null = null
    let nextHeatStarted = false

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

      // Only auto-advance in qualifying
      if (auto_advance) {
        try {
          const { data: nextHeat } = await client
            .from('qualifiers')
            .select('heat_number')
            .eq('race_id', activeRace.id)
            .eq('status', 'scheduled')
            .order('scheduled_order')
            .limit(1)
            .single()

          if (nextHeat) {
            await client.rpc('start_heat', { heat_num: nextHeat.heat_number })
            nextHeatNumber = nextHeat.heat_number
            nextHeatStarted = true
            logTimingRequest(event, 'AUTO_START_NEXT_HEAT', {
              completed_heat: heat_number,
              next_heat: nextHeat.heat_number
            })
          }
        } catch (e) {
          const detail = e instanceof Error ? e.message : String(e)
          logTimingRequest(event, 'AUTO_ADVANCE_WARNING', {
            heat_number,
            error: 'No next qualifier heat available or failed to start',
            detail
          })
        }
      }
    } else if (phase === 'brackets') {
      // Bracket heat - find current bracket by sequential position using Challonge ordering
      const { data: brackets } = await client
        .from('brackets')
        .select(
          'id, match_format, total_rounds, current_round, is_completed, rounds_won_track1, rounds_won_track2, winner_racer_id, track1_racer_id, track2_racer_id'
        )
        .eq('race_id', activeRace.id)
        .order('challonge_suggested_play_order', { ascending: true, nullsFirst: false })
        .order('challonge_round', { ascending: true })
        .order('match_number', { ascending: true })

      let bracketIndex = heat_number - 1 // Convert heat number to 0-based index
      if (!brackets || brackets.length === 0) {
        throw new Error('No brackets found for active race')
      }

      // Helper to determine if bracket is complete - simply check if it has a winner
      const isComplete = (
        b: Pick<
          BracketRow,
          | 'match_format'
          | 'is_completed'
          | 'rounds_won_track1'
          | 'rounds_won_track2'
          | 'winner_racer_id'
        >
      ) => {
        return Boolean(b.winner_racer_id)
      }

      // If provided heat_number points to a completed bracket, or is out of range, redirect to next incomplete bracket
      let targetIndex: number | null = null
      if (
        bracketIndex >= 0 &&
        bracketIndex < brackets.length &&
        !isComplete(brackets[bracketIndex])
      ) {
        targetIndex = bracketIndex
      } else {
        // Find the first incomplete bracket at or after the hinted index
        for (let i = Math.max(0, bracketIndex); i < brackets.length; i++) {
          if (!isComplete(brackets[i])) {
            targetIndex = i
            break
          }
        }
        // If none ahead, try from the beginning
        if (targetIndex === null) {
          for (let i = 0; i < brackets.length; i++) {
            if (!isComplete(brackets[i])) {
              targetIndex = i
              break
            }
          }
        }
      }

      if (targetIndex === null) {
        // Tournament appears complete; no-op but respond gracefully
        logTimingRequest(event, 'BRACKETS_COMPLETE_OR_NO_NEXT', { submitted_heat: heat_number })
        return {
          success: true,
          message: `No remaining brackets to record. Submission ignored.`,
          heat_number,
          times: { track1: track1_time, track2: track2_time },
          next_heat_started: false,
          next_heat_number: null
        }
      }

      bracketIndex = targetIndex
      const bracket = brackets[bracketIndex]

      // Ensure best-of-3 structure exists (idempotent)
      await ensureBestOf3Scaffold(client, bracket)
      // Refresh bracket flags after potential update
      const { data: refreshed } = await client
        .from('brackets')
        .select(
          'id, match_format, total_rounds, current_round, is_completed, track1_racer_id, track2_racer_id'
        )
        .eq('id', bracket.id)
        .single()

      // Handle different match formats
      if (refreshed?.match_format === 'best_of_3') {
        await handleBestOf3BracketTimes(client, refreshed, activeRace.id, track1_time, track2_time)
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

      // Compute next_heat_number mapping for bracket mode
      try {
        // Refresh this bracket state to evaluate completion
        const { data: updatedBracket } = await client
          .from('brackets')
          .select(
            'id, match_format, is_completed, winner_racer_id, rounds_won_track1, rounds_won_track2'
          )
          .eq('id', bracket.id)
          .single()

        // A match is complete if it has a winner (regardless of how it was determined)
        const isMatchComplete = Boolean(updatedBracket?.winner_racer_id)

        if (!isMatchComplete) {
          // Stay on the same bracket until the match is complete
          nextHeatNumber = heat_number
        } else {
          // Find next incomplete bracket in ordered list
          const { data: ordered } = await client
            .from('brackets')
            .select(
              'id, match_format, is_completed, winner_racer_id, rounds_won_track1, rounds_won_track2'
            )
            .eq('race_id', activeRace.id)
            .order('challonge_suggested_play_order', { ascending: true, nullsFirst: false })
            .order('challonge_round', { ascending: true })
            .order('match_number', { ascending: true })

          if (ordered && ordered.length > 0) {
            let foundIndex: number | null = null
            for (let i = bracketIndex + 1; i < ordered.length; i++) {
              const b = ordered[i]
              // A bracket is complete if it has a winner
              const bComplete = Boolean(b.winner_racer_id)
              if (!bComplete) {
                foundIndex = i
                break
              }
            }
            nextHeatNumber = foundIndex !== null ? foundIndex + 1 : null
          } else {
            nextHeatNumber = null
          }
        }
      } catch (e) {
        console.error('Failed to compute next bracket heat number:', e)
        nextHeatNumber = null
      }
    }

    logTimingRequest(event, 'RECORD_TIMES_SUCCESS', {
      heat_number,
      track1_time,
      track2_time,
      next_heat_started: nextHeatStarted,
      next_heat_number: nextHeatNumber
    })

    return {
      success: true,
      message: `Heat ${heat_number} completed successfully`,
      heat_number,
      times: {
        track1: track1_time,
        track2: track2_time
      },
      next_heat_started: nextHeatStarted,
      next_heat_number: nextHeatNumber
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    logTimingRequest(event, 'RECORD_TIMES_ERROR', {
      heat_number,
      track1_time,
      track2_time,
      error: message
    })

    throw createError({
      statusCode: 500,
      statusMessage: message || 'Failed to record heat times'
    })
  }
})
