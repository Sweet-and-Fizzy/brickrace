/* eslint-disable @typescript-eslint/no-explicit-any */
// Automatic sync utility for internal brackets to Challonge tournaments
import { challongeApi } from './challonge-client'
import type { ChallongeApiMatch } from './challonge-client'
// Note: We accept a loosely-typed Supabase client here to interop with Nuxt's serverSupabaseClient

interface BracketMatch {
  id: string
  race_id: string
  track1_racer_id?: string
  track2_racer_id?: string
  track1_time?: number
  track2_time?: number
  bracket_type: string
  bracket_group?: string
  round_number?: number
  match_number?: number
  winner_racer_id?: string
  winner_track?: number
}

// Commented out - not currently used
// interface ChallongeMatch {
//   id: number
//   tournament_id: number
//   state: string
//   player1_id: number | null
//   player2_id: number | null
//   winner_id: number | null
//   round: number
// }

interface ParticipantMapping {
  racer_id: string
  challonge_participant_id: string
}

/**
 * Sync a completed bracket result to its corresponding Challonge match
 */
export async function syncBracketToChallonge(
  client: any,
  raceId: string,
  bracketId: string
): Promise<void> {
  try {
    const c: any = client
    console.log(`Starting Challonge sync for bracket ${bracketId}`)

    // Check if this bracket has already been synced
    const { data: existingSync } = await c
      .from('challonge_match_sync')
      .select('id, synced_at')
      .eq('bracket_id', bracketId)
      .single()

    if (existingSync) {
      console.log(`Bracket ${bracketId} already synced at ${existingSync.synced_at}`)
      return
    }

    // Get tournament for this race
    const { data: tournament } = await c
      .from('challonge_tournaments')
      .select('*')
      .eq('race_id', raceId)
      .eq('status', 'active')
      .single()

    if (!tournament) {
      console.log('No active Challonge tournament found for race:', raceId)
      return
    }

    // Get the completed bracket with full details
    const { data: bracket } = await c
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

    if (!bracket) {
      console.log('Bracket not found')
      return
    }

    // Check if bracket is ready for sync based on format
    let isReadyForSync = false
    let scoresCsv = ''
    let winnerRacerId = ''

    if (bracket.match_format === 'best_of_3') {
      // For best-of-3, check if overall match is complete
      if (bracket.is_completed && bracket.winner_racer_id) {
        isReadyForSync = true
        winnerRacerId = bracket.winner_racer_id

        // Create scores in format "rounds_won_player1-rounds_won_player2"
        const player1Wins = bracket.rounds_won_track1 || 0
        const player2Wins = bracket.rounds_won_track2 || 0
        scoresCsv = `${player1Wins}-${player2Wins}`
      }
    } else {
      // Legacy single race format
      if (bracket.track1_time && bracket.track2_time) {
        isReadyForSync = true
        const isTrack1Winner = bracket.track1_time < bracket.track2_time
        winnerRacerId = isTrack1Winner ? bracket.track1_racer_id : bracket.track2_racer_id
        scoresCsv = `${bracket.track1_time.toFixed(3)}-${bracket.track2_time.toFixed(3)}`
      }
    }

    if (!isReadyForSync) {
      console.log('Bracket not ready for sync - match not complete')
      return
    }

    // Get participant mappings to convert racer IDs to Challonge participant IDs
    const { data: participants } = await c
      .from('challonge_participants')
      .select('racer_id, challonge_participant_id')
      .eq('challonge_tournament_id', tournament.id)

    if (!participants || participants.length === 0) {
      console.log('No participant mappings found for tournament')
      return
    }

    const participantMap = new Map<string, string>(
      participants.map((p: ParticipantMapping) => [p.racer_id, p.challonge_participant_id])
    )

    // Get Challonge matches for this tournament
    const challongeMatches = await challongeApi.getMatches(tournament.challonge_tournament_id)

    // Find the matching Challonge match for this bracket
    const matchingMatch = findMatchingChallongeMatch(bracket, challongeMatches, participantMap)

    if (!matchingMatch) {
      console.log('No matching Challonge match found for bracket:', bracketId)
      return
    }

    // Get winner's Challonge participant ID
    const winnerChallongeId = participantMap.get(winnerRacerId)

    if (!winnerChallongeId) {
      console.log('Winner participant mapping not found for racer:', winnerRacerId)
      return
    }

    // Update the Challonge match (this will also advance winners on Challonge)
    await challongeApi.updateMatch(
      tournament.challonge_tournament_id,
      matchingMatch.match.id.toString(),
      {
        scores_csv: scoresCsv,
        winner_id: Number.parseInt(winnerChallongeId as string)
      }
    )

    console.log(
      `Successfully synced bracket ${bracketId} to Challonge match ${matchingMatch.match.id}`
    )
    console.log(`Winner: ${winnerChallongeId}, Scores: ${scoresCsv}`)

    // Store sync record for tracking
    await c.from('challonge_match_sync').upsert(
      {
        bracket_id: bracketId,
        challonge_tournament_id: tournament.id,
        challonge_match_id: matchingMatch.match.id.toString(),
        synced_at: new Date().toISOString(),
        winner_participant_id: winnerChallongeId,
        scores_csv: scoresCsv
      },
      {
        onConflict: 'bracket_id'
      }
    )

    // After reporting the result, refresh upcoming Challonge assignments into internal brackets
    await refreshUpcomingParticipants(c, tournament.id)
  } catch (error) {
    console.error('Error syncing bracket to Challonge:', error)
    // Don't throw - we don't want to fail the timing operation
  }
}

