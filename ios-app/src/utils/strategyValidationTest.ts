// Test file to validate the strategy filtering logic against provided examples
import { validateBetAgainstStrategy, validateParlayAgainstStrategy, BetData, StrategyData, FilterOptions } from './strategyValidation';

// Test strategies based on provided database examples
const testStrategies: StrategyData[] = [
  // 1. NFL Touchdown Bets - Only NFL player props
  {
    id: "be5530ff-4beb-4f4c-b46d-ef5e4b30f770",
    name: "NFL Touchdown Bets",
    sport: "NFL",
    filter_config: {
      leagues: ["NFL"],
      betTypes: ["player_prop"],
      statuses: ["All"],
      isParlays: ["All"],
      oddsTypes: ["All"],
      timeRange: "All time",
      sides: ["All"],
      sportsbooks: []
    },
    user_id: "test"
  },
  
  // 2. Sean's MLB Bets - Only MLB, all bet types
  {
    id: "13ce72e8-62cc-4e2a-b4d4-2c11bc0c6fb2", 
    name: "Sean's MLB Bets",
    sport: "MLB",
    filter_config: {
      leagues: ["MLB"],
      betTypes: ["All"],
      statuses: ["All"],
      isParlays: ["All"],
      oddsTypes: ["All"],
      timeRange: "All time",
      sides: ["All"],
      sportsbooks: []
    },
    user_id: "test"
  },
  
  // 3. TrueSharp POTD's - No filters (should accept all bets)
  {
    id: "57923af6-4d16-4f0e-b89a-4ffaca83d801",
    name: "TrueSharp POTD's", 
    sport: "All",
    filter_config: {
      leagues: ["All"],
      betTypes: ["All"], 
      statuses: ["All"],
      isParlays: ["All"],
      oddsTypes: ["All"],
      timeRange: "All time",
      sides: ["All"],
      sportsbooks: []
    },
    user_id: "test"
  },
  
  // 4. NFL Moneylines - Only NFL moneyline bets
  {
    id: "6728a8ed-1c85-4bf3-bfa9-108fd79a9ea2",
    name: "NFL Moneylines",
    sport: "NFL", 
    filter_config: {
      leagues: ["NFL"],
      betTypes: ["moneyline"],
      statuses: ["All"],
      isParlays: ["All"],
      oddsTypes: ["All"],
      timeRange: "All time",
      sides: ["All"],
      sportsbooks: []
    },
    user_id: "test"
  },

  // 5. CFP ML, Spread, and Totals - Only NCAAF 
  {
    id: "0a6a1a33-06de-4673-8673-1c0ed2fb2c90",
    name: "CFP ML, Spread, and Totals",
    sport: "NCAAF",
    filter_config: {
      leagues: ["NCAAF"],
      betTypes: ["All"],
      statuses: ["All"], 
      isParlays: ["All"],
      oddsTypes: ["All"],
      timeRange: "All time",
      sides: ["All"],
      sportsbooks: []
    },
    user_id: "test"
  },

  // 6. 2025 CFB Locks - Only NCAAF
  {
    id: "7c5d837c-1538-4c0e-adbe-0fceeea10ca6",
    name: "2025 CFB Locks",
    sport: "NCAAF",
    filter_config: {
      leagues: ["NCAAF"],
      betTypes: ["All"],
      statuses: ["All"],
      isParlays: ["All"], 
      oddsTypes: ["All"],
      timeRange: "All time",
      sides: ["All"],
      sportsbooks: []
    },
    user_id: "test"
  }
];

