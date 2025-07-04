<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
    <div class="container mx-auto px-4 py-12 max-w-2xl">
      <!-- Header -->
      <div class="text-center mb-12">
        <div
          class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-6"
        >
          <i class="pi pi-car text-2xl text-white" />
        </div>
        <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">Add New Racer</h1>
        <p class="text-lg text-gray-600 max-w-lg mx-auto">
          Create a new custom gravity-powered vehicle for the competition
        </p>
      </div>

      <!-- Requirements Card -->
      <div
        class="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 mb-8 text-white shadow-lg"
      >
        <div class="flex items-start space-x-3">
          <div class="flex-shrink-0">
            <i class="pi pi-info-circle text-xl" />
          </div>
          <div>
            <h3 class="font-semibold text-lg mb-2">Competition Requirements</h3>
            <ul class="space-y-1 text-blue-100">
              <li>• Vehicle must be less than 11 inches wide</li>
              <li>• Must contain a brick somewhere in the design</li>
              <li>• Judged on speed, creativity, and artistic design</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Form Card -->
      <div class="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div class="p-8">
          <form class="space-y-8" @submit.prevent="handleSubmit">
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
                v-tooltip.right="'Choose a creative name for your gravity-powered vehicle'"
                placeholder="Enter racer name (e.g., Lightning Bolt, Thunder Runner)"
                :invalid="!!errors.name"
                class="w-full"
              />
              <p v-if="errors.name" class="mt-1 text-sm text-red-600">{{ errors.name }}</p>
              <p class="mt-2 text-sm text-gray-500">
                You can add weight, photos, and other details later by editing your racer.
              </p>
            </div>

            <!-- Action Buttons -->
            <div class="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
              <NuxtLink to="/racers" class="flex-1">
                <Button type="button" severity="secondary" outlined label="Cancel" class="w-full" />
              </NuxtLink>

              <Button
                type="submit"
                :loading="loading"
                :disabled="!form.name || !authStore.isAuthenticated"
                label="Create Racer"
                icon="pi pi-plus"
                class="flex-1"
                severity="primary"
              />
            </div>
          </form>
        </div>
      </div>

      <!-- Help Text -->
      <div class="text-center mt-8">
        <p class="text-gray-500 text-sm">
          Need help? Check out our
          <a href="#" class="text-blue-600 hover:text-blue-700 font-medium">building guidelines</a>
          for inspiration.
        </p>
      </div>
    </div>

    <!-- Toast Messages -->
    <Toast />
  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'

definePageMeta({
  middleware: 'auth'
})

const authStore = useAuthStore()
const router = useRouter()
const $toast = useToast()

const form = reactive({
  name: ''
})

const errors = reactive({
  name: '',
  general: ''
})

const loading = ref(false)

const clearErrors = () => {
  Object.keys(errors).forEach((key) => (errors[key] = ''))
}

const generateIdNumber = () => {
  return (
    'R' +
    Date.now() +
    Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0')
  )
}

const validateForm = () => {
  clearErrors()
  let isValid = true

  if (!form.name.trim()) {
    errors.name = 'Racer name is required'
    isValid = false
  }

  return isValid
}

const handleSubmit = async () => {
  if (!validateForm()) return
  if (!authStore.isAuthenticated) {
    $toast.add({
      severity: 'error',
      summary: 'Authentication Required',
      detail: 'You must be logged in to create a racer',
      life: 5000
    })
    return
  }

  loading.value = true
  clearErrors()

  try {
    // Create racer with Supabase

    const { $supabase } = useNuxtApp()

    const { data, error } = await $supabase
      .from('racers')
      .insert([
        {
          name: form.name.trim(),
          user_id: authStore.userId
        }
      ])
      .select()

    if (error) throw error

    if (!data || data.length === 0) {
      throw new Error('No racer data returned')
    }

    // Show success toast
    $toast.add({
      severity: 'success',
      summary: 'Racer Created!',
      detail: `${form.name} has been successfully created.`,
      life: 4000
    })

    // Redirect to racers list
    setTimeout(() => {
      router.push('/racers?created=true')
    }, 1000)
  } catch (error) {
    console.error('Error creating racer:', error)

    // Show error toast
    $toast.add({
      severity: 'error',
      summary: 'Creation Failed',
      detail: error.message || 'Failed to create racer. Please try again.',
      life: 5000
    })
  } finally {
    loading.value = false
  }
}

// Initialize auth
onMounted(() => {
  authStore.initAuth()

  // Redirect if not authenticated
  if (!authStore.isAuthenticated) {
    router.push('/login')
  }
})

useHead({
  title: 'Add New Racer - Brick Race Championship'
})
</script>
