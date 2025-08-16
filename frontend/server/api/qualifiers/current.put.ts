import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)

  const { heat_number, track1_time, track2_time } = body

  if (!heat_number) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Heat number is required'
    })
  }

  try {
    // Complete the heat with the provided times
    const { error } = await client
      .rpc('complete_heat', {
        heat_num: heat_number,
        track1_time: track1_time || null,
        track2_time: track2_time || null
      })

    if (error) {
      throw error
    }

    // Start the next heat automatically
    const { data: nextHeat } = await client
      .from('qualifiers')
      .select('heat_number')
      .eq('race_id', client.from('races').select('id').eq('active', true).single())
      .eq('status', 'scheduled')
      .order('scheduled_order')
      .limit(1)
      .single()

    if (nextHeat) {
      await client.rpc('start_heat', { heat_num: nextHeat.heat_number })
    }

    return {
      success: true,
      message: 'Heat completed successfully',
      nextHeatStarted: !!nextHeat
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to update qualifier times'
    })
  }
})