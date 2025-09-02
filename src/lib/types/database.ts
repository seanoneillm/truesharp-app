// Database types for games and odds tables

export interface DatabaseGame {
  id: string // VARCHAR(100) PRIMARY KEY
  sport: string // VARCHAR(50) NOT NULL
  league: string // VARCHAR(50) NOT NULL
  home_team: string // VARCHAR(100) NOT NULL
  away_team: string // VARCHAR(100) NOT NULL
  home_team_name: string // Team display name
  away_team_name: string // Team display name
  game_time: string // TIMESTAMP WITH TIME ZONE NOT NULL
  status: string // VARCHAR(20) DEFAULT 'scheduled'
  home_score: number | null // INTEGER
  away_score: number | null // INTEGER
  created_at: string // TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  updated_at: string // TIMESTAMP WITH TIME ZONE DEFAULT NOW()
}

export interface DatabaseOdds {
  id: string // UUID PRIMARY KEY DEFAULT gen_random_uuid()
  eventid: string // VARCHAR(100) - references games(id)
  sportsbook: string // VARCHAR(50) NOT NULL
  marketname: string // VARCHAR(50) NOT NULL
  statid: string | null // VARCHAR(100)
  bettypeid: string | null // VARCHAR(50)
  closebookodds: number | null // NUMERIC(10, 2)
  bookodds: number | null // INTEGER
  odds_type: string // VARCHAR(10) DEFAULT 'current'
  fetched_at: string // TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  created_at: string // TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  updated_at: string | null // TIMESTAMP WITH TIME ZONE
  leagueid: string | null // VARCHAR(50)
  hometeam: string | null // VARCHAR(100)
  awayteam: string | null // VARCHAR(100)
  oddid: string | null // VARCHAR(100) - KEY FIELD FOR MARKET IDENTIFICATION
  playerid: string | null // VARCHAR(100)
  periodid: string | null // VARCHAR(50)
  sideid: string | null // VARCHAR(50) - over/under, home/away identifier
  line: string | null // VARCHAR - THE BETTING LINE (e.g., "1.5", "8.5")
  fanduelodds: number | null // NUMERIC(10, 2)
  fanduellink: string | null // TEXT
  espnbetodds: number | null // NUMERIC(10, 2)
  espnbetlink: string | null // TEXT
  ceasarsodds: number | null // NUMERIC(10, 2)
  ceasarslink: string | null // TEXT
  mgmodds: number | null // NUMERIC(10, 2)
  mgmlink: string | null // TEXT
  fanaticsodds: number | null // NUMERIC(10, 2)
  fanaticslink: string | null // TEXT
  draftkingsodds: number | null // NUMERIC(10, 2)
  draftkingslink: string | null // TEXT
  score: string | null // VARCHAR(50)
}

// Mapped types for easier use in components
export interface GameWithOdds extends DatabaseGame {
  odds: DatabaseOdds[]
}

// Market name mappings for UI
export const MARKET_NAME_MAPPINGS: Record<string, string> = {
  // Main Lines
  moneyline: 'main',
  ml: 'main',
  h2h: 'main',
  spread: 'main',
  spreads: 'main',
  sp: 'main',
  point_spread: 'main',
  total: 'main',
  totals: 'main',
  'over/under': 'main',
  ou: 'main',
  run_line: 'main',
  puck_line: 'main',

  // Player Props
  player_prop: 'player-props',
  player_props: 'player-props',
  batting: 'player-props',
  pitching: 'player-props',
  hitting: 'player-props',
  rushing: 'player-props',
  passing: 'player-props',
  receiving: 'player-props',
  points: 'player-props',
  rebounds: 'player-props',
  assists: 'player-props',
  goals: 'player-props',
  saves: 'player-props',

  // Game Props
  game_prop: 'game-props',
  game_props: 'game-props',
  team_props: 'game-props',
  first_scorer: 'game-props',
  anytime_scorer: 'game-props',
  team_totals: 'game-props',

  // Futures
  futures: 'futures',
  season: 'futures',
  championship: 'futures',
  mvp: 'futures',
  playoff: 'futures',

  // Period Props
  first_half: 'period-props',
  first_quarter: 'period-props',
  '1st_half': 'period-props',
  '1st_quarter': 'period-props',
  '1h': 'period-props',
  '1q': 'period-props',
  first_period: 'period-props',
  '1st_period': 'period-props',
  '1p': 'period-props',
  first_inning: 'period-props',
  '1st_inning': 'period-props',
  '1i': 'period-props',

  // Alternative Lines
  alt_spread: 'alt-lines',
  alt_total: 'alt-lines',
  alternate_spread: 'alt-lines',
  alternate_total: 'alt-lines',
  alt_line: 'alt-lines',
}

