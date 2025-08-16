// Create a useState-based state management function
const useCheckinsState = () => {
  const checkins = useState('checkins-data', () => [])
  const racers = useState('checkins-racers', () => [])
  const loading = useState('checkins-loading', () => false)
  const error = useState('checkins-error', () => null)
  const processing = useState('checkins-processing', () => null)
  const channels = useState('checkins-channels', () => ({
    checkinsChannel: null,
    racersChannel: null
  }))
  const initialized = useState('checkins-initialized', () => false)

  return {
    checkins,
    racers,
    loading,
    error,
    processing,
    channels,
    initialized
  }
}

export const useCheckins = () => {
  const supabase = useSupabaseClient()
  // Get useState-based state
  const state = useCheckinsState()

  // Increment reference count

  // Use useState-based state
  const checkins = state.checkins
  const racers = state.racers
  const loading = state.loading
  const error = state.error
  const processing = state.processing

  // Get checkins for a specific race
  const getCheckinsForRace = (raceId) => {
    return checkins.value.filter((checkin) => checkin.race_id === raceId)
  }

  // Check if a racer is checked in for a specific race
  const isCheckedIn = (racerId, raceId) => {
    return checkins.value.some(
      (checkin) => checkin.racer_id === racerId && checkin.race_id === raceId
    )
  }

  // Get checkin time for a racer in a specific race
  const getCheckinTime = (racerId, raceId) => {
    const checkin = checkins.value.find((c) => c.racer_id === racerId && c.race_id === raceId)
    return checkin ? new Date(checkin.time).toLocaleTimeString() : ''
  }

  // Get count of checked in racers for a race
  const getCheckedInCount = (raceId) => {
    return getCheckinsForRace(raceId).length
  }

  // Fetch checkins for a specific race (or all if no raceId)
  const fetchCheckins = async (raceId) => {
    loading.value = true
    error.value = null

    try {
      let query = supabase.from('checkins').select(`
          *,
          race:races(
            id,
            name
          ),
          racer:racers(
            id,
            name,
            racer_number,
            image_url
          )
        `)

      // Only filter by race if raceId is provided
      if (raceId) {
        query = query.eq('race_id', raceId)
      }

      const { data: checkinsData, error: checkinsError } = await query.order('time', {
        ascending: false
      })

      if (checkinsError) throw checkinsError

      // Update or merge with existing checkins
      if (raceId) {
        // For specific race, replace checkins for that race only
        const existingCheckins = checkins.value.filter((c) => c.race_id !== raceId)
        checkins.value = [...existingCheckins, ...(checkinsData || [])]
      } else {
        // For all checkins, replace the entire array
        checkins.value = checkinsData || []
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(
          'useCheckins: Fetched checkins data:',
          checkinsData?.length || 0,
          'records for race:',
          raceId || 'all'
        )
      }
    } catch (err) {
      // Keep essential error logging for production debugging
      console.error('Error fetching checkins:', err)
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  // Fetch all racers (needed for checkin interface)
  const fetchRacers = async () => {
    loading.value = true
    error.value = null

    try {
      const { data: racersData, error: racersError } = await supabase
        .from('racers')
        .select('*')
        .order('racer_number', { ascending: true })

      if (racersError) throw racersError
      racers.value = racersData || []
    } catch (err) {
      // Keep essential error logging for production debugging
      console.error('Error fetching racers:', err)
      error.value = err.message
      racers.value = []
    } finally {
      loading.value = false
    }
  }

  // Check in a racer for a race
  const checkInRacer = async (racerId, raceId) => {
    if (processing.value) return { success: false, error: 'Operation in progress' }

    processing.value = racerId

    try {
      // Check if already checked in
      if (isCheckedIn(racerId, raceId)) {
        return { success: false, error: 'Racer is already checked in' }
      }

      const { data: newCheckin, error: insertError } = await supabase
        .from('checkins')
        .insert({
          racer_id: racerId,
          race_id: raceId,
          time: new Date().toISOString()
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Update local state
      checkins.value = [newCheckin, ...checkins.value]

      return { success: true, data: newCheckin }
    } catch (err) {
      // Keep essential error logging for production debugging
      console.error('Error checking in racer:', err)
      return { success: false, error: err.message }
    } finally {
      processing.value = null
    }
  }

  // Check out a racer from a race
  const checkOutRacer = async (racerId, raceId) => {
    if (processing.value) return { success: false, error: 'Operation in progress' }

    processing.value = racerId

    try {
      // Check if not checked in
      if (!isCheckedIn(racerId, raceId)) {
        return { success: false, error: 'Racer is not checked in' }
      }

      const { error: deleteError } = await supabase
        .from('checkins')
        .delete()
        .eq('racer_id', racerId)
        .eq('race_id', raceId)

      if (deleteError) throw deleteError

      // Update local state
      checkins.value = checkins.value.filter(
        (c) => !(c.racer_id === racerId && c.race_id === raceId)
      )

      return { success: true }
    } catch (err) {
      // Keep essential error logging for production debugging
      console.error('Error checking out racer:', err)
      return { success: false, error: err.message }
    } finally {
      processing.value = null
    }
  }

  // Toggle checkin status for a racer
  const toggleCheckin = async (racerId, raceId) => {
    const isCurrentlyCheckedIn = isCheckedIn(racerId, raceId)

    if (isCurrentlyCheckedIn) {
      return await checkOutRacer(racerId, raceId)
    } else {
      return await checkInRacer(racerId, raceId)
    }
  }

  // Handle real-time checkin updates
  const handleCheckinUpdate = (payload) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('useCheckins: Real-time checkin update received:', payload)
    }
    const { eventType, new: newRecord, old: oldRecord } = payload

    switch (eventType) {
      case 'INSERT':
        if (process.env.NODE_ENV === 'development') {
          console.log('useCheckins: Adding new checkin:', newRecord)
        }
        // Add new checkin to the list
        checkins.value.unshift(newRecord)
        if (process.env.NODE_ENV === 'development') {
          console.log('useCheckins: Checkins count after insert:', checkins.value.length)
        }
        break

      case 'UPDATE': {
        if (process.env.NODE_ENV === 'development') {
          console.log('useCheckins: Updating checkin:', newRecord)
        }
        // Update existing checkin
        const updateIndex = checkins.value.findIndex((c) => c.id === newRecord.id)
        if (updateIndex !== -1) {
          checkins.value[updateIndex] = newRecord
        }
        break
      }

      case 'DELETE': {
        if (process.env.NODE_ENV === 'development') {
          console.log('useCheckins: Deleting checkin:', oldRecord)
        }
        // Remove checkin from list
        const beforeCount = checkins.value.length
        checkins.value = checkins.value.filter((c) => c.id !== oldRecord.id)
        if (process.env.NODE_ENV === 'development') {
          console.log(
            'useCheckins: Checkins count after delete:',
            checkins.value.length,
            '(was',
            beforeCount + ')'
          )
        }
        break
      }
    }
  }

  // Handle real-time racer updates
  const handleRacerUpdate = (payload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload

    switch (eventType) {
      case 'INSERT':
        // Add new racer to the list
        racers.value.push(newRecord)
        // Sort by racer number
        racers.value.sort((a, b) => (a.racer_number || 0) - (b.racer_number || 0))
        break

      case 'UPDATE': {
        // Update existing racer
        const updateIndex = racers.value.findIndex((r) => r.id === newRecord.id)
        if (updateIndex !== -1) {
          racers.value[updateIndex] = newRecord
        }
        break
      }

      case 'DELETE':
        // Remove racer from list
        racers.value = racers.value.filter((r) => r.id !== oldRecord.id)
        break
    }
  }

  // Setup real-time subscriptions
  const setupSubscriptions = () => {
    // Only set up subscriptions once globally
    if (state.channels.value.checkinsChannel) {
      if (process.env.NODE_ENV === 'development') {
        console.log('useCheckins: Subscriptions already active')
      }
      return
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('useCheckins: Setting up global subscriptions')
    }

    // Subscribe to checkins table changes
    state.channels.value.checkinsChannel = supabase
      .channel('global-checkins-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'checkins'
        },
        handleCheckinUpdate
      )
      .subscribe((status) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('useCheckins: Checkins subscription status:', status)
        }
      })

    // Subscribe to racers table changes
    state.channels.value.racersChannel = supabase
      .channel('global-racers-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'racers'
        },
        handleRacerUpdate
      )
      .subscribe((status) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('useCheckins: Racers subscription status:', status)
        }
      })
  }

  // Initialize for a specific race
  const initialize = async (raceId) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('useCheckins: Initializing for race:', raceId || 'all')
    }
    await fetchRacers()
    await fetchCheckins(raceId) // Will fetch all if raceId is null
    setupSubscriptions()
    if (process.env.NODE_ENV === 'development') {
      console.log('useCheckins: Initialization complete, checkins count:', checkins.value.length)
    }
  }

  // Computed properties
  const checkedInRacers = computed(() => {
    return checkins.value || []
  })

  // Filter racers by search query
  const filterRacers = (searchQuery) => {
    if (!searchQuery) return racers.value

    const query = searchQuery.toLowerCase()
    return racers.value.filter(
      (racer) =>
        racer.name.toLowerCase().includes(query) ||
        racer.racer_number?.toString().includes(query) ||
        (racer.team_members && racer.team_members.toLowerCase().includes(query))
    )
  }

  return {
    // Data
    checkins,
    racers,
    checkedInRacers,
    loading,
    error,
    processing,

    // Methods
    initialize,
    fetchCheckins,
    fetchRacers,
    checkInRacer,
    checkOutRacer,
    toggleCheckin,

    // Helpers
    isCheckedIn,
    getCheckinTime,
    getCheckinsForRace,
    getCheckedInCount,
    filterRacers
  }
}
