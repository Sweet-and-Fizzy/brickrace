import type { ChallongeTournament, ChallongeTournamentFormData, Race, Qualifier, Racer } from '~/types/database'

interface CheckinWithRacer {
  racer_id: string
  racer: Racer
}

export const useChallonge = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Create a new tournament
  const createTournament = async (raceId: string, tournamentData: ChallongeTournamentFormData) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await $fetch('/api/challonge/tournaments/create', {
        method: 'POST',
        body: { 
          raceId, 
          ...tournamentData 
        }
      })
      return response
    } catch (err: any) {
      error.value = err.data?.message || err.message || 'Failed to create tournament'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Add participants to tournament
  const addParticipants = async (tournamentId: string, racers: any[]) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await $fetch(`/api/challonge/tournaments/${tournamentId}/participants`, {
        method: 'POST',
        body: { racers }
      })
      return response
    } catch (err: any) {
      error.value = err.data?.message || err.message || 'Failed to add participants'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Start tournament
  const startTournament = async (tournamentId: string) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await $fetch(`/api/challonge/tournaments/${tournamentId}/start`, {
        method: 'POST'
      })
      return response
    } catch (err: any) {
      error.value = err.data?.message || err.message || 'Failed to start tournament'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Get tournament status
  const getTournamentStatus = async (tournamentId: string) => {
    loading.value = true
    error.value = null
    
    try {
      const data = await $fetch(`/api/challonge/tournaments/${tournamentId}/status`)
      return data
    } catch (err: any) {
      error.value = err.data?.message || err.message || 'Failed to get tournament status'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Get eligible racers for a race using existing composables
  const getEligibleRacers = async (raceSlug: string) => {
    loading.value = true
    error.value = null
    
    try {
      // Get race by slug
      const { data: raceData } = await $fetch(`/api/races/by-slug/${raceSlug}`)
      const race = raceData as Race
      
      // Use existing composables to get checkins and qualifiers
      const checkinsComposable = useCheckins()
      const qualifiersComposable = useQualifiers(race.id)
      
      // Initialize and fetch data
      await checkinsComposable.initialize(race.id)
      await qualifiersComposable.fetchQualifiers()
      
      // Get checked-in racers
      const checkedInRacers = checkinsComposable.getCheckinsForRace(race.id)
      
      // Get qualifiers data
      const qualifiers = qualifiersComposable.qualifiers
      
      // Process racers with their best qualifying times
      const racersWithTimes = (checkedInRacers as CheckinWithRacer[]).map(checkin => {
        const racerQualifiers = (qualifiers.value as Qualifier[]).filter((q: Qualifier) => q.racer_id === checkin.racer_id)
        const bestTime = racerQualifiers.length > 0 ? Math.min(...racerQualifiers.map((q: Qualifier) => q.time)) : null
        
        return {
          racer_id: checkin.racer_id,
          racer_number: checkin.racer.racer_number,
          name: checkin.racer.name,
          user_id: checkin.racer.user_id || checkin.racer_id, // fallback
          image_url: checkin.racer.image_url,
          best_time: bestTime,
          qualified: bestTime !== null
        }
      })
      
      // Filter to only qualified racers and sort by best time
      const qualifiedRacers = racersWithTimes
        .filter(racer => racer.qualified)
        .sort((a, b) => a.best_time! - b.best_time!)
      
      return {
        race: {
          id: race.id,
          name: race.name,
          slug: raceSlug
        },
        eligible_racers: qualifiedRacers,
        summary: {
          total_checked_in: checkedInRacers.length,
          qualified: qualifiedRacers.length,
          not_qualified: checkedInRacers.length - qualifiedRacers.length
        },
        tournament_exists: false, // Will be checked separately in the page
        existing_tournament: null
      }
    } catch (err: any) {
      error.value = err.data?.message || err.message || 'Failed to get eligible racers'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Get tournament by race ID
  const getTournamentByRace = async (raceId: string): Promise<ChallongeTournament | null> => {
    try {
      const { data } = await $fetch(`/api/challonge/tournaments/by-race/${raceId}`)
      return data
    } catch (err: any) {
      // Return null if not found, throw for other errors
      if (err.status === 404) {
        return null
      }
      throw err
    }
  }

  // Clear error state
  const clearError = () => {
    error.value = null
  }

  return {
    // State
    loading: readonly(loading),
    error: readonly(error),
    
    // Methods
    createTournament,
    addParticipants,
    startTournament,
    getTournamentStatus,
    getEligibleRacers,
    getTournamentByRace,
    clearError
  }
}