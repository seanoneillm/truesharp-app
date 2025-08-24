import { createClient } from '@/lib/supabase';
import { DatabaseOdds, GameWithOdds } from '@/lib/types/database';
import { mlbOddsAnalyzer } from './mlb-odds-analyzer';

// Service for fetching games and odds data from Supabase
export class GamesDataService {
  private supabase = createClient();

  /**
   * Fetch all games for a specific date with their associated odds (ENHANCED)
   * Now includes ALL betting markets (moneyline, spread, totals, props) as requested
   */
  async getMLBGameWithOdds(gameId: string): Promise<GameWithOdds | null> {
    try {
      console.log(`🔍 Fetching individual game with ALL odds (ML/SP/OU/Props): ${gameId}`);
      
      // Fetch the specific game
      const { data: game, error: gameError } = await this.supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();

      if (gameError) {
        console.error('❌ Error fetching game:', gameError.message || gameError);
        return null;
      }

      if (!game) {
        console.log('⚠️ Game not found');
        return null;
      }

      // Fetch ALL odds for this game (not just O/U)
      const { data: odds, error: oddsError } = await this.supabase
        .from('odds')
        .select('*')
        .eq('eventid', gameId)
        .order('sportsbook', { ascending: true });

      if (oddsError) {
        console.error('❌ Error fetching odds:', oddsError.message || oddsError);
        return null;
      }

      // Filter to valid odds (exclude only yes/no markets as specified in requirements)
      const validOdds = (odds || []).filter(odd => {
        if (!odd.oddid) return false;
        // Exclude yes/no markets as specified
        return !odd.oddid.includes('-yn-');
      });

      console.log(`✅ Found ${odds?.length || 0} total odds, ${validOdds.length} valid odds (excluded yn) for game ${gameId}`);
      console.log(`📊 Odds breakdown:`, {
        moneyline: validOdds.filter((o: DatabaseOdds) => o.oddid?.includes('-ml-')).length,
        spread: validOdds.filter((o: DatabaseOdds) => o.oddid?.includes('-sp-')).length,
        overUnder: validOdds.filter((o: DatabaseOdds) => o.oddid?.includes('-ou-')).length,
        other: validOdds.filter((o: DatabaseOdds) => !o.oddid?.includes('-ml-') && !o.oddid?.includes('-sp-') && !o.oddid?.includes('-ou-')).length
      });

      // Return ALL valid odds (moneyline, spread, totals, props)
      return {
        ...game,
        odds: validOdds
      };
    } catch (error) {
      console.error('❌ Failed to fetch game with odds:', error);
      return null;
    }
  }

  async getMLBGamesForDate(date: string): Promise<GameWithOdds[]> {
    try {
      console.log('🎯 Fetching MLB games for date:', date);
      
      // First, try to get games for the specific date
      const { data: games, error: gamesError } = await this.supabase
        .from('games')
        .select('*')
        .eq('league', 'MLB')
        .gte('game_time', `${date}T00:00:00.000Z`)
        .lt('game_time', `${date}T23:59:59.999Z`)
        .order('game_time', { ascending: true });

      // No fallback - only show games for the specific date
      if (!games || games.length === 0) {
        console.log(`⚠️ No games found for ${date}`);
        return [];
      }

      if (gamesError) {
        console.error('❌ Error fetching games:', gamesError);
        throw new Error(`Failed to fetch games: ${gamesError.message || 'Unknown error'}`);
      }

      if (!games || games.length === 0) {
        console.log('⚠️ No MLB games found for date:', date);
        return [];
      }

      console.log(`✅ Found ${games.length} MLB games for ${date}`);
      
      // Extract game IDs for fetching odds
      const gameIds = games.map(game => game.id);
      
      // Fetch all odds for these games
      const { data: odds, error: oddsError } = await this.supabase
        .from('odds')
        .select('*')
        .in('eventid', gameIds)
        .order('created_at', { ascending: false });

      if (oddsError) {
        console.error('❌ Error fetching odds:', oddsError);
        throw new Error(`Failed to fetch odds: ${oddsError.message}`);
      }

      console.log(`✅ Found ${odds?.length || 0} odds entries for ${games.length} games`);

      // Group odds by game ID
      const oddsByGameId = (odds || []).reduce((acc, odd) => {
        if (!acc[odd.eventid]) {
          acc[odd.eventid] = [];
        }
        acc[odd.eventid].push(odd);
        return acc;
      }, {} as Record<string, DatabaseOdds[]>);

      // Combine games with their odds
      const gamesWithOdds: GameWithOdds[] = games.map(game => ({
        ...game,
        odds: oddsByGameId[game.id] || []
      }));

      console.log('📊 Games with odds summary:');
      gamesWithOdds.forEach(game => {
        console.log(`  ${game.away_team_name} @ ${game.home_team_name}: ${game.odds.length} odds`);
      });

      return gamesWithOdds;
    } catch (error) {
      console.error('❌ Failed to fetch MLB games and odds:', error);
      throw error;
    }
  }

