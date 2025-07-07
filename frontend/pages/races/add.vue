<template>
  <div
    class="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
  >
    <div class="container mx-auto px-4 py-8">
      <div class="max-w-2xl mx-auto">
        <div class="flex items-center justify-between mb-8">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Create New Race</h1>
          <NuxtLink to="/races">
            <Button class="btn-brick-secondary">
              <i class="pi pi-arrow-left mr-2" />
              Back to Races
            </Button>
          </NuxtLink>
        </div>

        <div class="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div class="p-8">
            <form class="space-y-6" @submit.prevent="createRace">
              <!-- Basic Information Panel -->
              <Panel header="Basic Information" toggleable>
                <div class="space-y-6">
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
                        date-format="yy-mm-dd"
                        :invalid="!!errors.date"
                        show-icon
                        class="w-full"
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
                </div>
              </Panel>

              <!-- Race Media Panel -->
              <Panel header="Race Media" toggleable>
                <div class="space-y-6">
                  <!-- Race Image -->
                  <div>
                    <label
                      for="imageFile"
                      class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Race Image
                    </label>
                    <FileUpload
                      mode="basic"
                      accept="image/*"
                      :max-file-size="2000000"
                      choose-label="Choose Image"
                      class="w-full"
                      @select="handleImageUpload"
                    />
                    <p class="mt-1 text-sm text-gray-500">JPG, PNG, GIF up to 2MB</p>

                    <p v-if="uploading" class="mt-2 text-sm text-blue-600">
                      <i class="pi pi-spin pi-spinner mr-1" />
                      Uploading image...
                    </p>
                    <p v-if="uploadError" class="mt-2 text-sm text-red-600">{{ uploadError }}</p>
                  </div>

                  <!-- Image Preview -->
                  <div v-if="form.image_url">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >Preview</label
                    >
                    <img
                      :src="form.image_url"
                      alt="Race preview"
                      class="max-w-xs rounded-lg shadow-md"
                      @error="form.image_url = ''"
                    >
                  </div>
                </div>
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

              <!-- Submit Button -->
              <div class="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                <NuxtLink to="/races" class="flex-1">
                  <Button type="button" class="btn-brick-secondary w-full"> Cancel </Button>
                </NuxtLink>
                <Button
                  type="submit"
                  :loading="loading"
                  icon="pi pi-plus"
                  label="Create Race"
                  class="btn-brick flex-1"
                />
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'

// Auth and redirect check
const authStore = useAuthStore()
const { $supabase } = useNuxtApp()

// Use races composable for creating races
const { createRace: createRaceComposable } = useRaces()

// Redirect if not race admin
onMounted(async () => {
  await authStore.initAuth()
  if (!authStore.isRaceAdmin) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied. Race admin privileges required.'
    })
  }

  // Component initialization complete
})

// Form state
const form = ref({
  name: '',
  date: null,
  time: null,
  image_url: ''
})

const errors = ref({})
const loading = ref(false)
const uploading = ref(false)
const uploadError = ref('')

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

// Handle image upload
const handleImageUpload = async (event) => {
  const file = event.files[0]
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
    const { error } = await $supabase.storage.from('race-images').upload(filePath, file)

    if (error) throw error

    // Get public URL
    const { data: urlData } = $supabase.storage.from('race-images').getPublicUrl(filePath)

    // Set the image URL in the form
    form.value.image_url = urlData.publicUrl
  } catch (error) {
    console.error('Error uploading image:', error)
    uploadError.value = 'Failed to upload image. Please try again.'
  } finally {
    uploading.value = false
  }
}

// Create race using composable
const createRace = async () => {
  if (!validateForm()) return

  loading.value = true

  try {
    // Combine date and time into a full datetime
    let raceDateTime = null
    if (form.value.date && form.value.time) {
      // Create a datetime by combining the date and time
      const dateOnly = new Date(form.value.date)
      const timeOnly = new Date(form.value.time)

      raceDateTime = new Date(
        dateOnly.getFullYear(),
        dateOnly.getMonth(),
        dateOnly.getDate(),
        timeOnly.getHours(),
        timeOnly.getMinutes(),
        timeOnly.getSeconds()
      )
    }

    const raceData = {
      name: form.value.name.trim(),
      race_datetime: raceDateTime ? raceDateTime.toISOString() : null,
      image_url: form.value.image_url?.trim() || null
    }

    const newRace = await createRaceComposable(raceData)

    // Success - redirect to the new race
    await navigateTo(`/races/${newRace.id}`)
  } catch (error) {
    console.error('Error creating race:', error)

    // Show user-friendly error
    if (error.message?.includes('duplicate')) {
      errors.value.name = 'A race with this name already exists'
    } else {
      errors.value.general = 'Failed to create race. Please try again.'
    }
  } finally {
    loading.value = false
  }
}

useHead({
  title: 'Create New Race - The Great Holyoke Brick Race',
  meta: [{ name: 'description', content: 'Create a new LEGO car racing event.' }]
})
</script>