/**
 * Find the matching Challonge match for an internal bracket
 */
function findMatchingChallongeMatch(
  bracket: BracketMatch,
  challongeMatches: ChallongeApiMatch[],
  participantMap: Map<string, string>
): ChallongeApiMatch | null {
  const track1ChallongeId = bracket.track1_racer_id
    ? participantMap.get(bracket.track1_racer_id)
    : null
  const track2ChallongeId = bracket.track2_racer_id
    ? participantMap.get(bracket.track2_racer_id)
    : null

  if (!track1ChallongeId || !track2ChallongeId) {
    return null
  }

  // Find a match where both participants match (regardless of which side they're on)
  const found = challongeMatches.find((match) => {
    const player1 = match.match.player1_id?.toString()
    const player2 = match.match.player2_id?.toString()

    return (
      (player1 === track1ChallongeId && player2 === track2ChallongeId) ||
      (player1 === track2ChallongeId && player2 === track1ChallongeId)
    )
  })
  return found ?? null
}

/**
 * Sync all completed brackets for a race to Challonge
 * Useful for bulk sync or recovery scenarios
 */
export async function syncAllBracketsToChallonge(client: any, raceId: string): Promise<void> {
  try {
    const c: any = client
    console.log(`Starting bulk sync for race ${raceId}`)

    // Get all completed brackets for this race
    // Consider a bracket ready if either legacy single (both times present) or best-of-3 completed
    const { data: completedBrackets } = await c
      .from('brackets')
      .select('id')
      .eq('race_id', raceId)
      .or(
        'is_completed.eq.true,and(track1_time.not.is.null,track2_time.not.is.null),winner_racer_id.not.is.null'
      )

    if (!completedBrackets || completedBrackets.length === 0) {
      console.log('No completed brackets found for race')
      return
    }

    console.log(`Found ${completedBrackets.length} completed brackets to sync`)

    // Sync each bracket
    for (const bracket of completedBrackets) {
      await syncBracketToChallonge(c, raceId, bracket.id)
      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    console.log(`Bulk sync completed for race ${raceId}`)

    // Also refresh upcoming participants based on latest Challonge bracket state
    const { data: tournament } = await c
      .from('challonge_tournaments')
      .select('id')
      .eq('race_id', raceId)
      .eq('status', 'active')
      .single()
    if (tournament) {
      await refreshUpcomingParticipants(c, tournament.id)
    }
  } catch (error) {
    console.error('Error in bulk sync:', error)
    throw error
  }
}

/**
 * Refresh internal brackets' participant slots (track1/track2) from Challonge matches
 * so that next matches are populated once Challonge advances them.
 */
export async function refreshUpcomingParticipants(
  client: any,
  tournamentId: string
): Promise<void> {
  try {
    const c: any = client
    // Load tournament external ID
    const { data: tournament } = await c
      .from('challonge_tournaments')
      .select('id, challonge_tournament_id')
      .eq('id', tournamentId)
      .single()
    if (!tournament) return

    // Fetch all matches and participant mapping
    const matches = await challongeApi.getMatches(tournament.challonge_tournament_id)
    const { data: mappings } = await c
      .from('challonge_participants')
      .select('challonge_participant_id, racer_id')
      .eq('challonge_tournament_id', tournamentId)

    const participantToRacer = new Map<string, string>(
      (mappings || []).map((m: { challonge_participant_id: string | number; racer_id: string }) => [
        m.challonge_participant_id.toString(),
        m.racer_id
      ])
    )

    // Pre-compute Challonge natural order (or suggested_play_order if present)
    const orderById = new Map<string, number>()
    matches.forEach((mm: any, idx: number) => {
      const mid = mm.match.id.toString()
      const spo = (mm.match as any).suggested_play_order
      orderById.set(mid, typeof spo === 'number' && spo > 0 ? spo : idx + 1)
    })

    // For each match, ensure our bracket row has correct racer assignments and match_number
    for (const m of matches) {
      const match = m.match
      const challongeMatchId = match.id.toString()

      // Find internal bracket row by challonge_match_id
      const { data: bracket } = await c
        .from('brackets')
        .select('id, track1_racer_id, track2_racer_id')
        .eq('challonge_match_id', challongeMatchId)
        .single()

      if (!bracket) continue

      const track1RacerId = match.player1_id
        ? participantToRacer.get(match.player1_id.toString()) || null
        : null
      const track2RacerId = match.player2_id
        ? participantToRacer.get(match.player2_id.toString()) || null
        : null

      // Build updates: participant slots and match_number if missing/misaligned
      const updates: any = {}
      if (
        (track1RacerId && track1RacerId !== bracket.track1_racer_id) ||
        (track2RacerId && track2RacerId !== bracket.track2_racer_id)
      ) {
        updates.track1_racer_id = track1RacerId
        updates.track2_racer_id = track2RacerId
      }

      const desiredOrder = orderById.get(challongeMatchId) || null
      if (desiredOrder && (!('match_number' in bracket) || bracket.match_number !== desiredOrder)) {
        updates.match_number = desiredOrder
      }

      if (Object.keys(updates).length > 0) {
        await c.from('brackets').update(updates).eq('id', bracket.id)
      }

      // Ensure best-of-3 bracket rounds exist when both participants are known
      if (track1RacerId && track2RacerId) {
        const { data: fullBracket } = await c
          .from('brackets')
          .select('id, match_format')
          .eq('id', bracket.id)
          .single()

        if (fullBracket && fullBracket.match_format === 'best_of_3') {
          const { data: existingRounds } = await c
            .from('bracket_rounds')
            .select('id')
            .eq('bracket_id', bracket.id)
            .limit(1)

          if (!existingRounds || existingRounds.length === 0) {
            await c.from('bracket_rounds').insert([
              {
                bracket_id: bracket.id,
                round_number: 1,
                racer1_id: track1RacerId,
                racer2_id: track2RacerId,
                racer1_track: 1,
                racer2_track: 2
              },
              {
                bracket_id: bracket.id,
                round_number: 2,
                racer1_id: track1RacerId,
                racer2_id: track2RacerId,
                racer1_track: 2,
                racer2_track: 1
              },
              {
                bracket_id: bracket.id,
                round_number: 3,
                racer1_id: track1RacerId,
                racer2_id: track2RacerId,
                racer1_track: 1,
                racer2_track: 2
              }
            ])
          }
        }
      }
    }
  } catch (err) {
    console.error('Error refreshing upcoming participants from Challonge:', err)
    // non-fatal
  }
}

/**
 * Seed internal brackets from Challonge matches for a race.
 */
export async function seedBracketsFromChallonge(client: any, raceId: string): Promise<void> {
  try {
    const c: any = client

    const { data: tournament } = await c
      .from('challonge_tournaments')
      .select('id, challonge_tournament_id, status')
      .eq('race_id', raceId)
      .eq('status', 'active')
      .single()

    if (!tournament) return

    const matches = await challongeApi.getMatches(tournament.challonge_tournament_id)

    const { data: existing } = await c
      .from('brackets')
      .select('id, challonge_match_id')
      .eq('race_id', raceId)

    const existingSet = new Set<string>((existing || []).map((b: any) => b.challonge_match_id))

    const toInsert: any[] = []
    matches.forEach((m: any, idx: number) => {
      const match = m.match
      const challongeMatchId = match.id.toString()
      if (existingSet.has(challongeMatchId)) return

      const group = match.round < 0 ? 'loser' : 'winner'
      const roundNumber = Math.abs(match.round)
      const suggestedOrder = (match as any).suggested_play_order
      const matchNumber =
        typeof suggestedOrder === 'number' && suggestedOrder > 0 ? suggestedOrder : idx + 1

      toInsert.push({
        race_id: raceId,
        bracket_type: 'double_elimination',
        bracket_group: group,
        round_number: roundNumber,
        match_number: matchNumber,
        match_format: 'best_of_3',
        total_rounds: 3,
        current_round: 1,
        challonge_match_id: challongeMatchId,
        challonge_round: match.round
      })
    })

    if (toInsert.length > 0) {
      await c.from('brackets').insert(toInsert)
    }
  } catch (err) {
    console.error('Error seeding brackets from Challonge:', err)
  }
}
