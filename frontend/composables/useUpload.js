import { ref, computed, reactive } from 'vue'
import { useAuthStore } from '~/stores/auth'

/* global File, URL */

export const useUpload = (options = {}) => {
  const { $supabase } = useNuxtApp()
  const authStore = useAuthStore()
  const notifications = useNotifications()

  // Configuration
  const config = reactive({
    // File validation
    maxFileSize: options.maxFileSize || 10 * 1024 * 1024, // 10MB default
    allowedTypes: options.allowedTypes || ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    maxFiles: options.maxFiles || 10,

    // Storage configuration
    bucket: options.bucket || 'photos',
    basePath: options.basePath || '',

    // Notification preferences
    showProgress: options.showProgress !== false,
    showSuccess: options.showSuccess !== false,
    showErrors: options.showErrors !== false,

    // Auto-resize images
    autoResize: options.autoResize === true,
    maxWidth: options.maxWidth || 1920,
    maxHeight: options.maxHeight || 1080,
    quality: options.quality || 0.8
  })

  // Upload state
  const uploading = ref(false)
  const uploadQueue = ref([])
  const completed = ref([])
  const failed = ref([])
  const totalFiles = ref(0)
  const completedFiles = ref(0)
  const errors = ref([])

  // Computed properties
  const progress = computed(() => {
    if (totalFiles.value === 0) return 0
    return Math.round((completedFiles.value / totalFiles.value) * 100)
  })

  const isComplete = computed(() => {
    return totalFiles.value > 0 && completedFiles.value === totalFiles.value
  })

  const hasErrors = computed(() => failed.value.length > 0)

  const hasSuccessfulUploads = computed(() => completed.value.length > 0)

  // File validation
  const validateFile = (file) => {
    const errors = []

    // Check file size
    if (file.size > config.maxFileSize) {
      errors.push(`File size must be less than ${formatFileSize(config.maxFileSize)}`)
    }

    // Check file type
    if (!config.allowedTypes.includes(file.type)) {
      errors.push(`File type not allowed. Allowed types: ${config.allowedTypes.join(', ')}`)
    }

    // Check file name
    if (!file.name || file.name.length > 100) {
      errors.push('File name must be between 1 and 100 characters')
    }

    return errors
  }

  const validateFiles = (files) => {
    const fileArray = Array.from(files)
    const allErrors = []

    // Check number of files
    if (fileArray.length > config.maxFiles) {
      allErrors.push(`Maximum ${config.maxFiles} files allowed`)
      return allErrors
    }

    // Validate each file
    fileArray.forEach((file, index) => {
      const fileErrors = validateFile(file)
      if (fileErrors.length > 0) {
        allErrors.push(`File ${index + 1} (${file.name}): ${fileErrors.join(', ')}`)
      }
    })

    return allErrors
  }

  // Image processing
  const resizeImage = (file) => {
    return new Promise((resolve) => {
      if (!config.autoResize || !file.type.startsWith('image/')) {
        resolve(file)
        return
      }

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img

        if (width > config.maxWidth || height > config.maxHeight) {
          const ratio = Math.min(config.maxWidth / width, config.maxHeight / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }

        // Resize image
        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)

        // Convert back to file
        canvas.toBlob(
          (blob) => {
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            })
            resolve(resizedFile)
          },
          file.type,
          config.quality
        )
      }

      img.onerror = () => resolve(file)
      img.src = URL.createObjectURL(file)
    })
  }

  // Generate unique file path
  const generateFilePath = (file, customPath) => {
    if (customPath) return customPath

    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 15)
    const extension = file.name.split('.').pop()
    const userId = authStore.user?.id || 'anonymous'

    return `${config.basePath}/${userId}/${timestamp}-${random}.${extension}`.replace(/\/+/g, '/')
  }

  // Upload single file to storage
  const uploadFileToStorage = async (file, filePath) => {
    try {
      // Process image if needed
      const processedFile = await resizeImage(file)

      // Upload to Supabase storage
      const { data, error } = await $supabase.storage
        .from(config.bucket)
        .upload(filePath, processedFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      // Get public URL
      const { data: urlData } = $supabase.storage.from(config.bucket).getPublicUrl(filePath)

      return {
        success: true,
        path: data.path,
        url: urlData.publicUrl,
        size: processedFile.size,
        originalName: file.name
      }
    } catch (error) {
      // Keep essential error logging for production debugging
      console.error('Storage upload error:', error)
      throw error
    }
  }

  // Upload multiple files
  const uploadFiles = async (files, metadata = {}) => {
    const fileArray = Array.from(files)

    // Validate files
    const validationErrors = validateFiles(fileArray)
    if (validationErrors.length > 0) {
      errors.value = validationErrors
      if (config.showErrors) {
        notifications.error('Validation Failed', validationErrors.join('\n'))
      }
      return { success: false, errors: validationErrors }
    }

    // Reset state
    uploading.value = true
    uploadQueue.value = []
    completed.value = []
    failed.value = []
    errors.value = []
    totalFiles.value = fileArray.length
    completedFiles.value = 0

    // Show progress notification
    let progressNotificationId = null
    if (config.showProgress) {
      progressNotificationId = notifications.uploadProgress(
        `${fileArray.length} file${fileArray.length !== 1 ? 's' : ''}`,
        0
      )
    }

    const results = []

    try {
      // Process files sequentially to avoid overwhelming the server
      for (const [index, file] of fileArray.entries()) {
        try {
          // Generate file path
          const filePath = generateFilePath(file, metadata.customPaths?.[index])

          // Add to queue
          const queueItem = {
            file,
            filePath,
            status: 'uploading',
            progress: 0,
            result: null
          }
          uploadQueue.value.push(queueItem)

          // Upload file
          const result = await uploadFileToStorage(file, filePath, (progress) => {
            queueItem.progress = progress
          })

          // Update queue item
          queueItem.status = 'completed'
          queueItem.result = result

          // Add to completed
          completed.value.push({
            file,
            result,
            metadata: metadata.fileMetadata?.[index] || {}
          })

          results.push({ success: true, file, result })
        } catch (error) {
          // Keep essential error logging for production debugging
          console.error(`Failed to upload ${file.name}:`, error)

          // Add to failed
          failed.value.push({
            file,
            error: error.message
          })

          results.push({ success: false, file, error: error.message })

          if (config.showErrors) {
            notifications.uploadError(file.name, error.message)
          }
        } finally {
          completedFiles.value++

          // Update progress notification
          if (progressNotificationId) {
            notifications.uploadProgress(
              `${fileArray.length} file${fileArray.length !== 1 ? 's' : ''}`,
              progress.value
            )
          }
        }
      }

      // Show completion notification
      if (config.showSuccess && completed.value.length > 0) {
        const successCount = completed.value.length
        const fileName = successCount === 1 ? completed.value[0].file.name : `${successCount} files`
        notifications.uploadComplete(fileName, successCount)
      }

      // Clear progress notification
      if (progressNotificationId) {
        notifications.clearGroup('upload-progress')
      }

      return {
        success: failed.value.length === 0,
        completed: completed.value,
        failed: failed.value,
        results
      }
    } catch (error) {
      // Keep essential error logging for production debugging
      console.error('Upload process error:', error)

      if (config.showErrors) {
        notifications.error('Upload Failed', 'An unexpected error occurred during upload.')
      }

      return {
        success: false,
        error: error.message,
        completed: completed.value,
        failed: failed.value,
        results
      }
    } finally {
      uploading.value = false
    }
  }

  // Upload single file (convenience method)
  const uploadFile = async (file, customPath, metadata = {}) => {
    const result = await uploadFiles([file], {
      customPaths: customPath ? [customPath] : undefined,
      fileMetadata: [metadata]
    })

    if (result.success && result.completed.length > 0) {
      return {
        success: true,
        result: result.completed[0].result
      }
    }

    return {
      success: false,
      error: result.failed[0]?.error || result.error
    }
  }

  // Delete file from storage
  const deleteFile = async (filePath) => {
    try {
      const { error } = await $supabase.storage.from(config.bucket).remove([filePath])

      if (error) throw error

      return { success: true }
    } catch (error) {
      // Keep essential error logging for production debugging
      console.error('Delete file error:', error)
      return { success: false, error: error.message }
    }
  }

  // Get file URL
  const getFileUrl = (filePath) => {
    const { data } = $supabase.storage.from(config.bucket).getPublicUrl(filePath)

    return data.publicUrl
  }

  // Clear upload state
  const clearState = () => {
    uploadQueue.value = []
    completed.value = []
    failed.value = []
    errors.value = []
    totalFiles.value = 0
    completedFiles.value = 0
  }

  // Utility functions
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const isImageFile = (file) => {
    return file.type.startsWith('image/')
  }

  const getFileExtension = (filename) => {
    return filename.split('.').pop().toLowerCase()
  }

  return {
    // State
    uploading: readonly(uploading),
    uploadQueue: readonly(uploadQueue),
    completed: readonly(completed),
    failed: readonly(failed),
    errors: readonly(errors),

    // Computed
    progress,
    isComplete,
    hasErrors,
    hasSuccessfulUploads,
    totalFiles: readonly(totalFiles),
    completedFiles: readonly(completedFiles),

    // Methods
    uploadFiles,
    uploadFile,
    deleteFile,
    getFileUrl,
    validateFile,
    validateFiles,
    clearState,

    // Utilities
    formatFileSize,
    isImageFile,
    getFileExtension,

    // Configuration
    config
  }
}
