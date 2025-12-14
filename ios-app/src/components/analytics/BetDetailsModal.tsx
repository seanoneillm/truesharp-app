import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  FlatList,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../styles/theme';
import TrueSharpShield from '../common/TrueSharpShield';
import { BetDetailsService, BetDetailsData, StrategyInfo } from '../../services/betDetailsService';
import { BetData } from '../../services/supabaseAnalytics';
import { ParlayGroup } from '../../services/parlayGrouping';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { validateBetAgainstStrategy, validateParlayAgainstStrategy, StrategyData } from '../../utils/strategyValidation';
import { TicketService, TICKET_REASONS, CreateTicketData } from '../../services/ticketService';
import { formatOddsWithFallback } from '../../utils/oddsCalculation';
import { parseMultiStatOddid } from '../../lib/betFormatting';
import { TeamLogo } from '../common/TeamLogo';

const { width: screenWidth } = Dimensions.get('window');

// Helper function to batch fetch game info for parlay legs
const fetchGameInfoForParlayLegs = async (legs: BetData[]) => {
  // Collect all unique game IDs from parlay legs
  const gameIds = new Set<string>();
  const sharpSportsBetIds: string[] = [];
  
  legs.forEach(leg => {
    if (leg.game_id) {
      gameIds.add(leg.game_id);
    } else {
      // Track bets that might need SharpSports lookup
      sharpSportsBetIds.push(leg.id);
    }
  });

  // Batch fetch game info for all unique game IDs
  const gameInfoMap = new Map<string, any>();
  if (gameIds.size > 0) {
    try {
      const { data: games } = await supabase
        .from('games')
        .select('*')
        .in('id', Array.from(gameIds));
      
      games?.forEach(game => {
        gameInfoMap.set(game.id, game);
      });
    } catch (error) {
      console.error('Error batch fetching game info:', error);
    }
  }

  // Batch fetch SharpSports matches if needed
  const sharpSportsMap = new Map<string, string>();
  if (sharpSportsBetIds.length > 0) {
    try {
      const { data: matches } = await supabase
        .from('sharpsports_bet_matches')
        .select('bet_id, game_id')
        .in('bet_id', sharpSportsBetIds);
      
      matches?.forEach(match => {
        if (match.game_id) {
          sharpSportsMap.set(match.bet_id, match.game_id);
          gameIds.add(match.game_id);
        }
      });

      // Fetch any additional games found through SharpSports
      if (matches?.length) {
        const additionalGameIds = Array.from(new Set(matches.map(m => m.game_id).filter(Boolean)));
        if (additionalGameIds.length > 0) {
          const { data: additionalGames } = await supabase
            .from('games')
            .select('*')
            .in('id', additionalGameIds);
          
          additionalGames?.forEach(game => {
            gameInfoMap.set(game.id, game);
          });
        }
      }
    } catch (error) {
      console.error('Error batch fetching SharpSports matches:', error);
    }
  }

  // Now create the parlay legs with the batched data
  return legs.map(legBet => {
    let gameInfo = undefined;
    
    // Try direct game_id first
    if (legBet.game_id) {
      gameInfo = gameInfoMap.get(legBet.game_id);
    }
    
    // Fall back to SharpSports lookup
    if (!gameInfo) {
      const sharpSportsGameId = sharpSportsMap.get(legBet.id);
      if (sharpSportsGameId) {
        gameInfo = gameInfoMap.get(sharpSportsGameId);
      }
    }

    return {
      bet: legBet,
      gameInfo,
      oddsInfo: undefined,
      lineMovement: [],
      strategies: [],
      sharpSportsMatch: undefined,
      parlayLegs: [],
    };
  });
};

interface BetDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  betId: string | null;
  parlayGroup?: ParlayGroup | null;
}

// Strategy interface for the add to strategies modal
interface Strategy {
  id: string;
  name: string;
  description?: string;
  sport?: string;
  filter_config?: any;
  user_id: string;
  monetized?: boolean;
  performance_roi?: number;
  performance_win_rate?: number;
  performance_total_bets?: number;
}

