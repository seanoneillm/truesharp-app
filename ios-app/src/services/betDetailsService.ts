import { supabase } from '../lib/supabase';
import { BetData } from './supabaseAnalytics';

export interface GameInfo {
  id: string;
  sport: string;
  home_team: string;
  away_team: string;
  home_team_name: string;
  away_team_name: string;
  game_time: string;
  status: string;
  home_score?: number;
  away_score?: number;
  league?: string;
}

export interface OddsInfo {
  id: string;
  eventid: string;
  sportsbook: string;
  marketname: string;
  oddid?: string;
  line?: string;
  bookodds?: number;
  closebookodds?: number;
  // Sportsbook odds columns
  fanduelodds?: number;
  draftkingsodds?: number;
  mgmodds?: number;
  espnbetodds?: number;
  ceasarsodds?: number;
  pinnacleodds?: number;
  bovadaodds?: number;
  // Add other sportsbook columns as needed
}

export interface LineMovementPoint {
  fetched_at: string;
  line?: string;
  bookodds?: number;
  closebookodds?: number;
  sportsbook: string;
}

export interface StrategyInfo {
  id: string;
  name: string;
  description?: string;
  monetized: boolean;
  performance_roi?: number;
  performance_win_rate?: number;
  performance_total_bets?: number;
}

export interface SharpSportsBetMatch {
  bet_id: string;
  game_id?: string;
  odd_id?: string;
  bet_description?: string;
  marketname?: string;
  matched_at: string;
}

export interface BetDetailsData {
  bet: BetData;
  gameInfo?: GameInfo;
  oddsInfo?: OddsInfo;
  lineMovement: LineMovementPoint[];
  strategies: StrategyInfo[];
  sharpSportsMatch?: SharpSportsBetMatch;
  parlayLegs?: BetDetailsData[]; // For parlay bets
}

export class BetDetailsService {
  
  static async fetchBetDetails(betIdOrParlayId: string): Promise<BetDetailsData | null> {
    try {
      // First try to fetch as a regular bet ID
      const { data: bet, error: betError } = await supabase
        .from('bets')
        .select('*')
        .eq('id', betIdOrParlayId)
        .single();

      if (bet && !betError) {
        // Found a regular bet, continue with normal flow
        return this.processBetDetails(bet);
      }

      // If not found as bet ID, try as parlay_id
      const { data: parlayBets, error: parlayError } = await supabase
        .from('bets')
        .select('*')
        .eq('parlay_id', betIdOrParlayId);

      if (parlayError) {
        console.error('Error fetching parlay by parlay_id:', parlayError);
        return null;
      }

      if (!parlayBets || parlayBets.length === 0) {
        console.error('No bets found with parlay_id:', betIdOrParlayId);
        return null;
      }

      // Use the existing parlay grouping logic
      return this.processParlayFromLegs(parlayBets);
    } catch (error) {
      console.error('Error fetching bet details:', error);
      return null;
    }
  }

  static async processBetDetails(bet: any): Promise<BetDetailsData> {
    // For regular single bets (not parlays)
    const gameInfo = await this.fetchGameInfo(bet);
    const oddsInfo = await this.fetchOddsInfo(bet);
    const lineMovement = await this.fetchLineMovement(bet, gameInfo);
    const strategies = await this.fetchStrategies(bet.id);
    const sharpSportsMatch = await this.fetchSharpSportsMatch(bet.id);

    // If it's a parlay bet, fetch legs
    let parlayLegs: BetDetailsData[] = [];
    if (bet.is_parlay && bet.parlay_id) {
      const { data: parlayBets } = await supabase
        .from('bets')
        .select('*')
        .eq('parlay_id', bet.parlay_id);

      if (parlayBets && parlayBets.length > 0) {
        parlayLegs = parlayBets.map(legBet => ({
          bet: legBet,
          gameInfo: undefined,
          oddsInfo: undefined,
          lineMovement: [],
          strategies: [],
          sharpSportsMatch: undefined,
          parlayLegs: [],
        }));

        // Fetch game info for each leg
        const gameInfoPromises = parlayLegs.map(async (leg, index) => {
          try {
            const gameInfo = await this.fetchGameInfo(leg.bet);
            parlayLegs[index].gameInfo = gameInfo;
          } catch (error) {
            console.error(`Error fetching game info for leg ${leg.bet.id}:`, error);
          }
        });

        await Promise.all(gameInfoPromises);
      }
    }

    return {
      bet,
      gameInfo,
      oddsInfo,
      lineMovement,
      strategies,
      sharpSportsMatch,
      parlayLegs,
    };
  }

