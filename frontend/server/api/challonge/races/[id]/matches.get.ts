/* eslint-disable @typescript-eslint/no-explicit-any */
import { serverSupabaseClient } from '#supabase/server'
import { challongeApi } from '~/server/utils/challonge-client'
import {
  seedBracketsFromChallonge,
  refreshUpcomingParticipants
} from '~/server/utils/challonge-sync'

export default defineEventHandler(async (event) => {
  const raceId = getRouterParam(event, 'id')
  const client = await serverSupabaseClient(event)

  if (!raceId) {
    throw createError({ statusCode: 400, statusMessage: 'Race ID is required' })
  }

  // Ensure local brackets reflect Challonge matches
  await seedBracketsFromChallonge(client as unknown as any, raceId)

  // Load active tournament
  const { data: tournament, error: tErr } = await client
    .from('challonge_tournaments')
    .select('*')
    .eq('race_id', raceId)
    .eq('status', 'active')
    .single()

  if (tErr || !tournament) {
    throw createError({ statusCode: 404, statusMessage: 'Active tournament not found' })
  }

  // Pull latest matches from Challonge
  const matches = await challongeApi.getMatches((tournament as any).challonge_tournament_id)

  // Optionally refresh upcoming participants in local brackets from Challonge
  await refreshUpcomingParticipants(client as unknown as any, (tournament as any).id)

  // Build a unified list with local enrichment
  const matchIds = matches.map((m: any) => m.match.id.toString())
  const { data: localBrackets } = await client
    .from('brackets')
    .select(
      `
      *,
      track1_racer:racers!track1_racer_id(id, name, racer_number),
      track2_racer:racers!track2_racer_id(id, name, racer_number)
    `
    )
    .in('challonge_match_id', matchIds)

  const localById = new Map((localBrackets || []).map((b: any) => [b.challonge_match_id, b]))

  const unified = matches.map((m: any, idx: number) => {
    const match = m.match
    const id = match.id.toString()
    const local = localById.get(id)
    // Challonge sometimes includes a suggested_play_order; preserve it if present
    const suggestedOrder = (match as any).suggested_play_order ?? null
    return {
      challonge_match_id: id,
      challonge_round: match.round,
      state: match.state,
      player1_id: match.player1_id,
      player2_id: match.player2_id,
      winner_id: match.winner_id,
      suggested_play_order: suggestedOrder,
      // Fallback display order when Challonge doesn't provide suggested order
      display_order: suggestedOrder ?? idx + 1,
      // Local enrichments
      bracket_id: local?.id || null,
      bracket_group: local?.bracket_group || (match.round < 0 ? 'loser' : 'winner'),
      round_number: local?.round_number || Math.abs(match.round),
      match_format: local?.match_format || 'best_of_3',
      rounds_won_track1: local?.rounds_won_track1 || 0,
      rounds_won_track2: local?.rounds_won_track2 || 0,
      current_round: local?.current_round || 1,
      total_rounds: local?.total_rounds || 3,
      track1_racer: local?.track1_racer || null,
      track2_racer: local?.track2_racer || null,
      is_completed: local?.is_completed || false
    }
  })
  // IMPORTANT: Do not re-sort; Challonge API already returns a natural, interleaved order
  // Keeping the original order ensures loser placements line up with Challonge numbering

  return { matches: unified }
})