// Helper function to map market names to tab names based on MLB hierarchy
export function getTabForMarket(marketName: string, oddId?: string): string {
  const normalized = marketName.toLowerCase().trim()

  // Enhanced classification using SportGameOdds API oddID patterns from games-page.md
  if (oddId) {
    const oddIdLower = oddId.toLowerCase()

    // Main Lines patterns: points-home/away-game-ml/sp, points-all-game-ou (main totals)
    if (
      oddIdLower.includes('points-home-game-ml-') ||
      oddIdLower.includes('points-away-game-ml-') ||
      oddIdLower.includes('points-home-game-sp-') ||
      oddIdLower.includes('points-away-game-sp-') ||
      oddIdLower.includes('points-all-game-ou-')
    ) {
      return 'main'
    }

    // Player Props patterns: ANY_PLAYER_ID indicates individual player markets
    if (
      oddIdLower.includes('-any_player_id-') ||
      oddIdLower.match(
        /-(batting|pitching|passing|rushing|receiving|defense|fieldgoals|extrapoints|kicking|assists|rebounds|steals|blocks|fantasyscore|turnovers|saves|shotsongoal|goals|points|hits|penaltyminutes|powerpaypoints|blockedshots)-[^-]+-game-/
      )
    ) {
      return 'player-props'
    }

    // Team Props patterns: home/away specific markets (not main lines)
    if (
      (oddIdLower.includes('-home-game-') || oddIdLower.includes('-away-game-')) &&
      !oddIdLower.includes('points-home-game-ml-') &&
      !oddIdLower.includes('points-away-game-ml-') &&
      !oddIdLower.includes('points-home-game-sp-') &&
      !oddIdLower.includes('points-away-game-sp-') &&
      !oddIdLower.includes('points-all-game-ou-')
    ) {
      return 'team-props'
    }

    // Game Props patterns: all-game markets that aren't main lines
    if (
      oddIdLower.includes('-all-game-') &&
      !oddIdLower.includes('points-all-game-ou-') &&
      !oddIdLower.includes('points-all-game-ml-') &&
      !oddIdLower.includes('points-all-game-sp-')
    ) {
      return 'game-props'
    }

    // Period-specific markets (1q, 1h, 2h, 1p, 2p, 3p, 1i) are typically game props
    if (oddIdLower.match(/-all-(1q|1h|2h|1p|2p|3p|1i)-/)) {
      return 'game-props'
    }

    // Special market types: yn (yes/no), eo (even/odd), ms (multiple selection)
    if (oddIdLower.includes('-yn-') || oddIdLower.includes('-eo-') || oddIdLower.includes('-ms-')) {
      // If it has ANY_PLAYER_ID, it's a player prop
      if (oddIdLower.includes('-any_player_id-')) {
        return 'player-props'
      }
      // If it's team-specific (home/away), it's a team prop
      if (oddIdLower.includes('-home-') || oddIdLower.includes('-away-')) {
        return 'team-props'
      }
      // Otherwise it's a game prop
      return 'game-props'
    }
  }

  // Fallback to original text-based classification
  // Main Lines - Basic game markets (Moneyline, Run Line, Total)
  if (isMainLineMarket(normalized)) {
    return 'main'
  }

  // Player Props - Individual player statistics (organized by Hitters/Pitchers)
  if (isPlayerPropsMarket(normalized)) {
    return 'player-props'
  }

  // Team Props - Team-level statistics and achievements
  if (isTeamPropsMarket(normalized)) {
    return 'team-props'
  }

  // Game Props - Game-wide events and outcomes
  if (isGamePropsMarket(normalized)) {
    return 'game-props'
  }

  // Period Props - Time-based markets (innings, quarters, periods)
  if (isPeriodPropsMarket(normalized)) {
    return 'period-props'
  }

  // Alternative Lines - Alt spreads, alt totals
  if (isAltLinesMarket(normalized)) {
    return 'alt-lines'
  }

  // Default to main for unrecognized markets
  return 'main'
}

