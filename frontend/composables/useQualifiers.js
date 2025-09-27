// Note: qualifiersChannel removed - no longer needed without cleanup function

// Global shared state for qualifiers (race-specific singleton pattern)
const qualifierInstances = new Map()

/**
 * @param {string | null} [raceId=null] - The race ID
 */
export const useQualifiers = (raceId = null) => {
  // If no raceId provided, create instance without singleton
  if (!raceId) {
    return createQualifiersInstance(null)
  }

  // Use race-specific singleton
  if (!qualifierInstances.has(raceId)) {
    if (process.env.NODE_ENV === 'development') {
      console.log('useQualifiers: Creating new instance for race:', raceId)
    }
    qualifierInstances.set(raceId, createQualifiersInstance(raceId))
  }

  return qualifierInstances.get(raceId)
}

// Create state management functions using useState
const useQualifiersState = (raceId) => {
  const keyPrefix = raceId ? `qualifiers-${raceId}` : 'qualifiers-global'

  const qualifiers = useState(`${keyPrefix}-data`, () => [])
  const loading = useState(`${keyPrefix}-loading`, () => false)
  const error = useState(`${keyPrefix}-error`, () => null)

  return {
    qualifiers,
    loading,
    error
  }
}

const createQualifiersInstance = (raceId) => {
  const supabase = useSupabaseClient()

  // Reactive state using useState
  const state = useQualifiersState(raceId)
  const { qualifiers, loading, error } = state

  // Format time for display
  const formatTime = (seconds) => {
    if (!seconds || Number.isNaN(Number(seconds))) return 'N/A'
    return `${Number(seconds).toFixed(2)}s`
  }

  // Initial data fetch
  const fetchQualifiers = async (targetRaceId = raceId) => {
    loading.value = true
    error.value = null

    try {
      let query = supabase.from('qualifiers').select(`
          *,
          racer:racers(
            id,
            name,
            racer_number,
            image_url,
            user_id
          ),
          race:races(
            id,
            name
          )
        `)

      // Only filter by race if raceId is provided
      if (targetRaceId) {
        query = query.eq('race_id', targetRaceId)
      }

      const { data: qualifiersData, error: qualifiersError } = await query.order('time', {
        ascending: true
      })

      if (qualifiersError) throw qualifiersError

      if (process.env.NODE_ENV === 'development') {
        console.log(
          'useQualifiers: Fetched qualifiers data:',
          qualifiersData?.length || 0,
          'records for race:',
          targetRaceId || 'all'
        )
      }

      // Flatten racer data to match expected format
      qualifiers.value = (qualifiersData || []).map((q) => ({
        ...q,
        racer_name: q.racer?.name || `Racer #${q.racer?.racer_number || 'Unknown'}`,
        racer_number: q.racer?.racer_number,
        racer_image_url: q.racer?.image_url,
        racer_user_id: q.racer?.user_id
      }))
    } catch (err) {
      // Keep essential error logging for production debugging
      console.error('Error fetching qualifiers:', err)
      error.value = err.message
      qualifiers.value = []
    } finally {
      loading.value = false
    }
  }

  // Add new qualifier time
  const addQualifier = async (racerId, targetRaceId, time, notes = null) => {
    try {
      const { data, error: insertError } = await supabase
        .from('qualifiers')
        .insert({
          racer_id: racerId,
          race_id: targetRaceId,
          time: Number(time),
          notes
        })
        .select(
          `
          *,
          racer:racers(
            id,
            name,
            racer_number,
            image_url,
            user_id
          )
        `
        )
        .single()

      if (insertError) throw insertError

      // Flatten racer data to match expected format
      return {
        ...data,
        racer_name: data.racer?.name || `Racer #${data.racer?.racer_number || 'Unknown'}`,
        racer_number: data.racer?.racer_number,
        racer_image_url: data.racer?.image_url,
        racer_user_id: data.racer?.user_id
      }
    } catch (err) {
      // Keep essential error logging for production debugging
      console.error('Error adding qualifier:', err)
      throw err
    }
  }

  // Update qualifier time
  const updateQualifier = async (qualifierId, time, notes = null) => {
    try {
      const { data, error: updateError } = await supabase
        .from('qualifiers')
        .update({
          time: Number(time),
          notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', qualifierId)
        .select(
          `
          *,
          racer:racers(
            id,
            name,
            racer_number,
            image_url,
            user_id
          )
        `
        )
        .single()

      if (updateError) throw updateError

      // Flatten racer data to match expected format
      return {
        ...data,
        racer_name: data.racer?.name || `Racer #${data.racer?.racer_number || 'Unknown'}`,
        racer_number: data.racer?.racer_number,
        racer_image_url: data.racer?.image_url,
        racer_user_id: data.racer?.user_id
      }
    } catch (err) {
      // Keep essential error logging for production debugging
      console.error('Error updating qualifier:', err)
      throw err
    }
  }

  // Delete qualifier
  const deleteQualifier = async (qualifierId) => {
    try {
      const { error: deleteError } = await supabase
        .from('qualifiers')
        .delete()
        .eq('id', qualifierId)

      if (deleteError) throw deleteError
    } catch (err) {
      // Keep essential error logging for production debugging
      console.error('Error deleting qualifier:', err)
      throw err
    }
  }

  // Handle real-time updates for qualifiers
  const handleQualifierUpdate = async (payload) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('useQualifiers: Real-time update received:', payload, 'for race:', raceId)
    }
    const { eventType, new: newRecord, old: oldRecord } = payload

    // Only handle updates for the current race
    if (raceId && newRecord?.race_id !== raceId && oldRecord?.race_id !== raceId) {
      if (process.env.NODE_ENV === 'development') {
        console.log(
          'useQualifiers: Ignoring update for different race:',
          newRecord?.race_id || oldRecord?.race_id
        )
      }
      return
    }

    switch (eventType) {
      case 'INSERT':
        // Fetch the full record with racer data
        try {
          const { data: fullRecord, error } = await supabase
            .from('qualifiers')
            .select(
              `
              *,
              racer:racers(
                id,
                name,
                racer_number,
                image_url,
                user_id
              ),
              race:races(
                id,
                name
              )
            `
            )
            .eq('id', newRecord.id)
            .single()

          if (!error && fullRecord) {
            // Flatten racer data
            const flattenedRecord = {
              ...fullRecord,
              racer_name:
                fullRecord.racer?.name || `Racer #${fullRecord.racer?.racer_number || 'Unknown'}`,
              racer_number: fullRecord.racer?.racer_number,
              racer_image_url: fullRecord.racer?.image_url,
              racer_user_id: fullRecord.racer?.user_id
            }

            // Insert in correct position (sorted by time)
            const insertIndex = qualifiers.value.findIndex((q) => q.time > flattenedRecord.time)
            if (insertIndex === -1) {
              qualifiers.value.push(flattenedRecord)
            } else {
              qualifiers.value.splice(insertIndex, 0, flattenedRecord)
            }
          }
        } catch (err) {
          // Keep essential error logging for production debugging
          console.error('Error fetching new qualifier:', err)
        }
        break

      case 'UPDATE': {
        // Update existing qualifier and re-sort
        const updateIndex = qualifiers.value.findIndex((q) => q.id === newRecord.id)
        if (updateIndex !== -1) {
          qualifiers.value[updateIndex] = {
            ...qualifiers.value[updateIndex],
            ...newRecord
          }

          // Re-sort by time
          qualifiers.value.sort((a, b) => a.time - b.time)
        }
        break
      }

      case 'DELETE':
        // Remove qualifier from list
        qualifiers.value = qualifiers.value.filter((q) => q.id !== oldRecord.id)
        break
    }
  }

  // Setup real-time subscriptions
  const setupSubscriptions = () => {
    const channelName = raceId ? `qualifiers-${raceId}` : 'qualifiers-all'
    if (process.env.NODE_ENV === 'development') {
      console.log(
        'useQualifiers: Setting up subscription for channel:',
        channelName,
        'raceId:',
        raceId
      )
    }

    // Create subscription without storing reference (no cleanup needed)
    supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'qualifiers',
          filter: raceId ? `race_id=eq.${raceId}` : undefined
        },
        handleQualifierUpdate
      )
      .subscribe((status) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('useQualifiers: Subscription status:', status, 'for race:', raceId)
        }
      })
  }

  // Initialize on first use
  const initialize = async (targetRaceId = raceId) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('useQualifiers: Initializing for race:', targetRaceId || raceId)
    }
    await fetchQualifiers(targetRaceId)
    setupSubscriptions()
    if (process.env.NODE_ENV === 'development') {
      console.log(
        'useQualifiers: Initialization complete, qualifiers count:',
        qualifiers.value.length
      )
    }
  }

  // Computed properties
  const sortedQualifiers = computed(() => {
    return [...qualifiers.value].sort((a, b) => a.time - b.time)
  })

  const fastestTime = computed(() => {
    if (qualifiers.value.length === 0) return null
    return Math.min(...qualifiers.value.map((q) => q.time))
  })

  const slowestTime = computed(() => {
    if (qualifiers.value.length === 0) return null
    return Math.max(...qualifiers.value.map((q) => q.time))
  })

  const averageTime = computed(() => {
    if (qualifiers.value.length === 0) return null
    const sum = qualifiers.value.reduce((acc, q) => acc + q.time, 0)
    return sum / qualifiers.value.length
  })

  const totalQualifiers = computed(() => {
    return qualifiers.value.length
  })

  // Get qualifiers by racer
  const getQualifiersByRacer = (racerId) => {
    return qualifiers.value.filter((q) => q.racer_id === racerId)
  }

  // Get best time for racer
  const getBestTimeForRacer = (racerId) => {
    const racerQualifiers = getQualifiersByRacer(racerId)
    const validTimes = racerQualifiers.filter((q) => q.time && q.time > 0).map((q) => q.time)
    if (validTimes.length === 0) return null
    return Math.min(...validTimes)
  }

  return {
    // Data
    qualifiers,
    sortedQualifiers,
    loading,
    error,

    // Computed stats
    fastestTime,
    slowestTime,
    averageTime,
    totalQualifiers,

    // Methods
    initialize,
    fetchQualifiers,
    addQualifier,
    updateQualifier,
    deleteQualifier,
    formatTime,
    getQualifiersByRacer,
    getBestTimeForRacer
  }
}
