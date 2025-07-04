// Application constants for The Great Holyoke Brick Race

// Photo categories
export const PHOTO_CATEGORIES = {
  CROWD: 'crowd',
  SETUP: 'setup',
  AWARDS: 'awards',
  VENUE: 'venue',
  ACTION: 'action',
  GENERAL: 'general'
}

export const PHOTO_CATEGORY_LABELS = {
  [PHOTO_CATEGORIES.CROWD]: 'Crowd Shots',
  [PHOTO_CATEGORIES.SETUP]: 'Setup & Preparation',
  [PHOTO_CATEGORIES.AWARDS]: 'Awards Ceremony',
  [PHOTO_CATEGORIES.VENUE]: 'Venue & Location',
  [PHOTO_CATEGORIES.ACTION]: 'Race Action',
  [PHOTO_CATEGORIES.GENERAL]: 'General Photos'
}

// Photo status
export const PHOTO_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
}

export const PHOTO_STATUS_LABELS = {
  [PHOTO_STATUS.PENDING]: 'Pending Review',
  [PHOTO_STATUS.APPROVED]: 'Approved',
  [PHOTO_STATUS.REJECTED]: 'Rejected'
}

// Award categories
export const AWARD_CATEGORIES = {
  SPEED: 'speed',
  CREATIVITY: 'creativity',
  ARTISTRY: 'artistry',
  SPECIAL: 'special'
}

export const AWARD_CATEGORY_LABELS = {
  [AWARD_CATEGORIES.SPEED]: 'Speed Awards',
  [AWARD_CATEGORIES.CREATIVITY]: 'Creative Design',
  [AWARD_CATEGORIES.ARTISTRY]: 'Artistic Expression',
  [AWARD_CATEGORIES.SPECIAL]: 'Special Recognition'
}

// User roles
export const USER_ROLES = {
  USER: 'user',
  RACE_ADMIN: 'race_admin',
  ADMIN: 'admin'
}

// File upload limits
export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_FILES: 10,
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
}

// API pagination
export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
}

// Toast durations (in milliseconds)
export const TOAST_DURATIONS = {
  SHORT: 3000,
  MEDIUM: 5000,
  LONG: 8000
}

// Local storage keys
export const STORAGE_KEYS = {
  DARK_MODE: 'brickrace-dark-mode',
  USER_PREFERENCES: 'brickrace-user-preferences'
}

// Animation durations (in milliseconds)
export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500
}

// Breakpoints (matching Tailwind CSS)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536
}

// Form validation rules
export const VALIDATION_RULES = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  MIN_PASSWORD_LENGTH: 8,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_NAME_LENGTH: 100
}

// Date formats
export const DATE_FORMATS = {
  DISPLAY: 'MMMM d, yyyy',
  SHORT: 'MMM d, yyyy',
  TIME: 'h:mm a',
  FULL: "EEEE, MMMM d, yyyy 'at' h:mm a"
}
