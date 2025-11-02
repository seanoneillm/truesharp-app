// Filter configuration matching web app structure
export interface FilterConfig {
  id: string
  label: string
  type: 'single' | 'multi' | 'range' | 'date'
  isPro?: boolean
  options?: Array<{ label: string; value: string }>
  placeholder?: string
  icon?: string
}

// Time range options
export const TIME_RANGE_OPTIONS = [
  { label: 'All Time', value: 'all' },
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Last 3 Months', value: '90d' },
  { label: 'This Year', value: 'ytd' },
  { label: 'Custom Range', value: 'custom' },
]

// Bet type options matching database schema
export const BET_TYPE_OPTIONS = [
  { label: 'Spread', value: 'spread' },
  { label: 'Moneyline', value: 'moneyline' },
  { label: 'Total', value: 'total' },
  { label: 'Player Props', value: 'player_prop' },
  { label: 'Game Props', value: 'game_prop' },
  { label: 'Futures', value: 'futures' },
  { label: 'Live Betting', value: 'live' },
]

// League/sport options
export const LEAGUE_OPTIONS = [
  { label: 'NFL', value: 'NFL' },
  { label: 'NBA', value: 'NBA' },
  { label: 'MLB', value: 'MLB' },
  { label: 'NHL', value: 'NHL' },
  { label: 'NCAAF', value: 'NCAAF' },
  { label: 'NCAAM', value: 'NCAAM' },
  { label: 'UFC', value: 'UFC' },
  { label: 'Premier League', value: 'Premier League' },
  { label: 'Champions League', value: 'Champions League' },
  { label: 'MLS', value: 'MLS' },
  { label: 'Tennis', value: 'Tennis' },
  { label: 'Golf', value: 'Golf' },
]

// Status options
export const STATUS_OPTIONS = [
  { label: 'Won', value: 'won' },
  { label: 'Lost', value: 'lost' },
  { label: 'Pending', value: 'pending' },
  { label: 'Void', value: 'void' },
  { label: 'Cancelled', value: 'cancelled' },
]

// Parlay options
export const PARLAY_OPTIONS = [
  { label: 'Straight', value: 'false' },
  { label: 'Parlay', value: 'true' },
]

// Side options
export const SIDE_OPTIONS = [
  { label: 'Over', value: 'over' },
  { label: 'Under', value: 'under' },
  { label: 'Home', value: 'home' },
  { label: 'Away', value: 'away' },
]

// Odds type options
export const ODDS_TYPE_OPTIONS = [
  { label: 'Favorites', value: 'favorite' },
  { label: 'Underdogs', value: 'underdog' },
]

// Sportsbook options
export const SPORTSBOOK_OPTIONS = [
  { label: 'DraftKings', value: 'DraftKings' },
  { label: 'FanDuel', value: 'FanDuel' },
  { label: 'BetMGM', value: 'BetMGM' },
  { label: 'ESPN Bet', value: 'ESPN Bet' },
  { label: 'Caesars', value: 'Caesars' },
  { label: 'PrizePicks', value: 'PrizePicks' },
  { label: 'Fliff', value: 'Fliff' },
  { label: 'Fanatics', value: 'Fanatics' },
  { label: 'Underdog', value: 'Underdog' },
  { label: 'BetRivers', value: 'BetRivers' },
  { label: 'Sleeper', value: 'Sleeper' },
  { label: 'Betfred', value: 'Betfred' },
  { label: 'Hard Rock', value: 'Hard Rock' },
  { label: 'SugarHouse', value: 'SugarHouse' },
  { label: 'Borgata', value: 'Borgata' },
  { label: 'Sporttrade', value: 'Sporttrade' },
  { label: 'TrueSharp', value: 'TrueSharp' },
]

