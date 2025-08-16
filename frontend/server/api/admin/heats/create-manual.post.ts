import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)
  
  const { race_id, heat_number, track1_racer_id, track2_racer_id, set_as_current } = body

  try {
    // Validate input
    if (!race_id) {
      throw new Error('Race ID is required')
    }

    if (!track1_racer_id && !track2_racer_id) {
      throw new Error('At least one racer must be assigned')
    }

    // Auto-increment heat number if not provided
    if (!heat_number) {
      const { data: maxHeatData, error: maxHeatError } = await client
        .from('qualifiers')
        .select('heat_number')
        .eq('race_id', race_id)
        .order('heat_number', { ascending: false })
        .limit(1)

      if (maxHeatError) throw maxHeatError

      heat_number = (maxHeatData && maxHeatData.length > 0 ? maxHeatData[0].heat_number : 0) + 1
    } else {
      // Check if heat number already exists when manually specified
      const { data: existingHeat, error: checkError } = await client
        .from('qualifiers')
        .select('heat_number')
        .eq('race_id', race_id)
        .eq('heat_number', heat_number)
        .limit(1)

      if (checkError) throw checkError

      if (existingHeat && existingHeat.length > 0) {
        throw new Error(`Heat #${heat_number} already exists`)
      }
    }

    // Get the next scheduled order
    const { data: maxOrder, error: orderError } = await client
      .from('qualifiers')
      .select('scheduled_order')
      .eq('race_id', race_id)
      .order('scheduled_order', { ascending: false })
      .limit(1)

    if (orderError) throw orderError

    const nextOrder = (maxOrder && maxOrder.length > 0 ? maxOrder[0].scheduled_order : 0) + 1

    // Create qualifier entries for the heat
    const qualifiers = []
    
    if (track1_racer_id) {
      qualifiers.push({
        racer_id: track1_racer_id,
        race_id: race_id,
        heat_number: heat_number,
        track_number: 1,
        status: set_as_current ? 'in_progress' : 'scheduled',
        scheduled_order: nextOrder,
        time: 0
      })
    }

    if (track2_racer_id) {
      qualifiers.push({
        racer_id: track2_racer_id,
        race_id: race_id,
        heat_number: heat_number,
        track_number: 2,
        status: set_as_current ? 'in_progress' : 'scheduled',
        scheduled_order: nextOrder,
        time: 0
      })
    }

    // If setting as current, first complete any existing in-progress heats
    if (set_as_current) {
      const { error: completeError } = await client
        .from('qualifiers')
        .update({ status: 'completed' })
        .eq('race_id', race_id)
        .eq('status', 'in_progress')

      if (completeError) throw completeError
    }

    // Insert the new qualifiers
    const { data: insertedQualifiers, error: insertError } = await client
      .from('qualifiers')
      .insert(qualifiers)
      .select(`
        *,
        racer:racers(
          id,
          name,
          racer_number,
          image_url
        )
      `)

    if (insertError) throw insertError

    return {
      data: {
        heat_number: heat_number,
        qualifiers: insertedQualifiers,
        set_as_current: set_as_current
      },
      error: null
    }
  } catch (error: any) {
    console.error('Error creating manual heat:', error)
    return {
      error: error.message || 'Failed to create manual heat',
      data: null
    }
  }
})