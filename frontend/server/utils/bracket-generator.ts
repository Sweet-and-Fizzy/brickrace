// Generate internal brackets based on Challonge tournament structure
import { challongeApi } from './challonge-client'

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

interface ParticipantMapping {
  challonge_participant_id: string
  racer_id: string
}

/**
 * Generate brackets from Challonge tournament structure
 * This replaces any existing brackets with ones that match Challonge exactly
 */
export async function generateBracketsFromChallonge(
  client: any,
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
    const challongeMatches = await challongeApi.getMatches(tournament.challonge_tournament_id)

    if (!challongeMatches || challongeMatches.length === 0) {
      throw new Error('No matches found in Challonge tournament')
    }

    // Debug: Log the Challonge match structure
    console.log('=== CHALLONGE MATCH STRUCTURE DEBUG ===')
    challongeMatches.forEach((m: any, i: number) => {
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
    const sortedMatches = challongeMatches.sort((a: any, b: any) => {
      const matchA = a.match as ChallongeMatchData
      const matchB = b.match as ChallongeMatchData

      // Use suggested_play_order if available
      if (matchA.suggested_play_order && matchB.suggested_play_order) {
        return matchA.suggested_play_order - matchB.suggested_play_order
      }

      // Fall back to round then ID
      if (matchA.round !== matchB.round) {
        return matchA.round - matchB.round
      }

      return matchA.id - matchB.id
    })

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
          const maxRound = Math.max(...sortedMatches.map((m: any) => m.match.round))

          // The championship final is typically the highest round
          // AND there should be only 1 match in that round
          const finalRoundMatches = sortedMatches.filter((m: any) => m.match.round === maxRound)

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
          if (scores.length === 2 && !isNaN(scores[0]) && !isNaN(scores[1])) {
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
        winnerBracketMatches: challongeMatches.filter((m: any) => m.match.round > 0).length,
        loserBracketMatches: challongeMatches.filter((m: any) => m.match.round < 0).length,
        finalMatches: challongeMatches.filter((m: any) => m.match.round === 1).length
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
  client: any,
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

    if (!bracket.track1_time || !bracket.track2_time) {
      console.log(`Bracket for match ${challongeMatchId} not ready for sync - missing times`)
      return
    }

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

    const participantMap = new Map(
      participants?.map((p: any) => [p.racer_id, p.challonge_participant_id]) || []
    )

    // Determine winner
    const isTrack1Winner = bracket.track1_time < bracket.track2_time
    const winnerRacerId = isTrack1Winner ? bracket.track1_racer_id : bracket.track2_racer_id
    const winnerChallongeId = participantMap.get(winnerRacerId)

    if (!winnerChallongeId) {
      console.log('Winner participant mapping not found')
      return
    }

    // Format scores
    const scoresCsv = `${bracket.track1_time.toFixed(3)}-${bracket.track2_time.toFixed(3)}`

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
