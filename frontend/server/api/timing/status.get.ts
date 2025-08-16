/**
 * Timing System API: Get Race Status
 * GET /api/timing/status
 * 
 * Headers: { "X-API-Key": "your-timing-api-key" }
 * 
 * Returns current race status, active heat, and upcoming heats
 * for the timing system to know what's happening
 */

import { requireTimingAuth, logTimingRequest, createTimingSupabaseClient } from '~/utils/timing-auth'

export default defineEventHandler(async (event) => {
  // Validate JWT token
  await requireTimingAuth(event)
  
  const client = await createTimingSupabaseClient(event)
  
  try {
    logTimingRequest(event, 'STATUS_CHECK')
    
    // Get active race
    const { data: activeRace, error: raceError } = await client
      .from('races')
      .select('*')
      .eq('active', true)
      .single()
    
    if (raceError || !activeRace) {
      return {
        race: null,
        current_heat: null,
        upcoming_heats: [],
        message: 'No active race found'
      }
    }
    
    // Get current heat (in progress)
    const { data: currentHeat } = await client
      .from('qualifiers')
      .select(`
        *,
        racer:racers(
          id,
          name,
          racer_number,
          image_url
        )
      `)
      .eq('race_id', activeRace.id)
      .eq('status', 'in_progress')
      .order('track_number')
    
    // Get next few heats
    const { data: upcomingHeats } = await client
      .rpc('get_next_heats', { heat_count: 5 })
    
    // Format current heat data
    const currentHeatFormatted = currentHeat && currentHeat.length > 0 ? {
      heat_number: currentHeat[0].heat_number,
      status: 'in_progress',
      racers: currentHeat.map(q => ({
        track_number: q.track_number,
        racer_id: q.racer_id,
        racer_name: q.racer?.name,
        racer_number: q.racer?.racer_number,
        current_time: q.time
      }))
    } : null
    
    // Group upcoming heats by heat number
    const upcomingHeatsFormatted = upcomingHeats ? 
      Object.values(upcomingHeats.reduce((acc: any, heat: any) => {
        if (!acc[heat.heat_number]) {
          acc[heat.heat_number] = {
            heat_number: heat.heat_number,
            scheduled_order: heat.scheduled_order,
            status: heat.status,
            racers: []
          }
        }
        acc[heat.heat_number].racers.push({
          track_number: heat.track_number,
          racer_id: heat.racer_id,
          racer_name: heat.racer_name,
          racer_number: heat.racer_number
        })
        return acc
      }, {})) : []
    
    // Count total heats and completed heats for progress tracking
    const { count: totalHeats } = await client
      .from('qualifiers')
      .select('heat_number', { count: 'exact', head: true })
      .eq('race_id', activeRace.id)
      .not('heat_number', 'is', null)
    
    const { count: completedHeats } = await client
      .from('qualifiers')
      .select('heat_number', { count: 'exact', head: true })
      .eq('race_id', activeRace.id)
      .eq('status', 'completed')
      .not('heat_number', 'is', null)
    
    const uniqueHeatsTotal = totalHeats ? Math.ceil(totalHeats / 2) : 0 // 2 racers per heat
    const uniqueHeatsCompleted = completedHeats ? Math.ceil(completedHeats / 2) : 0
    
    return {
      race: {
        id: activeRace.id,
        name: activeRace.name,
        date: activeRace.date
      },
      current_heat: currentHeatFormatted,
      upcoming_heats: upcomingHeatsFormatted,
      progress: {
        total_heats: uniqueHeatsTotal,
        completed_heats: uniqueHeatsCompleted,
        remaining_heats: uniqueHeatsTotal - uniqueHeatsCompleted,
        percent_complete: uniqueHeatsTotal > 0 ? Math.round((uniqueHeatsCompleted / uniqueHeatsTotal) * 100) : 0
      },
      timestamp: new Date().toISOString()
    }
  } catch (error: any) {
    logTimingRequest(event, 'STATUS_ERROR', { error: error.message })
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to get race status'
    })
  }
})