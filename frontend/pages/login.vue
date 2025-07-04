<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Or
          <NuxtLink to="/register" class="font-medium text-blue-600 hover:text-blue-500">
            create a new account
          </NuxtLink>
        </p>
      </div>

      <Card class="mt-8">
        <template #content>
          <form class="space-y-6" @submit.prevent="handleLogin">
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
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
              <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
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
                class="w-full"
              />
              <p v-if="errors.password" class="mt-1 text-sm text-red-600">{{ errors.password }}</p>
            </div>

            <div>
              <Button
                type="submit"
                :loading="loading"
                label="Sign in"
                class="w-full"
                severity="primary"
              />
            </div>
          </form>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'

definePageMeta({
  layout: false
})

const authStore = useAuthStore()
const router = useRouter()
const $toast = useToast()

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

    // Redirect to home page after successful login
    await router.push('/')
  } catch (error) {
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

// Redirect if already authenticated
onMounted(() => {
  authStore.initAuth()
  if (authStore.isAuthenticated) {
    router.push('/')
  }
})

useHead({
  title: 'Login - Brick Race Championship'
})
</script>
