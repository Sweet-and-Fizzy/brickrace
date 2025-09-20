import { serverSupabaseClient } from '#supabase/server'
import { getRacePhase, getCurrentHeat, getUpcomingHeats } from '~/server/utils/race-phase'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  try {
    // Get the active race
    const { data: activeRace, error: raceError } = await client
      .from('races')
      .select('*')
      .eq('active', true)
      .single()

    if (raceError || !activeRace) {
      return {
        error: 'No active race found',
        data: null
      }
    }

    // Determine what phase the race is in
    const phase = await getRacePhase(client, activeRace.id)

    // Get current heat (could be qualifier or bracket)
    const currentHeat = await getCurrentHeat(client, activeRace.id, phase)

    // Get upcoming heats/brackets
    const upcomingHeats = await getUpcomingHeats(client, activeRace.id, phase, 2)

    return {
      data: {
        race: activeRace,
        phase,
        currentHeat,
        upcomingHeats
      },
      error: null
    }
  } catch (error: any) {
    return {
      error: error.message || 'Failed to fetch current race data',
      data: null
    }
  }
})
