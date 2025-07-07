/**
 * Image resizing utility for optimizing uploads
 */

/* global File, URL */

// Default resize options
const DEFAULT_OPTIONS = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.8,
  format: 'jpeg'
}

/**
 * Resize an image file to optimize for web display
 * @param {File} file - The original image file
 * @param {object} options - Resize options
 * @returns {Promise<File>} - Resized image file
 */
export const resizeImage = (file, options = {}) => {
  return new Promise((resolve, reject) => {
    // Skip resizing for non-image files
    if (!file.type.startsWith('image/')) {
      resolve(file)
      return
    }

    const config = { ...DEFAULT_OPTIONS, ...options }

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      try {
        // Calculate new dimensions
        let { width, height } = img

        // Only resize if image is larger than max dimensions
        if (width > config.maxWidth || height > config.maxHeight) {
          const ratio = Math.min(config.maxWidth / width, config.maxHeight / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }

        // Set canvas dimensions
        canvas.width = width
        canvas.height = height

        // Draw resized image
        ctx.drawImage(img, 0, 0, width, height)

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to resize image'))
              return
            }

            // Create new file with resized data
            const resizedFile = new File([blob], file.name, {
              type: `image/${config.format}`,
              lastModified: Date.now()
            })

            resolve(resizedFile)
          },
          `image/${config.format}`,
          config.quality
        )
      } catch (error) {
        reject(error)
      }
    }

    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }

    // Load image from file
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Get optimal resize options based on file size and type
 * @param {File} file - The image file
 * @returns {object} - Resize options
 */
export const getResizeOptions = (file) => {
  const fileSizeMB = file.size / (1024 * 1024)

  // For very large files (>5MB), use more aggressive compression
  if (fileSizeMB > 5) {
    return {
      maxWidth: 1600,
      maxHeight: 900,
      quality: 0.7,
      format: 'jpeg'
    }
  }

  // For large files (2-5MB), use moderate compression
  if (fileSizeMB > 2) {
    return {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 0.8,
      format: 'jpeg'
    }
  }

  // For smaller files, use minimal compression
  return {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.9,
    format: 'jpeg'
  }
}

/**
 * Check if an image needs resizing
 * @param {File} file - The image file
 * @returns {boolean} - Whether resizing is recommended
 */
export const needsResizing = (file) => {
  if (!file.type.startsWith('image/')) {
    return false
  }

  const fileSizeMB = file.size / (1024 * 1024)
  return fileSizeMB > 1 // Resize if larger than 1MB
}
