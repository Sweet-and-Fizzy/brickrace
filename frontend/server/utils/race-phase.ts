/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SupabaseClient } from '@supabase/supabase-js'

// Define types for function parameters to avoid 'any' types
interface QualifierRecord {
  id: string
  status: string
  heat_number: number
  track_number: number
  racer_id: string
  time?: number
  racer?: {
    id: string
    name: string
    racer_number: number
    image_url?: string
  }
}

interface BracketRecord {
  id: string
  track1_time?: number
  track2_time?: number
  bracket_group?: string
  round_number?: number
  match_number?: number
  // Added fields for multi-round support
  match_format?: 'single' | 'best_of_3'
  total_rounds?: number
  current_round?: number
  rounds_won_track1?: number
  rounds_won_track2?: number
  is_completed?: boolean
  track1_racer_id?: string
  track2_racer_id?: string
  winner_racer_id?: string
  created_at: string
  challonge_match_id?: string
  challonge_round?: number
  challonge_suggested_play_order?: number
  track1_racer?: {
    id: string
    name: string
    racer_number: number
    image_url?: string
  }
  track2_racer?: {
    id: string
    name: string
    racer_number: number
    image_url?: string
  }
}

// (removed) NextHeatRecord unused

export type RacePhase = 'qualifying' | 'brackets' | 'complete' | 'not_started'

/**
 * Automatically finalize Challonge tournament when race is complete
 */
async function autoFinalizeChallongeTournament(
  client: SupabaseClient<any>,
  raceId: string
): Promise<void> {
  try {
    console.log('🏁 Auto-finalizing Challonge tournament...')

    // Get the tournament for this race
    const { data: tournament } = await client
      .from('challonge_tournaments')
      .select('challonge_tournament_id, status')
      .eq('race_id', raceId)
      .eq('status', 'active')
      .single()

    if (!tournament) {
      console.log('No active Challonge tournament found for auto-finalization')
      return
    }

    // Import the Challonge API client
    const { challongeApi } = await import('./challonge-client')

    // Check if tournament is already finalized by getting participants
    const participants = await challongeApi.getParticipants(tournament.challonge_tournament_id)
    const hasRankings = participants.some((p) => p.participant.final_rank !== null)

    if (hasRankings) {
      console.log('✅ Tournament already finalized')
      return
    }

    // Finalize the tournament
    await challongeApi.finalizeTournament(tournament.challonge_tournament_id)

    console.log(`✅ Auto-finalized tournament ${tournament.challonge_tournament_id}`)
  } catch (error) {
    console.error('❌ Auto-finalization failed:', error)
    throw error
  }
}

/**
 * Automatically sync new matches from Challonge if needed
 * This is called when no current bracket is found locally
 */
async function autoSyncNewChallongeMatches(
  client: SupabaseClient<any>,
  raceId: string
): Promise<void> {
  try {
    console.log('🔄 Auto-syncing new matches from Challonge...')

    // Get the tournament for this race
    const { data: tournament } = await client
      .from('challonge_tournaments')
      .select('id, challonge_tournament_id, status')
      .eq('race_id', raceId)
      .eq('status', 'active')
      .single()

    if (!tournament) {
      console.log('No active Challonge tournament found for this race')
      return
    }

    // Import the bracket generator function
    const { generateBracketsFromChallonge } = await import('./bracket-generator')

    // Regenerate brackets from current Challonge state
    const result = await generateBracketsFromChallonge(client, raceId, tournament.id)

    console.log(`✅ Auto-sync complete: ${result.bracketsGenerated} brackets generated`)
  } catch (error) {
    console.error('❌ Auto-sync failed:', error)
    throw error
  }
}

/**
 * Determines the current phase of a race based on the state of qualifiers and brackets
 */
