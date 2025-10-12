import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('🔧 Testing trigger installation step by step...')

// Test 1: Try to create just the function (without the full SQL)
console.log('📝 Step 1: Testing function creation...')

const createFunctionSQL = `
CREATE OR REPLACE FUNCTION manage_odds_duplicates()
RETURNS TRIGGER AS $$
DECLARE
    existing_record RECORD;
BEGIN
    RAISE NOTICE 'Trigger fired for eventid: %, oddid: %, line: %', NEW.eventid, NEW.oddid, NEW.line;
    
    -- Check if a record already exists for this combination
    SELECT * INTO existing_record 
    FROM public.odds 
    WHERE eventid = NEW.eventid 
      AND oddid = NEW.oddid 
      AND (
        (line IS NULL AND NEW.line IS NULL) OR 
        (line IS NOT NULL AND NEW.line IS NOT NULL AND line = NEW.line)
      );

    -- If record exists, compare timestamps
    IF existing_record IS NOT NULL THEN
        RAISE NOTICE 'Found existing record with fetched_at: %, new fetched_at: %', existing_record.fetched_at, NEW.fetched_at;
        
        -- Keep newer records, replace older ones
        IF existing_record.fetched_at <= NEW.fetched_at THEN
            RAISE NOTICE 'New record is newer or equal - deleting existing record id: %', existing_record.id;
            DELETE FROM public.odds WHERE id = existing_record.id;
        ELSE
            RAISE NOTICE 'Existing record is newer - cancelling insert';
            RETURN NULL; 
        END IF;
    ELSE
        RAISE NOTICE 'No existing record found - allowing insert';
    END IF;

    RETURN NEW; -- Allow the insert
END;
$$ LANGUAGE plpgsql;
`

try {
  const { error: functionError } = await supabase.rpc('exec', {
    sql: createFunctionSQL,
  })

  if (functionError) {
    console.log('❌ Function creation failed:', functionError.message)
    console.log('⚠️ This confirms triggers are not installed properly')
  } else {
    console.log('✅ Function creation succeeded')
  }
} catch (err) {
  console.log('💥 Function creation exception:', err.message)
  console.log('⚠️ Supabase may not allow direct SQL execution via client')
}

// Test 2: Check what happens when we manually try to insert a duplicate
console.log('\n🧪 Step 2: Testing manual duplicate insertion...')

const testRecord = {
  eventid: 'test-trigger-' + Date.now(),
  oddid: 'test-odd-123',
  sportsbook: 'SportsGameOdds',
  marketname: 'test',
  bettypeid: 'test',
  sideid: 'test',
  line: '1.5',
  bookodds: 100,
  fetched_at: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

// Insert first record
const { data: firstInsert, error: firstError } = await supabase
  .from('odds')
  .insert(testRecord)
  .select()

if (firstError) {
  console.log('❌ First insert failed:', firstError.message)
} else {
  console.log('✅ First insert succeeded')

  // Now try to insert a newer version
  const newerRecord = {
    ...testRecord,
    bookodds: 200, // Different value
    fetched_at: new Date().toISOString(), // Now (newer)
  }

  console.log('📅 First record time:', testRecord.fetched_at)
  console.log('📅 Second record time:', newerRecord.fetched_at)

  const { data: secondInsert, error: secondError } = await supabase
    .from('odds')
    .insert(newerRecord)
    .select()

  if (secondError) {
    console.log('❌ Second insert failed:', secondError.message)
    if (secondError.code === '23505') {
      console.log(
        '🚨 TRIGGER IS NOT WORKING - Got unique constraint violation instead of trigger handling'
      )
    }
  } else {
    console.log('✅ Second insert succeeded - trigger replaced old record')

    // Check final state
    const { data: finalCheck } = await supabase
      .from('odds')
      .select('bookodds, fetched_at')
      .eq('eventid', testRecord.eventid)
      .eq('oddid', testRecord.oddid)
      .eq('line', testRecord.line)

    console.log('📊 Final records:', finalCheck?.length || 0)
    finalCheck?.forEach(record => {
      console.log(`  - bookodds: ${record.bookodds}, fetched_at: ${record.fetched_at}`)
    })
  }

  // Clean up test records
  await supabase.from('odds').delete().eq('eventid', testRecord.eventid)
  console.log('🧹 Cleaned up test records')
}

console.log('\n📋 DIAGNOSIS:')
console.log(
  'If you see "TRIGGER IS NOT WORKING" above, you need to manually run the trigger SQL in Supabase dashboard'
)
console.log('The client library cannot execute complex SQL like CREATE FUNCTION and CREATE TRIGGER')
