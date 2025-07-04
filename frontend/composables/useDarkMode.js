export const useDarkMode = () => {
  const isDark = ref(false)
  const STORAGE_KEY = 'brickrace-dark-mode'
  const CSS_CLASS = 'app-dark'

  // Initialize dark mode from localStorage or system preference
  const initDarkMode = () => {
    if (!import.meta.client) return

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored !== null) {
        isDark.value = stored === 'true'
      } else {
        // Use system preference
        isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
      }
      applyDarkMode()
    } catch (error) {
      console.warn('Failed to initialize dark mode:', error)
      // Fallback to light mode
      isDark.value = false
      applyDarkMode()
    }
  }

  // Apply dark mode class to document
  const applyDarkMode = () => {
    if (!import.meta.client) return

    try {
      if (isDark.value) {
        document.documentElement.classList.add(CSS_CLASS)
      } else {
        document.documentElement.classList.remove(CSS_CLASS)
      }
    } catch (error) {
      console.warn('Failed to apply dark mode:', error)
    }
  }

  // Toggle dark mode
  const toggleDarkMode = () => {
    isDark.value = !isDark.value
    if (import.meta.client) {
      try {
        localStorage.setItem(STORAGE_KEY, isDark.value.toString())
        applyDarkMode()
      } catch (error) {
        console.warn('Failed to save dark mode preference:', error)
      }
    }
  }

  // Set dark mode explicitly
  const setDarkMode = (value) => {
    isDark.value = value
    if (import.meta.client) {
      try {
        localStorage.setItem(STORAGE_KEY, isDark.value.toString())
        applyDarkMode()
      } catch (error) {
        console.warn('Failed to save dark mode preference:', error)
      }
    }
  }

  // Listen for system theme changes
  const watchSystemTheme = () => {
    if (!import.meta.client) return

    try {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.addEventListener('change', (e) => {
        // Only update if user hasn't set a preference
        if (localStorage.getItem(STORAGE_KEY) === null) {
          isDark.value = e.matches
          applyDarkMode()
        }
      })
    } catch (error) {
      console.warn('Failed to watch system theme changes:', error)
    }
  }

  return {
    isDark: readonly(isDark),
    initDarkMode,
    toggleDarkMode,
    setDarkMode,
    watchSystemTheme
  }
}
