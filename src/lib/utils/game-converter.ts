import { DatabaseOdds, GameWithOdds, getTabForMarket } from '@/lib/types/database';
import { Bookmaker, Game, Market, Outcome } from '@/lib/types/games';

/**
 * Convert database games and odds to the Game interface format
 */
export function convertDatabaseGamesToGames(gamesWithOdds: GameWithOdds[]): Game[] {
  return gamesWithOdds.map(dbGame => convertDatabaseGameToGame(dbGame));
}

/**
 * Convert a single database game with odds to Game interface
 */
export function convertDatabaseGameToGame(dbGame: GameWithOdds): Game {
  // Group odds by sportsbook
  const oddsBySportsbook = groupOddsBySportsbook(dbGame.odds);
  
  // Convert to bookmakers format
  const bookmakers: Bookmaker[] = Object.entries(oddsBySportsbook).map(([sportsbookName, odds]) => {
    const markets = createMarketsFromOdds(odds, dbGame.home_team_name, dbGame.away_team_name);
    
    return {
      key: sportsbookName.toLowerCase().replace(/\s+/g, '_'),
      title: sportsbookName,
      last_update: getLatestUpdate(odds),
      markets
    };
  });

  // Map sport to sport_key format
  const sport_key = getSportKey(dbGame.league);
  
  return {
    id: dbGame.id,
    sport_key,
    sport_title: getSportTitle(dbGame.league),
    commence_time: dbGame.game_time,
    home_team: dbGame.home_team_name,
    away_team: dbGame.away_team_name,
    bookmakers
  };
}

/**
 * Group odds by sportsbook
 */
function groupOddsBySportsbook(odds: DatabaseOdds[]): Record<string, DatabaseOdds[]> {
  return odds.reduce((acc, odd) => {
    const sportsbook = odd.sportsbook || 'Unknown';
    if (!acc[sportsbook]) {
      acc[sportsbook] = [];
    }
    acc[sportsbook].push(odd);
    return acc;
  }, {} as Record<string, DatabaseOdds[]>);
}

/**
 * Create markets from odds data
 */
function createMarketsFromOdds(odds: DatabaseOdds[], homeTeam: string, awayTeam: string): Market[] {
  // Group odds by market type
  const marketGroups = groupOddsByMarket(odds);
  
  const markets: Market[] = [];
  
  // Create moneyline market
  if (marketGroups.moneyline && marketGroups.moneyline.length > 0) {
    const moneylineMarket = createMoneylineMarket(marketGroups.moneyline, homeTeam, awayTeam);
    if (moneylineMarket) markets.push(moneylineMarket);
  }
  
  // Create spread market
  if (marketGroups.spread && marketGroups.spread.length > 0) {
    const spreadMarket = createSpreadMarket(marketGroups.spread, homeTeam, awayTeam);
    if (spreadMarket) markets.push(spreadMarket);
  }
  
  // Create totals market
  if (marketGroups.total && marketGroups.total.length > 0) {
    const totalMarket = createTotalMarket(marketGroups.total);
    if (totalMarket) markets.push(totalMarket);
  }

  return markets;
}

/**
 * Group odds by market type (moneyline, spread, total)
 */
function groupOddsByMarket(odds: DatabaseOdds[]): Record<string, DatabaseOdds[]> {
  return odds.reduce((acc, odd) => {
    const marketType = getMarketTypeFromOdd(odd);
    if (!acc[marketType]) {
      acc[marketType] = [];
    }
    acc[marketType].push(odd);
    return acc;
  }, {} as Record<string, DatabaseOdds[]>);
}

/**
 * Determine market type from odd data
 */
function getMarketTypeFromOdd(odd: DatabaseOdds): string {
  const marketName = (odd.marketname || '').toLowerCase();
  const betType = (odd.bettypeid || '').toLowerCase();
  
  if (marketName.includes('moneyline') || marketName.includes('ml') || betType === 'ml') {
    return 'moneyline';
  }
  
  if (marketName.includes('spread') || marketName.includes('sp') || betType === 'sp') {
    return 'spread';
  }
  
  if (marketName.includes('over/under') || marketName.includes('total') || marketName.includes('ou') || betType === 'ou') {
    return 'total';
  }
  
  // Default to moneyline for unrecognized markets
  return 'moneyline';
}

/**
 * Create moneyline market from odds
 */
function createMoneylineMarket(odds: DatabaseOdds[], homeTeam: string, awayTeam: string): Market | null {
  const outcomes: Outcome[] = [];
  
  // Look for home and away odds
  odds.forEach(odd => {
    const side = (odd.sideid || '').toLowerCase();
    const bookOdds = odd.bookodds;
    
    if (!bookOdds) return;
    
    if (side === 'home') {
      outcomes.push({
        name: homeTeam,
        price: convertAmericanToDecimal(bookOdds)
      });
    } else if (side === 'away') {
      outcomes.push({
        name: awayTeam,
        price: convertAmericanToDecimal(bookOdds)
      });
    }
  });
  
  if (outcomes.length === 0) return null;
  
  return {
    key: 'h2h',
    last_update: getLatestUpdate(odds),
    outcomes
  };
}