// Enhanced MLB-specific sub-tab classification using SportGameOdds API patterns
export function getMLBPlayerPropsSubTab(marketName: string, oddId?: string): string {
  const normalized = marketName.toLowerCase().trim()

  // Enhanced classification using SportGameOdds API oddID patterns from games-page.md
  if (oddId) {
    const oddIdLower = oddId.toLowerCase()

    // Pitching patterns from games-page.md
    if (
      oddIdLower.includes('pitching_strikeouts-') ||
      oddIdLower.includes('pitching_hits-') ||
      oddIdLower.includes('pitching_earnedruns-') ||
      oddIdLower.includes('pitching_basesonballs-') ||
      oddIdLower.includes('pitching_homerunsallowed-') ||
      oddIdLower.includes('pitching_pitchesthrown-') ||
      oddIdLower.includes('pitching_outs-') ||
      oddIdLower.includes('pitching_win-')
    ) {
      return 'pitchers'
    }

    // Hitting patterns from games-page.md
    if (
      oddIdLower.includes('batting_hits-') ||
      oddIdLower.includes('batting_homeruns-') ||
      oddIdLower.includes('batting_rbi-') ||
      oddIdLower.includes('points-any_player_id-') || // runs scored
      oddIdLower.includes('batting_totalbases-') ||
      oddIdLower.includes('batting_singles-') ||
      oddIdLower.includes('batting_doubles-') ||
      oddIdLower.includes('batting_triples-') ||
      oddIdLower.includes('batting_stolenbases-') ||
      oddIdLower.includes('batting_strikeouts-') ||
      oddIdLower.includes('batting_basesonballs-') ||
      oddIdLower.includes('batting_hits+runs+rbi-') ||
      oddIdLower.includes('fantasyscore-any_player_id-') ||
      oddIdLower.includes('batting_firsthomerun-') ||
      oddIdLower.includes('firsttoscore-any_player_id-') ||
      oddIdLower.includes('lasttoscore-any_player_id-')
    ) {
      return 'hitters'
    }
  }

  // Fallback to text-based classification
  // Pitching-specific terms (check these first as they're more specific)
  const pitcherTerms = [
    'strikeouts',
    'strikeout',
    'k',
    'earned_runs',
    'era',
    'hits_allowed',
    'walks_allowed',
    'home_runs_allowed',
    'pitches_thrown',
    'outs_recorded',
    'pitching_win',
    'saves',
    'whip',
    'innings_pitched',
    'complete_games',
    'shutouts',
    'balks',
    'wild_pitches',
  ]

  // Hitting-specific terms
  const hitterTerms = [
    'hits',
    'hit',
    'rbi',
    'runs',
    'doubles',
    'singles',
    'triples',
    'home_runs',
    'hr',
    'stolen_bases',
    'sb',
    'total_bases',
    'walks',
    'bb',
    'batting_average',
    'at_bats',
    'sacrifice_flies',
    'gidp',
  ]

  // Check for pitcher terms first (more specific)
  if (pitcherTerms.some(term => normalized.includes(term))) {
    return 'pitchers'
  }

  // Then check for hitter terms
  if (hitterTerms.some(term => normalized.includes(term))) {
    return 'hitters'
  }

  // Special handling for strikeouts - context matters
  if (normalized.includes('strikeout')) {
    // If it's player strikeouts (batter), it's a hitter stat
    if (normalized.includes('batter') || normalized.includes('to_strikeout')) {
      return 'hitters'
    }
    // Otherwise it's pitcher strikeouts
    return 'pitchers'
  }

  // Known pitcher names (you can expand this list based on your data)
  const knownPitchers = [
    'shohei_ohtani',
    'gerrit_cole',
    'spencer_strider',
    'jacob_degrom',
    'shane_bieber',
    'corbin_burnes',
    'brandon_woodruff',
  ]

  // Known hitters (you can expand this list based on your data)
  const knownHitters = [
    'aaron_judge',
    'mookie_betts',
    'freddie_freeman',
    'vladimir_guerrero',
    'ronald_acuna',
    'mike_trout',
    'manny_machado',
  ]

  // Check known player lists
  if (knownPitchers.some(pitcher => normalized.includes(pitcher))) {
    return 'pitchers'
  }

  if (knownHitters.some(hitter => normalized.includes(hitter))) {
    return 'hitters'
  }

  // Default to hitters for unclassified player props
  return 'hitters'
}

