<template>
  <div class="min-h-screen bg-white">
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
        <h2 class="text-2xl font-semibold text-gray-800 mb-2">Race Not Found</h2>
        <p class="text-gray-600 mb-6">The race you're trying to edit doesn't exist.</p>
        <NuxtLink to="/races">
          <Button severity="primary"> Back to All Races </Button>
        </NuxtLink>
      </div>

      <!-- Edit Form -->
      <div v-else-if="race" class="max-w-2xl mx-auto">
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-black">Edit Race</h1>
        </div>

        <div class="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div class="p-8">
            <form class="space-y-8" @submit.prevent="updateRace">
              <!-- Race Name -->
              <div>
                <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
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
                  <label for="date" class="block text-sm font-medium text-gray-700 mb-2">
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

                <!-- Race Start Time -->
                <div>
                  <label for="time" class="block text-sm font-medium text-gray-700 mb-2">
                    Race Start Time *
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

                <!-- Race End Time -->
                <div>
                  <label for="endTime" class="block text-sm font-medium text-gray-700 mb-2">
                    Race End Time
                  </label>
                  <DatePicker
                    id="endTime"
                    v-model="form.endTime"
                    time-only
                    show-icon
                    icon-display="input"
                    :invalid="!!errors.endTime"
                    class="w-full"
                  />
                  <p v-if="errors.endTime" class="mt-1 text-sm text-red-600">
                    {{ errors.endTime }}
                  </p>
                  <p class="mt-1 text-xs text-gray-500">Optional end time for the race event</p>
                </div>
              </div>

              <!-- Race Description -->
              <div>
                <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <TiptapEditor v-model="form.description" />
                <p v-if="errors.description" class="mt-1 text-sm text-red-600">
                  {{ errors.description }}
                </p>
                <p class="mt-1 text-xs text-gray-500">
                  Add a detailed description of the race event
                </p>
              </div>

              <!-- Race Image -->
              <div>
                <label for="imageFile" class="block text-sm font-medium text-gray-700 mb-2">
                  Race Image
                </label>

                <!-- Hidden file input -->
                <input
                  ref="fileInput"
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="handleImageUpload"
                >

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
                <label class="block text-sm font-medium text-gray-700 mb-2">Preview</label>
                <img
                  :src="form.image_url"
                  alt="Race preview"
                  class="max-w-xs rounded-lg shadow-md"
                  @error="form.image_url = ''"
                >
              </div>

              <!-- Submit Button -->
              <div class="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200 sm:justify-start">
                <Button type="submit" :loading="loading" severity="primary" class="w-full sm:w-auto">
                  <i class="pi pi-save mr-2" />
                  Save Changes
                </Button>
                <NuxtLink :to="`/races/${race?.slug || $route.params.slug}`" class="w-full sm:w-auto">
                  <Button
                    type="button"
                    severity="secondary"
                    outlined
                    label="Cancel"
                    class="w-full sm:w-auto"
                  />
                </NuxtLink>
              </div>
            </form>
          </div>
        </div>

        <!-- Admin Actions (Race Admin+) -->
        <div v-if="authStore.isRaceAdmin && race" class="mt-8">
          <div class="bg-blue-50/20 rounded-2xl border-2 border-blue-200 overflow-hidden">
            <div class="p-6">
              <h3 class="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                <i class="pi pi-cog mr-2" />
                Admin Actions
              </h3>

              <div class="space-y-6">
                <!-- Set as Active (Race Admins) -->
                <div v-if="!race.active">
                  <h4 class="font-medium text-blue-800 mb-2">Set as Active Race</h4>
                  <p class="text-sm text-blue-700 mb-4">
                    Make this the current active race. This will deactivate any other active race
                    and show this race prominently on the homepage.
                  </p>

                  <Button :loading="settingActive" class="btn-primary" @click="setActiveRace">
                    <i class="pi pi-play mr-2" />
                    Set as Active
                  </Button>
                </div>

                <!-- Active Race Status -->
                <div v-else>
                  <div class="flex items-center gap-2" style="color: var(--brand-green)">
                    <i class="pi pi-check-circle" />
                    <span class="font-medium">This is the current active race</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Danger Zone (Full Admins Only) -->
        <div v-if="authStore.isAdmin && race && !race.active" class="mt-8">
          <div class="bg-red-50/20 rounded-2xl border-2 border-red-200 overflow-hidden">
            <div class="p-6">
              <h3 class="text-lg font-semibold text-red-900 mb-4 flex items-center">
                <i class="pi pi-exclamation-triangle mr-2" />
                Danger Zone
              </h3>

              <div class="space-y-4">
                <div>
                  <h4 class="font-medium text-red-800 mb-2">Delete Race</h4>
                  <p class="text-sm text-red-700 mb-4">
                    Permanently delete this race and all associated data including qualifying times,
                    brackets, check-ins, and awards. This action cannot be undone.
                  </p>

                  <Button :loading="deletingRace" severity="danger" @click="confirmDeleteRace">
                    <i class="pi pi-trash mr-2" />
                    Delete Race
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Toast Messages -->
      <Toast />

      <!-- Confirmation Dialog -->
      <ConfirmDialog />
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'

