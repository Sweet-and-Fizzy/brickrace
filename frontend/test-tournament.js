#!/usr/bin/env node

/**
 * Tournament Timing Test Script
 * 
 * Simulates a timing system recording results for bracket matches
 * Adds 10-second delays so you can watch the UI update in real-time
 * 
 * Usage: node test-tournament.js
 */

import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { readFileSync } from 'fs'
import { join } from 'path'

const API_BASE_URL = 'http://localhost:3000' // Adjust if different

// Read API key from .env file
function getApiKey() {
  try {
    const envPath = join(dirname(fileURLToPath(import.meta.url)), '.env')
    const envContent = readFileSync(envPath, 'utf-8')
    
    // Parse .env file for TIMING_SYSTEM_API_KEY
    const lines = envContent.split('\n')
    for (const line of lines) {
      const trimmedLine = line.trim()
      if (trimmedLine.startsWith('TIMING_SYSTEM_API_KEY=')) {
        const key = trimmedLine.split('=')[1]?.trim()
        if (key) {
          return key
        }
      }
    }
    
    throw new Error('TIMING_SYSTEM_API_KEY not found in .env file')
  } catch (error) {
    console.error('❌ Could not read API key from .env file')
    console.error('   Make sure .env exists and contains TIMING_SYSTEM_API_KEY=your-key')
    throw error
  }
}

const API_KEY = getApiKey()

// Default race time ranges - will be customized per racer
const defaultTimeRange = { min: 2.0, max: 3.0 }

// Generate random time (realistic race times between 2-3 seconds)
function generateTime(racerName) {
  // Add some variation based on racer number for consistency
  const baseTime = 2.0 + Math.random() * 1.0 // 2.0 to 3.0 seconds
  const time = Math.round(baseTime * 100) / 100 // Round to 2 decimal places
  return time
}

// Sleep function for delays
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Fetch current race and bracket data
async function getCurrentRaceData() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/races/current`)
    if (!response.ok) {
      throw new Error(`Failed to fetch race data: ${response.status}`)
    }
    const result = await response.json()
    
    if (result.error) {
      throw new Error(result.error)
    }
    
    return result.data
  } catch (error) {
    console.error(`❌ Failed to fetch current race data: ${error.message}`)
    throw error
  }
}

// Get current heat from race data
function getCurrentHeat(raceData) {
  const currentHeat = raceData.currentHeat
  if (!currentHeat) {
    throw new Error('No current heat found - make sure brackets are generated')
  }
  
  if (!currentHeat.heat_number) {
    throw new Error('Current heat missing heat_number')
  }
  
  return currentHeat
}

// Record race times via API
async function recordTimes(heatNumber, track1Time, track2Time) {
  console.log(`\n🏁 Recording Heat ${heatNumber}:`)
  console.log(`   Track 1: ${track1Time}s`)
  console.log(`   Track 2: ${track2Time}s`)
  console.log(`   Winner: Track ${track1Time < track2Time ? '1' : '2'} (${Math.min(track1Time, track2Time)}s)`)
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/timing/record-times`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        heat_number: heatNumber,
        track1_time: track1Time,
        track2_time: track2Time,
        auto_advance: true
      })
    })
    
    if (!response.ok) {
      const error = await response.text()
      throw new Error(`API Error: ${response.status} - ${error}`)
    }
    
    const result = await response.json()
    console.log(`✅ Success: ${result.message || 'Times recorded'}`)
    
    if (result.nextBrackets) {
      console.log(`🔄 Generated ${result.nextBrackets.length} new bracket(s) for next round`)
    }
    
    if (result.tournamentComplete) {
      console.log(`🏆 TOURNAMENT COMPLETE!`)
      console.log(`   Champion: ${result.championRacer?.name} (#${result.championRacer?.racer_number})`)
    }
    
    return result
    
  } catch (error) {
    console.error(`❌ Failed to record times: ${error.message}`)
    throw error
  }
}

// Test tournament progression
async function runTournamentTest() {
  console.log('🎯 Starting Tournament Timing Test')
  console.log('📺 Watch the UI at http://localhost:3000/races/[race-slug]')
  console.log('⏱️  10-second delays between matches for UI observation\n')
  
  try {
    // Fetch current race data
    console.log('📊 Fetching current race and bracket data...')
    const raceData = await getCurrentRaceData()
    console.log(`✅ Found race: ${raceData.race.name}`)
    console.log(`📋 Race phase: ${raceData.phase}`)
    
    if (raceData.phase !== 'brackets') {
      console.log('⚠️  Race is not in brackets phase. Current matches:')
      if (raceData.currentHeat) {
        console.log(`   Heat ${raceData.currentHeat.heat_number}: Currently available`)
      } else {
        console.log('   No current heat found')
      }
      
      if (raceData.upcomingHeats?.length > 0) {
        console.log('   Upcoming heats:')
        raceData.upcomingHeats.forEach(heat => {
          console.log(`   - Heat ${heat.heat_number}`)
        })
      }
    }
    
    // Get current heat to process
    const currentHeat = getCurrentHeat(raceData)
    console.log(`\n🎯 Current heat: ${currentHeat.heat_number}`)
    
    // Display racers in current heat
    if (currentHeat.racers?.length >= 2) {
      const track1Racer = currentHeat.racers.find(r => r.track_number === 1)
      const track2Racer = currentHeat.racers.find(r => r.track_number === 2)
      
      console.log(`Track 1: ${track1Racer?.racer_name || 'Unknown'} (#${track1Racer?.racer_number || '?'})`)
      console.log(`Track 2: ${track2Racer?.racer_name || 'Unknown'} (#${track2Racer?.racer_number || '?'})`)
      
      // Generate times and record them
      const track1Time = generateTime(track1Racer?.racer_name || 'Unknown')
      const track2Time = generateTime(track2Racer?.racer_name || 'Unknown')
      
      await recordTimes(currentHeat.heat_number, track1Time, track2Time)
      
      console.log(`\n⏳ Waiting 10 seconds for UI update...`)
      await sleep(10000)
      
      // Check for next heat
      console.log('\n🔄 Checking for next heat...')
      const updatedRaceData = await getCurrentRaceData()
      
      if (updatedRaceData.currentHeat && updatedRaceData.currentHeat.heat_number !== currentHeat.heat_number) {
        console.log(`🎯 New current heat detected: ${updatedRaceData.currentHeat.heat_number}`)
        console.log('🔁 Re-run the script to continue the tournament!')
      } else {
        console.log('✅ No more heats currently available')
        if (updatedRaceData.phase === 'complete') {
          console.log('🏆 Tournament complete!')
        }
      }
      
    } else {
      console.log('⚠️  Current heat has insufficient racers for timing')
      console.log('   Make sure brackets are properly generated')
    }
    
    console.log('\n🎯 Tournament test complete!')
    console.log('Check the UI to see bracket progression and current matches')
    
  } catch (error) {
    console.error(`\n💥 Tournament test failed: ${error.message}`)
    process.exit(1)
  }
}

// Get current file path for ES module
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Run if called directly (ES module equivalent)
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    // API key is loaded from .env, just run the test
    runTournamentTest()
  } catch (error) {
    console.error(`❌ Failed to start tournament test: ${error.message}`)
    process.exit(1)
  }
}

// ES module exports
export { recordTimes, generateTime }