// Enhanced NFL-specific sub-tab classification using SportGameOdds API patterns
export function getNFLPlayerPropsSubTab(marketName: string, oddId?: string): string {
  const normalized = marketName.toLowerCase().trim()

  // Enhanced classification using SportGameOdds API oddID patterns from games-page.md
  if (oddId) {
    const oddIdLower = oddId.toLowerCase()

    // Quarterback patterns
    if (
      oddIdLower.includes('passing_yards-') ||
      oddIdLower.includes('passing_touchdowns-') ||
      oddIdLower.includes('passing_completions-') ||
      oddIdLower.includes('passing_attempts-') ||
      oddIdLower.includes('passing_longestcompletion-') ||
      oddIdLower.includes('passing+rushing_yards-') ||
      oddIdLower.includes('passing_passerrating-')
    ) {
      return 'quarterback'
    }

    // Running Back patterns
    if (
      oddIdLower.includes('rushing_yards-') ||
      oddIdLower.includes('rushing_touchdowns-') ||
      oddIdLower.includes('rushing_attempts-') ||
      oddIdLower.includes('rushing_longestrush-') ||
      oddIdLower.includes('rushing+receiving_yards-')
    ) {
      return 'running-back'
    }

    // Receiver patterns
    if (
      oddIdLower.includes('receiving_yards-') ||
      oddIdLower.includes('receiving_receptions-') ||
      oddIdLower.includes('receiving_touchdowns-') ||
      oddIdLower.includes('receiving_longestreception-')
    ) {
      return 'receiver'
    }

    // Kicker/Defense patterns
    if (
      oddIdLower.includes('kicking_totalpoints-') ||
      oddIdLower.includes('fieldgoals_made-') ||
      oddIdLower.includes('extrapoints_kicksmade-') ||
      oddIdLower.includes('fieldgoals_longestmade-') ||
      oddIdLower.includes('defense_sacks-') ||
      oddIdLower.includes('defense_interceptions-') ||
      oddIdLower.includes('defense_fumblerecoveries-') ||
      oddIdLower.includes('defense_touchdowns-') ||
      oddIdLower.includes('defense_tackles-')
    ) {
      return 'kicker-defense'
    }

    // Any Player patterns
    if (
      oddIdLower.includes('fantasyscore-any_player_id-') ||
      oddIdLower.includes('turnovers-any_player_id-') ||
      oddIdLower.includes('firsttouchdown-any_player_id-') ||
      oddIdLower.includes('lasttouchdown-any_player_id-') ||
      oddIdLower.includes('firsttoscore-any_player_id-') ||
      oddIdLower.includes('touchdowns-any_player_id-')
    ) {
      return 'any-player'
    }
  }

  // Fallback to text-based classification
  const quarterbackTerms = ['passing', 'completion', 'attempt', 'passer_rating', 'interception']
  const runningBackTerms = ['rushing', 'carry', 'yard_per_carry']
  const receiverTerms = ['receiving', 'reception', 'target', 'catch']
  const defenseTerms = ['sack', 'tackle', 'fumble', 'defensive']
  const kickerTerms = ['field_goal', 'extra_point', 'kicking']

  if (quarterbackTerms.some(term => normalized.includes(term))) return 'quarterback'
  if (runningBackTerms.some(term => normalized.includes(term))) return 'running-back'
  if (receiverTerms.some(term => normalized.includes(term))) return 'receiver'
  if (
    defenseTerms.some(term => normalized.includes(term)) ||
    kickerTerms.some(term => normalized.includes(term))
  )
    return 'kicker-defense'

  return 'any-player'
}

