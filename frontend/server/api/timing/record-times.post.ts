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

/**
 * Handle bracket completion - determine winner and generate next round brackets
 */
async function handleBracketCompletion(client: any, raceId: string, bracketId: string) {
  try {
    // Get the completed bracket with all details
    const { data: bracket, error: bracketError } = await client
      .from('brackets')
      .select(`
        *,
        track1_racer:racers!track1_racer_id(id, name, racer_number),
        track2_racer:racers!track2_racer_id(id, name, racer_number)
      `)
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

    // Get all brackets for this race to determine what to generate next
    const { data: allBrackets } = await client
      .from('brackets')
      .select('*')
      .eq('race_id', raceId)
      .order('created_at')

    if (!allBrackets) return

    // Group by bracket group and round
    const winnerBrackets = allBrackets.filter(b => b.bracket_group === 'winner')
    const loserBrackets = allBrackets.filter(b => b.bracket_group === 'loser')
    
    // Check if current winner bracket round is complete
    const currentRound = bracket.round_number
    const currentRoundBrackets = winnerBrackets.filter(b => b.round_number === currentRound)
    const completedInRound = currentRoundBrackets.filter(b => 
      b.winner_racer_id !== null // Check for winner instead of times (handles byes)
    )

    console.log(`Round ${currentRound}: ${completedInRound.length}/${currentRoundBrackets.length} brackets complete`)

    // If this round is complete, generate next rounds
    if (completedInRound.length === currentRoundBrackets.length) {
      await generateNextRounds(client, raceId, currentRoundBrackets, currentRound)
    }

  } catch (error) {
    console.error('Error handling bracket completion:', error)
    // Don't throw - we don't want to fail the timing recording
  }
}

/**
 * Generate next round brackets for double elimination
 */
