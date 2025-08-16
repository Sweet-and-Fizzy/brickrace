import { serverSupabaseClient } from '#supabase/server'

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

    // Get current heat (in progress)
    const { data: currentHeat, error: currentHeatError } = await client
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
      .eq('race_id', activeRace.id)
      .eq('status', 'in_progress')
      .order('track_number')

    // Get next heats using the function
    const { data: nextHeats, error: nextHeatsError } = await client.rpc('get_next_heats', {
      heat_count: 2
    })

    // Only process upcoming heats if we have valid heat data
    // (heat_number and track_number should be set if heats were generated)
    const validNextHeats =
      nextHeats?.filter((heat: any) => heat.heat_number && heat.track_number && heat.racer_name) ||
      []

    // Group next heats by heat number
    const upcomingHeats =
      validNextHeats.length > 0
        ? validNextHeats.reduce((acc: any, heat: any) => {
            if (!acc[heat.heat_number]) {
              acc[heat.heat_number] = {
                heat_number: heat.heat_number,
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
        : {}

    // Convert to array and sort by scheduled order
    const upcomingHeatsArray = Object.values(upcomingHeats).sort(
      (a: any, b: any) => a.scheduled_order - b.scheduled_order
    )

    return {
      data: {
        race: activeRace,
        currentHeat:
          currentHeat && currentHeat.length > 0
            ? {
                heat_number: currentHeat[0].heat_number,
                racers: currentHeat.map((q) => ({
                  track_number: q.track_number,
                  racer_id: q.racer_id,
                  racer_name: q.racer?.name,
                  racer_number: q.racer?.racer_number,
                  racer_image_url: q.racer?.image_url,
                  time: q.time
                }))
              }
            : null,
        upcomingHeats: upcomingHeatsArray
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
