import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { resolve } from 'node:path'
import { readFileSync } from 'node:fs'

// Load environment variables
const envPath = resolve(process.cwd(), '.env')
const envFile = readFileSync(envPath, 'utf-8')
const envVars = {}
envFile.split('\n').forEach((line) => {
  if (line && !line.startsWith('#')) {
    const [key, value] = line.split('=')
    if (key && value) {
      envVars[key.trim()] = value.trim()
    }
  }
})

const supabaseUrl = envVars.SUPABASE_URL
const supabaseKey = envVars.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function fetchRaceData() {
  try {
    // Get active race
    const { data: activeRaceData, error: activeError } = await supabase
      .from('races')
      .select('*')
      .eq('is_active', true)
      .single()

    if (activeError && activeError.code !== 'PGRST116') {
      console.error('Error fetching active race:', activeError)
    } else if (activeRaceData) {
      console.log('\n=== ACTIVE RACE ===')
      console.log(JSON.stringify(activeRaceData, null, 2))
    } else {
      console.log('\n=== NO ACTIVE RACE ===')
    }

    // Get all races to see what's available
    const { data: allRaces, error: allError } = await supabase
      .from('races')
      .select('*')
      .order('race_datetime', { ascending: false })
      .limit(5)

    if (allError) {
      console.error('Error fetching all races:', allError)
    } else {
      console.log('\n=== RECENT RACES ===')
      console.log(JSON.stringify(allRaces, null, 2))
    }
  } catch (error) {
    console.error('Error:', error)
  }

  process.exit(0)
}

fetchRaceData()
