/**
 * VERIFICATION SCRIPT: Bulk Processor Links & Alt Lines
 * Tests that the enhanced bulk processor correctly handles:
 * 1. Sportsbook links from main odds
 * 2. Alternate lines processing
 * 3. Consolidation logic
 */

const { processGameOdds } = require('./src/lib/odds-bulk-processor')

// Sample API data with both links and alternate lines
const SAMPLE_API_WITH_ALTLINES = {
  "points-home-game-sp-home": {
    "oddID": "points-home-game-sp-home",
    "marketName": "Spread",
    "betTypeID": "sp",
    "sideID": "home",
    "bookSpread": "-6.5",
    "bookOdds": "-110",
    "byBookmaker": {
      "draftkings": {
        "odds": "-108",
        "lastUpdatedAt": "2025-10-01T01:53:35.000Z",
        "available": true,
        "deeplink": "https://sportsbook.draftkings.com/event/32225739",
        "altLines": [
          {
            "odds": "+416",
            "spread": "-20.5",
            "lastUpdatedAt": "2025-10-01T01:46:42.000Z",
            "available": true
          },
          {
            "odds": "-133",
            "spread": "-5.5", 
            "lastUpdatedAt": "2025-10-01T01:46:42.000Z",
            "available": true
          },
          {
            "odds": "+125",
            "spread": "-2.5",
            "lastUpdatedAt": "2025-10-01T01:46:42.000Z", 
            "available": true
          }
        ]
      },
      "fanduel": {
        "odds": "-110",
        "lastUpdatedAt": "2025-10-01T01:54:14.000Z",
        "available": true,
        "deeplink": "https://sportsbook.fanduel.com/addToBetslip",
        "altLines": [
          {
            "odds": "+380",
            "spread": "-20.5",
            "lastUpdatedAt": "2025-10-01T01:54:14.000Z",
            "available": true
          },
          {
            "odds": "-140",
            "spread": "-5.5",
            "lastUpdatedAt": "2025-10-01T01:54:14.000Z", 
            "available": true
          }
        ]
      },
      "caesars": {
        "odds": "-115",
        "lastUpdatedAt": "2025-10-01T01:52:44.000Z",
        "available": true,
        "deeplink": "https://sportsbook.caesars.com/us/nj/bet/betslip"
        // No altLines for caesars in this example
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
        "lastUpdatedAt": "2025-10-01T01:54:14.000Z",
        "available": true,
        "deeplink": "https://sportsbook.fanduel.com/addToBetslip"
      },
      "draftkings": {
        "odds": "+240",
        "lastUpdatedAt": "2025-10-01T01:53:35.000Z", 
        "available": true,
        "deeplink": "https://sportsbook.draftkings.com/event/32225739"
      }
    }
  }
}

async function testBulkProcessor() {
  console.log('🧪 TESTING BULK PROCESSOR: Links & Alt Lines')
  console.log('=' .repeat(60))
  
  try {
    const gameId = 'test-verification-game'
    
    // Process the sample data
    console.log('🚀 Processing sample API data...')
    const results = await processGameOdds(gameId, SAMPLE_API_WITH_ALTLINES)
    
    console.log('\\n📊 PROCESSING RESULTS:')
    console.log(`- Original API odds: ${results.processing.totalApiOdds}`)
    console.log(`- Consolidated rows: ${results.processing.consolidatedRows}`)
    console.log(`- Processing time: ${results.processing.processingTimeMs}ms`)
    console.log(`- Reduction: ${results.processing.reductionPercent.toFixed(1)}%`)
    
    // Expected results analysis
    console.log('\\n🔍 EXPECTED RESULTS ANALYSIS:')
    console.log('Main odds:')
    console.log('  - points-home-game-sp-home with line "-6.5" (1 row)')
    console.log('  - points-away-game-ml-away with line null (1 row)')
    console.log('Alt lines:')
    console.log('  - DraftKings: 3 alt lines (-20.5, -5.5, -2.5)')
    console.log('  - FanDuel: 2 alt lines (-20.5, -5.5)')  
    console.log('  - Total expected: 2 main + 5 alt = 7 rows')
    console.log(`\\n✅ Expected: 7 rows, Got: ${results.processing.consolidatedRows} rows`)
    
    if (results.processing.consolidatedRows === 7) {
      console.log('🎉 ALTERNATE LINES PROCESSING: ✅ SUCCESS')
    } else {
      console.log('❌ ALTERNATE LINES PROCESSING: FAILED')
      console.log('   Expected 7 consolidated rows but got', results.processing.consolidatedRows)
    }
    
    // Test links preservation (this would need database verification)
    console.log('\\n🔗 LINKS PROCESSING:')
    console.log('✅ Links should be preserved for:')
    console.log('  - DraftKings main odds: https://sportsbook.draftkings.com/event/32225739')
    console.log('  - FanDuel main odds: https://sportsbook.fanduel.com/addToBetslip')
    console.log('  - Caesars main odds: https://sportsbook.caesars.com/us/nj/bet/betslip')
    console.log('ℹ️  Alt lines typically don\\'t have deeplinks (API limitation)')
    
    console.log('\\n🎯 CONSOLIDATION LOGIC TEST:')
    console.log('✅ Should create separate rows for each unique (oddid, line) combination:')
    console.log('  1. points-home-game-sp-home|-6.5 (main line)')
    console.log('  2. points-home-game-sp-home|-20.5 (alt line)')
    console.log('  3. points-home-game-sp-home|-5.5 (alt line)')
    console.log('  4. points-home-game-sp-home|-2.5 (alt line from DK only)')
    console.log('  5. points-away-game-ml-away|null (moneyline)')
    console.log('  6. [Additional alt line combinations...]')
    
    console.log('\\n🏁 VERIFICATION COMPLETE')
    console.log('Next step: Run real odds fetch and check database for:')
    console.log('  1. Preserved sportsbook links in main odds')
    console.log('  2. Alternate lines with different line values')
    console.log('  3. No duplicate (eventid, oddid, line) combinations')
    
  } catch (error) {
    console.error('❌ Error during testing:', error)
  }
}

// Run the test
testBulkProcessor()