// Enhanced NBA-specific sub-tab classification using SportGameOdds API patterns
export function getNBAPlayerPropsSubTab(marketName: string, oddId?: string): string {
  const normalized = marketName.toLowerCase().trim()

  // Enhanced classification using SportGameOdds API oddID patterns from games-page.md
  if (oddId) {
    const oddIdLower = oddId.toLowerCase()

    // Scoring patterns
    if (
      oddIdLower.includes('points-any_player_id-') ||
      oddIdLower.includes('fieldgoals_made-any_player_id-') ||
      oddIdLower.includes('fieldgoals_attempts-any_player_id-') ||
      oddIdLower.includes('freethrows_made-any_player_id-') ||
      oddIdLower.includes('freethrows_attempts-any_player_id-') ||
      oddIdLower.includes('threepointers_made-any_player_id-') ||
      oddIdLower.includes('threepointers_attempts-any_player_id-')
    ) {
      return 'scoring'
    }

    // Rebounding patterns
    if (
      oddIdLower.includes('rebounds_total-any_player_id-') ||
      oddIdLower.includes('rebounds_offensive-any_player_id-') ||
      oddIdLower.includes('rebounds_defensive-any_player_id-')
    ) {
      return 'rebounding'
    }

    // Playmaking patterns
    if (
      oddIdLower.includes('assists-any_player_id-') ||
      oddIdLower.includes('steals-any_player_id-') ||
      oddIdLower.includes('blocks-any_player_id-') ||
      oddIdLower.includes('turnovers-any_player_id-')
    ) {
      return 'playmaking'
    }

    // Combination patterns
    if (
      oddIdLower.includes('points+rebounds-any_player_id-') ||
      oddIdLower.includes('points+assists-any_player_id-') ||
      oddIdLower.includes('rebounds+assists-any_player_id-') ||
      oddIdLower.includes('points+rebounds+assists-any_player_id-') ||
      oddIdLower.includes('steals+blocks-any_player_id-')
    ) {
      return 'combinations'
    }

    // Special patterns
    if (
      oddIdLower.includes('doubledouble-any_player_id-') ||
      oddIdLower.includes('tripledouble-any_player_id-') ||
      oddIdLower.includes('firstbasket-any_player_id-') ||
      oddIdLower.includes('lastbasket-any_player_id-')
    ) {
      return 'specials'
    }
  }

  // Fallback to text-based classification
  const scoringTerms = ['points', 'field_goal', 'free_throw', 'three_pointer']
  const reboundingTerms = ['rebound', 'offensive_rebound', 'defensive_rebound']
  const playmakingTerms = ['assist', 'steal', 'block', 'turnover']
  const combinationTerms = ['double_double', 'triple_double', '+']

  if (scoringTerms.some(term => normalized.includes(term))) return 'scoring'
  if (reboundingTerms.some(term => normalized.includes(term))) return 'rebounding'
  if (playmakingTerms.some(term => normalized.includes(term))) return 'playmaking'
  if (combinationTerms.some(term => normalized.includes(term))) return 'combinations'

  return 'specials'
}

