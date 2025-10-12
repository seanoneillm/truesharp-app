import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifySportsbookData() {
  console.log('🔍 Verifying sportsbook data mapping...')
  
  // Check odds records with sportsbook data
  const { data: oddsWithSportsbooks, error } = await supabase
    .from('odds')
    .select('eventid, oddid, marketname, fanduelodds, fanduellink, draftkingsodds, draftkingslink, bovadaodds, bovadalink, ceasarsodds, mgmodds, espnbetodds, fanaticsodds')
    .eq('eventid', 'GVksYkfC6CMnbwSrejZG')
    .not('fanduelodds', 'is', null)
    .limit(3)

  if (error) {
    console.error('❌ Error checking sportsbook data:', error)
    return
  }

  console.log(`✅ Found ${oddsWithSportsbooks.length} odds records with FanDuel data`)
  
  if (oddsWithSportsbooks.length > 0) {
    console.log('\\n📋 Sample records with sportsbook data:')
    oddsWithSportsbooks.forEach((record, index) => {
      console.log(`\\nRecord ${index + 1}:`)
      console.log(`  Market: ${record.marketname}`)
      console.log(`  OddID: ${record.oddid}`)
      console.log(`  FanDuel: ${record.fanduelodds} (Link: ${record.fanduellink ? 'Yes' : 'No'})`)
      console.log(`  DraftKings: ${record.draftkingsodds || 'N/A'}`)
      console.log(`  Bovada: ${record.bovadaodds || 'N/A'}`)
      console.log(`  Caesars: ${record.ceasarsodds || 'N/A'}`)
      console.log(`  MGM: ${record.mgmodds || 'N/A'}`)
      console.log(`  ESPN Bet: ${record.espnbetodds || 'N/A'}`)
      console.log(`  Fanatics: ${record.fanaticsodds || 'N/A'}`)
    })
  }

  // Check open_odds table for same data
  const { data: openOddsWithSportsbooks, error: openError } = await supabase
    .from('open_odds')
    .select('eventid, oddid, marketname, fanduelodds, draftkingsodds, bovadaodds')
    .eq('eventid', 'GVksYkfC6CMnbwSrejZG')
    .not('fanduelodds', 'is', null)
    .limit(3)

  if (openError) {
    console.error('❌ Error checking open odds sportsbook data:', openError)
    return
  }

  console.log(`\\n✅ Found ${openOddsWithSportsbooks.length} open odds records with FanDuel data`)
  
  if (openOddsWithSportsbooks.length > 0) {
    console.log('\\n📊 Sample open odds records:')
    openOddsWithSportsbooks.forEach((record, index) => {
      console.log(`  ${index + 1}. ${record.marketname} - FanDuel: ${record.fanduelodds}, DraftKings: ${record.draftkingsodds || 'N/A'}, Bovada: ${record.bovadaodds || 'N/A'}`)
    })
  }

  // Count records by sportsbook
  console.log('\\n📈 Sportsbook coverage analysis:')
  
  const sportsbooks = [
    'fanduelodds', 'draftkingsodds', 'ceasarsodds', 'mgmodds', 'espnbetodds', 
    'fanaticsodds', 'bovadaodds', 'unibetodds', 'pointsbetodds', 'williamhillodds',
    'ballybetodds', 'barstoolodds', 'betonlineodds', 'betparxodds', 'betriversodds',
    'betusodds', 'betfairexchangeodds', 'betfairsportsbookodds', 'betfredodds',
    'fliffodds', 'fourwindsodds', 'hardrockbetodds', 'lowvigodds', 'marathonbetodds',
    'primesportsodds', 'prophetexchangeodds', 'skybetodds', 'sleeperodds',
    'stakeodds', 'underdogodds', 'wynnbetodds', 'thescorebetodds', 'bet365odds',
    'circaodds', 'pinnacleodds', 'prizepicksodds'
  ]
  
  for (const book of sportsbooks) {
    const { count, error: countError } = await supabase
      .from('odds')
      .select('*', { count: 'exact', head: true })
      .eq('eventid', 'GVksYkfC6CMnbwSrejZG')
      .not(book, 'is', null)

    if (!countError) {
      console.log(`  ${book.replace('odds', '').toUpperCase()}: ${count} records`)
    }
  }

  console.log('\\n🎉 Verification completed!')
}

verifySportsbookData().catch(console.error)