  static async processParlayFromLegs(parlayBets: any[]): Promise<BetDetailsData> {
    // Import the parlay grouping utility
    const { groupBetsByParlay } = await import('../services/parlayGrouping');
    
    // Use the existing parlay grouping logic to create a proper ParlayGroup
    const { parlays } = groupBetsByParlay(parlayBets);
    
    if (parlays.length === 0) {
      throw new Error('No parlay group created from legs');
    }
    
    const parlayGroup = parlays[0];
    
    // Create a synthetic bet object from the ParlayGroup for consistency with existing modal code
    const syntheticBet = {
      id: parlayGroup.parlay_id,
      is_parlay: true,
      stake: parlayGroup.stake,
      potential_payout: parlayGroup.potential_payout,
      odds: parlayGroup.odds,
      status: parlayGroup.status,
      profit: parlayGroup.profit,
      placed_at: parlayGroup.placed_at,
      sport: parlayGroup.sport,
      bet_description: `${parlayGroup.legs.length}-Leg Parlay`,
      bet_type: 'parlay',
      parlay_id: parlayGroup.parlay_id,
    };

    // Create parlay legs with proper game info
    const parlayLegs = await Promise.all(
      parlayGroup.legs.map(async (legBet) => {
        try {
          const gameInfo = await this.fetchGameInfo(legBet);
          return {
            bet: legBet,
            gameInfo,
            oddsInfo: undefined,
            lineMovement: [],
            strategies: [],
            sharpSportsMatch: undefined,
            parlayLegs: [],
          };
        } catch (error) {
          console.error(`Error fetching game info for leg ${legBet.id}:`, error);
          return {
            bet: legBet,
            gameInfo: undefined,
            oddsInfo: undefined,
            lineMovement: [],
            strategies: [],
            sharpSportsMatch: undefined,
            parlayLegs: [],
          };
        }
      })
    );

    // Fetch strategies for the parlay (use first leg's strategies)
    const strategies = await this.fetchStrategies(parlayGroup.legs[0].id);

    return {
      bet: syntheticBet,
      gameInfo: undefined, // Parlays don't have single game context
      oddsInfo: undefined,
      lineMovement: [],
      strategies,
      sharpSportsMatch: undefined,
      parlayLegs,
    };
  }

  static async fetchGameInfo(bet: BetData): Promise<GameInfo | undefined> {
    try {
      let gameId = bet.game_id;
      
      // If no direct game_id, try SharpSports match
      if (!gameId) {
        const { data: match } = await supabase
          .from('sharpsports_bet_matches')
          .select('game_id')
          .eq('bet_id', bet.id)
          .single();
        
        gameId = match?.game_id;
      }

      if (!gameId) return undefined;

      const { data: game } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();

      return game || undefined;
    } catch (error) {
      console.error('Error fetching game info:', error);
      return undefined;
    }
  }

  static async fetchOddsInfo(bet: BetData): Promise<OddsInfo | undefined> {
    try {
      let eventId = bet.game_id;
      let oddId = bet.oddid;

      // If no direct odds info, try SharpSports match
      if (!eventId || !oddId) {
        const { data: match } = await supabase
          .from('sharpsports_bet_matches')
          .select('game_id, odd_id')
          .eq('bet_id', bet.id)
          .single();
        
        eventId = eventId || match?.game_id;
        oddId = oddId || match?.odd_id;
      }

      if (!eventId || !oddId) return undefined;

      const { data: odds } = await supabase
        .from('odds')
        .select('*')
        .eq('eventid', eventId)
        .eq('oddid', oddId)
        .order('fetched_at', { ascending: false })
        .limit(1)
        .single();

      return odds || undefined;
    } catch (error) {
      console.error('Error fetching odds info:', error);
      return undefined;
    }
  }

  static async fetchLineMovement(
    bet: BetData, 
    gameInfo?: GameInfo
  ): Promise<LineMovementPoint[]> {
    try {
      let eventId = bet.game_id || gameInfo?.id;
      let oddId = bet.oddid;

      // If no direct info, try SharpSports match
      if (!eventId || !oddId) {
        const { data: match } = await supabase
          .from('sharpsports_bet_matches')
          .select('game_id, odd_id')
          .eq('bet_id', bet.id)
          .single();
        
        eventId = eventId || match?.game_id;
        oddId = oddId || match?.odd_id;
      }

      if (!eventId || !oddId) return [];

      const { data: lineMovement } = await supabase
        .from('open_odds')
        .select('fetched_at, line, bookodds, closebookodds, sportsbook')
        .eq('eventid', eventId)
        .eq('oddid', oddId)
        .order('fetched_at', { ascending: true });

      return lineMovement || [];
    } catch (error) {
      console.error('Error fetching line movement:', error);
      return [];
    }
  }

  static async fetchStrategies(betId: string): Promise<StrategyInfo[]> {
    try {
      const { data: strategies } = await supabase
        .from('strategy_bets')
        .select(`
          strategies (
            id,
            name,
            description,
            monetized,
            performance_roi,
            performance_win_rate,
            performance_total_bets
          )
        `)
        .eq('bet_id', betId);

      if (!strategies) return [];

      return strategies
        .map(item => item.strategies)
        .filter(strategy => strategy !== null) as StrategyInfo[];
    } catch (error) {
      console.error('Error fetching strategies:', error);
      return [];
    }
  }

  static async fetchSharpSportsMatch(betId: string): Promise<SharpSportsBetMatch | undefined> {
    try {
      const { data: match } = await supabase
        .from('sharpsports_bet_matches')
        .select('*')
        .eq('bet_id', betId)
        .single();

      return match || undefined;
    } catch (error) {
      console.error('Error fetching SharpSports match:', error);
      return undefined;
    }
  }

  // Calculate CLV (Closing Line Value)
  static calculateCLV(
    betOdds: number, 
    closingOdds: number | undefined
  ): number | undefined {
    if (!closingOdds || closingOdds === 0) return undefined;
    
    // Convert American odds to implied probability
    const getImpliedProb = (odds: number): number => {
      if (odds > 0) {
        return 100 / (odds + 100);
      } else {
        return Math.abs(odds) / (Math.abs(odds) + 100);
      }
    };

    const betProb = getImpliedProb(betOdds);
    const closingProb = getImpliedProb(closingOdds);
    
    // CLV = (Closing Probability / Bet Probability) - 1
    return (closingProb / betProb) - 1;
  }

  // Format CLV percentage
  static formatCLV(clv: number | undefined): string {
    if (clv === undefined) return 'N/A';
    const percentage = clv * 100;
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(1)}%`;
  }
}