#!/usr/bin/env node

/* global fetch */

// Check what matches Challonge actually has
const API_BASE = 'http://localhost:3002/api'
const TOURNAMENT_ID = '699efba4-0654-4e8d-936e-22a1f31eddcd'

async function checkChallongeMatches() {
  try {
    console.log('=== Challonge Match Status ===\n')
    
    // Get tournament info with all matches  
    console.log('Fetching Challonge matches via our API...')
    
    // First, let me make a test API call to get Challonge data
    const response = await fetch(`${API_BASE}/challonge/tournaments/16858698/matches`, {
      method: 'GET'
    })
    
    if (!response.ok) {
      console.log('Direct match API not available, checking tournament status...')
      
      const statusResponse = await fetch(`${API_BASE}/challonge/tournaments/${TOURNAMENT_ID}/status`)
      const status = await statusResponse.json()
      
      console.log('Tournament info:')
      console.log(`  URL: https://challonge.com/${status.tournament.challonge_url}`)
      console.log(`  Status: ${status.tournament.status}`)
      console.log(`  Participants: ${status.participants.count}`)
      console.log('\nTo check Challonge match details:')
      console.log(`  Visit: https://challonge.com/${status.tournament.challonge_url}`)
      console.log('\nThe issue: Challonge has 4 completed matches but our local system shows none.')
      console.log('Solution: Need to regenerate brackets from Challonge current state.')
    }
    
  } catch (error) {
    console.error('Error:', error.message)
  }
}

checkChallongeMatches()