// Enhanced NHL-specific sub-tab classification using SportGameOdds API patterns
export function getNHLPlayerPropsSubTab(marketName: string, oddId?: string): string {
  const normalized = marketName.toLowerCase().trim()

  // Enhanced classification using SportGameOdds API oddID patterns from games-page.md
  if (oddId) {
    const oddIdLower = oddId.toLowerCase()

    // Goalie patterns
    if (
      oddIdLower.includes('saves-any_player_id-') ||
      oddIdLower.includes('goalsagainst-any_player_id-') ||
      oddIdLower.includes('shotsagainst-any_player_id-') ||
      oddIdLower.includes('win-any_player_id-') ||
      oddIdLower.includes('shutout-any_player_id-')
    ) {
      return 'goalies'
    }

    // Forward/Defensemen patterns (more general since NHL API doesn't distinguish)
    if (
      oddIdLower.includes('points-any_player_id-') || // goals
      oddIdLower.includes('assists-any_player_id-') ||
      oddIdLower.includes('points+assists-any_player_id-') ||
      oddIdLower.includes('shotsongoal-any_player_id-') ||
      oddIdLower.includes('penaltyminutes-any_player_id-') ||
      oddIdLower.includes('powerplaypoints-any_player_id-') ||
      oddIdLower.includes('hits-any_player_id-') ||
      oddIdLower.includes('blockedshots-any_player_id-') ||
      oddIdLower.includes('fantasyscore-any_player_id-') ||
      oddIdLower.includes('firstgoal-any_player_id-') ||
      oddIdLower.includes('lastgoal-any_player_id-') ||
      oddIdLower.includes('anygoal-any_player_id-')
    ) {
      return 'forwards' // Default to forwards for skater stats
    }
  }

  // Fallback to text-based classification
  const goalieTerms = ['save', 'goals_against', 'shutout', 'win']
  const skaterTerms = ['goal', 'assist', 'point', 'shot', 'hit', 'block', 'penalty']

  if (goalieTerms.some(term => normalized.includes(term))) return 'goalies'
  if (skaterTerms.some(term => normalized.includes(term))) return 'forwards'

  return 'forwards'
}

// Market classification functions based on actual database content
function isMainLineMarket(marketName: string): boolean {
  // Basic main line patterns
  if (
    marketName.includes('moneyline') ||
    marketName.includes('ml') ||
    marketName === 'h2h' ||
    marketName.includes('spread') ||
    marketName.includes('run_line') ||
    marketName.includes('runline') ||
    marketName.includes('puck_line') ||
    marketName.includes('point_spread')
  ) {
    return true
  }

  // SportGameOdds API main line patterns
  if (
    marketName.includes('-home-game-ml') ||
    marketName.includes('-away-game-ml') ||
    marketName.includes('-home-game-sp') ||
    marketName.includes('-away-game-sp') ||
    marketName.includes('-all-game-ou') ||
    marketName.includes('points-home-game-ml') ||
    marketName.includes('points-away-game-ml') ||
    marketName.includes('points-home-game-sp') ||
    marketName.includes('points-away-game-sp') ||
    marketName.includes('points-all-game-ou')
  ) {
    return true
  }

  // Game totals (but not team or player totals)
  if (
    (marketName.includes('total') ||
      marketName.includes('over/under') ||
      marketName.includes('ou')) &&
    !marketName.includes('team') &&
    !marketName.includes('player') &&
    !marketName.includes('_') &&
    !marketName.includes('hits') &&
    !marketName.includes('runs') &&
    !marketName.includes('strikeouts') &&
    !marketName.includes('home_runs')
  ) {
    return true
  }

  return marketName === 'totals'
}

