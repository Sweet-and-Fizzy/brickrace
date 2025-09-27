#!/usr/bin/env node

/* global fetch */

// Simple script to sync and regenerate brackets from Challonge
// Using built-in fetch (Node 18+)

const API_BASE = 'http://localhost:3002/api'
const TOURNAMENT_ID = '699efba4-0654-4e8d-936e-22a1f31eddcd'

async function syncChallonge() {
  try {
    console.log('=== Challonge Sync Tool ===\n')
    
    // Step 1: Check tournament status
    console.log('1. Checking tournament status...')
    const statusResponse = await fetch(`${API_BASE}/challonge/tournaments/${TOURNAMENT_ID}/status`)
    const status = await statusResponse.json()
    
    console.log(`   Tournament: ${status.tournament.challonge_url}`)
    console.log(`   Status: ${status.tournament.status}`)
    console.log(`   Participants: ${status.participants.count}`)
    console.log('')
    
    // Step 2: Sync any completed brackets to Challonge
    console.log('2. Syncing completed brackets to Challonge...')
    const syncResponse = await fetch(`${API_BASE}/challonge/tournaments/${TOURNAMENT_ID}/sync-brackets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })
    const syncResult = await syncResponse.json()
    
    if (syncResult.sync_results && syncResult.sync_results.length > 0) {
      console.log(`   Synced ${syncResult.sync_results.length} brackets:`)
      syncResult.sync_results.forEach(result => {
        console.log(`   - Bracket ${result.bracket_id.substring(0, 8)}... synced at ${result.synced_at}`)
      })
    } else {
      console.log('   No brackets to sync (no completed matches)')
    }
    console.log('')
    
    // Step 3: Check current race state
    console.log('3. Checking current race state...')
    const raceResponse = await fetch(`${API_BASE}/races/current`)
    const raceData = await raceResponse.json()
    
    if (raceData.data.currentHeat) {
      const heat = raceData.data.currentHeat
      console.log(`   Current Heat: ${heat.heat_number}`)
      console.log(`   Type: ${heat.type}`)
      console.log(`   Challonge Round: ${heat.challonge_round}`)
      console.log(`   Match ID: ${heat.challonge_match_id}`)
      console.log(`   Racers: ${heat.racers.length} assigned`)
      
      if (heat.racers.length === 0) {
        console.log('   ⚠️  WARNING: No racers assigned to current heat!')
        console.log('   This usually means brackets need to be regenerated from Challonge.')
      } else {
        heat.racers.forEach(racer => {
          console.log(`     Track ${racer.track_number}: #${racer.racer_number} ${racer.racer_name}`)
        })
      }
    } else {
      console.log('   No current heat')
    }
    console.log('')
    
    // Step 4: Summary
    console.log('=== Summary ===')
    console.log(`Tournament URL: https://challonge.com/${status.tournament.challonge_url}`)
    console.log(`Phase: ${raceData.data.phase}`)
    
    if (raceData.data.currentHeat && raceData.data.currentHeat.racers.length === 0) {
      console.log('\n⚠️  ACTION NEEDED:')
      console.log('The brackets need to be regenerated from Challonge.')
      console.log('Please use the admin interface to regenerate brackets, or')
      console.log('have an admin user call POST /api/challonge/tournaments/' + TOURNAMENT_ID + '/generate-brackets')
    }
    
  } catch (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }
}

syncChallonge()