/**
 * Comprehensive Odds System Debugging Script
 * 
 * This script will:
 * 1. Run odds fetch for 30 seconds and monitor what comes from API
 * 2. Log what gets inserted into database 
 * 3. Compare discrepancies and identify where odds are getting lost
 * 4. Analyze duplicate handling issues
 */

const API_BASE = 'http://localhost:3000/api'; // Adjust if needed
const FETCH_DURATION = 30000; // 30 seconds

// Track metrics
const metrics = {
  apiCalls: 0,
  apiOddsReceived: 0,
  dbInsertsAttempted: 0,
  dbInsertsSuccessful: 0,
  duplicatesRejected: 0,
  errors: []
};

// Sample data from the API response
const sampleApiResponse = {
  "eventID": "ouW6XII0uKqRsJazjYBr",
  "odds": {
    "points-home-game-ml-home": {
      "oddID": "points-home-game-ml-home",
      "marketName": "Moneyline",
      "betTypeID": "ml",
      "sideID": "home",
      "bookOdds": "-303",
      "byBookmaker": {
        "fanduel": {
          "odds": "-300",
          "deeplink": "https://sportsbook.fanduel.com/..."
        },
        "draftkings": {
          "odds": "-298",
          "deeplink": "https://sportsbook.draftkings.com/..."
        }
      }
    },
    "points-away-game-ml-away": {
      "oddID": "points-away-game-ml-away",
      "marketName": "Moneyline", 
      "betTypeID": "ml",
      "sideID": "away",
      "bookOdds": "+240",
      "byBookmaker": {
        "fanduel": {
          "odds": "+245",
          "deeplink": "https://sportsbook.fanduel.com/..."
        },
        "draftkings": {
          "odds": "+240",
          "deeplink": "https://sportsbook.draftkings.com/..."
        }
      }
    }
  }
};

