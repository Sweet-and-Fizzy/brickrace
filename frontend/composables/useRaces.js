// Use Nuxt's useState for persistent state across hot reloads
const useRacesState = () => ({
  races: useState('races-data', () => []),
  loading: useState('races-loading', () => false),
  error: useState('races-error', () => null),
  initialized: useState('races-initialized', () => false),
  racesChannel: useState('races-channel', () => null)
})

export const useRaces = () => {
  const { $supabase } = useNuxtApp()
  const state = useRacesState()

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Format date for input fields
  const formatDateForInput = (dateString) => {
    return new Date(dateString).toISOString().split('T')[0]
  }

  // Get race date
  const getRaceDateTime = (race) => {
    return race.date
  }

  // Format race datetime for display
  const formatRaceDateTime = (race, options = {}) => {
    const raceDateTime = getRaceDateTime(race)
    if (!raceDateTime) return 'TBD'

    const defaultOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    }

    return new Date(raceDateTime).toLocaleDateString('en-US', { ...defaultOptions, ...options })
  }

  // Check if race is upcoming
  const isUpcoming = (race) => {
    const raceDateTime = race.race_datetime || race.date
    return raceDateTime ? new Date(raceDateTime) > new Date() : false
  }

  // Check if race is today
  const isToday = (race) => {
    const today = new Date()
    const raceDateTime = race.race_datetime || race.date
    if (!raceDateTime) return false
    const raceDate = new Date(raceDateTime)
    return today.toDateString() === raceDate.toDateString()
  }

  // Initial data fetch
  const fetchRaces = async () => {
    state.loading.value = true
    state.error.value = null

    try {
      const { data: racesData, error: racesError } = await $supabase
        .from('races')
        .select('*')
        .order('date', { ascending: false })

      if (racesError) throw racesError

      const races = racesData || []

      // Get checkin counts for each race
      for (const race of races) {
        const { count } = await $supabase
          .from('checkins')
          .select('*', { count: 'exact', head: true })
          .eq('race_id', race.id)

        race.checkinCount = count || 0
      }

      state.races.value = races
    } catch (err) {
      // Keep essential error logging for production debugging
      console.error('Error fetching races:', err)
      state.error.value = err.message
      state.races.value = []
    } finally {
      state.loading.value = false
    }
  }

  // Fetch single race with detailed data
  const fetchRaceById = async (raceId) => {
    try {
      const { data: raceData, error: raceError } = await $supabase
        .from('races')
        .select(
          `
          *,
          qualifiers(*),
          brackets(*),
          checkins(*)
        `
        )
        .eq('id', raceId)
        .single()

      if (raceError) throw raceError
      return raceData
    } catch (err) {
      // Keep essential error logging for production debugging
      console.error('Error fetching race:', err)
      throw err
    }
  }

  // Handle real-time updates for races
  const handleRaceUpdate = (payload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload

    switch (eventType) {
      case 'INSERT':
        // Add new race to the list
        state.races.value.unshift(newRecord)
        break

      case 'UPDATE': {
        // Update existing race
        const updateIndex = state.races.value.findIndex((r) => r.id === newRecord.id)
        if (updateIndex !== -1) {
          state.races.value[updateIndex] = newRecord
        }
        break
      }

      case 'DELETE':
        // Remove race from list
        state.races.value = state.races.value.filter((r) => r.id !== oldRecord.id)
        break
    }
  }

  // Setup real-time subscriptions
  const setupSubscriptions = () => {
    if (state.racesChannel.value) {
      if (process.env.NODE_ENV === 'development') {
        console.log('useRaces: Subscriptions already set up')
      }
      return
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('useRaces: Setting up subscriptions')
    }
    state.racesChannel.value = $supabase
      .channel('races-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'races'
        },
        handleRaceUpdate
      )
      .subscribe()
  }

  // Initialize on first use
  const initialize = async () => {
    // Use data presence as the source of truth instead of initialized flag
    if (state.races.value.length > 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log('useRaces: Already have data, skipping initialization')
      }
      // Still setup subscriptions if they haven't been set up yet
      if (import.meta.client && !state.racesChannel.value) {
        setupSubscriptions()
      }
      return
    }

    if (state.initialized.value) {
      if (process.env.NODE_ENV === 'development') {
        console.log('useRaces: Already initialized, skipping')
      }
      return
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('useRaces: Initializing...')
    }
    state.initialized.value = true
    await fetchRaces()
    if (import.meta.client) {
      setupSubscriptions()
    }
  }

  // Computed properties
  const activeRaces = computed(() => {
    return state.races.value.filter((race) => race.active)
  })

  const upcomingRaces = computed(() => {
    return state.races.value.filter((race) => race.active && isUpcoming(race))
  })

  const pastRaces = computed(() => {
    return state.races.value.filter((race) => !isUpcoming(race))
  })

  const todaysRaces = computed(() => {
    return state.races.value.filter((race) => race.active && isToday(race))
  })

  // Find the active race (for homepage)
  const activeRace = computed(() => {
    return state.races.value.find((race) => race.active) || null
  })

  // Past races for homepage (excluding active race, limited to 6)
  const recentPastRaces = computed(() => {
    return state.races.value.filter((race) => !race.active).slice(0, 6)
  })

  // Get race by ID from cached data
  const getRaceById = (raceId) => {
    return state.races.value.find((race) => race.id === raceId) || null
  }

  // Create new race (admin only)
  const createRace = async (raceData) => {
    state.loading.value = true
    state.error.value = null

    try {
      const { data: newRace, error: createError } = await $supabase
        .from('races')
        .insert(raceData)
        .select()
        .single()

      if (createError) throw createError

      // Add checkin count
      newRace.checkinCount = 0

      // Add to local state (will be at the top due to date ordering)
      state.races.value.unshift(newRace)

      return newRace
    } catch (err) {
      // Keep essential error logging for production debugging
      console.error('Error creating race:', err)
      state.error.value = err.message
      throw err
    } finally {
      state.loading.value = false
    }
  }

  // Update existing race (admin only)
  const updateRace = async (raceId, updates) => {
    state.loading.value = true
    state.error.value = null

    try {
      const { data: updatedRace, error: updateError } = await $supabase
        .from('races')
        .update(updates)
        .eq('id', raceId)
        .select()
        .single()

      if (updateError) throw updateError

      // Update local state
      const index = state.races.value.findIndex((race) => race.id === raceId)
      if (index !== -1) {
        // Preserve checkin count
        updatedRace.checkinCount = state.races.value[index].checkinCount
        state.races.value[index] = updatedRace
      }

      return updatedRace
    } catch (err) {
      // Keep essential error logging for production debugging
      console.error('Error updating race:', err)
      state.error.value = err.message
      throw err
    } finally {
      state.loading.value = false
    }
  }

  // Set active race (admin only) - deactivates all other races
  const setActiveRace = async (raceId) => {
    state.loading.value = true
    state.error.value = null

    try {
      // First, deactivate all races
      const { error: deactivateError } = await $supabase
        .from('races')
        .update({ active: false })
        .neq('id', raceId) // Deactivate all races except the one we're activating

      if (deactivateError) throw deactivateError

      // Then activate the selected race
      const { data: activatedRace, error: activateError } = await $supabase
        .from('races')
        .update({ active: true })
        .eq('id', raceId)
        .select()
        .single()

      if (activateError) throw activateError

      // Update local state - deactivate all races first
      state.races.value.forEach((race) => {
        race.active = race.id === raceId
      })

      return activatedRace
    } catch (err) {
      // Keep essential error logging for production debugging
      console.error('Error setting active race:', err)
      state.error.value = err.message
      throw err
    } finally {
      state.loading.value = false
    }
  }

  // Delete race (admin only)
  const deleteRace = async (raceId) => {
    state.loading.value = true
    state.error.value = null

    try {
      const { error: deleteError } = await $supabase.from('races').delete().eq('id', raceId)

      if (deleteError) throw deleteError

      // Remove from local state
      state.races.value = state.races.value.filter((race) => race.id !== raceId)

      return true
    } catch (err) {
      // Keep essential error logging for production debugging
      console.error('Error deleting race:', err)
      state.error.value = err.message
      throw err
    } finally {
      state.loading.value = false
    }
  }

  // Update race image
  const updateRaceImage = async (raceId, imageUrl) => {
    try {
      const { data: updatedRace, error: updateError } = await $supabase
        .from('races')
        .update({ image_url: imageUrl })
        .eq('id', raceId)
        .select()
        .single()

      if (updateError) throw updateError

      // Update local state
      const index = state.races.value.findIndex((race) => race.id === raceId)
      if (index !== -1) {
        state.races.value[index] = { ...state.races.value[index], ...updatedRace }
      }

      return updatedRace
    } catch (err) {
      // Keep essential error logging for production debugging
      console.error('Error updating race image:', err)
      throw err
    }
  }

  return {
    // Data
    races: readonly(state.races),
    activeRaces,
    upcomingRaces,
    pastRaces,
    todaysRaces,
    activeRace,
    recentPastRaces,
    loading: readonly(state.loading),
    error: readonly(state.error),

    // Methods
    initialize,
    fetchRaces,
    fetchRaceById,
    getRaceById,
    createRace,
    updateRace,
    setActiveRace,
    deleteRace,
    updateRaceImage,
    formatDate,
    formatDateForInput,
    getRaceDateTime,
    formatRaceDateTime,
    isUpcoming,
    isToday
  }
}
