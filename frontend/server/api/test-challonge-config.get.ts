export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  
  return {
    hasApiKey: !!config.challongeApiKey,
    hasUsername: !!config.challongeUsername,
    apiKeyLength: config.challongeApiKey?.length || 0,
    username: config.challongeUsername || 'not set'
  }
})