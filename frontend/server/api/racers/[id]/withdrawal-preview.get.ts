import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'

/**
 * Preview the impact of withdrawing a racer from a race
 * GET /api/racers/[id]/withdrawal-preview?race_id=xxx
 */
export default defineEventHandler(async (event) => {
  const racerId = getRouterParam(event, 'id')
  const query = getQuery(event)
  const raceId = query.race_id as string

  // Validate required fields
  if (!racerId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Racer ID is required'
    })
  }

  if (!raceId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'race_id query parameter is required'
    })
  }

  // Check authentication
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required'
    })
  }

  const client = await serverSupabaseServiceRole(event)

  try {
    // Check permissions (race admin or racer owner)
    const isAdmin = user.user_metadata?.isRaceAdmin || user.user_metadata?.isAdmin || false

    // Get racer details and check ownership
    const { data: racer, error: racerError } = await client
      .from('racers')
      .select('id, name, racer_number, user_id')
      .eq('id', racerId)
      .single()

    if (racerError || !racer) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Racer not found'
      })
    }

    const isRacerOwner = racer.user_id === user.id

    if (!isAdmin && !isRacerOwner) {
      throw createError({
        statusCode: 403,
        statusMessage:
          'You can only preview withdrawals for your own racers or if you are a race admin'
      })
    }

    // Check if already withdrawn
    const { data: existingWithdrawal } = await client
      .from('race_withdrawals')
      .select('id')
      .eq('race_id', raceId)
      .eq('racer_id', racerId)
      .single()

    if (existingWithdrawal) {
      return {
        success: true,
        already_withdrawn: true,
        racer,
        impact: null
      }
    }

    // Call preview functions for both heats and brackets
    const { data: heatPreview, error: heatPreviewError } = await client.rpc(
      'preview_withdrawal_heat_impact',
      {
        target_race_id: raceId,
        target_racer_id: racerId
      }
    )

    if (heatPreviewError) {
      console.error('Heat preview error:', heatPreviewError)
    }

    const { data: bracketPreview, error: bracketPreviewError } = await client.rpc(
      'preview_withdrawal_bracket_impact',
      {
        target_race_id: raceId,
        target_racer_id: racerId
      }
    )

    if (bracketPreviewError) {
      console.error('Bracket preview error:', bracketPreviewError)
    }

    return {
      success: true,
      already_withdrawn: false,
      racer,
      impact: heatPreview,
      bracket_impact: bracketPreview
    }
  } catch (error: any) {
    console.error('Withdrawal preview error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to preview withdrawal'
    })
  }
})
