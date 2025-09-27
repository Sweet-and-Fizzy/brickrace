#!/usr/bin/env node

/**
 * Setup script for bracket testing
 * 
 * This script helps prepare the test environment by:
 * 1. Creating test racers if needed
 * 2. Checking them in
 * 3. Creating qualifying times for seeding
 * 4. Ready for bracket generation
 */

const { createClient } = require('@supabase/supabase-js')

// Configuration - update these with your Supabase credentials
const SUPABASE_URL = 'your-supabase-url'
const SUPABASE_ANON_KEY = 'your-supabase-anon-key'

// Test racer data
const TEST_RACERS = [
  { name: 'Lightning McQueen', racer_number: 95, team_members: 'Pixar Racing' },
  { name: 'Speed Racer', racer_number: 5, team_members: 'Mach 5 Team' },
  { name: 'Turbo', racer_number: 1, team_members: 'Snail Power' },
  { name: 'Cruz Ramirez', racer_number: 51, team_members: 'Next Gen Racing' },
  { name: 'Jackson Storm', racer_number: 20, team_members: 'Storm Tech' },
  { name: 'Doc Hudson', racer_number: 51, team_members: 'Fabulous Hudson Hornet' },
  { name: 'King', racer_number: 43, team_members: 'Dinoco Racing' },
  { name: 'Chick Hicks', racer_number: 86, team_members: 'Hostile Takeover Bank' }
]

async function main() {
  console.log('🏁 Bracket Test Setup Script')
  console.log('============================\n')
  
  // Check configuration
  if (SUPABASE_URL === 'your-supabase-url' || SUPABASE_ANON_KEY === 'your-supabase-anon-key') {
    console.error('⚠️  Please update SUPABASE_URL and SUPABASE_ANON_KEY in the script')
    console.log('You can find these in your Supabase project settings')
    process.exit(1)
  }
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  
  try {
    // 1. Get or create active race
    console.log('📍 Step 1: Getting active race...')
    let { data: activeRace, error: raceError } = await supabase
      .from('races')
      .select('*')
      .eq('active', true)
      .single()
    
    if (raceError || !activeRace) {
      console.log('No active race found. Creating test race...')
      
      const { data: newRace, error: createError } = await supabase
        .from('races')
        .insert({
          name: 'Test Bracket Race',
          race_datetime: new Date().toISOString(),
          location: 'Test Track',
          description: 'Generated for bracket testing',
          active: true
        })
        .select()
        .single()
      
      if (createError) throw createError
      activeRace = newRace
    }
    
    console.log(`✓ Active race: ${activeRace.name} (ID: ${activeRace.id})`)
    
    // 2. Create test racers
    console.log('\n📍 Step 2: Creating test racers...')
    const createdRacers = []
    
    for (const racerData of TEST_RACERS) {
      // Check if racer already exists
      const { data: existing } = await supabase
        .from('racers')
        .select('id')
        .eq('racer_number', racerData.racer_number)
        .single()
      
      if (existing) {
        console.log(`  - Racer #${racerData.racer_number} already exists`)
        createdRacers.push({ id: existing.id, ...racerData })
        continue
      }
      
      const { data: newRacer, error: racerError } = await supabase
        .from('racers')
        .insert({
          ...racerData,
          user_id: '00000000-0000-0000-0000-000000000000' // Dummy user ID for testing
        })
        .select()
        .single()
      
      if (racerError) {
        console.log(`  ⚠️  Failed to create racer #${racerData.racer_number}: ${racerError.message}`)
        continue
      }
      
      console.log(`  ✓ Created racer: ${newRacer.name} (#${newRacer.racer_number})`)
      createdRacers.push(newRacer)
    }
    
    console.log(`✓ Total racers available: ${createdRacers.length}`)
    
    // 3. Check in racers
    console.log('\n📍 Step 3: Checking in racers...')
    let checkedInCount = 0
    
    for (const racer of createdRacers) {
      // Check if already checked in
      const { data: existing } = await supabase
        .from('checkins')
        .select('id')
        .eq('race_id', activeRace.id)
        .eq('racer_id', racer.id)
        .single()
      
      if (existing) {
        checkedInCount++
        continue
      }
      
      const { error: checkinError } = await supabase
        .from('checkins')
        .insert({
          race_id: activeRace.id,
          racer_id: racer.id,
          time: new Date().toISOString()
        })
      
      if (!checkinError) {
        console.log(`  ✓ Checked in: ${racer.name}`)
        checkedInCount++
      }
    }
    
    console.log(`✓ Total checked in: ${checkedInCount}`)
    
    // 4. Create qualifying times for seeding
    console.log('\n📍 Step 4: Creating qualifying times...')
    
    for (const racer of createdRacers) {
      // Check if qualifier already exists
      const { data: existing } = await supabase
        .from('qualifiers')
        .select('id')
        .eq('race_id', activeRace.id)
        .eq('racer_id', racer.id)
        .single()
      
      if (existing) continue
      
      // Generate a qualifying time (2.0 to 4.0 seconds)
      const qualifyingTime = (Math.random() * 2 + 2).toFixed(3)
      
      const { error: qualError } = await supabase
        .from('qualifiers')
        .insert({
          race_id: activeRace.id,
          racer_id: racer.id,
          time: Number.parseFloat(qualifyingTime),
          notes: 'Generated for bracket testing',
          status: 'completed'
        })
      
      if (!qualError) {
        console.log(`  ✓ ${racer.name}: ${qualifyingTime}s`)
      }
    }
    
    console.log('✓ Qualifying times created')
    
    // 5. Summary
    console.log('\n' + '='.repeat(50))
    console.log('🎉 SETUP COMPLETE!')
    console.log('='.repeat(50))
    console.log(`✓ Active race: ${activeRace.name}`)
    console.log(`✓ Racers created: ${createdRacers.length}`)
    console.log(`✓ Racers checked in: ${checkedInCount}`)
    console.log('✓ Qualifying times generated')
    console.log('')
    console.log('Next steps:')
    console.log('1. Go to the brackets admin page')
    console.log('2. Generate double elimination brackets')
    console.log('3. Run: node test-brackets.js')
    console.log('')
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message)
    process.exit(1)
  }
}

main()