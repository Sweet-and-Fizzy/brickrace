import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const client = await serverSupabaseClient(event)

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Race slug is required'
    })
  }

  try {
    // Convert slug back to race name (replace hyphens with spaces)
    const raceName = slug.replace(/-/g, ' ')
    
    const { data: race, error } = await client
      .from('races')
      .select('*')
      .ilike('name', raceName)
      .single()

    if (error || !race) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Race not found'
      })
    }

    return {
      data: race
    }
  } catch (error: any) {
    // Re-throw createError instances
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to get race'
    })
  }
})