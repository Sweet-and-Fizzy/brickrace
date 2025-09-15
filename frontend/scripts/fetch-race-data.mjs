import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ehbmnhyyycvduhtfgoho.supabase.co'
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVoYm1uaHl5eWN2ZHVodGZnb2hvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NzMwOTcsImV4cCI6MjA2NDE0OTA5N30.pz7iUEKwnqTaJ-Fw9_BVcDY7aKx7t9muGgdwG3M6rhs'

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
