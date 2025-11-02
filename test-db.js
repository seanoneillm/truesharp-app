// Simple test
console.log('Testing database connection...')

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://trsogafrxpptszxydycn.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyc29nYWZyeHBwdHN6eHlkeWNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MjQ0OTQsImV4cCI6MjA2NjMwMDQ5NH0.STgM-_-9tTwI-Tr-gajQnfsA9cEZplw7W5uPWmn-SwA'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const userId = '28991397-dae7-42e8-a822-0dffc6ff49b7' // Original user ID from user report

async function test() {
  try {
    console.log('Connecting to Supabase...')

    // Check how many bets have NCAAMB in league column (across all users)
    console.log('--- Checking for NCAAMB in league column ---')
    const { data: ncaambCount, error: countError } = await supabase
      .from('bets')
      .select('count')
      .eq('league', 'NCAAMB')

    if (countError) {
      console.error('Error counting NCAAMB bets:', countError)
    } else {
      console.log('Total bets with league = "NCAAMB":', ncaambCount)
    }

    // Also check case variations
    const { data: ncaambLower, error: lowerError } = await supabase
      .from('bets')
      .select('count')
      .eq('league', 'ncaamb')

    if (!lowerError) {
      console.log('Total bets with league = "ncaamb":', ncaambLower)
    }

    // Check ilike for any variation
    const { data: ncaambAny, error: anyError } = await supabase
      .from('bets')
      .select('count')
      .ilike('league', '%ncaamb%')

    if (!anyError) {
      console.log('Total bets with league containing "ncaamb":', ncaambAny)
    }

    // Get sample NCAAMB bets to see the data
    const { data: sampleNcaamb, error: sampleError } = await supabase
      .from('bets')
      .select('id, user_id, sport, league, bet_type, created_at')
      .eq('league', 'NCAAMB')
      .limit(10)

    if (!sampleError && sampleNcaamb) {
      console.log('Sample NCAAMB bets:', sampleNcaamb)
    }

    // Check total bets for the specific user
    const { data: totalData, error: totalError } = await supabase
      .from('bets')
      .select('count')
      .eq('user_id', userId)

    if (totalError) {
      console.error('Error getting total bets for user:', totalError)
      return
    }

    console.log('Total bets for user', userId, ':', totalData)

    // Check specific bets with sport/league info
    const { data: betsData, error: betsError } = await supabase
      .from('bets')
      .select('id, sport, league, bet_type, status')
      .eq('user_id', userId)
      .limit(20)

    if (betsError) {
      console.error('Error getting bet details:', betsError)
      return
    }

    console.log('Sample bets:', betsData)

    // Check for college basketball specifically
    const { data: collegeData, error: collegeError } = await supabase
      .from('bets')
      .select('id, sport, league, bet_type')
      .eq('user_id', userId)
      .or(
        'sport.ilike.%ncaa%,league.ilike.%ncaa%,sport.ilike.%college%,league.ilike.%college%,sport.ilike.%ncaab%,league.ilike.%ncaab%,sport.ilike.%ncaam%,league.ilike.%ncaam%,sport.ilike.%ncaamb%,league.ilike.%ncaamb%'
      )
      .limit(10)

    if (collegeError) {
      console.error('Error getting college basketball bets:', collegeError)
    } else {
      console.log('College basketball bets:', collegeData)
      if (collegeData && collegeData.length > 0) {
        console.log('✅ Found', collegeData.length, 'college basketball bets!')
        collegeData.forEach(bet => {
          console.log(`  Bet ${bet.id}: sport="${bet.sport}", league="${bet.league}"`)
        })
      } else {
        console.log('❌ No college basketball bets found for this user')
      }

      // Check if there are ANY users with bets
      console.log('\n--- Checking if ANY users have bets ---')
      const { data: anyBets, error: anyBetsError } = await supabase
        .from('bets')
        .select('user_id, sport, league')
        .limit(10)

      if (anyBetsError) {
        console.error('Error checking any bets:', anyBetsError)
      } else {
        console.log('Sample bets from any users:', anyBets)
        if (anyBets && anyBets.length > 0) {
          console.log('✅ Database has bets! Total sample:', anyBets.length)
          const uniqueUsers = [...new Set(anyBets.map(b => b.user_id))]
          console.log('Users with bets:', uniqueUsers.slice(0, 5))

          // Check college basketball from any users
          const { data: anyCollege, error: anyCollegeError } = await supabase
            .from('bets')
            .select('user_id, sport, league')
            .or(
              'sport.ilike.%ncaa%,league.ilike.%ncaa%,sport.ilike.%college%,league.ilike.%college%,sport.ilike.%ncaab%,league.ilike.%ncaab%,sport.ilike.%ncaam%,league.ilike.%ncaam%,sport.ilike.%ncaamb%,league.ilike.%ncaamb%'
            )
            .limit(10)

          if (anyCollege && anyCollege.length > 0) {
            console.log('✅ Found college basketball bets from users:', anyCollege)
          } else {
            console.log('❌ No college basketball bets in database at all')
          }
        } else {
          console.log('❌ No bets in database at all')
        }
      }
    }
  } catch (err) {
    console.error('Caught error:', err)
  }
}

test()
