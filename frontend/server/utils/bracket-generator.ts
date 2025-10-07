// Generate internal brackets based on Challonge tournament structure
import { challongeApi } from './challonge-client'
import type { SupabaseClient } from '@supabase/supabase-js'

interface ChallongeMatchData {
  id: number
  tournament_id: number
  state: string
  player1_id: number | null
  player2_id: number | null
  winner_id: number | null
  loser_id: number | null
  started_at: string | null
  completed_at: string | null
  round: number
  suggested_play_order?: number
  scores_csv?: string
}

interface ChallongeMatchRecord {
  match: ChallongeMatchData
}

interface ParticipantMapping {
  challonge_participant_id: string
  racer_id: string
}

/**
 * Generate brackets from Challonge tournament structure
 * This replaces any existing brackets with ones that match Challonge exactly
 */
export async function generateBracketsFromChallonge(
  client: SupabaseClient,
  raceId: string,
  tournamentId: string
): Promise<{
  bracketsGenerated: number
  tournamentStructure: {
    totalMatches: number
    winnerBracketMatches: number
    loserBracketMatches: number
    finalMatches: number
  }
}> {
  try {
    console.log(`Generating brackets from Challonge for tournament ${tournamentId}`)

    // Get tournament info
    const { data: tournament } = await client
      .from('challonge_tournaments')
      .select('challonge_tournament_id, tournament_type')
      .eq('id', tournamentId)
      .single()

    if (!tournament) {
      throw new Error('Tournament not found')
    }

    // Get Challonge matches
    const challongeMatches = (await challongeApi.getMatches(
      tournament.challonge_tournament_id
    )) as ChallongeMatchRecord[]

    if (!challongeMatches || challongeMatches.length === 0) {
      throw new Error('No matches found in Challonge tournament')
    }

    // Debug: Log the Challonge match structure
    console.log('=== CHALLONGE MATCH STRUCTURE DEBUG ===')
    challongeMatches.forEach((m: ChallongeMatchRecord, i: number) => {
      const match = m.match
      console.log(
        `Match ${i + 1}: ID=${match.id}, Round=${match.round}, Player1=${match.player1_id}, Player2=${match.player2_id}`
      )
    })
    console.log('=== END DEBUG ===')

    // Get participant mappings
    const { data: participants } = await client
      .from('challonge_participants')
      .select('challonge_participant_id, racer_id')
      .eq('challonge_tournament_id', tournamentId)

    if (!participants || participants.length === 0) {
      throw new Error('No participant mappings found')
    }

    const participantMap = new Map<string, string>()
    participants.forEach((p: ParticipantMapping) => {
      participantMap.set(p.challonge_participant_id, p.racer_id)
    })

    // Clear existing brackets for this race
    console.log(`Clearing existing brackets for race ${raceId}`)
    await client.from('brackets').delete().eq('race_id', raceId)

    // Generate internal brackets from Challonge matches
    const newBrackets = []
    let matchNumber = 1

    // Sort matches by suggested play order (if available) or by round then ID
    const sortedMatches = challongeMatches.sort(
      (a: ChallongeMatchRecord, b: ChallongeMatchRecord) => {
        const matchA = a.match
        const matchB = b.match

        // Use suggested_play_order if available
        if (matchA.suggested_play_order && matchB.suggested_play_order) {
          return matchA.suggested_play_order - matchB.suggested_play_order
        }

        // Fall back to round then ID
        if (matchA.round !== matchB.round) {
          return matchA.round - matchB.round
        }

        return matchA.id - matchB.id
      }
    )

    for (const challongeMatch of sortedMatches) {
      const match = challongeMatch.match as ChallongeMatchData

      // Map Challonge participant IDs to racer IDs
      const track1RacerId = match.player1_id
        ? participantMap.get(match.player1_id.toString())
        : null
      const track2RacerId = match.player2_id
        ? participantMap.get(match.player2_id.toString())
        : null

      // Determine bracket group based on Challonge round structure
      let bracketGroup = 'winner'

      if (match.round < 0) {
        // Negative rounds are loser bracket
        bracketGroup = 'loser'
      } else if (match.round > 0) {
        // Positive rounds are winner bracket
        bracketGroup = 'winner'

        // For double elimination, determine if this is a championship final
        if (tournament.tournament_type === 'double_elimination') {
          // Find the highest round number in the tournament
          const maxRound = Math.max(
            ...sortedMatches.map((m: ChallongeMatchRecord) => m.match.round)
          )

          // The championship final is typically the highest round
          // AND there should be only 1 match in that round
          const finalRoundMatches = sortedMatches.filter(
            (m: ChallongeMatchRecord) => m.match.round === maxRound
          )

          if (match.round === maxRound && finalRoundMatches.length === 1) {
            bracketGroup = 'final'
          }
        }
      }

      // Convert Challonge round to internal round number
      // Challonge uses negative rounds for loser bracket, positive for winner bracket
      let internalRound: number
      if (match.round < 0) {
        // Loser bracket: -1 = round 1, -2 = round 2, etc.
        internalRound = Math.abs(match.round)
      } else {
        // Winner bracket: 1 = round 1, 2 = round 2, etc.
        internalRound = match.round
      }

      // Check if this match is already completed in Challonge
      let winnerRacerId = null
      let winnerTrack = null
      let track1Time = null
      let track2Time = null

      if (match.state === 'complete' && match.winner_id) {
        // Map Challonge winner to our racer
        winnerRacerId = participantMap.get(match.winner_id.toString())

        // Determine which track won
        if (match.winner_id === match.player1_id) {
          winnerTrack = 1
        } else if (match.winner_id === match.player2_id) {
          winnerTrack = 2
        }

        // Try to parse scores if available (format: "score1-score2")
        if (match.scores_csv) {
          const scores = match.scores_csv.split('-').map((s: string) => Number.parseFloat(s.trim()))
          if (scores.length === 2 && !Number.isNaN(scores[0]) && !Number.isNaN(scores[1])) {
            track1Time = scores[0]
            track2Time = scores[1]
          }
        }

        console.log(
          `Importing completed match ${match.id}: Winner=${winnerRacerId}, Track=${winnerTrack}, Scores=${match.scores_csv}`
        )
      }

      const bracket = {
        race_id: raceId,
        track1_racer_id: track1RacerId,
        track2_racer_id: track2RacerId,
        bracket_type: tournament.tournament_type,
        bracket_group: bracketGroup,
        round_number: internalRound,
        match_number: matchNumber,
        challonge_match_id: match.id.toString(),
        challonge_round: match.round,
        challonge_suggested_play_order: match.suggested_play_order || null,
        // Import existing results from Challonge or initialize as null
        track1_time: track1Time,
        track2_time: track2Time,
        winner_racer_id: winnerRacerId,
        winner_track: winnerTrack
      }

      console.log(
        `Creating bracket: Challonge Round ${match.round} -> Internal Round ${internalRound}, Group: ${bracketGroup}, Match: ${matchNumber}`
      )
      matchNumber++
      newBrackets.push(bracket)
    }

    // Insert new brackets
    if (newBrackets.length > 0) {
      const { error: insertError } = await client.from('brackets').insert(newBrackets)

      if (insertError) {
        console.error('Error inserting generated brackets:', insertError)
        throw insertError
      }

      console.log(`Generated ${newBrackets.length} brackets from Challonge tournament`)
    }

    // Fetch inserted brackets to add best-of-3 round scaffolding
    const { data: insertedBrackets } = await client
      .from('brackets')
      .select('id, track1_racer_id, track2_racer_id')
      .eq('race_id', raceId)

    if (insertedBrackets && insertedBrackets.length > 0) {
      for (const b of insertedBrackets) {
        // Set match to best-of-3 with defaults if not already configured
        await client
          .from('brackets')
          .update({
            match_format: 'best_of_3',
            total_rounds: 3,
            current_round: 1,
            is_completed: false
          })
          .eq('id', b.id)

        // Check if rounds already exist to prevent duplicates
        const { count: existingRounds } = await client
          .from('bracket_rounds')
          .select('id', { count: 'exact', head: true })
          .eq('bracket_id', b.id)

        if (!existingRounds || existingRounds === 0) {
          // Create 3 rounds with track switching (R1: 1 vs 2, R2: 2 vs 1, R3: 1 vs 2)
          const rounds = [
            {
              bracket_id: b.id,
              round_number: 1,
              racer1_id: b.track1_racer_id,
              racer2_id: b.track2_racer_id,
              racer1_track: 1,
              racer2_track: 2
            },
            {
              bracket_id: b.id,
              round_number: 2,
              racer1_id: b.track1_racer_id,
              racer2_id: b.track2_racer_id,
              racer1_track: 2,
              racer2_track: 1
            },
            {
              bracket_id: b.id,
              round_number: 3,
              racer1_id: b.track1_racer_id,
              racer2_id: b.track2_racer_id,
              racer1_track: 1,
              racer2_track: 2
            }
          ]

          const { error: roundsInsertError } = await client.from('bracket_rounds').insert(rounds)

          if (roundsInsertError) {
            console.error('Error creating bracket rounds:', roundsInsertError)
            throw roundsInsertError
          }
        }
      }
    }

    return {
      bracketsGenerated: newBrackets.length,
      tournamentStructure: {
        totalMatches: challongeMatches.length,
        winnerBracketMatches: challongeMatches.filter(
          (m: ChallongeMatchRecord) => m.match.round > 0
        ).length,
        loserBracketMatches: challongeMatches.filter((m: ChallongeMatchRecord) => m.match.round < 0)
          .length,
        finalMatches: challongeMatches.filter((m: ChallongeMatchRecord) => m.match.round === 1)
          .length
      }
    }
  } catch (error) {
    console.error('Error generating brackets from Challonge:', error)
    throw error
  }
}

