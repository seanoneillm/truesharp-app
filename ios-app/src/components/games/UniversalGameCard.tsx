import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { supabase } from '../../lib/supabase';
import { performanceMonitor } from '../../lib/supabase-performance';
import OddsModal from './OddsModal';
import { OddsDetailModal } from './OddsDetailModal';
import { useBetSlip } from '../../contexts/BetSlipContext';

// Types
interface Game {
  id: string;
  home_team: string;
  away_team: string;
  home_team_name: string;
  away_team_name: string;
  game_time: string;
  sport: string;
  sport_key?: string; // Add optional sport_key field
  league?: string;
  status?: string;
}

interface DatabaseOdds {
  id: string;
  oddid?: string;
  line?: string;
  sportsbook?: string;
  fanduelodds?: number;
  draftkingsodds?: number;
  espnbetodds?: number;
  ceasarsodds?: number;
  mgmodds?: number;
  fanaticsodds?: number;
  bookodds?: number;
}

interface UniversalGameCardProps {
  game: Game;
  league: string;
  onOddsClick?: (bet: any) => void;
}

// Utility function to format odds
const formatOdds = (odds: number): string => {
  if (!isFinite(odds)) {
    return '+100'; // Default fallback for infinity
  }
  if (odds > 0) {
    return `+${odds}`;
  }
  return odds.toString();
};

// Map league to sport key (matches web app expectations)
const getSportKeyFromLeague = (league: string): string => {
  const mapping: Record<string, string> = {
    'MLB': 'MLB',
    'NFL': 'NFL', 
    'NCAAF': 'NCAAF',
    'NBA': 'NBA',
    'NCAAB': 'NCAAB',
    'NCAAM': 'NCAAB',  // Map NCAAM to NCAAB
    'NCAAMB': 'NCAAB', // Map NCAAMB to NCAAB
    'WNBA': 'WNBA',
    'NHL': 'NHL',
    'Champions League': 'Champions League',
    'MLS': 'MLS',
    // Also handle lowercase versions
    'mlb': 'MLB',
    'nfl': 'NFL', 
    'ncaaf': 'NCAAF',
    'nba': 'NBA',
    'ncaab': 'NCAAB',
    'ncaam': 'NCAAB',  // Map lowercase ncaam to NCAAB
    'ncaamb': 'NCAAB', // Map lowercase ncaamb to NCAAB
    'wnba': 'WNBA',
    'nhl': 'NHL',
    'champions league': 'Champions League',
    'mls': 'MLS',
  };
  
  return mapping[league] || league;
};

// Get best available odds from sportsbook hierarchy
const getBestOdds = (odd: DatabaseOdds): number => {
  return (
    odd.fanduelodds ||
    odd.draftkingsodds ||
    odd.espnbetodds ||
    odd.ceasarsodds ||
    odd.mgmodds ||
    odd.fanaticsodds ||
    odd.bookodds ||
    0
  );
};

// Deduplicate odds for display - optimized for large datasets
// Groups by (oddid, line) and keeps the most recent entry for each group
const deduplicateOddsForDisplay = (odds: DatabaseOdds[]): DatabaseOdds[] => {
  if (!odds || odds.length === 0) return odds;
  
  const startTime = Date.now();
  const oddsMap = new Map<string, DatabaseOdds>();
  
  // Since odds are already ordered by created_at DESC (newest first),
  // we can take the first occurrence of each key as the most recent
  for (const odd of odds) {
    const key = `${odd.oddid || 'unknown'}|${odd.line || 'null'}`;
    
    if (!oddsMap.has(key)) {
      // First (newest) entry for this key due to DESC ordering
      oddsMap.set(key, odd);
    }
    // Skip subsequent (older) entries for the same key
  }
  
  const deduplicated = Array.from(oddsMap.values());
  const processingTime = Date.now() - startTime;
  return deduplicated;
};

