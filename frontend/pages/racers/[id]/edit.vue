<template>
  <div
    class="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
  >
    <div class="container mx-auto px-4 py-12 max-w-2xl">
      <!-- Breadcrumb Navigation -->
      <BreadcrumbWrapper :items="breadcrumbItems" />

      <!-- Loading State -->
      <div v-if="pending" class="flex justify-center py-12">
        <ProgressSpinner />
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-12">
        <i class="pi pi-exclamation-triangle text-6xl text-red-400 mb-4" />
        <h2 class="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
          Racer Not Found
        </h2>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          You don't have permission to edit this racer or it doesn't exist.
        </p>
        <NuxtLink to="/racers">
          <Button label="Back to All Racers" icon="pi pi-arrow-left" class="btn-brick-secondary" />
        </NuxtLink>
      </div>

      <!-- Edit Form -->
      <div v-else-if="racer">
        <!-- Header -->
        <div class="text-center mb-12">
          <div
            class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-600 to-green-700 rounded-full mb-6"
          >
            <i class="pi pi-pencil text-2xl text-white" />
          </div>
          <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">Edit Racer</h1>
          <p class="text-lg text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
            Update your racer details for #{{ racer.racer_number }} - {{ racer.name }}
          </p>
        </div>

        <!-- Form Card -->
        <div
          class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden"
        >
          <div class="p-8">
            <form class="space-y-6" @submit.prevent="handleSubmit">
              <!-- Basic Information Panel -->
              <Panel header="Basic Information" toggleable>
                <div class="space-y-6">
                  <!-- Name Input -->
                  <div>
                    <label
                      for="name"
                      class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Racer Name
                    </label>
                    <InputText
                      id="name"
                      v-model="form.name"
                      placeholder="Enter racer name"
                      :invalid="!!errors.name"
                      class="w-full"
                    />
                    <p v-if="errors.name" class="mt-1 text-sm text-red-600">{{ errors.name }}</p>
                  </div>

                  <!-- About this Racer Input -->
                  <div>
                    <label
                      for="team_members"
                      class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      About this racer
                    </label>
                    <Textarea
                      id="team_members"
                      v-model="form.team_members"
                      placeholder="Tell us who created this racer and any other information you would like to share..."
                      class="w-full"
                      rows="3"
                      auto-resize
                    />
                    <p class="mt-2 text-sm text-gray-500">
                      Tell us who created this racer and any other information you would like to
                      share.
                    </p>
                  </div>
                </div>
              </Panel>

              <!-- Technical Specifications Panel -->
              <Panel header="Technical Specifications" toggleable>
                <div class="space-y-6">
                  <!-- Weight Input -->
                  <div>
                    <label
                      for="weight"
                      class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Weight (pounds)
                    </label>
                    <InputNumber
                      id="weight"
                      v-model="form.weight"
                      placeholder="Enter weight in pounds"
                      :invalid="!!errors.weight"
                      :min="0"
                      :max-fraction-digits="2"
                      suffix=" lbs"
                      class="w-full"
                    />
                    <p v-if="errors.weight" class="mt-1 text-sm text-red-600">
                      {{ errors.weight }}
                    </p>
                    <p class="mt-2 text-sm text-gray-500">
                      Optional: Weight helps track performance metrics. Maximum weight is 15 lbs.
                    </p>
                  </div>
                </div>
              </Panel>

              <!-- Main Racer Photo Panel -->
              <Panel header="Main Racer Photo" toggleable>
                <div class="space-y-4">
                  <!-- Current Photo or Preview -->
                  <div v-if="previewImage || form.image_url" class="text-center">
                    <!-- Status Header -->
                    <div class="flex items-center justify-center gap-2 mb-4">
                      <template v-if="previewImage">
                        <i class="pi pi-clock text-green-700 dark:text-green-400" />
                        <span class="text-sm text-green-700 dark:text-green-400 font-medium"
                          >Photo ready to save</span
                        >
                      </template>
                      <template v-else>
                        <i class="pi pi-check-circle text-green-600 dark:text-green-400" />
                        <span class="text-sm text-green-600 dark:text-green-400 font-medium"
                          >Main photo uploaded</span
                        >
                        <Button
                          v-tooltip="'Remove main photo'"
                          icon="pi pi-times"
                          severity="danger"
                          size="small"
                          text
                          @click="removeMainPhoto"
                        />
                      </template>
                    </div>

                    <!-- Image Display (Preview or Current) -->
                    <div class="mb-4">
                      <img
                        :src="previewImage || form.image_url"
                        :alt="previewImage ? 'Photo preview' : 'Current main photo'"
                        class="max-w-xs max-h-48 mx-auto rounded-lg shadow-md object-cover"
                      >
                    </div>

                    <!-- Preview Action Buttons -->
                    <div v-if="previewImage" class="flex gap-2 justify-center">
                      <Button
                        icon="pi pi-check"
                        label="Save Photo"
                        severity="success"
                        size="small"
                        :loading="uploadingMainPhoto"
                        @click="savePreviewedPhoto"
                      />
                      <Button
                        icon="pi pi-times"
                        label="Cancel"
                        severity="secondary"
                        size="small"
                        @click="cancelPreview"
                      />
                    </div>
                  </div>

                  <!-- Upload New Photo -->
                  <div class="text-center">
                    <FileUpload
                      mode="basic"
                      accept="image/*"
                      :max-file-size="10000000"
                      :auto="false"
                      choose-label="Choose Photo"
                      class="w-full"
                      @select="onMainPhotoSelect"
                    />
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      This will be the primary photo displayed on the racer's detail page.
                    </p>
                  </div>
                </div>
              </Panel>

              <!-- Photo Gallery Panel -->
              <Panel header="Additional Photos" toggleable>
                <div class="mb-4">
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    Upload additional photos of your racer for the gallery section.
                  </p>
                </div>
                <PhotoUpload
                  v-model:photos="form.photos"
                  :racer-id="racer.id"
                  :can-upload="true"
                  :can-manage="true"
                  :can-set-featured="authStore.isRaceAdmin"
                  :max-photos="10"
                  @photo-uploaded="onPhotoUploaded"
                  @photo-deleted="onPhotoDeleted"
                  @photos-reordered="onPhotosReordered"
                  @featured-changed="onFeaturedChanged"
                />
              </Panel>

              <!-- Error Message -->
              <div v-if="errors.general" class="rounded-md bg-red-50 p-4">
                <div class="flex">
                  <div class="flex-shrink-0">
                    <i class="pi pi-exclamation-triangle text-red-400" />
                  </div>
                  <div class="ml-3">
                    <p class="text-sm text-red-800">{{ errors.general }}</p>
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                <NuxtLink :to="`/racers/${racer.id}`" class="flex-1">
                  <Button type="button" severity="secondary" outlined class="w-full">
                    Cancel
                  </Button>
                </NuxtLink>

                <Button
                  type="submit"
                  :loading="loading"
                  label="Update Racer"
                  icon="pi pi-save"
                  class="btn-brick flex-1"
                />
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Messages -->
    <Toast />
  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  middleware: 'auth'
})

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { $supabase } = useNuxtApp()
const $toast = useToast()