export async function getRacePhase(
  client: SupabaseClient<any, 'public', any>,
  raceId: string
): Promise<RacePhase> {
  try {
    // Check if there are any qualifiers
    const { data: qualifiers, error: qualError } = await client
      .from('qualifiers')
      .select('id, status')
      .eq('race_id', raceId)

    if (qualError) throw qualError

    // Check if there are any brackets
    const { data: brackets, error: bracketError } = await client
      .from('brackets')
      .select('id, track1_time, track2_time, winner_racer_id')
      .eq('race_id', raceId)

    if (bracketError) throw bracketError

    // No qualifiers and no brackets = check if there's a Challonge tournament anyway
    if ((!qualifiers || qualifiers.length === 0) && (!brackets || brackets.length === 0)) {
      // Check if there's a Challonge tournament that might be complete
      try {
        const { data: tournament } = await client
          .from('challonge_tournaments')
          .select('id, challonge_tournament_id')
          .eq('race_id', raceId)
          .eq('status', 'active')
          .single()

        if (tournament) {
          console.log(
            `🎾 Found Challonge tournament ${tournament.challonge_tournament_id} for race ${raceId}`
          )
          const { challongeApi } = await import('./challonge-client')
          const participants = await challongeApi.getParticipants(
            tournament.challonge_tournament_id
          )
          const hasRankings = participants.some((p) => p.participant.final_rank !== null)

          if (hasRankings) {
            console.log(`✅ Challonge tournament has final rankings - returning 'complete'`)
            return 'complete'
          } else {
            console.log(
              `🏁 Challonge tournament exists but no final rankings - returning 'brackets'`
            )
            return 'brackets'
          }
        }
      } catch (error: any) {
        console.log('No Challonge tournament found:', error?.message || error)
      }

      console.log(
        `❌ No qualifiers, brackets, or Challonge tournament found - returning 'not_started'`
      )
      return 'not_started'
    }

    // If brackets exist, we're in bracket phase - but check Challonge status first
    if (brackets && brackets.length > 0) {
      // Check if Challonge tournament is finalized (has final rankings)
      try {
        const { data: tournament } = await client
          .from('challonge_tournaments')
          .select('id, challonge_tournament_id')
          .eq('race_id', raceId)
          .eq('status', 'active')
          .single()

        if (tournament) {
          const { challongeApi } = await import('./challonge-client')
          const participants = await challongeApi.getParticipants(
            tournament.challonge_tournament_id
          )
          const hasRankings = participants.some((p) => p.participant.final_rank !== null)

          if (hasRankings) {
            console.log(`✅ Challonge tournament has final rankings - returning 'complete'`)
            return 'complete'
          }
        }
      } catch (err) {
        console.log('Could not check Challonge status, falling back to local bracket check:', err)
      }

      // Fallback: Check for any incomplete brackets (no winner assigned)
      const incompleteBrackets = brackets.filter((b) => b.winner_racer_id === null)

      // If no incomplete brackets remain, the tournament is complete
      if (incompleteBrackets.length === 0) {
        // Auto-finalize the Challonge tournament if not already done
        try {
          await autoFinalizeChallongeTournament(client, raceId)
        } catch (error) {
          console.error('Failed to auto-finalize tournament:', error)
          // Continue even if finalization fails
        }

        return 'complete'
      }

      return 'brackets'
    }

    // If we have qualifiers but no brackets, we're in qualifying phase
    if (qualifiers && qualifiers.length > 0) {
      // Check if there are any incomplete qualifiers
      // More efficient: just check if at least 1 incomplete exists
      const { data: incompleteQualifiers } = await client
        .from('qualifiers')
        .select('id')
        .eq('race_id', raceId)
        .in('status', ['scheduled', 'in_progress'])
        .limit(1)

      const hasIncomplete = incompleteQualifiers && incompleteQualifiers.length > 0

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
  client: SupabaseClient<any>,
  raceId: string,
  phase: RacePhase
) {
  // If tournament is complete, return null (no current heat)
  if (phase === 'complete') {
    return null
  }

  if (phase === 'qualifying') {
    // Get current qualifier heat (in_progress first, then scheduled)
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

    const typedCurrentHeat = currentHeat as QualifierRecord[] | null

    if (typedCurrentHeat && typedCurrentHeat.length > 0) {
      return {
        heat_number: typedCurrentHeat[0].heat_number,
        type: 'qualifier',
        racers: typedCurrentHeat.map((q) => ({
          track_number: q.track_number,
          racer_id: q.racer_id,
          racer_name: q.racer?.name,
          racer_number: q.racer?.racer_number,
          racer_image_url: q.racer?.image_url,
          time: q.time
        }))
      }
    }

    // If no in_progress heat, get the first scheduled heat
    const { data: scheduledHeat } = await client
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
      .eq('status', 'scheduled')
      .order('heat_number', { ascending: true })
      .order('track_number')
      .limit(2)

    const typedScheduledHeat = scheduledHeat as QualifierRecord[] | null

    if (typedScheduledHeat && typedScheduledHeat.length > 0) {
      return {
        heat_number: typedScheduledHeat[0].heat_number,
        type: 'qualifier',
        racers: typedScheduledHeat.map((q) => ({
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
    // Get current bracket (first one without both times, ordered by Challonge play order)
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
      .is('winner_racer_id', null) // Incomplete by winner
      .eq('is_completed', false) // Not marked complete (covers forfeit-completed)
      .or('is_forfeit.is.null,is_forfeit.eq.false') // Not forfeited
      .order('challonge_suggested_play_order', { ascending: true, nullsFirst: false })
      .order('challonge_round', { ascending: true })
      .order('match_number', { ascending: true })
      .limit(1)
      .single()

    const typedCurrentBracket = currentBracket as BracketRecord | null

    if (!typedCurrentBracket) {
      // No current bracket found - check if there are any scheduled qualifiers we should show instead
      const { data: scheduledQualifiers, error: qualError } = await client
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
        .in('status', ['scheduled', 'in_progress']) // Also include in_progress
        .order('heat_number', { ascending: true })
        .order('track_number')
        .limit(2)

      console.log('📊 Incomplete qualifiers result:', {
        count: scheduledQualifiers?.length || 0,
        error: qualError?.message,
        first_heat: scheduledQualifiers?.[0]?.heat_number,
        first_status: scheduledQualifiers?.[0]?.status
      })

      const typedScheduledQualifiers = scheduledQualifiers as QualifierRecord[] | null

      if (typedScheduledQualifiers && typedScheduledQualifiers.length > 0) {
        console.log('✅ Found scheduled qualifiers, showing those instead of brackets')
        return {
          heat_number: typedScheduledQualifiers[0].heat_number,
          type: 'qualifier',
          racers: typedScheduledQualifiers.map((q) => ({
            track_number: q.track_number,
            racer_id: q.racer_id,
            racer_name: q.racer?.name,
            racer_number: q.racer?.racer_number,
            racer_image_url: q.racer?.image_url,
            time: q.time
          }))
        }
      }

      console.log('❌ No scheduled qualifiers, trying Challonge sync...')

      try {
        await autoSyncNewChallongeMatches(client, raceId)

        // Try getting current bracket again after sync
        const { data: retryBracket } = await client
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
          .is('winner_racer_id', null)
          .eq('is_completed', false)
          .or('is_forfeit.is.null,is_forfeit.eq.false')
          .order('challonge_suggested_play_order', { ascending: true, nullsFirst: false })
          .order('challonge_round', { ascending: true })
          .order('match_number', { ascending: true })
          .limit(1)
          .single()

        if (retryBracket) {
          console.log('Found new bracket after Challonge sync')
          // Set typedCurrentBracket to the new bracket and continue normal processing
          const newBracket = retryBracket as BracketRecord

          if (
            newBracket.track1_racer_id &&
            !newBracket.track2_racer_id &&
            !newBracket.winner_racer_id
          ) {
            // Auto-complete the bye
            await client
              .from('brackets')
              .update({
                winner_track: 1,
                winner_racer_id: newBracket.track1_racer_id
              })
              .eq('id', newBracket.id)

            console.log(`Auto-completed bye for bracket ${newBracket.id}`)

            // Recursively get the next bracket after auto-completing this bye
            return getCurrentHeat(client, raceId, phase)
          }

          // Process the new bracket normally
          const allBrackets = await client
            .from('brackets')
            .select('id')
            .eq('race_id', raceId)
            .order('challonge_suggested_play_order', { ascending: true, nullsFirst: false })
            .order('challonge_round', { ascending: true })
            .order('match_number', { ascending: true })

          const bracketIndex = allBrackets?.data?.findIndex((b) => b.id === newBracket.id) ?? 0
          const heatNumber = bracketIndex + 1

          return {
            heat_number: heatNumber,
            type: 'bracket',
            bracket_id: newBracket.id,
            bracket_group: newBracket.bracket_group,
            round_number: newBracket.round_number,
            match_number: newBracket.match_number,
            challonge_match_id: newBracket.challonge_match_id,
            challonge_round: newBracket.challonge_round,
            // Multi-round metadata
            match_format: newBracket.match_format,
            total_rounds: newBracket.total_rounds,
            current_round: newBracket.current_round,
            rounds_won_track1: newBracket.rounds_won_track1,
            rounds_won_track2: newBracket.rounds_won_track2,
            is_completed: newBracket.is_completed,
            racers: [
              {
                track_number: 1,
                racer_id: newBracket.track1_racer_id,
                racer_name: newBracket.track1_racer?.name,
                racer_number: newBracket.track1_racer?.racer_number,
                racer_image_url: newBracket.track1_racer?.image_url,
                time: newBracket.track1_time
              },
              {
                track_number: 2,
                racer_id: newBracket.track2_racer_id,
                racer_name: newBracket.track2_racer?.name,
                racer_number: newBracket.track2_racer?.racer_number,
                racer_image_url: newBracket.track2_racer?.image_url,
                time: newBracket.track2_time
              }
            ].filter((r) => r.racer_id)
          }
        }
      } catch (err) {
        console.error('Auto-sync failed:', err)
        // Continue with normal flow even if sync fails
      }
    }

    if (typedCurrentBracket) {
      // Check if this bracket has no racers assigned - if so, try auto-sync
      if (!typedCurrentBracket.track1_racer_id && !typedCurrentBracket.track2_racer_id) {
        console.log('Current bracket has no racers assigned, checking for new Challonge matches...')

        try {
          await autoSyncNewChallongeMatches(client, raceId)

          // Recursively try again after sync
          return getCurrentHeat(client, raceId, phase)
        } catch (error) {
          console.error('Auto-sync failed for bracket with no racers:', error)
          // Continue with normal flow even if sync fails
        }
      }

      // Check if this is a bye match (only one racer) and auto-complete if needed
      if (
        typedCurrentBracket.track1_racer_id &&
        !typedCurrentBracket.track2_racer_id &&
        !typedCurrentBracket.winner_racer_id
      ) {
        // Auto-complete the bye
        await client
          .from('brackets')
          .update({
            winner_track: 1,
            winner_racer_id: typedCurrentBracket.track1_racer_id
          })
          .eq('id', typedCurrentBracket.id)

        console.log(`Auto-completed bye for bracket ${typedCurrentBracket.id}`)

        // Recursively get the next bracket after auto-completing this bye
        return getCurrentHeat(client, raceId, phase)
      }

      // Get all brackets to determine sequential heat number (using Challonge ordering)
      const { data: allBrackets } = await client
        .from('brackets')
        .select('id')
        .eq('race_id', raceId)
        .order('challonge_suggested_play_order', { ascending: true, nullsFirst: false })
        .order('challonge_round', { ascending: true })
        .order('match_number', { ascending: true })

      const bracketIndex = allBrackets?.findIndex((b) => b.id === typedCurrentBracket.id) ?? 0
      const heatNumber = bracketIndex + 1 // Sequential numbering starting from 1

      return {
        heat_number: heatNumber,
        type: 'bracket',
        bracket_id: typedCurrentBracket.id,
        bracket_group: typedCurrentBracket.bracket_group,
        round_number: typedCurrentBracket.round_number,
        match_number: typedCurrentBracket.match_number,
        challonge_match_id: typedCurrentBracket.challonge_match_id,
        challonge_round: typedCurrentBracket.challonge_round,
        // Multi-round metadata
        match_format: typedCurrentBracket.match_format,
        total_rounds: typedCurrentBracket.total_rounds,
        current_round: typedCurrentBracket.current_round,
        rounds_won_track1: typedCurrentBracket.rounds_won_track1,
        rounds_won_track2: typedCurrentBracket.rounds_won_track2,
        is_completed: typedCurrentBracket.is_completed,
        racers: [
          {
            track_number: 1,
            racer_id: typedCurrentBracket.track1_racer_id,
            racer_name: typedCurrentBracket.track1_racer?.name,
            racer_number: typedCurrentBracket.track1_racer?.racer_number,
            racer_image_url: typedCurrentBracket.track1_racer?.image_url,
            time: typedCurrentBracket.track1_time
          },
          {
            track_number: 2,
            racer_id: typedCurrentBracket.track2_racer_id,
            racer_name: typedCurrentBracket.track2_racer?.name,
            racer_number: typedCurrentBracket.track2_racer?.racer_number,
            racer_image_url: typedCurrentBracket.track2_racer?.image_url,
            time: typedCurrentBracket.track2_time
          }
        ].filter((r) => r.racer_id) // Filter out null racers (byes)
      }
    }
  }

  return null
}

/**
 * Get upcoming heats/brackets
 */
export async function getUpcomingHeats(
  client: SupabaseClient<any>,
  raceId: string,
  phase: RacePhase,
  count: number = 2
) {
  if (phase === 'qualifying') {
    // Get upcoming qualifiers directly (more reliable than RPC)
    const { data: upcomingQualifiers } = await client
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
      .in('status', ['scheduled', 'in_progress'])
      .order('heat_number', { ascending: true })
      .order('track_number')

    if (upcomingQualifiers && upcomingQualifiers.length > 0) {
      // First, get the current heat to know what to exclude
      const currentHeat = await getCurrentHeat(client, raceId, phase)
      const currentHeatNumber = currentHeat?.heat_number

      // Group by heat number
      const grouped: Record<
        number,
        {
          heat_number: number
          type: 'qualifier'
          racers: Array<{
            track_number: number
            racer_id: string
            racer_name?: string
            racer_number?: number
            racer_image_url?: string
          }>
        }
      > = {}
      upcomingQualifiers.forEach((q) => {
        if (!grouped[q.heat_number]) {
          grouped[q.heat_number] = {
            heat_number: q.heat_number,
            type: 'qualifier',
            racers: []
          }
        }
        grouped[q.heat_number].racers.push({
          track_number: q.track_number,
          racer_id: q.racer_id,
          racer_name: q.racer?.name,
          racer_number: q.racer?.racer_number,
          racer_image_url: q.racer?.image_url
        })
      })

      const heatsArray = Object.values(grouped)
        .sort((a, b) => a.heat_number - b.heat_number)
        // Filter out current heat
        .filter((heat) => heat.heat_number !== currentHeatNumber)

      // Return the next heats
      return heatsArray.slice(0, count)
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
      .is('winner_racer_id', null)
      .eq('is_completed', false)
      .or('is_forfeit.is.null,is_forfeit.eq.false')
      .order('challonge_suggested_play_order', { ascending: true, nullsFirst: false })
      .order('challonge_round', { ascending: true })
      .order('match_number', { ascending: true })
      .limit(count + 1) // +1 to skip current

    if (upcomingBrackets && upcomingBrackets.length > 1) {
      // Skip the first one (that's the current bracket)
      const nextBrackets = upcomingBrackets.slice(1)

      // Get all brackets for numbering (using Challonge ordering)
      const { data: allBrackets } = await client
        .from('brackets')
        .select('id')
        .eq('race_id', raceId)
        .order('challonge_suggested_play_order', { ascending: true, nullsFirst: false })
        .order('challonge_round', { ascending: true })
        .order('match_number', { ascending: true })

      return nextBrackets.map((bracket, index) => {
        const bracketIndex = allBrackets?.findIndex((b) => b.id === bracket.id) ?? 0
        const heatNumber = bracketIndex + 1 // Sequential numbering starting from 1

        return {
          heat_number: heatNumber,
          type: 'bracket',
          bracket_id: bracket.id,
          bracket_group: bracket.bracket_group,
          round_number: bracket.round_number,
          match_number: bracket.match_number,
          challonge_match_id: bracket.challonge_match_id,
          challonge_round: bracket.challonge_round,
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
          ].filter((r) => r.racer_id) // Filter out null racers
        }
      })
    }
  }

  return []
}
