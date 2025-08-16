<template>
  <div
    class="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
  >
    <div class="container mx-auto px-4 py-8">
      <!-- Breadcrumb Navigation -->
      <BreadcrumbWrapper :items="breadcrumbItems" />

      <!-- Loading State -->
      <div v-if="pending" class="flex justify-center py-12">
        <ProgressSpinner />
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-12">
        <i class="pi pi-exclamation-triangle text-6xl text-red-400 mb-4" />
        <h2 class="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Race Not Found</h2>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          The race you're trying to edit doesn't exist.
        </p>
        <NuxtLink to="/races">
          <Button severity="primary"> Back to All Races </Button>
        </NuxtLink>
      </div>

      <!-- Edit Form -->
      <div v-else-if="race" class="max-w-2xl mx-auto">
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Edit Race</h1>
        </div>

        <div class="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div class="p-8">
            <form class="space-y-8" @submit.prevent="updateRace">
              <!-- Race Name -->
              <div>
                <label
                  for="name"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Race Name *
                </label>
                <InputText
                  id="name"
                  v-model="form.name"
                  placeholder="e.g., Summer Championship 2024"
                  :invalid="!!errors.name"
                  class="w-full"
                />
                <p v-if="errors.name" class="mt-1 text-sm text-red-600">{{ errors.name }}</p>
              </div>

              <!-- Race Date and Time -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Race Date -->
                <div>
                  <label
                    for="date"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Race Date *
                  </label>
                  <DatePicker
                    id="date"
                    v-model="form.date"
                    v-tooltip.right="'Choose the date when the race will take place'"
                    date-format="mm/dd/yy"
                    placeholder="Select race date"
                    :invalid="!!errors.date"
                    class="w-full"
                    show-icon
                    :manual-input="false"
                  />
                  <p v-if="errors.date" class="mt-1 text-sm text-red-600">{{ errors.date }}</p>
                </div>

                <!-- Race Time -->
                <div>
                  <label
                    for="time"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Race Time *
                  </label>
                  <DatePicker
                    id="time"
                    v-model="form.time"
                    time-only
                    show-icon
                    icon-display="input"
                    :invalid="!!errors.time"
                    class="w-full"
                  />
                  <p v-if="errors.time" class="mt-1 text-sm text-red-600">{{ errors.time }}</p>
                  <p class="mt-1 text-xs text-gray-500">Select the race start time</p>
                </div>
              </div>

              <!-- Race Image -->
              <div>
                <label
                  for="imageFile"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Race Image
                </label>

                <!-- Hidden file input -->
                <input
                  ref="fileInput"
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="handleImageUpload"
                />

                <!-- Custom upload button -->
                <Button
                  type="button"
                  severity="secondary"
                  outlined
                  :loading="uploading"
                  class="w-full"
                  @click="openFileDialog"
                >
                  <i class="pi pi-upload mr-2" />
                  {{ uploading ? 'Uploading...' : 'Choose Image' }}
                </Button>

                <p class="mt-1 text-sm text-gray-500">JPG, PNG, GIF up to 2MB</p>

                <p v-if="uploadError" class="mt-2 text-sm text-red-600">{{ uploadError }}</p>
              </div>

              <!-- Image Preview -->
              <div v-if="form.image_url" class="mt-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >Preview</label
                >
                <img
                  :src="form.image_url"
                  alt="Race preview"
                  class="max-w-xs rounded-lg shadow-md"
                  @error="form.image_url = ''"
                />
              </div>

              <!-- Submit Button -->
              <div class="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                <NuxtLink :to="`/races/${race?.slug || $route.params.slug || $route.params.id}`" class="flex-1">
                  <Button
                    type="button"
                    severity="secondary"
                    outlined
                    label="Cancel"
                    class="w-full"
                  />
                </NuxtLink>
                <Button type="submit" :loading="loading" severity="primary" class="flex-1">
                  <i class="pi pi-save mr-2" />
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Toast Messages -->
      <Toast />
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'
import { isUUID } from '~/utils/slug-helpers'

const route = useRoute()
const authStore = useAuthStore()
const supabase = useSupabaseClient()
const $toast = useToast()

// Use races composable
const { getRaceById, getRaceBySlug, fetchRaceById, fetchRaceBySlug, updateRace: updateRaceComposable, initialize: initializeRaces } = useRaces()

// State
const race = ref(null)
const pending = ref(true)
const error = ref(null)
const loading = ref(false)
const errors = ref({})
const uploading = ref(false)
const uploadError = ref('')
const fileInput = ref(null)

