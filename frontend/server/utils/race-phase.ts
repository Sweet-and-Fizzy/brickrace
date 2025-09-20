import type { SupabaseClient } from '@supabase/supabase-js'

export type RacePhase = 'qualifying' | 'brackets' | 'complete' | 'not_started'

/**
 * Determines the current phase of a race based on the state of qualifiers and brackets
 */
export async function getRacePhase(
  client: SupabaseClient,
  raceId: string
): Promise<RacePhase> {
  try {
    // Check if there are any qualifiers
    const { data: qualifiers, error: qualError } = await client
      .from('qualifiers')
      .select('id, status')
      .eq('race_id', raceId)
      .limit(10)

    if (qualError) throw qualError

    // Check if there are any brackets
    const { data: brackets, error: bracketError } = await client
      .from('brackets')
      .select('id, track1_time, track2_time')
      .eq('race_id', raceId)
      .limit(10)

    if (bracketError) throw bracketError

    // No qualifiers and no brackets = not started
    if ((!qualifiers || qualifiers.length === 0) && (!brackets || brackets.length === 0)) {
      return 'not_started'
    }

    // If brackets exist, we're in bracket phase
    if (brackets && brackets.length > 0) {
      // Check if all brackets are complete
      const allBracketsComplete = brackets.every(
        b => b.track1_time !== null && b.track2_time !== null
      )
      
      // If we have brackets and they're all done, race is complete
      // (unless more brackets need to be generated for next round)
      if (allBracketsComplete) {
        // For now, consider it brackets phase - could enhance to detect true completion
        return 'brackets'
      }
      
      return 'brackets'
    }

    // If we have qualifiers but no brackets, we're in qualifying phase
    if (qualifiers && qualifiers.length > 0) {
      // Check if there are any incomplete qualifiers
      const hasIncomplete = qualifiers.some(
        q => q.status === 'scheduled' || q.status === 'in_progress'
      )
      
      return hasIncomplete ? 'qualifying' : 'brackets' // If qualifying done, ready for brackets
    }

    return 'not_started'
  } catch (error) {
    console.error('Error determining race phase:', error)
    return 'not_started'
  }
}

/**
 * Get the current "heat" which could be a qualifier heat or a bracket match
 */
export async function getCurrentHeat(
  client: SupabaseClient,
  raceId: string,
  phase: RacePhase
) {
  if (phase === 'qualifying') {
    // Get current qualifier heat
    const { data: currentHeat } = await client
      .from('qualifiers')
      .select(
        `
        *,
        racer:racers(
          id,
          name,
          racer_number,
          image_url
        )
      `
      )
      .eq('race_id', raceId)
      .eq('status', 'in_progress')
      .order('track_number')

    if (currentHeat && currentHeat.length > 0) {
      return {
        heat_number: currentHeat[0].heat_number,
        type: 'qualifier',
        racers: currentHeat.map((q) => ({
          track_number: q.track_number,
          racer_id: q.racer_id,
          racer_name: q.racer?.name,
          racer_number: q.racer?.racer_number,
          racer_image_url: q.racer?.image_url,
          time: q.time
        }))
      }
    }
  } else if (phase === 'brackets') {
    // Get current bracket (first one without both times, ordered by bracket group, round, then match number)
    const { data: currentBracket } = await client
      .from('brackets')
      .select(
        `
        *,
        track1_racer:racers!track1_racer_id(
          id,
          name,
          racer_number,
          image_url
        ),
        track2_racer:racers!track2_racer_id(
          id,
          name,
          racer_number,
          image_url
        )
      `
      )
      .eq('race_id', raceId)
      .is('winner_racer_id', null) // Only get brackets without a winner (incomplete)
      .order('bracket_group', { ascending: true }) // winner before loser
      .order('round_number', { ascending: true })
      .order('match_number', { ascending: true })
      .order('created_at', { ascending: true }) // fallback for brackets without match_number
      .limit(1)
      .single()

    if (currentBracket) {
      // Check if this is a bye match (only one racer) and auto-complete if needed
      if (currentBracket.track1_racer_id && !currentBracket.track2_racer_id && !currentBracket.winner_racer_id) {
        // Auto-complete the bye
        await client
          .from('brackets')
          .update({
            winner_track: 1,
            winner_racer_id: currentBracket.track1_racer_id
          })
          .eq('id', currentBracket.id)
        
        console.log(`Auto-completed bye for bracket ${currentBracket.id}`)
        
        // Recursively get the next bracket after auto-completing this bye
        return getCurrentHeat(client, raceId, phase)
      }

      // Get all brackets to determine sequential heat number (using same ordering as current bracket query)
      const { data: allBrackets } = await client
        .from('brackets')
        .select('id')
        .eq('race_id', raceId)
        .order('bracket_group', { ascending: true })
        .order('round_number', { ascending: true })
        .order('match_number', { ascending: true })
        .order('created_at', { ascending: true })
      
      const bracketIndex = allBrackets?.findIndex(b => b.id === currentBracket.id) ?? 0
      const heatNumber = bracketIndex + 1 // Sequential numbering starting from 1

      return {
        heat_number: heatNumber,
        type: 'bracket',
        bracket_id: currentBracket.id,
        bracket_group: currentBracket.bracket_group,
        round_number: currentBracket.round_number,
        match_number: currentBracket.match_number,
        racers: [
          {
            track_number: 1,
            racer_id: currentBracket.track1_racer_id,
            racer_name: currentBracket.track1_racer?.name,
            racer_number: currentBracket.track1_racer?.racer_number,
            racer_image_url: currentBracket.track1_racer?.image_url,
            time: currentBracket.track1_time
          },
          {
            track_number: 2,
            racer_id: currentBracket.track2_racer_id,
            racer_name: currentBracket.track2_racer?.name,
            racer_number: currentBracket.track2_racer?.racer_number,
            racer_image_url: currentBracket.track2_racer?.image_url,
            time: currentBracket.track2_time
          }
        ].filter(r => r.racer_id) // Filter out null racers (byes)
      }
    }
  }

  return null
}

