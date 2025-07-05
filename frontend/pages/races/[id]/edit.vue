<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Breadcrumb Navigation -->
    <Breadcrumb :model="breadcrumbItems" class="mb-6" />

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

            <!-- Race Date -->
            <div>
              <label
                for="date"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Race Date *
              </label>
              <Calendar
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
            <div v-if="form.image_url" class="mt-4">
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

            <!-- Submit Button -->
            <div class="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
              <NuxtLink :to="`/races/${$route.params.id}`" class="flex-1">
                <Button type="button" severity="secondary" outlined label="Cancel" class="w-full" />
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
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'

const route = useRoute()
const authStore = useAuthStore()
const { $supabase } = useNuxtApp()
const $toast = useToast()


// State
const race = ref(null)
const pending = ref(true)
const error = ref(null)
const loading = ref(false)
const errors = ref({})
const uploading = ref(false)
const uploadError = ref('')

// Breadcrumb navigation
const breadcrumbItems = computed(() => [
  { label: 'Home', url: '/' },
  { label: 'Races', url: '/races' },
  { label: race.value?.name || 'Race', url: `/races/${route.params.id}` },
  { label: 'Edit' } // Current page, no navigation
])

// Form state
const form = ref({
  name: '',
  date: null,
  image_url: ''
})

// Fetch race data
const fetchRace = async () => {
  try {
    const { data, error: fetchError } = await $supabase
      .from('races')
      .select('*')
      .eq('id', route.params.id)
      .single()

    if (fetchError) throw fetchError

    race.value = data

    // Populate form
    form.value = {
      name: data.name,
      date: data.date ? new Date(data.date) : null,
      image_url: data.image_url || ''
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

  return Object.keys(errors.value).length === 0
}

// Handle image upload
const handleImageUpload = async (event) => {
  const file = event.files ? event.files[0] : event.target?.files?.[0]
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

// Update race
const updateRace = async () => {
  if (!validateForm()) return

  loading.value = true

  try {
    const raceData = {
      name: form.value.name.trim(),
      date: form.value.date ? form.value.date.toISOString().split('T')[0] : null,
      image_url: form.value.image_url?.trim() || null,
      updated_at: new Date().toISOString()
    }

    const { error: updateError } = await $supabase
      .from('races')
      .update(raceData)
      .eq('id', route.params.id)

    if (updateError) throw updateError

    // Show success toast
    $toast.add({
      severity: 'success',
      summary: 'Race Updated!',
      detail: 'Race has been successfully updated.',
      life: 4000
    })

    // Success - redirect back to race
    setTimeout(() => {
      navigateTo(`/races/${route.params.id}`)
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
})

useHead({
  title: computed(() =>
    race.value
      ? `Edit ${race.value.name} - The Great Holyoke Brick Race`
      : 'Edit Race - The Great Holyoke Brick Race'
  )
})
</script>
