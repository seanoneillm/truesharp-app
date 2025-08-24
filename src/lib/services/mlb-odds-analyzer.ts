import { createClient } from '@/lib/supabase';
import { DatabaseOdds, GameWithOdds } from '@/lib/types/database';

export interface OrganizedOdds {
  mainLines: {
    moneyline: DatabaseOdds[];
    runLine: DatabaseOdds[];
    totals: DatabaseOdds[];
  };
  playerProps: {
    hitting: DatabaseOdds[];
    pitching: DatabaseOdds[];
    fielding: DatabaseOdds[];
    general: DatabaseOdds[];
  };
  teamProps: {
    teamTotals: DatabaseOdds[];
    firstToScore: DatabaseOdds[];
    innings: DatabaseOdds[];
    advanced: DatabaseOdds[];
  };
  gameProps: {
    gameFlow: DatabaseOdds[];
    timing: DatabaseOdds[];
    special: DatabaseOdds[];
  };
}

export interface MLBGameData {
  game: GameWithOdds;
  organizedOdds: OrganizedOdds;
  oddsMetadata: {
    totalOdds: number;
    sportsbooks: string[];
    marketTypes: string[];
    lastUpdated: string;
  };
}

export class MLBOddsAnalyzer {
  private supabase = createClient();

  /**
   * Get all MLB games from 8/15/24 with organized odds
   */
  async getMLBGamesWithOrganizedOdds(): Promise<MLBGameData[]> {
    try {
      console.log('🎯 Fetching MLB games for 2024-08-15 with comprehensive odds organization...');
      
      // Fetch games for August 15, 2024
      const { data: games, error: gamesError } = await this.supabase
        .from('games')
        .select('*')
        .eq('league', 'MLB')
        .gte('game_time', '2024-08-15T00:00:00.000Z')
        .lt('game_time', '2024-08-16T00:00:00.000Z')
        .order('game_time', { ascending: true });

      if (gamesError) {
        console.error('❌ Error fetching MLB games:', gamesError);
        throw new Error(`Failed to fetch MLB games: ${gamesError.message}`);
      }

      if (!games || games.length === 0) {
        console.log('⚠️ No MLB games found for 2024-08-15');
        return [];
      }

      console.log(`✅ Found ${games.length} MLB games for 2024-08-15`);
      
      // Get all game IDs
      const gameIds = games.map(game => game.id);
      
      // Fetch all odds for these games
      const { data: allOdds, error: oddsError } = await this.supabase
        .from('odds')
        .select('*')
        .in('eventid', gameIds)
        .order('marketname', { ascending: true });

      if (oddsError) {
        console.error('❌ Error fetching odds:', oddsError);
        throw new Error(`Failed to fetch odds: ${oddsError.message}`);
      }

      console.log(`✅ Found ${allOdds?.length || 0} total odds entries`);

      // Analyze market types for better organization
      await this.analyzeMarketTypes(allOdds || []);

      // Group odds by game ID
      const oddsByGameId = (allOdds || []).reduce((acc, odd) => {
        if (!acc[odd.eventid]) {
          acc[odd.eventid] = [];
        }
        acc[odd.eventid].push(odd);
        return acc;
      }, {} as Record<string, DatabaseOdds[]>);

      // Process each game with organized odds
      const mlbGameData: MLBGameData[] = games.map(game => {
        const gameOdds = oddsByGameId[game.id] || [];
        
        return {
          game: { ...game, odds: gameOdds },
          organizedOdds: this.organizeOddsForGame(gameOdds),
          oddsMetadata: this.generateOddsMetadata(gameOdds)
        };
      });

      console.log('📊 MLB Games with organized odds:');
      mlbGameData.forEach(gameData => {
        const { game, organizedOdds, oddsMetadata } = gameData;
        console.log(`  ${game.away_team_name} @ ${game.home_team_name}:`);
        console.log(`    Main Lines: ML(${organizedOdds.mainLines.moneyline.length}) RL(${organizedOdds.mainLines.runLine.length}) Tot(${organizedOdds.mainLines.totals.length})`);
        console.log(`    Player Props: Hit(${organizedOdds.playerProps.hitting.length}) Pitch(${organizedOdds.playerProps.pitching.length}) Gen(${organizedOdds.playerProps.general.length})`);
        console.log(`    Team Props: Tot(${organizedOdds.teamProps.teamTotals.length}) Adv(${organizedOdds.teamProps.advanced.length})`);
        console.log(`    Game Props: Flow(${organizedOdds.gameProps.gameFlow.length}) Special(${organizedOdds.gameProps.special.length})`);
        console.log(`    Sportsbooks: ${oddsMetadata.sportsbooks.join(', ')}`);
      });

      return mlbGameData;
    } catch (error) {
      console.error('❌ Failed to fetch MLB games with organized odds:', error);
      throw error;
    }
  }

