import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const raceId = getRouterParam(event, 'id')
  
  if (!raceId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Race ID is required'
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

  // Check admin permissions (only full admins can delete races)
  const isAdmin = user.user_metadata?.isAdmin
  if (!isAdmin) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Full admin privileges required to delete races'
    })
  }

  const supabase = await serverSupabaseServiceRole(event)

  try {
    // Check if race exists
    const { data: race, error: fetchError } = await supabase
      .from('races')
      .select('id, name')
      .eq('id', raceId)
      .single()

    if (fetchError) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Race not found'
      })
    }

    // Delete race (this will cascade delete related data due to foreign key constraints)
    const { error: deleteError } = await supabase
      .from('races')
      .delete()
      .eq('id', raceId)

    if (deleteError) {
      console.error('Race deletion error:', deleteError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to delete race'
      })
    }

    // Log the deletion for audit purposes
    console.log(`Race deleted by admin: ${user.email} deleted race "${race.name}" (ID: ${raceId})`)

    return {
      success: true,
      message: `Race "${race.name}" has been successfully deleted`
    }
  } catch (error) {
    console.error('Error deleting race:', error)
    
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error while deleting race'
    })
  }
})