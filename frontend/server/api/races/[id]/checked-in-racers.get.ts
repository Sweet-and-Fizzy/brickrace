import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const raceId = getRouterParam(event, 'id')
  const client = await serverSupabaseClient(event)

  try {
    // Get checked-in racers for this race
    const { data: checkins, error: checkinsError } = await client
      .from('checkins')
      .select(`
        racer_id,
        racers (
          id,
          name,
          racer_number,
          image_url
        )
      `)
      .eq('race_id', raceId)

    if (checkinsError) throw checkinsError

    // Transform the data to flatten racer information
    const racers = checkins.map(checkin => ({
      id: checkin.racers.id,
      name: checkin.racers.name,
      racer_number: checkin.racers.racer_number,
      image_url: checkin.racers.image_url
    }))

    return {
      data: racers,
      error: null
    }
  } catch (error: any) {
    return {
      error: error.message || 'Failed to fetch checked-in racers',
      data: null
    }
  }
})