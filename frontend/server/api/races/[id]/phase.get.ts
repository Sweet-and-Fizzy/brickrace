import { serverSupabaseClient } from '#supabase/server'
import { getRacePhase } from '~/server/utils/race-phase'

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
    const phase = await getRacePhase(client as any, raceId)
    
    return {
      phase,
      race_id: raceId,
      timestamp: new Date().toISOString()
    }
  } catch (error: any) {
    console.error('Error fetching race phase:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch race phase'
    })
  }
})