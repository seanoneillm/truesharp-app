// Quick test of database connection
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://trsogafrxpptszxydycn.supabase.co'
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyc29nYWZyeHBwdHN6eHlkeWNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MjQ0OTQsImV4cCI6MjA2NjMwMDQ5NH0.STgM-_-9tTwI-Tr-gajQnfsA9cEZplw7W5uPWmn-SwA'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    console.log('🔍 Testing Supabase connection...')

    // Test 1: Check connection with a simple query
    const { data, error } = await supabase.from('games').select('count').limit(1)

    if (error) {
      console.error('❌ Connection test failed:', error)
      return
    }

    console.log('✅ Connection successful!')

    // Test 2: Get MLB games count
    const {
      data: mlbGames,
      error: mlbError,
      count,
    } = await supabase.from('games').select('*', { count: 'exact' }).eq('league', 'MLB').limit(5)

    if (mlbError) {
      console.error('❌ MLB games query failed:', mlbError)
      return
    }

    console.log(`📊 Found ${count} total MLB games in database`)

    if (mlbGames && mlbGames.length > 0) {
      console.log('📋 Recent MLB games:')
      mlbGames.forEach((game, index) => {
        console.log(
          `  ${index + 1}. ${game.away_team} @ ${game.home_team} (${game.game_time.split('T')[0]}) - ID: ${game.id}`
        )
      })

      // Test 3: Check odds for one game
      const testGameId = mlbGames[0].id
      console.log(`\n🎯 Checking odds for game: ${testGameId}`)

      const { data: odds, error: oddsError } = await supabase
        .from('odds')
        .select('id, oddid, sportsbook, bookodds, marketname')
        .eq('eventid', testGameId)
        .limit(10)

      if (oddsError) {
        console.error('❌ Odds query failed:', oddsError)
        return
      }

      console.log(`📈 Found ${odds?.length || 0} odds entries for this game`)
      if (odds && odds.length > 0) {
        console.log('🎲 Sample odds:')
        odds.forEach((odd, index) => {
          console.log(
            `  ${index + 1}. ${odd.oddid} | ${odd.sportsbook} | ${odd.bookodds} | ${odd.marketname}`
          )
        })
      } else {
        console.log('⚠️ No odds found for this game')
      }
    } else {
      console.log('⚠️ No MLB games found in database')
    }
  } catch (error) {
    console.error('❌ Test failed with exception:', error)
  }
}

testConnection()
