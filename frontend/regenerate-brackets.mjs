#!/usr/bin/env node

// Simple script to regenerate brackets from Challonge
import { createClient } from '@supabase/supabase-js'
import { generateBracketsFromChallonge } from './server/utils/bracket-generator.ts'

// Environment variables should be available from runtime

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function regenerateBrackets() {
  try {
    console.log('Finding active tournament...')
    
    // Get active race
    const { data: activeRace, error: raceError } = await supabase
      .from('races')
      .select('id')
      .eq('active', true)
      .single()

    if (raceError || !activeRace) {
      throw new Error('No active race found')
    }

    // Get tournament for this race
    const { data: tournament, error: tournamentError } = await supabase
      .from('challonge_tournaments')
      .select('id, race_id, challonge_tournament_id')
      .eq('race_id', activeRace.id)
      .eq('status', 'active')
      .single()

    if (tournamentError || !tournament) {
      throw new Error('No active tournament found for race')
    }

    console.log(`Found tournament: ${tournament.challonge_tournament_id}`)
    console.log('Regenerating brackets from Challonge...')
    
    const result = await generateBracketsFromChallonge(
      supabase,
      tournament.race_id,
      tournament.id
    )

    console.log('Brackets regenerated successfully!')
    console.log(`Generated ${result.bracketsGenerated} brackets`)
    console.log('Tournament structure:', result.tournamentStructure)
    
  } catch (error) {
    console.error('Error regenerating brackets:', error)
    process.exit(1)
  }
}

regenerateBrackets()