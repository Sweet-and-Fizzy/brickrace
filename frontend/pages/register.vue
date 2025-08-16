<template>
  <div
    class="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
  >
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          The Great Holyoke Brick Race
        </h1>
        <h2 class="mt-4 text-3xl font-bold text-gray-900 dark:text-white">Create your account</h2>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Or
          <NuxtLink
            to="/login"
            class="font-medium text-brand-blue hover:text-brand-blue/80 dark:text-brand-blue dark:hover:text-brand-blue/80 transition-colors"
          >
            sign in to existing account
          </NuxtLink>
        </p>
      </div>

      <!-- Email Confirmation Message -->
      <Card
        v-if="showConfirmation"
        class="shadow-xl border-2 border-brand-green bg-white dark:bg-gray-800"
      >
        <template #content>
          <div class="text-center p-6">
            <div class="mb-4">
              <i class="pi pi-envelope text-4xl text-brand-green" />
            </div>
            <h3 class="text-xl font-bold text-green-800 dark:text-green-200 mb-3">
              Check Your Email!
            </h3>
            <p class="text-green-700 dark:text-green-300 mb-4">
              We've sent a confirmation link to:
            </p>
            <p
              class="font-mono text-green-800 dark:text-green-200 bg-green-100 dark:bg-green-800/30 px-4 py-2 rounded-lg mb-4"
            >
              {{ registeredEmail }}
            </p>
            <p class="text-green-700 dark:text-green-300 text-sm mb-6">
              Click the link in your email to activate your account, then you can sign in.
            </p>
            <div class="space-y-3">
              <NuxtLink to="/login">
                <Button class="w-full" severity="success">
                  <i class="pi pi-sign-in mr-2" />
                  Go to Sign In
                </Button>
              </NuxtLink>
              <Button text severity="secondary" class="w-full" @click="showConfirmation = false">
                Register Another Account
              </Button>
            </div>
          </div>
        </template>
      </Card>

      <!-- Registration Form -->
      <Card v-else class="shadow-xl border-0">
        <template #content>
          <div class="space-y-6 p-6">
            <!-- Social Login Buttons -->
            <div class="space-y-3">
              <Button
                :loading="socialLoading === 'google'"
                severity="secondary"
                outlined
                class="w-full"
                @click="handleSocialLogin('google')"
              >
                <i class="pi pi-google mr-2" />
                Continue with Google
              </Button>
            </div>

            <!-- Divider -->
            <div class="relative">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div class="relative flex justify-center text-sm">
                <span class="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                  >Or use email</span
                >
              </div>
            </div>

            <!-- Email/Password Form -->
            <form class="space-y-4" @submit.prevent="handleRegister">
              <div>
                <label
                  for="name"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Full Name
                </label>
                <InputText
                  id="name"
                  v-model="form.name"
                  autocomplete="name"
                  placeholder="Enter your full name"
                  :invalid="!!errors.name"
                  class="w-full"
                />
                <p v-if="errors.name" class="mt-1 text-sm text-red-600">{{ errors.name }}</p>
              </div>

              <div>
                <label
                  for="email"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Email address
                </label>
                <InputText
                  id="email"
                  v-model="form.email"
                  type="email"
                  autocomplete="email"
                  placeholder="Enter your email"
                  :invalid="!!errors.email"
                  class="w-full"
                />
                <p v-if="errors.email" class="mt-1 text-sm text-red-600">{{ errors.email }}</p>
              </div>

              <div>
                <label
                  for="password"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Password
                </label>
                <Password
                  id="password"
                  v-model="form.password"
                  autocomplete="new-password"
                  placeholder="Choose a password"
                  :invalid="!!errors.password"
                  toggle-mask
                  input-class="w-full"
                  class="w-full"
                />
                <p v-if="errors.password" class="mt-1 text-sm text-red-600">
                  {{ errors.password }}
                </p>
              </div>

              <div>
                <label
                  for="confirmPassword"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Confirm Password
                </label>
                <Password
                  id="confirmPassword"
                  v-model="form.confirmPassword"
                  autocomplete="new-password"
                  placeholder="Confirm your password"
                  :invalid="!!errors.confirmPassword"
                  :feedback="false"
                  toggle-mask
                  input-class="w-full"
                  class="w-full"
                />
                <p v-if="errors.confirmPassword" class="mt-1 text-sm text-red-600">
                  {{ errors.confirmPassword }}
                </p>
              </div>

              <Message v-if="errors.general" severity="error" :closable="false">
                {{ errors.general }}
              </Message>

              <div>
                <Button type="submit" :loading="loading" class="w-full btn-primary">
                  <span>Create Account</span>
                </Button>
              </div>
            </form>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Message from 'primevue/message'

const authStore = useAuthStore()
const router = useRouter()

const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const errors = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  general: ''
})

const loading = ref(false)
const socialLoading = ref('')

const clearErrors = () => {
  errors.name = ''
  errors.email = ''
  errors.password = ''
  errors.confirmPassword = ''
  errors.general = ''
}

const validateForm = () => {
  let isValid = true

  if (!form.name.trim()) {
    errors.name = 'Name is required'
    isValid = false
  }

  if (!form.email.trim()) {
    errors.email = 'Email is required'
    isValid = false
  }

  if (!form.password) {
    errors.password = 'Password is required'
    isValid = false
  } else if (form.password.length < 6) {
    errors.password = 'Password must be at least 6 characters'
    isValid = false
  }

  if (form.password !== form.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match'
    isValid = false
  }

  return isValid
}

const showConfirmation = ref(false)
const registeredEmail = ref('')

const handleRegister = async () => {
  clearErrors()

  if (!validateForm()) {
    return
  }

  loading.value = true

  try {
    const result = await authStore.register({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password
    })

    // Check if user needs email confirmation
    if (result.user && !result.session) {
      // Email confirmation required
      registeredEmail.value = form.email.trim()
      showConfirmation.value = true
    } else {
      // User is signed in immediately (shouldn't happen with email confirmation enabled)
      await router.push('/')
    }
  } catch (error) {
    // Keep essential error logging for production debugging
    console.error('Registration error:', error)

    if (error.message) {
      errors.general = error.message
    } else {
      errors.general = 'Registration failed. Please try again.'
    }
  } finally {
    loading.value = false
  }
}

const handleSocialLogin = async (provider) => {
  clearErrors()
  socialLoading.value = provider

  try {
    await authStore.signInWithProvider(provider)
    // The redirect will be handled by Supabase
  } catch (error) {
    // Keep essential error logging for production debugging
    console.error('Social login error:', error)
    errors.general = error.message || `Failed to sign up with ${provider}. Please try again.`
  } finally {
    socialLoading.value = ''
  }
}

// Redirect if already authenticated
onMounted(() => {
  authStore.initAuth()
  if (authStore.isAuthenticated) {
    router.push('/')
  }
})

useHead({
  title: 'Register - The Great Holyoke Brick Race'
})
</script>
