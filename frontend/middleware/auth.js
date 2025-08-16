export default defineNuxtRouteMiddleware(async () => {
  const supabase = useSupabaseClient()

  // This will run on client-side only
  if (import.meta.client) {
    const {
      data: { session }
    } = await supabase.auth.getSession()

    if (!session) {
      return navigateTo('/login')
    }
  }
})