// Use racers composable
const {
  getRacerById,
  fetchRacerDetails,
  updateRacer: updateRacerComposable,
  updateRacerImage,
  updateRacerPhotos,
  initialize: initializeRacers
} = useRacers()

const racer = ref(null)
const pending = ref(true)
const error = ref(null)
const loading = ref(false)

// Photo preview state
const previewImage = ref(null)
const previewFile = ref(null)
const uploadingMainPhoto = ref(false)

// Breadcrumb navigation
const breadcrumbItems = computed(() => [
  { label: 'Home', url: '/' },
  { label: 'Racers', url: '/racers' },
  { label: racer.value?.name || 'Racer', url: `/racers/${route.params.id}` },
  { label: 'Edit' } // Current page, no navigation
])

const form = reactive({
  name: '',
  weight: '',
  team_members: '',
  image_url: '',
  photos: []
})

const errors = reactive({
  name: '',
  weight: '',
  general: ''
})

// Fetch racer data and check permissions using composable
const fetchRacer = async () => {
  try {
    // Initialize racers composable if needed
    await initializeRacers()

    // Try to get racer from cache first
    let racerData = getRacerById(route.params.id)

    // If not in cache or incomplete, fetch detailed data
    if (!racerData) {
      racerData = await fetchRacerDetails(route.params.id)
    }

    if (!racerData) {
      throw new Error('Racer not found')
    }

    // Check if user has permission to edit
    if (racerData.user_id !== authStore.userId && !authStore.isAdmin) {
      throw new Error('You do not have permission to edit this racer')
    }

    racer.value = racerData

    // Populate form with existing data
    form.name = racerData.name || ''
    // Convert weight from grams to pounds for display
    form.weight = racerData.weight ? (racerData.weight / 453.592).toFixed(2) : ''
    form.team_members = racerData.team_members || ''
    form.image_url = racerData.image_url || ''
    form.photos = racerData.photos || []
  } catch (err) {
    console.error('Error fetching racer:', err)
    error.value = err
  } finally {
    pending.value = false
  }
}

const clearErrors = () => {
  Object.keys(errors).forEach((key) => (errors[key] = ''))
}

const validateForm = () => {
  clearErrors()
  let isValid = true

  if (!form.name.trim()) {
    errors.name = 'Racer name is required'
    isValid = false
  }

  if (form.weight && (Number.isNaN(form.weight) || Number.parseFloat(form.weight) < 0)) {
    errors.weight = 'Weight must be a positive number in pounds'
    isValid = false
  }

  return isValid
}

