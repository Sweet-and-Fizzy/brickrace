#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://ehbmnhyyycvduhtfgoho.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || (() => {
    console.error('SUPABASE_SERVICE_KEY environment variable is required')
    process.exit(1)
  })()
)

const RACE_ID = '8644830f-d3a9-40e8-b3c1-55cfb8f46a54'

async function debugBrackets() {
  console.log('🔍 Debugging bracket advancement...')
  
  // Get current brackets
  const { data: brackets, error } = await supabase
    .from('brackets')
    .select('*')
    .eq('race_id', RACE_ID)
    .order('created_at')
  
  if (error) {
    console.error('Error getting brackets:', error)
    return
  }
  
  console.log(`Found ${brackets.length} brackets`)
  
  // Check each bracket
  for (let i = 0; i < brackets.length; i++) {
    const b = brackets[i]
    console.log(`\\nBracket ${i + 1}:`)
    console.log(`  ID: ${b.id}`)
    console.log(`  Group: ${b.bracket_group} Round ${b.round_number}`)
    console.log(`  Track 1: ${b.track1_racer_id} - Time: ${b.track1_time}`)
    console.log(`  Track 2: ${b.track2_racer_id} - Time: ${b.track2_time}`)
    console.log(`  Winner: ${b.winner_racer_id || 'TBD'}`)
    
    // Manually determine winner if both times exist but no winner set
    if (b.track1_time && b.track2_time && !b.winner_racer_id) {
      console.log(`  🔧 Missing winner! Should be: ${b.track1_time < b.track2_time ? 'Track 1' : 'Track 2'}`)
      
      const winnerRacerId = b.track1_time < b.track2_time ? b.track1_racer_id : b.track2_racer_id
      const winnerTrack = b.track1_time < b.track2_time ? 1 : 2
      
      console.log(`  🔧 Updating winner to: ${winnerRacerId} (track ${winnerTrack})`)
      
      const { error: updateError } = await supabase
        .from('brackets')
        .update({
          winner_racer_id: winnerRacerId,
          winner_track: winnerTrack
        })
        .eq('id', b.id)
      
      if (updateError) {
        console.log(`  ❌ Failed to update: ${updateError.message}`)
      } else {
        console.log(`  ✅ Winner updated!`)
        brackets[i].winner_racer_id = winnerRacerId
        brackets[i].winner_track = winnerTrack
      }
    }
  }
  
  // Check if we should generate next round
  const winnerBrackets = brackets.filter(b => b.bracket_group === 'winner')
  const round1Winners = winnerBrackets.filter(b => b.round_number === 1)
  const completedRound1 = round1Winners.filter(b => b.winner_racer_id)
  
  console.log(`\\n=== ROUND 1 ANALYSIS ===`)
  console.log(`Winner bracket round 1: ${completedRound1.length}/${round1Winners.length} complete`)
  
  if (completedRound1.length === round1Winners.length && round1Winners.length > 0) {
    console.log('🚀 Round 1 complete! Should generate next rounds...')
    
    // Collect winners and losers
    const winners = []
    const losers = []
    
    for (const bracket of completedRound1) {
      if (bracket.winner_racer_id) {
        winners.push({
          racer_id: bracket.winner_racer_id,
          source_bracket: bracket.id
        })
        
        // Add loser (if both racers present)
        if (bracket.track1_racer_id && bracket.track2_racer_id) {
          const loserRacerId = bracket.winner_track === 1 ? bracket.track2_racer_id : bracket.track1_racer_id
          losers.push({
            racer_id: loserRacerId,
            source_bracket: bracket.id
          })
        }
      }
    }
    
    console.log(`Winners: ${winners.length}, Losers: ${losers.length}`)
    
    // Generate next round brackets
    const newBrackets = []
    
    // Winner bracket round 2
    if (winners.length >= 2) {
      for (let i = 0; i < Math.floor(winners.length / 2); i++) {
        newBrackets.push({
          race_id: RACE_ID,
          track1_racer_id: winners[i * 2].racer_id,
          track2_racer_id: winners[i * 2 + 1].racer_id,
          bracket_type: 'double_elimination',
          bracket_group: 'winner',
          round_number: 2
        })
      }
    }
    
    // Loser bracket round 1
    if (losers.length >= 2) {
      for (let i = 0; i < Math.floor(losers.length / 2); i++) {
        newBrackets.push({
          race_id: RACE_ID,
          track1_racer_id: losers[i * 2].racer_id,
          track2_racer_id: losers[i * 2 + 1].racer_id,
          bracket_type: 'double_elimination',
          bracket_group: 'loser',
          round_number: 1
        })
      }
    }
    
    console.log(`\\n🚀 Generating ${newBrackets.length} new brackets...`)
    newBrackets.forEach((b, i) => {
      console.log(`  ${i + 1}. ${b.bracket_group} Round ${b.round_number}: ${b.track1_racer_id} vs ${b.track2_racer_id}`)
    })
    
    if (newBrackets.length > 0) {
      const { error: insertError } = await supabase
        .from('brackets')
        .insert(newBrackets)
      
      if (insertError) {
        console.log(`❌ Failed to insert: ${insertError.message}`)
      } else {
        console.log(`✅ Generated ${newBrackets.length} new brackets!`)
      }
    }
  }
  
  console.log('\\n✅ Debug complete!')
}

debugBrackets().catch(console.error)