// Main filter configuration
export const FILTER_CONFIG: FilterConfig[] = [
  {
    id: 'timeRange',
    label: 'Time Range',
    type: 'single',
    options: TIME_RANGE_OPTIONS,
    icon: 'time-outline',
  },
  {
    id: 'basicStartDate',
    label: 'Start Date',
    type: 'date',
    icon: 'calendar-outline',
    isPro: false,
  },
  {
    id: 'betTypes',
    label: 'Markets',
    type: 'multi',
    options: BET_TYPE_OPTIONS,
    icon: 'list-outline',
  },
  {
    id: 'leagues',
    label: 'Sports & Leagues',
    type: 'multi',
    options: LEAGUE_OPTIONS,
    icon: 'football-outline',
  },
  {
    id: 'results',
    label: 'Bet Status',
    type: 'multi',
    options: STATUS_OPTIONS,
    icon: 'checkmark-circle-outline',
  },
  {
    id: 'isParlay',
    label: 'Bet Types',
    type: 'single',
    options: PARLAY_OPTIONS,
    icon: 'layers-outline',
  },
  {
    id: 'sides',
    label: 'Bet Side',
    type: 'multi',
    options: SIDE_OPTIONS,
    icon: 'swap-horizontal-outline',
    isPro: false,
  },
  {
    id: 'oddsType',
    label: 'Odds Type',
    type: 'single',
    options: ODDS_TYPE_OPTIONS,
    icon: 'trending-up-outline',
    isPro: false,
  },
  {
    id: 'sportsbooks',
    label: 'Sportsbooks',
    type: 'multi',
    options: SPORTSBOOK_OPTIONS,
    icon: 'storefront-outline',
    isPro: false,
  },
  {
    id: 'oddsRange',
    label: 'Odds Range',
    type: 'range',
    placeholder: 'Min - Max odds',
    icon: 'calculator-outline',
    isPro: true,
  },
  {
    id: 'stakeRange',
    label: 'Stake Range',
    type: 'range',
    placeholder: '$Min - $Max stake',
    icon: 'cash-outline',
    isPro: true,
  },
  {
    id: 'spreadRange',
    label: 'Spread Range',
    type: 'range',
    placeholder: 'Min - Max spread',
    icon: 'trending-up-outline',
    isPro: true,
  },
  {
    id: 'totalRange',
    label: 'Total Range',
    type: 'range',
    placeholder: 'Min - Max total',
    icon: 'calculator-outline',
    isPro: true,
  },
  {
    id: 'startDate',
    label: 'Start Date',
    type: 'date',
    icon: 'calendar-outline',
    isPro: true,
  },
  {
    id: 'endDate',
    label: 'End Date',
    type: 'date',
    icon: 'calendar-outline',
    isPro: true,
  },
]

// Default filter values
export const DEFAULT_FILTERS = {
  timeframe: 'all' as const,
  sports: [],
  leagues: [],
  betTypes: [],
  sportsbooks: [],
  results: ['won', 'lost', 'pending', 'void', 'cancelled'],
  dateRange: { start: null, end: null },
  minOdds: null as number | null,
  maxOdds: null as number | null,
  minStake: null as number | null,
  maxStake: null as number | null,
  minSpread: null as number | null,
  maxSpread: null as number | null,
  minTotal: null as number | null,
  maxTotal: null as number | null,
  startDate: null as string | null,
  endDate: null as string | null,
  basicStartDate: null as string | null,
  isParlay: null as boolean | null,
  side: null as string | null,
  oddsType: null as string | null,
}

// Pro-only filter IDs
export const PRO_FILTER_IDS = [
  'oddsRange',
  'stakeRange',
  'spreadRange',
  'totalRange',
  'startDate',
  'endDate',
]

// Filter groups for better organization
export const FILTER_GROUPS = {
  BASIC: {
    title: 'Basic Filters',
    filters: ['betTypes', 'leagues', 'sportsbooks', 'basicStartDate'], // Markets, Sports & Leagues, Sportsbooks, Start Date
  },
  ADVANCED: {
    title: 'Advanced Filters',
    filters: ['results', 'isParlay', 'sides', 'oddsType'], // Bet Status, Parlay/Straight, Bet Side, Odds Type
  },
  PRO: {
    title: 'Pro Filters',
    filters: ['oddsRange', 'stakeRange', 'spreadRange', 'totalRange', 'startDate', 'endDate'], // Pro-only features
  },
}
