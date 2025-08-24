import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test inserting an odds record with a very long line value to see what breaks
async function testLongFieldInsert() {
  try {
    console.log('🧪 Testing odds insert with long fields...');
    
    // First get a valid game ID
    const { data: games, error: gameError } = await supabase
      .from('games')
      .select('id')
      .limit(1);
    
    if (gameError || !games || games.length === 0) {
      console.error('No games found to test with');
      return;
    }
    
    const validGameId = games[0].id;
    console.log('🎯 Using valid game ID:', validGameId);
    
    // Test different fields with long values to find which one has the 50-char limit
    const tests = [
      {
        name: 'long oddid',
        testOdds: {
          eventid: validGameId,
          sportsbook: 'SportsGameOdds',
          marketname: 'Test Market',
          bettypeid: 'sp',
          sideid: 'home',
          oddid: 'this-is-a-very-long-oddid-that-exceeds-fifty-characters-and-should-trigger-error-123',
          bookodds: -110,
          fetched_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        }
      },
      {
        name: 'long marketname',
        testOdds: {
          eventid: validGameId,
          sportsbook: 'SportsGameOdds',
          marketname: 'This is a very long market name that exceeds fifty characters',
          bettypeid: 'sp',
          sideid: 'home',
          oddid: 'test-odd-' + Date.now(),
          bookodds: -110,
          fetched_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        }
      },
      {
        name: 'long bettypeid',
        testOdds: {
          eventid: validGameId,
          sportsbook: 'SportsGameOdds',
          marketname: 'Test Market',
          bettypeid: 'this-is-a-very-long-bet-type-id-that-exceeds-fifty-chars',
          sideid: 'home',
          oddid: 'test-odd-' + Date.now(),
          bookodds: -110,
          fetched_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        }
      },
      {
        name: 'long sideid',
        testOdds: {
          eventid: validGameId,
          sportsbook: 'SportsGameOdds',
          marketname: 'Test Market',
          bettypeid: 'sp',
          sideid: 'this-is-a-very-long-side-id-that-exceeds-fifty-characters',
          oddid: 'test-odd-' + Date.now(),
          bookodds: -110,
          fetched_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        }
      }
    ];
    
    for (const test of tests) {
      console.log(`\n🧪 Testing ${test.name} (length: ${test.testOdds[test.name.split(' ')[1]]?.length || 'N/A'})...`);
      
      const { data, error } = await supabase
        .from('odds')
        .insert([test.testOdds])
        .select();
      
      if (error) {
        console.error('❌ Error occurred:', error);
        if (error.code === '22001') {
          console.log(`🎯 FOUND IT! The ${test.name.split(' ')[1]} field has a 50-character limit!`);
        }
      } else {
        console.log(`✅ ${test.name} insert succeeded`);
        // Clean up
        if (data && data[0]) {
          await supabase.from('odds').delete().eq('id', data[0].id);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testLongFieldInsert();