/**
 * Update sync utility to use Challonge match ID for perfect mapping
 */
export async function syncBracketByChallongeMatchId(
  client: SupabaseClient,
  raceId: string,
  challongeMatchId: string
): Promise<void> {
  try {
    console.log(`Syncing bracket by Challonge match ID: ${challongeMatchId}`)

    // Get the bracket that corresponds to this Challonge match
    const { data: bracket } = await client
      .from('brackets')
      .select(
        `
        *,
        track1_racer:racers!track1_racer_id(id, name, racer_number),
        track2_racer:racers!track2_racer_id(id, name, racer_number)
      `
      )
      .eq('race_id', raceId)
      .eq('challonge_match_id', challongeMatchId)
      .single()

    if (!bracket) {
      console.log(`No bracket found for Challonge match ${challongeMatchId}`)
      return
    }

    // Ensure we have a winner and some form of score
    const hasRoundWins =
      typeof bracket.rounds_won_track1 === 'number' || typeof bracket.rounds_won_track2 === 'number'
    const hasTimes =
      typeof bracket.track1_time === 'number' && typeof bracket.track2_time === 'number'

    // Get tournament info
    const { data: tournament } = await client
      .from('challonge_tournaments')
      .select('*')
      .eq('race_id', raceId)
      .eq('status', 'active')
      .single()

    if (!tournament) {
      console.log('No active tournament found for race')
      return
    }

    // Get participant mappings
    const { data: participants } = await client
      .from('challonge_participants')
      .select('racer_id, challonge_participant_id')
      .eq('challonge_tournament_id', tournament.id)

    type ParticipantRow = { racer_id: string; challonge_participant_id: string }
    const participantMap = new Map<string, string>(
      (participants as ParticipantRow[] | null)?.map((p) => [
        p.racer_id,
        p.challonge_participant_id
      ]) || []
    )

    // Determine winner
    // Determine winner racer id
    let winnerRacerId = bracket.winner_racer_id
    if (!winnerRacerId) {
      if (hasTimes) {
        winnerRacerId =
          bracket.track1_time < bracket.track2_time
            ? bracket.track1_racer_id
            : bracket.track2_racer_id
      } else if (hasRoundWins) {
        const t1 = bracket.rounds_won_track1 || 0
        const t2 = bracket.rounds_won_track2 || 0
        winnerRacerId = t1 > t2 ? bracket.track1_racer_id : bracket.track2_racer_id
      }
    }
    const winnerChallongeId = winnerRacerId ? participantMap.get(winnerRacerId) : undefined

    if (!winnerChallongeId) {
      console.log('Winner participant mapping not found')
      return
    }

    // Format scores
    let scoresCsv = '1-0'
    if (bracket.match_format === 'best_of_3' && hasRoundWins) {
      const t1 = (bracket.rounds_won_track1 ?? 0).toString()
      const t2 = (bracket.rounds_won_track2 ?? 0).toString()
      scoresCsv = `${t1}-${t2}`
    } else if (hasTimes) {
      scoresCsv = `${Number(bracket.track1_time).toFixed(3)}-${Number(bracket.track2_time).toFixed(3)}`
    }

    // Update Challonge match
    await challongeApi.updateMatch(tournament.challonge_tournament_id, challongeMatchId, {
      scores_csv: scoresCsv,
      winner_id: Number.parseInt(winnerChallongeId as string)
    })

    console.log(`Successfully synced bracket to Challonge match ${challongeMatchId}`)

    // Store sync record
    await client.from('challonge_match_sync').upsert(
      {
        bracket_id: bracket.id,
        challonge_tournament_id: tournament.id,
        challonge_match_id: challongeMatchId,
        synced_at: new Date().toISOString(),
        winner_participant_id: winnerChallongeId,
        scores_csv: scoresCsv
      },
      {
        onConflict: 'bracket_id'
      }
    )
  } catch (error) {
    console.error('Error syncing bracket by Challonge match ID:', error)
    throw error
  }
}

