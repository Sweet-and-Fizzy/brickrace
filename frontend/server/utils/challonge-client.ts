// Direct HTTP client for Challonge API v1
const createChallongeHttpClient = () => {
  const config = useRuntimeConfig()
  
  if (!config.challongeApiKey) {
    throw new Error('CHALLONGE_API_KEY is required but not configured')
  }

  if (!config.challongeUsername) {
    throw new Error('CHALLONGE_USERNAME is required but not configured')
  }

  const baseURL = 'https://api.challonge.com/v1'
  const auth = `${config.challongeUsername}:${config.challongeApiKey}`
  const authHeader = `Basic ${Buffer.from(auth).toString('base64')}`

  return {
    baseURL,
    authHeader,
    username: config.challongeUsername,
    apiKey: config.challongeApiKey
  }
}

// Helper types for Challonge API responses
export interface ChallongeApiTournament {
  tournament: {
    id: number
    name: string
    url: string
    description: string
    tournament_type: string
    started_at: string | null
    completed_at: string | null
    state: string
    participants_count: number
  }
}

export interface ChallongeApiParticipant {
  participant: {
    id: number
    tournament_id: number
    name: string
    seed: number
    active: boolean
    misc: string | null
  }
}

export interface ChallongeApiMatch {
  match: {
    id: number
    tournament_id: number
    state: string
    player1_id: number | null
    player2_id: number | null
    winner_id: number | null
    loser_id: number | null
    started_at: string | null
    completed_at: string | null
    round: number
  }
}

