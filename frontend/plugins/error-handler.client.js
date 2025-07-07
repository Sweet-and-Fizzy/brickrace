export default defineNuxtPlugin((nuxtApp) => {
  // Helper to safely show toast messages
  const showToast = (message) => {
    try {
      // Try to use the PrimeVue ToastService directly
      const toastService = nuxtApp.$primevue?.config?.ToastService
      if (toastService) {
        toastService.add(message)
      } else {
        // Fallback to browser notification if available
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(message.summary, {
            body: message.detail,
            icon: '/favicon.ico'
          })
        }
      }
    } catch (err) {
      // Silent fallback - just log to console
      // Keep essential error logging for production debugging
      console.warn('Could not show error toast:', err)
    }
  }

  // Global error handler for unhandled errors
  nuxtApp.vueApp.config.errorHandler = (error, context) => {
    // Keep essential error logging for production debugging
    console.error('Global error handler:', error, context)

    // You could integrate with error tracking service here
    // e.g., Sentry, LogRocket, etc.

    // Show user-friendly error message
    if (import.meta.client) {
      showToast({
        severity: 'error',
        summary: 'Unexpected Error',
        detail:
          'Something went wrong. Please try again or contact support if the problem persists.',
        life: 5000
      })
    }
  }

  // Handle unhandled promise rejections
  if (import.meta.client) {
    window.addEventListener('unhandledrejection', (event) => {
      // Keep essential error logging for production debugging
      console.error('Unhandled promise rejection:', event.reason)

      showToast({
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