/**
 * Non-destructive reconciliation from Challonge:
 * - Updates participant assignments and ordering for existing brackets
 * - Does not delete or recreate rows; does not touch rounds or winners
 */
export async function reconcileBracketsFromChallonge(
  client: SupabaseClient,
  raceId: string,
  tournamentId: string
): Promise<{ updated: number }> {
  let updated = 0
  // Get tournament challonge ID
  const { data: tournament } = await client
    .from('challonge_tournaments')
    .select('challonge_tournament_id')
    .eq('id', tournamentId)
    .single()

  if (!tournament) {
    console.log('No tournament found for reconcile')
    return { updated }
  }

  const challongeMatches = (await challongeApi.getMatches(
    tournament.challonge_tournament_id
  )) as ChallongeMatchRecord[]

  // participant mapping
  const { data: participants } = await client
    .from('challonge_participants')
    .select('challonge_participant_id, racer_id')
    .eq('challonge_tournament_id', tournamentId)

  type ParticipantRow = { challonge_participant_id: string; racer_id: string }
  const pmap = new Map<string, string>(
    (participants as ParticipantRow[] | null)?.map((p) => [
      p.challonge_participant_id,
      p.racer_id
    ]) || []
  )

  for (const rec of challongeMatches) {
    const match = rec.match
    const track1RacerId = match.player1_id ? pmap.get(match.player1_id.toString()) : null
    const track2RacerId = match.player2_id ? pmap.get(match.player2_id.toString()) : null

    const challongeId = match.id.toString()
    const { data: existing } = await client
      .from('brackets')
      .select(
        'id, track1_racer_id, track2_racer_id, challonge_suggested_play_order, challonge_round, winner_racer_id'
      )
      .eq('race_id', raceId)
      .eq('challonge_match_id', challongeId)
      .single()

    if (!existing) continue

    const updates: Partial<{
      track1_racer_id: string | null
      track2_racer_id: string | null
      challonge_suggested_play_order: number | null
      challonge_round: number
    }> = {}

    // Only update participants on matches not yet decided (avoid overwriting completed data)
    const isCompleted = Boolean(existing.winner_racer_id)
    if (!isCompleted) {
      if (track1RacerId && track1RacerId !== existing.track1_racer_id) {
        updates.track1_racer_id = track1RacerId
      }
      if (track2RacerId && track2RacerId !== existing.track2_racer_id) {
        updates.track2_racer_id = track2RacerId
      }
    }

    const suggested = match.suggested_play_order ?? null
    if (suggested !== existing.challonge_suggested_play_order) {
      updates.challonge_suggested_play_order = suggested
    }
    if (match.round !== existing.challonge_round) {
      updates.challonge_round = match.round
    }

    if (Object.keys(updates).length > 0) {
      await client.from('brackets').update(updates).eq('id', existing.id)
      updated++
    }
  }

  console.log(`Reconcile updated ${updated} bracket(s) from Challonge`)
  return { updated }
}
