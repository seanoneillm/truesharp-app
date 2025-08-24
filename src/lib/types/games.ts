// ===========================================
// File 1: src/lib/types/games.ts
// ===========================================

export interface Game {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Bookmaker[];
}

export interface Bookmaker {
  key: string;
  title: string;
  last_update: string;
  markets: Market[];
}

export interface Market {
  key: string; // 'h2h' (moneyline), 'spreads', 'totals'
  last_update: string;
  outcomes: Outcome[];
}

export interface Outcome {
  name: string;
  price: number;
  point?: number; // For spreads and totals
}

export interface GameOdds {
  gameId: string;
  moneyline: {
    home: number | null;
    away: number | null;
  };
  spread: {
    home: { price: number; point: number } | null;
    away: { price: number; point: number } | null;
  };
  total: {
    over: { price: number; point: number } | null;
    under: { price: number; point: number } | null;
  };
  playerProps?: PlayerProp[];
  alternateLines?: AlternateLine[];
  gameProps?: GameProp[];
  futures?: Future[];
}

// Enhanced odds interfaces for professional sportsbook display
export interface BestOdds {
  price: number;
  sportsbook: string;
  sportsbookShort: string;
  lastUpdated: string;
}

export interface BestSpreadOdds extends BestOdds {
  point: number;
}

export interface BestTotalOdds extends BestOdds {
  point: number;
}

export interface BookmakerOdds {
  sportsbook: string;
  sportsbookShort: string;
  moneyline: { home: number | null; away: number | null };
  spread: { 
    home: { price: number; point: number } | null;
    away: { price: number; point: number } | null;
  };
  total: {
    over: { price: number; point: number } | null;
    under: { price: number; point: number } | null;
  };
  lastUpdated: string;
}

export interface EnhancedGameOdds extends GameOdds {
  bestMoneyline: {
    home: BestOdds | null;
    away: BestOdds | null;
  };
  bestSpread: {
    home: BestSpreadOdds | null;
    away: BestSpreadOdds | null;
  };
  bestTotal: {
    over: BestTotalOdds | null;
    under: BestTotalOdds | null;
  };
  allBookmakerOdds: BookmakerOdds[];
  lineMovement?: LineMovement[];
  lastUpdated: string;
}

export interface LineMovement {
  market: 'moneyline' | 'spread' | 'total';
  sportsbook: string;
  direction: 'up' | 'down';
  previousValue: number;
  currentValue: number;
  timestamp: string;
}

// Historical odds data structure for line movement charts
export interface HistoricalOddsPoint {
  timestamp: string;
  value: number;
  sportsbook: string;
}

export interface LineMovementData {
  gameId: string;
  market: 'moneyline' | 'spread' | 'total';
  team?: 'home' | 'away' | 'over' | 'under';
  dataPoints: HistoricalOddsPoint[];
  openingLine: number;
  currentLine: number;
  movement: number; // Positive = moved up, negative = moved down
  movementPercentage: number;
  isFavorable: boolean; // Whether movement favors the bettor
  sharpMoneyIndicator: boolean; // Whether movement suggests sharp money
}

export interface PlayerProp {
  id: string;
  playerName: string;
  propType: string; // 'points', 'rebounds', 'assists', 'rushing_yards', etc.
  line: number;
  overPrice: number;
  underPrice: number;
  sportsbook: string;
}

export interface AlternateLine {
  id: string;
  type: 'spread' | 'total';
  team?: string; // for spreads
  line: number;
  price: number;
  sportsbook: string;
}

export interface GameProp {
  id: string;
  propType: string; // 'first_touchdown', 'total_touchdowns', 'first_basket', etc.
  description: string;
  options: GamePropOption[];
}

export interface GamePropOption {
  name: string;
  price: number;
}

export interface Future {
  id: string;
  type: string; // 'championship', 'mvp', 'playoff_winner', etc.
  description: string;
  options: FutureOption[];
}

export interface FutureOption {
  name: string;
  price: number;
}

export interface SportData {
  key: string;
  title: string;
  games: Game[];
}

// Strategy Types
export interface Strategy {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  is_public: boolean;
  is_monetized: boolean;
  price?: number | null;
  
  // Core filters - simplified for initial implementation
  sports?: string[];
  teams?: string[];
  bet_types?: string[];
  markets?: string[];
  
  // Performance tracking
  total_bets: number;
  winning_bets: number;
  losing_bets: number;
  push_bets: number;
  total_units_wagered: number;
  total_units_won: number;
  roi_percentage: number;
  win_rate: number;
  
  created_at: string;
  updated_at: string;
}

export interface CreateStrategyRequest {
  name: string;
  description?: string | undefined;
  is_public?: boolean;
  sports?: string[] | undefined;
  teams?: string[] | undefined;
  bet_types?: string[] | undefined;
  markets?: string[] | undefined;
}

export interface UpdateStrategyRequest extends Partial<CreateStrategyRequest> {
  is_active?: boolean;
}

// Enhanced Manual Pick Data Structure with Analytics
export interface PickAnalytics {
  openingLine: number;
  currentLine: number;
  lineMovement: number; // Difference between opening and current
  lineMovementPercentage: number;
  marketEfficiencyScore: number; // 0-100 scale
  bestAvailableOdds: number;
  timingScore: number; // How good the timing was relative to line movement
  impliedProbability: number;
  expectedValue: number;
  clvScore: number; // Closing Line Value score
}

export interface BetSelection {
  gameId: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  gameTime: string;
  marketType: 'moneyline' | 'spread' | 'total' | 'prop';
  selection: string; // 'home', 'away', 'over', 'under', player name for props
  line?: number | undefined; // For spreads, totals, and props
  odds: number;
  sportsbook: string;
  description: string;
}

export interface ManualPick {
  id?: string;
  userId: string;
  strategyId?: string | undefined;
  
  // Bet Details
  betSelection: BetSelection;
  wagerAmount: number;
  unitSize: number;
  
  // Analysis and Context
  title: string;
  analysis: string;
  reasoning: string;
  confidence: number; // 1-10 scale
  tier: 'free' | 'premium' | 'vip';
  
  // Analytics Data
  analytics: PickAnalytics;
  
  // Line Movement Context
  lineMovementHistory: HistoricalOddsPoint[];
  marketContext: {
    hasLineMovedAgainst: boolean;
    movementWarning?: string;
    marketEfficiencyWarning?: string;
    timingRecommendation?: string;
  };
  
  // Status and Results
  status: 'pending' | 'active' | 'won' | 'lost' | 'push' | 'cancelled';
  result?: 'win' | 'loss' | 'push';
  actualPayout?: number;
  
  // Timestamps
  createdAt: string;
  gameStartTime: string;
  settledAt?: string;
  
  // Metadata
  tags: string[];
  isPublic: boolean;
  notes?: string;
}

export interface PickCreationModalData {
  betSelection: BetSelection;
  currentOdds: number;
  openingOdds?: number;
  lineMovement?: LineMovementData;
  marketWarnings: string[];
  recommendedUnit: number;
  expectedValue: number;
}