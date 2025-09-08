/**
 * Test script for parlay profit calculations
 * Run this to validate the parlay profit calculation logic
 */

import { calculateBetProfits, type BetData } from '../src/lib/utils/parlay-profit-calculator'

// Test data for different parlay scenarios
const testCases = [
  {
    name: "Single bet - Win",
    bets: [{
      id: "single-win",
      status: "won",
      outcome: "win", 
      stake: 100,
      potential_payout: 190,
      odds: 110, // +110
      is_parlay: false
    }] as BetData[]
  },
  {
    name: "Single bet - Loss", 
    bets: [{
      id: "single-loss",
      status: "lost",
      outcome: "loss",
      stake: 100,
      potential_payout: 190,
      odds: 110,
      is_parlay: false
    }] as BetData[]
  },
  {
    name: "Parlay - All legs win (2-leg)",
    bets: [{
      id: "parlay-leg-1",
      parlay_id: "parlay-1", 
      status: "won",
      outcome: "win",
      stake: 100,
      potential_payout: 264, // Should be calculated from combined odds
      odds: -110, // 1.909 decimal
      is_parlay: true
    }, {
      id: "parlay-leg-2", 
      parlay_id: "parlay-1",
      status: "won",
      outcome: "win",
      stake: 0, // Only first leg has stake for parlays
      potential_payout: 0,
      odds: 120, // 2.2 decimal
      is_parlay: true
    }] as BetData[]
  },
  {
    name: "Parlay - One leg loses (2-leg)",
    bets: [{
      id: "parlay-lose-1",
      parlay_id: "parlay-lose",
      status: "won", 
      outcome: "win",
      stake: 100,
      potential_payout: 264,
      odds: -110,
      is_parlay: true
    }, {
      id: "parlay-lose-2",
      parlay_id: "parlay-lose", 
      status: "lost",
      outcome: "loss",
      stake: 0,
      potential_payout: 0,
      odds: 120,
      is_parlay: true
    }] as BetData[]
  },
  {
    name: "Parlay - Pending leg (2-leg)",
    bets: [{
      id: "parlay-pend-1",
      parlay_id: "parlay-pending",
      status: "won",
      outcome: "win", 
      stake: 100,
      potential_payout: 264,
      odds: -110,
      is_parlay: true
    }, {
      id: "parlay-pend-2",
      parlay_id: "parlay-pending",
      status: "pending",
      outcome: "pending",
      stake: 0,
      potential_payout: 0,
      odds: 120,
      is_parlay: true
    }] as BetData[]
  },
  {
    name: "Parlay - Voided leg (2-leg)",
    bets: [{
      id: "parlay-void-1", 
      parlay_id: "parlay-void",
      status: "won",
      outcome: "win",
      stake: 100,
      potential_payout: 264,
      odds: -110,
      is_parlay: true
    }, {
      id: "parlay-void-2",
      parlay_id: "parlay-void", 
      status: "void",
      outcome: "void",
      stake: 0,
      potential_payout: 0, 
      odds: 120,
      is_parlay: true
    }] as BetData[]
  },
  {
    name: "3-leg parlay - All win",
    bets: [{
      id: "parlay-3-1",
      parlay_id: "parlay-3leg",
      status: "won", 
      outcome: "win",
      stake: 100,
      potential_payout: 700, // Example payout
      odds: -110, // 1.909 decimal
      is_parlay: true
    }, {
      id: "parlay-3-2",
      parlay_id: "parlay-3leg",
      status: "won",
      outcome: "win", 
      stake: 0,
      potential_payout: 0,
      odds: 150, // 2.5 decimal  
      is_parlay: true
    }, {
      id: "parlay-3-3",
      parlay_id: "parlay-3leg",
      status: "won",
      outcome: "win",
      stake: 0,
      potential_payout: 0,
      odds: 200, // 3.0 decimal
      is_parlay: true
    }] as BetData[]
  }
]

function americanToDecimal(americanOdds: number): number {
  if (americanOdds > 0) {
    return (americanOdds / 100) + 1
  } else {
    return (100 / Math.abs(americanOdds)) + 1
  }
}

function runTests() {
  console.log('🧮 Testing Parlay Profit Calculations\n')
  
  for (const testCase of testCases) {
    console.log(`\n📊 Test: ${testCase.name}`)
    console.log('━'.repeat(50))
    
    // Show input data
    console.log('Input bets:')
    for (const bet of testCase.bets) {
      console.log(`  ${bet.id}: ${bet.status}/${bet.outcome} | Stake: $${bet.stake} | Odds: ${bet.odds}`)
    }
    
    // Calculate profits
    const results = calculateBetProfits(testCase.bets)
    
    // Show results
    console.log('\nCalculated profits:')
    let totalProfit = 0
    for (const bet of testCase.bets) {
      const profit = results[bet.id]
      console.log(`  ${bet.id}: $${profit ?? 'null'}`)
      if (profit !== null && profit !== undefined) totalProfit += profit
    }
    
    console.log(`\nTotal profit: $${totalProfit}`)
    
    // For parlays, show the calculation details
    if (testCase.bets.some(bet => bet.parlay_id)) {
      const parlayBets = testCase.bets.filter(bet => bet.parlay_id)
      if (parlayBets.length > 0 && parlayBets[0]) {
        console.log('\nParlay calculation details:')
        console.log(`  Stake: $${parlayBets[0].stake ?? 0}`)
        
        let combinedOdds = 1
        for (const bet of parlayBets) {
          const decimal = americanToDecimal(bet.odds)
          console.log(`  ${bet.id} decimal odds: ${decimal.toFixed(3)}`)
          combinedOdds *= decimal
        }
        console.log(`  Combined odds: ${combinedOdds.toFixed(3)}`)
        const stake = parlayBets[0].stake ?? 0
        console.log(`  Expected payout: $${(stake * combinedOdds).toFixed(2)}`)
        console.log(`  Expected profit: $${(stake * combinedOdds - stake).toFixed(2)}`)
      }
    }
  }
  
  console.log('\n✅ All tests completed!')
}

// Run the tests
runTests()