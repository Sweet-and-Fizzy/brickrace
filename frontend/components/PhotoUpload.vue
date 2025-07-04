<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Photo Gallery</h3>
      <Badge v-if="maxPhotos" :value="`${photos.length}/${maxPhotos} photos`" />
    </div>

    <!-- Upload Area -->
    <Card v-if="canUpload" class="border-2 border-dashed border-gray-300 dark:border-gray-600">
      <template #content>
        <FileUpload
          ref="fileUpload"
          name="photos"
          :multiple="true"
          accept="image/*"
          :max-file-size="2000000"
          :disabled="isAtMaxPhotos"
          :custom-upload="true"
          :pt="{
            root: { class: 'border-0' },
            chooseButton: {
              class: isAtMaxPhotos
                ? 'bg-gray-400 border-gray-400 cursor-not-allowed'
                : 'bg-blue-600 border-blue-600 hover:bg-blue-700'
            }
          }"
          @uploader="onUpload"
          @select="onSelect"
          @error="onError"
        >
          <template #header="{ chooseCallback, clearCallback, files }">
            <div class="flex flex-wrap justify-between items-center flex-1 gap-2">
              <div class="flex gap-2">
                <Button
                  icon="pi pi-images"
                  :label="files && files.length > 0 ? 'Add More Photos' : 'Choose Photos'"
                  :disabled="isAtMaxPhotos"
                  class="font-semibold"
                  @click="chooseCallback()"
                />
                <Button
                  v-if="files && files.length > 0"
                  icon="pi pi-times"
                  label="Clear"
                  severity="secondary"
                  outlined
                  @click="clearCallback()"
                />
              </div>
            </div>
          </template>

          <template
            #content="{
              files,
              uploadedFiles: _uploadedFiles,
              removeUploadedFileCallback: _removeUploadedFileCallback,
              removeFileCallback
            }"
          >
            <div v-if="files && files.length > 0" class="space-y-4">
              <div>
                <h4 class="font-medium text-gray-900 dark:text-white mb-3">Selected Files</h4>
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  <div v-for="(file, index) in files" :key="index" class="relative">
                    <img
                      :src="file.objectURL"
                      :alt="file.name"
                      class="w-full h-24 object-cover rounded-lg border"
                    />
                    <div
                      class="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                    >
                      <Button
                        v-tooltip="'Remove'"
                        icon="pi pi-times"
                        rounded
                        text
                        severity="danger"
                        @click="removeFileCallback(index)"
                      />
                    </div>
                    <div class="absolute bottom-1 left-1 right-1">
                      <div
                        class="text-xs text-white bg-black bg-opacity-75 rounded px-2 py-1 truncate"
                      >
                        {{ file.name }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="flex justify-center">
                <Button
                  icon="pi pi-upload"
                  label="Upload Photos"
                  :loading="uploading"
                  class="font-semibold"
                  @click="onUpload({ files })"
                />
              </div>
            </div>

            <div v-else-if="!photos.length" class="text-center py-8">
              <i class="pi pi-images text-4xl text-gray-400 dark:text-gray-500 mb-4" />
              <p class="text-gray-500 dark:text-gray-400 mb-2">No photos yet</p>
              <p class="text-sm text-gray-400 dark:text-gray-500">
                {{
                  isAtMaxPhotos ? 'Maximum photos reached' : 'Upload images to showcase your racer'
                }}
              </p>
            </div>
          </template>
        </FileUpload>
      </template>
    </Card>

    <!-- Current Photos Gallery -->
    <div v-if="photos.length > 0" class="space-y-4">
      <h4 class="font-medium text-gray-900 dark:text-white">Current Photos</h4>

      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        <div
          v-for="(photo, index) in photos"
          :key="photo.url || photo"
          class="relative group cursor-pointer"
        >
          <Image
            :src="photo.url || photo"
            :alt="`Photo ${index + 1}`"
            image-class="w-full h-24 object-cover rounded-lg border-2 transition-all duration-200"
            :class="{
              'border-blue-500 ring-2 ring-blue-200': photo.featured,
              'border-gray-300 dark:border-gray-600 group-hover:border-blue-400': !photo.featured
            }"
            class="w-full h-24"
            preview
          />

          <!-- Photo Actions Overlay -->
          <div
            v-if="canManage"
            class="absolute inset-0 bg-black bg-opacity-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity overflow-hidden"
          >
            <div class="h-full flex flex-col items-center justify-center p-2">
              <div class="flex flex-wrap gap-1 justify-center max-w-full">
                <Button
                  v-if="!photo.featured && canSetFeatured"
                  v-tooltip="'Set as Featured'"
                  icon="pi pi-star"
                  rounded
                  size="small"
                  severity="warning"
                  @click="setFeatured(index)"
                />
                <Button
                  v-if="photo.featured"
                  v-tooltip="'Remove Featured'"
                  icon="pi pi-star-fill"
                  rounded
                  size="small"
                  severity="warning"
                  @click="removeFeatured(index)"
                />
                <Button
                  v-tooltip="'Move Up'"
                  icon="pi pi-arrow-up"
                  rounded
                  size="small"
                  :disabled="index === 0"
                  @click="movePhoto(index, index - 1)"
                />
                <Button
                  v-tooltip="'Move Down'"
                  icon="pi pi-arrow-down"
                  rounded
                  size="small"
                  :disabled="index === photos.length - 1"
                  @click="movePhoto(index, index + 1)"
                />
                <Button
                  v-tooltip="'Delete'"
                  icon="pi pi-trash"
                  rounded
                  size="small"
                  severity="danger"
                  @click="confirmDelete(index)"
                />
              </div>
            </div>
          </div>

          <!-- Featured Badge -->
          <div
            v-if="photo.featured"
            class="absolute top-1 right-1 bg-yellow-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
          >
            <i class="pi pi-star text-xs" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

