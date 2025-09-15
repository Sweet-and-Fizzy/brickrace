<template>
  <div class="min-h-screen bg-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="text-center">
        <h1 class="text-2xl font-bold text-black mb-2">The Great Holyoke Brick Race</h1>
      </div>
      <h2 class="mt-4 text-center text-3xl font-bold text-black">Reset Your Password</h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        Enter your email address and we'll send you a link to reset your password
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <form class="space-y-6" @submit.prevent="handleResetRequest">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <div class="mt-1">
              <InputText
                id="email"
                v-model="email"
                type="email"
                autocomplete="email"
                required
                class="w-full"
                :class="{ 'p-invalid': emailError }"
                placeholder="Enter your email address"
                @blur="validateEmail"
              />
              <small v-if="emailError" class="p-error">{{ emailError }}</small>
            </div>
          </div>

          <div>
            <Button
              type="submit"
              :loading="loading"
              :disabled="!isFormValid || loading"
              class="w-full btn-primary"
              severity="primary"
            >
              <i class="pi pi-send mr-2" />
              <span>Send Reset Link</span>
            </Button>
          </div>
        </form>

        <!-- Success Message -->
        <div v-if="resetSent" class="mt-6 p-4 bg-green-50/20 border border-green-200 rounded-lg">
          <div class="flex">
            <div class="flex-shrink-0">
              <i class="pi pi-check-circle text-green-400" />
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-green-800">Reset link sent!</h3>
              <div class="mt-2 text-sm text-green-700">
                <p>
                  We've sent a password reset link to <strong>{{ email }}</strong
                  >. Check your email and follow the instructions to reset your password.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="error" class="mt-6 p-4 bg-red-50/20 border border-red-200 rounded-lg">
          <div class="flex">
            <div class="flex-shrink-0">
              <i class="pi pi-exclamation-triangle text-red-400" />
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800">Error sending reset link</h3>
              <div class="mt-2 text-sm text-red-700">
                <p>{{ error }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-6 text-center">
          <NuxtLink to="/login" class="text-sm text-blue-600 hover:text-blue-500">
            <i class="pi pi-arrow-left mr-1" />
            Back to login
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { isValidEmail } from '~/utils/helpers'
import { useAuthStore } from '~/stores/auth'

const supabase = useSupabaseClient()

// Form state
const email = ref('')
const loading = ref(false)
const resetSent = ref(false)
const error = ref('')
const emailError = ref('')

// Validation
const validateEmail = () => {
  if (!email.value) {
    emailError.value = 'Email is required'
    return false
  }
  if (!isValidEmail(email.value)) {
    emailError.value = 'Please enter a valid email address'
    return false
  }
  emailError.value = ''
  return true
}

const isFormValid = computed(() => {
  return email.value && isValidEmail(email.value) && !emailError.value
})

// Handle reset request
const handleResetRequest = async () => {
  if (!validateEmail()) return

  loading.value = true
  error.value = ''
  resetSent.value = false

  try {
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.value, {
      redirectTo: `${window.location.origin}/reset-password`
    })

    if (resetError) {
      throw resetError
    }

    resetSent.value = true
  } catch (err) {
    // Keep essential error logging for production debugging
    console.error('Password reset error:', err)

    // Handle specific error cases
    if (err.message.includes('rate limit')) {
      error.value = 'Too many reset requests. Please wait a few minutes before trying again.'
    } else if (err.message.includes('invalid')) {
      error.value = 'Please enter a valid email address.'
    } else {
      error.value = err.message || 'Failed to send reset email. Please try again.'
    }
  } finally {
    loading.value = false
  }
}

// Clear errors when email changes
watch(email, () => {
  if (error.value) error.value = ''
  if (emailError.value) emailError.value = ''
})

// Meta
useHead({
  title: 'Reset Password - The Great Holyoke Brick Race',
  meta: [
    {
      name: 'description',
      content: 'Reset your password for the The Great Holyoke Brick Race platform.'
    }
  ]
})

// Redirect if already authenticated
const authStore = useAuthStore()
if (authStore.isAuthenticated) {
  await navigateTo('/')
}
</script>