/**
 * Create spread market from odds
 */
function createSpreadMarket(odds: DatabaseOdds[], homeTeam: string, awayTeam: string): Market | null {
  const outcomes: Outcome[] = [];
  
  odds.forEach(odd => {
    const side = (odd.sideid || '').toLowerCase();
    const bookOdds = odd.bookodds;
    const spread = odd.closebookodds; // Assuming spread value is in closebookodds
    
    if (!bookOdds) return;
    
    if (side === 'home') {
      outcomes.push({
        name: homeTeam,
        price: convertAmericanToDecimal(bookOdds),
        point: spread || 0
      });
    } else if (side === 'away') {
      outcomes.push({
        name: awayTeam,
        price: convertAmericanToDecimal(bookOdds),
        point: spread ? -spread : 0
      });
    }
  });
  
  if (outcomes.length === 0) return null;
  
  return {
    key: 'spreads',
    last_update: getLatestUpdate(odds),
    outcomes
  };
}

/**
 * Create total market from odds
 */
function createTotalMarket(odds: DatabaseOdds[]): Market | null {
  const outcomes: Outcome[] = [];
  
  odds.forEach(odd => {
    const side = (odd.sideid || '').toLowerCase();
    const bookOdds = odd.bookodds;
    const total = odd.closebookodds; // Assuming total value is in closebookodds
    
    if (!bookOdds) return;
    
    if (side === 'over') {
      outcomes.push({
        name: 'Over',
        price: convertAmericanToDecimal(bookOdds),
        point: total || 0
      });
    } else if (side === 'under') {
      outcomes.push({
        name: 'Under',
        price: convertAmericanToDecimal(bookOdds),
        point: total || 0
      });
    }
  });
  
  if (outcomes.length === 0) return null;
  
  return {
    key: 'totals',
    last_update: getLatestUpdate(odds),
    outcomes
  };
}

/**
 * Convert American odds to decimal odds
 */
function convertAmericanToDecimal(americanOdds: number): number {
  if (americanOdds > 0) {
    return (americanOdds / 100) + 1;
  } else {
    return (100 / Math.abs(americanOdds)) + 1;
  }
}

/**
 * Get the latest update time from odds array
 */
function getLatestUpdate(odds: DatabaseOdds[]): string {
  const latestTime = odds.reduce((latest, odd) => {
    const oddTime = new Date(odd.fetched_at || odd.created_at).getTime();
    return oddTime > latest ? oddTime : latest;
  }, 0);
  
  return new Date(latestTime).toISOString();
}

/**
 * Map league to sport_key format
 */
function getSportKey(league: string): string {
  const leagueMap: Record<string, string> = {
    'MLB': 'baseball_mlb',
    'NFL': 'americanfootball_nfl',
    'NBA': 'basketball_nba',
    'NHL': 'icehockey_nhl',
    'NCAAF': 'americanfootball_ncaaf',
    'NCAAB': 'basketball_ncaab',
    'MLS': 'soccer_usa_mls',
    'Champions League': 'soccer_uefa_champs_league'
  };
  
  return leagueMap[league] || league.toLowerCase();
}

/**
 * Get sport title from league
 */
function getSportTitle(league: string): string {
  const titleMap: Record<string, string> = {
    'MLB': 'Major League Baseball',
    'NFL': 'National Football League',
    'NBA': 'National Basketball Association',
    'NHL': 'National Hockey League',
    'NCAAF': 'NCAA Football',
    'NCAAB': 'NCAA Basketball',
    'MLS': 'Major League Soccer',
    'Champions League': 'UEFA Champions League'
  };
  
  return titleMap[league] || league;
}

/**
 * Create a comprehensive odds mapping for display
 */
export function createOddsDisplayData(dbGame: GameWithOdds) {
  // Group odds by market and side for easier access
  const oddsMap = new Map<string, Map<string, DatabaseOdds[]>>();
  
  dbGame.odds.forEach(odd => {
    const marketKey = getTabForMarket(odd.marketname || '');
    const sideKey = odd.sideid || 'unknown';
    
    if (!oddsMap.has(marketKey)) {
      oddsMap.set(marketKey, new Map());
    }
    
    const marketMap = oddsMap.get(marketKey)!;
    if (!marketMap.has(sideKey)) {
      marketMap.set(sideKey, []);
    }
    
    marketMap.get(sideKey)!.push(odd);
  });
  
  return oddsMap;
}
