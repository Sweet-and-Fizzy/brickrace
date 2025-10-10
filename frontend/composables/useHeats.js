export const useHeats = () => {
  console.log('🚨 useHeats() called - new instance created')
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

  // Debounce timer for data fetching to prevent excessive API calls
  const debounceTimer = useState('heats-debounce-timer', () => null)

  // Configuration for how long to show completed results (in milliseconds)
  const COMPLETED_HEAT_DISPLAY_DURATION = 15000 // 15 seconds

  // Debounced version of fetchCurrentRaceData to prevent API call spam
  const debouncedFetchCurrentRaceData = async (delay = 500) => {
    // Clear existing timer
    if (debounceTimer.value) {
      clearTimeout(debounceTimer.value)
    }

    // Set new timer
    debounceTimer.value = setTimeout(async () => {
      await fetchCurrentRaceData()
      debounceTimer.value = null
    }, delay)
  }

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
      return previousHeat
    }

    // If the current heat changed heat_number, the previous one was completed
    if (previousHeat && newHeat && previousHeat.heat_number !== newHeat.heat_number) {
      return previousHeat
    }

    // For brackets, also check if bracket_id changed (more precise than heat_number)
    if (
      previousHeat &&
      newHeat &&
      previousHeat.type === 'bracket' &&
      newHeat.type === 'bracket' &&
      previousHeat.bracket_id !== newHeat.bracket_id
    ) {
      return previousHeat
    }

    return null
  }

  // Fetch completed heat results with times (handles both qualifiers and brackets)
  const fetchCompletedHeatResults = async (
    heatNumber,
    heatType = 'qualifier',
    bracketId = null
  ) => {
    if (!currentRace.value) return null

    try {
      if (heatType === 'bracket') {
        // Get the completed bracket data with racer information
        let query = supabase
          .from('brackets')
          .select(
            `
            *,
            track1_racer:racers!track1_racer_id(
              id,
              name,
              racer_number,
              image_url
            ),
            track2_racer:racers!track2_racer_id(
              id,
              name,
              racer_number,
              image_url
            )
          `
          )
          .eq('race_id', currentRace.value.id)
          .not('track1_time', 'is', null)
          .not('track2_time', 'is', null)
          .not('winner_racer_id', 'is', null)

        // If we have a specific bracket_id, use it for precise lookup
        if (bracketId) {
          query = query.eq('id', bracketId)
        } else {
          // Fallback to most recent completed bracket
          query = query.order('created_at', { ascending: false }).limit(1)
        }

        const { data: completedBracket, error } = await query.single()

        if (error) throw error

        if (completedBracket) {
          return {
            heat_number: heatNumber,
            type: 'bracket',
            status: 'completed',
            completed_at: completedBracket.updated_at || new Date().toISOString(),
            bracket_group: completedBracket.bracket_group,
            round_number: completedBracket.round_number,
            match_number: completedBracket.match_number,
            // Multi-round metadata for best-of-3 display
            match_format: completedBracket.match_format,
            total_rounds: completedBracket.total_rounds,
            current_round: completedBracket.current_round,
            rounds_won_track1: completedBracket.rounds_won_track1,
            rounds_won_track2: completedBracket.rounds_won_track2,
            is_completed: completedBracket.is_completed,
            winner_racer_id: completedBracket.winner_racer_id,
            racers: [
              {
                track_number: 1,
                racer_id: completedBracket.track1_racer_id,
                racer_name: completedBracket.track1_racer?.name,
                racer_number: completedBracket.track1_racer?.racer_number,
                racer_image_url: completedBracket.track1_racer?.image_url,
                time: completedBracket.track1_time,
                is_winner: completedBracket.winner_track === 1
              },
              {
                track_number: 2,
                racer_id: completedBracket.track2_racer_id,
                racer_name: completedBracket.track2_racer?.name,
                racer_number: completedBracket.track2_racer?.racer_number,
                racer_image_url: completedBracket.track2_racer?.image_url,
                time: completedBracket.track2_time,
                is_winner: completedBracket.winner_track === 2
              }
            ].filter((r) => r.racer_id) // Filter out null racers
          }
        }

        return null
      } else {
        // Original qualifier logic
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
            type: 'qualifier',
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
      }

      return null
    } catch (err) {
      console.error('Error fetching completed heat results:', err)
      return null
    }
  }

  // Fetch current race and heat data
  const fetchCurrentRaceData = async () => {
    console.log('📡 fetchCurrentRaceData() called')
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
          console.log('useHeats: justCompletedHeat data:', justCompletedHeat)
          const completedHeatWithResults = await fetchCompletedHeatResults(
            justCompletedHeat.heat_number,
            justCompletedHeat.type || 'qualifier',
            justCompletedHeat.bracket_id // Pass bracket_id for precise lookup
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

      // Logging disabled to reduce noise

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

  // Add additional heats (continues from existing)
  const addAdditionalHeats = async (raceId = null) => {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch('/api/qualifiers/add-heats', {
        method: 'POST',
        body: { race_id: raceId }
      })

      if (response.error) {
        throw new Error(response.error)
      }

      // Refresh current data
      await fetchCurrentRaceData()

      return response.data
    } catch (err) {
      console.error('Error adding additional heats:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
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

  // Setup real-time subscriptions for qualifiers and brackets
  const setupRealtimeSubscription = () => {
    if (!currentRace.value) return

    // Channel for qualifiers
    const qualifiersChannel = supabase
      .channel(`qualifiers-${currentRace.value.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'qualifiers',
          filter: `race_id=eq.${currentRace.value.id}`
        },
        async (payload) => {
          // Only refresh if this affects the current heat or upcoming heats
          if (payload.eventType === 'UPDATE' && payload.new?.status === 'completed') {
            // A qualifier was completed - this might change current/upcoming heats
            await debouncedFetchCurrentRaceData()
          }
          // Skip refreshing for other qualifier changes (like status changes during heat)
        }
      )
      .subscribe()

    // Channel for brackets
    const bracketsChannel = supabase
      .channel(`brackets-${currentRace.value.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'brackets',
          filter: `race_id=eq.${currentRace.value.id}`
        },
        async (payload) => {
          // Only refresh for meaningful bracket changes
          if (payload.eventType === 'INSERT') {
            // New brackets generated - current heat might have changed
            console.log('🔄 New brackets generated, refreshing current heat')
            await debouncedFetchCurrentRaceData()
          } else if (payload.eventType === 'UPDATE') {
            const oldRow = payload.old || {}
            const newRow = payload.new || {}

            // Case 1: Bracket completed (winner determined) - existing behavior
            if (newRow?.winner_racer_id && !oldRow?.winner_racer_id) {
              console.log('🏁 Bracket completed, capturing results before next heat loads')
              try {
                const completedBracketWithResults = await fetchCompletedHeatResults(
                  null,
                  'bracket',
                  newRow.id
                )
                if (completedBracketWithResults) {
                  console.log(
                    'Successfully captured completed bracket results:',
                    completedBracketWithResults
                  )
                  startCompletedHeatDisplay(completedBracketWithResults)
                }
              } catch (err) {
                console.error('Error capturing completed bracket results:', err)
              }
              // Allow bracket regeneration to happen then refresh
              await debouncedFetchCurrentRaceData(2000)
              return
            }

            // Case 2: Live update when best-of-3 round or score changes on current bracket
            const fieldsThatAffectDisplay = [
              'current_round',
              'rounds_won_track1',
              'rounds_won_track2',
              'is_completed'
            ]
            const changed = fieldsThatAffectDisplay.some((f) => oldRow?.[f] !== newRow?.[f])
            const affectsCurrent =
              currentHeat.value?.type === 'bracket' && currentHeat.value?.bracket_id === newRow.id

            if (changed && affectsCurrent) {
              console.log('🎯 Bracket round/score changed for current match — refreshing heat')
              await debouncedFetchCurrentRaceData(250)
            }
          }
          // Skip refreshing for time updates without winner determination
        }
      )
      .subscribe()

    // Channel for per-round updates (ensures UI refresh even if bracket updates are delayed)
    const bracketRoundsChannel = supabase
      .channel(`bracket_rounds-${currentRace.value.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bracket_rounds'
        },
        async (payload) => {
          // Only refresh if this round belongs to the current bracket heat
          const brId = payload.new?.bracket_id
          if (
            brId &&
            currentHeat.value?.type === 'bracket' &&
            currentHeat.value?.bracket_id === brId
          ) {
            console.log('🟡 Bracket round updated — refreshing current heat display')
            await debouncedFetchCurrentRaceData(300)
          }
        }
      )
      .subscribe()

    // Cleanup on component unmount
    if (import.meta.client) {
      onUnmounted(() => {
        qualifiersChannel.unsubscribe()
        bracketsChannel.unsubscribe()
        bracketRoundsChannel.unsubscribe()
      })
    }
  }

  // Initialize and setup subscriptions
  const initialize = async () => {
    console.log('🎯 useHeats initialize() called')
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
    addAdditionalHeats,
    regenerateQualifiers,
    startHeat,
    completeCurrentHeat,

    // New methods for delayed display
    clearCompletedHeatTimer,
    fetchCompletedHeatResults
  }
}
