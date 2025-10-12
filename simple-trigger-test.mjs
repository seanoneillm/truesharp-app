import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('🔍 Testing if triggers are working...')

// Get the most recent odds record
const { data: recentOdds, error: fetchError } = await supabase
  .from('odds')
  .select('eventid, oddid, line, bookodds, fetched_at, sportsbook, marketname')
  .order('fetched_at', { ascending: false })
  .limit(1)

if (fetchError || !recentOdds || recentOdds.length === 0) {
  console.log('❌ No odds found to test with')
  process.exit(1)
}

const testOdd = recentOdds[0]
console.log('📊 Testing with recent odd:')
console.log('  eventid:', testOdd.eventid)
console.log('  oddid:', testOdd.oddid)
console.log('  line:', testOdd.line)
console.log('  current bookodds:', testOdd.bookodds)
console.log('  current fetched_at:', testOdd.fetched_at)

// Create a newer version with different bookodds value
const newerRecord = {
  eventid: testOdd.eventid,
  oddid: testOdd.oddid,
  sportsbook: testOdd.sportsbook,
  marketname: testOdd.marketname,
  bettypeid: 'test-trigger',
  sideid: 'test-side',
  line: testOdd.line,
  bookodds: 888, // Very different from current
  fetched_at: new Date(Date.now() + 10000).toISOString(), // 10 seconds in future
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

console.log('\n🧪 Attempting to insert newer version...')
console.log('  new bookodds:', newerRecord.bookodds)
console.log('  new fetched_at:', newerRecord.fetched_at)
console.log('  is newer?', new Date(newerRecord.fetched_at) > new Date(testOdd.fetched_at))

const { data: insertResult, error: insertError } = await supabase
  .from('odds')
  .insert(newerRecord)
  .select()

if (insertError) {
  console.log('\n❌ Insert failed:', insertError.message)
  console.log('Error code:', insertError.code)

  if (insertError.code === '23505') {
    console.log('\n🚨 PROBLEM IDENTIFIED:')
    console.log('- Got unique constraint violation instead of trigger handling')
    console.log('- This means triggers are NOT working properly')
    console.log('- The SQL script may have failed to execute or had errors')
  }
} else {
  console.log('\n✅ Insert succeeded! Checking results...')

  // Check final state
  const { data: finalState } = await supabase
    .from('odds')
    .select('bookodds, fetched_at')
    .eq('eventid', testOdd.eventid)
    .eq('oddid', testOdd.oddid)
    .eq('line', testOdd.line || null)

  console.log('📊 Records found:', finalState?.length || 0)
  if (finalState) {
    finalState.forEach((record, i) => {
      console.log(`  ${i + 1}. bookodds: ${record.bookodds}, fetched_at: ${record.fetched_at}`)
    })

    if (finalState.length === 1 && finalState[0].bookodds === 888) {
      console.log('\n🎯 SUCCESS: Trigger correctly replaced old record with new one!')
    } else if (finalState.length === 1) {
      console.log('\n⚠️ Trigger working but kept old record instead of new one')
    } else {
      console.log('\n❌ Multiple records exist - trigger not working properly')
    }
  }
}

console.log('\n📋 DIAGNOSIS COMPLETE')