  /**
   * Analyze and log all unique market types in the database
   */
  private async analyzeMarketTypes(odds: DatabaseOdds[]): Promise<void> {
    const marketTypes = new Set<string>();
    const betTypes = new Set<string>();
    const sportsbooks = new Set<string>();
    
    odds.forEach(odd => {
      if (odd.marketname) marketTypes.add(odd.marketname);
      if (odd.bettypeid) betTypes.add(odd.bettypeid);
      if (odd.sportsbook) sportsbooks.add(odd.sportsbook);
    });

    console.log('📋 Market Analysis:');
    console.log('  Market Names:', Array.from(marketTypes).sort());
    console.log('  Bet Types:', Array.from(betTypes).sort());
    console.log('  Sportsbooks:', Array.from(sportsbooks).sort());
  }

  /**
   * Organize odds into logical categories for UI display
   */
  private organizeOddsForGame(odds: DatabaseOdds[]): OrganizedOdds {
    const organized: OrganizedOdds = {
      mainLines: {
        moneyline: [],
        runLine: [],
        totals: []
      },
      playerProps: {
        hitting: [],
        pitching: [],
        fielding: [],
        general: []
      },
      teamProps: {
        teamTotals: [],
        firstToScore: [],
        innings: [],
        advanced: []
      },
      gameProps: {
        gameFlow: [],
        timing: [],
        special: []
      }
    };

    odds.forEach(odd => {
      const marketName = (odd.marketname || '').toLowerCase();
      const betType = (odd.bettypeid || '').toLowerCase();
      const statId = (odd.statid || '').toLowerCase();

      // Main Lines Classification
      if (this.isMoneylineOdd(marketName, betType)) {
        organized.mainLines.moneyline.push(odd);
      } else if (this.isRunLineOdd(marketName, betType)) {
        organized.mainLines.runLine.push(odd);
      } else if (this.isTotalOdd(marketName, betType)) {
        organized.mainLines.totals.push(odd);
      }
      // Player Props Classification
      else if (this.isPlayerHittingProp(marketName, statId)) {
        organized.playerProps.hitting.push(odd);
      } else if (this.isPlayerPitchingProp(marketName, statId)) {
        organized.playerProps.pitching.push(odd);
      } else if (this.isPlayerFieldingProp(marketName, statId)) {
        organized.playerProps.fielding.push(odd);
      } else if (this.isPlayerProp(marketName, odd.playerid)) {
        organized.playerProps.general.push(odd);
      }
      // Team Props Classification
      else if (this.isTeamTotalProp(marketName)) {
        organized.teamProps.teamTotals.push(odd);
      } else if (this.isInningProp(marketName)) {
        organized.teamProps.innings.push(odd);
      } else if (this.isTeamAdvancedProp(marketName)) {
        organized.teamProps.advanced.push(odd);
      }
      // Game Props Classification
      else if (this.isGameFlowProp(marketName)) {
        organized.gameProps.gameFlow.push(odd);
      } else if (this.isTimingProp(marketName)) {
        organized.gameProps.timing.push(odd);
      } else if (this.isSpecialGameProp(marketName)) {
        organized.gameProps.special.push(odd);
      }
      // Default to game props if unclassified
      else {
        organized.gameProps.gameFlow.push(odd);
      }
    });

    return organized;
  }

  // Classification helper methods
  private isMoneylineOdd(marketName: string, betType: string): boolean {
    return marketName.includes('moneyline') || 
           marketName.includes('ml') ||
           betType === 'ml' ||
           marketName === 'h2h';
  }

  private isRunLineOdd(marketName: string, betType: string): boolean {
    return marketName.includes('run_line') ||
           marketName.includes('runline') ||
           marketName.includes('spread') ||
           betType === 'rl' ||
           betType === 'sp';
  }

  private isTotalOdd(marketName: string, betType: string): boolean {
    return marketName.includes('total') ||
           marketName.includes('over') ||
           marketName.includes('under') ||
           marketName.includes('ou') ||
           betType === 'ou';
  }

