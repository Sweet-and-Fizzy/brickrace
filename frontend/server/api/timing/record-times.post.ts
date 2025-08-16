/**
 * Timing System API: Record Heat Times
 * POST /api/timing/record-times
 * 
 * Headers: { "X-API-Key": "your-timing-api-key" }
 * Body: { 
 *   heat_number: number,
 *   track1_time?: number,
 *   track2_time?: number,
 *   auto_advance?: boolean  // Default: true
 * }
 */

import { requireTimingAuth, logTimingRequest, createTimingSupabaseClient } from '~/utils/timing-auth'

export default defineEventHandler(async (event) => {
  // Validate API key
  await requireTimingAuth(event)
  
  const client = await createTimingSupabaseClient(event)
  const body = await readBody(event)
  
  const { 
    heat_number, 
    track1_time, 
    track2_time, 
    auto_advance = true 
  } = body
  
  if (!heat_number || typeof heat_number !== 'number') {
    throw createError({
      statusCode: 400,
      statusMessage: 'heat_number is required and must be a number'
    })
  }
  
  if (!track1_time && !track2_time) {
    throw createError({
      statusCode: 400,
      statusMessage: 'At least one of track1_time or track2_time is required'
    })
  }
  
  try {
    logTimingRequest(event, 'RECORD_TIMES', { 
      heat_number, 
      track1_time, 
      track2_time, 
      auto_advance 
    })
    
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
    
    let nextHeatInfo = null
    
    // If auto_advance is enabled, start the next heat automatically
    if (auto_advance) {
      try {
        const { data: nextHeat } = await client
          .from('qualifiers')
          .select('heat_number')
          .eq('race_id', (
            await client
              .from('races')
              .select('id')
              .eq('active', true)
              .single()
          ).data?.id)
          .eq('status', 'scheduled')
          .order('scheduled_order')
          .limit(1)
          .single()
        
        if (nextHeat) {
          await client.rpc('start_heat', { heat_num: nextHeat.heat_number })
          nextHeatInfo = nextHeat
          
          logTimingRequest(event, 'AUTO_START_NEXT_HEAT', { 
            completed_heat: heat_number,
            next_heat: nextHeat.heat_number 
          })
        }
      } catch (nextHeatError) {
        // Don't fail the main operation if auto-advance fails
        logTimingRequest(event, 'AUTO_ADVANCE_WARNING', { 
          heat_number, 
          error: 'No next heat available or failed to start' 
        })
      }
    }
    
    logTimingRequest(event, 'RECORD_TIMES_SUCCESS', { 
      heat_number, 
      track1_time, 
      track2_time,
      next_heat_started: !!nextHeatInfo
    })
    
    return {
      success: true,
      message: `Heat ${heat_number} completed successfully`,
      heat_number,
      times: {
        track1: track1_time,
        track2: track2_time
      },
      next_heat_started: !!nextHeatInfo,
      next_heat_number: nextHeatInfo?.heat_number || null
    }
  } catch (error: any) {
    logTimingRequest(event, 'RECORD_TIMES_ERROR', { 
      heat_number, 
      track1_time, 
      track2_time, 
      error: error.message 
    })
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to record heat times'
    })
  }
})