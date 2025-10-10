import { useAuthStore } from '~/stores/auth'

// Create a shared state using useState pattern
const useRacersState = () => {
  return {
    racers: useState('racers-data', () => []),
    detailedRacers: useState('racers-detailed-cache', () => new Map()),
    loading: useState('racers-loading', () => false),
    error: useState('racers-error', () => null),
    voteableAwards: useState('racers-voteable-awards', () => []),
    channels: useState('racers-channels', () => ({
      racersChannel: null,
      votesChannel: null,
      awardsChannel: null
    })),
    initialized: useState('racers-initialized', () => false)
  }
}

export const useRacers = () => {
  const supabase = useSupabaseClient()
  const authStore = useAuthStore()

  // Get useState-based state
  const state = useRacersState()

  // Use state references
  const racers = state.racers
  const loading = state.loading
  const error = state.error
  const voteableAwards = state.voteableAwards

  // Get all racer images including gallery photos
  const getAllRacerImages = (racer) => {
    if (!racer) return []

    const images = []

    // Add main image first
    if (racer.image_url) {
      images.push(racer.image_url)
    }

    // Add gallery photos (only approved ones)
    if (racer.photos && Array.isArray(racer.photos)) {
      racer.photos.forEach((photo) => {
        let photoObj = photo
        if (typeof photo === 'string') {
          try {
            photoObj = JSON.parse(photo)
          } catch {
            photoObj = { url: photo, status: 'approved' }
          }
        }

        if (photoObj.status === 'approved' && photoObj.url && !images.includes(photoObj.url)) {
          images.push(photoObj.url)
        }
      })
    }

    return images
  }

  // Helper functions for times
  const getTimeRange = (racer) => {
    if (!racer.qualifiers?.length) return null
    const times = racer.qualifiers
      .map((q) => Number.parseFloat(q.time))
      .filter((t) => !Number.isNaN(t))
    if (times.length === 0) return null

    const fastest = Math.min(...times).toFixed(2)
    const slowest = Math.max(...times).toFixed(2)

    // If only one time or same time, show just the single time
    if (times.length === 1 || fastest === slowest) {
      return `${fastest} seconds`
    }

    // Show range
    return `${fastest} - ${slowest} seconds`
  }

  // Get vote counts for display
  const getVoteCounts = (racer) => {
    if (!racer.votesByAward || !voteableAwards.value.length) return []

    return voteableAwards.value
      .map((award) => ({
        awardId: award.id,
        awardName: award.name,
        count: racer.votesByAward[award.id] || 0
      }))
      .filter((vote) => vote.count > 0) // Only show awards with votes
  }

  // Fetch voteable awards
  const fetchVoteableAwards = async () => {
    try {
      const { data: awards, error: awardsError } = await supabase
        .from('award_definitions')
        .select('id, name')
        .eq('voteable', true)
        .eq('active', true)
        .order('name')

      if (awardsError) throw awardsError
      voteableAwards.value = awards || []
    } catch (err) {
      // Keep essential error logging for production debugging
      console.error('Error fetching voteable awards:', err)
      error.value = err.message
    }
  }

  // Fetch vote counts for all racers
  const fetchVoteCounts = async () => {
    try {
      const { data: voteCounts, error: voteError } = await supabase
        .from('award_vote_counts')
        .select('*')

      if (voteError) {
        // Keep essential error logging for production debugging
        console.error('Error fetching vote counts:', voteError)
        return {}
      }

      return voteCounts || []
    } catch (err) {
      // Keep essential error logging for production debugging
      console.error('Error fetching vote counts:', err)
      return {}
    }
  }

  // Initial data fetch
  const fetchRacers = async () => {
    loading.value = true
    error.value = null

    try {
      // Fetch racers with related data
      const { data: racersData, error: racersError } = await supabase
        .from('racers')
        .select(
          `
          *,
          qualifiers(time),
          awards(*, award_definition:award_definitions(name))
        `
        )
        .order('created_at', { ascending: false })

      if (racersError) throw racersError

      // Fetch vote counts
      const voteCounts = await fetchVoteCounts()

      // Get unique user IDs for maker info
      const userIds = [...new Set(racersData.map((racer) => racer.user_id))]
      const userMap = new Map()

      // For the current user, we can get their name from the auth store
      if (authStore.userId && authStore.user) {
        const metadata = authStore.user.user_metadata || {}
        const currentUserName =
          metadata.username ||
          metadata.full_name ||
          metadata.name ||
          (authStore.user.email ? authStore.user.email.split('@')[0] : 'You')
        userMap.set(authStore.userId, currentUserName)
      }

      // For other users, use simplified display names
      userIds.forEach((userId) => {
        if (!userMap.has(userId)) {
          userMap.set(userId, `User-${userId.slice(0, 8)}`)
        }
      })

      // Map racers with maker info and vote counts
      const racersWithData = racersData.map((racer) => {
        const displayName = userMap.get(racer.user_id) || `User-${racer.user_id.slice(0, 8)}`

        // Add vote counts per award category
        const votesByAward = {}
        if (voteCounts) {
          voteCounts
            .filter((vc) => vc.racer_id === racer.id)
            .forEach((vc) => {
              votesByAward[vc.award_definition_id] = vc.vote_count
            })
        }

        return {
          ...racer,
          maker: {
            id: racer.user_id,
            displayName
          },
          votesByAward
        }
      })

      racers.value = racersWithData
    } catch (err) {
      // Keep essential error logging for production debugging
      console.error('Error fetching racers:', err)
      error.value = err.message
      racers.value = []
    } finally {
      loading.value = false
    }
  }

  // Handle real-time updates for racers
  const handleRacerUpdate = (payload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload
    const updateIndex = racers.value.findIndex((r) => r.id === newRecord.id)

    switch (eventType) {
      case 'INSERT':
        // Add new racer to the list
        racers.value.unshift({
          ...newRecord,
          qualifiers: [],
          awards: [],
          votesByAward: {},
          maker: {
            id: newRecord.user_id,
            displayName: `User-${newRecord.user_id.slice(0, 8)}`
          }
        })
        break

      case 'UPDATE':
        // Update existing racer
        if (updateIndex !== -1) {
          racers.value[updateIndex] = {
            ...racers.value[updateIndex],
            ...newRecord
          }
        }
        break

      case 'DELETE':
        // Remove racer from list
        racers.value = racers.value.filter((r) => r.id !== oldRecord.id)
        break
    }
  }

  // Handle real-time vote count updates
  const handleVoteUpdate = async () => {
    // Refresh vote counts for all racers
    const voteCounts = await fetchVoteCounts()

    racers.value.forEach((racer) => {
      const votesByAward = {}
      if (voteCounts) {
        voteCounts
          .filter((vc) => vc.racer_id === racer.id)
          .forEach((vc) => {
            votesByAward[vc.award_definition_id] = vc.vote_count
          })
      }
      racer.votesByAward = votesByAward
    })
  }

  // Handle real-time award updates
  const handleAwardUpdate = (payload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload

    // Find the racer this award belongs to
    const racerIndex = racers.value.findIndex(
      (r) => r.id === (newRecord?.racer_id || oldRecord?.racer_id)
    )
    if (racerIndex === -1) return

    const racer = racers.value[racerIndex]
    const awardIndex = racer.awards.findIndex((a) => a.id === newRecord.id)

    switch (eventType) {
      case 'INSERT':
        // Add new award to racer
        if (!racer.awards) racer.awards = []
        racer.awards.push(newRecord)
        break

      case 'UPDATE': {
        // Update existing award
        if (awardIndex !== -1) {
          racer.awards[awardIndex] = newRecord
        }
        break
      }

      case 'DELETE':
        // Remove award from racer
        if (racer.awards) {
          racer.awards = racer.awards.filter((a) => a.id !== oldRecord.id)
        }
        break
    }
  }

  // Setup real-time subscriptions
  const setupSubscriptions = () => {
    // Only set up subscriptions once globally
    if (state.channels.value.racersChannel) {
      return
    }

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
      .subscribe()

    // Subscribe to vote count changes
    state.channels.value.votesChannel = supabase
      .channel('global-votes-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'award_votes'
        },
        handleVoteUpdate
      )
      // Note: award_vote_counts is a view, so we only subscribe to award_votes
      // The view will automatically update when award_votes changes
      .subscribe()

    // Subscribe to awards changes
    state.channels.value.awardsChannel = supabase
      .channel('global-awards-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'awards'
        },
        handleAwardUpdate
      )
      .subscribe()
  }

  // Initialize on first use
  const initialize = async () => {
    if (state.initialized.value) {
      return
    }

    state.initialized.value = true

    await fetchVoteableAwards()
    await fetchRacers()
    setupSubscriptions()
  }

  // Fetch detailed racer data with all related info
  const fetchRacerDetails = async (racerId) => {
    try {
      // Fetch racer data first
      const { data: racerData, error: racerError } = await supabase
        .from('racers')
        .select('*')
        .eq('id', racerId)
        .single()

      if (racerError) throw racerError

      // Fetch related data separately to avoid relationship ambiguity
      const [qualifiersData, awardsData, bracketsData, checkinsData] = await Promise.all([
        // Qualifiers
        supabase
          .from('qualifiers')
          .select(
            `
            *,
            race:races(name)
          `
          )
          .eq('racer_id', racerId)
          .order('created_at', { ascending: false }),

        // Awards
        supabase
          .from('awards')
          .select(
            `
            *,
            award_definition:award_definitions(name, image_url, description),
            race:races(name)
          `
          )
          .eq('racer_id', racerId)
          .order('created_at', { ascending: false }),

        // Brackets (where this racer participated)
        supabase
          .from('brackets')
          .select(
            `
            id,
            created_at,
            race_id,
            track1_racer_id,
            track2_racer_id,
            track1_time,
            track2_time,
            bracket_type,
            bracket_group,
            round_number,
            is_forfeit,
            forfeit_reason,
            winner_track,
            winner_racer_id,
            match_number,
            match_format,
            rounds_won_track1,
            rounds_won_track2,
            is_completed,
            challonge_match_id,
            races(name),
            track1_racer:track1_racer_id(name),
            track2_racer:track2_racer_id(name),
            bracket_rounds(
              id,
              round_number,
              racer1_id,
              racer2_id,
              racer1_track,
              racer2_track,
              racer1_time,
              racer2_time,
              winner_racer_id,
              winner_track,
              is_forfeit,
              forfeit_reason
            )
          `
          )
          .or(`track1_racer_id.eq.${racerId},track2_racer_id.eq.${racerId}`)
          .order('created_at', { ascending: false }),

        // Checkins
        supabase
          .from('checkins')
          .select(
            `
            *,
            race:races(name)
          `
          )
          .eq('racer_id', racerId)
          .order('created_at', { ascending: false })
      ])

      // Check for errors in any of the queries
      if (qualifiersData.error) throw qualifiersData.error
      if (awardsData.error) throw awardsData.error
      if (bracketsData.error) throw bracketsData.error
      if (checkinsData.error) throw checkinsData.error

      // Get maker info
      let makerInfo = {
        id: racerData.user_id,
        email: 'Unknown User',
        user_metadata: { username: 'Unknown User' }
      }

      // If this is the current user's racer, get their info from auth store
      if (racerData.user_id === authStore.userId && authStore.user) {
        makerInfo = {
          id: authStore.user.id,
          email: authStore.user.email,
          user_metadata: authStore.user.user_metadata || {}
        }
      }

      // Cache the detailed racer data
      const detailedRacer = {
        ...racerData,
        maker: makerInfo,
        qualifiers: qualifiersData.data || [],
        awards: awardsData.data || [],
        brackets: bracketsData.data || [],
        checkins: checkinsData.data || [],
        lastFetched: Date.now()
      }

      state.detailedRacers.value.set(racerId, detailedRacer)

      return detailedRacer
    } catch (err) {
      // Keep essential error logging for production debugging
      console.error('Error fetching racer details:', err)
      throw err
    }
  }

  // Get racer by slug
  const getRacerBySlug = (slug) => {
    // Check basic racer data first
    const basicRacer = racers.value.find((r) => r.slug === slug)
    if (basicRacer) {
      // Check if we have detailed cache for this racer
      if (state.detailedRacers.value.has(basicRacer.id)) {
        return state.detailedRacers.value.get(basicRacer.id)
      }
      return basicRacer
    }
    return null
  }

  // Fetch racer details by slug
  const fetchRacerDetailsBySlug = async (slug) => {
    try {
      // First fetch the racer by slug to get the ID
      const { data: racerData, error: racerError } = await supabase
        .from('racers')
        .select('*')
        .eq('slug', slug)
        .single()

      if (racerError) throw racerError

      // Then use the existing fetchRacerDetails method
      return await fetchRacerDetails(racerData.id)
    } catch (err) {
      console.error('Error fetching racer by slug:', err)
      throw err
    }
  }

  // Check if detailed data is cached and fresh (within 5 minutes)
  const isDetailedDataFresh = (racerId) => {
    const cached = state.detailedRacers.value.get(racerId)
    if (!cached || !cached.lastFetched) return false

    const age = Date.now() - cached.lastFetched
    const maxAge = 5 * 60 * 1000 // 5 minutes
    return age < maxAge
  }

  // Update existing racer (user must own the racer or be admin)
  const updateRacer = async (racerId, updates) => {
    state.loading.value = true
    state.error.value = null

    try {
      // First check if the user can update this racer
      const { data: existingRacer, error: checkError } = await supabase
        .from('racers')
        .select('id, user_id')
        .eq('id', racerId)
        .single()

      if (checkError) {
        throw new Error(`Racer not found or access denied: ${checkError.message}`)
      }

      // Check permissions: user owns racer or is admin
      if (existingRacer.user_id !== authStore.userId && !authStore.isRaceAdmin) {
        throw new Error('You do not have permission to update this racer')
      }

      const { data: updatedRacer, error: updateError } = await supabase
        .from('racers')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', racerId)
        .select()

      if (updateError) throw updateError

      // Check if any rows were affected
      if (!updatedRacer || updatedRacer.length === 0) {
        throw new Error(
          'Update failed - no rows were modified. This may be due to database permissions.'
        )
      }

      const racer = updatedRacer[0]

      // Update local state - both basic racers and detailed cache
      const basicIndex = state.racers.value.findIndex((r) => r.id === racerId)
      if (basicIndex !== -1) {
        state.racers.value[basicIndex] = { ...state.racers.value[basicIndex], ...racer }
      }

      // Update detailed cache if it exists
      if (state.detailedRacers.value.has(racerId)) {
        const detailed = state.detailedRacers.value.get(racerId)
        state.detailedRacers.value.set(racerId, { ...detailed, ...racer })
      }

      return racer
    } catch (err) {
      // Keep essential error logging for production debugging
      console.error('Error updating racer:', err)
      state.error.value = err.message
      throw err
    } finally {
      state.loading.value = false
    }
  }

  // Update racer image specifically
  const updateRacerImage = async (racerId, imageUrl) => {
    try {
      const { data: updatedRacer, error: updateError } = await supabase
        .from('racers')
        .update({
          image_url: imageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', racerId)
        .select()
        .single()

      if (updateError) throw updateError

      // Update local state
      const basicIndex = state.racers.value.findIndex((r) => r.id === racerId)
      if (basicIndex !== -1) {
        state.racers.value[basicIndex].image_url = imageUrl
      }

      // Update detailed cache if it exists
      if (state.detailedRacers.value.has(racerId)) {
        const detailed = state.detailedRacers.value.get(racerId)
        detailed.image_url = imageUrl
        state.detailedRacers.value.set(racerId, detailed)
      }

      return updatedRacer
    } catch (err) {
      // Keep essential error logging for production debugging
      console.error('Error updating racer image:', err)
      throw err
    }
  }

  // Update racer photos specifically
  const updateRacerPhotos = async (racerId, photos) => {
    try {
      const { data: updatedRacer, error: updateError } = await supabase
        .from('racers')
        .update({
          photos: photos,
          updated_at: new Date().toISOString()
        })
        .eq('id', racerId)
        .select()
        .single()

      if (updateError) throw updateError

      // Update local state
      const basicIndex = state.racers.value.findIndex((r) => r.id === racerId)
      if (basicIndex !== -1) {
        state.racers.value[basicIndex].photos = photos
      }

      // Update detailed cache if it exists
      if (state.detailedRacers.value.has(racerId)) {
        const detailed = state.detailedRacers.value.get(racerId)
        detailed.photos = photos
        state.detailedRacers.value.set(racerId, detailed)
      }

      return updatedRacer
    } catch (err) {
      // Keep essential error logging for production debugging
      console.error('Error updating racer photos:', err)
      throw err
    }
  }

  // Computed properties
  const myRacers = computed(() => {
    if (!authStore.userId) return []
    return racers.value.filter((racer) => racer.user_id === authStore.userId)
  })

  // Preview withdrawal impact before withdrawing
  const previewWithdrawalImpact = async (racerId, raceId) => {
    try {
      const response = await $fetch(`/api/racers/${racerId}/withdrawal-preview?race_id=${raceId}`)
      return response
    } catch (err) {
      console.error('Error previewing withdrawal impact:', err)
      throw err
    }
  }

  // Withdraw racer from specific race
  const withdrawRacerFromRace = async (racerId, raceId, reason = null) => {
    try {
      const response = await $fetch(`/api/racers/${racerId}/withdraw`, {
        method: 'PATCH',
        body: {
          withdrawn: true,
          race_id: raceId,
          reason
        }
      })

      return response
    } catch (err) {
      console.error('Error withdrawing racer from race:', err)
      throw err
    }
  }

  // Reinstate racer to specific race
  const reinstateRacerToRace = async (racerId, raceId) => {
    try {
      const response = await $fetch(`/api/racers/${racerId}/withdraw`, {
        method: 'PATCH',
        body: {
          withdrawn: false,
          race_id: raceId
        }
      })

      return response
    } catch (err) {
      console.error('Error reinstating racer to race:', err)
      throw err
    }
  }

  // Get withdrawals for a specific race
  const getRaceWithdrawals = async (raceId) => {
    try {
      const { data: withdrawals, error } = await supabase
        .from('race_withdrawals')
        .select(
          `
          *,
          racer:racers(id, name, racer_number, image_url)
        `
        )
        .eq('race_id', raceId)

      if (error) throw error
      return withdrawals || []
    } catch (err) {
      console.error('Error fetching race withdrawals:', err)
      return []
    }
  }

  // Check if racer is withdrawn from specific race
  const isRacerWithdrawnFromRace = async (racerId, raceId) => {
    try {
      const { data, error } = await supabase
        .from('race_withdrawals')
        .select('id')
        .eq('racer_id', racerId)
        .eq('race_id', raceId)
        .single()

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned
        throw error
      }

      return !!data
    } catch (err) {
      console.error('Error checking racer withdrawal status:', err)
      return false
    }
  }

  // Get active racers for a specific race (excluding withdrawn)
  const getActiveRacersForRace = async (raceId) => {
    try {
      const { data: withdrawnRacerIds, error: withdrawalError } = await supabase
        .from('race_withdrawals')
        .select('racer_id')
        .eq('race_id', raceId)

      if (withdrawalError) throw withdrawalError

      const withdrawnIds = (withdrawnRacerIds || []).map((w) => w.racer_id)

      return racers.value.filter((racer) => !withdrawnIds.includes(racer.id))
    } catch (err) {
      console.error('Error getting active racers for race:', err)
      return racers.value // Return all racers if error
    }
  }

  // Check if current user can withdraw/reinstate a specific racer
  const canUserWithdrawRacer = (racerId) => {
    if (!authStore.userId) return false

    // Race admins can withdraw any racer
    if (authStore.isRaceAdmin) return true

    // Racer owners can withdraw their own racers
    const racer = racers.value.find((r) => r.id === racerId)
    return racer && racer.user_id === authStore.userId
  }

  return {
    // Data
    racers,
    myRacers,
    voteableAwards,
    loading,
    error,

    // Methods
    initialize,
    fetchRacers,
    fetchRacerDetails,
    fetchRacerDetailsBySlug,
    getRacerBySlug,
    isDetailedDataFresh,
    updateRacer,
    updateRacerImage,
    updateRacerPhotos,
    getAllRacerImages,
    getTimeRange,
    getVoteCounts,

    // Race-specific withdrawal methods
    previewWithdrawalImpact,
    withdrawRacerFromRace,
    reinstateRacerToRace,
    getRaceWithdrawals,
    isRacerWithdrawnFromRace,
    getActiveRacersForRace,
    canUserWithdrawRacer
  }
}
