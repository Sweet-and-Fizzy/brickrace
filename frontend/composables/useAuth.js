import { ref, reactive, computed } from 'vue'
import { useAuthStore } from '~/stores/auth'

export const useAuth = () => {
  const supabase = useSupabaseClient()
  const authStore = useAuthStore()
  const $toast = useToast()
  const router = useRouter()

  // Form states
  const loginForm = reactive({
    email: '',
    password: ''
  })

  const registerForm = reactive({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  const forgotPasswordForm = reactive({
    email: ''
  })

  const resetPasswordForm = reactive({
    password: '',
    confirmPassword: ''
  })

  // UI states
  const loading = ref(false)
  const errors = reactive({})
  const showPassword = ref(false)
  const showConfirmPassword = ref(false)

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/
    if (!email) return 'Email is required'
    if (!emailRegex.test(email)) return 'Please enter a valid email address'
    return null
  }

  const validatePassword = (password) => {
    if (!password) return 'Password is required'
    if (password.length < 6) return 'Password must be at least 6 characters'
    return null
  }

  const validateName = (name) => {
    if (!name) return 'Name is required'
    if (name.length < 2) return 'Name must be at least 2 characters'
    return null
  }

  const validatePasswordConfirmation = (password, confirmPassword) => {
    if (!confirmPassword) return 'Password confirmation is required'
    if (password !== confirmPassword) return 'Passwords do not match'
    return null
  }

  // Form validation
  const validateLoginForm = () => {
    const newErrors = {}

    const emailError = validateEmail(loginForm.email)
    if (emailError) newErrors.email = emailError

    const passwordError = validatePassword(loginForm.password)
    if (passwordError) newErrors.password = passwordError

    Object.assign(errors, newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateRegisterForm = () => {
    const newErrors = {}

    const nameError = validateName(registerForm.name)
    if (nameError) newErrors.name = nameError

    const emailError = validateEmail(registerForm.email)
    if (emailError) newErrors.email = emailError

    const passwordError = validatePassword(registerForm.password)
    if (passwordError) newErrors.password = passwordError

    const confirmPasswordError = validatePasswordConfirmation(
      registerForm.password,
      registerForm.confirmPassword
    )
    if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError

    Object.assign(errors, newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateForgotPasswordForm = () => {
    const newErrors = {}

    const emailError = validateEmail(forgotPasswordForm.email)
    if (emailError) newErrors.email = emailError

    Object.assign(errors, newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateResetPasswordForm = () => {
    const newErrors = {}

    const passwordError = validatePassword(resetPasswordForm.password)
    if (passwordError) newErrors.password = passwordError

    const confirmPasswordError = validatePasswordConfirmation(
      resetPasswordForm.password,
      resetPasswordForm.confirmPassword
    )
    if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError

    Object.assign(errors, newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Authentication actions
  const handleLogin = async () => {
    clearErrors()

    if (!validateLoginForm()) {
      return false
    }

    loading.value = true

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginForm.email,
        password: loginForm.password
      })

      if (error) throw error

      // Update auth store
      await authStore.setUser(data.user)

      $toast.add({
        severity: 'success',
        summary: 'Welcome back!',
        detail: 'You have been successfully logged in.',
        life: 4000
      })

      // Redirect to intended page or home
      const redirect = router.currentRoute.value.query.redirect || '/'
      await navigateTo(redirect)

      return true
    } catch (error) {
      // Keep essential error logging for production debugging
      console.error('Login error:', error)

      let errorMessage = 'Login failed. Please try again.'

      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please check your credentials.'
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Please check your email and click the confirmation link before logging in.'
      } else if (error.message.includes('Too many requests')) {
        errorMessage = 'Too many login attempts. Please wait a moment and try again.'
      }

      $toast.add({
        severity: 'error',
        summary: 'Login Failed',
        detail: errorMessage,
        life: 6000
      })

      return false
    } finally {
      loading.value = false
    }
  }

  const handleRegister = async () => {
    clearErrors()

    if (!validateRegisterForm()) {
      return false
    }

    loading.value = true

    try {
      const { error } = await supabase.auth.signUp({
        email: registerForm.email,
        password: registerForm.password,
        options: {
          data: {
            name: registerForm.name
          }
        }
      })

      if (error) throw error

      $toast.add({
        severity: 'success',
        summary: 'Registration Successful!',
        detail: 'Please check your email for a confirmation link to complete your registration.',
        life: 8000
      })

      // Clear form
      resetRegisterForm()

      // Redirect to login
      await navigateTo('/login')

      return true
    } catch (error) {
      // Keep essential error logging for production debugging
      console.error('Registration error:', error)

      let errorMessage = 'Registration failed. Please try again.'

      if (error.message.includes('User already registered')) {
        errorMessage = 'This email is already registered. Please try logging in instead.'
      } else if (error.message.includes('Password should be at least')) {
        errorMessage = 'Password is too weak. Please choose a stronger password.'
      } else if (error.message.includes('Invalid email')) {
        errorMessage = 'Please enter a valid email address.'
      }

      $toast.add({
        severity: 'error',
        summary: 'Registration Failed',
        detail: errorMessage,
        life: 6000
      })

      return false
    } finally {
      loading.value = false
    }
  }

  const handleForgotPassword = async () => {
    clearErrors()

    if (!validateForgotPasswordForm()) {
      return false
    }

    loading.value = true

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordForm.email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) throw error

      $toast.add({
        severity: 'success',
        summary: 'Reset Email Sent!',
        detail: 'Please check your email for password reset instructions.',
        life: 8000
      })

      // Clear form
      resetForgotPasswordForm()

      return true
    } catch (error) {
      // Keep essential error logging for production debugging
      console.error('Password reset error:', error)

      let errorMessage = 'Failed to send reset email. Please try again.'

      if (error.message.includes('Invalid email')) {
        errorMessage = 'Please enter a valid email address.'
      } else if (error.message.includes('Too many requests')) {
        errorMessage = 'Too many requests. Please wait a moment before trying again.'
      }

      $toast.add({
        severity: 'error',
        summary: 'Reset Failed',
        detail: errorMessage,
        life: 6000
      })

      return false
    } finally {
      loading.value = false
    }
  }

  const handleResetPassword = async () => {
    clearErrors()

    if (!validateResetPasswordForm()) {
      return false
    }

    loading.value = true

    try {
      const { error } = await supabase.auth.updateUser({
        password: resetPasswordForm.password
      })

      if (error) throw error

      $toast.add({
        severity: 'success',
        summary: 'Password Updated!',
        detail: 'Your password has been successfully updated.',
        life: 4000
      })

      // Clear form
      resetResetPasswordForm()

      // Redirect to login or dashboard
      await navigateTo('/login')

      return true
    } catch (error) {
      // Keep essential error logging for production debugging
      console.error('Password update error:', error)

      let errorMessage = 'Failed to update password. Please try again.'

      if (error.message.includes('New password should be different')) {
        errorMessage = 'Please choose a different password from your current one.'
      } else if (error.message.includes('Password should be at least')) {
        errorMessage = 'Password is too weak. Please choose a stronger password.'
      }

      $toast.add({
        severity: 'error',
        summary: 'Update Failed',
        detail: errorMessage,
        life: 6000
      })

      return false
    } finally {
      loading.value = false
    }
  }

  const handleGoogleLogin = async () => {
    loading.value = true

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error

      return true
    } catch (error) {
      // Keep essential error logging for production debugging
      console.error('Google login error:', error)

      $toast.add({
        severity: 'error',
        summary: 'Google Login Failed',
        detail: 'Failed to log in with Google. Please try again.',
        life: 6000
      })

      return false
    } finally {
      loading.value = false
    }
  }

  const handleLogout = async () => {
    loading.value = true

    try {
      const { error } = await supabase.auth.signOut()

      if (error) throw error

      // Clear auth store
      authStore.clearUser()

      $toast.add({
        severity: 'info',
        summary: 'Logged Out',
        detail: 'You have been successfully logged out.',
        life: 3000
      })

      // Redirect to home
      await navigateTo('/')

      return true
    } catch (error) {
      // Keep essential error logging for production debugging
      console.error('Logout error:', error)

      $toast.add({
        severity: 'error',
        summary: 'Logout Failed',
        detail: 'Failed to log out. Please try again.',
        life: 5000
      })

      return false
    } finally {
      loading.value = false
    }
  }

  // Utility functions
  const clearErrors = () => {
    Object.keys(errors).forEach((key) => {
      delete errors[key]
    })
  }

  const resetLoginForm = () => {
    loginForm.email = ''
    loginForm.password = ''
    clearErrors()
  }

  const resetRegisterForm = () => {
    registerForm.name = ''
    registerForm.email = ''
    registerForm.password = ''
    registerForm.confirmPassword = ''
    clearErrors()
  }

  const resetForgotPasswordForm = () => {
    forgotPasswordForm.email = ''
    clearErrors()
  }

  const resetResetPasswordForm = () => {
    resetPasswordForm.password = ''
    resetPasswordForm.confirmPassword = ''
    clearErrors()
  }

  // Computed properties
  const isLoginFormValid = computed(() => {
    return (
      loginForm.email &&
      loginForm.password &&
      validateEmail(loginForm.email) === null &&
      validatePassword(loginForm.password) === null
    )
  })

  const isRegisterFormValid = computed(() => {
    return (
      registerForm.name &&
      registerForm.email &&
      registerForm.password &&
      registerForm.confirmPassword &&
      validateName(registerForm.name) === null &&
      validateEmail(registerForm.email) === null &&
      validatePassword(registerForm.password) === null &&
      validatePasswordConfirmation(registerForm.password, registerForm.confirmPassword) === null
    )
  })

  const isForgotPasswordFormValid = computed(() => {
    return forgotPasswordForm.email && validateEmail(forgotPasswordForm.email) === null
  })

  const isResetPasswordFormValid = computed(() => {
    return (
      resetPasswordForm.password &&
      resetPasswordForm.confirmPassword &&
      validatePassword(resetPasswordForm.password) === null &&
      validatePasswordConfirmation(
        resetPasswordForm.password,
        resetPasswordForm.confirmPassword
      ) === null
    )
  })

  const isAuthenticated = computed(() => authStore.isAuthenticated)
  const user = computed(() => authStore.user)
  const isAdmin = computed(() => authStore.isRaceAdmin)

  return {
    // Form states
    loginForm,
    registerForm,
    forgotPasswordForm,
    resetPasswordForm,

    // UI states
    loading,
    errors,
    showPassword,
    showConfirmPassword,

    // Validation
    validateLoginForm,
    validateRegisterForm,
    validateForgotPasswordForm,
    validateResetPasswordForm,

    // Actions
    handleLogin,
    handleRegister,
    handleForgotPassword,
    handleResetPassword,
    handleGoogleLogin,
    handleLogout,

    // Utilities
    clearErrors,
    resetLoginForm,
    resetRegisterForm,
    resetForgotPasswordForm,
    resetResetPasswordForm,

    // Computed
    isLoginFormValid,
    isRegisterFormValid,
    isForgotPasswordFormValid,
    isResetPasswordFormValid,
    isAuthenticated,
    user,
    isAdmin
  }
}
