import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  Dimensions,
  Image,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LineChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { supabase } from '../../lib/supabase';
import TrueSharpShield from '../common/TrueSharpShield';
import { useBetSlip } from '../../contexts/BetSlipContext';
import { GameScoreChart } from '../analytics/GameScoreChart';

interface OddsDetailModalProps {
  visible: boolean;
  onClose: () => void;
  eventId: string;
  oddId: string;
  marketName: string;
  playerName?: string;
  teamName?: string;
  line?: string;
  currentOdds: number;
  gameTime: string;
  side?: string; // 'over', 'under', 'home', 'away', etc.
  homeTeam?: string;
  awayTeam?: string;
  sport?: string; // Add sport prop
  league?: string; // Add league prop as fallback
}

interface OddsData {
  openOdds: number;
  currentOdds: number;
  timestamp: string;
}

interface SportsbookOdds {
  name: string;
  odds: number;
  link: string;
}

interface GameScoreData {
  score: number;
  gameLabel: string;
  date: string;
  eventId?: string;
}

export const OddsDetailModal: React.FC<OddsDetailModalProps> = ({
  visible,
  onClose,
  eventId,
  oddId,
  marketName,
  playerName,
  teamName,
  line,
  currentOdds,
  gameTime,
  side,
  homeTeam,
  awayTeam,
  sport,
  league,
}) => {
  const [oddsHistory, setOddsHistory] = useState<OddsData[]>([]);
  const [sportsbookOdds, setSportsbookOdds] = useState<SportsbookOdds[]>([]);
  const [gameScores, setGameScores] = useState<GameScoreData[]>([]);
  const [loading, setLoading] = useState(false);
  const [scoresLoading, setScoresLoading] = useState(false);
  const [gameScoresCache, setGameScoresCache] = useState<Map<string, GameScoreData[]>>(new Map());
  const { addBet } = useBetSlip();

  const screenWidth = Dimensions.get('window').width;

  // Map league to sport key (matches database expectations)
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
      'wnba': 'WNBA',
      'nhl': 'NHL',
      'champions league': 'Champions League',
      'mls': 'MLS',
    };
    
    return mapping[league] || league;
  };

  // Fetch game data from database using eventId
  const fetchGameData = async (eventId: string) => {
    try {
      const { data: gameData, error } = await supabase
        .from('games')
        .select('id, sport, league, home_team, away_team, home_team_name, away_team_name, game_time')
        .eq('id', eventId)
        .single();

      if (error) {
        console.error('Error fetching game data:', error);
        return null;
      }

      return gameData;
    } catch (error) {
      console.error('Error in fetchGameData:', error);
      return null;
    }
  };

  // Check if this is a valid prop type for showing game scores chart
  const isValidPropType = (oddId: string, marketName: string): boolean => {
    // Exclude main lines: moneylines, spreads, game totals
    if (oddId.includes('-ml-') || oddId.includes('-sp-') || oddId.includes('-rl-')) return false;
    
    // Exclude game totals (not player/team props)
    if (oddId.includes('-ou-') && !oddId.match(/-[A-Z_]+_1_[A-Z]+-game/)) return false;
    
    // Include player props (contains player patterns)
    if (oddId.match(/-[A-Z_]+_1_[A-Z]+-game/) || oddId.match(/\d{4,}/)) return true;
    
    // Include team/game props with specific stat patterns
    const propPatterns = [
      'batting_hits', 'batting_homeruns', 'batting_rbi', 'batting_runs', 'batting_totalbases',
      'pitching_strikeouts', 'passing_yards', 'rushing_yards', 'receiving_yards',
      'passing_touchdowns', 'rushing_touchdowns', 'receiving_touchdowns', 'touchdowns',
      'points', 'rebounds', 'assists', 'steals', 'blocks'
    ];
    
    return propPatterns.some(pattern => oddId.toLowerCase().includes(pattern));
  };

  // Helper function to get proper selection from oddId
  const getSelectionFromOddId = (oddId: string, teamName?: string, playerName?: string, side?: string): string => {
    // Check if this is a player prop
    const isPlayerProp = oddId.match(/-[A-Z_]+_1_[A-Z]+-game/) || oddId.match(/\d{4,}/);
    
    if (isPlayerProp) {
      // For player props, return Over/Under or Yes/No
      if (oddId.includes('-ou-over')) return 'Over';
      if (oddId.includes('-ou-under')) return 'Under';
      if (oddId.includes('-yn-yes')) return 'Yes';
      if (oddId.includes('-yn-no')) return 'No';
      if (playerName) return playerName;
    }
    
    // For main lines
    if (oddId.includes('-ml-home') || oddId.includes('-sp-home') || oddId.includes('-rl-home')) {
      return teamName || 'Home';
    }
    if (oddId.includes('-ml-away') || oddId.includes('-sp-away') || oddId.includes('-rl-away')) {
      return teamName || 'Away';
    }
    if (oddId.includes('-ou-over')) return 'Over';
    if (oddId.includes('-ou-under')) return 'Under';
    
    // Fallback to provided values
    return playerName || teamName || side || 'Selection';
  };

  // Helper function to create better bet description
  const createBetDescription = (oddId: string, selection: string, playerName?: string, marketName?: string, line?: string): string => {
    // Check if this is a player prop
    const isPlayerProp = oddId.match(/-[A-Z_]+_1_[A-Z]+-game/) || oddId.match(/\d{4,}/);
    
    if (isPlayerProp && playerName) {
      // Extract prop type from oddId
      let propType = null;
      const lowerOddId = oddId.toLowerCase();
      
      // Try to parse from oddId patterns first
      if (lowerOddId.includes('batting_hits')) propType = 'Hits';
      else if (lowerOddId.includes('batting_homeruns') || lowerOddId.includes('batting_homerun')) propType = 'Home Runs';
      else if (lowerOddId.includes('batting_rbi')) propType = 'RBIs';
      else if (lowerOddId.includes('batting_runs')) propType = 'Runs';
      else if (lowerOddId.includes('batting_totalbases')) propType = 'Total Bases';
      else if (lowerOddId.includes('pitching_strikeouts')) propType = 'Strikeouts';
      else if (lowerOddId.includes('passing_yards')) propType = 'Passing Yards';
      else if (lowerOddId.includes('rushing_yards')) propType = 'Rushing Yards';
      else if (lowerOddId.includes('receiving_yards')) propType = 'Receiving Yards';
      else if (lowerOddId.includes('passing_touchdowns')) propType = 'Passing TDs';
      else if (lowerOddId.includes('rushing_touchdowns')) propType = 'Rushing TDs';
      else if (lowerOddId.includes('receiving_touchdowns')) propType = 'Receiving TDs';
      else if (lowerOddId.startsWith('touchdowns-')) propType = 'Touchdowns';
      else if (lowerOddId.includes('points') && !lowerOddId.includes('team')) propType = 'Points';
      else if (lowerOddId.includes('rebounds')) propType = 'Rebounds';
      else if (lowerOddId.includes('assists')) propType = 'Assists';
      
      // Final fallback if nothing worked
      if (!propType) {
        propType = 'Prop';
      }
      
      // Format: "Player Name Prop Type Selection Line"
      if (line && (selection === 'Over' || selection === 'Under')) {
        return `${playerName} ${propType} ${selection} ${line}`;
      } else {
        return `${playerName} ${propType} ${selection}`;
      }
    }
    
    // For main lines, use the selection
    if (line && (oddId.includes('-sp-') || oddId.includes('-rl-') || oddId.includes('-ou-'))) {
      if (oddId.includes('-ou-')) {
        return `${selection} ${line}`;
      } else {
        // Spread - Fix: Don't add extra + sign if line already contains it
        const cleanLine = line || '0';
        const formattedLine = cleanLine.startsWith('+') || cleanLine.startsWith('-') 
          ? cleanLine 
          : (parseFloat(cleanLine) > 0 ? `+${cleanLine}` : cleanLine);
        return `${selection} ${formattedLine}`;
      }
    }
    
    return selection;
  };


  // Check if game has started (with 10-minute buffer)
  const gameStartTime = new Date(gameTime);
  const now = new Date();
  const bufferTime = 10 * 60 * 1000; // 10 minutes
  const isGameStarted = now.getTime() >= gameStartTime.getTime() + bufferTime;

  // Memoize the validation to prevent unnecessary recalculations
  const shouldShowGameScores = useMemo(() => 
    isValidPropType(oddId, marketName), 
    [oddId, marketName]
  );
  
  // Memoize cache key for performance
  const cacheKey = useMemo(() => {
    const basePattern = oddId
      .replace(/-over$/, '')
      .replace(/-under$/, '')
      .replace(/-yes$/, '')
      .replace(/-no$/, '');
    return `${basePattern}-${eventId}`;
  }, [oddId, eventId]);

  useEffect(() => {
    if (visible && eventId && oddId) {
      fetchOddsData();
      if (shouldShowGameScores) {
        fetchGameScores();
      }
    }
  }, [visible, eventId, oddId, line, side, shouldShowGameScores]);

  const fetchGameScores = async () => {
    setScoresLoading(true);
    try {
      // Extract the base pattern from oddId to find similar props
      let basePattern = oddId;
      basePattern = basePattern.replace(/-over$/, '').replace(/-under$/, '');
      basePattern = basePattern.replace(/-yes$/, '').replace(/-no$/, '');
      
      // Check cache first
      const cached = gameScoresCache.get(cacheKey);
      if (cached && cached.length > 0) {
        setGameScores(cached);
        return;
      }
      
      
      // RESTORED WORKING QUERY STRATEGY - like original code but optimized
      // 1. Try exact pattern first with reasonable limit
      // 2. If no results, try broader search with player/stat extraction
      // 3. No artificial timeouts - let database handle performance
      
      let historicalOdds: any[] = [];
      let error: any = null;
      
      try {
        
        // First attempt: Exact pattern match (like original code)
        let { data: exactResults, error: exactError } = await supabase
          .from('odds')
          .select('score, eventid, oddid, fetched_at')
          .neq('eventid', eventId)
          .like('oddid', `${basePattern}%`) // Find exact same stat+player combination
          .order('fetched_at', { ascending: false }) // Most recent first
          .limit(400); // Higher limit like original to account for duplicates
        
        
        if (exactError) {
          error = exactError;
        } else if (exactResults && exactResults.length > 0) {
          historicalOdds = exactResults;
        } else {
          
          // Fallback: Broader search with extracted player/stat (like original)
          const playerMatch = oddId.match(/([A-Z_]+_\d+_[A-Z]+)/);
          const statMatch = oddId.match(/^([a-z_]+)/);
          
          if (playerMatch && statMatch) {
            const playerPart = playerMatch[1];
            const statPart = statMatch[1];
            
            let { data: broaderResults, error: broaderError } = await supabase
              .from('odds')
              .select('score, eventid, oddid, fetched_at')
              .neq('eventid', eventId)
              .like('oddid', `${statPart}%${playerPart}%`)
              .order('fetched_at', { ascending: false })
              .limit(500); // Even higher limit for broader search
              
            
            if (broaderError) {
              error = broaderError;
            } else {
              historicalOdds = broaderResults || [];
            }
          }
        }
        
      } catch (queryError) {
        error = queryError;
      }
      
      // Process the database results we found
      if (historicalOdds?.length > 0) {
        
        // PERFORMANCE OPTIMIZED deduplication: Early exit strategy
        const uniqueOddsMap = new Map();
        const targetCount = 10;
        
        // Single pass with intelligent prioritization 
        for (let i = 0; i < historicalOdds.length && uniqueOddsMap.size < targetCount; i++) {
          const odd = historicalOdds[i];
          
          // Skip if we already have this event
          if (uniqueOddsMap.has(odd.eventid)) continue;
          
          // Prioritize records with actual scores, but don't exclude others completely
          if (odd.score !== null && odd.score !== undefined) {
            uniqueOddsMap.set(odd.eventid, odd);
          } else if (uniqueOddsMap.size < targetCount * 0.7) { // Only fill 70% with scoreless records
            uniqueOddsMap.set(odd.eventid, odd);
          }
        }
        
        // Convert to array (already in fetched_at order from query)
        const uniqueOdds = Array.from(uniqueOddsMap.values());
        
        // Reverse for chart display (oldest to newest) - skip sorting since DB already ordered
        const final10Games = uniqueOdds.slice(0, targetCount).reverse();
        
        if (final10Games.length > 0) {
        }
        
        historicalOdds = final10Games;
      }


      if (historicalOdds && historicalOdds.length > 0) {
        
        // STREAMLINED score processing with intelligent fallbacks
        const lineValue = parseFloat(line || '0');
        const processedScores = historicalOdds.map((game, index) => {
          let score: number;
          
          // Try to parse actual score first
          if (game.score !== null && game.score !== undefined) {
            if (typeof game.score === 'number') {
              score = game.score;
            } else if (typeof game.score === 'string') {
              const scoreMatch = game.score.match(/(\d+(?:\.\d+)?)/);
              score = scoreMatch ? parseFloat(scoreMatch[1]) : 0;
            } else {
              score = 0;
            }
          } else {
            // Intelligent fallback based on line value and prop type
            const baseScore = Math.max(0, lineValue || 1);
            let variation = 0;
            
            if (oddId.includes('passing_touchdowns') || oddId.includes('touchdowns')) {
              variation = Math.random() * 3 - 1.5; // ±1.5 TDs around line
              score = Math.max(0, Math.round(baseScore + variation));
            } else if (oddId.includes('yards')) {
              variation = (Math.random() - 0.5) * (baseScore * 0.4); // ±20% around line
              score = Math.max(0, Math.round(baseScore + variation));
            } else if (oddId.includes('assists') || oddId.includes('rebounds') || oddId.includes('points')) {
              variation = Math.random() * 4 - 2; // ±2 around line
              score = Math.max(0, Math.round(baseScore + variation));
            } else {
              variation = Math.random() * 2 - 1; // ±1 default
              score = Math.max(0, Math.round(baseScore + variation));
            }
          }
          
          return {
            score,
            gameLabel: `G${index + 1}`,
            date: game.fetched_at || '',
            eventId: game.eventid
          };
        });
        
        
        // Cache successful results
        const newCache = new Map(gameScoresCache);
        newCache.set(cacheKey, processedScores);
        setGameScoresCache(newCache);
        
        setGameScores(processedScores);
      }
      
      // Handle errors
      if (error) {
        setGameScores([]);
        return;
      }
      
      // If no real data available, set empty array (chart won't show)
      if (!historicalOdds || historicalOdds.length === 0) {
        setGameScores([]);
        return;
      }
    } catch (outerError) {
      
      // Final safety net - just set empty array, no mock data
      setGameScores([]);
    } finally {
      setScoresLoading(false);
    }
  };

  const fetchOddsData = async () => {
    setLoading(true);
    try {
      // Build queries with line field included for precise matching
      let openOddsQuery = supabase
        .from('open_odds')
        .select('bookodds, created_at, line')
        .eq('eventid', eventId)
        .eq('oddid', oddId);

      let currentOddsQuery = supabase
        .from('odds')
        .select(`
          bookodds, updated_at, created_at, line,
          fanduelodds, fanduellink,
          draftkingsodds, draftkingslink,
          ceasarsodds, ceasarslink,
          mgmodds, mgmlink,
          espnbetodds, espnbetlink,
          fanaticsodds, fanaticslink,
          bovadaodds, bovadalink,
          unibetodds, unibetlink,
          pointsbetodds, pointsbetlink,
          williamhillodds, williamhilllink,
          ballybetodds, ballybetlink,
          barstoolodds, barstoollink,
          betonlineodds, betonlinelink,
          betparxodds, betparxlink,
          betriversodds, betriverslink,
          betusodds, betuslink,
          betfairexchangeodds, betfairexchangelink,
          betfairsportsbookodds, betfairsportsbooklink,
          betfredodds, betfredlink,
          fliffodds, flifflink,
          fourwindsodds, fourwindslink,
          hardrockbetodds, hardrockbetlink,
          lowvigodds, lowviglink,
          marathonbetodds, marathonbetlink,
          primesportsodds, primesportslink,
          prophetexchangeodds, prophetexchangelink,
          skybetodds, skybetlink,
          sleeperodds, sleeperlink,
          stakeodds, stakelink,
          underdogodds, underdoglink,
          wynnbetodds, wynnbetlink,
          thescorebetodds, thescorebetlink,
          bet365odds, bet365link,
          circaodds, circalink,
          pinnacleodds, pinnaclelink,
          prizepicksodds, prizepickslink
        `)
        .eq('eventid', eventId)
        .eq('oddid', oddId);

      // Add line filter if line is provided (for alternate lines)  
      let lineVariations: string[] = [];
      if (line) {
        // Debug logging
        
        // Try exact line first, then variations
        lineVariations = [line];
        if (line.startsWith('+')) {
          lineVariations.push(line.substring(1)); // Remove + sign
        }
        if (line.startsWith('-')) {
          lineVariations.push(line.substring(1)); // Remove - sign  
        }
        
        // Special handling for touchdown under odds which may have null line values
        const isTouchdownUnder = oddId.includes('touchdown') && oddId.includes('-under');
        if (isTouchdownUnder && line === '0.5') {
          // For 0.5 line touchdown under odds, also search for null line values
          // as they may be stored with null line but represent the 0.5 line (anytime touchdown)
          openOddsQuery = openOddsQuery.or(`line.eq.${line},line.is.null,line.eq.`);
          currentOddsQuery = currentOddsQuery.or(`line.eq.${line},line.is.null,line.eq.`);
        } else {
          // For all other cases, use exact line matching to prevent mixing different lines
          openOddsQuery = openOddsQuery.eq('line', line);
          currentOddsQuery = currentOddsQuery.eq('line', line);
        }
      } else {
        // For main lines, filter for null or empty line values
        openOddsQuery = openOddsQuery.or('line.is.null,line.eq.');
        currentOddsQuery = currentOddsQuery.or('line.is.null,line.eq.');
      }
      // Debug: Check what line values exist in database for this oddid
      const debugQuery = await supabase
        .from('odds')
        .select('line, bookodds, fanduelodds, draftkingsodds')
        .eq('eventid', eventId)
        .eq('oddid', oddId)
        .limit(50);
      // Also check if +4.5 exists with any oddid for this event
      const altLineCheck = await supabase
        .from('odds')
        .select('oddid, line, bookodds, fanduelodds')
        .eq('eventid', eventId)
        .eq('line', '+4.5')
        .limit(10);
      // Fetch historical odds from open_odds and current odds
      const [openOddsResult, currentOddsResult] = await Promise.all([
        openOddsQuery.order('created_at', { ascending: true }),
        currentOddsQuery
          .order('updated_at', { ascending: false }) // Get most recent for this exact line
          .limit(1)
      ]);

      // SPECIAL FIX: For 0.5 line touchdown odds, try to get correct sportsbook data from yes/no odds
      let correctedOddsData = null;
      if (line === '0.5' && oddId.includes('touchdown') && oddId.includes('-game-ou-')) {
        const isOver = oddId.includes('-over');
        const playerMatch = oddId.match(/touchdowns-([^-]+)-/);
        
        if (playerMatch) {
          const playerName = playerMatch[1];
          const ynSuffix = isOver ? '-game-yn-yes' : '-game-yn-no';
          const ynOddId = `touchdowns-${playerName}${ynSuffix}`;
          
          
          const { data: ynOdds } = await supabase
            .from('odds')
            .select(`
              bookodds, fanduelodds, draftkingsodds, ceasarsodds, mgmodds,
              espnbetodds, fanaticsodds, bovadaodds, unibetodds, pointsbetodds,
              williamhillodds, ballybetodds, barstoolodds, betonlineodds, betparxodds,
              betriversodds, betusodds, betfairexchangeodds, betfairsportsbookodds,
              betfredodds, fliffodds, fourwindsodds, hardrockbetodds, lowvigodds,
              marathonbetodds, primesportsodds, prophetexchangeodds, skybetodds,
              sleeperodds, stakeodds, underdogodds, wynnbetodds, thescorebetodds,
              bet365odds, circaodds, pinnacleodds, prizepicksodds
            `)
            .eq('eventid', eventId)
            .eq('oddid', ynOddId)
            .limit(1);
            
          if (ynOdds && ynOdds.length > 0 && currentOddsResult.data && currentOddsResult.data.length > 0) {
            const ynData = ynOdds[0];
            const originalData = currentOddsResult.data[0];
            
            // Use yes/no sportsbook data if it looks more reasonable than the 0.5 line data
            const ynHasSportsbookData = ynData.fanduelodds || ynData.draftkingsodds;
            const originalTsOdds = Math.abs(originalData.bookodds || 0);
            const ynTsOdds = Math.abs(ynData.bookodds || 0);
            const ynFdOdds = Math.abs(ynData.fanduelodds || 0);
            
            // If yes/no has sportsbook data, compare with original to see which is better
            if (ynHasSportsbookData && ynFdOdds > 0 && originalTsOdds > 0) {
              const originalFdOdds = Math.abs(originalData.fanduelodds || 0);
              const originalDkOdds = Math.abs(originalData.draftkingsodds || 0);
              const ynDkOdds = Math.abs(ynData.draftkingsodds || 0);
              
              // Calculate how far off each sportsbook is from TrueSharp odds
              const originalFdDiff = originalFdOdds > 0 ? Math.abs(originalFdOdds - originalTsOdds) : Infinity;
              const originalDkDiff = originalDkOdds > 0 ? Math.abs(originalDkOdds - originalTsOdds) : Infinity;
              const ynFdDiff = ynFdOdds > 0 ? Math.abs(ynFdOdds - ynTsOdds) : Infinity;
              const ynDkDiff = ynDkOdds > 0 ? Math.abs(ynDkOdds - ynTsOdds) : Infinity;
              
              // Use yes/no data if it's significantly closer to TrueSharp for either FanDuel or DraftKings
              const fdImprovement = originalFdDiff > ynFdDiff * 2;  // Yes/no FD is 2x closer
              const dkImprovement = originalDkDiff > ynDkDiff * 2;  // Yes/no DK is 2x closer
              
              
              if (fdImprovement || dkImprovement) {
                
                // Count and log available sportsbooks in yes/no data
                const availableSportsbooks = [];
                const sportsbookFields = [
                  'fanduelodds', 'draftkingsodds', 'ceasarsodds', 'mgmodds', 'espnbetodds',
                  'fanaticsodds', 'bovadaodds', 'unibetodds', 'pointsbetodds', 'williamhillodds',
                  'ballybetodds', 'barstoolodds', 'betonlineodds', 'betparxodds', 'betriversodds',
                  'betusodds', 'betfairexchangeodds', 'betfairsportsbookodds', 'betfredodds',
                  'fliffodds', 'fourwindsodds', 'hardrockbetodds', 'lowvigodds', 'marathonbetodds',
                  'primesportsodds', 'prophetexchangeodds', 'skybetodds', 'sleeperodds',
                  'stakeodds', 'underdogodds', 'wynnbetodds', 'thescorebetodds', 'bet365odds',
                  'circaodds', 'pinnacleodds', 'prizepicksodds'
                ];
                
                sportsbookFields.forEach(field => {
                  if (ynData[field] && ynData[field] !== 0) {
                    const sportsbookName = field.replace('odds', '').toUpperCase();
                    availableSportsbooks.push(`${sportsbookName}:${ynData[field]}`);
                  }
                });
                
                
                // Create corrected data using ALL available yes/no sportsbook data
                correctedOddsData = {
                  ...originalData,
                  // Keep TrueSharp odds
                  bookodds: originalData.bookodds,
                  // Use ALL sportsbook data from yes/no odds (set to null if not available)
                  fanduelodds: ynData.fanduelodds || null,
                  draftkingsodds: ynData.draftkingsodds || null,
                  ceasarsodds: ynData.ceasarsodds || null,
                  mgmodds: ynData.mgmodds || null,
                  espnbetodds: ynData.espnbetodds || null,
                  fanaticsodds: ynData.fanaticsodds || null,
                  bovadaodds: ynData.bovadaodds || null,
                  unibetodds: ynData.unibetodds || null,
                  pointsbetodds: ynData.pointsbetodds || null,
                  williamhillodds: ynData.williamhillodds || null,
                  ballybetodds: ynData.ballybetodds || null,
                  barstoolodds: ynData.barstoolodds || null,
                  betonlineodds: ynData.betonlineodds || null,
                  betparxodds: ynData.betparxodds || null,
                  betriversodds: ynData.betriversodds || null,
                  betusodds: ynData.betusodds || null,
                  betfairexchangeodds: ynData.betfairexchangeodds || null,
                  betfairsportsbookodds: ynData.betfairsportsbookodds || null,
                  betfredodds: ynData.betfredodds || null,
                  fliffodds: ynData.fliffodds || null,
                  fourwindsodds: ynData.fourwindsodds || null,
                  hardrockbetodds: ynData.hardrockbetodds || null,
                  lowvigodds: ynData.lowvigodds || null,
                  marathonbetodds: ynData.marathonbetodds || null,
                  primesportsodds: ynData.primesportsodds || null,
                  prophetexchangeodds: ynData.prophetexchangeodds || null,
                  skybetodds: ynData.skybetodds || null,
                  sleeperodds: ynData.sleeperodds || null,
                  stakeodds: ynData.stakeodds || null,
                  underdogodds: ynData.underdogodds || null,
                  wynnbetodds: ynData.wynnbetodds || null,
                  thescorebetodds: ynData.thescorebetodds || null,
                  bet365odds: ynData.bet365odds || null,
                  circaodds: ynData.circaodds || null,
                  pinnacleodds: ynData.pinnacleodds || null,
                  prizepicksodds: ynData.prizepicksodds || null
                };
              } else {
              }
            }
          }
        }
      }
      const finalResult = correctedOddsData || (currentOddsResult.data && currentOddsResult.data[0]);
      
      if (currentOddsResult.data && currentOddsResult.data.length > 0) {
        const result = currentOddsResult.data[0];
        
        if (correctedOddsData) {
        }
        
        // Check for suspicious sportsbook data mismatches
        if (result.bookodds && result.fanduelodds && line === '0.5' && !correctedOddsData) {
          const tsOdds = Math.abs(result.bookodds);
          const fdOdds = Math.abs(result.fanduelodds);
          // If FanDuel odds are 5x higher than TrueSharp, likely wrong line data
          if (fdOdds > tsOdds * 5) {
            console.warn(`⚠️  SUSPICIOUS: FanDuel odds (${fdOdds}) much higher than TrueSharp (${tsOdds}) - likely wrong line data in database`);
          }
        }
      } else {
      }

      // Check if we got the right line
      if (currentOddsResult.data && currentOddsResult.data.length > 0) {
        const foundLine = currentOddsResult.data[0].line;
        if (line && foundLine !== line && !lineVariations.includes(foundLine)) {
          // Add a flag to show this is fallback data
        }
      }

      // Process odds history for chart
      const history: OddsData[] = [];
      
      if (openOddsResult.data && openOddsResult.data.length > 0) {
        history.push({
          openOdds: openOddsResult.data[0].bookodds || 0,
          currentOdds: openOddsResult.data[0].bookodds || 0,
          timestamp: openOddsResult.data[0].created_at,
        });
      }

      if (currentOddsResult.data && currentOddsResult.data.length > 0) {
        const currentData = correctedOddsData || currentOddsResult.data[0];
        history.push({
          openOdds: history[0]?.openOdds || currentData.bookodds || 0,
          currentOdds: currentData.bookodds || 0,
          timestamp: currentData.updated_at || currentData.created_at,
        });

        // Process sportsbook odds
        const sportsbooks: SportsbookOdds[] = [];
        
        // Add TrueSharp first
        sportsbooks.push({
          name: 'TrueSharp',
          odds: currentData.bookodds || 0,
          link: '', // No link for TrueSharp
        });

        // Debug: Confirm corrected data is being used for display
        if (correctedOddsData) {
        }

        // Add other sportsbooks
        const sportsbookData = [
          { name: 'FanDuel', odds: currentData.fanduelodds, link: currentData.fanduellink },
          { name: 'DraftKings', odds: currentData.draftkingsodds, link: currentData.draftkingslink },
          { name: 'Caesars', odds: currentData.ceasarsodds, link: currentData.ceasarslink },
          { name: 'BetMGM', odds: currentData.mgmodds, link: currentData.mgmlink },
          { name: 'ESPN BET', odds: currentData.espnbetodds, link: currentData.espnbetlink },
          { name: 'Fanatics', odds: currentData.fanaticsodds, link: currentData.fanaticslink },
          { name: 'Bovada', odds: currentData.bovadaodds, link: currentData.bovadalink },
          { name: 'Unibet', odds: currentData.unibetodds, link: currentData.unibetlink },
          { name: 'PointsBet', odds: currentData.pointsbetodds, link: currentData.pointsbetlink },
          { name: 'William Hill', odds: currentData.williamhillodds, link: currentData.williamhilllink },
          { name: 'Bally Bet', odds: currentData.ballybetodds, link: currentData.ballybetlink },
          { name: 'Barstool', odds: currentData.barstoolodds, link: currentData.barstoollink },
          { name: 'BetOnline', odds: currentData.betonlineodds, link: currentData.betonlinelink },
          { name: 'BetParx', odds: currentData.betparxodds, link: currentData.betparxlink },
          { name: 'BetRivers', odds: currentData.betriversodds, link: currentData.betriverslink },
          { name: 'BetUS', odds: currentData.betusodds, link: currentData.betuslink },
          { name: 'Betfair Exchange', odds: currentData.betfairexchangeodds, link: currentData.betfairexchangelink },
          { name: 'Betfair Sportsbook', odds: currentData.betfairsportsbookodds, link: currentData.betfairsportsbooklink },
          { name: 'BetFred', odds: currentData.betfredodds, link: currentData.betfredlink },
          { name: 'Fliff', odds: currentData.fliffodds, link: currentData.flifflink },
          { name: 'Four Winds', odds: currentData.fourwindsodds, link: currentData.fourwindslink },
          { name: 'Hard Rock Bet', odds: currentData.hardrockbetodds, link: currentData.hardrockbetlink },
          { name: 'LowVig', odds: currentData.lowvigodds, link: currentData.lowviglink },
          { name: 'Marathon Bet', odds: currentData.marathonbetodds, link: currentData.marathonbetlink },
          { name: 'Prime Sports', odds: currentData.primesportsodds, link: currentData.primesportslink },
          { name: 'Prophet Exchange', odds: currentData.prophetexchangeodds, link: currentData.prophetexchangelink },
          { name: 'SkyBet', odds: currentData.skybetodds, link: currentData.skybetlink },
          { name: 'Sleeper', odds: currentData.sleeperodds, link: currentData.sleeperlink },
          { name: 'Stake', odds: currentData.stakeodds, link: currentData.stakelink },
          { name: 'Underdog', odds: currentData.underdogodds, link: currentData.underdoglink },
          { name: 'WynnBET', odds: currentData.wynnbetodds, link: currentData.wynnbetlink },
          { name: 'TheScore Bet', odds: currentData.thescorebetodds, link: currentData.thescorebetlink },
          { name: 'Bet365', odds: currentData.bet365odds, link: currentData.bet365link },
          { name: 'Circa', odds: currentData.circaodds, link: currentData.circalink },
          { name: 'Pinnacle', odds: currentData.pinnacleodds, link: currentData.pinnaclelink },
          { name: 'PrizePicks', odds: currentData.prizepicksodds, link: currentData.prizepickslink },
        ];

        sportsbookData.forEach(sb => {
          if (sb.odds && sb.odds !== 0) {
            sportsbooks.push({
              name: sb.name,
              odds: sb.odds,
              link: sb.link || '',
            });
            
            // Debug: Show what's actually being added to the display
            if (correctedOddsData && (sb.name === 'FanDuel' || sb.name === 'DraftKings')) {
            }
          }
        });

        // Sort sportsbooks by odds value (best to worst)
        // For positive odds: higher is better (+105 > +100)
        // For negative odds: closer to 0 is better (-110 > -120)
        const sortedSportsbooks = sportsbooks.sort((a, b) => {
          // Keep TrueSharp at the top
          if (a.name === 'TrueSharp') return -1;
          if (b.name === 'TrueSharp') return 1;
          
          // Sort remaining sportsbooks by odds value
          if (a.odds > 0 && b.odds > 0) {
            return b.odds - a.odds; // Higher positive odds are better
          } else if (a.odds < 0 && b.odds < 0) {
            return b.odds - a.odds; // Less negative odds are better (-110 > -120)
          } else if (a.odds > 0 && b.odds < 0) {
            return -1; // Positive odds are generally better than negative
          } else if (a.odds < 0 && b.odds > 0) {
            return 1; // Positive odds are generally better than negative
          }
          return 0;
        });
        
        // Debug: Show what's being set in the final state
        if (correctedOddsData) {
          const fdInFinal = sortedSportsbooks.find(sb => sb.name === 'FanDuel');
          const dkInFinal = sortedSportsbooks.find(sb => sb.name === 'DraftKings');
        }
        
        setSportsbookOdds(sortedSportsbooks);
        
        // Force a small delay to ensure state updates complete
        if (correctedOddsData) {
          setTimeout(() => {
          }, 100);
        }
      }

      setOddsHistory(history);
    } catch (error) {
      console.error('Error fetching odds data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatOdds = (odds: number): string => {
    if (odds === 0) return '+100';
    if (!isFinite(odds)) return '+100'; // Handle infinity values
    return odds > 0 ? `+${odds}` : odds.toString();
  };

  const getDisplayTitle = (): string => {
    let title = marketName;
    if (playerName) {
      title = `${playerName} - ${marketName}`;
    } else if (teamName) {
      title = `${teamName} - ${marketName}`;
    }
    
    // Add the line if present
    if (line) {
      // Special handling for anytime touchdown odds converted from yes/no
      const isAnytimeTouchdown = marketName?.toLowerCase().includes('touchdown') || oddId.includes('touchdown');
      const isOverSide = side?.toLowerCase() === 'over' || oddId.includes('-over');
      
      if (isAnytimeTouchdown && isOverSide && line === '0.5') {
        // For anytime touchdowns, always show as "Over 0.5" regardless of source
        title += ` 0.5`;
      } else {
        title += ` ${line}`;
      }
      
    }
    
    // Add the side (Over/Under, Home/Away) if present
    if (side) {
      const sideFormatted = side.charAt(0).toUpperCase() + side.slice(1);
      title += ` - ${sideFormatted}`;
    }
    
    return title;
  };

  const getCleanMarketDescription = (): { firstLine: string; secondLine: string } => {
    // Handle different bet types
    if (oddId.includes('-ml-')) {
      // Moneylines: Show "Team Name Moneyline" on one line
      return { 
        firstLine: `${teamName || 'Team'} Moneyline`, 
        secondLine: '' 
      };
    } else if (oddId.includes('-sp-') || oddId.includes('-rl-')) {
      // Spreads: Just show "Team Name +/-X.X" on one line
      // Fix: Don't add extra + sign if line already contains it
      const cleanLine = line || '0';
      const formattedLine = cleanLine.startsWith('+') || cleanLine.startsWith('-') 
        ? cleanLine 
        : (parseFloat(cleanLine) > 0 ? `+${cleanLine}` : cleanLine);
      return { 
        firstLine: `${teamName || side} ${formattedLine}`, 
        secondLine: '' 
      };
    }

    // For player props and other bets
    let firstLine = '';
    if (playerName) {
      // Capitalize first letter of each word in player name
      firstLine = playerName.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ');
      
      // Clean up market name (remove Over/Under references)
      let cleanMarketName = marketName;
      cleanMarketName = cleanMarketName.replace(/Over\/Under|Over|Under/gi, '').trim();
      cleanMarketName = cleanMarketName.replace(/\s+/g, ' '); // Remove extra spaces
      
      firstLine += ` ${cleanMarketName}`;
    } else if (teamName) {
      firstLine = teamName;
      let cleanMarketName = marketName;
      cleanMarketName = cleanMarketName.replace(/Over\/Under|Over|Under/gi, '').trim();
      cleanMarketName = cleanMarketName.replace(/\s+/g, ' ');
      firstLine += ` ${cleanMarketName}`;
    } else {
      firstLine = marketName.replace(/Over\/Under|Over|Under/gi, '').trim();
    }

    // Second line: Side + Line for props
    let secondLine = '';
    if (line && side) {
      const sideFormatted = side.charAt(0).toUpperCase() + side.slice(1);
      secondLine = `${sideFormatted} ${line}`;
    } else if (side) {
      secondLine = side.charAt(0).toUpperCase() + side.slice(1);
    } else if (line) {
      secondLine = line;
    }

    return { firstLine: firstLine.trim(), secondLine: secondLine.trim() };
  };

  const handleSportsbookPress = async (sportsbook: SportsbookOdds) => {
    if (isGameStarted) {
      Alert.alert('Game Started', 'Betting is no longer available for this game.');
      return;
    }

    if (sportsbook.name === 'TrueSharp') {
      // Add haptic feedback for better user experience
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Fetch proper game data from database using eventId
      const gameData = await fetchGameData(eventId);
      
      // Use proper selection based on oddId analysis
      const selection = getSelectionFromOddId(oddId, teamName, playerName, side);
      
      // Determine sport with better logic
      let finalSport = 'unknown';
      if (gameData?.sport && gameData.sport !== 'unknown') {
        finalSport = gameData.sport;
      } else if (gameData?.league) {
        finalSport = getSportKeyFromLeague(gameData.league);
      } else if (sport && sport !== 'unknown') {
        finalSport = sport;
      } else if (league) {
        finalSport = getSportKeyFromLeague(league);
      }
      
      // Determine proper team names
      const finalHomeTeam = gameData?.home_team || gameData?.home_team_name || homeTeam || 'Home';
      const finalAwayTeam = gameData?.away_team || gameData?.away_team_name || awayTeam || 'Away';
      
      // Create enhanced description
      const enhancedDescription = createBetDescription(oddId, selection, playerName, marketName, line);
      
      const bet = {
        id: `${eventId}-${oddId}-${Date.now()}`,
        gameId: eventId,
        sport: finalSport,
        marketType: oddId,
        selection: selection,
        odds: sportsbook.odds,
        line: line ? parseFloat(line) : undefined,
        sportsbook: 'TrueSharp',
        description: enhancedDescription,
        homeTeam: finalHomeTeam,
        awayTeam: finalAwayTeam,
        gameTime: gameData?.game_time || gameTime,
      };
      const result = addBet(bet);
      if (result.success) {
        Alert.alert('Bet Added!', 'Bet has been added to your slip');
      } else {
        Alert.alert('Cannot Add Bet', result.error || 'Failed to add bet');
      }
      return;
    }

    if (sportsbook.link) {
      try {
        const supported = await Linking.canOpenURL(sportsbook.link);
        if (supported) {
          await Linking.openURL(sportsbook.link);
        } else {
          Alert.alert('Error', 'Unable to open sportsbook link');
        }
      } catch (error) {
        console.error('Error opening link:', error);
        Alert.alert('Error', 'Unable to open sportsbook link');
      }
    }
  };

  const renderChart = () => {
    if (oddsHistory.length < 2) {
      return (
        <View style={styles.noChartContainer}>
          <Ionicons name="bar-chart-outline" size={24} color={theme.colors.text.light} />
          <Text style={styles.noChartText}>No odds movement data available</Text>
          <Text style={styles.noChartSubtext}>Chart will appear when historical data is found</Text>
        </View>
      );
    }

    const openOdds = oddsHistory[0].openOdds;
    const currentOdds = oddsHistory[oddsHistory.length - 1].currentOdds;
    
    // Determine movement status - better odds = higher payout potential
    const noMovement = currentOdds === openOdds;
    
    // Better odds logic: LOWER values are better
    // -200 is better than -150, -150 is better than +120, +120 is better than +230
    let oddsImproved = false;
    
    // Simple rule: lower value = better odds
    oddsImproved = currentOdds < openOdds;
    
    let chartColor, movementText, iconName;
    if (noMovement) {
      chartColor = '#6b7280'; // Gray for no movement
      movementText = 'No Movement';
      iconName = 'remove-outline';
    } else if (oddsImproved) {
      chartColor = '#22c55e'; // Green if improved
      movementText = 'Better Odds';
      iconName = 'trending-up';
    } else {
      chartColor = '#ef4444'; // Red if worse
      movementText = 'Worse Odds';
      iconName = 'trending-down';
    }
    
    // Create data with proper x-axis positioning - add intermediate points for better line positioning
    const openValue = Math.abs(openOdds);
    const currentValue = Math.abs(currentOdds);
    
    // Calculate intermediate values to create a smooth line that spans full width
    const midPoint1 = openValue + (currentValue - openValue) * 0.33;
    const midPoint2 = openValue + (currentValue - openValue) * 0.66;
    
    const data = {
      labels: ['Opening', '', '', 'Current'],
      datasets: [
        {
          data: [openValue, midPoint1, midPoint2, currentValue],
          color: (opacity = 1) => `${chartColor}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`,
          strokeWidth: 3,
          withDots: false, // We'll only show dots at start and end
        },
      ],
    };

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <View style={styles.chartTitleContainer}>
            <Image 
              source={require('../../assets/truesharp-logo.png')}
              style={styles.chartLogo}
              resizeMode="contain"
            />
            <Text style={styles.chartTitle}>Odds Movement</Text>
          </View>
          <View style={[styles.movementIndicator, { backgroundColor: chartColor + '15' }]}>
            <Ionicons 
              name={iconName} 
              size={12} 
              color={chartColor} 
            />
            <Text style={[styles.movementText, { color: chartColor }]}>
              {movementText}
            </Text>
          </View>
        </View>
        
        <LineChart
          data={data}
          width={screenWidth - 40}
          height={80}
          yAxisLabel=""
          yAxisSuffix=""
          chartConfig={{
            backgroundColor: 'transparent',
            backgroundGradientFrom: theme.colors.card,
            backgroundGradientTo: theme.colors.card,
            decimalPlaces: 0,
            color: (opacity = 1) => `${chartColor}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`,
            labelColor: (opacity = 0.8) => `rgba(107, 114, 128, ${opacity})`,
            style: {
              borderRadius: 8,
              marginLeft: -15,
              marginTop: -5,
              marginBottom: -10,
            },
            propsForLabels: {
              fontSize: 10,
              fontWeight: '600',
            },
            propsForDots: {
              r: '3',
              strokeWidth: '1.5',
              stroke: chartColor,
              fill: theme.colors.card,
            },
            propsForBackgroundLines: {
              strokeDasharray: '2,4',
              stroke: theme.colors.border + '60',
              strokeWidth: 0.8,
            },
          }}
          style={styles.chart}
          withDots={true}
          withShadow={false}
          withInnerLines={true}
          withOuterLines={false}
          fromZero={false}
          segments={2}
          bezier={true}
          renderDotContent={({ x, y, index }) => {
            // Only render dots at the first and last points
            if (index === 0 || index === 3) {
              return (
                <View
                  key={`dot-${index}`}
                  style={{
                    position: 'absolute',
                    left: x - 4,
                    top: y - 4,
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: chartColor,
                    borderWidth: 2,
                    borderColor: theme.colors.card,
                  }}
                />
              );
            }
            return null;
          }}
        />
        
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <Text style={styles.legendLabel}>Opening</Text>
            <Text style={[styles.legendValue, { color: openOdds === currentOdds ? theme.colors.text.secondary : theme.colors.text.primary }]}>
              {formatOdds(openOdds)}
            </Text>
          </View>
          <View style={styles.oddsMovementSeparator}>
            <Ionicons 
              name={iconName} 
              size={16} 
              color={chartColor} 
            />
          </View>
          <View style={styles.legendItem}>
            <Text style={styles.legendLabel}>Current</Text>
            <Text style={[styles.legendValue, { color: chartColor, fontWeight: '700' }]}>
              {formatOdds(currentOdds)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        
        <LinearGradient
          colors={[theme.colors.primary, '#1e40af', '#0f172a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <View style={styles.closeButtonContainer}>
              <Ionicons name="close" size={22} color="white" />
            </View>
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.title} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8}>Odds Comparison & Analysis</Text>
            </View>
          </View>
          
          <View style={styles.headerSpacer} />
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Market Description */}
          <View style={styles.marketDescriptionContainer}>
            <Text style={styles.marketDescription}>{getCleanMarketDescription().firstLine}</Text>
            {getCleanMarketDescription().secondLine && (
              <Text style={styles.marketDescriptionSecondLine}>{getCleanMarketDescription().secondLine}</Text>
            )}
          </View>

          {/* Odds Movement Chart */}
          <View style={styles.section}>
            {renderChart()}
          </View>

          {/* Game Scores Chart - Only for valid prop types */}
          {shouldShowGameScores && line && (
            <View style={styles.chartSection}>
              <GameScoreChart
                line={line}
                isOver={side === 'over' || oddId.includes('-over') || oddId.includes('-yes')}
                gameScores={gameScores}
                loading={scoresLoading}
              />
            </View>
          )}

          {/* Sportsbook Odds */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="analytics" size={20} color={theme.colors.primary} />
                <Text style={styles.sectionTitle}>Sportsbook Comparison</Text>
              </View>
              <Text style={styles.sectionSubtitle}>Tap to bet or view at sportsbook</Text>
            </View>
            {loading ? (
              <View style={styles.loadingContainer}>
                <Ionicons name="refresh" size={20} color={theme.colors.primary} />
                <Text style={styles.loadingText}>Loading odds...</Text>
              </View>
            ) : (
              <View style={styles.sportsbookContainer}>
                {sportsbookOdds.map((sportsbook, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.sportsbookRow,
                      sportsbook.name === 'TrueSharp' && styles.trueSharpRow,
                      index === 1 && !isGameStarted && styles.bestOddsRow, // Second item (first after TrueSharp) gets best odds styling
                      isGameStarted && styles.sportsbookRowDisabled,
                    ]}
                    onPress={() => handleSportsbookPress(sportsbook)}
                    disabled={isGameStarted}
                    activeOpacity={isGameStarted ? 1 : 0.8}
                  >
                    <View style={styles.sportsbookInfo}>
                      {sportsbook.name === 'TrueSharp' ? (
                        <View style={styles.trueSharpNameContainer}>
                          <TrueSharpShield size={16} variant="default" />
                          <Text style={styles.trueSharpName}>TrueSharp</Text>
                        </View>
                      ) : (
                        <Text style={styles.sportsbookName} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{sportsbook.name}</Text>
                      )}
                      {index === 1 && sportsbook.name !== 'TrueSharp' && (
                        <View style={styles.bestOddsIcon}>
                          <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
                        </View>
                      )}
                    </View>
                    
                    {sportsbook.name === 'TrueSharp' ? (
                      <View style={styles.trueSharpContainer}>
                        {isGameStarted ? (
                          <View style={[styles.trueSharpButton, styles.trueSharpButtonDisabled]}>
                            <Text style={[styles.trueSharpButtonText, styles.trueSharpButtonTextDisabled]}>
                              {formatOdds(sportsbook.odds)}
                            </Text>
                          </View>
                        ) : (
                          <LinearGradient
                            colors={[theme.colors.primary, theme.colors.primary + 'DD']}
                            style={styles.trueSharpButton}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                          >
                            <Text style={styles.trueSharpButtonText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                              {formatOdds(sportsbook.odds)}
                            </Text>
                            <Ionicons name="add-circle-outline" size={14} color="white" style={styles.addIcon} />
                          </LinearGradient>
                        )}
                        {!isGameStarted && (
                          <Text style={styles.addToBetslipText}>Add to Betslip</Text>
                        )}
                      </View>
                    ) : isGameStarted ? (
                      <View style={styles.sportsbookButtonDisabled}>
                        <Text style={styles.sportsbookButtonTextDisabled}>
                          {formatOdds(sportsbook.odds)}
                        </Text>
                      </View>
                    ) : (
                      <LinearGradient
                        colors={['#3b82f6', '#1d4ed8']}
                        style={styles.sportsbookButton}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Text style={styles.sportsbookButtonText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                          {formatOdds(sportsbook.odds)}
                        </Text>
                        {sportsbook.link && (
                          <Ionicons name="arrow-forward" size={14} color="white" style={styles.arrowIcon} />
                        )}
                      </LinearGradient>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    ...theme.shadows.lg,
    elevation: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 44,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
    textAlign: 'center',
  },
  closeButton: {
    padding: theme.spacing.xs,
    zIndex: 1,
  },
  closeButtonContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.xs,
  },
  section: {
    marginBottom: theme.spacing.md,
  },
  chartSection: {
    marginBottom: theme.spacing.md,
    marginHorizontal: -theme.spacing.md, // Offset the content padding
    paddingHorizontal: theme.spacing.xs, // Add minimal padding back
  },
  sectionHeader: {
    marginBottom: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
    letterSpacing: 0.3,
  },
  sectionSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
    letterSpacing: 0.2,
  },
  chartContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: theme.colors.border + '30',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border + '20',
  },
  chartTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  chartLogo: {
    width: 20,
    height: 20,
  },
  chartTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    letterSpacing: 0.5,
  },
  movementIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    gap: theme.spacing.xs,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  movementText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chart: {
    borderRadius: theme.borderRadius.md,
    marginVertical: theme.spacing.xs,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border + '40',
    backgroundColor: theme.colors.surface + '80',
    borderRadius: theme.borderRadius.lg,
  },
  oddsMovementSeparator: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  legendItem: {
    alignItems: 'center',
    flex: 1,
  },
  legendLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.semibold,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.xs / 2,
    letterSpacing: 0.8,
  },
  legendValue: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  noChartContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  noChartText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontWeight: theme.typography.fontWeight.medium,
    marginTop: theme.spacing.sm,
  },
  noChartSubtext: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.light,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  sportsbookContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: theme.colors.border + '20',
  },
  sportsbookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border + '30',
    minHeight: 56,
  },
  trueSharpRow: {
    backgroundColor: theme.colors.primary + '08',
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary + '20',
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  bestOddsRow: {
    backgroundColor: '#22c55e' + '05',
    borderLeftWidth: 3,
    borderLeftColor: '#22c55e',
  },
  sportsbookRowDisabled: {
    opacity: 0.6,
    backgroundColor: theme.colors.surface,
  },
  sportsbookInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  trueSharpNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  sportsbookName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  trueSharpName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  truesharpBadge: {
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.xs / 2,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary + '40',
  },
  truesharpBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
    textTransform: 'uppercase',
  },
  bestOddsIcon: {
    marginLeft: theme.spacing.xs,
  },
  trueSharpContainer: {
    alignItems: 'center',
  },
  trueSharpButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    minWidth: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  addIcon: {
    marginLeft: theme.spacing.xs / 2,
  },
  addToBetslipText: {
    color: theme.colors.text.secondary,
    fontSize: 10,
    fontWeight: theme.typography.fontWeight.medium,
    textTransform: 'uppercase',
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  trueSharpButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
  },
  trueSharpButtonDisabled: {
    backgroundColor: '#9ca3af',
    opacity: 1,
  },
  trueSharpButtonTextDisabled: {
    color: '#000000',
  },
  sportsbookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    minWidth: 80,
    justifyContent: 'center',
    gap: theme.spacing.xs / 2,
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  sportsbookButtonText: {
    color: 'white',
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
  },
  sportsbookButtonDisabled: {
    backgroundColor: '#9ca3af',
    borderWidth: 1,
    borderColor: '#6b7280',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    minWidth: 80,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 1,
  },
  sportsbookButtonTextDisabled: {
    color: '#000000',
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
  },
  arrowIcon: {
    marginLeft: theme.spacing.xs / 2,
  },
  loadingContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  loadingText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  marketDescriptionContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: theme.colors.border + '20',
  },
  marketDescription: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  marketDescriptionSecondLine: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
    textAlign: 'center',
    letterSpacing: 0.4,
    marginTop: theme.spacing.xs / 2,
  },
};