const handleSubmit = async () => {
  if (!validateForm()) return

  loading.value = true
  clearErrors()

  try {
    const updateData = {
      name: form.name.trim(),
      team_members: form.team_members.trim() || null,
      image_url: form.image_url || null,
      photos: form.photos
    }

    // Only include weight if it's provided (convert pounds to grams for storage)
    if (form.weight) {
      updateData.weight = Number.parseFloat(form.weight) * 453.592
    }

    await updateRacerComposable(route.params.id, updateData)

    // Show success toast
    $toast.add({
      severity: 'success',
      summary: 'Racer Updated!',
      detail: 'Your racer has been successfully updated.',
      life: 4000
    })

    // Redirect to racer detail page
    setTimeout(() => {
      router.push(`/racers/${route.params.id}`)
    }, 1000)
  } catch (error) {
    console.error('Error updating racer:', error)

    // Show error toast
    $toast.add({
      severity: 'error',
      summary: 'Update Failed',
      detail: error.message || 'Failed to update racer. Please try again.',
      life: 5000
    })
  } finally {
    loading.value = false
  }
}

// Photo event handlers
const onPhotoUploaded = async (_uploadedUrls) => {
  // Photos are already added to form.photos by the PhotoUpload component
  // Auto-save the updated photos array
  await savePhotos()
}

const onPhotoDeleted = async ({ index: _index, url: _url }) => {
  // Photos are already removed from form.photos by the PhotoUpload component
  // Auto-save the updated photos array
  await savePhotos()
}

const onPhotosReordered = async ({ fromIndex: _fromIndex, toIndex: _toIndex }) => {
  // Photos are already reordered in form.photos by the PhotoUpload component
  // Auto-save the updated photos array
  await savePhotos()
}

const onFeaturedChanged = async ({ index: _index, featured: _featured }) => {
  // Photos are already updated in form.photos by the PhotoUpload component
  // Auto-save the updated photos array
  await savePhotos()
}

const savePhotos = async () => {
  try {
    await updateRacerPhotos(racer.value.id, form.photos)
  } catch (err) {
    console.error('Error saving photos:', err)
    errors.general = 'Failed to save photos. Please try again.'
  }
}

// Main photo select handler (for preview)
const onMainPhotoSelect = (event) => {
  const files = event.files || []

  if (!files || files.length === 0) return

  const file = files[0]

  // Check if file has the expected properties
  if (!file || typeof file !== 'object') {
    return
  }

  // Try different possible property names for the file name
  const fileName = file.name || file.fileName || file.filename
  if (!fileName) {
    return
  }

  previewFile.value = file

  // Create preview URL
  const reader = new FileReader()
  reader.onload = (e) => {
    previewImage.value = e.target.result
  }
  reader.readAsDataURL(file)
}

// Save the previewed photo
const savePreviewedPhoto = async () => {
  if (!previewFile.value) return

  uploadingMainPhoto.value = true

  try {
    const file = previewFile.value
    if (!file || typeof file !== 'object') {
      throw new Error('Invalid file selected')
    }

    // Handle Vue reactive objects - get the actual file data
    const actualFile = file.object || file

    // Try different possible property names for the file name
    const fileName = actualFile.name || actualFile.fileName || actualFile.filename
    if (!fileName) {
      throw new Error('File name not found')
    }

    const fileExt = fileName.split('.').pop()
    const newFileName = `racer-${racer.value.id}-main-${Date.now()}.${fileExt}`
    const filePath = `racers/${authStore.userId}/${newFileName}`

    // Upload file to Supabase Storage
    const { error: uploadError } = await $supabase.storage
      .from('race-images')
      .upload(filePath, actualFile)

    if (uploadError) throw uploadError

    // Get public URL
    const { data: urlData } = $supabase.storage.from('race-images').getPublicUrl(filePath)

    if (!urlData.publicUrl) throw new Error('Failed to get public URL')

    // Update form and save immediately using composable
    form.image_url = urlData.publicUrl
    await updateRacerImage(racer.value.id, form.image_url)

    // Clear preview
    cancelPreview()

    // Show success toast
    $toast.add({
      severity: 'success',
      summary: 'Photo Updated!',
      detail: 'Main racer photo has been successfully updated.',
      life: 4000
    })
  } catch (error) {
    console.error('Error uploading main photo:', error)
    errors.general = 'Failed to upload photo. Please try again.'
  } finally {
    uploadingMainPhoto.value = false
  }
}

// Cancel preview
const cancelPreview = () => {
  previewImage.value = null
  previewFile.value = null
}

// Remove main photo
const removeMainPhoto = async () => {
  try {
    form.image_url = ''
    await updateRacerImage(racer.value.id, null)

    // Show success toast
    $toast.add({
      severity: 'info',
      summary: 'Photo Removed',
      detail: 'Main photo has been removed successfully.',
      life: 3000
    })
  } catch (error) {
    console.error('Error removing main photo:', error)
    $toast.add({
      severity: 'error',
      summary: 'Remove Failed',
      detail: 'Failed to remove photo. Please try again.',
      life: 5000
    })
  }
}

// Initialize
onMounted(async () => {
  await authStore.initAuth()
  await fetchRacer()
})

useHead({
  title: computed(() =>
    racer.value
      ? `Edit ${racer.value.name} - The Great Holyoke Brick Race`
      : 'Edit Racer - The Great Holyoke Brick Race'
  )
})
</script>