async function generateNextRounds(client: any, raceId: string, completedBrackets: any[], currentRound: number) {
  const newBrackets = []
  
  // Collect winners and losers from completed round
  const winners = []
  const losers = []
  
  for (const bracket of completedBrackets) {
    if (bracket.winner_racer_id) {
      winners.push({
        racer_id: bracket.winner_racer_id,
        source_bracket: bracket.id
      })
      
      // Add loser to loser bracket (only if both racers were present)
      if (bracket.track1_racer_id && bracket.track2_racer_id) {
        const loserRacerId = bracket.winner_track === 1 ? bracket.track2_racer_id : bracket.track1_racer_id
        losers.push({
          racer_id: loserRacerId,
          source_bracket: bracket.id
        })
      }
    }
  }

  console.log(`Generating next rounds: ${winners.length} winners, ${losers.length} losers`)

  // Check if next winner round already exists to prevent duplicates
  const nextRound = currentRound + 1
  const { data: existingNextRound } = await client
    .from('brackets')
    .select('id')
    .eq('race_id', raceId)
    .eq('bracket_group', 'winner')
    .eq('round_number', nextRound)
    .limit(1)

  // Generate next winner bracket round if we have enough winners and round doesn't exist
  if (winners.length >= 2 && (!existingNextRound || existingNextRound.length === 0)) {
    // Remove duplicates from winners array
    const uniqueWinners = []
    const seenRacers = new Set()
    
    for (const winner of winners) {
      if (!seenRacers.has(winner.racer_id)) {
        seenRacers.add(winner.racer_id)
        uniqueWinners.push(winner)
      }
    }
    
    let matchNumber = 1
    for (let i = 0; i < Math.floor(uniqueWinners.length / 2); i++) {
      newBrackets.push({
        race_id: raceId,
        track1_racer_id: uniqueWinners[i * 2].racer_id,
        track2_racer_id: uniqueWinners[i * 2 + 1].racer_id,
        bracket_type: 'double_elimination',
        bracket_group: 'winner',
        round_number: nextRound,
        match_number: matchNumber++,
        parent_bracket_winner_id: uniqueWinners[i * 2].source_bracket
      })
    }
    
    // Handle odd winner (bye)
    if (uniqueWinners.length % 2 === 1) {
      const byeWinner = uniqueWinners[uniqueWinners.length - 1]
      newBrackets.push({
        race_id: raceId,
        track1_racer_id: byeWinner.racer_id,
        track2_racer_id: null,
        bracket_type: 'double_elimination',
        bracket_group: 'winner',
        round_number: nextRound,
        match_number: matchNumber,
        winner_track: 1,
        winner_racer_id: byeWinner.racer_id,
        parent_bracket_winner_id: byeWinner.source_bracket
      })
    }
  }

  // Generate loser bracket round if we have losers
  if (losers.length >= 2) {
    // Get current loser bracket round number
    const { data: existingLoserBrackets } = await client
      .from('brackets')
      .select('round_number')
      .eq('race_id', raceId)
      .eq('bracket_group', 'loser')
      .order('round_number', { ascending: false })
      .limit(1)
    
    const nextLoserRound = existingLoserBrackets?.length > 0 ? 
      existingLoserBrackets[0].round_number + 1 : 1

    // Check if this loser round already exists
    const { data: existingLoserRound } = await client
      .from('brackets')
      .select('id')
      .eq('race_id', raceId)
      .eq('bracket_group', 'loser')
      .eq('round_number', nextLoserRound)
      .limit(1)

    if (!existingLoserRound || existingLoserRound.length === 0) {
      // Remove duplicates from losers array
      const uniqueLosers = []
      const seenRacers = new Set()
      
      for (const loser of losers) {
        if (!seenRacers.has(loser.racer_id)) {
          seenRacers.add(loser.racer_id)
          uniqueLosers.push(loser)
        }
      }

      let loserMatchNumber = 1
      for (let i = 0; i < Math.floor(uniqueLosers.length / 2); i++) {
        newBrackets.push({
          race_id: raceId,
          track1_racer_id: uniqueLosers[i * 2].racer_id,
          track2_racer_id: uniqueLosers[i * 2 + 1].racer_id,
          bracket_type: 'double_elimination',
          bracket_group: 'loser',
          round_number: nextLoserRound,
          match_number: loserMatchNumber++,
          parent_bracket_loser_id: uniqueLosers[i * 2].source_bracket
        })
      }
    }
  }

  // Check for championship final in double elimination
  if (newBrackets.length === 0) {
    // No new brackets generated - check if we need championship final or reset final
    const { data: allBrackets } = await client
      .from('brackets')
      .select('*')
      .eq('race_id', raceId)
      .order('created_at')

    if (allBrackets) {
      const winnerBrackets = allBrackets.filter(b => b.bracket_group === 'winner')
      const loserBrackets = allBrackets.filter(b => b.bracket_group === 'loser')
      const finalBrackets = allBrackets.filter(b => b.bracket_group === 'final')
      
      // Check if championship final exists and is completed
      if (finalBrackets.length > 0) {
        const championshipFinal = finalBrackets[0]
        
        // If championship final is completed, check who won
        if (championshipFinal.winner_racer_id && championshipFinal.track1_time !== null && championshipFinal.track2_time !== null) {
          const winnerChampion = getLastStandingRacer(winnerBrackets)
          const loserChampion = getLastStandingRacer(loserBrackets)
          
          // In double elimination: if loser bracket champion beats winner bracket champion,
          // the winner bracket champion gets a second chance (reset final)
          if (championshipFinal.winner_racer_id === loserChampion && winnerChampion !== loserChampion) {
            // Check if reset final already exists
            const resetFinalExists = finalBrackets.some(f => f.round_number === 2)
            
            if (!resetFinalExists) {
              // Create reset final - winner bracket champion gets second chance
              newBrackets.push({
                race_id: raceId,
                track1_racer_id: winnerChampion,
                track2_racer_id: loserChampion,
                bracket_type: 'double_elimination',
                bracket_group: 'final',
                round_number: 2,
                match_number: 1
              })
              
              console.log(`Generated reset final: ${winnerChampion} vs ${loserChampion} (winner bracket champion gets second chance)`)
            }
          }
          // If winner bracket champion won the championship final, tournament is over
          // No additional logic needed - tournament complete
        }
      } else {
        // No championship final exists yet - check if we need to create one
        const winnerChampion = getLastStandingRacer(winnerBrackets)
        const loserChampion = getLastStandingRacer(loserBrackets)
        
        if (winnerChampion && loserChampion && winnerChampion !== loserChampion) {
          // Create championship final
          newBrackets.push({
            race_id: raceId,
            track1_racer_id: winnerChampion,
            track2_racer_id: loserChampion,
            bracket_type: 'double_elimination',
            bracket_group: 'final',
            round_number: 1,
            match_number: 1
          })
          
          console.log(`Generated championship final: ${winnerChampion} vs ${loserChampion}`)
        }
      }
    }
  }

  // Insert new brackets
  if (newBrackets.length > 0) {
    const { error } = await client
      .from('brackets')
      .insert(newBrackets)

    if (error) {
      console.error('Error inserting new brackets:', error)
    } else {
      console.log(`Generated ${newBrackets.length} new bracket(s) for next round`)
    }
  }
}

