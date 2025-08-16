export const useHeats = () => {
  const supabase = useSupabaseClient()
  
  // State management
  const currentRace = useState('heats-current-race', () => null)
  const currentHeat = useState('heats-current-heat', () => null)
  const upcomingHeats = useState('heats-upcoming', () => [])
  const loading = useState('heats-loading', () => false)
  const error = useState('heats-error', () => null)

  // Fetch current race and heat data
  const fetchCurrentRaceData = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch('/api/races/current')
      
      if (response.error) {
        throw new Error(response.error)
      }

      currentRace.value = response.data.race
      currentHeat.value = response.data.currentHeat
      upcomingHeats.value = response.data.upcomingHeats
      
      return response.data
    } catch (err) {
      console.error('Error fetching current race data:', err)
      error.value = err.message
      return null
    } finally {
      loading.value = false
    }
  }

  // Update qualifier times for current heat
  const updateHeatTimes = async (heatNumber, track1Time, track2Time) => {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch('/api/qualifiers/current', {
        method: 'PUT',
        body: {
          heat_number: heatNumber,
          track1_time: track1Time,
          track2_time: track2Time
        }
      })

      if (response.error) {
        throw new Error(response.error)
      }

      // Refresh current data
      await fetchCurrentRaceData()

      return response
    } catch (err) {
      console.error('Error updating heat times:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Edit a specific qualifier
  const editQualifier = async (qualifierId, updates) => {
    try {
      const response = await $fetch(`/api/qualifiers/${qualifierId}`, {
        method: 'PATCH',
        body: updates
      })

      if (response.error) {
        throw new Error(response.error)
      }

      // Refresh current data
      await fetchCurrentRaceData()

      return response.data
    } catch (err) {
      console.error('Error editing qualifier:', err)
      throw err
    }
  }

  // Regenerate qualifiers
  const regenerateQualifiers = async (raceId = null) => {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch('/api/qualifiers/regenerate', {
        method: 'POST',
        body: { race_id: raceId }
      })

      if (response.error) {
        throw new Error(response.error)
      }

      // Refresh current data
      await fetchCurrentRaceData()

      return response
    } catch (err) {
      console.error('Error regenerating qualifiers:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Start a specific heat
  const startHeat = async (heatNumber) => {
    try {
      const { error } = await supabase
        .rpc('start_heat', { heat_num: heatNumber })

      if (error) throw error

      // Refresh current data
      await fetchCurrentRaceData()
    } catch (err) {
      console.error('Error starting heat:', err)
      throw err
    }
  }

  // Complete current heat
  const completeCurrentHeat = async (track1Time, track2Time) => {
    if (!currentHeat.value) {
      throw new Error('No current heat to complete')
    }

    return updateHeatTimes(currentHeat.value.heat_number, track1Time, track2Time)
  }

  // Setup real-time subscription for qualifiers
  const setupRealtimeSubscription = () => {
    if (!currentRace.value) return

    const channel = supabase
      .channel(`heats-${currentRace.value.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'qualifiers',
          filter: `race_id=eq.${currentRace.value.id}`
        },
        async () => {
          // Refresh data when qualifiers change
          await fetchCurrentRaceData()
        }
      )
      .subscribe()

    // Cleanup on component unmount
    if (process.client) {
      onUnmounted(() => {
        channel.unsubscribe()
      })
    }
  }

  // Initialize and setup subscriptions
  const initialize = async () => {
    await fetchCurrentRaceData()
    if (currentRace.value) {
      setupRealtimeSubscription()
    }
  }

  return {
    // State
    currentRace: readonly(currentRace),
    currentHeat: readonly(currentHeat),
    upcomingHeats: readonly(upcomingHeats),
    loading: readonly(loading),
    error: readonly(error),

    // Methods
    initialize,
    fetchCurrentRaceData,
    updateHeatTimes,
    editQualifier,
    regenerateQualifiers,
    startHeat,
    completeCurrentHeat
  }
}