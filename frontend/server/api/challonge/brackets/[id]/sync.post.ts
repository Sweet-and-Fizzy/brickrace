import { serverSupabaseClient } from '#supabase/server'
import { syncBracketToChallonge } from '~/server/utils/challonge-sync'

export default defineEventHandler(async (event) => {
  const bracketId = getRouterParam(event, 'id')
  const client = await serverSupabaseClient(event)

  if (!bracketId) {
    throw createError({ statusCode: 400, statusMessage: 'Bracket ID is required' })
  }

  // Find race_id for this bracket
  const { data: bracket, error } = await client
    .from('brackets')
    .select('id, race_id')
    .eq('id', bracketId)
    .single()

  if (error || !bracket) {
    throw createError({ statusCode: 404, statusMessage: 'Bracket not found' })
  }

  await syncBracketToChallonge(client, (bracket as { race_id: string }).race_id, bracketId as string)

  return { success: true }
})
