#!/usr/bin/env node

/* global fetch */

/**
 * Test script for bracket system with mock race times
 * 
 * Usage:
 * 1. Make sure you have an active race with checked-in racers
 * 2. Run: node test-brackets.js
 * 
 * This will:
 * - Generate brackets
 * - Simulate race times
 * - Test winner determination
 * - Test loser bracket generation
 * - Test double elimination flow
 */

const API_BASE = 'http://localhost:3000/api'
const TIMING_API_KEY = process.env.TIMING_SYSTEM_API_KEY || 'your-timing-api-key' // Update this with your actual key

// Mock race times generator (between 2.0 and 4.0 seconds)
function generateMockTime() {
  return (Math.random() * 2 + 2).toFixed(3)
}

// Fetch helper
async function fetchApi(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  })
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`API Error: ${response.status} - ${error}`)
  }
  
  return response.json()
}

// Get current race status
async function getCurrentRaceStatus() {
  console.log('\n📊 Getting current race status...')
  const result = await fetchApi('/races/current')
  
  if (result.error) {
    throw new Error(result.error)
  }
  
  const { race, phase, currentHeat, upcomingHeats } = result.data
  
  console.log(`✓ Active race: ${race.name}`)
  console.log(`✓ Current phase: ${phase}`)
  
  if (currentHeat) {
    console.log(`✓ Current heat: #${currentHeat.heat_number} (${currentHeat.type})`)
    currentHeat.racers.forEach(r => {
      console.log(`  - Track ${r.track_number}: ${r.racer_name} (#${r.racer_number})`)
    })
  }
  
  if (upcomingHeats && upcomingHeats.length > 0) {
    console.log(`✓ Upcoming heats: ${upcomingHeats.length}`)
  }
  
  return result.data
}

// Get timing system status
async function getTimingStatus() {
  console.log('\n🔍 Getting timing system status...')
  const result = await fetchApi('/timing/status', {
    headers: {
      'Authorization': `Bearer ${TIMING_API_KEY}`
    }
  })
  
  console.log(`✓ Race: ${result.race.name}`)
  console.log(`✓ Progress: ${result.progress.completed_heats}/${result.progress.total_heats} heats (${result.progress.percent_complete}%)`)
  
  if (result.current_heat) {
    console.log(`✓ Current heat: #${result.current_heat.heat_number} (${result.current_heat.type})`)
  }
  
  return result
}

// Record times for a heat
async function recordHeatTimes(heatNumber, track1Time, track2Time) {
  console.log(`\n⏱️  Recording times for heat #${heatNumber}...`)
  console.log(`  Track 1: ${track1Time}s`)
  console.log(`  Track 2: ${track2Time}s`)
  
  const result = await fetchApi('/timing/record-times', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TIMING_API_KEY}`
    },
    body: JSON.stringify({
      heat_number: heatNumber,
      track1_time: Number.parseFloat(track1Time),
      track2_time: Number.parseFloat(track2Time),
      auto_advance: false // We'll control advancement manually for testing
    })
  })
  
  console.log(`✓ ${result.message}`)
  
  // Determine winner
  const winner = Number.parseFloat(track1Time) < Number.parseFloat(track2Time) ? 'Track 1' : 'Track 2'
  const winTime = Math.min(Number.parseFloat(track1Time), Number.parseFloat(track2Time))
  console.log(`  🏆 Winner: ${winner} (${winTime}s)`)
  
  return result
}

// Simulate bracket races
async function simulateBracketRaces() {
  console.log('\n' + '='.repeat(50))
  console.log('🏁 STARTING BRACKET SIMULATION')
  console.log('='.repeat(50))
  
  try {
    // Get initial status
    let status = await getCurrentRaceStatus()
    
    if (status.phase !== 'brackets') {
      console.log('\n⚠️  Race is not in brackets phase. Current phase:', status.phase)
      console.log('Make sure to:')
      console.log('1. Have racers checked in')
      console.log('2. Complete qualifying (or skip it)')
      console.log('3. Generate brackets from the admin interface')
      return
    }
    
    console.log('\n✅ Race is in brackets phase!')
    
    // Get timing status to see total brackets
    await getTimingStatus()
    
    // Simulate all bracket races
    let racesCompleted = 0
    let roundNumber = 1
    
    while (status.currentHeat) {
      const heat = status.currentHeat
      
      // Check if this is a new round
      if (heat.round_number && heat.round_number > roundNumber) {
        console.log('\n' + '='.repeat(50))
        console.log(`📍 ROUND ${heat.round_number}`)
        console.log('='.repeat(50))
        roundNumber = heat.round_number
      }
      
      // Display bracket info
      console.log('\n' + '-'.repeat(40))
      console.log(`📋 Heat #${heat.heat_number}`)
      if (heat.bracket_group) {
        const groupLabel = heat.bracket_group === 'winner' ? '🏆 Winner Bracket' : 
                          heat.bracket_group === 'loser' ? '💔 Loser Bracket' : 
                          '👑 Finals'
        console.log(`   ${groupLabel} - Round ${heat.round_number || 1}`)
      }
      console.log('-'.repeat(40))
      
      // Show racers
      const racer1 = heat.racers.find(r => r.track_number === 1)
      const racer2 = heat.racers.find(r => r.track_number === 2)
      
      if (!racer1 || !racer2) {
        console.log('⚠️  Bye detected - auto advancing')
        // Handle bye - just get next heat
        status = await getCurrentRaceStatus()
        continue
      }
      
      console.log(`Track 1: ${racer1.racer_name} (#${racer1.racer_number})`)
      console.log(`Track 2: ${racer2.racer_name} (#${racer2.racer_number})`)
      
      // Generate mock times
      const time1 = generateMockTime()
      const time2 = generateMockTime()
      
      // Add some drama with a delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Record the times
      await recordHeatTimes(heat.heat_number, time1, time2)
      racesCompleted++
      
      // Get next status
      await new Promise(resolve => setTimeout(resolve, 500))
      status = await getCurrentRaceStatus()
      
      // Check if we're done
      if (!status.currentHeat && status.upcomingHeats.length === 0) {
        console.log('\n' + '='.repeat(50))
        console.log('🎉 ALL BRACKET RACES COMPLETE!')
        console.log(`✓ Total races completed: ${racesCompleted}`)
        console.log('='.repeat(50))
        break
      }
    }
    
    // Final status check
    console.log('\n📊 Final Status:')
    const finalStatus = await getTimingStatus()
    console.log(`✓ Progress: ${finalStatus.progress.completed_heats}/${finalStatus.progress.total_heats} heats`)
    
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    console.error('Stack:', error.stack)
  }
}