  /**
   * Fetch games for any league and date (ENHANCED WITH ALL ODDS)
   * Now includes ALL betting markets as specified in requirements
   */
  async getGamesForLeagueAndDate(league: string, date: string): Promise<GameWithOdds[]> {
    try {
      console.log(`🎯 Fetching ${league} games with ALL odds (ML/SP/OU/Props) for date:`, date);
      
      const { data: games, error: gamesError } = await this.supabase
        .from('games')
        .select('*')
        .eq('league', league.toUpperCase())
        .gte('game_time', `${date}T00:00:00.000Z`)
        .lt('game_time', `${date}T23:59:59.999Z`)
        .order('game_time', { ascending: true });

      if (gamesError) {
        console.error(`❌ Error fetching ${league} games:`, gamesError);
        throw new Error(`Failed to fetch ${league} games: ${gamesError.message}`);
      }

      if (!games || games.length === 0) {
        console.log(`⚠️ No ${league} games found for date:`, date);
        return [];
      }

      const gameIds = games.map(game => game.id);
      
      // Fetch ALL odds for these games (not just O/U)
      console.log(`🔧 Fetching ALL odds for ${league}`);
      
      const { data: odds, error: oddsError } = await this.supabase
        .from('odds')
        .select('*')
        .in('eventid', gameIds)
        .order('created_at', { ascending: false });

      if (oddsError) {
        console.error(`❌ Error fetching odds for ${league}:`, oddsError);
        console.log(`⚠️ Continuing with games but no odds data for ${league}`);
      }

      // Filter to valid odds (exclude only yes/no markets as specified)
      const validOdds = (odds || []).filter(odd => {
        if (!odd.oddid) return false;
        // Exclude yes/no markets as specified in requirements
        return !odd.oddid.includes('-yn-');
      });

      const oddsByGameId = validOdds.reduce((acc, odd) => {
        if (!acc[odd.eventid]) {
          acc[odd.eventid] = [];
        }
        acc[odd.eventid].push(odd);
        return acc;
      }, {} as Record<string, DatabaseOdds[]>);

      const gamesWithOdds: GameWithOdds[] = games.map(game => ({
        ...game,
        odds: oddsByGameId[game.id] || []
      }));

      console.log(`✅ Found ${games.length} ${league} games with ${odds?.length || 0} total odds, ${validOdds.length} valid odds`);
      console.log(`📊 Valid odds distribution by game:`, Object.keys(oddsByGameId).map(gameId => ({
        gameId,
        oddsCount: oddsByGameId[gameId].length,
        breakdown: {
          moneyline: oddsByGameId[gameId].filter((o: DatabaseOdds) => o.oddid?.includes('-ml-')).length,
          spread: oddsByGameId[gameId].filter((o: DatabaseOdds) => o.oddid?.includes('-sp-')).length,
          overUnder: oddsByGameId[gameId].filter((o: DatabaseOdds) => o.oddid?.includes('-ou-')).length,
          other: oddsByGameId[gameId].filter((o: DatabaseOdds) => !o.oddid?.includes('-ml-') && !o.oddid?.includes('-sp-') && !o.oddid?.includes('-ou-')).length
        }
      })));
      
      return gamesWithOdds;
    } catch (error) {
      console.error(`❌ Failed to fetch ${league} games and odds:`, error);
      throw error;
    }
  }

  /**
   * Get MLB games for 8/15/24 with comprehensive odds organization
   */
  async getMLBGamesWithOrganizedOdds() {
    return await mlbOddsAnalyzer.getMLBGamesWithOrganizedOdds();
  }

  /**
   * Test the database connection
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testing Supabase connection...');
      
      const { error } = await this.supabase
        .from('games')
        .select('count')
        .limit(1);

      if (error) {
        console.error('❌ Database connection test failed:', error);
        return false;
      }

      console.log('✅ Database connection test successful');
      return true;
    } catch (error) {
      console.error('❌ Database connection test exception:', error);
      return false;
    }
  }

  /**
   * Get summary of available data
   */
  async getDataSummary(): Promise<{
    totalGames: number;
    totalOdds: number;
    gamesByLeague: Record<string, number>;
    gamesAvailableDates: string[];
  }> {
    try {
      console.log('📊 Fetching data summary...');
      
      // Get games count
      const { data: gamesData, error: gamesError } = await this.supabase
        .from('games')
        .select('league, game_time');

      if (gamesError) {
        throw new Error(`Failed to fetch games summary: ${gamesError.message}`);
      }

      // Get odds count
      const { count: oddsCount, error: oddsError } = await this.supabase
        .from('odds')
        .select('*', { count: 'exact', head: true });

      if (oddsError) {
        throw new Error(`Failed to fetch odds summary: ${oddsError.message}`);
      }

      const gamesByLeague = (gamesData || []).reduce((acc, game) => {
        acc[game.league] = (acc[game.league] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const gamesAvailableDates = Array.from(new Set(
        (gamesData || []).map(game => game.game_time.split('T')[0])
      )).sort();

      const summary = {
        totalGames: gamesData?.length || 0,
        totalOdds: oddsCount || 0,
        gamesByLeague,
        gamesAvailableDates
      };

      console.log('📊 Data Summary:', summary);
      return summary;
    } catch (error) {
      console.error('❌ Failed to fetch data summary:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const gamesDataService = new GamesDataService();
