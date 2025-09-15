import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const racerId = getRouterParam(event, 'id')
  const body = await readBody(event)

  const { withdrawn, race_id, reason } = body

  if (!racerId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Racer ID is required'
    })
  }

  if (!race_id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Race ID is required'
    })
  }

  if (typeof withdrawn !== 'boolean') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Withdrawn status must be a boolean'
    })
  }

  try {
    // Get current user
    const {
      data: { user },
      error: authError
    } = await client.auth.getUser()
    if (authError || !user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      })
    }

    // Check if user has permission (race admin via JWT metadata or racer owner)
    const isAdmin = user.user_metadata?.isRaceAdmin || user.user_metadata?.isAdmin || false

    // Check if user owns the racer
    const { data: racerOwnerCheck, error: racerError } = await client
      .from('racers')
      .select('id')
      .eq('id', racerId)
      .eq('user_id', user.id)
      .single()

    const isRacerOwner = !racerError && racerOwnerCheck

    if (!isAdmin && !isRacerOwner) {
      throw createError({
        statusCode: 403,
        statusMessage: 'You can only withdraw/reinstate your own racers or if you are a race admin'
      })
    }

    if (withdrawn) {
      // First get preview of heat impact
      const { data: heatImpact, error: previewError } = await client.rpc(
        'preview_withdrawal_heat_impact',
        {
          target_race_id: race_id,
          target_racer_id: racerId
        }
      )

      if (previewError) {
        console.error('Heat impact preview error:', previewError)
        // Continue anyway - this is just for information
      }

      // Withdraw racer from race - insert withdrawal record
      const { data: withdrawal, error } = await client
        .from('race_withdrawals')
        .upsert({
          race_id,
          racer_id: racerId,
          reason,
          withdrawn_by: user.id
        })
        .select('*')
        .single()

      if (error) {
        throw error
      }

      // Handle existing heats (remove from scheduled, preserve completed)
      const { data: heatChanges, error: heatError } = await client.rpc(
        'handle_racer_withdrawal_heats',
        {
          target_race_id: race_id,
          target_racer_id: racerId
        }
      )

      if (heatError) {
        console.error('Heat handling error:', heatError)
        // Don't fail the withdrawal, but log the issue
      }

      return {
        success: true,
        withdrawal,
        heatImpact: heatImpact || null,
        heatChanges: heatChanges || null,
        message: 'Racer withdrawn from race. Scheduled heats removed, completed results preserved.'
      }
    } else {
      // Reinstate racer - remove withdrawal record
      const { error } = await client
        .from('race_withdrawals')
        .delete()
        .eq('race_id', race_id)
        .eq('racer_id', racerId)

      if (error) {
        throw error
      }

      return {
        success: true,
        message: 'Racer reinstated to race'
      }
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to update racer withdrawal status'
    })
  }
})
