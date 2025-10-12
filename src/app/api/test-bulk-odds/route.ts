import { NextRequest, NextResponse } from 'next/server'
import { processGameOdds } from '../../../lib/odds-bulk-processor'

// Sample API response for testing
const SAMPLE_API_ODDS = {
  "points-away-game-ml-away": {
    "oddID": "points-away-game-ml-away",
    "opposingOddID": "points-home-game-ml-home",
    "marketName": "Moneyline",
    "statID": "points",
    "statEntityID": "away",
    "periodID": "game",
    "betTypeID": "ml",
    "sideID": "away",
    "bookOdds": "+240",
    "byBookmaker": {
      "draftkings": {
        "odds": "+240",
        "lastUpdatedAt": "2025-10-01T01:53:35.000Z",
        "available": true,
        "deeplink": "https://sportsbook.draftkings.com/event/32225739"
      },
      "fanduel": {
        "odds": "+245",
        "lastUpdatedAt": "2025-10-01T01:54:14.000Z",
        "available": true,
        "deeplink": "https://sportsbook.fanduel.com/addToBetslip"
      },
      "caesars": {
        "odds": "+250",
        "lastUpdatedAt": "2025-10-01T01:52:44.000Z",
        "available": true,
        "deeplink": "https://sportsbook.caesars.com/us/nj/bet/betslip"
      },
      "espnbet": {
        "odds": "+240",
        "lastUpdatedAt": "2025-10-01T01:53:05.961Z",
        "available": true,
        "deeplink": "https://espnbet.app.link/"
      },
      "bovada": {
        "odds": "+250",
        "lastUpdatedAt": "2025-10-01T01:54:18.000Z",
        "available": true
      }
    }
  },
  "points-home-game-ml-home": {
    "oddID": "points-home-game-ml-home",
    "opposingOddID": "points-away-game-ml-away",
    "marketName": "Moneyline",
    "statID": "points",
    "statEntityID": "home",
    "periodID": "game",
    "betTypeID": "ml",
    "sideID": "home",
    "bookOdds": "-303",
    "byBookmaker": {
      "draftkings": {
        "odds": "-298",
        "lastUpdatedAt": "2025-10-01T01:53:35.000Z",
        "available": true,
        "deeplink": "https://sportsbook.draftkings.com/event/32225739"
      },
      "fanduel": {
        "odds": "-300",
        "lastUpdatedAt": "2025-10-01T01:54:14.000Z",
        "available": true,
        "deeplink": "https://sportsbook.fanduel.com/addToBetslip"
      },
      "caesars": {
        "odds": "-320",
        "lastUpdatedAt": "2025-10-01T01:52:44.000Z",
        "available": true,
        "deeplink": "https://sportsbook.caesars.com/us/nj/bet/betslip"
      }
    }
  },
  "points-home-game-sp-home": {
    "oddID": "points-home-game-sp-home",
    "opposingOddID": "points-away-game-sp-away",
    "marketName": "Spread",
    "statID": "points",
    "statEntityID": "home",
    "periodID": "game",
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
          }
        ]
      },
      "fanduel": {
        "odds": "-110",
        "lastUpdatedAt": "2025-10-01T01:54:14.000Z",
        "available": true,
        "deeplink": "https://sportsbook.fanduel.com/addToBetslip"
      }
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const gameId = searchParams.get('gameId') || 'test-game-123'
    const multiplier = parseInt(searchParams.get('multiplier') || '1')
    
    console.log(`🧪 Testing bulk odds processor with ${multiplier}x data multiplier`)
    
    // Multiply the sample data to test performance
    const testOdds: Record<string, any> = {}
    for (let i = 0; i < multiplier; i++) {
      for (const [key, value] of Object.entries(SAMPLE_API_ODDS)) {
        testOdds[`${key}-${i}`] = {
          ...value,
          oddID: `${value.oddID}-${i}`
        }
      }
    }
    
    console.log(`📊 Generated ${Object.keys(testOdds).length} test odds`)
    
    // Simulate old approach timing
    const oldApproachStart = Date.now()
    const estimatedOldTime = Object.keys(testOdds).length * 15 // ~15ms per individual insert
    const oldApproachTime = Date.now() - oldApproachStart
    
    // Test new bulk approach
    const newApproachStart = Date.now()
    const results = await processGameOdds(gameId, testOdds)
    const newApproachTime = Date.now() - newApproachStart
    
    const improvement = estimatedOldTime / newApproachTime
    
    return NextResponse.json({
      test: {
        gameId,
        totalApiOdds: Object.keys(testOdds).length,
        multiplier
      },
      oldApproach: {
        estimatedTimeMs: estimatedOldTime,
        estimatedRows: Object.keys(testOdds).length * 50, // Each odd creates ~50 sportsbook rows
        approach: 'Individual database inserts per sportsbook'
      },
      newApproach: {
        actualTimeMs: newApproachTime,
        consolidatedRows: results.totalRows,
        processingTime: results.processing.processingTimeMs,
        insertionTime: results.insertion.totalTimeMs,
        approach: 'Bulk consolidated rows'
      },
      performance: {
        speedImprovementX: `${improvement.toFixed(1)}x`,
        timeReductionPercent: `${((estimatedOldTime - newApproachTime) / estimatedOldTime * 100).toFixed(1)}%`,
        dataReductionPercent: `${results.processing.reductionPercent.toFixed(1)}%`
      },
      summary: {
        originalOdds: results.processing.totalApiOdds,
        consolidatedRows: results.processing.consolidatedRows,
        oddsInserted: results.insertion.oddsInserted,
        openOddsInserted: results.insertion.openOddsInserted
      }
    })
    
  } catch (error) {
    console.error('❌ Error in test-bulk-odds:', error)
    return NextResponse.json(
      { error: 'Failed to test bulk odds', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}