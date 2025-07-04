export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  // Validate required environment variables
  const requiredEnvVars = {
    SUPABASE_URL: config.public.supabase.url,
    SUPABASE_ANON_KEY: config.public.supabase.anonKey
  }

  const missingVars = []

  for (const [name, value] of Object.entries(requiredEnvVars)) {
    if (!value || value === 'undefined') {
      missingVars.push(name)
    }
  }

  if (missingVars.length > 0) {
    const errorMessage = `Missing required environment variables: ${missingVars.join(', ')}`
    console.error(errorMessage)

    if (process.dev) {
      throw new Error(`${errorMessage}. Please check your .env file.`)
    }
  }

  // Validate Supabase URL format
  const supabaseUrl = config.public.supabase.url
  if (supabaseUrl && !supabaseUrl.match(/^https:\/\/[a-z0-9]+\.supabase\.co$/)) {
    console.warn('Supabase URL format appears invalid. Expected format: https://xxx.supabase.co')
  }
})
