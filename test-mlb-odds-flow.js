const { createClient } = require('@supabase/supabase-js');

// Test MLB odds flow: API -> Database -> Retrieval
async function testMLBOddsFlow() {
  try {
    // Set up Supabase client (you'll need to add your credentials)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_KEY';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const API_KEY = process.env.NEXT_PUBLIC_ODDS_API_KEY || 'YOUR_API_KEY';
    const SPORTSGAMEODDS_API_BASE = 'https://api.sportsgameodds.com/v2';
    
    console.log('🔧 Testing complete MLB odds flow...\n');
    
    // Step 1: Fetch from SportsGameOdds API
    console.log('📡 Step 1: Fetching from SportsGameOdds API');
    const apiUrl = `${SPORTSGAMEODDS_API_BASE}/odds?apiKey=${API_KEY}&sportID=BASEBALL&leagueID=MLB`;
    console.log('API URL:', apiUrl);
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    const apiData = await response.json();
    console.log(`📊 API returned ${apiData.length} MLB games\n`);
    
    if (apiData.length === 0) {
      console.log('❌ No MLB games in API response');
      return;
    }
    
    // Pick the first game for detailed analysis
    const testGame = apiData[0];
    console.log('🎯 Testing with game:', {
      eventId: testGame.eventId,
      homeTeam: testGame.homeTeam,
      awayTeam: testGame.awayTeam,
      eventTime: testGame.eventTime,
      linesCount: testGame.lines?.length || 0
    });
    
    // Log sample of API lines data
    if (testGame.lines && testGame.lines.length > 0) {
      console.log('\n📋 Sample API lines:');
      testGame.lines.slice(0, 5).forEach((line, idx) => {
        console.log(`   ${idx + 1}. oddId: ${line.oddId}, line: ${line.line}, sportsbook: ${line.sportsbook}`);
        if (line.fanDuelOdds) console.log(`      FanDuel: ${line.fanDuelOdds}`);
        if (line.draftKingsOdds) console.log(`      DraftKings: ${line.draftKingsOdds}`);
      });
    }
    
    // Step 2: Check if game exists in games table
    console.log('\n🏈 Step 2: Checking games table');
    const { data: gameInDB, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('id', testGame.eventId)
      .single();
    
    if (gameError && gameError.code !== 'PGRST116') {
      console.error('❌ Game lookup error:', gameError);
    } else if (!gameInDB) {
      console.log('⚠️ Game not found in games table');
    } else {
      console.log('✅ Game found in games table:', {
        id: gameInDB.id,
        home_team: gameInDB.home_team,
        away_team: gameInDB.away_team,
        league: gameInDB.league
      });
    }
    
    // Step 3: Check odds table
    console.log('\n📊 Step 3: Checking odds table');
    const { data: oddsInDB, error: oddsError } = await supabase
      .from('odds')
      .select('id, eventid, oddid, line, sportsbook, fanduelodds, draftkingsodds, created_at')
      .eq('eventid', testGame.eventId)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (oddsError) {
      console.error('❌ Odds lookup error:', oddsError);
    } else {
      console.log(`📈 Found ${oddsInDB?.length || 0} odds in odds table`);
      if (oddsInDB && oddsInDB.length > 0) {
        console.log('Sample odds from database:');
        oddsInDB.slice(0, 3).forEach((odd, idx) => {
          console.log(`   ${idx + 1}. oddid: ${odd.oddid}, line: ${odd.line}, sportsbook: ${odd.sportsbook}`);
          console.log(`      FanDuel: ${odd.fanduelodds}, DraftKings: ${odd.draftkingsodds}`);
        });
      }
    }
    
    // Step 4: Check open_odds table
    console.log('\n📊 Step 4: Checking open_odds table');
    const { data: openOddsInDB, error: openOddsError } = await supabase
      .from('open_odds')
      .select('id, eventid, oddid, line, sportsbook, fanduelodds, draftkingsodds, created_at')
      .eq('eventid', testGame.eventId)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (openOddsError) {
      console.error('❌ Open odds lookup error:', openOddsError);
    } else {
      console.log(`📈 Found ${openOddsInDB?.length || 0} odds in open_odds table`);
      if (openOddsInDB && openOddsInDB.length > 0) {
        console.log('Sample open_odds from database:');
        openOddsInDB.slice(0, 3).forEach((odd, idx) => {
          console.log(`   ${idx + 1}. oddid: ${odd.oddid}, line: ${odd.line}, sportsbook: ${odd.sportsbook}`);
          console.log(`      FanDuel: ${odd.fanduelodds}, DraftKings: ${odd.draftkingsodds}`);
        });
      }
    }
    
    // Step 5: Compare data
    console.log('\n🔍 Step 5: Data Flow Analysis');
    const apiLinesCount = testGame.lines?.length || 0;
    const oddsTableCount = oddsInDB?.length || 0;
    const openOddsTableCount = openOddsInDB?.length || 0;
    
    console.log('📊 Count Comparison:');
    console.log(`   API lines: ${apiLinesCount}`);
    console.log(`   odds table: ${oddsTableCount}`);
    console.log(`   open_odds table: ${openOddsTableCount}`);
    
    if (apiLinesCount > 0 && oddsTableCount === 0) {
      console.log('❌ DATA LOSS: API has lines but odds table is empty!');
    } else if (apiLinesCount > 0 && oddsTableCount > 0) {
      console.log('✅ Data successfully stored in odds table');
      const efficiency = ((oddsTableCount / apiLinesCount) * 100).toFixed(1);
      console.log(`📈 Storage efficiency: ${efficiency}% (${oddsTableCount}/${apiLinesCount})`);
    }
    
    // Step 6: Test iOS-style query
    console.log('\n📱 Step 6: Testing iOS-style query');
    const { data: iosStyleQuery, error: iosError } = await supabase
      .from('odds')
      .select('*')
      .eq('eventid', testGame.eventId)
      .order('created_at', { ascending: false })
      .limit(3000);
    
    if (iosError) {
      console.error('❌ iOS-style query error:', iosError);
    } else {
      console.log(`📱 iOS-style query result: ${iosStyleQuery?.length || 0} records`);
      if ((iosStyleQuery?.length || 0) !== oddsTableCount) {
        console.log('⚠️ iOS query returned different count than direct count!');
      }
    }
    
  } catch (error) {
    console.error('❌ Test script error:', error);
  }
}

// Helper function to run the odds fetch API
async function runOddsFetchAPI() {
  try {
    console.log('🚀 Running odds fetch API...\n');
    
    // Call your odds fetch API endpoint
    const fetchResponse = await fetch('http://localhost:3000/api/fetch-odds-dual-table?league=MLB', {
      method: 'GET',
    });
    
    if (!fetchResponse.ok) {
      throw new Error(`Fetch API Error: ${fetchResponse.status} ${fetchResponse.statusText}`);
    }
    
    const fetchResult = await fetchResponse.json();
    console.log('📊 Fetch API result:', fetchResult);
    
    return fetchResult;
    
  } catch (error) {
    console.error('❌ Error running fetch API:', error);
    return null;
  }
}

// Main test function
async function main() {
  console.log('🎯 MLB Odds Flow Test\n');
  console.log('======================================\n');
  
  // Option 1: Run fetch API first, then test
  console.log('Option 1: Running fetch API first...');
  const fetchResult = await runOddsFetchAPI();
  
  if (fetchResult) {
    console.log('\n✅ Fetch completed, now testing data flow...\n');
    await testMLBOddsFlow();
  } else {
    console.log('\n⚠️ Fetch failed, testing existing data...\n');
    await testMLBOddsFlow();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { testMLBOddsFlow, runOddsFetchAPI };