// Get team or selection label based on oddid
const getSelectionLabel = (oddid: string, game: Game): string => {
  // ============ MAIN LINES ============
  // Handle moneylines
  if (oddid.includes('points-home-reg-ml-home') || oddid.includes('points-home-game-ml-home') || oddid.includes('-ml-home')) {
    return game.home_team;
  }
  if (oddid.includes('points-away-reg-ml-away') || oddid.includes('points-away-game-ml-away') || oddid.includes('-ml-away')) {
    return game.away_team;
  }
  if (oddid.includes('points-all-reg-ml-draw') || oddid.includes('points-all-reg-ml3way-draw') || oddid.includes('points-all-game-ml-draw') || oddid.includes('-ml-draw')) {
    return 'Draw';
  }
  
  // Handle spreads for both soccer (reg) and other sports (game)
  if (oddid.includes('points-home-reg-sp-home') || oddid.includes('points-home-game-sp-home') || oddid.includes('-sp-home') || oddid.includes('-rl-home')) {
    return game.home_team;
  }
  if (oddid.includes('points-away-reg-sp-away') || oddid.includes('points-away-game-sp-away') || oddid.includes('-sp-away') || oddid.includes('-rl-away')) {
    return game.away_team;
  }
  
  // Handle totals/over-under for main lines
  if (oddid.includes('points-all-reg-ou-over') || oddid.includes('points-all-game-ou-over')) {
    return 'Over';
  }
  if (oddid.includes('points-all-reg-ou-under') || oddid.includes('points-all-game-ou-under')) {
    return 'Under';
  }

  // ============ PLAYER PROPS ============
  // Check if this is a player prop (contains player ID pattern like FIRST_LAST_1_LEAGUE)
  const isPlayerProp = oddid.match(/-[A-Z_]+_1_[A-Z]+-game/) || oddid.match(/\d{4,}/);
  
  if (isPlayerProp) {
    // For player props, check if it's over/under
    if (oddid.includes('-ou-over')) {
      return 'Over';
    }
    if (oddid.includes('-ou-under')) {
      return 'Under';
    }
    // For yes/no props
    if (oddid.includes('-yn-yes')) {
      return 'Yes';
    }
    if (oddid.includes('-yn-no')) {
      return 'No';
    }
    // For other player prop types, try to extract player name
    const playerName = getPlayerName(oddid);
    if (playerName && playerName !== 'Player') {
      return playerName;
    }
  }

  // ============ TEAM PROPS ============
  // Team totals - check for home/away team props
  if (oddid.includes('-home-game-ou-over')) {
    return 'Over';
  }
  if (oddid.includes('-home-game-ou-under')) {
    return 'Under';
  }
  if (oddid.includes('-away-game-ou-over')) {
    return 'Over';
  }
  if (oddid.includes('-away-game-ou-under')) {
    return 'Under';
  }

  // ============ GENERAL OVER/UNDER ============
  // Catch any remaining over/under patterns
  if (oddid.includes('-ou-over')) {
    return 'Over';
  }
  if (oddid.includes('-ou-under')) {
    return 'Under';
  }

  // ============ YES/NO PROPS ============
  if (oddid.includes('-yn-yes')) {
    return 'Yes';
  }
  if (oddid.includes('-yn-no')) {
    return 'No';
  }

  // ============ FALLBACK ============
  return 'Unknown';
};

// Helper function to extract player name from oddid (matches web app logic)
const getPlayerName = (oddid: string): string => {
  // New format: batting_stolenBases-FIRST_LAST_1_MLB-game-ou-over
  // Try multiple patterns to extract player name

  // Pattern 1: Most common - stat_type-FIRST_LAST_1_LEAGUE-game
  let nameMatch = oddid.match(/-([A-Z_]+_1_[A-Z]+)-game/);
  if (nameMatch && nameMatch[1]) {
    // Convert TYLER_FREEMAN_1_MLB to Tyler Freeman
    const parts = nameMatch[1].split('_');
    if (parts.length >= 3) {
      // Take everything except the last two parts (1 and LEAGUE)
      const nameParts = parts.slice(0, -2);
      const playerName = nameParts
        .map(part => part.charAt(0) + part.slice(1).toLowerCase())
        .join(' ');
      return playerName;
    }
  }

  // Pattern 2: Alternative format - try without the _1_LEAGUE suffix
  nameMatch = oddid.match(/-([A-Z_]+)-game/);
  if (nameMatch && nameMatch[1] && nameMatch[1].includes('_')) {
    const playerName = nameMatch[1]
      .split('_')
      .map(part => part.charAt(0) + part.slice(1).toLowerCase())
      .join(' ');
    return playerName;
  }

  // Pattern 3: Numeric player ID fallback
  nameMatch = oddid.match(/(\d{4,})/);
  if (nameMatch && nameMatch[1]) {
    return `Player ${nameMatch[1]}`;
  }

  return 'Player';
};