/**
 * Get upcoming heats/brackets
 */
export async function getUpcomingHeats(
  client: SupabaseClient,
  raceId: string,
  phase: RacePhase,
  count: number = 2
) {
  const upcomingHeats = []

  if (phase === 'qualifying') {
    // Use existing RPC function for qualifier heats
    const { data: nextHeats } = await client.rpc('get_next_heats', { heat_count: count })
    
    if (nextHeats) {
      // Group by heat number
      const grouped = nextHeats.reduce((acc: any, heat: any) => {
        if (!acc[heat.heat_number]) {
          acc[heat.heat_number] = {
            heat_number: heat.heat_number,
            type: 'qualifier',
            scheduled_order: heat.scheduled_order,
            racers: []
          }
        }
        acc[heat.heat_number].racers.push({
          track_number: heat.track_number,
          racer_id: heat.racer_id,
          racer_name: heat.racer_name,
          racer_number: heat.racer_number,
          racer_image_url: heat.racer_image_url
        })
        return acc
      }, {})
      
      return Object.values(grouped)
    }
  } else if (phase === 'brackets') {
    // Get upcoming brackets (ones without times)
    const { data: upcomingBrackets } = await client
      .from('brackets')
      .select(
        `
        *,
        track1_racer:racers!track1_racer_id(
          id,
          name,
          racer_number,
          image_url
        ),
        track2_racer:racers!track2_racer_id(
          id,
          name,
          racer_number,
          image_url
        )
      `
      )
      .eq('race_id', raceId)
      .is('winner_racer_id', null) // Only get brackets without a winner (incomplete)
      .order('bracket_group', { ascending: true }) // winner before loser
      .order('round_number', { ascending: true })
      .order('match_number', { ascending: true })
      .order('created_at', { ascending: true }) // fallback
      .limit(count + 1) // +1 to skip current

    if (upcomingBrackets && upcomingBrackets.length > 1) {
      // Skip the first one (that's the current bracket)
      const nextBrackets = upcomingBrackets.slice(1)
      
      // Get all brackets for numbering (using same ordering as current bracket query)
      const { data: allBrackets } = await client
        .from('brackets')
        .select('id')
        .eq('race_id', raceId)
        .order('bracket_group', { ascending: true })
        .order('round_number', { ascending: true })
        .order('match_number', { ascending: true })
        .order('created_at', { ascending: true })

      return nextBrackets.map((bracket, index) => {
        const bracketIndex = allBrackets?.findIndex(b => b.id === bracket.id) ?? 0
        const heatNumber = bracketIndex + 1 // Sequential numbering starting from 1
        
        return {
          heat_number: heatNumber,
          type: 'bracket',
          bracket_id: bracket.id,
          bracket_group: bracket.bracket_group,
          round_number: bracket.round_number,
          match_number: bracket.match_number,
          scheduled_order: index + 1,
          racers: [
            {
              track_number: 1,
              racer_id: bracket.track1_racer_id,
              racer_name: bracket.track1_racer?.name,
              racer_number: bracket.track1_racer?.racer_number,
              racer_image_url: bracket.track1_racer?.image_url
            },
            {
              track_number: 2,
              racer_id: bracket.track2_racer_id,
              racer_name: bracket.track2_racer?.name,
              racer_number: bracket.track2_racer?.racer_number,
              racer_image_url: bracket.track2_racer?.image_url
            }
          ].filter(r => r.racer_id) // Filter out null racers
        }
      })
    }
  }

  return []
}