const route = useRoute()
const authStore = useAuthStore()
const supabase = useSupabaseClient()
const $toast = useToast()
const $confirm = useConfirm()

// Use races composable
const {
  getRaceBySlug,
  fetchRaceBySlug,
  updateRace: updateRaceComposable,
  setActiveRace: setActiveRaceComposable,
  initialize: initializeRaces
} = useRaces()

// State
const race = ref(null)
const pending = ref(true)
const error = ref(null)
const loading = ref(false)
const errors = ref({})
const uploading = ref(false)
const uploadError = ref('')
const fileInput = ref(null)
const deletingRace = ref(false)
const settingActive = ref(false)

// Breadcrumb navigation
const breadcrumbItems = computed(() => [
  { label: 'Home', url: '/' },
  { label: 'Races', url: '/races' },
  { label: race.value?.name || 'Race', url: `/races/${route.params.slug}` },
  { label: 'Edit' } // Current page, no navigation
])

// Form state
const form = ref({
  name: '',
  date: null,
  time: null,
  endTime: null,
  description: '',
  image_url: ''
})

// Fetch race data using composable
const fetchRace = async () => {
  try {
    // Initialize races composable if needed
    await initializeRaces()

    // Get race by slug
    const slug = route.params.slug
    let raceData = getRaceBySlug(slug)
    if (!raceData) {
      raceData = await fetchRaceBySlug(slug)
    }

    if (!raceData) {
      throw new Error('Race not found')
    }

    race.value = raceData

    // Populate form
    if (raceData.race_datetime) {
      const datetime = new Date(raceData.race_datetime)
      const endTime = raceData.end_time ? new Date(raceData.end_time) : null
      form.value = {
        name: raceData.name,
        date: datetime,
        time: datetime,
        endTime: endTime,
        description: raceData.description || '',
        image_url: raceData.image_url || ''
      }
    } else {
      form.value = {
        name: raceData.name,
        date: null,
        time: null,
        endTime: null,
        description: raceData.description || '',
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

// Set active race using composable
const setActiveRace = async () => {
  settingActive.value = true

  try {
    await setActiveRaceComposable(race.value.id)

    // Update local race state
    race.value.active = true

    $toast.add({
      severity: 'success',
      summary: 'Race Activated',
      detail: `"${race.value.name}" is now the active race.`,
      life: 4000
    })
  } catch (error) {
    console.error('Error setting active race:', error)

    $toast.add({
      severity: 'error',
      summary: 'Failed to Activate',
      detail: 'Failed to set race as active. Please try again.',
      life: 5000
    })
  } finally {
    settingActive.value = false
  }
}

// Delete race with confirmation
const confirmDeleteRace = () => {
  $confirm.require({
    message: `Are you sure you want to delete""${race.value.name}"? This action cannot be undone and will remove all associated data including qualifying times, brackets, check-ins, and awards.`,
    header: 'Delete Race',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Cancel',
    acceptLabel: 'Delete',
    rejectClass: 'btn-secondary',
    acceptClass: 'p-button-danger',
    accept: () => {
      deleteRace()
    }
  })
}

const deleteRace = async () => {
  deletingRace.value = true

  try {
    const response = await $fetch(`/api/races/${race.value.id}/delete`, {
      method: 'DELETE'
    })

    $toast.add({
      severity: 'success',
      summary: 'Race Deleted',
      detail: response?.message || 'Race has been successfully deleted.',
      life: 5000
    })

    // Redirect to races list after successful deletion
    setTimeout(() => {
      navigateTo('/races')
    }, 1000)
  } catch (error) {
    console.error('Error deleting race:', error)

    let errorMessage = 'Failed to delete race. Please try again.'

    // Handle different error response formats
    if (error.data?.message) {
      errorMessage = error.data.message
    } else if (error.data?.statusMessage) {
      errorMessage = error.data.statusMessage
    } else if (error.message) {
      errorMessage = error.message
    } else if (typeof error === 'string') {
      errorMessage = error
    }

    $toast.add({
      severity: 'error',
      summary: 'Delete Failed',
      detail: errorMessage,
      life: 6000
    })
  } finally {
    deletingRace.value = false
  }
}

// Update race using composable
const updateRace = async () => {
  if (!validateForm()) return

  loading.value = true

  try {
    // Combine date and time into datetime field
    let raceDateTime = null
    if (form.value.date && form.value.time) {
      const date = new Date(form.value.date)
      const time = new Date(form.value.time)

      // Create combined datetime in local timezone
      const combined = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        time.getHours(),
        time.getMinutes(),
        time.getSeconds()
      )

      raceDateTime = combined.toISOString()
    }

    // Handle end time
    let endTime = null
    if (form.value.date && form.value.endTime) {
      const date = new Date(form.value.date)
      const time = new Date(form.value.endTime)

      // Create combined end datetime in local timezone
      const combined = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        time.getHours(),
        time.getMinutes(),
        time.getSeconds()
      )

      endTime = combined.toISOString()
    }

    const raceData = {
      name: form.value.name.trim(),
      race_datetime: raceDateTime,
      end_time: endTime,
      description: form.value.description?.trim() || null,
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
