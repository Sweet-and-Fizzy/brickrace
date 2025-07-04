// Global loading state management
const isLoading = ref(false)
const loadingStack = ref(new Set())

export const useGlobalLoading = () => {
  // Start loading with optional identifier
  const startLoading = (id = 'default') => {
    loadingStack.value.add(id)
    isLoading.value = true
  }

  // Stop loading with optional identifier
  const stopLoading = (id = 'default') => {
    loadingStack.value.delete(id)
    isLoading.value = loadingStack.value.size > 0
  }

  // Clear all loading states
  const clearLoading = () => {
    loadingStack.value.clear()
    isLoading.value = false
  }

  // Check if specific loading is active
  const isLoadingId = (id) => {
    return loadingStack.value.has(id)
  }

  return {
    isLoading: readonly(isLoading),
    startLoading,
    stopLoading,
    clearLoading,
    isLoadingId
  }
}

// Async wrapper that automatically manages loading state
export const useAsyncOperation = () => {
  const { startLoading, stopLoading } = useGlobalLoading()

  const executeWithLoading = async (operation, loadingId = 'async-operation') => {
    try {
      startLoading(loadingId)
      return await operation()
    } finally {
      stopLoading(loadingId)
    }
  }

  return {
    executeWithLoading
  }
}