const props = defineProps({
  racerId: {
    type: String,
    required: true
  },
  photos: {
    type: Array,
    default: () => []
  },
  canUpload: {
    type: Boolean,
    default: true
  },
  canManage: {
    type: Boolean,
    default: true
  },
  canSetFeatured: {
    type: Boolean,
    default: false
  },
  maxPhotos: {
    type: Number,
    default: 10
  }
})

const emit = defineEmits([
  'update:photos',
  'photo-uploaded',
  'photo-deleted',
  'photos-reordered',
  'featured-changed'
])

const toast = useToast()
const confirm = useConfirm()
const { $supabase } = useNuxtApp()

const uploading = ref(false)
const fileUpload = ref()

const isAtMaxPhotos = computed(() => {
  return props.maxPhotos && props.photos.length >= props.maxPhotos
})

// File upload handling
const onSelect = (event) => {
  const files = event.files

  // Check if adding these files would exceed the limit
  if (props.maxPhotos && props.photos.length + files.length > props.maxPhotos) {
    const remaining = props.maxPhotos - props.photos.length
    toast.add({
      severity: 'warn',
      summary: 'Too Many Photos',
      detail: `You can only add ${remaining} more photo${remaining !== 1 ? 's' : ''}`,
      life: 5000
    })
    return false
  }
}

const onUpload = async ({ files }) => {
  if (!files || files.length === 0) return

  uploading.value = true

  try {
    const uploadedUrls = []

    for (const file of files) {
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${props.racerId}/gallery/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`

      // Upload to Supabase Storage
      const { data: _data, error } = await $supabase.storage
        .from('race-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      // Get public URL
      const {
        data: { publicUrl }
      } = $supabase.storage.from('race-images').getPublicUrl(fileName)

      uploadedUrls.push(publicUrl)
    }

    // Update photos array
    const newPhotos = [...props.photos, ...uploadedUrls]
    emit('update:photos', newPhotos)
    emit('photo-uploaded', uploadedUrls)

    // Clear the file upload
    if (fileUpload.value) {
      fileUpload.value.clear()
    }

    toast.add({
      severity: 'success',
      summary: 'Photos Uploaded',
      detail: `Successfully uploaded ${uploadedUrls.length} photo${uploadedUrls.length !== 1 ? 's' : ''}`,
      life: 3000
    })
  } catch (error) {
    console.error('Error uploading photos:', error)
    toast.add({
      severity: 'error',
      summary: 'Upload Failed',
      detail: error.message || 'Failed to upload photos',
      life: 5000
    })
  } finally {
    uploading.value = false
  }
}

const onError = (_event) => {
  toast.add({
    severity: 'error',
    summary: 'Upload Error',
    detail: 'Failed to select files. Please check file size and format.',
    life: 5000
  })
}

// Photo management
const movePhoto = (fromIndex, toIndex) => {
  const newPhotos = [...props.photos]
  const [movedPhoto] = newPhotos.splice(fromIndex, 1)
  newPhotos.splice(toIndex, 0, movedPhoto)

  emit('update:photos', newPhotos)
  emit('photos-reordered', { fromIndex, toIndex })
}

const setFeatured = (index) => {
  const newPhotos = [...props.photos]
  newPhotos[index] =
    typeof newPhotos[index] === 'string'
      ? { url: newPhotos[index], featured: true }
      : { ...newPhotos[index], featured: true }

  emit('update:photos', newPhotos)
  emit('featured-changed', { index, featured: true })
}

const removeFeatured = (index) => {
  const newPhotos = [...props.photos]
  if (typeof newPhotos[index] === 'object') {
    newPhotos[index] = { ...newPhotos[index], featured: false }
  }

  emit('update:photos', newPhotos)
  emit('featured-changed', { index, featured: false })
}

const confirmDelete = (index) => {
  const photo = props.photos[index]
  const photoUrl = photo.url || photo

  confirm.require({
    message: 'Are you sure you want to delete this photo? This action cannot be undone.',
    header: 'Delete Photo',
    icon: 'pi pi-exclamation-triangle',
    rejectClass: 'p-button-secondary p-button-outlined',
    rejectLabel: 'Cancel',
    acceptLabel: 'Delete',
    accept: () => deletePhoto(index, photoUrl)
  })
}

const deletePhoto = async (index, photoUrl) => {
  try {
    // Extract file path from URL for Supabase Storage deletion
    if (photoUrl.includes('supabase')) {
      const urlParts = photoUrl.split('/')
      const fileName = urlParts.slice(-3).join('/') // Get racerId/gallery/filename

      const { error } = await $supabase.storage.from('race-images').remove([fileName])

      if (error) {
        console.warn('Failed to delete file from storage:', error)
        // Continue with database update even if storage deletion fails
      }
    }

    // Update photos array
    const newPhotos = [...props.photos]
    newPhotos.splice(index, 1)

    emit('update:photos', newPhotos)
    emit('photo-deleted', { index, url: photoUrl })

    toast.add({
      severity: 'info',
      summary: 'Photo Deleted',
      detail: 'Photo has been removed from the gallery',
      life: 3000
    })
  } catch (error) {
    console.error('Error deleting photo:', error)
    toast.add({
      severity: 'error',
      summary: 'Delete Failed',
      detail: error.message || 'Failed to delete photo',
      life: 5000
    })
  }
}
</script>
