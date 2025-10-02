import { serverSupabaseClient } from '#supabase/server'
import { challongeApi } from '~/server/utils/challonge-client'

export default defineEventHandler(async (event) => {
  const raceId = getRouterParam(event, 'id')
  const client = await serverSupabaseClient(event)

  if (!raceId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Race ID is required'
    })
  }

  try {
    // Get the Challonge tournament for this race
    const { data: tournament } = await client
      .from('challonge_tournaments')
      .select('id, challonge_tournament_id')
      .eq('race_id', raceId)
      .eq('status', 'active')
      .single()

    if (!tournament) {
      return {
        winners: [],
        tournament_complete: false,
        message: 'No active Challonge tournament found'
      }
    }

    // Get participants with final rankings from Challonge
    const participants = await challongeApi.getParticipants(tournament.challonge_tournament_id)
    
    // Get participant mappings to local racers
    const { data: participantMappings } = await client
      .from('challonge_participants')
      .select(`
        challonge_participant_id,
        racer:racers(
          id,
          name,
          racer_number,
          image_url,
          user_id
        )
      `)
      .eq('challonge_tournament_id', tournament.id)

    if (!participantMappings) {
      throw new Error('No participant mappings found')
    }

    const mappingLookup = new Map()
    participantMappings.forEach(mapping => {
      mappingLookup.set(mapping.challonge_participant_id, mapping.racer)
    })

    // Extract winners from Challonge final rankings
    const rankedParticipants = participants
      .filter(p => p.participant.final_rank !== null)
      .sort((a, b) => (a.participant.final_rank || 0) - (b.participant.final_rank || 0))
      .slice(0, 3) // Top 3

    const prizes = ['Champion 🏆', 'Runner-up 🥈', 'Third Place 🥉']
    const titles = ['1st Place', '2nd Place', '3rd Place']

    const winners = rankedParticipants.map((participant, index) => {
      const racer = mappingLookup.get(participant.participant.id.toString())
      return {
        place: participant.participant.final_rank,
        title: titles[index],
        racer: racer,
        prize: prizes[index],
        challonge_name: participant.participant.name
      }
    }).filter(w => w.racer) // Remove any without local racer mapping

    return {
      winners,
      tournament_complete: rankedParticipants.length > 0,
      source: 'challonge_final_rankings',
      tournament_id: tournament.challonge_tournament_id,
      total_participants: participants.length
    }

  } catch (error: any) {
    console.error('Error fetching race winners:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch race winners'
    })
  }
})