// Breadcrumb navigation
const breadcrumbItems = computed(() => [
  { label: 'Home', url: '/' },
  { label: 'Races', url: '/races' },
  { label: race.value?.name || 'Race', url: `/races/${route.params.slug || route.params.id}` },
  { label: 'Edit' } // Current page, no navigation
])

// Form state
const form = ref({
  name: '',
  date: null,
  time: null,
  image_url: ''
})

// Fetch race data using composable
const fetchRace = async () => {
  try {
    // Initialize races composable if needed
    await initializeRaces()

    const param = route.params.slug || route.params.id
    let raceData = null
    
    // Check if it's a UUID (legacy support)
    if (isUUID(param)) {
      // Get race from cached data
      raceData = getRaceById(param)
      if (!raceData) {
        raceData = await fetchRaceById(param)
      }
    } else {
      // Get race by slug
      raceData = getRaceBySlug(param)
      if (!raceData) {
        raceData = await fetchRaceBySlug(param)
      }
    }

    if (!raceData) {
      throw new Error('Race not found')
    }

    race.value = raceData

    // Populate form
    if (raceData.race_datetime) {
      const datetime = new Date(raceData.race_datetime)
      form.value = {
        name: raceData.name,
        date: datetime,
        time: datetime,
        image_url: raceData.image_url || ''
      }
    } else {
      form.value = {
        name: raceData.name,
        date: null,
        time: null,
        image_url: raceData.image_url || ''
      }
    }
  } catch (err) {
    console.error('Error fetching race:', err)
    error.value = err
  } finally {
    pending.value = false
  }
}

// Form validation
const validateForm = () => {
  errors.value = {}

  if (!form.value.name?.trim()) {
    errors.value.name = 'Race name is required'
  }

  if (!form.value.date) {
    errors.value.date = 'Race date is required'
  }

  if (!form.value.time) {
    errors.value.time = 'Race time is required'
  }

  return Object.keys(errors.value).length === 0
}

// Open file dialog
const openFileDialog = () => {
  fileInput.value?.click()
}

// Handle image upload
const handleImageUpload = async (event) => {
  const file = event.target?.files?.[0]
  if (!file) return

  // Validate file size (2MB limit)
  if (file.size > 2 * 1024 * 1024) {
    uploadError.value = 'File size must be less than 2MB'
    return
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    uploadError.value = 'Please select an image file'
    return
  }

  uploading.value = true
  uploadError.value = ''

  try {
    // Create unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `race-${Date.now()}.${fileExt}`
    const filePath = `races/${fileName}`

    // Upload to Supabase Storage
    const { error } = await supabase.storage.from('race-images').upload(filePath, file)

    if (error) throw error

    // Get public URL
    const { data: urlData } = supabase.storage.from('race-images').getPublicUrl(filePath)

    // Set the image URL in the form
    form.value.image_url = urlData.publicUrl

    // Clear the file input for future uploads
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  } catch (error) {
    console.error('Error uploading image:', error)
    uploadError.value = 'Failed to upload image. Please try again.'
  } finally {
    uploading.value = false
  }
}

// Update race using composable
const updateRace = async () => {
  if (!validateForm()) return

  loading.value = true

  try {
    const raceData = {
      name: form.value.name.trim(),
      date: form.value.date ? new Date(form.value.date).toISOString().split('T')[0] : null,
      image_url: form.value.image_url?.trim() || null,
      updated_at: new Date().toISOString()
    }

    await updateRaceComposable(race.value.id, raceData)

    // Show success toast
    $toast.add({
      severity: 'success',
      summary: 'Race Updated!',
      detail: 'Race has been successfully updated.',
      life: 4000
    })

    // Success - redirect back to race
    setTimeout(() => {
      navigateTo(`/races/${race.value.slug || race.value.id}`)
    }, 1000)
  } catch (error) {
    console.error('Error updating race:', error)
    $toast.add({
      severity: 'error',
      summary: 'Update Failed',
      detail: 'Failed to update race. Please try again.',
      life: 5000
    })
  } finally {
    loading.value = false
  }
}

// Initialize
onMounted(async () => {
  await authStore.initAuth()
  if (!authStore.isRaceAdmin) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied. Race admin privileges required.'
    })
  }
  await fetchRace()

  // Component initialization complete
})

useHead({
  title: computed(() =>
    race.value
      ? `Edit ${race.value.name} - The Great Holyoke Brick Race`
      : 'Edit Race - The Great Holyoke Brick Race'
  )
})
</script>
