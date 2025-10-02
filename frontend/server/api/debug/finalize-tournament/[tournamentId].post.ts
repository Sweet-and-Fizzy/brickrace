import { challongeApi } from '~/server/utils/challonge-client'

export default defineEventHandler(async (event) => {
  const tournamentId = getRouterParam(event, 'tournamentId')

  if (!tournamentId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Tournament ID is required'
    })
  }

  try {
    // Finalize the tournament to generate final rankings
    console.log(`Finalizing tournament ${tournamentId}`)
    const finalizedTournament = await challongeApi.finalizeTournament(tournamentId)
    
    // Get participants with final rankings
    const participants = await challongeApi.getParticipants(tournamentId)
    
    return {
      tournament: finalizedTournament,
      participants,
      message: 'Tournament finalized - check final_rank fields'
    }
  } catch (error: any) {
    console.error('Error finalizing tournament:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to finalize tournament'
    })
  }
})