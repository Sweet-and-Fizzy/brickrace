import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore()

  // Initialize auth if not already done
  if (!authStore.user) {
    return authStore.initAuth().then(() => {
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
