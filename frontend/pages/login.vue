<template>
  <div
    class="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
  >
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Sign in to your account
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Or
          <NuxtLink
            to="/register"
            class="font-medium text-brand-blue hover:text-brand-blue/80 dark:text-blue-400 dark:hover:text-blue-300"
          >
            create a new account
          </NuxtLink>
        </p>
      </div>

      <Card class="mt-8">
        <template #content>
          <div class="space-y-6">
            <!-- Social Login Buttons -->
            <div class="space-y-3">
              <Button
                :loading="socialLoading === 'google'"
                class="w-full btn-secondary"
                @click="handleSocialLogin('google')"
              >
                <i class="pi pi-google mr-2" />
                <span>Continue with Google</span>
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
            <form class="space-y-4" @submit.prevent="handleLogin">
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
                  autocomplete="current-password"
                  placeholder="Enter your password"
                  :invalid="!!errors.password"
                  :feedback="false"
                  toggle-mask
                  input-class="w-full"
                  class="w-full"
                />
                <p v-if="errors.password" class="mt-1 text-sm text-red-600">
                  {{ errors.password }}
                </p>
              </div>

              <div>
                <Button type="submit" :loading="loading" class="w-full btn-primary">
                  <span>Sign in</span>
                </Button>
              </div>

              <div class="text-center">
                <NuxtLink
                  to="/forgot-password"
                  class="text-sm text-brand-blue hover:text-brand-blue/80 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Forgot your password?
                </NuxtLink>
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

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

// Get redirect parameter from query
const redirectTo = route.query.redirect || '/'

const form = reactive({
  email: '',
  password: ''
})

const errors = reactive({
  email: '',
  password: '',
  general: ''
})

const loading = ref(false)
const socialLoading = ref('')

const clearErrors = () => {
  errors.email = ''
  errors.password = ''
  errors.general = ''
}

const handleLogin = async () => {
  clearErrors()

  if (!form.email) {
    errors.email = 'Email is required'
    return
  }

  if (!form.password) {
    errors.password = 'Password is required'
    return
  }

  loading.value = true

  try {
    await authStore.login({
      email: form.email,
      password: form.password
    })

    // Redirect to intended page after successful login
    await router.push(redirectTo)
  } catch (error) {
    // Keep essential error logging for production debugging
    console.error('Login error:', error)

    if (error.message) {
      // Handle specific Supabase auth errors
      if (error.message.includes('Email not confirmed')) {
        errors.general =
          'Please check your email and click the confirmation link before signing in.'
      } else if (error.message.includes('Invalid login credentials')) {
        errors.general = 'Invalid email or password. Please try again.'
      } else {
        errors.general = error.message
      }
    } else {
      errors.general = 'Login failed. Please try again.'
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
    errors.general = error.message || `Failed to sign in with ${provider}. Please try again.`
  } finally {
    socialLoading.value = ''
  }
}

// Redirect if already authenticated
onMounted(() => {
  authStore.initAuth()
  if (authStore.isAuthenticated) {
    router.push(redirectTo)
  }
})

useHead({
  title: 'Login - The Great Holyoke Brick Race'
})
</script>