// Helper function to get prop display name from oddid
const getPropDisplayName = (oddid: string): string => {
  const lowerOddid = oddid.toLowerCase();

  // Baseball props
  if (lowerOddid.includes('batting_hits')) return 'Hits';
  if (lowerOddid.includes('batting_homeruns') || lowerOddid.includes('batting_homerun')) return 'Home Runs';
  if (lowerOddid.includes('batting_rbi')) return 'RBIs';
  if (lowerOddid.includes('batting_runs')) return 'Runs';
  if (lowerOddid.includes('batting_totalbases')) return 'Total Bases';
  if (lowerOddid.includes('batting_strikeouts')) return 'Strikeouts';
  if (lowerOddid.includes('batting_stolenbases')) return 'Stolen Bases';
  if (lowerOddid.includes('batting_singles')) return 'Singles';
  if (lowerOddid.includes('batting_doubles')) return 'Doubles';
  if (lowerOddid.includes('batting_triples')) return 'Triples';
  if (lowerOddid.includes('batting_basesonballs')) return 'Walks';
  if (lowerOddid.includes('pitching_strikeouts')) return 'Strikeouts';
  if (lowerOddid.includes('pitching_hits')) return 'Hits Allowed';
  if (lowerOddid.includes('pitching_earnedruns')) return 'Earned Runs';
  if (lowerOddid.includes('pitching_basesonballs')) return 'Walks Allowed';

  // Football props
  if (lowerOddid.includes('passing_yards')) return 'Passing Yards';
  if (lowerOddid.includes('rushing_yards')) return 'Rushing Yards';
  if (lowerOddid.includes('receiving_yards')) return 'Receiving Yards';
  if (lowerOddid.includes('passing_touchdowns')) return 'Passing TDs';
  if (lowerOddid.includes('rushing_touchdowns')) return 'Rushing TDs';
  if (lowerOddid.includes('receiving_touchdowns')) return 'Receiving TDs';
  if (lowerOddid.startsWith('touchdowns-')) return 'Touchdowns';
  if (lowerOddid.includes('receiving_receptions')) return 'Receptions';
  if (lowerOddid.includes('passing_completions')) return 'Completions';
  if (lowerOddid.includes('passing_interceptions')) return 'Interceptions';

  // Basketball props
  if (lowerOddid.includes('points') && !lowerOddid.includes('team') && !lowerOddid.includes('game')) return 'Points';
  if (lowerOddid.includes('rebounds')) return 'Rebounds';
  if (lowerOddid.includes('assists')) return 'Assists';
  if (lowerOddid.includes('steals')) return 'Steals';
  if (lowerOddid.includes('blocks')) return 'Blocks';
  if (lowerOddid.includes('threepointers_made')) return '3-Pointers Made';
  if (lowerOddid.includes('fieldgoals_made')) return 'Field Goals Made';
  if (lowerOddid.includes('freethrows_made')) return 'Free Throws Made';

  // Hockey props
  if (lowerOddid.includes('goals')) return 'Goals';
  if (lowerOddid.includes('saves')) return 'Saves';
  if (lowerOddid.includes('shots_ongoal')) return 'Shots on Goal';

  // Soccer props
  if (lowerOddid.includes('shots')) return 'Shots';
  if (lowerOddid.includes('shots_ontarget')) return 'Shots on Target';
  if (lowerOddid.includes('tackles')) return 'Tackles';
  if (lowerOddid.includes('clearances')) return 'Clearances';

  return 'Prop';
};

