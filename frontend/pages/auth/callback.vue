<template>
  <div class="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="flex justify-center">
        <img
          src="~/assets/img/brick_race_logo.jpg"
          alt="The The Great Holyoke Brick Race Logo"
          class="h-20 w-auto object-contain rounded-lg"
        >
      </div>
      <h2 class="mt-6 text-center text-3xl font-bold text-gray-900 dark:text-white">
        Completing Sign In...
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
        Please wait while we complete your authentication
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <div class="text-center">
          <div v-if="loading" class="space-y-4">
            <i class="pi pi-spin pi-spinner text-4xl text-blue-600" />
            <p class="text-gray-600 dark:text-gray-300">Processing authentication...</p>
          </div>

          <div v-else-if="error" class="space-y-4">
            <i class="pi pi-exclamation-triangle text-4xl text-red-600" />
            <h3 class="text-lg font-medium text-red-800 dark:text-red-200">Authentication Failed</h3>
            <p class="text-red-600 dark:text-red-300">{{ error }}</p>
            <div class="mt-4">
              <Button
                severity="secondary"
                outlined
                @click="navigateToLogin"
              >
                Return to Login
              </Button>
            </div>
          </div>

          <div v-else class="space-y-4">
            <i class="pi pi-check-circle text-4xl text-green-600" />
            <h3 class="text-lg font-medium text-green-800 dark:text-green-200">Success!</h3>
            <p class="text-green-600 dark:text-green-300">Redirecting you now...</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: false
})

const authStore = useAuthStore()
const router = useRouter()
const { $supabase } = useNuxtApp()

const loading = ref(true)
const error = ref('')

const navigateToLogin = () => {
  router.push('/login')
}

onMounted(async () => {
  try {
    // Handle the OAuth callback
    const { data, error: authError } = await $supabase.auth.getSession()
    
    if (authError) {
      throw authError
    }

    if (data.session) {
      // Update auth store with session data
      authStore.user = data.session.user
      authStore.session = data.session
      
      // Redirect to home page
      await router.push('/')
    } else {
      throw new Error('No session found after authentication')
    }
  } catch (err) {
    console.error('OAuth callback error:', err)
    error.value = err.message || 'Authentication failed. Please try again.'
  } finally {
    loading.value = false
  }
})

useHead({
  title: 'Completing Sign In - The Great Holyoke Brick Race',
  meta: [
    {
      name: 'description',
      content: 'Completing your authentication for the The Great Holyoke Brick Race platform.'
    }
  ]
})
</script>