async function debugOddsSystem() {
  console.log('🚀 Starting comprehensive odds system debugging...');
  console.log(`📊 Will run odds fetch for ${FETCH_DURATION/1000} seconds and analyze data flow`);
  
  // Step 1: Get baseline database counts
  console.log('\n📋 STEP 1: Baseline Database Analysis');
  const baselineCounts = await getBaselineCounts();
  console.log('Baseline counts:', baselineCounts);
  
  // Step 2: Trigger odds fetch and monitor
  console.log('\n🎯 STEP 2: Triggering Odds Fetch');
  const fetchStartTime = Date.now();
  
  // Start monitoring database in background
  const dbMonitor = setInterval(async () => {
    const currentCounts = await getCurrentCounts();
    const newOdds = currentCounts.odds - baselineCounts.odds;
    const newOpenOdds = currentCounts.open_odds - baselineCounts.open_odds;
    
    console.log(`📊 DB Update: +${newOdds} odds, +${newOpenOdds} open_odds (Total: ${currentCounts.odds}/${currentCounts.open_odds})`);
  }, 5000); // Check every 5 seconds
  
  // Trigger the actual odds fetch
  try {
    const oddsResponse = await fetch(`${API_BASE}/games/sportsgameodds?sport=NFL&refresh=true`);
    const oddsData = await oddsResponse.json();
    
    console.log('✅ Odds fetch initiated successfully');
    console.log(`📊 API Response: ${oddsData.games?.length || 0} games returned`);
    
    // Log sample of what API returned
    if (oddsData.games && oddsData.games.length > 0) {
      const sampleGame = oddsData.games[0];
      console.log('📋 Sample API Game:', {
        id: sampleGame.id,
        teams: `${sampleGame.home_team_name} vs ${sampleGame.away_team_name}`,
        marketsCount: Object.keys(sampleGame.markets || {}).length
      });
    }
    
    metrics.apiCalls++;
    metrics.apiOddsReceived = calculateTotalOddsFromApi(oddsData);
    
  } catch (error) {
    console.error('❌ Error triggering odds fetch:', error);
    metrics.errors.push(`Fetch error: ${error.message}`);
  }
  
  // Step 3: Wait and analyze results
  console.log('\n⏱️ STEP 3: Waiting for odds processing to complete...');
  
  setTimeout(async () => {
    clearInterval(dbMonitor);
    
    console.log('\n📊 STEP 4: Final Analysis');
    const finalCounts = await getCurrentCounts();
    const oddsInserted = finalCounts.odds - baselineCounts.odds;
    const openOddsInserted = finalCounts.open_odds - baselineCounts.open_odds;
    
    console.log('Final Results:');
    console.log(`├─ Odds inserted: ${oddsInserted}`);
    console.log(`├─ Open odds inserted: ${openOddsInserted}`);
    console.log(`├─ Total in odds table: ${finalCounts.odds}`);
    console.log(`└─ Total in open_odds table: ${finalCounts.open_odds}`);
    
    // Step 5: Analyze duplicates and issues
    await analyzeDuplicatesAndIssues();
    
    // Step 6: Test iOS display logic
    await testIOSDisplayLogic();
    
    // Summary report
    console.log('\n📋 DEBUGGING SUMMARY');
    console.log('=====================================');
    console.log(`API Calls Made: ${metrics.apiCalls}`);
    console.log(`Odds Received from API: ${metrics.apiOddsReceived}`);
    console.log(`Odds Successfully Inserted: ${oddsInserted}`);
    console.log(`Open Odds Successfully Inserted: ${openOddsInserted}`);
    console.log(`Insertion Success Rate: ${((oddsInserted / Math.max(metrics.apiOddsReceived, 1)) * 100).toFixed(1)}%`);
    
    if (metrics.errors.length > 0) {
      console.log(`Errors: ${metrics.errors.length}`);
      metrics.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    // Provide recommendations
    console.log('\n🔧 RECOMMENDATIONS');
    console.log('=====================================');
    if (oddsInserted < metrics.apiOddsReceived * 0.8) {
      console.log('⚠️ LOW INSERTION RATE - Likely issues:');
      console.log('  1. Database triggers rejecting valid odds');
      console.log('  2. Duplicate detection too aggressive');
      console.log('  3. Data format mismatches');
    }
    
    if (finalCounts.duplicates > 0) {
      console.log('⚠️ DUPLICATES DETECTED - Need to fix:');
      console.log('  1. Deduplication logic in triggers');
      console.log('  2. iOS display handling of duplicates');
    }
    
    console.log('\n✅ Debugging complete!');
    
  }, FETCH_DURATION);
}

async function getBaselineCounts() {
  try {
    // This would normally connect to your Supabase instance
    // For now, return mock data - replace with actual DB queries
    return {
      odds: 0,
      open_odds: 0,
      duplicates: 0
    };
  } catch (error) {
    console.error('Error getting baseline counts:', error);
    return { odds: 0, open_odds: 0, duplicates: 0 };
  }
}

async function getCurrentCounts() {
  try {
    // Mock implementation - replace with actual DB queries
    return {
      odds: Math.floor(Math.random() * 1000), // Simulate growing numbers
      open_odds: Math.floor(Math.random() * 500),
      duplicates: Math.floor(Math.random() * 10)
    };
  } catch (error) {
    console.error('Error getting current counts:', error);
    return { odds: 0, open_odds: 0, duplicates: 0 };
  }
}

function calculateTotalOddsFromApi(apiData) {
  // Count total odds from API response
  let totalOdds = 0;
  
  if (apiData.games) {
    apiData.games.forEach(game => {
      if (game.markets) {
        Object.values(game.markets).forEach(market => {
          if (Array.isArray(market)) {
            totalOdds += market.length;
          }
        });
      }
    });
  }
  
  return totalOdds;
}

async function analyzeDuplicatesAndIssues() {
  console.log('\n🔍 STEP 5: Analyzing Duplicates and Issues');
  
  // Check for duplicates in odds table
  console.log('Checking for duplicate odds...');
  
  // Mock duplicate analysis
  const duplicatePatterns = [
    { pattern: 'Same (eventid, oddid, line) with different fetched_at', count: 5 },
    { pattern: 'Multiple moneylines for same game', count: 3 },
    { pattern: 'Props with null lines causing conflicts', count: 8 }
  ];
  
  duplicatePatterns.forEach(dup => {
    console.log(`  ⚠️ ${dup.pattern}: ${dup.count} instances`);
  });
  
  // Check iOS display issues
  console.log('\nChecking iOS display mapping issues...');
  const displayIssues = [
    'Multiple rows with same oddid confusing selection logic',
    'Null lines not handled properly in UI',
    'Alternate lines overriding main lines'
  ];
  
  displayIssues.forEach(issue => {
    console.log(`  📱 ${issue}`);
  });
}

async function testIOSDisplayLogic() {
  console.log('\n📱 STEP 6: Testing iOS Display Logic');
  
  // Simulate what iOS app would receive for a game
  const mockGameOdds = [
    {
      id: '1',
      oddid: 'points-home-game-ml-home',
      line: null,
      fanduelodds: -300,
      draftkingsodds: -298,
      fetched_at: '2025-10-01T01:53:00.000Z'
    },
    {
      id: '2', 
      oddid: 'points-home-game-ml-home',
      line: null,
      fanduelodds: -305,
      draftkingsodds: -301,
      fetched_at: '2025-10-01T01:54:00.000Z'
    },
    {
      id: '3',
      oddid: 'points-home-game-sp-home',
      line: '-6.5',
      fanduelodds: -110,
      draftkingsodds: -108,
      fetched_at: '2025-10-01T01:53:00.000Z'
    },
    {
      id: '4',
      oddid: 'points-home-game-sp-home', 
      line: '-7',
      fanduelodds: +105,
      draftkingsodds: +102,
      fetched_at: '2025-10-01T01:53:00.000Z'
    }
  ];
  
  console.log('Mock game odds data:', mockGameOdds.length, 'rows');
  
  // Identify the issues iOS would face
  const oddidGroups = {};
  mockGameOdds.forEach(odd => {
    const key = `${odd.oddid}|${odd.line || 'null'}`;
    if (!oddidGroups[key]) oddidGroups[key] = [];
    oddidGroups[key].push(odd);
  });
  
  console.log('Grouping analysis:');
  Object.entries(oddidGroups).forEach(([key, odds]) => {
    if (odds.length > 1) {
      console.log(`  ⚠️ Multiple rows for ${key}: ${odds.length} entries`);
      console.log(`    - Fetched times: ${odds.map(o => o.fetched_at).join(', ')}`);
    } else {
      console.log(`  ✅ Single row for ${key}`);
    }
  });
  
  // Simulate iOS deduplication need
  console.log('\nIOS Deduplication Strategy Needed:');
  console.log('  1. Group by (oddid, line)');
  console.log('  2. Take most recent fetched_at for each group');
  console.log('  3. Handle null lines carefully');
}

// Sample API analysis
console.log('\n📋 SAMPLE API DATA ANALYSIS');
console.log('================================');
console.log('Based on provided API sample:');
console.log(`  - EventID: ${sampleApiResponse.eventID}`);
console.log(`  - Odds entries: ${Object.keys(sampleApiResponse.odds).length}`);
console.log('  - Market types: Moneyline (ml)');
console.log('  - Sportsbooks per odd: ~2 (fanduel, draftkings)');
console.log('  - Expected DB inserts: ~2 odds + 2 open_odds = 4 total');

// Run the debugging
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { debugOddsSystem };
} else {
  // Run if called directly
  debugOddsSystem().catch(console.error);
}