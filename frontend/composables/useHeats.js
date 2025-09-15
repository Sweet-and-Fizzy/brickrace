export const useHeats = () => {
  const supabase = useSupabaseClient()

  // State management
  const currentRace = useState('heats-current-race', () => null)
  const currentHeat = useState('heats-current-heat', () => null)
  const upcomingHeats = useState('heats-upcoming', () => [])
  const loading = useState('heats-loading', () => false)
  const error = useState('heats-error', () => null)

  // New state for delayed heat display
  const recentlyCompletedHeat = useState('heats-recently-completed', () => null)
  const displayDelayTimer = useState('heats-display-timer', () => null)
  const showCompletedHeatResults = useState('heats-show-completed', () => false)

  // Configuration for how long to show completed results (in milliseconds)
  const COMPLETED_HEAT_DISPLAY_DURATION = 15000 // 15 seconds

  // Helper function to clear the completed heat display timer
  const clearCompletedHeatTimer = () => {
    if (displayDelayTimer.value) {
      clearTimeout(displayDelayTimer.value)
      displayDelayTimer.value = null
    }
  }

  // Helper function to start showing completed heat results for a delayed period
  const startCompletedHeatDisplay = (completedHeatData) => {
    // Clear any existing timer
    clearCompletedHeatTimer()

    // Set the completed heat data and show flag
    recentlyCompletedHeat.value = completedHeatData
    showCompletedHeatResults.value = true

    // Set timer to hide completed results after the configured duration
    displayDelayTimer.value = setTimeout(() => {
      showCompletedHeatResults.value = false
      recentlyCompletedHeat.value = null
      displayDelayTimer.value = null
    }, COMPLETED_HEAT_DISPLAY_DURATION)
  }

  // Helper function to detect if a heat was just completed
  const detectHeatCompletion = (previousHeat, newHeat, newUpcomingHeats) => {
    // If we had a current heat before, but now we don't, and there are upcoming heats
    // This indicates a heat was just completed
    if (previousHeat && !newHeat && newUpcomingHeats.length > 0) {
      // Check if the previous heat now has results by querying completed qualifiers
      return previousHeat
    }

    // If the current heat changed heat_number, the previous one was completed
    if (previousHeat && newHeat && previousHeat.heat_number !== newHeat.heat_number) {
      return previousHeat
    }

    return null
  }

  // Fetch completed heat results with times
  const fetchCompletedHeatResults = async (heatNumber) => {
    if (!currentRace.value) return null

    try {
      const { data: completedQualifiers, error } = await supabase
        .from('qualifiers')
        .select(
          `
          *,
          racer:racers(
            id,
            name,
            racer_number,
            image_url
          )
        `
        )
        .eq('race_id', currentRace.value.id)
        .eq('heat_number', heatNumber)
        .eq('status', 'completed')
        .not('time', 'is', null)
        .order('track_number')

      if (error) throw error

      if (completedQualifiers && completedQualifiers.length > 0) {
        return {
          heat_number: heatNumber,
          status: 'completed',
          completed_at: new Date().toISOString(),
          racers: completedQualifiers.map((q) => ({
            track_number: q.track_number,
            racer_id: q.racer_id,
            racer_name: q.racer?.name,
            racer_number: q.racer?.racer_number,
            racer_image_url: q.racer?.image_url,
            time: q.time
          }))
        }
      }

      return null
    } catch (err) {
      console.error('Error fetching completed heat results:', err)
      return null
    }
  }

  // Fetch current race and heat data
  const fetchCurrentRaceData = async () => {
    loading.value = true
    error.value = null

    try {
      // Store previous heat data for comparison
      const previousHeat = currentHeat.value

      const response = await $fetch('/api/races/current')

      if (response.error) {
        throw new Error(response.error)
      }

      const newHeat = response.data.currentHeat
      const newUpcomingHeats = response.data.upcomingHeats

      // Detect if a heat was just completed
      const justCompletedHeat = detectHeatCompletion(previousHeat, newHeat, newUpcomingHeats)

      if (justCompletedHeat) {
        // Fetch the completed heat results before starting the display
        try {
          const completedHeatWithResults = await fetchCompletedHeatResults(
            justCompletedHeat.heat_number
          )
          if (completedHeatWithResults) {
            startCompletedHeatDisplay(completedHeatWithResults)
          }
        } catch (err) {
          console.error('Error fetching completed heat results:', err)
          // Continue with normal operation even if we can't fetch completed results
        }
      }

      currentRace.value = response.data.race
      currentHeat.value = newHeat
      upcomingHeats.value = newUpcomingHeats

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
      const { error } = await supabase.rpc('start_heat', { heat_num: heatNumber })

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
    if (import.meta.client) {
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

  // Cleanup function for component unmount
  const cleanup = () => {
    clearCompletedHeatTimer()
  }

  // Auto-cleanup on unmount
  if (import.meta.client) {
    onUnmounted(() => {
      cleanup()
    })
  }

  return {
    // State
    currentRace: readonly(currentRace),
    currentHeat: readonly(currentHeat),
    upcomingHeats: readonly(upcomingHeats),
    loading: readonly(loading),
    error: readonly(error),

    // New delayed display state
    recentlyCompletedHeat: readonly(recentlyCompletedHeat),
    showCompletedHeatResults: readonly(showCompletedHeatResults),

    // Methods
    initialize,
    fetchCurrentRaceData,
    updateHeatTimes,
    editQualifier,
    regenerateQualifiers,
    startHeat,
    completeCurrentHeat,

    // New methods for delayed display
    clearCompletedHeatTimer,
    fetchCompletedHeatResults
  }
}