// Create enhanced bet description for better display
const createBetDescription = (oddid: string, selection: string, odds: number, line?: string, homeTeam?: string, awayTeam?: string): string => {
  const formattedOdds = formatOdds(odds);
  
  // Check if this is a player prop
  const isPlayerProp = oddid.match(/-[A-Z_]+_1_[A-Z]+-game/) || oddid.match(/\d{4,}/);
  
  if (isPlayerProp) {
    const playerName = getPlayerName(oddid);
    const propName = getPropDisplayName(oddid);
    
    if (playerName !== 'Player' && propName !== 'Prop') {
      // For over/under props with lines
      if ((selection === 'Over' || selection === 'Under') && line) {
        return `${playerName} ${propName} ${selection} ${line}`;
      }
      // For over/under props without lines
      else if (selection === 'Over' || selection === 'Under') {
        return `${playerName} ${propName} ${selection}`;
      }
      // For yes/no props
      else if (selection === 'Yes' || selection === 'No') {
        return `${playerName} ${propName} ${selection}`;
      }
      // For other prop types
      else {
        return `${playerName} ${propName}`;
      }
    }
  }
  
  // For main lines - use team names
  if (oddid.includes('-ml-') && homeTeam && awayTeam) {
    // Moneyline
    if (oddid.includes('-ml-home') && homeTeam !== 'Home') {
      return `${homeTeam} Moneyline`;
    }
    if (oddid.includes('-ml-away') && awayTeam !== 'Away') {
      return `${awayTeam} Moneyline`;
    }
  }
  
  if ((oddid.includes('-sp-') || oddid.includes('-rl-')) && homeTeam && awayTeam) {
    // Spread
    const teamName = oddid.includes('-sp-home') || oddid.includes('-rl-home') ? homeTeam : awayTeam;
    if (teamName !== 'Home' && teamName !== 'Away' && line) {
      const lineNum = parseFloat(line);
      return `${teamName} ${lineNum > 0 ? '+' : ''}${line}`;
    }
  }
  
  if (oddid.includes('-ou-')) {
    // Totals
    if (line) {
      return `${selection} ${line}`;
    }
    return `${selection}`;
  }
  
  // For main lines (spreads with lines)
  if ((selection.includes('Team') || oddid.includes('-sp-') || oddid.includes('-rl-')) && line) {
    const lineNum = parseFloat(line);
    return `${selection} ${lineNum > 0 ? '+' : ''}${line}`;
  }
  
  // Default format
  return `${selection}`;
};

// Format line for spread/total display
const formatLine = (line: string | undefined, oddid: string): string => {
  if (!line) return '';
  
  if (oddid.includes('-sp-') || oddid.includes('-rl-')) {
    const numLine = parseFloat(line);
    return numLine > 0 ? `+${numLine}` : numLine.toString();
  }
  
  return line;
};

