import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'https://ehbmnhyyycvduhtfgoho.supabase.co'
const supabaseKey = process.env.SUPABASE_ANON_KEY || (() => {
  console.error('SUPABASE_ANON_KEY environment variable is required')
  process.exit(1)
})()

const supabase = createClient(supabaseUrl, supabaseKey)

async function fetchRaceData() {
  try {
    // Get active race
    const { data: activeRaceData, error: activeError } = await supabase
      .from('races')
      .select('*')
      .eq('active', true)
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
