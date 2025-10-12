import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkConstraints() {
  console.log('🔍 Checking existing odds data...')
  
  // Check a specific game that was causing issues
  const { data: existingOdds, error } = await supabase
    .from('odds')
    .select('eventid, oddid, created_at')
    .eq('eventid', 'GVksYkfC6CMnbwSrejZG')
    .limit(5)

  if (error) {
    console.error('❌ Error checking odds:', error)
  } else {
    console.log(`✅ Found ${existingOdds.length} existing odds records`)
    if (existingOdds.length > 0) {
      console.log('Sample existing record:', existingOdds[0])
    }
  }

  // Check open_odds table
  const { data: openOdds, error: openError } = await supabase
    .from('open_odds')
    .select('eventid, oddid, created_at')
    .eq('eventid', 'GVksYkfC6CMnbwSrejZG')
    .limit(5)

  if (openError) {
    console.error('❌ Error checking open odds:', openError)
  } else {
    console.log(`✅ Found ${openOdds.length} open odds records`)
    if (openOdds.length > 0) {
      console.log('Sample open odds record:', openOdds[0])
    }
  }
}

checkConstraints().catch(console.error)