function isPlayerPropsMarket(marketName: string): boolean {
  // Check for obvious player name patterns (underscores often indicate player names)
  const hasPlayerPattern = marketName.includes('_') && marketName.length > 10

  // SportGameOdds API player prop patterns - these are the actual patterns we see
  const apiPlayerPatterns = [
    'batting_',
    'pitching_',
    'passing_',
    'rushing_',
    'receiving_',
    'fieldGoals_',
    'threePointers_',
    'freeThrows_',
    'rebounds_',
    'shots_onGoal',
    'penalty',
    'power',
    'fantasy',
  ]

  // Check for API patterns first
  if (apiPlayerPatterns.some(pattern => marketName.includes(pattern))) {
    return true
  }

  // Player-specific market patterns (PLAYER_ID-game-* format but not team markets)
  if (
    marketName.includes('-game-ou') ||
    marketName.includes('-game-yn') ||
    marketName.includes('-game-ms') ||
    marketName.includes('-game-eo')
  ) {
    // It's a player prop if it's not a team-level market
    return (
      !marketName.includes('home-game-') &&
      !marketName.includes('away-game-') &&
      !marketName.includes('all-game-') &&
      !marketName.includes('points-home-') &&
      !marketName.includes('points-away-') &&
      !marketName.includes('points-all-')
    )
  }

  // Known player stat terms by sport
  const baseballPlayerTerms = [
    'hits',
    'rbi',
    'runs',
    'doubles',
    'home_run',
    'hr',
    'strikeouts',
    'k',
    'walks',
    'bb',
    'stolen_bases',
    'sb',
    'total_bases',
    'singles',
    'triples',
    'earned_runs',
    'era',
    'pitch',
    'saves',
    'whip',
    'batting_avg',
  ]

  const footballPlayerTerms = [
    'passing_yards',
    'passing_tds',
    'completions',
    'interceptions',
    'rushing_yards',
    'rushing_tds',
    'rushing_attempts',
    'receiving_yards',
    'receiving_tds',
    'receptions',
    'field_goals',
    'sacks',
    'tackles',
  ]

  const basketballPlayerTerms = [
    'points',
    'rebounds',
    'assists',
    'steals',
    'blocks',
    'turnovers',
    'field_goals',
    'three_pointers',
    'free_throws',
    'double_double',
    'triple_double',
  ]

  const hockeyPlayerTerms = [
    'goals',
    'assists',
    'shots_on_goal',
    'hits',
    'blocked_shots',
    'penalty_minutes',
    'power_play_points',
    'saves',
    'goals_against',
  ]

  const soccerPlayerTerms = [
    'shots',
    'shots_on_target',
    'fouls',
    'cards',
    'corners',
    'passes',
    'tackles',
    'clearances',
    'interceptions',
  ]

  const allPlayerTerms = [
    ...baseballPlayerTerms,
    ...footballPlayerTerms,
    ...basketballPlayerTerms,
    ...hockeyPlayerTerms,
    ...soccerPlayerTerms,
  ]

  // Check if any player terms match
  const hasPlayerStat = allPlayerTerms.some(term => marketName.includes(term))

  // Additional logic: if it has player pattern or player stats but excludes team/game level
  return (
    (hasPlayerPattern || hasPlayerStat) &&
    !marketName.includes('team_total') &&
    !marketName.includes('game_total') &&
    !isTeamPropsMarket(marketName) &&
    !isGamePropsMarket(marketName)
  )
}

function isTeamPropsMarket(marketName: string): boolean {
  // Traditional team prop patterns
  if (
    marketName.includes('team_total') ||
    marketName.includes('team_runs') ||
    marketName.includes('team_hits') ||
    marketName.includes('team_points') ||
    marketName.includes('team_touchdowns') ||
    marketName.includes('team_field_goals') ||
    marketName.includes('team_rebounds') ||
    marketName.includes('team_assists') ||
    marketName.includes('team_goals') ||
    marketName.includes('team_shots') ||
    marketName.includes('team_corners') ||
    marketName.includes('first_to_score') ||
    marketName.includes('last_to_score') ||
    marketName.includes('clean_sheet') ||
    marketName.includes('both_teams_score') ||
    marketName.includes('team_to_score_first')
  ) {
    return true
  }

  // SportGameOdds API team-specific patterns
  if (
    marketName.includes('points-home-game-ou') ||
    marketName.includes('points-away-game-ou') ||
    marketName.includes('points-home-game-yn') ||
    marketName.includes('points-away-game-yn') ||
    marketName.includes('-home-game-ou') ||
    marketName.includes('-away-game-ou') ||
    marketName.includes('-home-game-yn') ||
    marketName.includes('-away-game-yn') ||
    marketName.includes('firstToScore-home') ||
    marketName.includes('firstToScore-away') ||
    marketName.includes('lastToScore-home') ||
    marketName.includes('lastToScore-away')
  ) {
    return true
  }

  // Team-specific terms that indicate team props
  const teamTerms = [
    'team_to_',
    'home_team_',
    'away_team_',
    'first_to_score',
    'last_to_score',
    'firstScorer',
    'lastScorer',
    'teamToScore',
    'cleanSheet',
  ]

  return teamTerms.some(term => marketName.includes(term))
}

