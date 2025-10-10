import { serverSupabaseClient } from '#supabase/server'
import { challongeApi, challongeUtils } from '~/server/utils/challonge-client'
import type { ChallongeTournament } from '~/types/database'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const client = await serverSupabaseClient(event)

  // Validate required fields
  if (!body.raceId || !body.name) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Race ID and tournament name are required'
    })
  }

  try {
    // Get race details
    const { data: race, error: raceError } = await client
      .from('races')
      .select('*')
      .eq('id', body.raceId)
      .single()

    if (raceError || !race) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Race not found'
      })
    }

    // Check if tournament already exists for this race
    const { data: existingTournament } = await client
      .from('challonge_tournaments')
      .select('*')
      .eq('race_id', body.raceId)
      .single()

    if (existingTournament) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Tournament already exists for this race'
      })
    }

    // Generate unique tournament URL
    const tournamentUrl = challongeUtils.generateTournamentUrl(
      race.name.toLowerCase().replace(/\s+/g, '-')
    )

    // Create tournament on Challonge
    console.log('Creating Challonge tournament with params:', {
      tournament: {
        name: body.name,
        url: tournamentUrl,
        tournamentType: body.tournament_type || 'double elimination',
        description: body.description || `Tournament for ${race.name}`,
        signupsRestricted: true,
        randomizeSeeds: false,
        showRounds: true,
        acceptAttachments: false,
        hideForum: true,
        holdThirdPlaceMatch: body.tournament_type === 'single_elimination' ? true : false
      }
    })

    const challongeTournament = await challongeApi.createTournament({
      tournament: {
        name: body.name,
        url: tournamentUrl,
        tournamentType: body.tournament_type || 'double elimination',
        description: body.description || `Tournament for ${race.name}`,
        signupsRestricted: true, // Prevent public signups
        randomizeSeeds: false, // We'll handle seeding based on qualifying times
        showRounds: true,
        acceptAttachments: false,
        hideForum: true,
        holdThirdPlaceMatch: body.tournament_type === 'single_elimination' ? true : false
      }
    })

    // Generate embed URL
    const embedUrl = challongeUtils.generateEmbedUrl(challongeTournament.tournament.url)

    // Save tournament data to our database
    // Convert tournament type back to underscore format for database constraint
    const dbTournamentType = (body.tournament_type || 'double elimination').replace(' ', '_')

    const { data: localTournament, error: insertError } = await client
      .from('challonge_tournaments')
      .insert({
        race_id: body.raceId,
        challonge_tournament_id: challongeTournament.tournament.id.toString(),
        challonge_url: challongeTournament.tournament.url,
        tournament_type: dbTournamentType,
        status: 'pending',
        embed_url: embedUrl
      } as Omit<ChallongeTournament, 'id' | 'created_at' | 'updated_at'>)
      .select()
      .single()

    if (insertError) {
      // If we fail to save locally, we should clean up the Challonge tournament
      // Note: We might want to add a cleanup function here
      console.error('Failed to save tournament locally:', insertError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to save tournament data'
      })
    }

    return {
      success: true,
      tournament: localTournament,
      challonge: {
        id: challongeTournament.tournament.id,
        url: challongeTournament.tournament.url,
        public_url: `https://challonge.com/${challongeTournament.tournament.url}`,
        embed_url: embedUrl
      }
    }
  } catch (error: any) {
    console.error('Tournament creation error:', error)

    // Handle Challonge-specific errors
    if (error.message?.includes('Challonge API Error')) {
      throw createError({
        statusCode: 502,
        statusMessage: `Tournament service error: ${error.message}`
      })
    }

    // Re-throw createError instances
    if (error.statusCode) {
      throw error
    }

    // Generic error fallback
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to create tournament'
    })
  }
})
