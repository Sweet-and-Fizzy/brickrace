<template>
  <div class="min-h-screen bg-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="text-center">
        <h1 class="text-2xl font-bold text-black mb-2">The Great Holyoke Brick Race</h1>
      </div>
      <h2 class="mt-4 text-center text-3xl font-bold text-black">Reset Your Password</h2>
      <p class="mt-2 text-center text-sm text-gray-600">Enter your new password below</p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <form class="space-y-6" @submit.prevent="handlePasswordReset">
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">
              New Password
            </label>
            <div class="mt-1">
              <Password
                id="password"
                v-model="password"
                autocomplete="new-password"
                required
                class="w-full"
                input-class="w-full"
                :class="{ 'p-invalid': passwordError }"
                placeholder="Enter your new password"
                :feedback="true"
                toggle-mask
                @blur="validatePassword"
              />
              <small v-if="passwordError" class="p-error">{{ passwordError }}</small>
            </div>
          </div>

          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700">
              Confirm New Password
            </label>
            <div class="mt-1">
              <Password
                id="confirmPassword"
                v-model="confirmPassword"
                autocomplete="new-password"
                required
                class="w-full"
                input-class="w-full"
                :class="{ 'p-invalid': confirmPasswordError }"
                placeholder="Confirm your new password"
                :feedback="false"
                toggle-mask
                @blur="validateConfirmPassword"
              />
              <small v-if="confirmPasswordError" class="p-error">{{ confirmPasswordError }}</small>
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
              <i class="pi pi-check mr-2" />
              <span>Update Password</span>
            </Button>
          </div>
        </form>

        <!-- Success Message -->
        <div
          v-if="resetComplete"
          class="mt-6 p-4 bg-green-50/20 border border-green-200 rounded-lg"
        >
          <div class="flex">
            <div class="flex-shrink-0">
              <i class="pi pi-check-circle text-green-400" />
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-green-800">Password updated successfully!</h3>
              <div class="mt-2 text-sm text-green-700">
                <p>Your password has been updated. You can now sign in with your new password.</p>
              </div>
              <div class="mt-4">
                <Button severity="secondary" size="small" outlined @click="navigateToLogin">
                  Go to Login
                </Button>
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
              <h3 class="text-sm font-medium text-red-800">Error updating password</h3>
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
import { useAuthStore } from '~/stores/auth'

const supabase = useSupabaseClient()
const authStore = useAuthStore()
const router = useRouter()

// Form state
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const resetComplete = ref(false)
const error = ref('')
const passwordError = ref('')
const confirmPasswordError = ref('')

// Validation
const validatePassword = () => {
  if (!password.value) {
    passwordError.value = 'Password is required'
    return false
  }
  if (password.value.length < 6) {
    passwordError.value = 'Password must be at least 6 characters long'
    return false
  }
  passwordError.value = ''
  return true
}

const validateConfirmPassword = () => {
  if (!confirmPassword.value) {
    confirmPasswordError.value = 'Please confirm your password'
    return false
  }
  if (password.value !== confirmPassword.value) {
    confirmPasswordError.value = 'Passwords do not match'
    return false
  }
  confirmPasswordError.value = ''
  return true
}

const isFormValid = computed(() => {
  return (
    password.value &&
    confirmPassword.value &&
    password.value === confirmPassword.value &&
    password.value.length >= 6 &&
    !passwordError.value &&
    !confirmPasswordError.value
  )
})

// Handle password reset
const handlePasswordReset = async () => {
  if (!validatePassword() || !validateConfirmPassword()) return

  loading.value = true
  error.value = ''
  resetComplete.value = false

  try {
    const { error: updateError } = await supabase.auth.updateUser({
      password: password.value
    })

    if (updateError) {
      throw updateError
    }

    resetComplete.value = true
  } catch (err) {
    // Keep essential error logging for production debugging
    console.error('Password reset error:', err)

    // Handle specific error cases
    if (err.message.includes('session')) {
      error.value = 'Reset link has expired. Please request a new password reset.'
    } else if (err.message.includes('weak')) {
      error.value = 'Password is too weak. Please choose a stronger password.'
    } else {
      error.value = err.message || 'Failed to update password. Please try again.'
    }
  } finally {
    loading.value = false
  }
}

const navigateToLogin = () => {
  router.push('/login')
}

// Clear errors when fields change
watch(password, () => {
  if (error.value) error.value = ''
  if (passwordError.value) passwordError.value = ''
  if (confirmPasswordError.value && confirmPassword.value) {
    validateConfirmPassword()
  }
})

watch(confirmPassword, () => {
  if (error.value) error.value = ''
  if (confirmPasswordError.value) confirmPasswordError.value = ''
})

// Meta
useHead({
  title: 'Reset Password - The Great Holyoke Brick Race',
  meta: [
    {
      name: 'description',
      content: 'Set your new password for the The Great Holyoke Brick Race platform.'
    }
  ]
})

// Redirect if already authenticated
if (authStore.isAuthenticated) {
  await navigateTo('/')
}
</script>
