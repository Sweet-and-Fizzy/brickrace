import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    session: null
  }),

  getters: {
    isAuthenticated: (state) => !!state.session,
    isAdmin: (state) => state.user?.user_metadata?.isAdmin || false,
    isRaceAdmin: (state) =>
      state.user?.user_metadata?.isRaceAdmin || state.user?.user_metadata?.isAdmin || false,
    userId: (state) => state.user?.id,
    userEmail: (state) => state.user?.email,
    username: (state) => state.user?.user_metadata?.username || state.user?.email?.split('@')[0]
  },

  actions: {
    async login(credentials) {
      const { $supabase } = useNuxtApp()

      const { data, error } = await $supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      })

      if (error) throw error

      this.user = data.user
      this.session = data.session

      return data
    },

    async register(userData) {
      const { $supabase } = useNuxtApp()

      const { data, error } = await $supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            username: userData.name || userData.email.split('@')[0]
          }
        }
      })

      if (error) throw error

      // Update state if successful
      if (data.user && data.session) {
        this.user = data.user
        this.session = data.session
      }

      return data
    },

    async logout() {
      const { $supabase } = useNuxtApp()

      const { error } = await $supabase.auth.signOut()
      if (error) throw error

      this.user = null
      this.session = null

      // Redirect to home page
      await navigateTo('/')
    },

    async initAuth() {
      const { $supabase } = useNuxtApp()

      // Get initial session
      const {
        data: { session }
      } = await $supabase.auth.getSession()

      if (session) {
        this.user = session.user
        this.session = session
      }

      // Listen for auth changes
      $supabase.auth.onAuthStateChange((event, session) => {
        if (session) {
          this.user = session.user
          this.session = session
        } else {
          this.user = null
          this.session = null
        }
      })
    }
  }
})