// Test bets representing different scenarios
const testBets: BetData[] = [
  // NFL player prop (should match NFL strategies with player_prop filter)
  {
    id: "bet1",
    sport: "NFL",
    bet_type: "player_prop",
    side: "over",
    is_parlay: false,
    sportsbook: "DraftKings", 
    odds: -110,
    stake: 100,
    line_value: 0.5,
    status: "pending",
    created_at: "2024-01-01"
  },
  
  // NFL moneyline (should match NFL strategies, not player_prop only)
  {
    id: "bet2", 
    sport: "NFL",
    bet_type: "moneyline",
    side: "home",
    is_parlay: false,
    sportsbook: "FanDuel",
    odds: 150,
    stake: 50,
    status: "pending",
    created_at: "2024-01-01"
  },
  
  // MLB bet (should only match MLB strategies)
  {
    id: "bet3",
    sport: "MLB", 
    bet_type: "spread",
    side: "away",
    is_parlay: false,
    sportsbook: "Caesars",
    odds: -105,
    stake: 75,
    line_value: -1.5,
    status: "pending", 
    created_at: "2024-01-01"
  },
  
  // NCAAF bet (should only match NCAAF strategies) 
  {
    id: "bet4",
    sport: "NCAAF",
    bet_type: "total",
    side: "under", 
    is_parlay: false,
    sportsbook: "BetMGM",
    odds: -120,
    stake: 25,
    line_value: 45.5,
    status: "pending",
    created_at: "2024-01-01"
  },
  
  // NBA bet (should only match "All" strategies)
  {
    id: "bet5",
    sport: "NBA",
    bet_type: "moneyline",
    side: "home",
    is_parlay: false, 
    sportsbook: "DraftKings",
    odds: -200,
    stake: 100,
    status: "pending",
    created_at: "2024-01-01"
  }
];

// Parlay legs for testing parlay validation
const nflParlayLegs: BetData[] = [
  {
    id: "parlay_leg1",
    sport: "NFL", 
    bet_type: "player_prop",
    side: "over",
    is_parlay: true,
    sportsbook: "DraftKings",
    odds: -110,
    stake: 50,
    line_value: 0.5,
    status: "pending",
    created_at: "2024-01-01"
  },
  {
    id: "parlay_leg2",
    sport: "NFL",
    bet_type: "moneyline", 
    side: "home",
    is_parlay: true,
    sportsbook: "DraftKings",
    odds: 150,
    stake: 50,
    status: "pending",
    created_at: "2024-01-01"
  }
];

const mixedSportParlayLegs: BetData[] = [
  {
    id: "mixed_leg1",
    sport: "NFL",
    bet_type: "moneyline",
    side: "home", 
    is_parlay: true,
    sportsbook: "DraftKings",
    odds: -110,
    stake: 50,
    status: "pending",
    created_at: "2024-01-01"
  },
  {
    id: "mixed_leg2", 
    sport: "MLB",
    bet_type: "spread",
    side: "away",
    is_parlay: true,
    sportsbook: "DraftKings",
    odds: -105,
    stake: 50, 
    line_value: -1.5,
    status: "pending",
    created_at: "2024-01-01"
  }
];

// Run tests
function runValidationTests() {
  // Test 1: NFL player prop should match NFL Touchdown Bets strategy
  const result1 = validateBetAgainstStrategy(testBets[0], testStrategies[0]);
  // Test 2: NFL moneyline should NOT match NFL Touchdown Bets (player_prop only)
  const result2 = validateBetAgainstStrategy(testBets[1], testStrategies[0]); 
  // Test 3: NFL moneyline should match NFL Moneylines strategy
  const result3 = validateBetAgainstStrategy(testBets[1], testStrategies[3]);
  // Test 4: MLB bet should match Sean's MLB Bets
  const result4 = validateBetAgainstStrategy(testBets[2], testStrategies[1]);
  // Test 5: MLB bet should NOT match NFL strategies
  const result5 = validateBetAgainstStrategy(testBets[2], testStrategies[0]);
  // Test 6: NCAAF bet should match NCAAF strategies
  const result6 = validateBetAgainstStrategy(testBets[3], testStrategies[4]);
  // Test 7: All bets should match TrueSharp POTD's (no filters)
  testBets.forEach((bet, index) => {
    const result = validateBetAgainstStrategy(bet, testStrategies[2]);
  });
  // Test 8: NBA bet should only match "All" strategies
  testStrategies.forEach((strategy, index) => {
    const result = validateBetAgainstStrategy(testBets[4], strategy);
    const expected = strategy.sport === "All"; // Only TrueSharp POTD's should match
  });
  // Test 9: NFL parlay legs should work with compatible strategies
  const parlayResult1 = validateParlayAgainstStrategy(nflParlayLegs, testStrategies[2]); // All strategy
  const parlayResult2 = validateParlayAgainstStrategy(nflParlayLegs, testStrategies[0]); // NFL player_prop only
  // Test 10: Mixed sport parlay should only work with "All" strategies  
  testStrategies.forEach((strategy, index) => {
    const result = validateParlayAgainstStrategy(mixedSportParlayLegs, strategy);
    const expected = strategy.sport === "All";
  });
}

// Export for use in app
export { runValidationTests, testStrategies, testBets };