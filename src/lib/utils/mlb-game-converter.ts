import { MLBGameData, OrganizedOdds } from '@/lib/services/mlb-odds-analyzer';
import { DatabaseOdds } from '@/lib/types/database';
import { Bookmaker, Game, Market, Outcome } from '@/lib/types/games';

/**
 * Enhanced converter for MLB games with organized odds
 */
export function convertMLBGameDataToGames(mlbGameData: MLBGameData[]): Game[] {
  return mlbGameData.map(gameData => convertMLBGameDataToGame(gameData));
}

/**
 * Convert a single MLB game data to Game interface
 */
export function convertMLBGameDataToGame(gameData: MLBGameData): Game {
  const { game, organizedOdds, oddsMetadata } = gameData;
  
  // Group all odds by sportsbook for proper bookmaker structure
  const oddsBySportsbook = groupOddsBySportsbook([
    ...organizedOdds.mainLines.moneyline,
    ...organizedOdds.mainLines.runLine,
    ...organizedOdds.mainLines.totals,
    ...organizedOdds.playerProps.hitting,
    ...organizedOdds.playerProps.pitching,
    ...organizedOdds.playerProps.fielding,
    ...organizedOdds.playerProps.general,
    ...organizedOdds.teamProps.teamTotals,
    ...organizedOdds.teamProps.firstToScore,
    ...organizedOdds.teamProps.innings,
    ...organizedOdds.teamProps.advanced,
    ...organizedOdds.gameProps.gameFlow,
    ...organizedOdds.gameProps.timing,
    ...organizedOdds.gameProps.special
  ]);

  // Convert to bookmakers format with enhanced market creation
  const bookmakers: Bookmaker[] = Object.entries(oddsBySportsbook).map(([sportsbookName, odds]) => {
    const markets = createEnhancedMarketsFromOdds(
      odds, 
      game.home_team_name, 
      game.away_team_name,
      organizedOdds
    );
    
    return {
      key: sportsbookName.toLowerCase().replace(/\s+/g, '_'),
      title: sportsbookName,
      last_update: oddsMetadata.lastUpdated,
      markets
    };
  });

  return {
    id: game.id,
    sport_key: 'baseball_mlb',
    sport_title: 'Major League Baseball',
    commence_time: game.game_time,
    home_team: game.home_team_name,
    away_team: game.away_team_name,
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
 * Create enhanced markets from organized odds
 */
function createEnhancedMarketsFromOdds(
  _odds: DatabaseOdds[], 
  homeTeam: string, 
  awayTeam: string,
  organizedOdds: OrganizedOdds
): Market[] {
  const markets: Market[] = [];
  
  // Create main line markets
  const moneylineMarket = createMoneylineMarket(organizedOdds.mainLines.moneyline, homeTeam, awayTeam);
  if (moneylineMarket) markets.push(moneylineMarket);
  
  const runLineMarket = createRunLineMarket(organizedOdds.mainLines.runLine, homeTeam, awayTeam);
  if (runLineMarket) markets.push(runLineMarket);
  
  const totalsMarket = createTotalsMarket(organizedOdds.mainLines.totals);
  if (totalsMarket) markets.push(totalsMarket);

  // Create player prop markets
  const playerPropMarkets = createPlayerPropMarkets(organizedOdds.playerProps);
  markets.push(...playerPropMarkets);

  // Create team prop markets
  const teamPropMarkets = createTeamPropMarkets(organizedOdds.teamProps);
  markets.push(...teamPropMarkets);

  // Create game prop markets
  const gamePropMarkets = createGamePropMarkets(organizedOdds.gameProps);
  markets.push(...gamePropMarkets);

  return markets;
}

/**
 * Create moneyline market from organized odds
 */
function createMoneylineMarket(odds: DatabaseOdds[], homeTeam: string, awayTeam: string): Market | null {
  if (!odds || odds.length === 0) return null;

  const outcomes: Outcome[] = [];
  
  odds.forEach(odd => {
    const side = (odd.sideid || '').toLowerCase();
    const bookOdds = odd.bookodds;
    
    if (!bookOdds) return;
    
    if (side === 'home' || side === 'h') {
      outcomes.push({
        name: homeTeam,
        price: convertAmericanToDecimal(bookOdds)
      });
    } else if (side === 'away' || side === 'a') {
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
 * Create run line market from organized odds
 */
function createRunLineMarket(odds: DatabaseOdds[], homeTeam: string, awayTeam: string): Market | null {
  if (!odds || odds.length === 0) return null;

  const outcomes: Outcome[] = [];
  
  odds.forEach(odd => {
    const side = (odd.sideid || '').toLowerCase();
    const bookOdds = odd.bookodds;
    const spread = odd.closebookodds || 1.5; // Default MLB run line
    
    if (!bookOdds) return;
    
    if (side === 'home' || side === 'h') {
      outcomes.push({
        name: homeTeam,
        price: convertAmericanToDecimal(bookOdds),
        point: -Math.abs(spread) // Home team typically gets negative spread
      });
    } else if (side === 'away' || side === 'a') {
      outcomes.push({
        name: awayTeam,
        price: convertAmericanToDecimal(bookOdds),
        point: Math.abs(spread) // Away team typically gets positive spread
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
 * Create totals market from organized odds
 */
function createTotalsMarket(odds: DatabaseOdds[]): Market | null {
  if (!odds || odds.length === 0) return null;

  const outcomes: Outcome[] = [];
  
  odds.forEach(odd => {
    const side = (odd.sideid || '').toLowerCase();
    const bookOdds = odd.bookodds;
    const total = odd.closebookodds || 9.5; // Default MLB total
    
    if (!bookOdds) return;
    
    if (side === 'over' || side === 'o') {
      outcomes.push({
        name: 'Over',
        price: convertAmericanToDecimal(bookOdds),
        point: total
      });
    } else if (side === 'under' || side === 'u') {
      outcomes.push({
        name: 'Under',
        price: convertAmericanToDecimal(bookOdds),
        point: total
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
 * Create player prop markets
 */
function createPlayerPropMarkets(playerProps: OrganizedOdds['playerProps']): Market[] {
  const markets: Market[] = [];
  
  // Hitting props
  if (playerProps.hitting && playerProps.hitting.length > 0) {
    const hittingMarket = createPlayerPropMarket(playerProps.hitting, 'player_hitting');
    if (hittingMarket) markets.push(hittingMarket);
  }
  
  // Pitching props
  if (playerProps.pitching && playerProps.pitching.length > 0) {
    const pitchingMarket = createPlayerPropMarket(playerProps.pitching, 'player_pitching');
    if (pitchingMarket) markets.push(pitchingMarket);
  }
  
  // General player props
  if (playerProps.general && playerProps.general.length > 0) {
    const generalMarket = createPlayerPropMarket(playerProps.general, 'player_general');
    if (generalMarket) markets.push(generalMarket);
  }
  
  return markets;
}

/**
 * Create team prop markets
 */
function createTeamPropMarkets(teamProps: OrganizedOdds['teamProps']): Market[] {
  const markets: Market[] = [];
  
  // Team totals
  if (teamProps.teamTotals && teamProps.teamTotals.length > 0) {
    const teamTotalsMarket = createTeamPropMarket(teamProps.teamTotals, 'team_totals');
    if (teamTotalsMarket) markets.push(teamTotalsMarket);
  }
  
  // Advanced team props
  if (teamProps.advanced && teamProps.advanced.length > 0) {
    const advancedMarket = createTeamPropMarket(teamProps.advanced, 'team_advanced');
    if (advancedMarket) markets.push(advancedMarket);
  }
  
  return markets;
}

/**
 * Create game prop markets
 */
function createGamePropMarkets(gameProps: OrganizedOdds['gameProps']): Market[] {
  const markets: Market[] = [];
  
  // Game flow props
  if (gameProps.gameFlow && gameProps.gameFlow.length > 0) {
    const gameFlowMarket = createGamePropMarket(gameProps.gameFlow, 'game_flow');
    if (gameFlowMarket) markets.push(gameFlowMarket);
  }
  
  // Special game props
  if (gameProps.special && gameProps.special.length > 0) {
    const specialMarket = createGamePropMarket(gameProps.special, 'game_special');
    if (specialMarket) markets.push(specialMarket);
  }
  
  return markets;
}

/**
 * Generic prop market creator
 */
function createPlayerPropMarket(odds: DatabaseOdds[], marketKey: string): Market | null {
  if (!odds || odds.length === 0) return null;

  const outcomes: Outcome[] = [];
  
  odds.forEach(odd => {
    const side = (odd.sideid || '').toLowerCase();
    const bookOdds = odd.bookodds;
    const line = odd.closebookodds;
    
    if (!bookOdds) return;
    
    // Create outcomes based on side
    if (side === 'over' || side === 'o') {
      outcomes.push({
        name: `Over ${line || ''}`,
        price: convertAmericanToDecimal(bookOdds),
        point: line || 0
      });
    } else if (side === 'under' || side === 'u') {
      outcomes.push({
        name: `Under ${line || ''}`,
        price: convertAmericanToDecimal(bookOdds),
        point: line || 0
      });
    } else {
      // Yes/No or other prop types
      outcomes.push({
        name: odd.marketname || 'Prop',
        price: convertAmericanToDecimal(bookOdds)
      });
    }
  });
  
  if (outcomes.length === 0) return null;
  
  return {
    key: marketKey,
    last_update: getLatestUpdate(odds),
    outcomes
  };
}

/**
 * Generic team prop market creator
 */
function createTeamPropMarket(odds: DatabaseOdds[], marketKey: string): Market | null {
  return createPlayerPropMarket(odds, marketKey); // Same logic for now
}

/**
 * Generic game prop market creator
 */
function createGamePropMarket(odds: DatabaseOdds[], marketKey: string): Market | null {
  return createPlayerPropMarket(odds, marketKey); // Same logic for now
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
