import { VALIDATION_RULES, UPLOAD_LIMITS } from './constants.js'

// Format file size for display
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Validate email format
export const isValidEmail = (email) => {
  return VALIDATION_RULES.EMAIL_REGEX.test(email)
}

// Validate password strength
export const isValidPassword = (password) => {
  return password && password.length >= VALIDATION_RULES.MIN_PASSWORD_LENGTH
}

// Validate file for upload
export const validateUploadFile = (file) => {
  const errors = []

  // Check file size
  if (file.size > UPLOAD_LIMITS.MAX_FILE_SIZE) {
    errors.push(`File size must be less than ${formatFileSize(UPLOAD_LIMITS.MAX_FILE_SIZE)}`)
  }

  // Check file type
  if (!UPLOAD_LIMITS.ALLOWED_TYPES.includes(file.type)) {
    errors.push('File type not supported. Please use JPG, PNG, GIF, or WebP.')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Debounce function for performance optimization
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Throttle function for performance optimization
export const throttle = (func, limit) => {
  let inThrottle
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// Generate random ID
export const generateId = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Capitalize first letter
export const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// Truncate text with ellipsis
export const truncate = (text, length = 100) => {
  if (text.length <= length) return text
  return text.substring(0, length).trim() + '...'
}

// Deep clone object
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj))
}

// Check if object is empty
export const isEmpty = (obj) => {
  return Object.keys(obj).length === 0
}

// Format race time for display
export const formatRaceTime = (timeInSeconds) => {
  if (!timeInSeconds || Number.isNaN(timeInSeconds)) return 'N/A'

  const minutes = Math.floor(timeInSeconds / 60)
  const seconds = (timeInSeconds % 60).toFixed(2)

  if (minutes > 0) {
    return `${minutes}:${seconds.padStart(5, '0')}`
  }
  return `${seconds}s`
}

// Sort racers by time (with null times last)
export const sortByTime = (racers, timeField = 'best_time') => {
  return [...racers].sort((a, b) => {
    const timeA = a[timeField]
    const timeB = b[timeField]

    // Handle null/undefined times
    if (timeA === null || timeA === undefined) return 1
    if (timeB === null || timeB === undefined) return -1

    return timeA - timeB
  })
}

// Generate a slug from text
export const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

// Get file extension from filename
export const getFileExtension = (filename) => {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2)
}

// Check if value is a valid number
export const isNumber = (value) => {
  return !Number.isNaN(value) && !Number.isNaN(Number.parseFloat(value))
}

// Safe JSON parse with fallback
export const safeJsonParse = (jsonString, fallback = null) => {
  try {
    return JSON.parse(jsonString)
  } catch {
    return fallback
  }
}

// Format date for display
export const formatDate = (date, options = {}) => {
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }

  return new Date(date).toLocaleDateString('en-US', { ...defaultOptions, ...options })
}

// Format date and time for display
export const formatDateTime = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

// Safely extract photo URL from various photo object formats
export const getPhotoUrl = (photo) => {
  if (!photo) return null

  // If it's already a string URL
  if (typeof photo === 'string') return photo

  // If it's an object with url property
  if (photo.url) return photo.url

  // If it's an object that might be a URL itself
  if (typeof photo === 'object' && !photo.url) {
    // Handle cases where the object itself might represent a URL
    return null
  }

  return null
}

// Filter photos to only include those with valid URLs
export const filterValidPhotos = (photos) => {
  if (!Array.isArray(photos)) return []

  return photos.filter((photo) => {
    const url = getPhotoUrl(photo)
    return url && typeof url === 'string' && url.trim().length > 0
  })
}