  private isPlayerHittingProp(marketName: string, statId: string): boolean {
    return marketName.includes('hit') ||
           marketName.includes('rbi') ||
           marketName.includes('runs') ||
           marketName.includes('doubles') ||
           marketName.includes('home_run') ||
           statId.includes('hit') ||
           statId.includes('rbi');
  }

  private isPlayerPitchingProp(marketName: string, statId: string): boolean {
    return marketName.includes('strikeout') ||
           marketName.includes('k') ||
           marketName.includes('earned_runs') ||
           marketName.includes('walks') ||
           marketName.includes('pitch') ||
           statId.includes('k') ||
           statId.includes('era');
  }

  private isPlayerFieldingProp(marketName: string, statId: string): boolean {
    return marketName.includes('assist') ||
           marketName.includes('error') ||
           marketName.includes('putout') ||
           statId.includes('field');
  }

  private isPlayerProp(marketName: string, playerId: string | null): boolean {
    return !!playerId || 
           marketName.includes('player') ||
           marketName.includes('_') && (marketName.length > 15); // Likely player name
  }

  private isTeamTotalProp(marketName: string): boolean {
    return marketName.includes('team_total') ||
           marketName.includes('team_runs') ||
           marketName.includes('team_hits');
  }

  private isInningProp(marketName: string): boolean {
    return marketName.includes('inning') ||
           marketName.includes('1st') ||
           marketName.includes('first') ||
           marketName.includes('half');
  }

  private isTeamAdvancedProp(marketName: string): boolean {
    return marketName.includes('team') &&
           (marketName.includes('avg') ||
            marketName.includes('obp') ||
            marketName.includes('slg') ||
            marketName.includes('era'));
  }

  private isGameFlowProp(marketName: string): boolean {
    return marketName.includes('score') ||
           marketName.includes('lead') ||
           marketName.includes('winner') ||
           marketName.includes('margin');
  }

  private isTimingProp(marketName: string): boolean {
    return marketName.includes('duration') ||
           marketName.includes('time') ||
           marketName.includes('inning') && marketName.includes('length');
  }

  private isSpecialGameProp(marketName: string): boolean {
    return marketName.includes('walk_off') ||
           marketName.includes('extra') ||
           marketName.includes('no_hitter') ||
           marketName.includes('perfect') ||
           marketName.includes('cycle') ||
           marketName.includes('grand_slam');
  }

  /**
   * Generate metadata about odds for a game
   */
  private generateOddsMetadata(odds: DatabaseOdds[]) {
    const sportsbooks = Array.from(new Set(odds.map(odd => odd.sportsbook).filter(Boolean)));
    const marketTypes = Array.from(new Set(odds.map(odd => odd.marketname).filter(Boolean)));
    
    const lastUpdated = odds.reduce((latest, odd) => {
      const oddTime = new Date(odd.fetched_at || odd.created_at).getTime();
      return oddTime > latest ? oddTime : latest;
    }, 0);

    return {
      totalOdds: odds.length,
      sportsbooks,
      marketTypes,
      lastUpdated: new Date(lastUpdated).toISOString()
    };
  }

  /**
   * Get specific odds category for a game
   */
  async getOddsCategoryForGame(gameId: string, category: 'main' | 'player-props' | 'team-props' | 'game-props'): Promise<DatabaseOdds[]> {
    try {
      const { data: odds, error } = await this.supabase
        .from('odds')
        .select('*')
        .eq('eventid', gameId)
        .order('sportsbook', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch odds for game ${gameId}: ${error.message}`);
      }

      const organized = this.organizeOddsForGame(odds || []);
      
      switch (category) {
        case 'main':
          return [
            ...organized.mainLines.moneyline,
            ...organized.mainLines.runLine,
            ...organized.mainLines.totals
          ];
        case 'player-props':
          return [
            ...organized.playerProps.hitting,
            ...organized.playerProps.pitching,
            ...organized.playerProps.fielding,
            ...organized.playerProps.general
          ];
        case 'team-props':
          return [
            ...organized.teamProps.teamTotals,
            ...organized.teamProps.firstToScore,
            ...organized.teamProps.innings,
            ...organized.teamProps.advanced
          ];
        case 'game-props':
          return [
            ...organized.gameProps.gameFlow,
            ...organized.gameProps.timing,
            ...organized.gameProps.special
          ];
        default:
          return odds || [];
      }
    } catch (error) {
      console.error(`❌ Failed to fetch ${category} odds for game ${gameId}:`, error);
      throw error;
    }
  }
}

// Create singleton instance
export const mlbOddsAnalyzer = new MLBOddsAnalyzer();
