// Automatic sync utility for internal brackets to Challonge tournaments
import { challongeApi } from './challonge-client'

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

interface ChallongeMatch {
  id: number
  tournament_id: number
  state: string
  player1_id: number | null
  player2_id: number | null
  winner_id: number | null
  round: number
}

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
    console.log(`Starting Challonge sync for bracket ${bracketId}`)

    // Check if this bracket has already been synced
    const { data: existingSync } = await client
      .from('challonge_match_sync')
      .select('id, synced_at')
      .eq('bracket_id', bracketId)
      .single()

    if (existingSync) {
      console.log(`Bracket ${bracketId} already synced at ${existingSync.synced_at}`)
      return
    }

    // Get tournament for this race
    const { data: tournament } = await client
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
    const { data: bracket } = await client
      .from('brackets')
      .select(`
        *,
        track1_racer:racers!track1_racer_id(id, name, racer_number),
        track2_racer:racers!track2_racer_id(id, name, racer_number)
      `)
      .eq('id', bracketId)
      .single()

    if (!bracket || !bracket.track1_time || !bracket.track2_time) {
      console.log('Bracket not ready for sync - missing times')
      return
    }

    // Get participant mappings to convert racer IDs to Challonge participant IDs
    const { data: participants } = await client
      .from('challonge_participants')
      .select('racer_id, challonge_participant_id')
      .eq('challonge_tournament_id', tournament.id)

    if (!participants || participants.length === 0) {
      console.log('No participant mappings found for tournament')
      return
    }

    const participantMap = new Map(
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

    // Determine winner and loser
    const isTrack1Winner = bracket.track1_time < bracket.track2_time
    const winnerRacerId = isTrack1Winner ? bracket.track1_racer_id : bracket.track2_racer_id
    const winnerChallongeId = participantMap.get(winnerRacerId)

    if (!winnerChallongeId) {
      console.log('Winner participant mapping not found for racer:', winnerRacerId)
      return
    }

    // Format scores for Challonge (faster time wins)
    const scoresCsv = `${bracket.track1_time.toFixed(3)}-${bracket.track2_time.toFixed(3)}`

    // Update the Challonge match
    await challongeApi.updateMatch(
      tournament.challonge_tournament_id,
      matchingMatch.match.id.toString(),
      {
        scores_csv: scoresCsv,
        winner_id: parseInt(winnerChallongeId)
      }
    )

    console.log(`Successfully synced bracket ${bracketId} to Challonge match ${matchingMatch.match.id}`)
    console.log(`Winner: ${winnerChallongeId}, Scores: ${scoresCsv}`)

    // Store sync record for tracking
    await client
      .from('challonge_match_sync')
      .upsert({
        bracket_id: bracketId,
        challonge_tournament_id: tournament.id,
        challonge_match_id: matchingMatch.match.id.toString(),
        synced_at: new Date().toISOString(),
        winner_participant_id: winnerChallongeId,
        scores_csv: scoresCsv
      }, {
        onConflict: 'bracket_id'
      })

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
  challongeMatches: any[],
  participantMap: Map<string, string>
): any | null {
  
  const track1ChallongeId = bracket.track1_racer_id ? participantMap.get(bracket.track1_racer_id) : null
  const track2ChallongeId = bracket.track2_racer_id ? participantMap.get(bracket.track2_racer_id) : null

  if (!track1ChallongeId || !track2ChallongeId) {
    return null
  }

  // Find a match where both participants match (regardless of which side they're on)
  return challongeMatches.find((match: any) => {
    const player1 = match.match.player1_id?.toString()
    const player2 = match.match.player2_id?.toString()
    
    return (
      (player1 === track1ChallongeId && player2 === track2ChallongeId) ||
      (player1 === track2ChallongeId && player2 === track1ChallongeId)
    )
  })
}

/**
 * Sync all completed brackets for a race to Challonge
 * Useful for bulk sync or recovery scenarios
 */
export async function syncAllBracketsToChallonge(
  client: any,
  raceId: string
): Promise<void> {
  try {
    console.log(`Starting bulk sync for race ${raceId}`)

    // Get all completed brackets for this race
    const { data: completedBrackets } = await client
      .from('brackets')
      .select('id')
      .eq('race_id', raceId)
      .not('track1_time', 'is', null)
      .not('track2_time', 'is', null)
      .not('winner_racer_id', 'is', null)

    if (!completedBrackets || completedBrackets.length === 0) {
      console.log('No completed brackets found for race')
      return
    }

    console.log(`Found ${completedBrackets.length} completed brackets to sync`)

    // Sync each bracket
    for (const bracket of completedBrackets) {
      await syncBracketToChallonge(client, raceId, bracket.id)
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    console.log(`Bulk sync completed for race ${raceId}`)

  } catch (error) {
    console.error('Error in bulk sync:', error)
    throw error
  }
}