// Helper function to find the last standing racer in a bracket group
function getLastStandingRacer(brackets) {
  if (!brackets || brackets.length === 0) return null
  
  // Find the most recent completed bracket (highest round number with results)
  const completedBrackets = brackets.filter(b => 
    b.winner_racer_id !== null // Universal completion indicator
  )
  
  if (completedBrackets.length === 0) return null
  
  // Sort by round number descending, then by created_at descending to get the most recent
  completedBrackets.sort((a, b) => {
    if (a.round_number !== b.round_number) {
      return b.round_number - a.round_number
    }
    return new Date(b.created_at) - new Date(a.created_at)
  })
  
  // The winner of the most recent bracket is the champion of this bracket group
  const mostRecentBracket = completedBrackets[0]
  return mostRecentBracket.winner_racer_id
}

export default defineEventHandler(async (event) => {
  // Validate API key
  await requireTimingAuth(event)

  const client = await createTimingSupabaseClient(event)
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

    // Get active race
    const { data: activeRace } = await client
      .from('races')
      .select('id')
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
    } else if (phase === 'brackets') {
      // Bracket heat - find current bracket by sequential position
      const { data: brackets } = await client
        .from('brackets')
        .select('id')
        .eq('race_id', activeRace.id)
        .order('bracket_group', { ascending: true }) // winner before loser  
        .order('round_number', { ascending: true })
        .order('match_number', { ascending: true })
        .order('created_at', { ascending: true }) // fallback
      
      const bracketIndex = heat_number - 1 // Convert heat number to 0-based index
      if (!brackets || !brackets[bracketIndex]) {
        throw new Error(`Bracket not found for heat number ${heat_number}`)
      }

      const bracketId = brackets[bracketIndex].id

      // Update bracket times
      const updates: any = {}
      if (track1_time !== undefined) updates.track1_time = track1_time
      if (track2_time !== undefined) updates.track2_time = track2_time

      const { error } = await client
        .from('brackets')
        .update(updates)
        .eq('id', bracketId)

      if (error) {
        throw error
      }

      logTimingRequest(event, 'BRACKET_TIMES_RECORDED', {
        bracket_id: bracketId,
        track1_time,
        track2_time
      })

      // Get the updated bracket to check if both times are now recorded
      const { data: updatedBracket } = await client
        .from('brackets')
        .select('track1_time, track2_time, winner_racer_id')
        .eq('id', bracketId)
        .single()

      // Check if both times are now recorded and determine winner + generate next round
      if (updatedBracket && 
          updatedBracket.track1_time !== null && 
          updatedBracket.track2_time !== null && 
          !updatedBracket.winner_racer_id) {
        await handleBracketCompletion(client, activeRace.id, bracketId)
      }
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
