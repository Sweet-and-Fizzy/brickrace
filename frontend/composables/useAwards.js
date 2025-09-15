import { computed } from 'vue'
import { useAuthStore } from '~/stores/auth'

// State management using Nuxt's useState
const useAwardsState = () => {
  const awardDefinitions = useState('awards-definitions', () => [])
  const awards = useState('awards-data', () => [])
  const votes = useState('awards-votes', () => [])
  const voteCounts = useState('awards-vote-counts', () => [])
  const userVotes = useState('awards-user-votes', () => new Map())
  const loading = useState('awards-loading', () => false)
  const error = useState('awards-error', () => null)
  const initialized = useState('awards-initialized', () => false)
  const channels = useState('awards-channels', () => ({
    awardsChannel: null,
    votesChannel: null,
    voteCountsChannel: null
  }))

  return {
    awardDefinitions,
    awards,
    votes,
    voteCounts,
    userVotes,
    loading,
    error,
    initialized,
    channels
  }
}

export const useAwards = () => {
  const supabase = useSupabaseClient()
  const authStore = useAuthStore()
  const state = useAwardsState()

  // Initial data fetch
  const fetchAwardDefinitions = async (includeInactive = false) => {
    try {
      let query = supabase.from('award_definitions').select('*').order('name')

      // Only filter by active if not including inactive ones
      if (!includeInactive) {
        query = query.eq('active', true)
      }

      const { data: definitions, error: definitionsError } = await query

      if (definitionsError) throw definitionsError
      state.awardDefinitions.value = definitions || []
    } catch (err) {
      // Keep essential error logging for production debugging
      console.error('Error fetching award definitions:', err)
      state.error.value = err.message
    }
  }

  const fetchAwards = async () => {
    try {
      const { data: awardsData, error: awardsError } = await supabase
        .from('awards')
        .select(
          `
          *,
          award_definition:award_definitions(*),
          racer:racers(id, name, racer_number, image_url)
        `
        )
        .order('created_at', { ascending: false })

      if (awardsError) throw awardsError
      state.awards.value = awardsData || []
    } catch (err) {
      // Keep essential error logging for production debugging
      console.error('Error fetching awards:', err)
      state.error.value = err.message
    }
  }

  const fetchVoteCounts = async (raceId = null) => {
    try {
      let query = supabase
        .from('award_vote_counts')
        .select('*')
        .order('vote_count', { ascending: false })

      // Filter by race if raceId is provided
      if (raceId) {
        query = query.eq('race_id', raceId)
      }

      const { data: counts, error: countsError } = await query

      if (countsError) throw countsError

      if (raceId) {
        // If filtering by race, replace only the vote counts for that race
        const otherRaceCounts = state.voteCounts.value.filter((vc) => vc.race_id !== raceId)
        state.voteCounts.value = [...otherRaceCounts, ...(counts || [])]
      } else {
        // If not filtering, replace all vote counts
        state.voteCounts.value = counts || []
      }
    } catch (err) {
      // Keep essential error logging for production debugging
      console.error('Error fetching vote counts:', err)
      state.error.value = err.message
    }
  }

  const fetchUserVotes = async () => {
    if (!authStore.userId) return

    try {
      const { data: userVotesData, error: votesError } = await supabase
        .from('award_votes')
        .select('*')
        .eq('voter_id', authStore.userId)

      if (votesError) throw votesError

      // Convert to Map for quick lookup
      const votesMap = new Map()
      userVotesData.forEach((vote) => {
        const key = `${vote.racer_id}-${vote.award_definition_id}-${vote.race_id}`
        votesMap.set(key, vote)
      })
      state.userVotes.value = votesMap
    } catch (err) {
      // Keep essential error logging for production debugging
      console.error('Error fetching user votes:', err)
      state.error.value = err.message
    }
  }

  // Submit a vote (upsert: insert new or update existing)
  const submitVote = async (racerId, awardDefinitionId, raceId) => {
    if (!authStore.userId) {
      throw new Error('You must be logged in to vote')
    }

    try {
      // Use upsert to handle insert/update automatically
      const { data, error: upsertError } = await supabase
        .from('award_votes')
        .upsert(
          {
            voter_id: authStore.userId,
            racer_id: racerId,
            award_definition_id: awardDefinitionId,
            race_id: raceId
          },
          {
            onConflict: 'voter_id,award_definition_id,race_id'
          }
        )
        .select()
        .single()

      if (upsertError) throw upsertError

      // Remove any existing vote key from local state
      const existingVoteKey = Array.from(state.userVotes.value.keys()).find((k) =>
        k.endsWith(`-${awardDefinitionId}-${raceId}`)
      )
      if (existingVoteKey) {
        state.userVotes.value.delete(existingVoteKey)
      }

      // Update local user votes with new key
      const key = `${racerId}-${awardDefinitionId}-${raceId}`
      state.userVotes.value.set(key, data)

      return data
    } catch (err) {
      // Keep essential error logging for production debugging
      console.error('Error submitting vote:', err)
      throw err
    }
  }

  // Remove a vote
  const removeVote = async (racerId, awardDefinitionId) => {
    if (!authStore.userId) {
      throw new Error('You must be logged in to vote')
    }

    try {
      const { error: deleteError } = await supabase
        .from('award_votes')
        .delete()
        .eq('voter_id', authStore.userId)
        .eq('racer_id', racerId)
        .eq('award_definition_id', awardDefinitionId)

      if (deleteError) throw deleteError

      // Update local user votes
      // Find and delete all keys that match racer and award (across all races)
      const keysToDelete = Array.from(state.userVotes.value.keys()).filter((k) =>
        k.startsWith(`${racerId}-${awardDefinitionId}-`)
      )
      keysToDelete.forEach((k) => state.userVotes.value.delete(k))
    } catch (err) {
      // Keep essential error logging for production debugging
      console.error('Error removing vote:', err)
      throw err
    }
  }

  // Toggle vote (vote if not voted, remove if already voted)
  const toggleVote = async (racerId, awardDefinitionId, raceId) => {
    if (hasUserVoted(racerId, awardDefinitionId, raceId)) {
      await removeVote(racerId, awardDefinitionId)
      return false // Vote removed
    } else {
      await submitVote(racerId, awardDefinitionId, raceId)
      return true // Vote added
    }
  }

  // Create award definition (admin only)
  const createAwardDefinition = async (definitionData) => {
    if (!authStore.isRaceAdmin) {
      throw new Error('Only administrators can create award definitions')
    }

    try {
      const { data, error: createError } = await supabase
        .from('award_definitions')
        .insert({ ...definitionData, active: true })
        .select()
        .single()

      if (createError) throw createError

      // Add to local state
      state.awardDefinitions.value.push(data)

      return data
    } catch (err) {
      // Keep essential error logging for production debugging
      console.error('Error creating award definition:', err)
      throw err
    }
  }

  // Update award definition (admin only)
  const updateAwardDefinition = async (definitionId, updates) => {
    if (!authStore.isRaceAdmin) {
      throw new Error('Only administrators can update award definitions')
    }

    try {
      const { data, error: updateError } = await supabase
        .from('award_definitions')
        .update(updates)
        .eq('id', definitionId)
        .select()
        .single()

      if (updateError) throw updateError

      // Update local state
      const index = state.awardDefinitions.value.findIndex((def) => def.id === definitionId)
      if (index !== -1) {
        state.awardDefinitions.value[index] = data
      }

      return data
    } catch (err) {
      // Keep essential error logging for production debugging
      console.error('Error updating award definition:', err)
      throw err
    }
  }

  // Toggle award definition active status (admin only)
  const toggleAwardDefinitionActive = async (definitionId) => {
    if (!authStore.isRaceAdmin) {
      throw new Error('Only administrators can toggle award definition status')
    }

    try {
      const definition = state.awardDefinitions.value.find((def) => def.id === definitionId)
      if (!definition) throw new Error('Award definition not found')

      const { data, error: toggleError } = await supabase
        .from('award_definitions')
        .update({ active: !definition.active })
        .eq('id', definitionId)
        .select()
        .single()

      if (toggleError) throw toggleError

      // Update local state
      const index = state.awardDefinitions.value.findIndex((def) => def.id === definitionId)
      if (index !== -1) {
        state.awardDefinitions.value[index] = data
      }

      return data
    } catch (err) {
      // Keep essential error logging for production debugging
      console.error('Error toggling award definition status:', err)
      throw err
    }
  }

  // Delete award definition (admin only)
  const deleteAwardDefinition = async (definitionId) => {
    if (!authStore.isRaceAdmin) {
      throw new Error('Only administrators can delete award definitions')
    }

    try {
      const { error: deleteError } = await supabase
        .from('award_definitions')
        .delete()
        .eq('id', definitionId)

      if (deleteError) throw deleteError

      // Remove from local state
      state.awardDefinitions.value = state.awardDefinitions.value.filter(
        (def) => def.id !== definitionId
      )

      return true
    } catch (err) {
      // Keep essential error logging for production debugging
      console.error('Error deleting award definition:', err)
      throw err
    }
  }

  // Assign an award (admin only)
  const assignAward = async (racerId, awardDefinitionId, raceId = null, notes = null) => {
    if (!authStore.isRaceAdmin) {
      throw new Error('Only administrators can assign awards')
    }

    try {
      const { data, error: assignError } = await supabase
        .from('awards')
        .insert({
          racer_id: racerId,
          award_definition_id: awardDefinitionId,
          race_id: raceId,
          assigned_by: authStore.user?.id,
          notes
        })
        .select(
          `
          *,
          award_definition:award_definitions(*),
          racer:racers(id, name, racer_number, image_url)
        `
        )
        .single()

      if (assignError) throw assignError

      // Add to local state
      state.awards.value.unshift(data)

      return data
    } catch (err) {
      // Keep essential error logging for production debugging
      console.error('Error assigning award:', err)
      throw err
    }
  }

  // Remove an award (admin only)
  const removeAward = async (awardId) => {
    if (!authStore.isRaceAdmin) {
      throw new Error('Only administrators can remove awards')
    }

    try {
      const { error: removeError } = await supabase.from('awards').delete().eq('id', awardId)

      if (removeError) throw removeError
    } catch (err) {
      // Keep essential error logging for production debugging
      console.error('Error removing award:', err)
      throw err
    }
  }

  // Handle real-time updates for awards
  const handleAwardUpdate = (payload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload

    switch (eventType) {
      case 'INSERT':
        // Add new award - will be populated by subscription
        break

      case 'UPDATE': {
        // Update existing award
        const updateIndex = state.awards.value.findIndex((a) => a.id === newRecord.id)
        if (updateIndex !== -1) {
          state.awards.value[updateIndex] = {
            ...state.awards.value[updateIndex],
            ...newRecord
          }
        }
        break
      }

      case 'DELETE':
        // Remove award from list
        state.awards.value = state.awards.value.filter((a) => a.id !== oldRecord.id)
        break
    }
  }

  // Handle real-time updates for votes
  const handleVoteUpdate = (payload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload

    // If this is the current user's vote, update local state
    if (
      authStore.userId &&
      (newRecord?.voter_id === authStore.userId || oldRecord?.voter_id === authStore.userId)
    ) {
      const record = newRecord || oldRecord
      const key = `${record.racer_id}-${record.award_definition_id}-${record.race_id}`

      switch (eventType) {
        case 'INSERT':
          state.userVotes.value.set(key, newRecord)
          break
        case 'UPDATE':
          // Remove old key if racer changed
          if (oldRecord && newRecord.racer_id !== oldRecord.racer_id) {
            const oldKey = `${oldRecord.racer_id}-${oldRecord.award_definition_id}-${oldRecord.race_id}`
            state.userVotes.value.delete(oldKey)
          }
          state.userVotes.value.set(key, newRecord)
          break
        case 'DELETE':
          state.userVotes.value.delete(key)
          break
      }
    }

    // Update vote counts reactively based on the vote change
    updateVoteCountsFromVoteChange(payload)
  }

  // Update vote counts based on real-time vote changes
  const updateVoteCountsFromVoteChange = (payload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload

    const updateVoteCountForRecord = (record, increment) => {
      // Find existing vote count entry
      const existingIndex = state.voteCounts.value.findIndex(
        (vc) =>
          vc.award_definition_id === record.award_definition_id &&
          vc.race_id === record.race_id &&
          vc.racer_id === record.racer_id
      )

      if (existingIndex !== -1) {
        // Update existing count
        const currentCount = state.voteCounts.value[existingIndex].vote_count
        const newCount = Math.max(0, currentCount + increment)

        if (newCount === 0) {
          // Remove entry if count reaches 0
          state.voteCounts.value.splice(existingIndex, 1)
        } else {
          // Update count
          state.voteCounts.value[existingIndex] = {
            ...state.voteCounts.value[existingIndex],
            vote_count: newCount
          }
        }
      } else if (increment > 0) {
        // Create new entry for positive increments only
        // We'll need to fetch racer and award names
        fetchVoteCounts() // Fallback to full refresh for new entries
      }
    }

    switch (eventType) {
      case 'INSERT':
        updateVoteCountForRecord(newRecord, 1)
        break
      case 'UPDATE':
        // Handle vote changing from one racer to another
        if (oldRecord && newRecord.racer_id !== oldRecord.racer_id) {
          updateVoteCountForRecord(oldRecord, -1)
          updateVoteCountForRecord(newRecord, 1)
        }
        break
      case 'DELETE':
        updateVoteCountForRecord(oldRecord, -1)
        break
    }
  }

  // Handle real-time updates for vote counts

  // Setup real-time subscriptions
  const setupSubscriptions = () => {
    if (state.channels.value.awardsChannel) {
      return
    }
    // Subscribe to awards changes
    state.channels.value.awardsChannel = supabase
      .channel('awards-realtime')
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

    // Subscribe to vote changes
    state.channels.value.votesChannel = supabase
      .channel('votes-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'award_votes'
        },
        handleVoteUpdate
      )
      .subscribe()

    // Subscribe to vote count changes
    // Note: award_vote_counts is a view that automatically updates when award_votes changes
    // We don't need a separate subscription for the view, just monitor award_votes
    // The vote counts will be refreshed via the handleVoteUpdate function
  }

  // Initialize on first use
  const initialize = async (options = {}) => {
    if (state.initialized.value) {
      return
    }
    state.initialized.value = true
    state.loading.value = true
    state.error.value = null

    try {
      await Promise.all([
        fetchAwardDefinitions(options.includeInactive || false),
        fetchAwards(),
        fetchVoteCounts(options.raceId),
        fetchUserVotes()
      ])
      setupSubscriptions()
    } finally {
      state.loading.value = false
    }
  }

  // Computed properties
  const voteableAwards = computed(() => {
    return state.awardDefinitions.value.filter((def) => def.voteable)
  })

  const assignableAwards = computed(() => {
    return state.awardDefinitions.value.filter((def) => !def.voteable)
  })

  // Check if user has voted for a specific racer/award combination
  const hasUserVoted = (racerId, awardDefinitionId, raceId = null) => {
    if (raceId) {
      const key = `${racerId}-${awardDefinitionId}-${raceId}`
      return state.userVotes.value.has(key)
    } else {
      // Check if user has voted for this racer/award in any race
      return Array.from(state.userVotes.value.keys()).some((k) =>
        k.startsWith(`${racerId}-${awardDefinitionId}-`)
      )
    }
  }

  // Get the user's vote for a specific award category/race (returns racer ID or null)
  const getUserVoteForAward = (awardDefinitionId, raceId = null) => {
    if (raceId) {
      // Find the vote key for this award and race
      const voteKey = Array.from(state.userVotes.value.keys()).find((k) =>
        k.endsWith(`-${awardDefinitionId}-${raceId}`)
      )
      if (voteKey) {
        const vote = state.userVotes.value.get(voteKey)
        return vote?.racer_id || null
      }
    } else {
      // Find the vote key for this award in any race
      const voteKey = Array.from(state.userVotes.value.keys()).find((k) =>
        k.includes(`-${awardDefinitionId}-`)
      )
      if (voteKey) {
        const vote = state.userVotes.value.get(voteKey)
        return vote?.racer_id || null
      }
    }

    return null
  }

  // Check if user has voted for any racer in a specific award category/race
  const hasUserVotedForAward = (awardDefinitionId, raceId = null) => {
    return getUserVoteForAward(awardDefinitionId, raceId) !== null
  }

  // Get vote count for a specific racer/award combination
  const getVoteCount = (racerId, awardDefinitionId, raceId = null) => {
    const voteCount = state.voteCounts.value.find(
      (vc) =>
        vc.racer_id === racerId &&
        vc.award_definition_id === awardDefinitionId &&
        (!raceId || vc.race_id === raceId)
    )
    return voteCount?.vote_count || 0
  }

  // Get all vote counts for a racer
  const getRacerVoteCounts = (racerId, raceId = null) => {
    if (!state.voteCounts.value || !Array.isArray(state.voteCounts.value)) return []
    return state.voteCounts.value.filter(
      (vc) => vc.racer_id === racerId && (!raceId || vc.race_id === raceId)
    )
  }

  // Get awards for a racer
  const getRacerAwards = (racerId) => {
    return state.awards.value.filter((award) => award.racer_id === racerId)
  }

  // Get leaderboard for a specific award
  const getAwardLeaderboard = (awardDefinitionId, raceId = null) => {
    return state.voteCounts.value
      .filter(
        (vc) => vc.award_definition_id === awardDefinitionId && (!raceId || vc.race_id === raceId)
      )
      .sort((a, b) => b.vote_count - a.vote_count)
  }

  // Get awards for a specific race
  const getAwardsByRace = (raceId) => {
    return state.awards.value.filter((award) => award.race_id === raceId)
  }

  // Get vote results grouped by award for a specific race
  const getVoteResultsByRace = (raceId) => {
    const raceVoteCounts = state.voteCounts.value.filter((vc) => vc.race_id === raceId)

    const grouped = {}
    raceVoteCounts.forEach((vote) => {
      if (!grouped[vote.award_name]) {
        grouped[vote.award_name] = {
          award_name: vote.award_name,
          award_definition_id: vote.award_definition_id,
          votes: []
        }
      }
      grouped[vote.award_name].votes.push(vote)
    })

    // Sort votes within each award by vote count
    Object.values(grouped).forEach((award) => {
      award.votes.sort((a, b) => b.vote_count - a.vote_count)
    })

    return Object.values(grouped)
  }

  return {
    // Data
    awardDefinitions: readonly(state.awardDefinitions),
    awards: readonly(state.awards),
    votes: readonly(state.votes),
    voteCounts: readonly(state.voteCounts),
    userVotes: readonly(state.userVotes),
    voteableAwards,
    assignableAwards,
    loading: readonly(state.loading),
    error: readonly(state.error),

    // Methods
    initialize,
    fetchAwardDefinitions,
    createAwardDefinition,
    updateAwardDefinition,
    toggleAwardDefinitionActive,
    deleteAwardDefinition,
    submitVote,
    removeVote,
    toggleVote,
    assignAward,
    removeAward,
    hasUserVoted,
    hasUserVotedForAward,
    getUserVoteForAward,
    getVoteCount,
    getRacerVoteCounts,
    getRacerAwards,
    getAwardLeaderboard,
    getAwardsByRace,
    getVoteResultsByRace
  }
}