function isGamePropsMarket(marketName: string): boolean {
  // Traditional game prop patterns
  if (
    marketName.includes('game_total') ||
    marketName.includes('total_runs') ||
    marketName.includes('total_hits') ||
    marketName.includes('total_home_runs') ||
    marketName.includes('total_strikeouts') ||
    marketName.includes('total_touchdowns') ||
    marketName.includes('total_field_goals') ||
    marketName.includes('total_turnovers') ||
    marketName.includes('total_sacks') ||
    marketName.includes('total_penalties') ||
    marketName.includes('total_goals') ||
    marketName.includes('total_shots') ||
    marketName.includes('total_corners') ||
    marketName.includes('total_cards')
  ) {
    return true
  }

  // Game event patterns
  if (
    marketName.includes('overtime') ||
    marketName.includes('extra_time') ||
    marketName.includes('shootout') ||
    marketName.includes('extra_innings') ||
    marketName.includes('first_score_type') ||
    marketName.includes('anytime_scorer') ||
    marketName.includes('first_goal_scorer') ||
    marketName.includes('walk_off') ||
    marketName.includes('no_hitter') ||
    marketName.includes('perfect_game') ||
    marketName.includes('grand_slam') ||
    marketName.includes('cycle')
  ) {
    return true
  }

  // SportGameOdds API game-wide patterns (all teams combined)
  if (
    marketName.includes('points-all-game-ou') ||
    marketName.includes('points-all-game-yn') ||
    marketName.includes('points-all-game-eo') ||
    marketName.includes('points-all-game-ms') ||
    marketName.includes('-all-game-ou') ||
    marketName.includes('-all-game-yn') ||
    marketName.includes('-all-game-eo') ||
    marketName.includes('-all-game-ms') ||
    marketName.includes('bothTeamsToScore') ||
    marketName.includes('extraTime-') ||
    marketName.includes('penaltyShootout-') ||
    marketName.includes('overtime-all')
  ) {
    return true
  }

  // Game-wide stat totals (combined totals for both teams)
  const gameWideTerms = [
    'game_total',
    'both_teams',
    'combined_',
    'total_game_',
    'game_even_odd',
    'game_eo',
    'gameTotal',
    'totalGame',
  ]

  return gameWideTerms.some(term => marketName.includes(term))
}

function isPeriodPropsMarket(marketName: string): boolean {
  return (
    marketName.includes('first_half') ||
    marketName.includes('second_half') ||
    marketName.includes('first_quarter') ||
    marketName.includes('second_quarter') ||
    marketName.includes('third_quarter') ||
    marketName.includes('fourth_quarter') ||
    marketName.includes('1st_half') ||
    marketName.includes('2nd_half') ||
    marketName.includes('1st_quarter') ||
    marketName.includes('2nd_quarter') ||
    marketName.includes('3rd_quarter') ||
    marketName.includes('4th_quarter') ||
    marketName.includes('1h') ||
    marketName.includes('2h') ||
    marketName.includes('1q') ||
    marketName.includes('2q') ||
    marketName.includes('3q') ||
    marketName.includes('4q') ||
    marketName.includes('first_period') ||
    marketName.includes('second_period') ||
    marketName.includes('third_period') ||
    marketName.includes('1st_period') ||
    marketName.includes('2nd_period') ||
    marketName.includes('3rd_period') ||
    marketName.includes('1p') ||
    marketName.includes('2p') ||
    marketName.includes('3p') ||
    marketName.includes('first_inning') ||
    marketName.includes('1st_inning') ||
    (marketName.includes('inning_') &&
      (marketName.includes('1') || marketName.includes('2') || marketName.includes('3')))
  )
}

function isAltLinesMarket(marketName: string): boolean {
  return (
    marketName.includes('alt_spread') ||
    marketName.includes('alt_total') ||
    marketName.includes('alternate_spread') ||
    marketName.includes('alternate_total') ||
    marketName.includes('alt_line') ||
    marketName.includes('alternative_line')
  )
}
