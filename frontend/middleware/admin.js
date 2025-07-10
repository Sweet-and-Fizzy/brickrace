import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware(async () => {
  // Only run on client-side where Supabase is available
  if (import.meta.server) {
    return
  }

  const authStore = useAuthStore()

  // Initialize auth if not already done
  if (!authStore.user) {
    await authStore.initAuth()
  }

  if (!authStore.isAuthenticated) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required'
    })
  }

  if (!authStore.isRaceAdmin) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied. Admin privileges required.'
    })
  }
})
