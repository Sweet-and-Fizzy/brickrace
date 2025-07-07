import { ref } from 'vue'

export const useNotifications = () => {
  const $toast = useToast()

  // Notification state
  const notifications = ref([])
  const isDuplicateCheckEnabled = ref(true)

  // Default durations (in milliseconds)
  const defaultDurations = {
    success: 4000,
    error: 6000,
    warning: 5000,
    info: 4000,
    loading: 0 // Don't auto-dismiss loading notifications
  }

  // Helper to check for duplicate notifications
  const isDuplicate = (summary, detail) => {
    if (!isDuplicateCheckEnabled.value) return false

    return notifications.value.some(
      (notification) => notification.summary === summary && notification.detail === detail
    )
  }

  // Helper to add notification to tracking
  const trackNotification = (notification) => {
    const id = Date.now() + Math.random()
    const trackedNotification = { ...notification, id, timestamp: new Date() }
    notifications.value.push(trackedNotification)

    // Auto-remove from tracking after display duration + buffer
    if (notification.life > 0) {
      setTimeout(() => {
        notifications.value = notifications.value.filter((n) => n.id !== id)
      }, notification.life + 1000)
    }

    return id
  }

  // Base notification method
  const showNotification = (severity, summary, detail, options = {}) => {
    // Check for duplicates
    if (isDuplicate(summary, detail)) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Duplicate notification prevented:', summary)
      }
      return null
    }

    const notification = {
      severity,
      summary,
      detail,
      life: options.life || defaultDurations[severity],
      closable: options.closable !== false,
      sticky: options.sticky === true,
      ...options
    }

    // Track the notification
    const id = trackNotification(notification)

    // Show the toast
    $toast.add(notification)

    return id
  }

  // Success notifications
  const success = (summary, detail, options = {}) => {
    return showNotification('success', summary, detail, options)
  }

  // Error notifications
  const error = (summary, detail, options = {}) => {
    return showNotification('error', summary, detail, {
      life: defaultDurations.error,
      ...options
    })
  }

  // Warning notifications
  const warning = (summary, detail, options = {}) => {
    return showNotification('warning', summary, detail, options)
  }

  // Info notifications
  const info = (summary, detail, options = {}) => {
    return showNotification('info', summary, detail, options)
  }

  // Loading notifications (sticky by default)
  const loading = (summary, detail = 'Please wait...', options = {}) => {
    return showNotification('info', summary, detail, {
      sticky: true,
      closable: false,
      life: 0,
      ...options
    })
  }

  // Specialized notification methods
  const uploadProgress = (filename, progress, options = {}) => {
    const summary = options.summary || 'Uploading...'
    const detail = `${filename} - ${progress}% complete`

    return showNotification('info', summary, detail, {
      sticky: true,
      closable: false,
      life: 0,
      group: 'upload-progress',
      ...options
    })
  }

  const uploadComplete = (filename, count = 1, options = {}) => {
    const summary = count === 1 ? 'Upload Complete!' : 'Uploads Complete!'
    const detail =
      count === 1
        ? `${filename} has been uploaded successfully.`
        : `${count} files have been uploaded successfully.`

    return success(summary, detail, {
      life: 5000,
      ...options
    })
  }

  const uploadError = (filename, errorMessage, options = {}) => {
    const summary = 'Upload Failed'
    const detail = `Failed to upload ${filename}. ${errorMessage || 'Please try again.'}`

    return error(summary, detail, {
      life: 8000,
      ...options
    })
  }

  const saveSuccess = (itemName = 'Item', options = {}) => {
    const summary = 'Saved Successfully!'
    const detail = `${itemName} has been saved.`

    return success(summary, detail, options)
  }

  const saveError = (itemName = 'Item', errorMessage, options = {}) => {
    const summary = 'Save Failed'
    const detail = `Failed to save ${itemName}. ${errorMessage || 'Please try again.'}`

    return error(summary, detail, options)
  }

  const deleteSuccess = (itemName = 'Item', options = {}) => {
    const summary = 'Deleted Successfully!'
    const detail = `${itemName} has been deleted.`

    return success(summary, detail, options)
  }

  const deleteError = (itemName = 'Item', errorMessage, options = {}) => {
    const summary = 'Delete Failed'
    const detail = `Failed to delete ${itemName}. ${errorMessage || 'Please try again.'}`

    return error(summary, detail, options)
  }

  const loginSuccess = (userName, options = {}) => {
    const summary = userName ? `Welcome back, ${userName}!` : 'Welcome back!'
    const detail = 'You have been successfully logged in.'

    return success(summary, detail, options)
  }

  const loginError = (errorMessage, options = {}) => {
    const summary = 'Login Failed'
    const detail = errorMessage || 'Please check your credentials and try again.'

    return error(summary, detail, options)
  }

  const registrationSuccess = (options = {}) => {
    const summary = 'Registration Successful!'
    const detail = 'Please check your email for a confirmation link to complete your registration.'

    return success(summary, detail, {
      life: 8000,
      ...options
    })
  }

  const registrationError = (errorMessage, options = {}) => {
    const summary = 'Registration Failed'
    const detail = errorMessage || 'Please try again.'

    return error(summary, detail, options)
  }

  const passwordResetSent = (options = {}) => {
    const summary = 'Reset Email Sent!'
    const detail = 'Please check your email for password reset instructions.'

    return success(summary, detail, {
      life: 8000,
      ...options
    })
  }

  const passwordResetError = (errorMessage, options = {}) => {
    const summary = 'Reset Failed'
    const detail = errorMessage || 'Failed to send reset email. Please try again.'

    return error(summary, detail, options)
  }

  const validationError = (fieldName, validationMessage, options = {}) => {
    const summary = 'Validation Error'
    const detail = fieldName ? `${fieldName}: ${validationMessage}` : validationMessage

    return warning(summary, detail, {
      life: 5000,
      ...options
    })
  }

  const networkError = (operation = 'operation', options = {}) => {
    const summary = 'Network Error'
    const detail = `Failed to complete ${operation}. Please check your connection and try again.`

    return error(summary, detail, {
      life: 7000,
      ...options
    })
  }

  const permissionError = (action = 'perform this action', options = {}) => {
    const summary = 'Permission Denied'
    const detail = `You don't have permission to ${action}.`

    return warning(summary, detail, {
      life: 6000,
      ...options
    })
  }

  const maintenanceNotice = (message, options = {}) => {
    const summary = 'Maintenance Notice'
    const detail = message || 'The system is currently undergoing maintenance.'

    return info(summary, detail, {
      sticky: true,
      life: 0,
      ...options
    })
  }

  // Confirmation dialogs (requires additional UI component)
  const confirmation = (message, callback, _options = {}) => {
    // This would require implementing a confirmation dialog component
    // For now, use browser confirm as fallback
    const confirmed = confirm(message)
    if (confirmed && callback) {
      callback()
    }
    return confirmed
  }

  // Batch notifications
  const showBatch = (notificationList) => {
    const ids = []
    notificationList.forEach((notification) => {
      const id = showNotification(
        notification.severity,
        notification.summary,
        notification.detail,
        notification.options
      )
      if (id) ids.push(id)
    })
    return ids
  }

  // Clear methods
  const clearAll = () => {
    $toast.removeAllGroups()
    notifications.value = []
  }

  const clearGroup = (groupName) => {
    $toast.removeGroup(groupName)
    notifications.value = notifications.value.filter((n) => n.group !== groupName)
  }

  // Configuration
  const enableDuplicateCheck = () => {
    isDuplicateCheckEnabled.value = true
  }

  const disableDuplicateCheck = () => {
    isDuplicateCheckEnabled.value = false
  }

  const setDefaultDuration = (severity, duration) => {
    defaultDurations[severity] = duration
  }

  return {
    // Core notification methods
    success,
    error,
    warning,
    info,
    loading,

    // Specialized notifications
    uploadProgress,
    uploadComplete,
    uploadError,
    saveSuccess,
    saveError,
    deleteSuccess,
    deleteError,
    loginSuccess,
    loginError,
    registrationSuccess,
    registrationError,
    passwordResetSent,
    passwordResetError,
    validationError,
    networkError,
    permissionError,
    maintenanceNotice,

    // Utility methods
    confirmation,
    showBatch,
    clearAll,
    clearGroup,

    // Configuration
    enableDuplicateCheck,
    disableDuplicateCheck,
    setDefaultDuration,

    // State (read-only)
    notifications: readonly(notifications)
  }
}
