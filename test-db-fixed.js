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

    // Check total bets for specific user
    const { data: totalData, error: totalError } = await supabase
      .from('bets')
      .select('count')
      .eq('user_id', userId)

    if (totalError) {
      console.error('Error getting total bets:', totalError)
      return
    }

    console.log('Total bets for user:', totalData)

    // Check if there are ANY users with bets
    console.log('\n--- Checking if ANY users have bets ---')
    const { data: anyBets, error: anyBetsError } = await supabase
      .from('bets')
      .select('user_id, sport, league')
      .limit(20)

    if (anyBetsError) {
      console.error('Error checking any bets:', anyBetsError)
    } else {
      console.log('Sample bets from any users:', anyBets)
      if (anyBets && anyBets.length > 0) {
        console.log('✅ Database has bets! Total sample:', anyBets.length)
        const uniqueUsers = [...new Set(anyBets.map(b => b.user_id))]
        console.log('Users with bets (first 5):', uniqueUsers.slice(0, 5))

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

          // Test if any of these users match the reported user ID
          const collegeUserIds = anyCollege.map(b => b.user_id)
          if (collegeUserIds.includes(userId)) {
            console.log('🎯 Original user ID DOES have college basketball bets!')
          } else {
            console.log('🔍 Original user ID does NOT have college basketball bets')
            console.log(
              '   Consider testing with one of these users instead:',
              collegeUserIds.slice(0, 3)
            )
          }
        } else {
          console.log('❌ No college basketball bets in database at all')
        }
      } else {
        console.log('❌ No bets in database at all')
      }
    }
  } catch (err) {
    console.error('Caught error:', err)
  }
}

test()
