import { useAuthStore } from '~/stores/auth'

// State factory function
const useBracketsState = () => {
  const brackets = useState('brackets-data', () => [])
  const winners = useState('brackets-winners', () => [])
  const loading = useState('brackets-loading', () => false)
  const error = useState('brackets-error', () => null)
  const generatingBrackets = useState('brackets-generating', () => false)
  const recordingTime = useState('brackets-recording', () => false)
  const clearingBrackets = useState('brackets-clearing', () => false)
  const bracketConfig = useState('brackets-config', () => ({
    type: 'elimination', // 'elimination', 'double_elimination', 'round_robin'
    racerCount: 8,
    allowDuplicateRacers: false,
    autoAdvanceWinners: true,
    tieBreakerMethod: 'fastest_time' // 'fastest_time', 'manual'
  }))
  const channels = useState('brackets-channels', () => ({
    bracketsChannel: null
  }))
  const initialized = useState('brackets-initialized', () => false)

  return {
    brackets,
    winners,
    loading,
    error,
    generatingBrackets,
    recordingTime,
    clearingBrackets,
    bracketConfig,
    channels,
    initialized
  }
}

export const useBrackets = () => {
  const { $supabase } = useNuxtApp()
  const authStore = useAuthStore()
  const notifications = useNotifications()

  // Get state using useState
  const state = useBracketsState()

  // Bracket generation
  const generateBrackets = async (raceId, type = 'elimination', racerCount = 8) => {
    if (!authStore.isRaceAdmin) {
      notifications.permissionError('generate brackets')
      return false
    }

    state.generatingBrackets.value = true
    state.error.value = null

    try {
      // Clear existing brackets first
      await clearBrackets(raceId, false) // Don't show notification

      // Get qualified racers for this race
      const qualifiedRacers = await getQualifiedRacers(raceId, racerCount)

      if (qualifiedRacers.length < 2) {
        throw new Error('At least 2 qualified racers are required to generate brackets')
      }

      // Generate bracket pairs based on type
      let bracketPairs = []

      switch (type) {
        case 'elimination':
          bracketPairs = generateEliminationBrackets(qualifiedRacers, racerCount)
          break
        case 'double_elimination':
          bracketPairs = generateDoubleEliminationBrackets(qualifiedRacers, racerCount)
          break
        case 'round_robin':
          bracketPairs = generateRoundRobinBrackets(qualifiedRacers)
          break
        default:
          throw new Error('Invalid bracket type')
      }

      // Save brackets to database
      const bracketPromises = bracketPairs.map((bracket) =>
        $supabase.from('brackets').insert({
          race_id: raceId,
          round: bracket.round,
          bracket_number: bracket.bracket_number,
          track1_racer_id: bracket.track1_racer_id,
          track2_racer_id: bracket.track2_racer_id,
          bracket_type: type,
          status: 'pending'
        })
      )

      const results = await Promise.all(bracketPromises)

      // Check for errors
      const errors = results.filter((result) => result.error)
      if (errors.length > 0) {
        throw new Error(`Failed to create ${errors.length} brackets`)
      }

      notifications.success(
        'Brackets Generated!',
        `Successfully created ${bracketPairs.length} bracket race${bracketPairs.length !== 1 ? 's' : ''} for ${type} tournament.`
      )

      // Refresh brackets
      await fetchBrackets()

      return true
    } catch (err) {
      // Keep essential error logging for production debugging
      console.error('Error generating brackets:', err)
      state.error.value = err.message
      notifications.error('Bracket Generation Failed', err.message)
      return false
    } finally {
      state.generatingBrackets.value = false
    }
  }

  // Get qualified racers sorted by qualifying time
  const getQualifiedRacers = async (raceId, limit) => {
    try {
      const { data: qualifiers, error: qualifierError } = await $supabase
        .from('qualifiers')
        .select(
          `
          *,
          racers (
            id,
            name,
            racer_number,
            user_id
          )
        `
        )
        .eq('race_id', raceId)
        .order('time', { ascending: true })
        .limit(limit)

      if (qualifierError) throw qualifierError

      return qualifiers.filter((q) => q.racers) // Only include racers with valid racer data
    } catch (err) {
      // Keep essential error logging for production debugging
      console.error('Error fetching qualified racers:', err)
      throw new Error('Failed to get qualified racers')
    }
  }

  // Generate elimination tournament brackets
  const generateEliminationBrackets = (qualifiedRacers, racerCount) => {
    const racers = qualifiedRacers.slice(0, racerCount)
    const brackets = []

    // For elimination, pair fastest with slowest, 2nd fastest with 2nd slowest, etc.
    for (let i = 0; i < Math.floor(racers.length / 2); i++) {
      const fastRacer = racers[i]
      const slowRacer = racers[racers.length - 1 - i]

      brackets.push({
        round: 1,
        bracket_number: i + 1,
        track1_racer_id: fastRacer.racer_id,
        track2_racer_id: slowRacer.racer_id
      })
    }

    // Handle odd number of racers (bye)
    if (racers.length % 2 === 1) {
      const byeRacer = racers[Math.floor(racers.length / 2)]
      brackets.push({
        round: 1,
        bracket_number: Math.floor(racers.length / 2) + 1,
        track1_racer_id: byeRacer.racer_id,
        track2_racer_id: null, // Bye
        winner_track: 1,
        status: 'completed'
      })
    }

    return brackets
  }

  // Generate double elimination brackets
  const generateDoubleEliminationBrackets = (qualifiedRacers, racerCount) => {
    // Double elimination is more complex - implement winner and loser brackets
    const racers = qualifiedRacers.slice(0, racerCount)
    const brackets = []

    // Start with winner bracket (same as elimination)
    const winnerBrackets = generateEliminationBrackets(racers, racerCount)
    winnerBrackets.forEach((bracket) => {
      brackets.push({
        ...bracket,
        bracket_type: 'winner'
      })
    })

    // Loser bracket will be generated as matches are completed
    return brackets
  }

  // Generate round robin brackets
  const generateRoundRobinBrackets = (qualifiedRacers) => {
    const racers = qualifiedRacers
    const brackets = []
    let bracketNumber = 1

    // Every racer races every other racer once
    for (let i = 0; i < racers.length; i++) {
      for (let j = i + 1; j < racers.length; j++) {
        brackets.push({
          round: 1,
          bracket_number: bracketNumber++,
          track1_racer_id: racers[i].racer_id,
          track2_racer_id: racers[j].racer_id
        })
      }
    }

    return brackets
  }

  // Record race time
  const recordTime = async (bracketId, track, time) => {
    if (!authStore.isRaceAdmin) {
      notifications.permissionError('record race times')
      return false
    }

    state.recordingTime.value = true

    try {
      const timeField = track === 1 ? 'track1_time' : 'track2_time'

      const { error } = await $supabase
        .from('brackets')
        .update({ [timeField]: time })
        .eq('id', bracketId)

      if (error) throw error

      // Check if both times are recorded and determine winner
      const bracket = state.brackets.value.find((b) => b.id === bracketId)
      if (bracket) {
        const updatedBracket = { ...bracket, [timeField]: time }

        if (updatedBracket.track1_time && updatedBracket.track2_time) {
          await determineWinner(updatedBracket)
        }

        // Update local state
        const index = state.brackets.value.findIndex((b) => b.id === bracketId)
        if (index !== -1) {
          state.brackets.value[index] = updatedBracket
        }
      }

      notifications.success('Time Recorded', `Track ${track} time: ${formatTime(time)}`)

      return true
    } catch (err) {
      // Keep essential error logging for production debugging
      console.error('Error recording time:', err)
      notifications.error('Failed to Record Time', err.message)
      return false
    } finally {
      state.recordingTime.value = false
    }
  }

  // Determine winner of a bracket
  const determineWinner = async (bracket) => {
    try {
      let winnerTrack = null
      let winnerRacerId = null

      // Handle bye (one racer is null)
      if (!bracket.track1_racer_id) {
        winnerTrack = 2
        winnerRacerId = bracket.track2_racer_id
      } else if (!bracket.track2_racer_id) {
        winnerTrack = 1
        winnerRacerId = bracket.track1_racer_id
      } else {
        // Both racers present, compare times
        const time1 = Number.parseFloat(bracket.track1_time)
        const time2 = Number.parseFloat(bracket.track2_time)

        if (time1 < time2) {
          winnerTrack = 1
          winnerRacerId = bracket.track1_racer_id
        } else if (time2 < time1) {
          winnerTrack = 2
          winnerRacerId = bracket.track2_racer_id
        } else {
          // Tie - handle based on configuration
          if (state.bracketConfig.value.tieBreakerMethod === 'fastest_time') {
            // Could implement tie-breaker logic here
            winnerTrack = 1 // Default to track 1
            winnerRacerId = bracket.track1_racer_id
          }
        }
      }

      // Update bracket with winner
      const { error } = await $supabase
        .from('brackets')
        .update({
          winner_track: winnerTrack,
          winner_racer_id: winnerRacerId,
          status: 'completed'
        })
        .eq('id', bracket.id)

      if (error) throw error

      // Create winner record
      await $supabase.from('winners').insert({
        race_id: bracket.race_id,
        bracket_id: bracket.id,
        racer_id: winnerRacerId,
        winner_time: winnerTrack === 1 ? bracket.track1_time : bracket.track2_time,
        round: bracket.round
      })

      // Generate next round if elimination tournament
      if (state.bracketConfig.value.autoAdvanceWinners && bracket.bracket_type !== 'round_robin') {
        await generateNextRound(bracket.race_id)
      }

      return winnerRacerId
    } catch (err) {
      // Keep essential error logging for production debugging
      console.error('Error determining winner:', err)
      throw err
    }
  }

  // Generate next round brackets
  const generateNextRound = async (raceId) => {
    try {
      // Get current round winners for this race
      const raceBrackets = state.brackets.value.filter((b) => b.race_id === raceId)
      const currentRound = Math.max(...raceBrackets.map((b) => b.round))
      const roundWinners = await getCurrentRoundWinners(raceId, currentRound)

      if (roundWinners.length < 2) {
        // Tournament complete
        return
      }

      // Generate next round brackets
      const nextRound = currentRound + 1
      const nextBrackets = []

      for (let i = 0; i < Math.floor(roundWinners.length / 2); i++) {
        nextBrackets.push({
          race_id: raceId,
          round: nextRound,
          bracket_number: i + 1,
          track1_racer_id: roundWinners[i * 2].racer_id,
          track2_racer_id: roundWinners[i * 2 + 1].racer_id,
          bracket_type: 'elimination',
          status: 'pending'
        })
      }

      // Handle odd number of winners (bye)
      if (roundWinners.length % 2 === 1) {
        const byeWinner = roundWinners[roundWinners.length - 1]
        nextBrackets.push({
          race_id: raceId,
          round: nextRound,
          bracket_number: Math.floor(roundWinners.length / 2) + 1,
          track1_racer_id: byeWinner.racer_id,
          track2_racer_id: null,
          bracket_type: 'elimination',
          winner_track: 1,
          winner_racer_id: byeWinner.racer_id,
          status: 'completed'
        })
      }

      // Insert next round brackets
      if (nextBrackets.length > 0) {
        const { error } = await $supabase.from('brackets').insert(nextBrackets)

        if (error) throw error

        notifications.info('Next Round Generated', `Round ${nextRound} brackets have been created.`)
      }
    } catch (err) {
      // Keep essential error logging for production debugging
      console.error('Error generating next round:', err)
      notifications.error('Failed to Generate Next Round', err.message)
    }
  }

  // Get winners from current round
  const getCurrentRoundWinners = async (raceId, round) => {
    try {
      const { data, error } = await $supabase
        .from('winners')
        .select(
          `
          *,
          racers (
            id,
            name,
            racer_number
          )
        `
        )
        .eq('race_id', raceId)
        .eq('round', round)
        .order('winner_time', { ascending: true })

      if (error) throw error

      return data || []
    } catch (err) {
      // Keep essential error logging for production debugging
      console.error('Error getting round winners:', err)
      return []
    }
  }

  // Fetch all brackets for all races
  const fetchBrackets = async () => {
    state.loading.value = true

    try {
      const { data, error } = await $supabase
        .from('brackets')
        .select(
          `
          *,
          track1_racer:racers!track1_racer_id (
            id,
            name,
            racer_number
          ),
          track2_racer:racers!track2_racer_id (
            id,
            name,
            racer_number
          )
        `
        )
        .order('created_at', { ascending: true })

      if (error) throw error

      state.brackets.value = data || []
    } catch (err) {
      // Keep essential error logging for production debugging
      console.error('Error fetching brackets:', err)
      state.error.value = err.message
    } finally {
      state.loading.value = false
    }
  }

  // Compute winners from brackets data
  const computeWinners = () => {
    // Winners are determined from completed brackets
    const computedWinners = []

    state.brackets.value.forEach((bracket) => {
      if (bracket.track1_time && bracket.track2_time) {
        // Determine winner based on fastest time (lower is better)
        const isTrack1Winner = bracket.track1_time < bracket.track2_time

        const winner = isTrack1Winner ? bracket.track1_racer : bracket.track2_racer
        const winningTime = isTrack1Winner ? bracket.track1_time : bracket.track2_time

        if (winner) {
          computedWinners.push({
            id: `${bracket.id}-winner`,
            race_id: bracket.race_id,
            bracket_id: bracket.id,
            racer_id: winner.id,
            racer: winner,
            winner_time: winningTime,
            round: bracket.round,
            bracket_type: bracket.bracket_type,
            created_at: bracket.created_at
          })
        }
      }
    })

    state.winners.value = computedWinners
  }

  // Clear all brackets for a specific race
  const clearBrackets = async (raceId, showNotification = true) => {
    if (!authStore.isRaceAdmin) {
      notifications.permissionError('clear brackets')
      return false
    }

    state.clearingBrackets.value = true

    try {
      // Delete winners first (foreign key constraint)
      await $supabase.from('winners').delete().eq('race_id', raceId)

      // Delete brackets
      const { error } = await $supabase.from('brackets').delete().eq('race_id', raceId)

      if (error) throw error

      // Update local state - remove only brackets for this race
      state.brackets.value = state.brackets.value.filter((b) => b.race_id !== raceId)
      state.winners.value = state.winners.value.filter((w) => w.race_id !== raceId)

      if (showNotification) {
        notifications.success('Brackets Cleared', 'All brackets have been removed.')
      }

      return true
    } catch (err) {
      // Keep essential error logging for production debugging
      console.error('Error clearing brackets:', err)
      if (showNotification) {
        notifications.error('Failed to Clear Brackets', err.message)
      }
      return false
    } finally {
      state.clearingBrackets.value = false
    }
  }

  // Real-time subscriptions
  const setupSubscriptions = () => {
    // Only set up subscriptions once globally
    if (state.channels.value.bracketsChannel) {
      if (process.env.NODE_ENV === 'development') {
        console.log('useBrackets: Subscriptions already active')
      }
      return
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('useBrackets: Setting up global subscriptions')
    }

    // Subscribe to bracket changes for all races
    state.channels.value.bracketsChannel = $supabase
      .channel('global-brackets-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'brackets'
        },
        (payload) => {
          handleBracketUpdate(payload)
        }
      )
      .subscribe((status) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('useBrackets: Brackets subscription status:', status)
        }
      })
  }

  // Handle bracket updates
  const handleBracketUpdate = (payload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload

    switch (eventType) {
      case 'INSERT':
        // Add new bracket (need to fetch full data with relations)
        fetchBrackets().then(() => computeWinners())
        break
      case 'UPDATE': {
        // Update existing bracket
        const index = state.brackets.value.findIndex((b) => b.id === newRecord.id)
        if (index !== -1) {
          state.brackets.value[index] = { ...state.brackets.value[index], ...newRecord }
          computeWinners() // Recompute winners when bracket times change
        }
        break
      }
      case 'DELETE':
        // Remove bracket
        state.brackets.value = state.brackets.value.filter((b) => b.id !== oldRecord.id)
        computeWinners() // Recompute winners after deletion
        break
    }
  }

  // Winners are now computed from brackets, no separate handling needed

  // Initialize
  const initialize = async () => {
    if (state.initialized.value) {
      if (process.env.NODE_ENV === 'development') {
        console.log('useBrackets: Already initialized, skipping')
      }
      return
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('useBrackets: Starting initialization')
    }
    state.initialized.value = true

    state.loading.value = true
    try {
      await fetchBrackets()
      computeWinners() // Compute winners from brackets data
      setupSubscriptions()
      if (process.env.NODE_ENV === 'development') {
        console.log('useBrackets: Initialization complete')
      }
    } finally {
      state.loading.value = false
    }
  }

  // Computed properties - these now need to be parameterized by raceId
  const getBracketsByRound = (raceId) => {
    const rounds = {}
    state.brackets.value
      .filter((bracket) => bracket.race_id === raceId)
      .forEach((bracket) => {
        if (!rounds[bracket.round]) {
          rounds[bracket.round] = []
        }
        rounds[bracket.round].push(bracket)
      })
    return rounds
  }

  const getTotalRounds = (raceId) => {
    const raceBrackets = state.brackets.value.filter((b) => b.race_id === raceId)
    return raceBrackets.length > 0 ? Math.max(...raceBrackets.map((b) => b.round), 0) : 0
  }

  const getIsComplete = (raceId) => {
    const raceBrackets = state.brackets.value.filter((b) => b.race_id === raceId)
    return raceBrackets.length > 0 && raceBrackets.every((b) => b.status === 'completed')
  }

  const getChampion = (raceId) => {
    if (!getIsComplete(raceId)) return null

    const finalRound = getTotalRounds(raceId)
    const finalWinner = state.winners.value.find(
      (w) => w.race_id === raceId && w.round === finalRound
    )
    return finalWinner || null
  }

  // Helper function to get brackets for a specific race
  const getBracketsForRace = (raceId) => {
    return state.brackets.value.filter((b) => b.race_id === raceId)
  }

  // Helper function to get winners for a specific race
  const getWinnersForRace = (raceId) => {
    return state.winners.value.filter((w) => w.race_id === raceId)
  }

  // Create individual bracket (admin only)
  const createBracket = async (bracketData) => {
    if (!authStore.isRaceAdmin) {
      notifications.permissionError('create brackets')
      return false
    }

    state.loading.value = true
    state.error.value = null

    try {
      const { data: newBracket, error: createError } = await $supabase
        .from('brackets')
        .insert(bracketData)
        .select(
          `
          *,
          track1_racer:racers!track1_racer_id (
            id,
            name,
            racer_number
          ),
          track2_racer:racers!track2_racer_id (
            id,
            name,
            racer_number
          )
        `
        )
        .single()

      if (createError) throw createError

      // Add to local state
      state.brackets.value.push(newBracket)
      computeWinners()

      notifications.success(
        'Bracket Created',
        `New bracket #${newBracket.bracket_number} has been created.`
      )

      return newBracket
    } catch (err) {
      // Keep essential error logging for production debugging
      console.error('Error creating bracket:', err)
      state.error.value = err.message
      notifications.error('Failed to Create Bracket', err.message)
      throw err
    } finally {
      state.loading.value = false
    }
  }

  // Update individual bracket (admin only)
  const updateBracket = async (bracketId, updates) => {
    if (!authStore.isRaceAdmin) {
      notifications.permissionError('update brackets')
      return false
    }

    state.loading.value = true
    state.error.value = null

    try {
      const { data: updatedBracket, error: updateError } = await $supabase
        .from('brackets')
        .update(updates)
        .eq('id', bracketId)
        .select(
          `
          *,
          track1_racer:racers!track1_racer_id (
            id,
            name,
            racer_number
          ),
          track2_racer:racers!track2_racer_id (
            id,
            name,
            racer_number
          )
        `
        )
        .single()

      if (updateError) throw updateError

      // Update local state
      const index = state.brackets.value.findIndex((b) => b.id === bracketId)
      if (index !== -1) {
        state.brackets.value[index] = updatedBracket
        computeWinners()
      }

      // If both times are recorded, determine winner
      if (
        updatedBracket.track1_time &&
        updatedBracket.track2_time &&
        updatedBracket.status !== 'completed'
      ) {
        await determineWinner(updatedBracket)
      }

      notifications.success(
        'Bracket Updated',
        `Bracket #${updatedBracket.bracket_number} has been updated.`
      )

      return updatedBracket
    } catch (err) {
      // Keep essential error logging for production debugging
      console.error('Error updating bracket:', err)
      state.error.value = err.message
      notifications.error('Failed to Update Bracket', err.message)
      throw err
    } finally {
      state.loading.value = false
    }
  }

  // Delete individual bracket (admin only)
  const deleteBracket = async (bracketId) => {
    if (!authStore.isRaceAdmin) {
      notifications.permissionError('delete brackets')
      return false
    }

    state.loading.value = true
    state.error.value = null

    try {
      // Get bracket info before deletion for notification
      const bracket = state.brackets.value.find((b) => b.id === bracketId)
      const bracketNumber = bracket?.bracket_number || 'Unknown'

      // Delete related winner record first if it exists
      await $supabase.from('winners').delete().eq('bracket_id', bracketId)

      // Delete the bracket
      const { error: deleteError } = await $supabase.from('brackets').delete().eq('id', bracketId)

      if (deleteError) throw deleteError

      // Remove from local state
      state.brackets.value = state.brackets.value.filter((b) => b.id !== bracketId)
      state.winners.value = state.winners.value.filter((w) => w.bracket_id !== bracketId)

      notifications.success('Bracket Deleted', `Bracket #${bracketNumber} has been deleted.`)

      return true
    } catch (err) {
      // Keep essential error logging for production debugging
      console.error('Error deleting bracket:', err)
      state.error.value = err.message
      notifications.error('Failed to Delete Bracket', err.message)
      throw err
    } finally {
      state.loading.value = false
    }
  }

  // Get bracket by ID from cached data
  const getBracketById = (bracketId) => {
    return state.brackets.value.find((bracket) => bracket.id === bracketId) || null
  }

  // Update bracket times specifically
  const updateBracketTimes = async (bracketId, track1Time = null, track2Time = null) => {
    const updates = {}
    if (track1Time !== null) updates.track1_time = track1Time
    if (track2Time !== null) updates.track2_time = track2Time

    return await updateBracket(bracketId, updates)
  }

  // Set bracket winner manually (admin only)
  const setBracketWinner = async (bracketId, winnerTrack, winnerRacerId) => {
    if (!authStore.isRaceAdmin) {
      notifications.permissionError('set bracket winners')
      return false
    }

    try {
      const updates = {
        winner_track: winnerTrack,
        winner_racer_id: winnerRacerId,
        status: 'completed'
      }

      return await updateBracket(bracketId, updates)
    } catch (err) {
      // Keep essential error logging for production debugging
      console.error('Error setting bracket winner:', err)
      throw err
    }
  }

  // Utility functions
  const formatTime = (time) => {
    if (!time) return '--'
    const timeNum = Number.parseFloat(time)
    return timeNum.toFixed(3) + 's'
  }

  const getBracketStatus = (bracket) => {
    if (bracket.status === 'completed') return 'Completed'
    if (bracket.track1_time && bracket.track2_time) return 'Times Recorded'
    if (bracket.track1_time || bracket.track2_time) return 'Partial Times'
    return 'Pending'
  }

  return {
    // State
    brackets: readonly(state.brackets),
    winners: readonly(state.winners),
    loading: readonly(state.loading),
    error: readonly(state.error),
    generatingBrackets: readonly(state.generatingBrackets),
    recordingTime: readonly(state.recordingTime),
    clearingBrackets: readonly(state.clearingBrackets),

    // Configuration
    bracketConfig: state.bracketConfig,

    // Methods for specific races
    getBracketsByRound,
    getTotalRounds,
    getIsComplete,
    getChampion,
    getBracketsForRace,
    getWinnersForRace,

    // Methods
    initialize,
    generateBrackets,
    recordTime,
    clearBrackets,
    fetchBrackets,
    computeWinners,

    // CRUD methods
    createBracket,
    updateBracket,
    deleteBracket,
    getBracketById,
    updateBracketTimes,
    setBracketWinner,

    // Utilities
    formatTime,
    getBracketStatus
  }
}