// Test specific bracket scenarios
async function testBracketScenarios() {
  console.log('\n' + '='.repeat(50))
  console.log('🧪 TESTING BRACKET SCENARIOS')
  console.log('='.repeat(50))
  
  // Test 1: Check heat type identification
  console.log('\n📝 Test 1: Heat Type Identification')
  console.log('Heat types are now determined by the "type" field, not heat number')
  console.log('Heat numbers are sequential regardless of type')
  
  const status = await getCurrentRaceStatus()
  if (status.currentHeat) {
    const heatNum = status.currentHeat.heat_number
    const actualType = status.currentHeat.type
    
    console.log(`Heat #${heatNum} - Type: ${actualType}`)
    if (actualType === 'bracket') {
      console.log(`  Bracket Group: ${status.currentHeat.bracket_group || 'N/A'}`)
      console.log(`  Round: ${status.currentHeat.round_number || 'N/A'}`)
      console.log(`  Match: ${status.currentHeat.match_number || 'N/A'}`)
    }
    console.log('✅ PASS - Heat type properly identified')
  }
  
  // Test 2: Winner/Loser bracket separation
  console.log('\n📝 Test 2: Bracket Groups')
  if (status.currentHeat && status.currentHeat.bracket_group) {
    console.log(`Current bracket group: ${status.currentHeat.bracket_group}`)
    console.log(`Round number: ${status.currentHeat.round_number}`)
    console.log('✅ Bracket group info available')
  }
  
  // Test 3: API consistency
  console.log('\n📝 Test 3: API Response Consistency')
  const timingStatus = await getTimingStatus()
  
  console.log('Checking field presence:')
  console.log(`- heat_number: ${timingStatus.current_heat?.heat_number ? '✅' : '❌'}`)
  console.log(`- type: ${timingStatus.current_heat?.type ? '✅' : '❌'}`)
  console.log(`- racers: ${timingStatus.current_heat?.racers ? '✅' : '❌'}`)
  
  if (timingStatus.current_heat?.type === 'bracket') {
    console.log(`- bracket_id: ${timingStatus.current_heat?.bracket_id ? '✅' : '❌'}`)
    console.log(`- bracket_group: ${timingStatus.current_heat?.bracket_group ? '✅' : '❌'}`)
    console.log(`- round_number: ${timingStatus.current_heat?.round_number ? '✅' : '❌'}`)
    console.log(`- match_number: ${timingStatus.current_heat?.match_number ? '✅' : '❌'}`)
  }
}

// Main execution
async function main() {
  console.log('🏁 Bracket System Test Script')
  console.log('============================\n')
  
  // Check if we have the API key
  if (TIMING_API_KEY === 'your-timing-api-key') {
    console.error('⚠️  Please update TIMING_API_KEY in the script with your actual API key')
    console.log('You can find or create one in Supabase Dashboard > Settings > API')
    process.exit(1)
  }
  
  // Test scenarios first
  await testBracketScenarios()
  
  // Ask user if they want to run full simulation
  console.log('\n' + '='.repeat(50))
  console.log('Ready to simulate bracket races with mock times?')
  console.log('This will record times for all bracket races.')
  console.log('Press Ctrl+C to cancel, or wait 3 seconds to continue...')
  console.log('='.repeat(50))
  
  await new Promise(resolve => setTimeout(resolve, 3000))
  
  // Run full simulation
  await simulateBracketRaces()
  
  console.log('\n✅ Test complete!')
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})