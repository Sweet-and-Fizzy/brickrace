<template>
  <div class="min-h-screen bg-white dark:bg-gray-900">
    <div class="container mx-auto px-4 py-12 max-w-2xl">
      <!-- Header -->
      <div class="text-center mb-12">
        <div
          class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-600 to-teal-600 rounded-full mb-6"
        >
          <i class="pi pi-car text-2xl text-white" />
        </div>
        <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">Add New Racer</h1>
        <p class="text-lg text-gray-600 dark:text-gray-300 max-w-lg mx-auto">
          Create a new custom gravity-powered vehicle for the competition
        </p>
      </div>

      <!-- Requirements Card -->
      <div
        class="bg-gradient-to-r from-red-700 to-red-800 rounded-2xl p-6 mb-8 text-white shadow-lg"
      >
        <div class="flex items-start space-x-3">
          <div class="flex-shrink-0">
            <i class="pi pi-info-circle text-xl" />
          </div>
          <div>
            <h3 class="font-semibold text-lg mb-2">Competition Requirements</h3>
            <ul class="space-y-1 text-red-50">
              <li>• Must contain a brick somewhere in the design</li>
              <li>
                • Must be less than 10" wide × 18" long × 15" high (lighter artistic elements may
                exceed 15")
              </li>
              <li>• Must weigh less than 15 lbs</li>
              <li>• Judged on speed, creativity, and artistic design</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Form Card -->
      <div
        class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden"
      >
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
              <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                You can add weight, photos, and other details later by editing your racer.
              </p>
            </div>

            <!-- Action Buttons -->
            <div
              class="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200 dark:border-gray-600"
            >
              <NuxtLink to="/racers" class="flex-1">
                <Button type="button" class="btn-secondary w-full"><span>Cancel</span></Button>
              </NuxtLink>

              <Button
                type="submit"
                :loading="loading"
                :disabled="!form.name || !authStore.isAuthenticated"
                icon="pi pi-plus"
                class="btn-primary flex-1"
              >
                <span>Create Racer</span>
              </Button>
            </div>
          </form>
        </div>
      </div>

      <!-- Help Text -->
      <div class="text-center mt-8">
        <p class="text-gray-500 dark:text-gray-400 text-sm">
          Need help? Check out our
          <NuxtLink
            to="/build-racer"
            class="text-green-700 hover:text-green-600 dark:text-green-400 dark:hover:text-green-300 font-medium"
            >building guidelines</NuxtLink
          >
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

    const supabase = useSupabaseClient()

    const { data, error } = await supabase
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
      detail: `${form.name} has been successfully created. Add photos and details on the next page.`,
      life: 4000
    })

    // Redirect to racer edit page
    setTimeout(() => {
      router.push(`/racers/${data[0].id}/edit`)
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
  title: 'Add New Racer - The Great Holyoke Brick Race'
})
</script>
