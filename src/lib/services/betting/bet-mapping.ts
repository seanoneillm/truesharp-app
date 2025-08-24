import { Bet, DatabaseBet } from './types';

/**
 * Extract league from sport key
 */
function extractLeague(sport: string): string {
  const sportMapping: Record<string, string> = {
    'americanfootball_nfl': 'NFL',
    'americanfootball_ncaaf': 'NCAAF',
    'baseball_mlb': 'MLB',
    'basketball_nba': 'NBA',
    'basketball_ncaab': 'NCAAB',
    'icehockey_nhl': 'NHL',
    'soccer_epl': 'EPL',
    'soccer_champions_league': 'Champions League',
    'soccer_fifa_world_cup': 'World Cup'
  };
  
  return sportMapping[sport] || sport.toUpperCase();
}

/**
 * Determine bet type from market type (oddid)
 */
function determineBetType(marketType: string): DatabaseBet['bet_type'] {
  const lowerMarket = marketType.toLowerCase();
  
  // Main lines
  if (lowerMarket.includes('-ml-') || lowerMarket.includes('moneyline')) {
    return 'moneyline';
  }
  if (lowerMarket.includes('-sp-') || lowerMarket.includes('spread') || lowerMarket.includes('line')) {
    return 'spread';
  }
  if (lowerMarket.includes('-ou-') || lowerMarket.includes('total') || lowerMarket.includes('over') || lowerMarket.includes('under')) {
    return 'total';
  }
  
  // Player props - look for player ID patterns
  if (lowerMarket.match(/-[A-Z_]+_1_[A-Z]+-game/) || lowerMarket.match(/\d{4,}/)) {
    return 'player_prop';
  }
  
  // Game props
  if (lowerMarket.includes('game') || lowerMarket.includes('all')) {
    return 'game_prop';
  }
  
  // Default fallback
  return 'player_prop';
}

/**
 * Determine side from market type and selection
 */
function determineSide(marketType: string, selection: string): DatabaseBet['side'] | undefined {
  const lowerMarket = marketType.toLowerCase();
  const lowerSelection = selection.toLowerCase();
  
  if (lowerMarket.includes('-ou-over') || lowerSelection.includes('over')) {
    return 'over';
  }
  if (lowerMarket.includes('-ou-under') || lowerSelection.includes('under')) {
    return 'under';
  }
  if (lowerMarket.includes('-home') || lowerSelection.includes('home')) {
    return 'home';
  }
  if (lowerMarket.includes('-away') || lowerSelection.includes('away')) {
    return 'away';
  }
  
  return undefined;
}

/**
 * Extract player name from oddid
 */
function extractPlayerName(marketType: string): string | undefined {
  // New format: batting_stolenBases-FIRST_LAST_1_MLB-game-ou-over
  const nameMatch = marketType.match(/-([A-Z_]+_[A-Z_]+)_1_[A-Z]+-game/);
  if (nameMatch && nameMatch[1]) {
    // Convert TYLER_FREEMAN to Tyler Freeman
    return nameMatch[1]
      .split('_')
      .map(part => part.charAt(0) + part.slice(1).toLowerCase())
      .join(' ');
  }
  
  return undefined;
}

/**
 * Extract prop type from market type
 */
function extractPropType(marketType: string): string | undefined {
  const lowerMarket = marketType.toLowerCase();
  
  // Baseball props
  if (lowerMarket.includes('batting_hits')) return 'hits';
  if (lowerMarket.includes('batting_homeruns') || lowerMarket.includes('batting_homerun')) return 'home_runs';
  if (lowerMarket.includes('batting_rbi')) return 'rbis';
  if (lowerMarket.includes('batting_runs')) return 'runs';
  if (lowerMarket.includes('batting_totalbases')) return 'total_bases';
  if (lowerMarket.includes('batting_strikeouts')) return 'strikeouts_batter';
  if (lowerMarket.includes('pitching_strikeouts')) return 'strikeouts_pitcher';
  if (lowerMarket.includes('pitching_hits')) return 'hits_allowed';
  
  // Football props
  if (lowerMarket.includes('passing_yards')) return 'passing_yards';
  if (lowerMarket.includes('rushing_yards')) return 'rushing_yards';
  if (lowerMarket.includes('receiving_yards')) return 'receiving_yards';
  if (lowerMarket.includes('passing_touchdowns')) return 'passing_tds';
  if (lowerMarket.includes('rushing_touchdowns')) return 'rushing_tds';
  if (lowerMarket.includes('receiving_touchdowns')) return 'receiving_tds';
  
  // Basketball props
  if (lowerMarket.includes('points') && !lowerMarket.includes('team')) return 'points';
  if (lowerMarket.includes('rebounds')) return 'rebounds';
  if (lowerMarket.includes('assists')) return 'assists';
  
  // Hockey props
  if (lowerMarket.includes('goals')) return 'goals';
  if (lowerMarket.includes('saves')) return 'saves';
  
  return undefined;
}

/**
 * Map a bet slip bet to database format
 */
export function mapBetToDatabase(
  bet: Bet,
  userId: string,
  stake: number,
  potentialPayout: number,
  parlayId?: string,
  isParlay: boolean = false
): DatabaseBet {
  const now = new Date().toISOString();
  const betType = determineBetType(bet.marketType);
  const side = determineSide(bet.marketType, bet.selection);
  const playerName = extractPlayerName(bet.marketType);
  const propType = extractPropType(bet.marketType);
  
  return {
    user_id: userId,
    external_bet_id: `bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    sport: bet.sport,
    league: extractLeague(bet.sport),
    bet_type: betType,
    bet_description: bet.description,
    odds: Math.round(bet.odds), // Ensure integer
    stake: stake,
    potential_payout: potentialPayout,
    status: 'pending',
    placed_at: now,
    game_date: bet.gameTime,
    prop_type: propType,
    player_name: playerName,
    home_team: bet.homeTeam,
    away_team: bet.awayTeam,
    profit: potentialPayout - stake,
    sportsbook: bet.sportsbook,
    line_value: bet.line,
    bet_source: 'manual',
    is_copy_bet: false,
    game_id: bet.gameId,
    oddid: bet.marketType,
    side: side,
    odd_source: bet.sportsbook,
    parlay_id: parlayId,
    is_parlay: isParlay
  };
}