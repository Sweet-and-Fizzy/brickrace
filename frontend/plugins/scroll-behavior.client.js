export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.$router.options.scrollBehavior = (to, from, savedPosition) => {
    // If there's a saved position (back/forward navigation), restore it
    if (savedPosition) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(savedPosition)
        }, 100)
      })
    }

    // If navigating to a hash (anchor), scroll to it
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth'
      }
    }

    // Otherwise scroll to top
    return { top: 0, behavior: 'smooth' }
  }
})
