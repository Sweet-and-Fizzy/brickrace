export default defineNuxtPlugin((nuxtApp) => {
  // Global error handler for unhandled errors
  nuxtApp.vueApp.config.errorHandler = (error, context) => {
    console.error('Global error handler:', error, context)

    // You could integrate with error tracking service here
    // e.g., Sentry, LogRocket, etc.

    // Show user-friendly error message
    if (process.client) {
      // Only show toast on client side
      const toast = useToast()
      toast.add({
        severity: 'error',
        summary: 'Unexpected Error',
        detail:
          'Something went wrong. Please try again or contact support if the problem persists.',
        life: 5000
      })
    }
  }

  // Handle unhandled promise rejections
  if (process.client) {
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason)

      const toast = useToast()
      toast.add({
        severity: 'error',
        summary: 'Network Error',
        detail: 'Failed to complete request. Please check your connection and try again.',
        life: 5000
      })

      // Prevent the default browser behavior
      event.preventDefault()
    })
  }
})