// Promisified wrapper functions for easier async/await usage
export const challongeApi = {
  // Tournament operations
  createTournament: async (params: any): Promise<ChallongeApiTournament> => {
    const client = createChallongeHttpClient()
    
    try {
      console.log('Creating tournament with params:', params)
      
      const response = await fetch(`${client.baseURL}/tournaments.json`, {
        method: 'POST',
        headers: {
          'Authorization': client.authHeader,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ tournament: params })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`HTTP ${response.status}: ${errorText}`)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      console.log('Successfully created tournament')
      return data
    } catch (error) {
      console.error('Failed to create tournament:', error)
      throw error
    }
  },

  startTournament: async (tournamentId: string): Promise<ChallongeApiTournament> => {
    const client = createChallongeHttpClient()
    
    try {
      console.log(`Starting tournament ${tournamentId}`)
      
      const response = await fetch(`${client.baseURL}/tournaments/${tournamentId}/start.json`, {
        method: 'POST',
        headers: {
          'Authorization': client.authHeader,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`HTTP ${response.status}: ${errorText}`)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      console.log(`Successfully started tournament ${tournamentId}`)
      return data
    } catch (error) {
      console.error(`Failed to start tournament ${tournamentId}:`, error)
      throw error
    }
  },

  finalizeTournament: async (tournamentId: string): Promise<ChallongeApiTournament> => {
    const client = createChallongeHttpClient()
    
    try {
      console.log(`Finalizing tournament ${tournamentId}`)
      
      const response = await fetch(`${client.baseURL}/tournaments/${tournamentId}/finalize.json`, {
        method: 'POST',
        headers: {
          'Authorization': client.authHeader,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`HTTP ${response.status}: ${errorText}`)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      console.log(`Successfully finalized tournament ${tournamentId}`)
      return data
    } catch (error) {
      console.error(`Failed to finalize tournament ${tournamentId}:`, error)
      throw error
    }
  },

  getTournament: async (tournamentId: string): Promise<ChallongeApiTournament> => {
    const client = createChallongeHttpClient()
    
    try {
      console.log(`Getting tournament ${tournamentId}`)
      
      const response = await fetch(`${client.baseURL}/tournaments/${tournamentId}.json`, {
        method: 'GET',
        headers: {
          'Authorization': client.authHeader,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`HTTP ${response.status}: ${errorText}`)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      console.log(`Successfully retrieved tournament ${tournamentId}`)
      return data
    } catch (error) {
      console.error(`Failed to get tournament ${tournamentId}:`, error)
      throw error
    }
  },

  // Participant operations - bulk add using individual create calls with direct HTTP
  bulkAddParticipants: async (tournamentId: string, participants: any[]): Promise<ChallongeApiParticipant[]> => {
    const client = createChallongeHttpClient()
    const results: ChallongeApiParticipant[] = []
    
    for (const participant of participants) {
      try {
        console.log(`Adding participant ${participant.name} to tournament ${tournamentId}`)
        
        const response = await fetch(`${client.baseURL}/tournaments/${tournamentId}/participants.json`, {
          method: 'POST',
          headers: {
            'Authorization': client.authHeader,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ participant })
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`HTTP ${response.status}: ${errorText}`)
          throw new Error(`HTTP ${response.status}: ${errorText}`)
        }

        const data = await response.json()
        console.log(`Successfully added participant ${participant.name}`)
        results.push(data)
      } catch (error) {
        console.error(`Failed to add participant ${participant.name}:`, error)
        // Continue with other participants even if one fails
      }
    }
    
    return results
  },

  addParticipant: async (tournamentId: string, participant: any): Promise<ChallongeApiParticipant> => {
    const client = createChallongeHttpClient()
    
    try {
      console.log(`Adding participant ${participant.name} to tournament ${tournamentId}`)
      
      const response = await fetch(`${client.baseURL}/tournaments/${tournamentId}/participants.json`, {
        method: 'POST',
        headers: {
          'Authorization': client.authHeader,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ participant })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`HTTP ${response.status}: ${errorText}`)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      console.log(`Successfully added participant ${participant.name}`)
      return data
    } catch (error) {
      console.error(`Failed to add participant ${participant.name}:`, error)
      throw error
    }
  },

  getParticipants: async (tournamentId: string): Promise<ChallongeApiParticipant[]> => {
    const client = createChallongeHttpClient()
    
    try {
      console.log(`Getting participants for tournament ${tournamentId}`)
      
      const response = await fetch(`${client.baseURL}/tournaments/${tournamentId}/participants.json`, {
        method: 'GET',
        headers: {
          'Authorization': client.authHeader,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`HTTP ${response.status}: ${errorText}`)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      console.log(`Successfully retrieved participants for tournament ${tournamentId}`)
      return data
    } catch (error) {
      console.error(`Failed to get participants for tournament ${tournamentId}:`, error)
      throw error
    }
  },

  // Match operations
  getMatches: async (tournamentId: string): Promise<ChallongeApiMatch[]> => {
    const client = createChallongeHttpClient()
    
    try {
      console.log(`Getting matches for tournament ${tournamentId}`)
      
      const response = await fetch(`${client.baseURL}/tournaments/${tournamentId}/matches.json`, {
        method: 'GET',
        headers: {
          'Authorization': client.authHeader,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`HTTP ${response.status}: ${errorText}`)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      console.log(`Successfully retrieved matches for tournament ${tournamentId}`)
      return data
    } catch (error) {
      console.error(`Failed to get matches for tournament ${tournamentId}:`, error)
      throw error
    }
  },

  updateMatch: async (tournamentId: string, matchId: string, matchData: any): Promise<ChallongeApiMatch> => {
    const client = createChallongeHttpClient()
    
    try {
      console.log(`Updating match ${matchId} in tournament ${tournamentId}`)
      
      const response = await fetch(`${client.baseURL}/tournaments/${tournamentId}/matches/${matchId}.json`, {
        method: 'PUT',
        headers: {
          'Authorization': client.authHeader,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ match: matchData })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`HTTP ${response.status}: ${errorText}`)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      console.log(`Successfully updated match ${matchId}`)
      return data
    } catch (error) {
      console.error(`Failed to update match ${matchId}:`, error)
      throw error
    }
  }
}

// Utility functions for common operations
export const challongeUtils = {
  // Generate unique tournament URL
  generateTournamentUrl: (raceSlug: string): string => {
    const timestamp = Date.now()
    // Replace hyphens with underscores and remove any other invalid characters
    const cleanSlug = raceSlug.replace(/\W/g, '_')
    return `brick_race_${cleanSlug}_${timestamp}`
  },

  // Prepare participants with proper seeding from racer data
  prepareParticipants: (racers: any[]): any[] => {
    return racers
      .sort((a, b) => a.best_time - b.best_time) // Best time = seed 1
      .map((racer, index) => ({
        name: `#${racer.racer_number} ${racer.name}`,
        seed: index + 1,
        misc: JSON.stringify({
          racer_id: racer.racer_id,
          best_time: racer.best_time,
          racer_number: racer.racer_number
        })
      }))
  },

  // Generate embed URL with custom styling
  generateEmbedUrl: (challongeUrl: string, options: any = {}): string => {
    const config = useRuntimeConfig()
    const baseUrl = `${config.public.challonge.embedBaseUrl}/${challongeUrl}/module`
    
    const defaultOptions = {
      multiplier: '0.9',
      match_width_multiplier: '1.2',
      show_final_results: '1',
      theme: '1'
    }
    
    const params = new URLSearchParams({ ...defaultOptions, ...options })
    return `${baseUrl}?${params.toString()}`
  }
}