export default function BetDetailsModal({
  visible,
  onClose,
  betId,
  parlayGroup,
}: BetDetailsModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [betDetails, setBetDetails] = useState<BetDetailsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Add to strategies modal state
  const [showStrategyModal, setShowStrategyModal] = useState(false);
  const [userStrategies, setUserStrategies] = useState<Strategy[]>([]);
  const [selectedStrategyIds, setSelectedStrategyIds] = useState<string[]>([]);
  const [addingToStrategies, setAddingToStrategies] = useState(false);
  const [filteredStrategies, setFilteredStrategies] = useState<Strategy[]>([]);
  const [strategyCompatibility, setStrategyCompatibility] = useState<Record<string, boolean>>({});
  
  // Ticket submission modal state
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');
  const [ticketDescription, setTicketDescription] = useState<string>('');
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [hasExistingTicket, setHasExistingTicket] = useState(false);
  const [checkingTicket, setCheckingTicket] = useState(false);
  
  // Use preset ticket reasons from service
  const ticketReasons = TICKET_REASONS;

  useEffect(() => {
    if (visible && (betId || parlayGroup)) {
      fetchBetDetails();
      if (user?.id) {
        fetchUserStrategies();
        checkForExistingTicket();
      }
    } else if (!visible) {
      // Reset state when modal closes
      setBetDetails(null);
      setError(null);
      setShowStrategyModal(false);
      setSelectedStrategyIds([]);
      setShowTicketModal(false);
      setSelectedReason('');
      setCustomReason('');
      setTicketDescription('');
      setHasExistingTicket(false);
      setCheckingTicket(false);
    }
  }, [visible, betId, parlayGroup, user?.id]);

  const fetchBetDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (parlayGroup) {
        // If we have a parlayGroup directly, create BetDetailsData from it
        const details = await createBetDetailsFromParlayGroup(parlayGroup);
        setBetDetails(details);
        setLoading(false); // Set loading to false immediately for parlays
      } else if (betId) {
        // Otherwise, fetch from database
        const details = await BetDetailsService.fetchBetDetails(betId);
        if (details) {
          setBetDetails(details);
        } else {
          setError('Unable to load bet details');
        }
        setLoading(false); // Set loading to false after database fetch
      } else {
        setError('No bet or parlay data provided');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching bet details:', err);
      setError('Failed to load bet details');
      setLoading(false);
    }
  };

  const createBetDetailsFromParlayGroup = async (parlay: ParlayGroup): Promise<BetDetailsData> => {
    // Create a synthetic bet object from the ParlayGroup
    const syntheticBet = {
      id: parlay.parlay_id,
      is_parlay: true,
      stake: parlay.stake,
      potential_payout: parlay.potential_payout,
      odds: parlay.odds,
      status: parlay.status,
      profit: parlay.profit,
      placed_at: parlay.placed_at,
      sport: parlay.sport,
      bet_description: `${parlay.legs.length}-Leg Parlay`,
      bet_type: 'parlay',
      parlay_id: parlay.parlay_id,
    };

    // Create parlay legs with game info - optimized batch approach
    const parlayLegs = await fetchGameInfoForParlayLegs(parlay.legs);

    // Fetch strategies for the parlay asynchronously (non-blocking)
    const strategiesPromise = BetDetailsService.fetchStrategies(parlay.legs[0].id);

    const result = {
      bet: syntheticBet,
      gameInfo: undefined, // Parlays don't have single game context
      oddsInfo: undefined,
      lineMovement: [],
      strategies: [], // Start with empty array
      sharpSportsMatch: undefined,
      parlayLegs,
    };

    // Fetch strategies in the background and update state when ready
    strategiesPromise.then(strategies => {
      setBetDetails(prev => prev ? { ...prev, strategies } : null);
    }).catch(error => {
      console.error('Error fetching strategies:', error);
    });

    return result;
  };

  // Fetch user strategies
  const fetchUserStrategies = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const { data: strategies, error } = await supabase
        .from('strategies')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching strategies:', error);
        return;
      }

      setUserStrategies(strategies || []);
    } catch (error) {
      console.error('Error fetching strategies:', error);
    }
  }, [user?.id]);

  // Check for existing ticket
  const checkForExistingTicket = useCallback(async () => {
    if (!user?.id || (!betId && !parlayGroup)) return;
    
    setCheckingTicket(true);
    try {
      let betIdsToCheck: string[] = [];
      
      // For parlays, check all leg IDs
      if (parlayGroup) {
        betIdsToCheck = parlayGroup.legs.map(leg => leg.id);
      } else if (betDetails?.bet.is_parlay && betDetails.parlayLegs) {
        betIdsToCheck = betDetails.parlayLegs.map(leg => leg.bet.id);
      } else if (betId) {
        // For single bets
        betIdsToCheck = [betId];
      }
      
      if (betIdsToCheck.length === 0) {
        setHasExistingTicket(false);
        return;
      }
      
      const { data: tickets, error } = await supabase
        .from('bet_tickets')
        .select('id, status')
        .in('bet_id', betIdsToCheck)
        .eq('user_id', user.id)
        .in('status', ['open', 'in_review']); // Only check for non-resolved tickets

      if (error) {
        console.error('Error checking for existing tickets:', error);
        setHasExistingTicket(false);
        return;
      }

      setHasExistingTicket((tickets && tickets.length > 0) || false);
    } catch (error) {
      console.error('Error checking for existing tickets:', error);
      setHasExistingTicket(false);
    } finally {
      setCheckingTicket(false);
    }
  }, [user?.id, betId, parlayGroup, betDetails]);

  // Helper function to check if a game has started
  const hasGameStarted = (gameDate: string): boolean => {
    if (!gameDate) return false;
    const gameTime = new Date(gameDate);
    const now = new Date();
    return now >= gameTime;
  };

  // Check if bet is eligible for adding to strategies (game hasn't started)
  const isBetEligibleForStrategies = (): boolean => {
    if (!betDetails?.bet) return false;
    
    // Check if it's a pending bet
    if (betDetails.bet.status !== 'pending') return false;
    
    // For parlays, check if any game has started
    if (betDetails.bet.is_parlay && betDetails.parlayLegs) {
      for (const leg of betDetails.parlayLegs) {
        if (leg.gameInfo?.game_time && hasGameStarted(leg.gameInfo.game_time)) {
          return false;
        }
        // Also check the bet's game_date if gameInfo is not available
        if (!leg.gameInfo && leg.bet.game_date && hasGameStarted(leg.bet.game_date)) {
          return false;
        }
      }
      return true;
    }
    
    // For single bets, check game start time
    if (betDetails.gameInfo?.game_time && hasGameStarted(betDetails.gameInfo.game_time)) {
      return false;
    }
    
    // Also check the bet's game_date if gameInfo is not available
    if (!betDetails.gameInfo && betDetails.bet.game_date && hasGameStarted(betDetails.bet.game_date)) {
      return false;
    }
    
    return true;
  };

  // Handle add to strategies
  const handleAddToStrategies = () => {
    if (!betDetails?.bet) return;
    filterStrategiesForBet();
    setShowStrategyModal(true);
  };

  // Filter strategies based on bet compatibility
  const filterStrategiesForBet = useCallback(async () => {
    if (!betDetails?.bet || userStrategies.length === 0) {
      setFilteredStrategies(userStrategies);
      setStrategyCompatibility({});
      return;
    }

    try {
      const compatibility: Record<string, boolean> = {};
      
      for (const strategy of userStrategies) {
        let isCompatible = true;
        
        const strategyData: StrategyData = {
          id: strategy.id,
          name: strategy.name,
          sport: strategy.sport,
          filter_config: strategy.filter_config || {},
          user_id: strategy.user_id,
        };
        
        if (betDetails.bet.is_parlay && betDetails.parlayLegs) {
          // For parlays, check all legs
          const parlayLegs = betDetails.parlayLegs.map(leg => ({
            id: leg.bet.id,
            sport: leg.bet.sport,
            bet_type: leg.bet.bet_type,
            side: leg.bet.side,
            is_parlay: leg.bet.is_parlay,
            sportsbook: leg.bet.sportsbook,
            odds: typeof leg.bet.odds === 'string' ? parseFloat(leg.bet.odds) : leg.bet.odds,
            stake: typeof leg.bet.stake === 'string' ? parseFloat(leg.bet.stake) : leg.bet.stake,
            line_value: leg.bet.line_value,
            status: leg.bet.status,
            created_at: leg.bet.placed_at || leg.bet.created_at,
          }));
          
          isCompatible = validateParlayAgainstStrategy(parlayLegs, strategyData);
        } else {
          // For single bets
          const betData = {
            id: betDetails.bet.id,
            sport: betDetails.bet.sport,
            bet_type: betDetails.bet.bet_type,
            side: betDetails.bet.side,
            is_parlay: betDetails.bet.is_parlay,
            sportsbook: betDetails.bet.sportsbook,
            odds: typeof betDetails.bet.odds === 'string' ? parseFloat(betDetails.bet.odds) : betDetails.bet.odds,
            stake: typeof betDetails.bet.stake === 'string' ? parseFloat(betDetails.bet.stake) : betDetails.bet.stake,
            line_value: betDetails.bet.line_value,
            status: betDetails.bet.status,
            created_at: betDetails.bet.placed_at || betDetails.bet.created_at,
          };
          
          isCompatible = validateBetAgainstStrategy(betData, strategyData);
        }
        
        compatibility[strategy.id] = isCompatible;
      }
      
      setStrategyCompatibility(compatibility);
      setFilteredStrategies(userStrategies);
    } catch (error) {
      console.error('Error filtering strategies:', error);
      setFilteredStrategies(userStrategies);
      setStrategyCompatibility({});
    }
  }, [betDetails, userStrategies]);

  // Handle strategy selection
  const handleStrategySelection = (strategyId: string) => {
    // Only allow selection if strategy is compatible
    if (strategyCompatibility[strategyId] === false) return;
    
    setSelectedStrategyIds(prev => 
      prev.includes(strategyId)
        ? prev.filter(id => id !== strategyId)
        : [...prev, strategyId]
    );
  };

  // Handle adding bets to selected strategies
  const handleConfirmAddToStrategies = async () => {
    if (!betDetails?.bet || selectedStrategyIds.length === 0 || !user?.id) return;
    
    setAddingToStrategies(true);
    
    try {
      const betIds = [];
      
      if (betDetails.bet.is_parlay && betDetails.parlayLegs) {
        // For parlays, add all leg IDs
        betIds.push(...betDetails.parlayLegs.map(leg => leg.bet.id));
      } else {
        // For single bets, add the bet ID
        betIds.push(betDetails.bet.id);
      }
      
      // Create strategy_bets entries for each selected strategy
      const insertPromises = selectedStrategyIds.flatMap(strategyId =>
        betIds.map(betId => ({
          strategy_id: strategyId,
          bet_id: betId,
          added_at: new Date().toISOString(),
          parlay_id: betDetails.bet.is_parlay ? betDetails.bet.parlay_id : null,
        }))
      );
      
      const { error } = await supabase
        .from('strategy_bets')
        .insert(insertPromises);
      
      if (error) {
        console.error('Error adding bets to strategies:', error);
        Alert.alert('Error', 'Failed to add bet to strategies');
        return;
      }
      
      Alert.alert(
        'Success',
        `Bet added to ${selectedStrategyIds.length} strateg${selectedStrategyIds.length === 1 ? 'y' : 'ies'}`
      );
      
      setShowStrategyModal(false);
      setSelectedStrategyIds([]);
      
      // Refresh bet details to show updated strategies
      await fetchBetDetails();
    } catch (error) {
      console.error('Error adding bets to strategies:', error);
      Alert.alert('Error', 'Failed to add bet to strategies');
    } finally {
      setAddingToStrategies(false);
    }
  };
  
  // Check if bet is from TrueSharp sportsbook
  const isTrueSharpBet = (): boolean => {
    if (!betDetails?.bet) return false;
    const sportsbook = getCorrectSportsbook(betDetails.bet);
    return sportsbook === 'TrueSharp';
  };
  
  // Handle ticket submission
  const handleSubmitTicket = () => {
    if (!betDetails?.bet) return;
    setShowTicketModal(true);
  };
  
  // Handle ticket form submission
  const handleConfirmTicketSubmission = async () => {
    if (!betDetails?.bet || !selectedReason || !user?.id) return;
    
    if (selectedReason === 'Other' && !customReason.trim()) {
      Alert.alert('Error', 'Please provide a custom reason');
      return;
    }
    
    setSubmittingTicket(true);
    
    try {
      let betIdsToSubmit: string[] = [];
      
      // For parlays, submit tickets for each leg
      if (betDetails.bet.is_parlay && betDetails.parlayLegs) {
        betIdsToSubmit = betDetails.parlayLegs.map(leg => leg.bet.id);
      } else {
        // For single bets, use the bet ID directly
        betIdsToSubmit = [betDetails.bet.id];
      }
      
      // Check if any of the bets already have open tickets
      const openTicketChecks = await Promise.all(
        betIdsToSubmit.map(betId => TicketService.hasOpenTicket(betId, user.id))
      );
      
      const hasAnyOpenTicket = openTicketChecks.some(hasOpen => hasOpen);
      
      if (hasAnyOpenTicket) {
        Alert.alert(
          'Ticket Already Exists',
          'You already have an open ticket for this bet. Please wait for our team to review your existing ticket.'
        );
        setSubmittingTicket(false);
        return;
      }
      
      // Submit tickets for each bet ID
      const ticketPromises = betIdsToSubmit.map(betId => {
        const ticketData: CreateTicketData = {
          bet_id: betId,
          user_id: user.id,
          reason: selectedReason,
          custom_reason: selectedReason === 'Other' ? customReason.trim() : undefined,
          description: ticketDescription.trim() || undefined,
        };
        return TicketService.submitTicket(ticketData);
      });
      
      await Promise.all(ticketPromises);
      
      const ticketCount = betIdsToSubmit.length;
      const ticketWord = ticketCount === 1 ? 'ticket' : 'tickets';
      
      Alert.alert(
        'Ticket Submitted',
        `Your ${ticketWord} ha${ticketCount === 1 ? 's' : 've'} been submitted successfully. Our team will review ${ticketCount === 1 ? 'it' : 'them'} and get back to you soon.`
      );
      
      setShowTicketModal(false);
      setSelectedReason('');
      setCustomReason('');
      setTicketDescription('');
      
      // Refresh ticket check to update the UI
      checkForExistingTicket();
    } catch (error) {
      console.error('Error submitting ticket:', error);
      Alert.alert('Error', 'Failed to submit ticket. Please try again.');
    } finally {
      setSubmittingTicket(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatOdds = (odds: string | number, stake?: number, potentialPayout?: number) => {
    const numericOdds = typeof odds === 'string' ? parseFloat(odds) : odds;
    return formatOddsWithFallback(numericOdds, stake, potentialPayout);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'won': return '#16a34a';
      case 'lost': return '#dc2626';
      case 'pending': return theme.colors.primary;
      case 'void': return theme.colors.text.secondary;
      default: return theme.colors.text.secondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'won': return 'checkmark-circle';
      case 'lost': return 'close-circle';
      case 'pending': return 'time';
      case 'void': return 'remove-circle';
      default: return 'help-circle';
    }
  };

  const formatCleanBetDescription = (bet: any): string => {
    // Special handling for SharpSports bets - use parsed bet_description
    if (bet.bet_source === 'sharpsports' && bet.bet_description) {
      return parseSharpSportsBetDescription(bet.bet_description);
    }

    const betType = bet.bet_type || '';
    const side = bet.side;
    const lineValue = bet.line_value;
    const playerName = bet.player_name;

    if (betType.toLowerCase() === 'moneyline') {
      const teamName = side === 'home' ? bet.home_team : side === 'away' ? bet.away_team : side;
      return teamName ? `${teamName} Moneyline` : 'Moneyline';
    }

    if (betType.toLowerCase() === 'spread') {
      const teamName = side === 'home' ? bet.home_team : side === 'away' ? bet.away_team : side;
      const formattedLine = lineValue !== null && lineValue !== undefined ? 
        (lineValue > 0 ? `+${lineValue}` : `${lineValue}`) : '';
      return teamName ? `${teamName} ${formattedLine}` : formattedLine;
    }

    // Player prop handling
    if (playerName) {
      let propType = 'Prop';
      
      // First, check oddid for multi-stat combinations (takes priority)
      if ((bet as any).oddid) {
        const oddid = (bet as any).oddid;
        const parsedFromOddid = parseMultiStatOddid(oddid);
        // Use oddid parsing if it contains multiple stats (indicated by '+' in the result)
        if (parsedFromOddid && parsedFromOddid.includes('+')) {
          propType = parsedFromOddid.replace(/\b\w/g, l => l.toUpperCase());
        }
      }
      
      // If not a multi-stat combination, use prop_type from database
      if (propType === 'Prop' && bet.prop_type) {
        const propTypeStr = bet.prop_type.toString();
        if (propTypeStr === 'touchdowns') propType = 'Touchdowns';
        else if (propTypeStr === 'passing_touchdowns') propType = 'Passing TDs';
        else if (propTypeStr === 'rushing_touchdowns') propType = 'Rushing TDs';
        else if (propTypeStr === 'receiving_touchdowns') propType = 'Receiving TDs';
        else if (propTypeStr === 'passing_yards') propType = 'Passing Yards';
        else if (propTypeStr === 'rushing_yards') propType = 'Rushing Yards';
        else if (propTypeStr === 'receiving_yards') propType = 'Receiving Yards';
        else if (propTypeStr === 'home_runs') propType = 'Home Runs';
        else if (propTypeStr === 'total_bases') propType = 'Total Bases';
        else if (propTypeStr === 'stolen_bases') propType = 'Stolen Bases';
        else if (propTypeStr === 'field_goals') propType = 'Field Goals';
        else if (propTypeStr === 'three_pointers') propType = '3-Pointers';
        else if (propTypeStr === 'rebounds') propType = 'Rebounds';
        else if (propTypeStr === 'assists') propType = 'Assists';
        else {
          propType = propTypeStr.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        }
      } else if (propType === 'Prop' && (bet as any).oddid) {
        // Final fallback: parse single stats from oddid
        const oddid = (bet as any).oddid;
        const parsedFromOddid = parseMultiStatOddid(oddid);
        if (parsedFromOddid) {
          propType = parsedFromOddid.replace(/\b\w/g, l => l.toUpperCase());
        }
      }
      
      const overUnder = side ? side.toUpperCase() : 'OVER';
      return lineValue && (overUnder === 'OVER' || overUnder === 'UNDER') 
        ? `${overUnder} ${lineValue} ${propType}`
        : `${playerName} ${propType}`;
    }

    // Total bets
    if (betType.toLowerCase() === 'total' || betType.toLowerCase() === 'over' || betType.toLowerCase() === 'under') {
      const overUnder = side ? side.toUpperCase() : (betType.toLowerCase() === 'over' ? 'OVER' : betType.toLowerCase() === 'under' ? 'UNDER' : 'OVER');
      const totalType = getSportTotalType(bet.sport);
      return `${overUnder} ${lineValue || ''} ${totalType}`;
    }

    // Fallback to original description
    return bet.bet_description || (betType ? `${betType} Bet` : '');
  };

  const parseSharpSportsBetDescription = (description: string): string => {
    // Format: "Away Team @ Home Team - [Bet Details]"
    const parts = description.split(' - ');
    if (parts.length < 2) {
      return description;
    }

    const betDetails = parts.slice(1).join(' - ');
    
    // Reorder patterns for better readability
    const moneylineMatch = betDetails.match(/^Moneyline - (.+)$/);
    if (moneylineMatch) {
      return `${moneylineMatch[1]} Moneyline`;
    }

    const homeRunMatch = betDetails.match(/^To Hit A Home Run - (.+)$/);
    if (homeRunMatch) {
      return `${homeRunMatch[1]} To Hit A Home Run`;
    }

    const generalMatch = betDetails.match(/^([^-]+) - (.+)$/);
    if (generalMatch) {
      const market = generalMatch[1].trim();
      const entity = generalMatch[2].trim();
      
      const marketKeywords = ['to hit', 'to score', 'to record', 'moneyline', 'spread', 'total'];
      const shouldReorder = marketKeywords.some(keyword => 
        market.toLowerCase().includes(keyword)
      );
      
      if (shouldReorder) {
        return `${entity} ${market}`;
      }
    }

    return betDetails;
  };

  const getSportTotalType = (sport: string): string => {
    const sportTotals: { [key: string]: string } = {
      'NFL': 'Points',
      'NBA': 'Points', 
      'NCAAF': 'Points',
      'NCAAB': 'Points',
      'MLB': 'Runs',
      'NHL': 'Goals',
      'MLS': 'Goals',
      'Soccer': 'Goals',
      'Tennis': 'Games',
      'Boxing': 'Rounds',
      'MMA': 'Rounds',
    };
    return sportTotals[sport] || 'Points';
  };

  const getCorrectSportsbook = (bet: any): string => {
    // For parlays, check if we have leg data to find actual sportsbook
    if (bet.is_parlay && betDetails?.parlayLegs && betDetails.parlayLegs.length > 0) {
      // Find the first leg with a valid sportsbook
      for (const leg of betDetails.parlayLegs) {
        if (leg.bet.sportsbook && leg.bet.sportsbook !== 'TrueSharp' && leg.bet.sportsbook.toLowerCase() !== 'truesharp') {
          return leg.bet.sportsbook;
        }
      }
      
      // If no external sportsbook found, check bet sources
      for (const leg of betDetails.parlayLegs) {
        if (leg.bet.bet_source && leg.bet.bet_source !== 'manual') {
          // Convert bet_source to proper sportsbook name
          if (leg.bet.bet_source === 'sharpsports') return 'SharpSports';
          if (leg.bet.bet_source === 'fanduel') return 'FanDuel';
          if (leg.bet.bet_source === 'draftkings') return 'DraftKings';
          if (leg.bet.bet_source === 'mgm') return 'BetMGM';
          return leg.bet.bet_source.charAt(0).toUpperCase() + leg.bet.bet_source.slice(1);
        }
      }
    }
    
    // For single bets or fallback
    if (bet.sportsbook && bet.sportsbook !== 'TrueSharp' && bet.sportsbook.toLowerCase() !== 'truesharp') {
      return bet.sportsbook;
    }
    
    if (bet.bet_source && bet.bet_source !== 'manual') {
      if (bet.bet_source === 'sharpsports') return 'SharpSports';
      if (bet.bet_source === 'fanduel') return 'FanDuel';
      if (bet.bet_source === 'draftkings') return 'DraftKings';
      if (bet.bet_source === 'mgm') return 'BetMGM';
      return bet.bet_source.charAt(0).toUpperCase() + bet.bet_source.slice(1);
    }
    
    return 'TrueSharp';
  };

  const renderBetInformation = () => {
    if (!betDetails) return null;
    const bet = betDetails.bet;

    const displayAmount = () => {
      if (bet.status === 'pending') {
        const potentialProfit = (bet.potential_payout || 0) - (bet.stake || 0);
        return { amount: potentialProfit, label: 'Profit' };
      } else if (bet.status === 'won') {
        const profit = bet.profit !== null && bet.profit !== undefined 
          ? bet.profit 
          : (bet.potential_payout || 0) - (bet.stake || 0);
        return { amount: profit, label: 'Profit' };
      } else if (bet.status === 'lost') {
        return { amount: -(bet.stake || 0), label: 'Loss' };
      }
      return { amount: 0, label: 'Amount' };
    };

    const { amount, label } = displayAmount();

    return (
      <View style={styles.section}>
        <View style={[styles.sectionHeader, { backgroundColor: '#ffffff' }]}>
          <View style={styles.sectionHeaderContent}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="receipt" size={18} color={theme.colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Bet Information</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(bet.status) }]}>
            <Ionicons name={getStatusIcon(bet.status)} size={12} color="white" />
            <Text style={styles.statusText}>{bet.status.toUpperCase()}</Text>
          </View>
        </View>

        {/* Enhanced Bet Description */}
        <View style={[styles.betDescriptionContainer, { backgroundColor: '#ffffff' }]}>
          <Text style={styles.betDescriptionText}>{formatCleanBetDescription(bet)}</Text>
        </View>

        <View style={styles.infoGrid}>
          {/* Add to Strategies Button */}
          {isBetEligibleForStrategies() && (
            <View style={styles.addToStrategiesButtonContainer}>
              <TouchableOpacity
                style={styles.addToStrategiesButton}
                onPress={handleAddToStrategies}
              >
                <Ionicons name="add-circle-outline" size={16} color={theme.colors.primary} />
                <Text style={styles.addToStrategiesButtonText}>Add to Strategies</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Primary Financial Cards */}
          <View style={styles.financialCardsContainer}>
            <View style={[styles.financialCard, styles.financialCardWhite]}>
              <Text style={styles.cardLabelBlack} numberOfLines={1} adjustsFontSizeToFit>Odds</Text>
              <Text style={styles.cardValueBlack} numberOfLines={1} adjustsFontSizeToFit>{formatOdds(bet.odds, bet.stake, bet.potential_payout)}</Text>
            </View>
            
            <View style={[styles.financialCard, styles.financialCardWhite]}>
              <Text style={styles.cardLabelBlack} numberOfLines={1} adjustsFontSizeToFit>Stake</Text>
              <Text style={styles.cardValueBlack} numberOfLines={1} adjustsFontSizeToFit>{formatCurrency(bet.stake || 0)}</Text>
            </View>
            
            <View style={[styles.financialCard, styles.financialCardWhite]}>
              <Text style={styles.cardLabelBlack} numberOfLines={1} adjustsFontSizeToFit>Payout</Text>
              <Text style={styles.cardValueBlack} numberOfLines={1} adjustsFontSizeToFit>{formatCurrency(bet.potential_payout || 0)}</Text>
            </View>
            
            <View style={[
              styles.financialCard, 
              styles.financialCardWhite,
              bet.status === 'won' && styles.financialCardGreen,
              bet.status === 'lost' && styles.financialCardRed
            ]}>
              <Text style={[
                styles.cardLabelBlack,
                bet.status === 'won' && styles.cardLabelWhite,
                bet.status === 'lost' && styles.cardLabelWhite,
              ]} numberOfLines={1} adjustsFontSizeToFit>{label}</Text>
              <Text style={[
                styles.cardValueBlack,
                bet.status === 'won' && styles.cardValueWhite,
                bet.status === 'lost' && styles.cardValueWhite,
              ]} numberOfLines={1} adjustsFontSizeToFit>{formatCurrency(amount)}</Text>
            </View>
          </View>

          {/* Detailed Info Rows */}
          <View style={styles.detailsContainer}>

            {/* Additional Details */}
            {bet.bet_type && (
              <View style={styles.detailRow}>
                <View style={styles.detailRowContent}>
                  <Ionicons name="options" size={16} color={theme.colors.text.secondary} />
                  <Text style={styles.detailLabel}>Type</Text>
                </View>
                <View style={styles.detailValueContainer}>
                  <Text style={styles.detailValue}>{bet.bet_type}</Text>
                </View>
              </View>
            )}

            {bet.side && (
              <View style={styles.detailRow}>
                <View style={styles.detailRowContent}>
                  <Ionicons name="trending-up" size={16} color={theme.colors.text.secondary} />
                  <Text style={styles.detailLabel}>Side</Text>
                </View>
                <View style={styles.detailValueContainer}>
                  <Text style={styles.detailValue}>{bet.side.toUpperCase()}</Text>
                </View>
              </View>
            )}

            {bet.line_value && (
              <View style={styles.detailRow}>
                <View style={styles.detailRowContent}>
                  <Ionicons name="bar-chart" size={16} color={theme.colors.text.secondary} />
                  <Text style={styles.detailLabel}>Line</Text>
                </View>
                <View style={styles.detailValueContainer}>
                  <Text style={styles.detailValue}>{bet.line_value}</Text>
                </View>
              </View>
            )}

            {bet.player_name && (
              <View style={styles.detailRow}>
                <View style={styles.detailRowContent}>
                  <Ionicons name="person" size={16} color={theme.colors.text.secondary} />
                  <Text style={styles.detailLabel}>Player</Text>
                </View>
                <View style={styles.detailValueContainer}>
                  <Text style={styles.detailValue}>{bet.player_name}</Text>
                </View>
              </View>
            )}

            <View style={styles.detailRow}>
              <View style={styles.detailRowContent}>
                <Ionicons name="storefront" size={16} color={theme.colors.text.secondary} />
                <Text style={styles.detailLabel}>Sportsbook</Text>
              </View>
              <View style={styles.detailValueContainer}>
                <Text style={styles.detailValue}>{getCorrectSportsbook(bet)}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailRowContent}>
                <Ionicons name="time" size={16} color={theme.colors.text.secondary} />
                <Text style={styles.detailLabel}>Placed</Text>
              </View>
              <View style={styles.detailValueContainer}>
                <Text style={styles.detailValue}>{formatDate(bet.placed_at || '')}</Text>
              </View>
            </View>

            {bet.is_parlay && (
              <View style={styles.detailRow}>
                <View style={styles.detailRowContent}>
                  <Ionicons name="layers" size={16} color={theme.colors.text.secondary} />
                  <Text style={styles.detailLabel}>Parlay</Text>
                </View>
                <View style={styles.detailValueContainer}>
                  <Text style={styles.detailValue}>{betDetails.parlayLegs?.length || 0} legs</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderGameContext = () => {
    if (!betDetails?.gameInfo) return null;
    const game = betDetails.gameInfo;

    return (
      <View style={styles.section}>
        <View style={[styles.sectionHeader, { backgroundColor: '#ffffff' }]}>
          <View style={styles.sectionHeaderContent}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="calendar" size={18} color={theme.colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Game Information</Text>
          </View>
        </View>

        <View style={[styles.gameCard, { backgroundColor: '#ffffff' }]}>
          {/* Game Date/Time at top */}
          <Text style={styles.gameDateTime}>{formatDate(game.game_time)}</Text>
          
          {/* Away @ Home layout */}
          <View style={styles.gameMatchupContainer}>
            {/* Away Team */}
            <View style={styles.teamContainer}>
              <TeamLogo teamName={game.away_team_name || game.away_team} league={game.league} size={50} />
              <Text style={styles.teamName}>{game.away_team_name || game.away_team}</Text>
              {game.away_score !== null && (
                <Text style={styles.teamScore}>{game.away_score}</Text>
              )}
            </View>
            
            {/* @ Symbol and Status */}
            <View style={styles.gameMiddleSection}>
              <Text style={styles.atSymbol}>@</Text>
              <Text style={styles.gameStatus}>{game.status}</Text>
            </View>
            
            {/* Home Team */}
            <View style={styles.teamContainer}>
              <TeamLogo teamName={game.home_team_name || game.home_team} league={game.league} size={50} />
              <Text style={styles.teamName}>{game.home_team_name || game.home_team}</Text>
              {game.home_score !== null && (
                <Text style={styles.teamScore}>{game.home_score}</Text>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };


  const renderStrategies = () => {
    if (!betDetails?.strategies || betDetails.strategies.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={[styles.sectionHeader, { backgroundColor: '#ffffff' }]}>
          <View style={styles.sectionHeaderContent}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="library" size={18} color={theme.colors.primary} />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Strategies ({betDetails.strategies.length})</Text>
          </View>
        </View>

        {betDetails.strategies.map((strategy, index) => (
          <View key={strategy.id} style={styles.strategyListItem}>
            <Text style={styles.strategyListName}>{strategy.name}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderParlayLegs = () => {
    if (!betDetails?.parlayLegs || betDetails.parlayLegs.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={[styles.sectionHeader, { backgroundColor: theme.colors.primary }]}>
          <View style={styles.sectionHeaderContent}>
            <View style={[styles.sectionIconContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name="layers" size={18} color="white" />
            </View>
            <Text style={[styles.sectionTitle, { color: 'white', fontWeight: '700' }]}>
              Parlay Legs ({betDetails.parlayLegs.length})
            </Text>
          </View>
        </View>

        <View style={styles.parlayLegsContainer}>
          {betDetails.parlayLegs.map((leg, index) => (
            <View
              key={leg.bet.id}
              style={[styles.parlayLegCard, { backgroundColor: '#ffffff' }]}
            >
              <View style={styles.parlayLegRow}>
                {/* Enhanced leg number with gradient */}
                <View style={styles.parlayLegLeftSection}>
                  <View style={[
                    styles.parlayLegNumberContainer, 
                    { backgroundColor: getStatusColor(leg.bet.status) }
                  ]}>
                    <Text style={styles.parlayLegNumber}>{index + 1}</Text>
                  </View>
                </View>

                {/* Enhanced center section */}
                <View style={styles.parlayLegCenterSection}>
                  <Text style={styles.parlayLegDescription} numberOfLines={2}>
                    {formatCleanBetDescription(leg.bet)}
                  </Text>
                  <View style={styles.parlayLegMetaRow}>
                    <Ionicons name="location" size={12} color={theme.colors.text.secondary} />
                    <Text style={styles.parlayLegMatchup} numberOfLines={1}>
                      {leg.gameInfo ? (
                        `${leg.gameInfo.away_team} @ ${leg.gameInfo.home_team}`
                      ) : (leg.bet.away_team && leg.bet.home_team) ? (
                        `${leg.bet.away_team} @ ${leg.bet.home_team}`
                      ) : (
                        leg.bet.league ? `${leg.bet.sport} • ${leg.bet.league}` : leg.bet.sport
                      )}
                    </Text>
                  </View>
                </View>

                {/* Enhanced odds section */}
                <View style={styles.parlayLegRightSection}>
                  <View style={[styles.oddsContainer, { backgroundColor: theme.colors.primary }]}>
                    <Text style={styles.parlayLegOdds}>{formatOdds(leg.bet.odds, leg.bet.stake, leg.bet.potential_payout)}</Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Enhanced Modal Header */}
        <LinearGradient
          colors={[theme.colors.primary, '#1e40af', '#0f172a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.modalHeader}
        >
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <View style={styles.closeButtonContainer}>
              <Ionicons name="close" size={22} color="white" />
            </View>
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <View style={styles.titleContainer}>
              <Text style={styles.modalTitle}>Bet Details</Text>
              <Text style={styles.modalSubtitle}>Analysis & Information</Text>
            </View>
          </View>
          
          <View style={styles.headerSpacer} />
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Loading bet details...</Text>
            </View>
          ) : error ? (
            <View style={styles.centerContainer}>
              <Ionicons name="alert-circle" size={48} color={theme.colors.status.error} />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchBetDetails}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : betDetails ? (
            <>
              {!betDetails.bet.is_parlay && renderGameContext()}
              {renderBetInformation()}
              {renderStrategies()}
              {betDetails.parlayLegs && betDetails.parlayLegs.length > 0 && renderParlayLegs()}
              
              {/* Enhanced Submit Ticket Button for TrueSharp Bets */}
              {isTrueSharpBet() && (
                <View style={styles.ticketButtonContainer}>
                  <View style={[
                    styles.ticketButton, 
                    { 
                      backgroundColor: hasExistingTicket ? '#fca5a5' : '#dc2626',
                      opacity: hasExistingTicket ? 0.6 : 1
                    }
                  ]}>
                    <TouchableOpacity
                      style={styles.ticketButtonContent}
                      onPress={handleSubmitTicket}
                      disabled={hasExistingTicket || checkingTicket}
                    >
                      <Ionicons 
                        name="help-circle-outline" 
                        size={18} 
                        color={hasExistingTicket ? '#dc2626' : 'white'} 
                      />
                      <Text style={[
                        styles.ticketButtonText,
                        hasExistingTicket && { color: '#dc2626' }
                      ]}>
                        {checkingTicket ? 'Checking...' : 'Report Issue with Bet'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  {hasExistingTicket && (
                    <View style={styles.ticketExistsMessage}>
                      <Text style={styles.ticketExistsText}>
                        We have received your ticket and will get back to you soon. If you still have issues, please contact{' '}
                        <Text style={styles.emailLink}>info@truesharp.io</Text>
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </>
          ) : (
            <View style={styles.centerContainer}>
              <Text style={styles.placeholderText}>No bet selected</Text>
            </View>
          )}
        </ScrollView>
        
        {/* Add to Strategies Modal */}
        <Modal
          visible={showStrategyModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowStrategyModal(false)}
        >
          <View style={styles.strategyModalContainer}>
            <View style={styles.strategyModalHeader}>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowStrategyModal(false)}
              >
                <Ionicons name="close" size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
              <Text style={styles.strategyModalTitle}>Add to Strategies</Text>
              <View style={styles.modalHeaderSpacer} />
            </View>
            
            <View style={styles.strategyModalContent}>
              <Text style={styles.strategyModalSubtitle}>
                Select strategies to add this bet to:
              </Text>
              <Text style={styles.strategyModalNote}>
                Only compatible strategies are selectable. Incompatible strategies don't match your bet's sport, type, or other filters.
              </Text>
              
              {userStrategies.length === 0 ? (
                <View style={styles.emptyStrategiesContainer}>
                  <Ionicons name="bulb-outline" size={48} color={theme.colors.text.secondary} />
                  <Text style={styles.emptyStrategiesTitle}>No Strategies Found</Text>
                  <Text style={styles.emptyStrategiesSubtitle}>
                    Create strategies first to add bets to them
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={userStrategies}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => {
                    const isCompatible = strategyCompatibility[item.id] !== false;
                    const isSelected = selectedStrategyIds.includes(item.id);
                    
                    return (
                      <TouchableOpacity
                        style={[
                          styles.strategyItem,
                          isSelected && styles.selectedStrategyItem,
                          !isCompatible && styles.incompatibleStrategyItem
                        ]}
                        onPress={() => handleStrategySelection(item.id)}
                        disabled={!isCompatible}
                      >
                        <View style={styles.strategyItemLeft}>
                          <View style={[
                            styles.strategyCheckbox,
                            isSelected && styles.selectedStrategyCheckbox,
                            !isCompatible && styles.incompatibleStrategyCheckbox
                          ]}>
                            {isSelected && (
                              <Ionicons name="checkmark" size={14} color="white" />
                            )}
                          </View>
                          <View style={styles.strategyInfo}>
                            <Text style={[
                              styles.strategyModalName,
                              !isCompatible && styles.incompatibleStrategyText
                            ]}>
                              {item.name}
                            </Text>
                            {item.description && (
                              <Text style={[
                                styles.strategyModalDescription,
                                !isCompatible && styles.incompatibleStrategyText
                              ]}>
                                {item.description}
                              </Text>
                            )}
                          </View>
                        </View>
                        {!isCompatible && (
                          <Ionicons name="ban" size={20} color={theme.colors.text.secondary} />
                        )}
                      </TouchableOpacity>
                    );
                  }}
                  style={styles.strategiesList}
                  showsVerticalScrollIndicator={false}
                />
              )}
              
              {selectedStrategyIds.length > 0 && (
                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    addingToStrategies && styles.confirmButtonDisabled
                  ]}
                  onPress={handleConfirmAddToStrategies}
                  disabled={addingToStrategies}
                >
                  {addingToStrategies ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={styles.confirmButtonText}>
                      Add to {selectedStrategyIds.length} Strateg{selectedStrategyIds.length === 1 ? 'y' : 'ies'}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>
        
        {/* Ticket Submission Modal */}
        <Modal
          visible={showTicketModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowTicketModal(false)}
        >
          <View style={styles.ticketModalContainer}>
            <View style={styles.ticketModalHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowTicketModal(false)}
              >
                <Ionicons name="close" size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
              <Text style={styles.ticketModalTitle}>Report Bet Issue</Text>
              <View style={styles.modalHeaderSpacer} />
            </View>
            
            <ScrollView style={styles.ticketModalContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.ticketModalSubtitle}>
                Please select a reason for reporting this bet:
              </Text>
              
              {ticketReasons.map((reason, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.reasonOption,
                    selectedReason === reason && styles.selectedReasonOption
                  ]}
                  onPress={() => setSelectedReason(reason)}
                >
                  <View style={[
                    styles.reasonRadio,
                    selectedReason === reason && styles.selectedReasonRadio
                  ]}>
                    {selectedReason === reason && (
                      <View style={styles.reasonRadioInner} />
                    )}
                  </View>
                  <Text style={[
                    styles.reasonText,
                    selectedReason === reason && styles.selectedReasonText
                  ]}>
                    {reason}
                  </Text>
                </TouchableOpacity>
              ))}
              
              {selectedReason === 'Other' && (
                <View style={styles.customReasonContainer}>
                  <Text style={styles.inputLabel}>Please specify:</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your custom reason..."
                    value={customReason}
                    onChangeText={setCustomReason}
                    maxLength={200}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              )}
              
              <View style={styles.descriptionContainer}>
                <Text style={styles.inputLabel}>Additional Details (Optional):</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Provide any additional details about the issue..."
                  value={ticketDescription}
                  onChangeText={setTicketDescription}
                  maxLength={500}
                  multiline
                  numberOfLines={4}
                />
              </View>
              
              <TouchableOpacity
                style={[
                  styles.submitTicketButton,
                  (!selectedReason || (selectedReason === 'Other' && !customReason.trim()) || submittingTicket) && 
                  styles.submitTicketButtonDisabled
                ]}
                onPress={handleConfirmTicketSubmission}
                disabled={!selectedReason || (selectedReason === 'Other' && !customReason.trim()) || submittingTicket}
              >
                {submittingTicket ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.submitTicketButtonText}>Submit Ticket</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    ...theme.shadows.lg,
    elevation: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 44, // Same width as close button for balanced layout
  },
  shieldContainer: {
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  titleContainer: {
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
  },
  modalSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
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
    paddingTop: theme.spacing.xs,
  },

  // Loading/Error States
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  loadingText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  errorText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.status.error,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  retryButtonText: {
    color: 'white',
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  placeholderText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },

  // Enhanced Section Styles
  section: {
    backgroundColor: 'white',
    marginHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.md,
    elevation: 4,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
    color: theme.colors.text.primary,
    letterSpacing: 0.3,
  },

  // Status Badge
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    gap: theme.spacing.xs,
  },
  statusText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: 'white',
  },

  // Enhanced Bet Description
  betDescriptionContainer: {
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.xs,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
    elevation: 2,
  },
  betDescriptionText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    lineHeight: 24,
    letterSpacing: 0.2,
  },

  // Enhanced Info Grid
  infoGrid: {
    padding: theme.spacing.md,
  },
  
  // Financial Cards
  financialCardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  financialCard: {
    flex: 1,
    minWidth: '22%',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    ...theme.shadows.sm,
    elevation: 3,
  },
  cardLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardValue: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
  },
  
  // New financial card styles
  financialCardWhite: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  financialCardGreen: {
    backgroundColor: '#16a34a',
    borderColor: '#14532d',
  },
  financialCardRed: {
    backgroundColor: '#dc2626',
    borderColor: '#991b1b',
  },
  financialCardGray: {
    backgroundColor: '#6b7280',
    borderColor: '#4b5563',
  },
  cardLabelBlack: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardValueBlack: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  cardLabelWhite: {
    color: 'rgba(255,255,255,0.9)',
  },
  cardValueWhite: {
    color: 'white',
  },
  
  // Details Container
  detailsContainer: {
    gap: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: '#f8fafc',
    borderRadius: theme.borderRadius.sm,
    marginBottom: 2,
  },
  detailRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    flex: 1,
  },
  detailLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  detailValueContainer: {
    alignItems: 'flex-end',
  },
  detailValue: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  clvValue: {
    fontWeight: theme.typography.fontWeight.bold,
  },
  monospace: {
    fontFamily: 'monospace',
    fontSize: theme.typography.fontSize.xs,
  },

  // Enhanced Game Card
  gameCard: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  gameDateTime: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: theme.spacing.sm,
  },
  gameMatchupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamContainer: {
    flex: 1,
    alignItems: 'center',
  },
  teamName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  teamScore: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  gameMiddleSection: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  atSymbol: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  gameStatus: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: '#f1f5f9',
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.xs,
  },
  scoreLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  scoreValue: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.bold,
  },


  // Enhanced Strategy Card
  strategyCard: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.md,
    elevation: 4,
  },
  strategyHeader: {
    marginBottom: theme.spacing.sm,
  },
  strategyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: 2,
  },
  strategyName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '700',
    color: theme.colors.text.primary,
    flex: 1,
  },
  strategyDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginLeft: 28,
  },
  strategyStats: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  statCard: {
    flex: 1,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    minHeight: 60,
    justifyContent: 'center',
    ...theme.shadows.sm,
    elevation: 2,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '500',
    marginBottom: theme.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '700',
    textAlign: 'center',
  },

  // Simplified Strategy List
  strategyListItem: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    marginBottom: 4,
    backgroundColor: '#ffffff',
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  strategyListName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },

  // Enhanced Parlay Legs Design
  parlayLegsContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  parlayLegCard: {
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.md,
    elevation: 3,
    overflow: 'hidden',
  },
  parlayLegRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  parlayLegLeftSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  parlayLegNumberContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm,
    elevation: 2,
  },
  parlayLegNumber: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '700',
    color: 'white',
  },
  parlayLegCenterSection: {
    flex: 1,
    gap: 2,
  },
  parlayLegDescription: {
    fontSize: theme.typography.fontSize.base,
    color: '#1e293b',
    fontWeight: '600',
    lineHeight: 20,
  },
  parlayLegMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  parlayLegMatchup: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: '500',
    flex: 1,
  },
  parlayLegRightSection: {
    alignItems: 'flex-end',
  },
  oddsContainer: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    minWidth: 60,
    alignItems: 'center',
    ...theme.shadows.sm,
    elevation: 2,
  },
  parlayLegOdds: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
  },

  // Add to Strategies Button
  addToStrategiesButtonContainer: {
    marginBottom: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  addToStrategiesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  addToStrategiesButtonText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },

  // Strategy Modal Styles
  strategyModalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  strategyModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  strategyModalTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  modalHeaderSpacer: {
    width: 32,
  },
  strategyModalContent: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  strategyModalSubtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.sm,
  },
  strategyModalNote: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
  },
  emptyStrategiesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  emptyStrategiesTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  emptyStrategiesSubtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  strategiesList: {
    flex: 1,
  },
  strategyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectedStrategyItem: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  incompatibleStrategyItem: {
    opacity: 0.5,
    backgroundColor: theme.colors.surface,
  },
  strategyItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: theme.spacing.sm,
  },
  strategyCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedStrategyCheckbox: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  incompatibleStrategyCheckbox: {
    borderColor: theme.colors.text.secondary,
  },
  strategyInfo: {
    flex: 1,
  },
  strategyModalName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  strategyModalDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
  incompatibleStrategyText: {
    color: theme.colors.text.secondary,
  },
  confirmButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.lg,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
  },

  // Enhanced Ticket Button Styles
  ticketButtonContainer: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  ticketButton: {
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: '#dc2626',
    ...theme.shadows.md,
    elevation: 4,
  },
  ticketButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  ticketButtonText: {
    fontSize: theme.typography.fontSize.base,
    color: 'white',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  ticketExistsMessage: {
    marginTop: theme.spacing.sm,
    padding: theme.spacing.md,
    backgroundColor: '#f3f4f6',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  ticketExistsText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    textAlign: 'center',
  },
  emailLink: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },

  // Ticket Modal Styles
  ticketModalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  ticketModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  ticketModalTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  ticketModalContent: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  ticketModalSubtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.lg,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  selectedReasonOption: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  reasonRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedReasonRadio: {
    borderColor: theme.colors.primary,
  },
  reasonRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },
  reasonText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    flex: 1,
  },
  selectedReasonText: {
    fontWeight: theme.typography.fontWeight.semibold,
  },
  customReasonContainer: {
    marginTop: theme.spacing.md,
  },
  descriptionContainer: {
    marginTop: theme.spacing.lg,
  },
  inputLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
    marginBottom: theme.spacing.sm,
  },
  textInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    textAlignVertical: 'top',
  },
  submitTicketButton: {
    backgroundColor: theme.colors.status.warning,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  submitTicketButtonDisabled: {
    opacity: 0.6,
  },
  submitTicketButtonText: {
    color: 'white',
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});