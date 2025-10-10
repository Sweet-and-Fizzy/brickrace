<template>
  <div class="min-h-screen bg-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="text-center text-3xl font-extrabold text-black">Sign in to your account</h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Or
          <NuxtLink
            to="/register"
            class="font-medium text-black hover:text-gray-600 transition-colors underline hover:no-underline"
          >
            create a new account
          </NuxtLink>
        </p>
      </div>

      <Card class="mt-8">
        <template #content>
          <div class="space-y-6">
            <!-- Success/Error Messages -->
            <Message
              v-if="errors.general && errors.general.includes('verified')"
              severity="success"
              :closable="false"
            >
              {{ errors.general }}
            </Message>
            <Message
              v-else-if="errors.general"
              severity="error"
              :closable="true"
              @close="errors.general = ''"
            >
              {{ errors.general }}
              <div v-if="errors.general.includes('Email verification required')" class="mt-3">
                <Button
                  :loading="resendingEmail"
                  class="btn-secondary"
                  size="small"
                  @click="resendVerificationEmail"
                >
                  <i class="pi pi-envelope mr-2" />
                  <span>Resend Verification Email</span>
                </Button>
              </div>
            </Message>
            <Message
              v-if="verificationEmailSent"
              severity="success"
              :closable="true"
              @close="verificationEmailSent = false"
            >
              ✅ Verification email sent! Please check your inbox (and spam folder).
            </Message>

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
                <div class="w-full border-t border-gray-300" />
              </div>
              <div class="relative flex justify-center text-sm">
                <span class="px-2 bg-white text-gray-500">Or use email</span>
              </div>
            </div>

            <!-- Email/Password Form -->
            <form class="space-y-4" @submit.prevent="handleLogin">
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
                  class="text-sm text-black hover:text-gray-600 transition-colors underline hover:no-underline"
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
const resendingEmail = ref(false)
const verificationEmailSent = ref(false)

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
    // First, refresh the session to handle post-email-verification state
    const supabase = useSupabaseClient()
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error('Session refresh error:', sessionError)
    }

    // If already authenticated (e.g., after email verification), just redirect
    if (session?.user && session.user.email === form.email) {
      authStore.user = session.user
      authStore.session = session
      await router.push(redirectTo)
      return
    }

    // If session exists but email doesn't match, sign out first
    if (session?.user && session.user.email !== form.email) {
      await supabase.auth.signOut()
    }

    // Proceed with login
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
          '📧 Email verification required. Please check your inbox and click the confirmation link we sent you before signing in.'
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

const resendVerificationEmail = async () => {
  if (!form.email) {
    errors.email = 'Please enter your email address first'
    return
  }

  resendingEmail.value = true
  verificationEmailSent.value = false

  try {
    const supabase = useSupabaseClient()

    // Supabase requires us to use the resend method with type 'signup'
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: form.email
    })

    if (error) {
      console.error('Resend verification error:', error)
      errors.general = `Failed to resend email: ${error.message}`
    } else {
      verificationEmailSent.value = true
      errors.general = '' // Clear the error message
    }
  } catch (error) {
    console.error('Resend error:', error)
    errors.general = 'Failed to resend verification email. Please try again.'
  } finally {
    resendingEmail.value = false
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
onMounted(async () => {
  await authStore.initAuth()

  // Check if coming from email verification
  const hashParams = new URLSearchParams(window.location.hash.substring(1))
  const type = hashParams.get('type')

  if (type === 'email') {
    // User just verified their email
    errors.general = 'Email verified successfully! Click Sign in to continue.'

    // Refresh the session to pick up the verification
    const supabase = useSupabaseClient()
    const {
      data: { session }
    } = await supabase.auth.getSession()

    if (session?.user) {
      // If we got a session, update the store
      authStore.user = session.user
      authStore.session = session

      // Auto-redirect after email verification
      setTimeout(() => {
        router.push(redirectTo)
      }, 1500) // Give user time to see the success message
    }
  } else if (authStore.isAuthenticated) {
    // Already logged in, redirect
    router.push(redirectTo)
  }
})

useHead({
  title: 'Login - The Great Holyoke Brick Race'
})
</script>