export default function UniversalGameCard({ game, league, onOddsClick }: UniversalGameCardProps) {
  const [odds, setOdds] = useState<DatabaseOdds[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isOddsDetailModalVisible, setIsOddsDetailModalVisible] = useState(false);
  const [selectedOddsDetail, setSelectedOddsDetail] = useState<{
    eventId: string;
    oddId: string;
    marketName: string;
    playerName?: string;
    teamName?: string;
    line?: string;
    currentOdds: number;
  } | null>(null);
  const { addBet } = useBetSlip();

  // Fetch odds from Supabase
  useEffect(() => {
    const fetchOdds = async () => {
      if (!game.id) return;

      try {
        setIsLoading(true);
        setError(null);

        // RATE LIMITING: Wait for available slot
        await performanceMonitor.waitForSlot();
        
        const globalStart = performanceMonitor.startQuery();
        const startTime = Date.now();
        // PERFORMANCE: Track timing and add timeout (increased to 30s)
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout')), 30000) // 30 second timeout
        );

        const queryPromise = (async () => {
          // OPTIMIZED: Only fetch main line odds for card display to avoid timeouts
          // Get the 6 main oddid patterns that are displayed on the card
          const isSoccer = league === 'Champions League' || league === 'MLS';
          
          const mainLineOddIds = isSoccer ? [
            'points-away-reg-ml-away',    // Away ML (soccer 2-way)
            'points-home-reg-ml-home',    // Home ML (soccer 2-way)  
            'points-all-reg-ml3way-draw', // Draw (soccer 3-way)
            'points-away-reg-sp-away',    // Away spread
            'points-home-reg-sp-home',    // Home spread
            'points-all-reg-ou-over',     // Total over
            'points-all-reg-ou-under'     // Total under
          ] : [
            'points-away-game-ml-away',   // Away ML
            'points-home-game-ml-home',   // Home ML
            'points-away-game-sp-away',   // Away spread
            'points-home-game-sp-home',   // Home spread
            'points-all-game-ou-over',    // Total over
            'points-all-game-ou-under'    // Total under
          ];
          // Fetch only the main line odds with a single query
          const { data: mainOdds, error: oddsError } = await supabase
            .from('odds')
            .select('*')
            .eq('eventid', game.id)
            .in('oddid', mainLineOddIds)
            .order('created_at', { ascending: false });
          
          if (oddsError) {
            console.error(`❌ [${game.id}] Error fetching main odds:`, oddsError);
            throw oddsError;
          }

          if (!mainOdds || mainOdds.length === 0) {
            return [];
          }

          const fetchTime = Date.now() - startTime;
          return mainOdds;
        })();

        const result = await Promise.race([queryPromise, timeoutPromise]);
        const totalTime = Date.now() - startTime;
        
        performanceMonitor.endQuery(globalStart);
        // Deduplicate main line odds for clean display (minimal processing since we only fetch main lines)
        const deduplicatedOdds = deduplicateOddsForDisplay(result);
        setOdds(deduplicatedOdds);
      } catch (err) {
        console.error('Error fetching odds:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOdds();
  }, [game.id]);

  // Helper function to find main line (odds closest to ±100) from alternate lines
  const findMainLine = (oddsList: DatabaseOdds[]): DatabaseOdds | undefined => {
    if (oddsList.length === 0) return undefined;
    if (oddsList.length === 1) return oddsList[0];
    
    // Find the line with odds closest to ±100 (even odds)
    let mainLine = oddsList[0];
    let bestDistance = Infinity;
    
    for (const odd of oddsList) {
      const oddsValue = getBestOdds(odd);
      if (oddsValue) {
        // Calculate distance from even odds (closer to ±100 is main)
        const distance = Math.abs(Math.abs(oddsValue) - 100);
        if (distance < bestDistance) {
          bestDistance = distance;
          mainLine = odd;
        }
      }
    }
    
    return mainLine;
  };

  // Get main lines odds with proper structure for two-row layout
  const getMainLinesOdds = () => {
    // Group odds by oddid to handle alternates (all lines with same oddid)
    const oddsByOddId = new Map<string, DatabaseOdds[]>();

    odds.forEach(odd => {
      if (odd.oddid) {
        if (!oddsByOddId.has(odd.oddid)) {
          oddsByOddId.set(odd.oddid, []);
        }
        oddsByOddId.get(odd.oddid)!.push(odd);
      }
    });

    // Determine if this is soccer (Champions League or MLS)
    const isSoccer = league === 'Champions League' || league === 'MLS';

    // For soccer, use different oddid patterns
    let awayMLOptions, homeMLOptions, awaySpreadOptions, homeSpreadOptions, totalOverOptions, totalUnderOptions;
    
    if (isSoccer) {
      // Soccer uses reg-ml patterns for 2-way moneyline in universal card
      awayMLOptions = oddsByOddId.get('points-away-reg-ml-away') || [];
      homeMLOptions = oddsByOddId.get('points-home-reg-ml-home') || [];
      // Soccer totals and spreads may still use the game patterns - check both
      awaySpreadOptions = oddsByOddId.get('points-away-game-sp-away') || oddsByOddId.get('points-away-reg-sp-away') || [];
      homeSpreadOptions = oddsByOddId.get('points-home-game-sp-home') || oddsByOddId.get('points-home-reg-sp-home') || [];
      totalOverOptions = oddsByOddId.get('points-all-game-ou-over') || oddsByOddId.get('points-all-reg-ou-over') || [];
      totalUnderOptions = oddsByOddId.get('points-all-game-ou-under') || oddsByOddId.get('points-all-reg-ou-under') || [];
    } else {
      // Other sports use game-ml patterns  
      awayMLOptions = oddsByOddId.get('points-away-game-ml-away') || [];
      homeMLOptions = oddsByOddId.get('points-home-game-ml-home') || [];
      awaySpreadOptions = oddsByOddId.get('points-away-game-sp-away') || [];
      homeSpreadOptions = oddsByOddId.get('points-home-game-sp-home') || [];
      totalOverOptions = oddsByOddId.get('points-all-game-ou-over') || [];
      totalUnderOptions = oddsByOddId.get('points-all-game-ou-under') || [];
    }

    return {
      awayML: findMainLine(awayMLOptions),
      homeML: findMainLine(homeMLOptions),
      awaySpread: findMainLine(awaySpreadOptions),
      homeSpread: findMainLine(homeSpreadOptions),
      totalOver: findMainLine(totalOverOptions),
      totalUnder: findMainLine(totalUnderOptions),
    };
  };

  // Get unique odds array for all use cases
  const uniqueOdds = new Map();
  odds.forEach(odd => {
    if (odd.oddid && !uniqueOdds.has(odd.oddid)) {
      uniqueOdds.set(odd.oddid, odd);
    }
  });
  const uniqueOddsArray = Array.from(uniqueOdds.values());
  
  const { awayML, homeML, awaySpread, homeSpread, totalOver, totalUnder } = getMainLinesOdds();

  // Check if game has started (with 10-minute buffer)
  const gameStartTime = new Date(game.game_time);
  const now = new Date();
  const bufferTime = 10 * 60 * 1000; // 10 minutes
  const isGameStarted = now.getTime() >= gameStartTime.getTime() + bufferTime;

  const handleOddsPress = (odd: DatabaseOdds) => {
    if (isGameStarted) {
      Alert.alert('Game Started', 'Betting is no longer available for this game.');
      return;
    }

    // Open the odds detail modal
    const marketName = getMarketType(odd.oddid || '');
    let playerName: string | undefined;
    let teamName: string | undefined;

    // Determine if this is a player prop, team prop, or main line
    if (odd.oddid?.includes('-home-')) {
      teamName = game.home_team;
    } else if (odd.oddid?.includes('-away-')) {
      teamName = game.away_team;
    } else if (odd.oddid && !odd.oddid.includes('-all-') && !odd.oddid.includes('-ml-') && !odd.oddid.includes('-sp-') && !odd.oddid.includes('-ou-')) {
      // Extract player name from oddid for player props
      const parts = odd.oddid.split('-');
      if (parts.length >= 2) {
        const playerPart = parts[1];
        playerName = playerPart
          .replace(/_/g, ' ')
          .replace(/([a-z])([A-Z])/g, '$1 $2')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ')
          .replace(/\s+\d+\s+(mlb|nba|nfl|nhl|wnba|ncaaf|ncaab|mls)$/gi, '');
      }
    }

    setSelectedOddsDetail({
      eventId: game.id,
      oddId: odd.oddid || '',
      marketName,
      playerName,
      teamName,
      line: odd.line || undefined,
      currentOdds: getBestOdds(odd),
    });
    setIsOddsDetailModalVisible(true);
  };

  const handleBetClick = (odd: DatabaseOdds) => {
    if (isGameStarted) {
      Alert.alert('Game Started', 'Betting is no longer available for this game.');
      return;
    }

    const oddsValue = getBestOdds(odd);
    const selection = getSelectionLabel(odd.oddid || '', game);
    
    // Don't allow bets with no odds
    if (!oddsValue || oddsValue === 0) {
      Alert.alert('No Odds Available', 'This bet does not have valid odds available.');
      return;
    }

    // Don't allow bets with no selection
    if (!selection || selection === '') {
      Alert.alert('Invalid Selection', 'Unable to determine bet selection.');
      return;
    }
    
    // Determine proper team names with better fallbacks for description
    const homeTeamForDescription = game.home_team || game.home_team_name || 'Home';
    const awayTeamForDescription = game.away_team || game.away_team_name || 'Away';
    
    // Create enhanced description for better bet slip display
    const enhancedDescription = createBetDescription(
      odd.oddid || '', 
      selection, 
      oddsValue, 
      odd.line, 
      homeTeamForDescription, 
      awayTeamForDescription
    );
    
    // Determine proper sport value with better fallbacks
    const determineSport = (): string => {
      // First try game.sport
      if (game.sport && game.sport !== 'unknown') {
        return game.sport;
      }
      
      // Then try sport_key
      if (game.sport_key) {
        return game.sport_key;
      }
      
      // Then try converting league to sport
      if (league) {
        const sportFromLeague = getSportKeyFromLeague(league);
        if (sportFromLeague && sportFromLeague !== 'unknown') {
          return sportFromLeague;
        }
        // Direct league mapping
        return league;
      }
      
      return 'unknown';
    };

    // Determine proper team names with better fallbacks
    const determineHomeTeam = (): string => {
      return game.home_team || game.home_team_name || 'Home';
    };

    const determineAwayTeam = (): string => {
      return game.away_team || game.away_team_name || 'Away';
    };

    const bet = {
      id: `${game.id}-${odd.oddid}-${Date.now()}`,
      gameId: game.id,
      sport: determineSport(),
      marketType: odd.oddid || '',
      selection: selection,
      odds: oddsValue,
      line: odd.line && odd.line !== null ? parseFloat(odd.line) : undefined,
      sportsbook: 'TrueSharp',
      description: enhancedDescription,
      homeTeam: determineHomeTeam(),
      awayTeam: determineAwayTeam(),
      gameTime: game.game_time,
    };

    // Debug logging
    const result = addBet(bet);
    if (result.success) {
      Alert.alert('Bet Added!', 'Bet has been added to your slip');
    } else {
      Alert.alert('Cannot Add Bet', result.error || 'Failed to add bet');
    }
  };

  const getMarketType = (oddid: string): string => {
    if (oddid.includes('-ml-')) return 'Moneyline';
    if (oddid.includes('-sp-') || oddid.includes('-rl-')) return 'Spread';
    if (oddid.includes('-ou-')) return 'Total';
    return 'Unknown';
  };

  const renderOddsButton = (odd: DatabaseOdds | undefined, showLine: boolean = false) => {
    if (!odd) {
      return (
        <TouchableOpacity style={styles.oddsButtonEmpty} disabled>
          <Text style={styles.oddsValueEmpty}>-</Text>
        </TouchableOpacity>
      );
    }

    const oddsValue = getBestOdds(odd);
    const lineValue = showLine ? formatLine(odd.line, odd.oddid || '') : '';
    
    if (isGameStarted) {
      return (
        <TouchableOpacity
          style={styles.oddsButtonDisabled}
          disabled={true}
          activeOpacity={1}
        >
          {showLine ? (
            <>
              <View style={styles.lineContainer}>
                <Text style={[styles.oddsLine, styles.lineDisabled]}>
                  {lineValue || ''}
                </Text>
              </View>
              <View style={styles.oddsValueContainer}>
                <Text style={[styles.oddsValue, styles.textDisabled]}>
                  {oddsValue ? formatOdds(oddsValue) : '-'}
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.oddsValueContainerAbsolute}>
              <Text style={[styles.oddsValue, styles.textDisabled]}>
                {oddsValue ? formatOdds(oddsValue) : '-'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      );
    }
    
    return (
      <TouchableOpacity
        style={styles.oddsButtonContainer}
        onPress={() => handleOddsPress(odd)}
        disabled={isGameStarted}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#3b82f6', '#1d4ed8']}
          style={styles.oddsButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {showLine ? (
            <>
              <View style={styles.lineContainer}>
                <Text style={styles.oddsLine}>
                  {lineValue || ''}
                </Text>
              </View>
              <View style={styles.oddsValueContainer}>
                <Text style={styles.oddsValue}>
                  {oddsValue ? formatOdds(oddsValue) : '-'}
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.oddsValueContainerAbsolute}>
              <Text style={styles.oddsValue}>
                {oddsValue ? formatOdds(oddsValue) : '-'}
              </Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const handleSeeMorePress = () => {
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading odds...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error loading odds</Text>
      </View>
    );
  }

  // Format game time
  const formatGameTime = (gameTime: string): string => {
    const date = new Date(gameTime);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Get sport-specific column headers
  const getColumnHeaders = () => {
    const sport = game.sport?.toLowerCase() || '';
    const league = game.league?.toLowerCase() || '';
    
    if (sport.includes('baseball') || league === 'mlb') {
      return { second: 'RUN LINE', third: 'TOTAL' };
    } else if (sport.includes('hockey') || league === 'nhl') {
      return { second: 'PUCK LINE', third: 'TOTAL' };
    } else if (sport.includes('soccer') || league === 'mls' || league === 'champions league') {
      return { second: 'TIE', third: 'TOTAL' };
    } else {
      // Football, basketball, etc.
      return { second: 'SPREAD', third: 'TOTAL' };
    }
  };

  const headers = getColumnHeaders();
  const isSoccer = headers.second === 'TIE';

  return (
    <View style={styles.container}>
      {/* Game Time - Top Left */}
      <View style={styles.timeContainer}>
        <Text style={styles.gameTime}>{formatGameTime(game.game_time)}</Text>
      </View>
      
      {/* Two-Row Layout */}
      <View style={styles.oddsGrid}>
        {/* Column Headers */}
        <View style={styles.headerRow}>
          <View style={styles.teamColumn}></View>
          <View style={styles.oddsColumn}>
            <Text style={styles.columnHeader}>ML</Text>
          </View>
          <View style={styles.oddsColumn}>
            <Text style={styles.columnHeader}>{headers.second}</Text>
          </View>
          <View style={styles.oddsColumn}>
            <Text style={styles.columnHeader}>{headers.third}</Text>
          </View>
        </View>

        {/* Away Team Row */}
        <View style={styles.teamRow}>
          <Text style={styles.teamLabel} numberOfLines={2} ellipsizeMode="tail">{game.away_team}</Text>
          {renderOddsButton(awayML)}
          {isSoccer ? renderOddsButton(uniqueOddsArray.find(odd => odd.oddid === 'points-all-reg-ml3way-draw')) : renderOddsButton(awaySpread, true)}
          {renderOddsButton(totalOver, true)}
        </View>

        {/* Home Team Row */}
        <View style={styles.teamRow}>
          <Text style={styles.teamLabel} numberOfLines={2} ellipsizeMode="tail">{game.home_team}</Text>
          {renderOddsButton(homeML)}
          {isSoccer ? renderOddsButton(uniqueOddsArray.find(odd => odd.oddid === 'points-all-reg-ml3way-draw')) : renderOddsButton(homeSpread, true)}
          {renderOddsButton(totalUnder, true)}
        </View>
      </View>

      {/* See More Odds Button */}
      <TouchableOpacity
        style={styles.seeMoreButton}
        onPress={handleSeeMorePress}
        activeOpacity={0.7}
      >
        <Text style={styles.seeMoreText}>See more odds</Text>
        <Ionicons name="chevron-down" size={16} color={theme.colors.text.secondary} />
      </TouchableOpacity>

      {/* Odds Modal */}
      <OddsModal
        isVisible={isModalVisible}
        onClose={handleCloseModal}
        game={game}
        league={league}
      />

      {/* Odds Detail Modal */}
      {selectedOddsDetail && (
        <OddsDetailModal
          visible={isOddsDetailModalVisible}
          onClose={() => setIsOddsDetailModalVisible(false)}
          eventId={selectedOddsDetail.eventId}
          oddId={selectedOddsDetail.oddId}
          marketName={selectedOddsDetail.marketName}
          playerName={selectedOddsDetail.playerName}
          teamName={selectedOddsDetail.teamName}
          line={selectedOddsDetail.line}
          currentOdds={selectedOddsDetail.currentOdds}
          gameTime={game.game_time}
          homeTeam={game.home_team}
          awayTeam={game.away_team}
          sport={game.sport}
          league={league}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.sm,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  
  // Game Time
  timeContainer: {
    position: 'absolute',
    top: theme.spacing.xs,
    left: theme.spacing.xs,
    zIndex: 1,
  },
  gameTime: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
  },
  
  // Loading & Error States
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.sm,
  },
  loadingText: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  errorContainer: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    alignItems: 'center',
  },
  errorText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.status.error,
  },

  // Two-Row Layout
  oddsGrid: {
    marginVertical: theme.spacing.xs,
  },
  
  // Header Row
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: theme.spacing.xs / 2,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginBottom: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  teamColumn: {
    flex: 2,
  },
  oddsColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: theme.spacing.xs,
  },
  columnHeader: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  
  // Team Rows
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    minHeight: 32,
  },
  teamLabel: {
    flex: 2,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    paddingRight: theme.spacing.sm,
    lineHeight: theme.typography.fontSize.xs * 1.2,
  },
  
  // Odds Buttons
  oddsButtonContainer: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
  oddsButton: {
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  oddsButtonDisabled: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
    marginHorizontal: theme.spacing.xs,
    opacity: 0.6,
  },
  oddsButtonEmpty: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    marginHorizontal: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
    opacity: 0.3,
  },
  lineContainer: {
    minHeight: 14, // Reserve space for line text even when empty
    justifyContent: 'center',
    alignItems: 'center',
  },
  oddsLine: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.inverse,
    textAlign: 'center',
  },
  oddsValueContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  oddsValueContainerAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  oddsValue: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.inverse,
    textAlign: 'center',
  },
  oddsValueEmpty: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.light,
    textAlign: 'center',
  },
  textDisabled: {
    color: theme.colors.text.secondary,
  },
  lineDisabled: {
    color: theme.colors.text.light,
  },
  
  // See More Button
  seeMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: theme.spacing.sm,
  },
  seeMoreText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
    marginRight: theme.spacing.xs,
  },
  
  // No Odds State
  noOddsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
  },
  noOddsText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});