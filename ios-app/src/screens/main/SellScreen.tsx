import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Modal, FlatList, TextInput, Dimensions, Share, Image, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
// import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler'; // Removed due to iOS pod conflicts
import { captureRef } from 'react-native-view-shot';
import { fetchAnalyticsSettings } from '../../services/analyticsSettingsService';
import { formatProfitLoss, UnitDisplayOptions } from '../../utils/unitCalculations';
import { AnalyticsSettings } from '../../components/analytics/AnalyticsSettingsModal';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { globalStyles } from '../../styles/globalStyles';
import { theme } from '../../styles/theme';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { BetData, fetchStrategies, Strategy } from '../../services/supabaseAnalytics';
import { validateBetAgainstStrategy, BetData as ValidationBetData, StrategyData, convertFiltersToWebFormat } from '../../utils/strategyValidation';
import { parseMultiStatOddid } from '../../lib/betFormatting';
import { groupBetsByParlay, ParlayGroup } from '../../services/parlayGrouping';
import { formatOddsWithFallback } from '../../utils/oddsCalculation';
import UnifiedBetCard from '../../components/analytics/UnifiedBetCard';
import TrueSharpShield from '../../components/common/TrueSharpShield';
import TrueSharpLogo from '../../components/common/TrueSharpLogo';
import SellerProfileModal from '../../components/marketplace/SellerProfileModal';
import EditSellerProfileModal from '../../components/marketplace/EditSellerProfileModal';
import { Environment } from '../../config/environment';
import MonetizeStrategyModal from '../../components/monetization/MonetizeStrategyModal';
import SellerOnboardingModal from '../../components/monetization/SellerOnboardingModal';
import StripeConnectBrowser from '../../components/webview/StripeConnectBrowser';
import { updateStrategy } from '../../services/supabaseAnalytics';
import { sellerService } from '../../services/sellerService';
import { stripeService } from '../../services/stripeService';
import { stripeSellerDataService, FinancialMetrics } from '../../services/stripeSellerDataService';

type SellTabType = 'overview' | 'strategies' | 'financials' | 'analytics';

interface SellerStats {
  activeSubscribers: number;
  monthlyRevenue: number;
  retentionRate: number;
  growthThisMonth: number;
}

export default function SellScreen() {
  const { user, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<SellTabType>('overview');
  
  // Format odds function for use throughout the component
  const formatOdds = (odds: string | number, stake?: number, potentialPayout?: number) => {
    if (odds === undefined || odds === null) return '0';
    const numericOdds = typeof odds === 'string' ? parseFloat(odds) : odds;
    return formatOddsWithFallback(numericOdds, stake, potentialPayout) || '0';
  };
  
  // Seller stats state
  const [sellerStats, setSellerStats] = useState<SellerStats>({
    activeSubscribers: 0,
    monthlyRevenue: 0,
    retentionRate: 0,
    growthThisMonth: 0,
  });
  
  // Open bets state
  const [openBets, setOpenBets] = useState<BetData[]>([]);
  const [selectedBetIds, setSelectedBetIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [openBetsLoading, setOpenBetsLoading] = useState(false);
  
  // Strategy modal state
  const [showStrategyModal, setShowStrategyModal] = useState(false);
  const [userStrategies, setUserStrategies] = useState<Strategy[]>([]);
  const [selectedStrategyIds, setSelectedStrategyIds] = useState<string[]>([]);
  const [addingToStrategies, setAddingToStrategies] = useState(false);
  
  // Strategy filtering state
  const [filteredStrategies, setFilteredStrategies] = useState<Strategy[]>([]);
  const [strategyCompatibility, setStrategyCompatibility] = useState<Record<string, boolean>>({});

  // Strategy management state
  const [strategiesLoading, setStrategiesLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMonetizeModal, setShowMonetizeModal] = useState(false);
  const [showSellerOnboardingModal, setShowSellerOnboardingModal] = useState(false);
  const [showStripeBrowser, setShowStripeBrowser] = useState(false);
  const [stripeBrowserUrl, setStripeBrowserUrl] = useState<string | null>(null);
  const [showAllBetsModal, setShowAllBetsModal] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [dropdownVisibility, setDropdownVisibility] = useState<Record<string, boolean>>({});
  const [showYesterdayModal, setShowYesterdayModal] = useState(false);
  const [selectedStrategyForYesterday, setSelectedStrategyForYesterday] = useState<Strategy | null>(null);
  const [showLastWeekModal, setShowLastWeekModal] = useState(false);
  const [selectedStrategyForLastWeek, setSelectedStrategyForLastWeek] = useState<Strategy | null>(null);
  const [showLastMonthModal, setShowLastMonthModal] = useState(false);
  const [selectedStrategyForLastMonth, setSelectedStrategyForLastMonth] = useState<Strategy | null>(null);
  const [analyticsSettings, setAnalyticsSettings] = useState<AnalyticsSettings | null>(null);
  const [yesterdayBets, setYesterdayBets] = useState<BetData[]>([]);
  const [yesterdayLoading, setYesterdayLoading] = useState(false);
  const [yesterdayPLValues, setYesterdayPLValues] = useState<Record<string, string>>({});
  const [lastWeekBets, setLastWeekBets] = useState<BetData[]>([]);
  const [lastWeekLoading, setLastWeekLoading] = useState(false);
  const [lastWeekPLValues, setLastWeekPLValues] = useState<Record<string, string>>({});
  const [lastMonthBets, setLastMonthBets] = useState<BetData[]>([]);
  const [lastMonthLoading, setLastMonthLoading] = useState(false);
  const [lastMonthPLValues, setLastMonthPLValues] = useState<Record<string, string>>({});
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [strategyBets, setStrategyBets] = useState<BetData[]>([]);
  const [modalBets, setModalBets] = useState<BetData[]>([]);
  const [groupedModalBets, setGroupedModalBets] = useState<(BetData | ParlayGroup)[]>([]);
  const [strategyBetsLoading, setStrategyBetsLoading] = useState(false);
  const [showOpenBetsModal, setShowOpenBetsModal] = useState(false);
  const [currentOpenBets, setCurrentOpenBets] = useState<(BetData | ParlayGroup)[]>([]);
  
  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSellerProfileModal, setShowSellerProfileModal] = useState(false);
  const [showEditSellerProfileModal, setShowEditSellerProfileModal] = useState(false);
  
  // Seller status state
  const [sellerStatus, setSellerStatus] = useState<{
    isSeller: boolean;
    hasStripeAccount: boolean;
    stripeAccountReady: boolean;
    canMonetizeStrategies: boolean;
    requiresOnboarding: boolean;
  } | null>(null);
  const [checkingSellerStatus, setCheckingSellerStatus] = useState(false);
  const [selectedShareBets, setSelectedShareBets] = useState<string[]>([]);
  const [sharePreviewMode, setSharePreviewMode] = useState(false);
  const [isStrategyPromotion, setIsStrategyPromotion] = useState(false);
  const [expandedParlays, setExpandedParlays] = useState<Set<string>>(new Set());
  const shareTemplateRef = useRef<View>(null);
  const yesterdayTemplateRef = useRef<View>(null);
  const lastWeekTemplateRef = useRef<View>(null);
  const lastMonthTemplateRef = useRef<View>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingYesterdayImage, setIsGeneratingYesterdayImage] = useState(false);
  const [isGeneratingLastWeekImage, setIsGeneratingLastWeekImage] = useState(false);
  const [isGeneratingLastMonthImage, setIsGeneratingLastMonthImage] = useState(false);
  const [sellerProfile, setSellerProfile] = useState<{
    user_id?: string;
    display_name?: string;
    username?: string;
    profile_img?: string;
    banner_img?: string;
    bio?: string;
    // Include profiles data for compatibility
    profile_picture_url?: string;
  } | null>(null);

  // Financial data state
  const [financialData, setFinancialData] = useState<FinancialMetrics>({
    totalGrossRevenue: 0,
    totalNetRevenue: 0,
    totalPlatformFees: 0,
    monthlyGrowthRate: 0,
    averageRevenuePerUser: 0,
    totalSubscribers: 0,
    revenueByFrequency: {
      weekly: 0,
      monthly: 0,
      yearly: 0,
    },
    topPerformingStrategies: [],
  });
  const [financialLoading, setFinancialLoading] = useState(false);
  
  // Analytics data state
  const [analyticsData, setAnalyticsData] = useState({
    totalROI: 0,
    overallWinRate: 0,
    totalBets: 0,
    totalStrategies: 0,
    topStrategies: [],
    performanceBySport: []
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const tabs = [
    { key: 'overview', label: 'Overview', icon: 'stats-chart' },
    { key: 'strategies', label: 'Strategies', icon: 'bulb' },
    { key: 'financials', label: 'Financials', icon: 'card' },
    { key: 'analytics', label: 'Analytics', icon: 'analytics' },
  ] as const;

  // Handle swipe gestures between tabs
  const handleSwipe = useCallback((event: any) => {
    const { translationX, state } = event.nativeEvent;
    
    // Gesture handling removed due to conflicts
    if (false) {
      const currentIndex = tabs.findIndex(tab => tab.key === activeTab);
      
      if (translationX > 50 && currentIndex > 0) {
        // Swipe right - go to previous tab
        setActiveTab(tabs[currentIndex - 1].key as SellTabType);
      } else if (translationX < -50 && currentIndex < tabs.length - 1) {
        // Swipe left - go to next tab
        setActiveTab(tabs[currentIndex + 1].key as SellTabType);
      }
    }
  }, [activeTab, tabs]);

  // Fetch seller stats
  const fetchSellerStats = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Fetch active subscriptions for this seller
      const { data: subscriptions, error: subscriptionsError } = await supabase
        .from('subscriptions')
        .select('id, created_at, price, frequency')
        .eq('seller_id', user.id)
        .eq('status', 'active');

      if (subscriptionsError) {
        console.error('Error fetching subscriptions:', subscriptionsError);
        return;
      }

      const activeSubscribers = subscriptions?.length || 0;

      // Calculate monthly revenue
      const monthlyRevenue = subscriptions?.reduce((total, sub) => {
        const price = Number(sub.price || 0);
        const monthlyPrice = sub.frequency === 'weekly' 
          ? price * 4.33 
          : sub.frequency === 'yearly' 
            ? price / 12 
            : price;
        return total + monthlyPrice;
      }, 0) || 0;

      // Calculate retention rate (subscriptions active > 30 days / total subscriptions)
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const retainedSubs = subscriptions?.filter(sub => 
        new Date(sub.created_at) < thirtyDaysAgo
      ).length || 0;
      const retentionRate = activeSubscribers > 0 ? (retainedSubs / activeSubscribers) * 100 : 0;

      // Calculate growth this month (new subscriptions this month)
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const newSubsThisMonth = subscriptions?.filter(sub =>
        new Date(sub.created_at) >= startOfMonth
      ).length || 0;
      const growthThisMonth = newSubsThisMonth;

      setSellerStats({
        activeSubscribers,
        monthlyRevenue,
        retentionRate,
        growthThisMonth,
      });
    } catch (error) {
      console.error('Error fetching seller stats:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Helper function to check if a game has started
  const hasGameStarted = (gameDate: string): boolean => {
    if (!gameDate) return false;
    const gameTime = new Date(gameDate);
    const now = new Date();
    return now >= gameTime;
  };

  // Filter out parlays where any leg has started
  const filterValidOpenBets = (bets: BetData[]): BetData[] => {
    const now = new Date();
    const parlayGroups = new Map<string, BetData[]>();
    const validSingles: BetData[] = [];
    const validParlayBets: BetData[] = [];

    // Group bets by parlay_id
    bets.forEach(bet => {
      if (bet.parlay_id && bet.is_parlay) {
        if (!parlayGroups.has(bet.parlay_id)) {
          parlayGroups.set(bet.parlay_id, []);
        }
        parlayGroups.get(bet.parlay_id)!.push(bet);
      } else {
        // Single bet - check if game hasn't started
        if (!hasGameStarted(bet.game_date || '')) {
          validSingles.push(bet);
        }
      }
    });
    // Check each parlay group
    parlayGroups.forEach((legs, parlayId) => {
      // A parlay is valid only if ALL legs haven't started yet
      const allLegsNotStarted = legs.every(leg => !hasGameStarted(leg.game_date || ''));
      if (allLegsNotStarted) {
        validParlayBets.push(...legs);
      }
    });
    return [...validSingles, ...validParlayBets];
  };

  // Fetch open bets
  const fetchOpenBets = useCallback(async () => {
    if (!user?.id) return;

    try {
      setOpenBetsLoading(true);
      const { data: bets, error } = await supabase
        .from('bets')
        .select(`
          id,
          sport,
          league,
          home_team,
          away_team,
          bet_type,
          bet_description,
          odds,
          stake,
          potential_payout,
          status,
          placed_at,
          game_date,
          sportsbook,
          prop_type,
          player_name,
          line_value,
          side,
          parlay_id,
          is_parlay,
          bet_source,
          profit,
          user_id,
          oddid,
          odd_source
        `)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('game_date', { ascending: true })
        .limit(50);

      if (error) {
        console.error('Error fetching open bets:', error);
        setOpenBets([]);
      } else {
        // Filter out parlays with started games and games that have already started
        const validOpenBets = filterValidOpenBets(bets || []);
        setOpenBets(validOpenBets);
      }
    } catch (error) {
      console.error('Error fetching open bets:', error);
      setOpenBets([]);
    } finally {
      setOpenBetsLoading(false);
    }
  }, [user?.id]);

  // Fetch user strategies
  const fetchUserStrategies = useCallback(async () => {
    if (!user?.id) return;

    try {
      const strategies = await fetchStrategies(user.id);
      setUserStrategies(strategies);
    } catch (error) {
      console.error('Error fetching strategies:', error);
      setUserStrategies([]);
    }
  }, [user?.id]);

  // Fetch seller profile
  const fetchSellerProfile = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Get the basic profile data for username/display_name
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('display_name, username, profile_picture_url')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile data:', profileError);
        return;
      }

      if (!profileData) {
        console.error('No profile data found for user');
        return;
      }

      // Get the seller profile data
      const { data: sellerData, error: sellerError } = await supabase
        .from('seller_profiles')
        .select('user_id, profile_img, banner_img, bio')
        .eq('user_id', user.id)
        .single();

      // If no seller profile exists, create one
      if (sellerError && sellerError.code === 'PGRST116') {
        const { data: newSellerProfile, error: createError } = await supabase
          .from('seller_profiles')
          .insert({
            user_id: user.id,
            profile_img: profileData.profile_picture_url,
            banner_img: null,
            bio: null
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating seller profile:', createError);
        } else {
        }
      } else if (sellerError) {
        console.error('Error fetching seller profile:', sellerError);
      }

      // Combine the data
      const combinedProfile = {
        ...sellerData,
        ...profileData,
        // Use profile_img from seller_profiles if available, otherwise fallback to profile_picture_url
        profile_picture_url: sellerData?.profile_img || profileData?.profile_picture_url
      };

      setSellerProfile(combinedProfile);
    } catch (error) {
      console.error('Error fetching seller profile:', error);
    }
  }, [user?.id]);

  // Fetch financial data from Supabase
  const fetchFinancialData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setFinancialLoading(true);

      // Fetch Stripe seller data using the new service
      const stripeData = await stripeSellerDataService.fetchSellerStripeData(user.id);

      // Fetch fallback subscriptions data from Supabase
      const { data: subscriptions, error: subsError } = await supabase
        .from('subscriptions')
        .select(`
          id,
          strategy_id,
          subscriber_id,
          seller_id,
          frequency,
          price,
          created_at,
          status,
          strategies!inner(name, id)
        `)
        .eq('seller_id', user.id)
        .eq('status', 'active');

      if (subsError) {
      }

      // Convert data to the format expected by the UI
      const metrics = stripeSellerDataService.convertStripeDataToFinancialMetrics(
        stripeData,
        subscriptions || []
      );

      setFinancialData(metrics);

    } catch (error) {
      console.error('Error fetching financial data:', error);
      // Set fallback empty data
      setFinancialData({
        totalGrossRevenue: 0,
        totalNetRevenue: 0,
        totalPlatformFees: 0,
        monthlyGrowthRate: 0,
        averageRevenuePerUser: 0,
        totalSubscribers: 0,
        revenueByFrequency: {
          weekly: 0,
          monthly: 0,
          yearly: 0,
        },
        topPerformingStrategies: [],
      });
    } finally {
      setFinancialLoading(false);
    }
  }, [user?.id]);

  // Helper functions to handle both single bets and parlays
  const getBetStatus = (bet: BetData | ParlayGroup): string => {
    return bet.status;
  };

  const getBetStake = (bet: BetData | ParlayGroup): number => {
    return parseFloat(bet.stake?.toString() || '0') || 0;
  };

  const getBetProfit = (bet: BetData | ParlayGroup): number => {
    return parseFloat(bet.profit?.toString() || '0') || 0;
  };

  const getBetSport = (bet: BetData | ParlayGroup): string => {
    if ('legs' in bet) {
      // It's a parlay - use the sport field (could be "multi-sport")
      return bet.sport;
    } else {
      // It's a single bet
      return bet.sport || bet.league || 'Unknown';
    }
  };

  const getBetStrategyId = (bet: BetData | ParlayGroup): string => {
    if ('legs' in bet) {
      // For parlays, get strategy_id from the first leg
      return (bet.legs[0] as any)?.strategy_id || '';
    } else {
      // For single bets
      return (bet as any).strategy_id || '';
    }
  };

  // Helper function to map leagues to sports and format text
  const formatSportDisplayText = (text: string): string => {
    if (!text) return 'UNKNOWN';
    
    let formatted = text;
    
    const leagueToSportMap: { [key: string]: string } = {
      'mlb': 'BASEBALL',
      'nfl': 'FOOTBALL',
      'nba': 'BASKETBALL',
      'nhl': 'HOCKEY',
      'ncaab': 'BASKETBALL',
      'ncaaf': 'FOOTBALL',
      'mls': 'SOCCER',
      'ufc': 'MMA',
      'tennis': 'TENNIS',
      'golf': 'GOLF',
      'boxing': 'BOXING',
      'baseball': 'BASEBALL',
      'football': 'FOOTBALL',
      'basketball': 'BASKETBALL',
      'hockey': 'HOCKEY',
      'soccer': 'SOCCER',
      'mma': 'MMA'
    };
    
    const lowerText = formatted.toLowerCase();
    if (leagueToSportMap[lowerText]) {
      formatted = leagueToSportMap[lowerText];
    }
    
    // Convert to uppercase
    return formatted.toUpperCase();
  };

  // Fetch analytics data from Supabase
  const fetchAnalyticsData = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setAnalyticsLoading(true);
      
      // 1. Fetch all user strategies
      const { data: strategies, error: strategiesError } = await supabase
        .from('strategies')
        .select('*')
        .eq('user_id', user.id);
      
      if (strategiesError) throw strategiesError;
      
      // 2. Fetch all bets for these strategies from strategy_bets table with joined bets data
      const strategyIds = (strategies || []).map(s => s.id);
      
      let allBets = [];
      if (strategyIds.length > 0) {
        const { data: strategyBets, error: betsError } = await supabase
          .from('strategy_bets')
          .select(`
            bet_id,
            strategy_id,
            bets!inner (
              id,
              status,
              stake,
              potential_payout,
              placed_at,
              odds,
              bet_type,
              sport,
              home_team,
              away_team,
              side,
              line_value,
              game_date,
              profit,
              parlay_id,
              is_parlay,
              league,
              bet_description,
              sportsbook,
              prop_type,
              player_name,
              bet_source,
              oddid,
              odd_source
            )
          `)
          .in('strategy_id', strategyIds);
        
        if (betsError) throw betsError;
        
        // Flatten the data to get bet objects with strategy_id attached
        const flattenedBets = (strategyBets || []).map(sb => ({
          ...sb.bets,
          strategy_id: sb.strategy_id
        }));
        
        // Group bets by parlay to treat parlays as single bets
        const groupedBets = groupBetsByParlay(flattenedBets);
        
        // Create unified list for analytics - treat each parlay as one bet
        allBets = [
          ...groupedBets.singles,
          ...groupedBets.parlays
        ];
      }
      
      // 3. Calculate overall analytics
      const totalStrategies = strategies?.length || 0;
      const totalBets = allBets.length;
      
      // Calculate overall ROI and win rate
      const completedBets = allBets.filter(bet => getBetStatus(bet) === 'won' || getBetStatus(bet) === 'lost');
      const wonBets = allBets.filter(bet => getBetStatus(bet) === 'won');
      const overallWinRate = completedBets.length > 0 ? (wonBets.length / completedBets.length) * 100 : 0;
      
      // Calculate ROI: (Total Profit / Total Stake) * 100
      const totalStake = allBets.reduce((sum, bet) => sum + getBetStake(bet), 0);
      const totalProfit = allBets.reduce((sum, bet) => sum + getBetProfit(bet), 0);
      const totalROI = totalStake > 0 ? (totalProfit / totalStake) * 100 : 0;
      
      // 4. Calculate top performing strategies
      const strategyStats = strategies?.map(strategy => {
        const strategyBets = allBets.filter(bet => getBetStrategyId(bet) === strategy.id);
        const strategyCompletedBets = strategyBets.filter(bet => getBetStatus(bet) === 'won' || getBetStatus(bet) === 'lost');
        const strategyWonBets = strategyBets.filter(bet => getBetStatus(bet) === 'won');
        
        const strategyStake = strategyBets.reduce((sum, bet) => sum + getBetStake(bet), 0);
        const strategyProfit = strategyBets.reduce((sum, bet) => sum + getBetProfit(bet), 0);
        
        return {
          ...strategy,
          bets: strategyBets.length,
          winRate: strategyCompletedBets.length > 0 ? (strategyWonBets.length / strategyCompletedBets.length) * 100 : 0,
          roi: strategyStake > 0 ? (strategyProfit / strategyStake) * 100 : 0,
          totalStake: strategyStake,
          totalProfit: strategyProfit
        };
      }) || [];
      
      const topStrategies = strategyStats
        .sort((a, b) => b.roi - a.roi)
        .slice(0, 5);
      
      // 5. Calculate performance by sport
      const sportStats = {};
      allBets.forEach(bet => {
        const sport = formatSportDisplayText(getBetSport(bet));
        if (!sportStats[sport]) {
          sportStats[sport] = {
            sport,
            bets: 0,
            completedBets: 0,
            wonBets: 0,
            totalStake: 0,
            totalProfit: 0
          };
        }
        
        sportStats[sport].bets += 1;
        if (getBetStatus(bet) === 'won' || getBetStatus(bet) === 'lost') {
          sportStats[sport].completedBets += 1;
          if (getBetStatus(bet) === 'won') {
            sportStats[sport].wonBets += 1;
          }
        }
        sportStats[sport].totalStake += getBetStake(bet);
        sportStats[sport].totalProfit += getBetProfit(bet);
      });
      
      const performanceBySport = Object.values(sportStats).map(sport => ({
        ...sport,
        winRate: sport.completedBets > 0 ? (sport.wonBets / sport.completedBets) * 100 : 0,
        roi: sport.totalStake > 0 ? (sport.totalProfit / sport.totalStake) * 100 : 0
      })).sort((a, b) => b.bets - a.bets);
      
      setAnalyticsData({
        totalROI,
        overallWinRate,
        totalBets,
        totalStrategies,
        topStrategies,
        performanceBySport
      });
      
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setAnalyticsData({
        totalROI: 0,
        overallWinRate: 0,
        totalBets: 0,
        totalStrategies: 0,
        topStrategies: [],
        performanceBySport: []
      });
    } finally {
      setAnalyticsLoading(false);
    }
  }, [user?.id]);

  // Group open bets into parlays and singles just like Analytics screen
  const groupedOpenBets = useMemo(() => {
    return groupBetsByParlay(openBets);
  }, [openBets]);

  // Create unified list for rendering, sorted chronologically (most recent first)
  const unifiedOpenBetsList = useMemo(() => {
    const allBets: (BetData | ParlayGroup)[] = [
      ...groupedOpenBets.parlays,
      ...groupedOpenBets.singles
    ];
    
    // Sort all bets by placed_at date (most recent first)
    return allBets.sort((a, b) => {
      const aDate = 'legs' in a ? a.placed_at : a.placed_at || '';
      const bDate = 'legs' in b ? b.placed_at : b.placed_at || '';
      return bDate.localeCompare(aDate);
    });
  }, [groupedOpenBets]);

  // Fetch strategies for the Strategies tab with leaderboard data
  const fetchStrategiesForTab = useCallback(async () => {
    if (!user?.id) return;
    
    setStrategiesLoading(true);
    try {
      // First fetch strategies
      const { data: strategies, error } = await supabase
        .from('strategies')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Then fetch leaderboard data for each strategy
      let leaderboardData = [];
      if (strategies && strategies.length > 0) {
        const strategyIds = strategies.map(s => s.id);
        const { data: leaderboard, error: leaderboardError } = await supabase
          .from('strategy_leaderboard')
          .select('*')
          .in('strategy_id', strategyIds);
        
        if (leaderboardError) {
          console.error('Error fetching leaderboard data:', leaderboardError);
        } else {
          leaderboardData = leaderboard || [];
        }
      }
      
      // Process strategies to include leaderboard data
      const processedStrategies = (strategies || []).map(strategy => {
        const leaderboard = leaderboardData.find(lb => lb.strategy_id === strategy.id) || null;
        return {
          ...strategy,
          leaderboard
        };
      });
      
      setUserStrategies(processedStrategies);
      
      // Fetch all bets for all strategies using strategy_bets junction table
      const strategyIds = processedStrategies.map(s => s.id);
      if (strategyIds.length > 0) {
        const { data: strategyBetsData, error: strategyBetsError } = await supabase
          .from('strategy_bets')
          .select(`
            bet_id,
            strategy_id,
            bets (*)
          `)
          .in('strategy_id', strategyIds);
        
        if (strategyBetsError) {
          console.error('Error fetching strategy_bets:', strategyBetsError);
        } else {
          // Flatten the data to get bet objects with strategy_id attached
          const allBets = (strategyBetsData || []).map(sb => ({
            ...sb.bets,
            strategy_id: sb.strategy_id
          }));
          setStrategyBets(allBets || []);
        }
      }
    } catch (error) {
      console.error('Error fetching strategies:', error);
      Alert.alert('Error', 'Failed to load strategies');
    } finally {
      setStrategiesLoading(false);
    }
  }, [user?.id]);

  // Fetch bets associated with a strategy for the "All Bets" modal using strategy_bets table
  const fetchStrategyBetsForModal = useCallback(async (strategyId: string) => {
    if (!user?.id) return;
    
    setStrategyBetsLoading(true);
    try {
      const { data: strategyBetsData, error } = await supabase
        .from('strategy_bets')
        .select(`
          bet_id,
          strategy_id,
          bets (*)
        `)
        .eq('strategy_id', strategyId);

      if (error) throw error;
      
      // Flatten the data to get bet objects
      const bets = (strategyBetsData || []).map(sb => sb.bets).filter(Boolean);
      // Sort by placed_at
      const sortedBets = bets.sort((a, b) => new Date(b.placed_at).getTime() - new Date(a.placed_at).getTime());
      setModalBets(sortedBets);
      
      // Group bets for proper parlay display
      const grouped = groupBetsByParlay(sortedBets);
      const unifiedList: (BetData | ParlayGroup)[] = [
        ...grouped.parlays,
        ...grouped.singles
      ];
      // Sort the unified list by placed_at date (most recent first)
      const sortedUnifiedList = unifiedList.sort((a, b) => {
        const aDate = 'legs' in a ? a.placed_at : a.placed_at || '';
        const bDate = 'legs' in b ? b.placed_at : b.placed_at || '';
        return bDate.localeCompare(aDate);
      });
      setGroupedModalBets(sortedUnifiedList);
    } catch (error) {
      console.error('Error fetching strategy bets:', error);
      Alert.alert('Error', 'Failed to load strategy bets');
    } finally {
      setStrategyBetsLoading(false);
    }
  }, [user?.id]);

  // Fetch open bets for a strategy (games not started yet)
  const getStrategyOpenBets = useCallback((strategy: Strategy) => {
    const rawOpenBets = strategyBets.filter(bet => 
      bet.strategy_id === strategy.id && 
      bet.status === 'pending'
    );
    
    // Apply the same parlay filtering logic as in fetchOpenBets
    const validOpenBets = filterValidOpenBets(rawOpenBets);
    
    // Group the filtered open bets to get proper count
    return groupBetsByParlay(validOpenBets);
  }, [strategyBets]);

  // Get all bets for a strategy (for the "All Bets" count)
  const getStrategyAllBets = useCallback((strategy: Strategy) => {
    return strategyBets.filter(bet => bet.strategy_id === strategy.id);
  }, [strategyBets]);

  // Update strategy
  const updateStrategy = useCallback(async (strategyId: string, updates: Partial<Strategy>) => {
    try {
      const { error } = await supabase
        .from('strategies')
        .update(updates)
        .eq('id', strategyId);

      if (error) throw error;
      
      // Refresh strategies list
      await fetchStrategiesForTab();
      return true;
    } catch (error) {
      console.error('Error updating strategy:', error);
      Alert.alert('Error', 'Failed to update strategy');
      return false;
    }
  }, [fetchStrategiesForTab]);

  // Delete strategy (with Stripe product cleanup)
  const deleteStrategy = useCallback(async (strategyId: string) => {
    try {
      // First, get the strategy details to check if it's monetized
      const { data: strategy, error: fetchError } = await supabase
        .from('strategies')
        .select('stripe_product_id, monetized, name')
        .eq('id', strategyId)
        .single();

      if (fetchError) {
        console.error('Error fetching strategy for deletion:', fetchError);
        throw fetchError;
      }

      // Show appropriate confirmation based on monetization status
      const confirmationTitle = strategy?.monetized ? 'Delete Monetized Strategy' : 'Delete Strategy';
      const confirmationMessage = strategy?.monetized 
        ? `"${strategy.name}" is currently monetized and may have active subscribers. This will cancel all subscriptions, delete the Stripe product, and remove the strategy.\n\nAre you sure you want to continue?`
        : `Are you sure you want to delete "${strategy.name}"? This action cannot be undone.`;

      const confirmed = await new Promise<boolean>((resolve) => {
        Alert.alert(
          confirmationTitle,
          confirmationMessage,
          [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
          ]
        );
      });
      
      if (!confirmed) {
        return false;
      }

      // Use the comprehensive web app API deletion that handles both Stripe and database cleanup
      const result = await stripeService.deleteStrategyWithStripeCleanup(strategyId);
      
      if (!result.success) {
        console.error('❌ Strategy deletion failed:', result.error);
        Alert.alert('Deletion Failed', result.error || 'Failed to delete strategy');
        return false;
      }
      if (result.deletedSubscriptions && result.deletedSubscriptions > 0) {
      }
      
      // Refresh strategies list
      await fetchStrategiesForTab();
      return true;
    } catch (error) {
      console.error('❌ Error deleting strategy:', error);
      Alert.alert('Error', 'Failed to delete strategy');
      return false;
    }
  }, [fetchStrategiesForTab]);

  // Load data on component mount
  useEffect(() => {
    if (user?.id) {
      fetchSellerStats();
      fetchOpenBets();
      fetchUserStrategies();
      fetchSellerProfile();
      if (activeTab === 'strategies') {
        fetchStrategiesForTab();
      }
      if (activeTab === 'financials') {
        fetchFinancialData();
      }
      if (activeTab === 'analytics') {
        fetchAnalyticsData();
      }
    }
  }, [user?.id, activeTab, fetchSellerStats, fetchOpenBets, fetchUserStrategies, fetchSellerProfile, fetchStrategiesForTab, fetchFinancialData, fetchAnalyticsData]);

  const handleBetSelection = (item: BetData | ParlayGroup) => {
    const betId = 'legs' in item ? item.parlay_id : item.id;
    
    setSelectedBetIds(prev => {
      const newSelection = prev.includes(betId) 
        ? prev.filter(id => id !== betId)
        : [...prev, betId];
      
      // Clear selected strategies when bet selection changes
      if (newSelection.length !== prev.length) {
        setSelectedStrategyIds([]);
      }
      
      return newSelection;
    });
  };

  const handleStrategySelection = (strategyId: string) => {
    // Only allow selection if strategy is compatible
    if (strategyCompatibility[strategyId] === false) return;

    setSelectedStrategyIds(prev =>
      prev.includes(strategyId)
        ? prev.filter(id => id !== strategyId)
        : [...prev, strategyId]
    );
  };

  const handleAddToStrategies = () => {
    if (selectedBetIds.length === 0) return;
    filterStrategiesForBets();
    setShowStrategyModal(true);
  };

  // Filter strategies based on selected bets compatibility - using BetDetailsModal approach
  const filterStrategiesForBets = useCallback(() => {
    if (selectedBetIds.length === 0 || userStrategies.length === 0) {
      setFilteredStrategies(userStrategies);
      setStrategyCompatibility({});
      return;
    }

    try {
      const compatibility: Record<string, boolean> = {};
      
      // Use the current openBets instead of fetching again
      const bets = openBets;
      
      for (const strategy of userStrategies) {
        let isCompatible = true;
        
        const strategyData: StrategyData = {
          id: strategy.id,
          name: strategy.name,
          sport: strategy.sport,
          filter_config: strategy.filter_config || {},
          user_id: strategy.user_id,
        };
        
        
        // Check each selected bet/parlay for compatibility
        for (const selectedId of selectedBetIds) {
          // Check if it's a direct bet ID
          const directBet = bets.find(bet => bet.id === selectedId);
          
          if (directBet && !directBet.is_parlay) {
            // Single bet validation with auto-detection
            
            // Auto-detect player props - same logic as BetDetailsModal
            let determinedBetType = directBet.bet_type || 'Unknown';
            
            // Only convert to player_prop if there's actually a player_name
            // Having prop_type alone doesn't guarantee it's a player prop (could be team total)
            if (directBet.player_name) {
              if (!determinedBetType || determinedBetType === 'Unknown' || 
                  (determinedBetType !== 'player_prop' && determinedBetType !== 'prop')) {
                determinedBetType = 'player_prop';
              }
            }
            
            const betData = {
              id: directBet.id,
              sport: directBet.sport || 'Unknown',
              bet_type: determinedBetType,
              side: directBet.side,
              is_parlay: directBet.is_parlay || false,
              sportsbook: directBet.sportsbook || 'Unknown',
              odds: typeof directBet.odds === 'string' ? parseFloat(directBet.odds) : directBet.odds,
              stake: typeof directBet.stake === 'string' ? parseFloat(directBet.stake) : directBet.stake,
              line_value: directBet.line_value,
              status: directBet.status || 'pending',
              created_at: directBet.placed_at || directBet.created_at || new Date().toISOString(),
            };
            
            if (!validateBetAgainstStrategy(betData, strategyData)) {
              isCompatible = false;
              break;
            }
          } else {
            // It's a parlay ID - find all legs for this parlay
            const parlayLegs = bets.filter(bet => bet.parlay_id === selectedId);
            
            if (parlayLegs.length > 0) {
              // For parlays, check all legs with auto-detection
              const parlayLegData = parlayLegs.map(leg => {
                // Auto-detect player props for parlay legs too
                let legBetType = leg.bet_type || 'Unknown';
                if (leg.player_name) {
                  if (!legBetType || legBetType === 'Unknown' || 
                      (legBetType !== 'player_prop' && legBetType !== 'prop')) {
                    legBetType = 'player_prop';
                  }
                }
                
                return {
                  id: leg.id,
                  sport: leg.sport || 'Unknown',
                  bet_type: legBetType,
                  side: leg.side,
                  is_parlay: leg.is_parlay || false,
                  sportsbook: leg.sportsbook || 'Unknown',
                  odds: typeof leg.odds === 'string' ? parseFloat(leg.odds) : leg.odds,
                  stake: typeof leg.stake === 'string' ? parseFloat(leg.stake) : leg.stake,
                  line_value: leg.line_value,
                  status: leg.status || 'pending',
                  created_at: leg.placed_at || leg.created_at || new Date().toISOString(),
                };
              });
              
              // All legs must be compatible for parlay to be valid
              if (!parlayLegData.every(leg => validateBetAgainstStrategy(leg, strategyData))) {
                isCompatible = false;
                break;
              }
            }
          }
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
  }, [selectedBetIds, userStrategies, openBets]);

  const confirmAddBetsToStrategies = async () => {
    if (selectedStrategyIds.length === 0 || selectedBetIds.length === 0 || !user?.id) return;
    
    setAddingToStrategies(true);
    
    try {
      const betIds = [];
      const bets = openBets;
      
      // Collect all bet IDs to add to strategies
      for (const selectedId of selectedBetIds) {
        const directBet = bets.find(bet => bet.id === selectedId);
        
        if (directBet && !directBet.is_parlay) {
          // Single bet
          betIds.push(directBet.id);
        } else {
          // Parlay - add all legs
          const parlayLegs = bets.filter(bet => bet.parlay_id === selectedId);
          betIds.push(...parlayLegs.map(leg => leg.id));
        }
      }
      
      // Call the add-bets-to-strategies API endpoint to handle notifications

      // Add timeout for network requests on iOS devices
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      // Use development URL when in development mode, production URL otherwise
      const apiUrl = Environment.isDevelopment ? 'http://localhost:3000' : Environment.API_BASE_URL;
      
      const response = await fetch(`${apiUrl}/api/add-bets-to-strategies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          betIds,
          strategyIds: selectedStrategyIds,
          userId: user.id
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      let result;
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          result = await response.json();
        } else {
          // Handle non-JSON responses (like HTML error pages)
          const text = await response.text();
          console.error('Non-JSON response received:', text);
          throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      if (!response.ok || !result.success) {
        console.error('Error adding bets to strategies:', result);
        Alert.alert('Error', result.error || 'Failed to add bet to strategies');
        return;
      }

      
      Alert.alert(
        'Success',
        `Bet added to ${selectedStrategyIds.length} strateg${selectedStrategyIds.length === 1 ? 'y' : 'ies'}`
      );
      
      setShowStrategyModal(false);
      setSelectedStrategyIds([]);
      setSelectedBetIds([]);
      
      // Refresh open bets display
      await fetchOpenBets();
      
    } catch (error) {
      console.error('Error adding bets to strategies:', error);
      
      // Provide more specific error messages for different types of network errors
      let errorMessage = 'Failed to add bets to strategies';
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Network request timed out. Please check your internet connection and try again.';
        } else if (error.message.includes('Network request failed')) {
          errorMessage = 'Network connection failed. Please check your internet connection and try again.';
        } else if (error.message.includes('fetch')) {
          errorMessage = 'Unable to connect to server. Please check your internet connection.';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert(
        'Error',
        errorMessage,
        [{ text: 'OK' }]
      );
    } finally {
      setAddingToStrategies(false);
    }
  };

  // Strategy modal handlers
  const handleEditStrategy = (strategy: Strategy) => {
    setSelectedStrategy(strategy);
    setEditName(strategy.name);
    setEditDescription(strategy.description || '');
    setShowEditModal(true);
  };

  const handleMonetizeStrategy = async (strategy: Strategy) => {
    // Check seller status before opening monetization modal
    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      const sellerStatus = await sellerService.getSellerStatus(user.id);
      
      if (!sellerStatus.isSeller || !sellerStatus.canMonetizeStrategies) {
        // Show onboarding modal instead
        setShowSellerOnboardingModal(true);
        return;
      }
    } catch (error) {
      console.error('Error checking seller status:', error);
    }

    // User is ready to monetize
    setSelectedStrategy(strategy);
    setShowMonetizeModal(true);
  };

  const handleShowAllBets = async (strategy: Strategy) => {
    setSelectedStrategy(strategy);
    await fetchStrategyBetsForModal(strategy.id);
    setShowAllBetsModal(true);
  };

  const handleShowOpenBets = (strategy: Strategy, groupedOpenBets?: any) => {
    // Use provided grouped data or fetch fresh data
    const groupedBets = groupedOpenBets || getStrategyOpenBets(strategy);
    const unifiedBetsList = [...groupedBets.parlays, ...groupedBets.singles];
    setCurrentOpenBets(unifiedBetsList);
    setSelectedStrategy(strategy);
    setShowOpenBetsModal(true);
  };

  // Promote strategy handler
  const handlePromoteStrategy = (strategy: Strategy) => {
    setSelectedStrategy(strategy);
    setSelectedShareBets([]);
    setSharePreviewMode(true);
    setIsStrategyPromotion(true);
    setShowShareModal(true);
  };

  // Handle modal close with proper state reset
  const handleCloseShareModal = () => {
    setShowShareModal(false);
    setIsStrategyPromotion(false);
    setSelectedShareBets([]);
    setSharePreviewMode(false);
    setExpandedParlays(new Set());
  };

  const toggleStrategyDropdown = async (strategyId: string) => {
    setDropdownVisibility(prev => ({
      ...prev,
      [strategyId]: !prev[strategyId]
    }));
    
    // Clear existing P/L values for this strategy to force fresh calculation
    // Use placeholder values first to force UI update, then calculate fresh
    setYesterdayPLValues(prev => ({ ...prev, [strategyId]: 'Loading...' }));
    setLastWeekPLValues(prev => ({ ...prev, [strategyId]: 'Loading...' }));
    setLastMonthPLValues(prev => ({ ...prev, [strategyId]: 'Loading...' }));
    
    // Load P/L for all time periods when opening dropdown (always recalculate to ensure fresh data)
    if (!dropdownVisibility[strategyId]) {
      try {
        // Always fetch fresh analytics settings to ensure we have the latest unit size
        let currentAnalyticsSettings = analyticsSettings;
        if (user?.id) {
          try {
            currentAnalyticsSettings = await fetchAnalyticsSettings(user.id);
            setAnalyticsSettings(currentAnalyticsSettings);
          } catch (error) {
            console.error('Error loading analytics settings for dropdown:', error);
            currentAnalyticsSettings = analyticsSettings; // fallback to existing
          }
        }
        
        const dollarDisplayOptions: UnitDisplayOptions = {
          showUnits: false, // Show in dollars instead of units
          unitSize: currentAnalyticsSettings?.unit_size || 1000
        };
        
        // Load yesterday P/L
        try {
          const yesterdayBets = await fetchYesterdayBets(strategyId);
          const yesterdayPerformance = calculateYesterdayPerformance(yesterdayBets);
          const formattedYesterdayPL = formatProfitLoss(yesterdayPerformance.totalProfit, dollarDisplayOptions);
          setYesterdayPLValues(prev => ({ ...prev, [strategyId]: formattedYesterdayPL }));
        } catch (error) {
          setYesterdayPLValues(prev => ({ ...prev, [strategyId]: '$0.00' }));
        }
        
        // Load last week P/L
        try {
          const lastWeekBets = await fetchLastWeekBets(strategyId);
          const lastWeekPerformance = calculateYesterdayPerformance(lastWeekBets); // Same calculation logic
          const formattedLastWeekPL = formatProfitLoss(lastWeekPerformance.totalProfit, dollarDisplayOptions);
          setLastWeekPLValues(prev => ({ ...prev, [strategyId]: formattedLastWeekPL }));
        } catch (error) {
          console.error(`Error calculating last week P/L for strategy ${strategyId}:`, error);
          setLastWeekPLValues(prev => ({ ...prev, [strategyId]: '$0.00' }));
        }
        
        // Load last month P/L
        try {
          const lastMonthBets = await fetchLastMonthBets(strategyId);
          const lastMonthPerformance = calculateYesterdayPerformance(lastMonthBets); // Same calculation logic
          const formattedLastMonthPL = formatProfitLoss(lastMonthPerformance.totalProfit, dollarDisplayOptions);
          setLastMonthPLValues(prev => ({ ...prev, [strategyId]: formattedLastMonthPL }));
        } catch (error) {
          setLastMonthPLValues(prev => ({ ...prev, [strategyId]: '$0.00' }));
        }
        
      } catch (error) {
        console.error('Error loading P/L values for dropdown:', error);
      }
    }
  };

  const handleYesterdayClick = async (strategy: Strategy) => {
    setSelectedStrategyForYesterday(strategy);
    setYesterdayLoading(true);
    
    // Load analytics settings if not already loaded
    if (!analyticsSettings && user?.id) {
      try {
        const settings = await fetchAnalyticsSettings(user.id);
        setAnalyticsSettings(settings);
      } catch (error) {
        console.error('Error loading analytics settings:', error);
      }
    }
    
    // Fetch yesterday's bets
    try {
      const bets = await fetchYesterdayBets(strategy.id);
      setYesterdayBets(bets);
    } catch (error) {
      console.error('Error fetching yesterday bets:', error);
      setYesterdayBets([]);
    } finally {
      setYesterdayLoading(false);
    }
    
    setShowYesterdayModal(true);
  };

  const handleLastWeekClick = async (strategy: Strategy) => {
    setSelectedStrategyForLastWeek(strategy);
    setLastWeekLoading(true);
    
    // Load analytics settings if not already loaded
    if (!analyticsSettings && user?.id) {
      try {
        const settings = await fetchAnalyticsSettings(user.id);
        setAnalyticsSettings(settings);
      } catch (error) {
        console.error('Error loading analytics settings:', error);
      }
    }
    
    // Fetch last week's bets
    try {
      const bets = await fetchLastWeekBets(strategy.id);
      setLastWeekBets(bets);
    } catch (error) {
      console.error('Error fetching last week bets:', error);
      setLastWeekBets([]);
    } finally {
      setLastWeekLoading(false);
    }
    
    setShowLastWeekModal(true);
  };

  const handleLastMonthClick = async (strategy: Strategy) => {
    setSelectedStrategyForLastMonth(strategy);
    setLastMonthLoading(true);
    
    // Load analytics settings if not already loaded
    if (!analyticsSettings && user?.id) {
      try {
        const settings = await fetchAnalyticsSettings(user.id);
        setAnalyticsSettings(settings);
      } catch (error) {
        console.error('Error loading analytics settings:', error);
      }
    }
    
    // Fetch last month's bets
    try {
      const bets = await fetchLastMonthBets(strategy.id);
      setLastMonthBets(bets);
    } catch (error) {
      console.error('Error fetching last month bets:', error);
      setLastMonthBets([]);
    } finally {
      setLastMonthLoading(false);
    }
    
    setShowLastMonthModal(true);
  };

  const handleGenerateYesterdayImage = async () => {
    if (!yesterdayTemplateRef.current) {
      Alert.alert('Error', 'Yesterday template not ready. Please try again.');
      return;
    }

    try {
      setIsGeneratingYesterdayImage(true);
      
      // Delay to ensure the template is fully rendered
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Capture the yesterday template as an image
      const templateWidth = Math.min(350, Dimensions.get('window').width - 60);
      const uri = await captureRef(yesterdayTemplateRef.current, {
        format: 'png',
        quality: 0.9,
        width: templateWidth,
        backgroundColor: 'white',
        result: 'tmpfile',
      });

      // Share the captured image
      await Share.share({
        url: uri,
        message: `Check out yesterday's performance for ${selectedStrategyForYesterday?.name}!`,
      });
    } catch (error) {
      console.error('Error generating yesterday image:', error);
      Alert.alert('Error', 'Failed to generate image. Please try again.');
    } finally {
      setIsGeneratingYesterdayImage(false);
    }
  };

  const handleGenerateLastWeekImage = async () => {
    if (!lastWeekTemplateRef.current) {
      Alert.alert('Error', 'Last week template not ready. Please try again.');
      return;
    }

    try {
      setIsGeneratingLastWeekImage(true);
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const templateWidth = Math.min(350, Dimensions.get('window').width - 60);
      const uri = await captureRef(lastWeekTemplateRef.current, {
        format: 'png',
        quality: 0.9,
        width: templateWidth,
        backgroundColor: 'white',
        result: 'tmpfile',
      });

      await Share.share({
        url: uri,
        message: `Check out last week's performance for ${selectedStrategyForLastWeek?.name}!`,
      });
    } catch (error) {
      console.error('Error generating last week image:', error);
      Alert.alert('Error', 'Failed to generate image. Please try again.');
    } finally {
      setIsGeneratingLastWeekImage(false);
    }
  };

  const handleGenerateLastMonthImage = async () => {
    if (!lastMonthTemplateRef.current) {
      Alert.alert('Error', 'Last month template not ready. Please try again.');
      return;
    }

    try {
      setIsGeneratingLastMonthImage(true);
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const templateWidth = Math.min(350, Dimensions.get('window').width - 60);
      const uri = await captureRef(lastMonthTemplateRef.current, {
        format: 'png',
        quality: 0.9,
        width: templateWidth,
        backgroundColor: 'white',
        result: 'tmpfile',
      });

      // Get month name for message
      const now = new Date();
      const lastMonthName = new Date(now.getFullYear(), now.getMonth() - 1, 1).toLocaleString('default', { month: 'long' });

      await Share.share({
        url: uri,
        message: `Check out ${lastMonthName}'s performance for ${selectedStrategyForLastMonth?.name}!`,
      });
    } catch (error) {
      console.error('Error generating last month image:', error);
      Alert.alert('Error', 'Failed to generate image. Please try again.');
    } finally {
      setIsGeneratingLastMonthImage(false);
    }
  };

  // Get yesterday's bets for a strategy using strategy_bets table
  const fetchYesterdayBets = async (strategyId: string) => {
    if (!user?.id) return [];
    
    try {
      // Calculate yesterday's date range
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: strategyBetsData, error } = await supabase
        .from('strategy_bets')
        .select(`
          bet_id,
          strategy_id,
          bets (*)
        `)
        .eq('strategy_id', strategyId);
        
      if (error) throw error;
      
      // Flatten the data to get bet objects
      const allBets = (strategyBetsData || []).map(sb => sb.bets).filter(Boolean);
      
      // Filter for yesterday's bets
      const yesterdayBets = allBets.filter(bet => {
        const betDate = new Date(bet.bet_date || bet.placed_at);
        betDate.setHours(0, 0, 0, 0);
        return betDate.getTime() === yesterday.getTime();
      });
      
      return yesterdayBets;
    } catch (error) {
      console.error('Error fetching yesterday bets:', error);
      return [];
    }
  };

  // Get last week's bets (last completed week: Monday to Sunday)
  const fetchLastWeekBets = async (strategyId: string) => {
    if (!user?.id) return [];
    
    try {
      // Calculate last completed week (Sunday to Sunday)
      const now = new Date();
      const currentDayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      // Find the last Sunday that has passed
      const daysToLastSunday = currentDayOfWeek === 0 ? 7 : currentDayOfWeek; // If today is Sunday, go back 7 days to previous Sunday
      
      const lastWeekEnd = new Date(now);
      lastWeekEnd.setDate(now.getDate() - daysToLastSunday); // Last completed Sunday
      lastWeekEnd.setHours(23, 59, 59, 999);
      
      const lastWeekStart = new Date(lastWeekEnd);
      lastWeekStart.setDate(lastWeekEnd.getDate() - 6); // Monday of that week
      lastWeekStart.setHours(0, 0, 0, 0);
      
      const { data: strategyBetsData, error } = await supabase
        .from('strategy_bets')
        .select(`
          bet_id,
          strategy_id,
          bets (*)
        `)
        .eq('strategy_id', strategyId);
        
      if (error) throw error;
      
      // Flatten the data to get bet objects
      const allBets = (strategyBetsData || []).map(sb => sb.bets).filter(Boolean);
      
      // Filter for last week's bets
      const lastWeekBets = allBets.filter(bet => {
        const betDate = new Date(bet.bet_date || bet.placed_at);
        return betDate >= lastWeekStart && betDate <= lastWeekEnd;
      });
      
      return lastWeekBets;
    } catch (error) {
      console.error('Error fetching last week bets:', error);
      return [];
    }
  };

  // Get last month's bets (last completed month)
  const fetchLastMonthBets = async (strategyId: string) => {
    if (!user?.id) return [];
    
    try {
      // Calculate last month's date range
      const now = new Date();
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      lastMonthStart.setHours(0, 0, 0, 0);
      
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      lastMonthEnd.setHours(23, 59, 59, 999);
      
      const { data: strategyBetsData, error } = await supabase
        .from('strategy_bets')
        .select(`
          bet_id,
          strategy_id,
          bets (*)
        `)
        .eq('strategy_id', strategyId);
        
      if (error) throw error;
      
      // Flatten the data to get bet objects
      const allBets = (strategyBetsData || []).map(sb => sb.bets).filter(Boolean);
      
      // Filter for last month's bets
      const lastMonthBets = allBets.filter(bet => {
        const betDate = new Date(bet.bet_date || bet.placed_at);
        return betDate >= lastMonthStart && betDate <= lastMonthEnd;
      });
      
      return lastMonthBets;
    } catch (error) {
      console.error('Error fetching last month bets:', error);
      return [];
    }
  };

  // Calculate yesterday's performance with proper parlay handling
  const calculateYesterdayPerformance = (yesterdayBets: BetData[]) => {
    // Use the same parlay grouping logic as analytics screen
    const { parlays, singles } = groupBetsByParlay(yesterdayBets);
    
    // Count total bets: each parlay counts as 1 bet + all singles (matches analytics screen)
    const totalBets = parlays.length + singles.length;
    
    // Create unified bet array for calculations (matches analytics exactly)
    const unifiedBets = [
      // Parlays with their calculated profit/stake from groupBetsByParlay (profit is in dollars)
      ...parlays.map(parlay => ({
        status: parlay.status,
        stake: parlay.stake,
        profit: parlay.profit * 100, // Convert dollars to cents
        placed_at: parlay.placed_at,
        is_parlay: true,
      })),
      // Singles with their profit calculated
      ...singles.map(single => ({
        status: single.status,
        stake: single.stake || 0,
        // Calculate profit for singles (database profit is in dollars, convert to cents)
        profit: single.profit !== null && single.profit !== undefined
          ? single.profit * 100 // Convert dollars to cents 
          : single.status === 'won'
            ? (single.potential_payout || 0) - (single.stake || 0)
            : single.status === 'lost'
              ? -(single.stake || 0)
              : 0,
        placed_at: single.placed_at || single.game_date,
        is_parlay: false,
      })),
    ];
    
    const settledBets = unifiedBets.filter(bet => bet.status === 'won' || bet.status === 'lost');
    const wonBets = settledBets.filter(bet => bet.status === 'won');
    
    // Calculate total profit from unified bets (now all in cents)
    const totalProfit = unifiedBets.reduce((sum, bet) => {
      return sum + bet.profit;
    }, 0);
    
    
    return {
      record: `${wonBets.length}-${settledBets.length - wonBets.length}`,
      totalProfit,
      totalBets,
      settledBets: settledBets.length,
      pendingBets: totalBets - settledBets.length
    };
  };


  // Render yesterday performance modal
  const renderYesterdayModal = () => {
    if (!selectedStrategyForYesterday || !showYesterdayModal) return null;
    
    const performance = calculateYesterdayPerformance(yesterdayBets);
    
    const unitDisplayOptions: UnitDisplayOptions = {
      showUnits: true,
      unitSize: analyticsSettings?.unit_size || 1000 // Default to $10 per unit (1000 cents)
    };
    
    const formattedProfit = formatProfitLoss(performance.totalProfit, unitDisplayOptions);
    const sellerName = sellerProfile?.display_name || sellerProfile?.username || 'Anonymous';
    
    return (
      <Modal
        visible={showYesterdayModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowYesterdayModal(false)}
      >
        <View style={styles.popupOverlay}>
          <View style={styles.popupContainer}>
            <TouchableOpacity
              style={styles.popupCloseButton}
              onPress={() => setShowYesterdayModal(false)}
            >
              <Ionicons name="close" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
            
            {/* Yesterday Performance Preview */}
            <View style={styles.popupImageContainer}>
              <View 
                ref={yesterdayTemplateRef}
                style={styles.yesterdayPerformanceTemplate}
              >
                {/* Main Content Card */}
                <View style={styles.yesterdayMainCard}>
                  {/* Header with Profile Picture and Strategy Info */}
                  <View style={styles.yesterdayHeader}>
                    <View style={styles.yesterdayProfilePicture}>
                      {sellerProfile?.profile_picture_url ? (
                        <Image 
                          source={{ uri: sellerProfile.profile_picture_url }}
                          style={styles.yesterdayProfileImage}
                        />
                      ) : (
                        <View style={styles.yesterdayDefaultProfileImage}>
                          <Ionicons name="person" size={20} color="white" />
                        </View>
                      )}
                    </View>
                    <View style={styles.yesterdayHeaderText}>
                      <Text style={styles.yesterdaySellerName}>@{sellerName}</Text>
                      <Text style={styles.yesterdayStrategyName}>{selectedStrategyForYesterday.name}</Text>
                      <Text style={styles.yesterdayTitle}>Yesterday's Performance</Text>
                    </View>
                  </View>
                  
                  {/* Performance Stats */}
                  <View style={styles.yesterdayStats}>
                    <View style={styles.yesterdayStatItem}>
                      <Text style={styles.yesterdayStatLabel}>Record</Text>
                      <Text style={styles.yesterdayStatValue}>{performance.record}</Text>
                    </View>
                    <View style={styles.yesterdayStatItem}>
                      <Text style={styles.yesterdayStatLabel}>P/L</Text>
                      <Text style={[
                        styles.yesterdayStatValue,
                        { color: performance.totalProfit >= 0 ? theme.colors.betting.won : theme.colors.betting.lost }
                      ]}>
                        {formattedProfit}
                      </Text>
                    </View>
                    <View style={styles.yesterdayStatItem}>
                      <Text style={styles.yesterdayStatLabel}>Bets</Text>
                      <Text style={styles.yesterdayStatValue}>{performance.totalBets}</Text>
                    </View>
                  </View>
                  
                  {/* Loading State */}
                  {yesterdayLoading && (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color={theme.colors.primary} />
                      <Text style={styles.loadingText}>Loading performance...</Text>
                    </View>
                  )}
                  
                  {/* No Data Message */}
                  {!yesterdayLoading && yesterdayBets.length === 0 && (
                    <Text style={styles.noDataText}>No bets found for yesterday</Text>
                  )}
                  
                  {/* TrueSharp Branding at Bottom */}
                  <View style={styles.yesterdayBrandingBubble}>
                    <TrueSharpShield size={12} variant="light" />
                    <Text style={styles.yesterdayBrandingText}>Powered by TrueSharp</Text>
                  </View>
                </View>
              </View>
            </View>
            
            {/* Share Button */}
            <TouchableOpacity
              style={[
                styles.yesterdayShareButton,
                isGeneratingYesterdayImage && styles.shareButtonDisabled
              ]}
              onPress={handleGenerateYesterdayImage}
              disabled={isGeneratingYesterdayImage}
            >
              {isGeneratingYesterdayImage ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="share-outline" size={18} color="white" />
              )}
              <Text style={styles.yesterdayShareButtonText}>
                {isGeneratingYesterdayImage ? 'Generating...' : "Share Yesterday's Performance"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // Render last week performance modal
  const renderLastWeekModal = () => {
    if (!selectedStrategyForLastWeek || !showLastWeekModal) return null;
    
    const performance = calculateYesterdayPerformance(lastWeekBets); // Same calculation logic
    
    const unitDisplayOptions: UnitDisplayOptions = {
      showUnits: true,
      unitSize: analyticsSettings?.unit_size || 1000 // Default to $10 per unit (1000 cents)
    };
    
    const formattedProfit = formatProfitLoss(performance.totalProfit, unitDisplayOptions);
    const sellerName = sellerProfile?.display_name || sellerProfile?.username || 'Anonymous';
    
    return (
      <Modal
        visible={showLastWeekModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowLastWeekModal(false)}
      >
        <View style={styles.popupOverlay}>
          <View style={styles.popupContainer}>
            <TouchableOpacity
              style={styles.popupCloseButton}
              onPress={() => setShowLastWeekModal(false)}
            >
              <Ionicons name="close" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
            
            {/* Last Week Performance Preview */}
            <View style={styles.popupImageContainer}>
              <View 
                ref={lastWeekTemplateRef}
                style={styles.yesterdayPerformanceTemplate}
              >
                {/* Main Content Card */}
                <View style={styles.yesterdayMainCard}>
                  {/* Header with Profile Picture and Strategy Info */}
                  <View style={styles.yesterdayHeader}>
                    <View style={styles.yesterdayProfilePicture}>
                      {sellerProfile?.profile_picture_url ? (
                        <Image 
                          source={{ uri: sellerProfile.profile_picture_url }}
                          style={styles.yesterdayProfileImage}
                        />
                      ) : (
                        <View style={styles.yesterdayDefaultProfileImage}>
                          <Ionicons name="person" size={20} color="white" />
                        </View>
                      )}
                    </View>
                    <View style={styles.yesterdayHeaderText}>
                      <Text style={styles.yesterdaySellerName}>@{sellerName}</Text>
                      <Text style={styles.yesterdayStrategyName}>{selectedStrategyForLastWeek.name}</Text>
                      <Text style={styles.yesterdayTitle}>Last Week's Performance</Text>
                    </View>
                  </View>
                  
                  {/* Performance Stats */}
                  <View style={styles.yesterdayStats}>
                    <View style={styles.yesterdayStatItem}>
                      <Text style={styles.yesterdayStatLabel}>Record</Text>
                      <Text style={styles.yesterdayStatValue}>{performance.record}</Text>
                    </View>
                    <View style={styles.yesterdayStatItem}>
                      <Text style={styles.yesterdayStatLabel}>P/L</Text>
                      <Text style={[
                        styles.yesterdayStatValue,
                        { color: performance.totalProfit >= 0 ? theme.colors.betting.won : theme.colors.betting.lost }
                      ]}>
                        {formattedProfit}
                      </Text>
                    </View>
                    <View style={styles.yesterdayStatItem}>
                      <Text style={styles.yesterdayStatLabel}>Bets</Text>
                      <Text style={styles.yesterdayStatValue}>{performance.totalBets}</Text>
                    </View>
                  </View>
                  
                  {/* Loading State */}
                  {lastWeekLoading && (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color={theme.colors.primary} />
                      <Text style={styles.loadingText}>Loading performance...</Text>
                    </View>
                  )}
                  
                  {/* No Data Message */}
                  {!lastWeekLoading && lastWeekBets.length === 0 && (
                    <Text style={styles.noDataText}>No bets found for last week</Text>
                  )}
                  
                  {/* TrueSharp Branding at Bottom */}
                  <View style={styles.yesterdayBrandingBubble}>
                    <TrueSharpShield size={12} variant="light" />
                    <Text style={styles.yesterdayBrandingText}>Powered by TrueSharp</Text>
                  </View>
                </View>
              </View>
            </View>
            
            {/* Share Button */}
            <TouchableOpacity
              style={[
                styles.yesterdayShareButton,
                isGeneratingLastWeekImage && styles.shareButtonDisabled
              ]}
              onPress={handleGenerateLastWeekImage}
              disabled={isGeneratingLastWeekImage}
            >
              {isGeneratingLastWeekImage ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="share-outline" size={18} color="white" />
              )}
              <Text style={styles.yesterdayShareButtonText}>
                {isGeneratingLastWeekImage ? 'Generating...' : "Share Last Week's Performance"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // Render last month performance modal
  const renderLastMonthModal = () => {
    if (!selectedStrategyForLastMonth || !showLastMonthModal) return null;
    
    const performance = calculateYesterdayPerformance(lastMonthBets); // Same calculation logic
    
    const unitDisplayOptions: UnitDisplayOptions = {
      showUnits: true,
      unitSize: analyticsSettings?.unit_size || 1000 // Default to $10 per unit (1000 cents)
    };
    
    const formattedProfit = formatProfitLoss(performance.totalProfit, unitDisplayOptions);
    const sellerName = sellerProfile?.display_name || sellerProfile?.username || 'Anonymous';
    
    // Get month name
    const now = new Date();
    const lastMonthName = new Date(now.getFullYear(), now.getMonth() - 1, 1).toLocaleString('default', { month: 'long' });
    
    return (
      <Modal
        visible={showLastMonthModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowLastMonthModal(false)}
      >
        <View style={styles.popupOverlay}>
          <View style={styles.popupContainer}>
            <TouchableOpacity
              style={styles.popupCloseButton}
              onPress={() => setShowLastMonthModal(false)}
            >
              <Ionicons name="close" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
            
            {/* Last Month Performance Preview */}
            <View style={styles.popupImageContainer}>
              <View 
                ref={lastMonthTemplateRef}
                style={styles.yesterdayPerformanceTemplate}
              >
                {/* Main Content Card */}
                <View style={styles.yesterdayMainCard}>
                  {/* Header with Profile Picture and Strategy Info */}
                  <View style={styles.yesterdayHeader}>
                    <View style={styles.yesterdayProfilePicture}>
                      {sellerProfile?.profile_picture_url ? (
                        <Image 
                          source={{ uri: sellerProfile.profile_picture_url }}
                          style={styles.yesterdayProfileImage}
                        />
                      ) : (
                        <View style={styles.yesterdayDefaultProfileImage}>
                          <Ionicons name="person" size={20} color="white" />
                        </View>
                      )}
                    </View>
                    <View style={styles.yesterdayHeaderText}>
                      <Text style={styles.yesterdaySellerName}>@{sellerName}</Text>
                      <Text style={styles.yesterdayStrategyName}>{selectedStrategyForLastMonth.name}</Text>
                      <Text style={styles.yesterdayTitle}>{lastMonthName}'s Performance</Text>
                    </View>
                  </View>
                  
                  {/* Performance Stats */}
                  <View style={styles.yesterdayStats}>
                    <View style={styles.yesterdayStatItem}>
                      <Text style={styles.yesterdayStatLabel}>Record</Text>
                      <Text style={styles.yesterdayStatValue}>{performance.record}</Text>
                    </View>
                    <View style={styles.yesterdayStatItem}>
                      <Text style={styles.yesterdayStatLabel}>P/L</Text>
                      <Text style={[
                        styles.yesterdayStatValue,
                        { color: performance.totalProfit >= 0 ? theme.colors.betting.won : theme.colors.betting.lost }
                      ]}>
                        {formattedProfit}
                      </Text>
                    </View>
                    <View style={styles.yesterdayStatItem}>
                      <Text style={styles.yesterdayStatLabel}>Bets</Text>
                      <Text style={styles.yesterdayStatValue}>{performance.totalBets}</Text>
                    </View>
                  </View>
                  
                  {/* Loading State */}
                  {lastMonthLoading && (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color={theme.colors.primary} />
                      <Text style={styles.loadingText}>Loading performance...</Text>
                    </View>
                  )}
                  
                  {/* No Data Message */}
                  {!lastMonthLoading && lastMonthBets.length === 0 && (
                    <Text style={styles.noDataText}>No bets found for {lastMonthName}</Text>
                  )}
                  
                  {/* TrueSharp Branding at Bottom */}
                  <View style={styles.yesterdayBrandingBubble}>
                    <TrueSharpShield size={12} variant="light" />
                    <Text style={styles.yesterdayBrandingText}>Powered by TrueSharp</Text>
                  </View>
                </View>
              </View>
            </View>
            
            {/* Share Button */}
            <TouchableOpacity
              style={[
                styles.yesterdayShareButton,
                isGeneratingLastMonthImage && styles.shareButtonDisabled
              ]}
              onPress={handleGenerateLastMonthImage}
              disabled={isGeneratingLastMonthImage}
            >
              {isGeneratingLastMonthImage ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="share-outline" size={18} color="white" />
              )}
              <Text style={styles.yesterdayShareButtonText}>
                {isGeneratingLastMonthImage ? 'Generating...' : `Share ${lastMonthName}'s Performance`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // Share modal handlers
  const handleShareBetSelection = (bet: BetData | ParlayGroup) => {
    const betId = 'legs' in bet ? bet.parlay_id : bet.id;
    const isParlay = 'legs' in bet;
    
    setSelectedShareBets(prev => {
      const isCurrentlySelected = prev.includes(betId);
      
      if (isCurrentlySelected) {
        // Deselecting - always allowed
        return prev.filter(id => id !== betId);
      }
      
      // Selecting - check constraints
      if (prev.length === 0) {
        // First selection - always allowed
        return [betId];
      }
      
      // Check if we already have selections
      const currentSelections = currentOpenBets.filter(b => {
        const id = 'legs' in b ? b.parlay_id : b.id;
        return prev.includes(id);
      });
      
      if (isParlay) {
        // Trying to select a parlay - only allow if no other bets are selected
        if (currentSelections.length > 0) {
          Alert.alert(
            'Selection Limit',
            'You can only select one parlay at a time. Please deselect other bets first.',
            [{ text: 'OK' }]
          );
          return prev;
        }
        return [betId]; // Only select this parlay
      } else {
        // Trying to select a straight bet - only allow if no parlays are selected
        const hasParlay = currentSelections.some(selection => 'legs' in selection);
        if (hasParlay) {
          Alert.alert(
            'Selection Limit', 
            'You cannot select straight bets when a parlay is selected. Please deselect the parlay first.',
            [{ text: 'OK' }]
          );
          return prev;
        }
        return [...prev, betId];
      }
    });
  };

  const handleSelectAllShareBets = () => {
    if (selectedShareBets.length === currentOpenBets.length) {
      setSelectedShareBets([]);
    } else {
      // Check if there are any parlays in currentOpenBets
      const parlays = currentOpenBets.filter(bet => 'legs' in bet);
      const straightBets = currentOpenBets.filter(bet => !('legs' in bet));
      
      if (parlays.length > 0 && straightBets.length > 0) {
        // Mixed types - only select straight bets (safer choice)
        Alert.alert(
          'Mixed Bet Types',
          'Cannot select all bets when there are both parlays and straight bets. Selecting straight bets only.',
          [{ text: 'OK' }]
        );
        setSelectedShareBets(straightBets.map(bet => bet.id));
      } else if (parlays.length > 1) {
        // Multiple parlays - only select the first one
        Alert.alert(
          'Multiple Parlays',
          'Cannot select multiple parlays. Selecting the first parlay only.',
          [{ text: 'OK' }]
        );
        setSelectedShareBets([parlays[0].parlay_id]);
      } else {
        // All same type or single parlay - select all
        setSelectedShareBets(currentOpenBets.map(bet => 'legs' in bet ? bet.parlay_id : bet.id));
      }
    }
  };

  const handleGenerateShareImage = async () => {
    if (!shareTemplateRef.current) {
      Alert.alert('Error', 'Share template not ready. Please try again.');
      return;
    }

    // For strategy promotion, no bet selection required
    if (!isStrategyPromotion && selectedShareBets.length === 0) {
      Alert.alert('No Bets Selected', 'Please select at least one bet to share.');
      return;
    }

    try {
      setIsGeneratingImage(true);
      
      // Longer delay to ensure the template is fully rendered
      await new Promise(resolve => setTimeout(resolve, 300));
      // Capture the share template as an image
      const templateWidth = Math.min(350, Dimensions.get('window').width - 60);
      const uri = await captureRef(shareTemplateRef.current, {
        format: 'png',
        quality: 0.95,
        result: 'tmpfile',
        width: templateWidth,
        height: undefined, // Let it calculate based on content
      });
      
      // Get username for the marketplace link
      const username = sellerProfile?.username || user?.email?.split('@')[0] || 'user';
      
      let shareMessage = '';
      if (isStrategyPromotion) {
        // Strategy promotion message
        const strategyName = selectedStrategy?.name || 'My Strategy';
        shareMessage = `Check out my ${strategyName} betting strategy on TrueSharp!\n\nFollow my picks: https://truesharp.io/marketplace/${username}`;
      } else {
        // Bet sharing message
        const strategyName = selectedStrategy?.name || 'My Strategy';
        const selectedBetsCount = selectedShareBets.length;
        shareMessage = `Check out today's bet!\nSubscribe to my ${strategyName} strategy on https://truesharp.io/marketplace/${username}`;
      }
      
      await Share.share({
        url: uri,
        message: shareMessage,
      });
    } catch (error) {
      console.error('Error generating share image:', error);
      console.error('Error details:', error.message, error.stack);
      Alert.alert('Error', `Failed to generate share image: ${error.message || 'Unknown error'}. Please try again.`);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const saveStrategyEdit = async () => {
    if (!selectedStrategy || !editName.trim()) return;
    
    const updates = {
      name: editName.trim(),
      description: editDescription.trim() || null,
    };
    
    const success = await updateStrategy(selectedStrategy.id, updates);
    if (success) {
      setShowEditModal(false);
      setSelectedStrategy(null);
    }
  };

  const handleDeleteStrategy = async () => {
    if (!selectedStrategy) return;
    
    Alert.alert(
      'Delete Strategy',
      `Are you sure you want to delete "${selectedStrategy.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteStrategy(selectedStrategy.id);
            if (success) {
              setShowEditModal(false);
              setSelectedStrategy(null);
            }
          },
        },
      ]
    );
  };

  // Check seller status
  const checkSellerStatus = useCallback(async () => {
    if (!user?.id) return;
    
    setCheckingSellerStatus(true);
    try {
      const status = await sellerService.getSellerStatus(user.id);
      setSellerStatus(status);
    } catch (error) {
      console.error('Error checking seller status:', error);
    } finally {
      setCheckingSellerStatus(false);
    }
  }, [user?.id]);

  // Enhanced monetization success/error handlers
  const handleMonetizationSuccess = (message: string) => {
    Alert.alert('Success', message);
    // Refresh strategies and seller status
    fetchStrategiesForTab();
    checkSellerStatus();
  };

  const handleMonetizationError = (message: string) => {
    Alert.alert('Error', message);
  };

  const handleSellerOnboardingSuccess = () => {
    Alert.alert(
      'Setup Complete!', 
      'Your seller account has been set up. You can now monetize your strategies.',
      [
        {
          text: 'OK',
          onPress: () => {
            setShowSellerOnboardingModal(false);
            // Refresh seller status and strategies
            fetchStrategiesForTab();
            checkSellerStatus();
          }
        }
      ]
    );
  };

  // Check seller status when user changes or component loads
  React.useEffect(() => {
    if (user?.id) {
      checkSellerStatus();
    }
  }, [user?.id, checkSellerStatus]);

  const renderSellerActionButtons = () => (
    <View style={styles.sellerActionButtonsContainer}>
      <TouchableOpacity 
        style={styles.sellerActionButton}
        onPress={() => {
          if (!sellerProfile?.username) {
            Alert.alert('Profile Setup Required', 'Please set up your username in your profile settings first.');
            return;
          }
          setShowSellerProfileModal(true);
        }}
        activeOpacity={0.7}
      >
        <Ionicons name="person-outline" size={18} color={theme.colors.primary} />
        <Text style={styles.sellerActionButtonText}>View{'\n'}Profile</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.sellerActionButton}
        onPress={() => setShowEditSellerProfileModal(true)}
        activeOpacity={0.7}
      >
        <Ionicons name="create-outline" size={18} color={theme.colors.primary} />
        <Text style={styles.sellerActionButtonText}>Edit{'\n'}Profile</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.sellerActionButton}
        onPress={async () => {
          try {
            const result = await stripeService.getAccountManagementUrl();
            
            if (!result.success) {
              Alert.alert(
                'Unable to Open Account Management',
                result.error || 'Please try again later.',
                [{ text: 'OK' }]
              );
            } else {
              // Open in-app browser
              setStripeBrowserUrl(result.url!);
              setShowStripeBrowser(true);
            }
          } catch (error) {
            Alert.alert(
              'Error',
              'Failed to open account management. Please try again later.',
              [{ text: 'OK' }]
            );
          }
        }}
        activeOpacity={0.7}
      >
        <Ionicons name="card-outline" size={18} color={theme.colors.primary} />
        <Text style={styles.sellerActionButtonText}>Manage{'\n'}Account</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStrategyCard = (strategy: Strategy) => {
    const groupedOpenBets = getStrategyOpenBets(strategy);
    const openBetsCount = groupedOpenBets.parlays.length + groupedOpenBets.singles.length;
    const allBets = getStrategyAllBets(strategy);
    const leaderboard = strategy.leaderboard;
    return (
      <View key={strategy.id}>
        <View style={styles.strategyCard}>
        <View style={styles.strategyHeader}>
          <View style={styles.strategyCardInfo}>
            <View style={styles.strategyNameRow}>
              <Text style={styles.strategyCardName} numberOfLines={1}>
                {strategy.name}
              </Text>
              {(strategy.monetized || leaderboard?.is_monetized) && (
                <Ionicons name="cash" size={18} color="#10B981" style={styles.monetizedIcon} />
              )}
            </View>
            <Text style={styles.strategyCardDescription} numberOfLines={2}>
              {strategy.description || 'No description'}
            </Text>
          </View>
          <View style={styles.strategyHeaderRight}>
            <TouchableOpacity
              style={styles.promoteButtonContainer}
              onPress={() => handlePromoteStrategy(strategy)}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#007AFF', '#0051D5', '#003D9A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.promoteButton}
              >
                <TrueSharpShield size={14} variant="light" />
                <Text style={styles.promoteButtonText}>Promote</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.strategyStats}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Bets</Text>
            <Text style={styles.statValue}>
              {leaderboard?.total_bets !== undefined ? leaderboard.total_bets : allBets.length}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Win Rate</Text>
            <Text style={styles.statValue}>
              {leaderboard?.win_rate !== undefined && leaderboard.win_rate !== null 
                ? `${(leaderboard.win_rate * 100).toFixed(1)}%` 
                : (strategy.performance_win_rate ? `${strategy.performance_win_rate.toFixed(1)}%` : 'N/A')}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>ROI</Text>
            <Text style={styles.statValue}>
              {leaderboard?.roi_percentage !== undefined && leaderboard.roi_percentage !== null
                ? `${leaderboard.roi_percentage.toFixed(1)}%`
                : (strategy.performance_roi ? `${strategy.performance_roi.toFixed(1)}%` : 'N/A')}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Subs</Text>
            <Text style={styles.statValue}>{strategy.subscriber_count || 0}</Text>
          </View>
        </View>

        {openBetsCount > 0 && (
          <TouchableOpacity 
            style={styles.openBetsBanner}
            onPress={() => handleShowOpenBets(strategy, groupedOpenBets)}
          >
            <View style={styles.openBetsBannerContent}>
              <Ionicons name="time-outline" size={16} color={theme.colors.primary} />
              <Text style={styles.openBetsBannerText}>
                {openBetsCount} Open Bet{openBetsCount !== 1 ? 's' : ''} • Tap to view
              </Text>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.strategyActions}>
          <TouchableOpacity 
            style={styles.actionButtonWrapper} 
            onPress={() => handleEditStrategy(strategy)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#007AFF', '#00B4FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionButton}
            >
              <Ionicons name="create-outline" size={16} color="white" />
              <Text style={styles.actionButtonText}>Edit</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButtonWrapper} 
            onPress={() => handleMonetizeStrategy(strategy)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#007AFF', '#00B4FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionButton}
            >
              <Ionicons name="cash-outline" size={16} color="white" />
              <Text style={styles.actionButtonText}>Monetize</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButtonWrapper} 
            onPress={() => handleShowAllBets(strategy)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#007AFF', '#00B4FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionButton}
            >
              <Ionicons name="list-outline" size={16} color="white" />
              <Text style={styles.actionButtonText}>All Bets</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        </View>
      
        {/* Dropdown Tongue - Outside the card */}
        <View style={styles.dropdownTongueContainer}>
          <TouchableOpacity 
            style={styles.dropdownTab}
            onPress={() => toggleStrategyDropdown(strategy.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.dropdownTabText}>Performance</Text>
            <Ionicons 
              name={dropdownVisibility[strategy.id] ? "chevron-up" : "chevron-down"} 
              size={16} 
              color="#666"
            />
          </TouchableOpacity>
          
          {/* Dropdown Content */}
          {dropdownVisibility[strategy.id] && (
            <View style={styles.dropdownContent}>
              <TouchableOpacity 
                style={styles.dropdownItem}
                onPress={() => handleYesterdayClick(strategy)}
                activeOpacity={0.7}
              >
                <Text style={styles.dropdownItemText}>Yesterday</Text>
                <Text style={[
                  styles.dropdownPLText,
                  { 
                    color: yesterdayPLValues[strategy.id]?.startsWith('+') 
                      ? theme.colors.betting.won 
                      : yesterdayPLValues[strategy.id]?.startsWith('-')
                        ? theme.colors.betting.lost
                        : theme.colors.text.secondary
                  }
                ]}>
                  {yesterdayPLValues[strategy.id] || '—'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.dropdownItem}
                onPress={() => handleLastWeekClick(strategy)}
                activeOpacity={0.7}
              >
                <Text style={styles.dropdownItemText}>Last Week</Text>
                <Text style={[
                  styles.dropdownPLText,
                  { 
                    color: lastWeekPLValues[strategy.id]?.startsWith('+') 
                      ? theme.colors.betting.won 
                      : lastWeekPLValues[strategy.id]?.startsWith('-')
                        ? theme.colors.betting.lost
                        : theme.colors.text.secondary
                  }
                ]}>
                  {lastWeekPLValues[strategy.id] || '—'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.dropdownItem}
                onPress={() => handleLastMonthClick(strategy)}
                activeOpacity={0.7}
              >
                <Text style={styles.dropdownItemText}>{
                  (() => {
                    const now = new Date();
                    const lastMonthName = new Date(now.getFullYear(), now.getMonth() - 1, 1).toLocaleString('default', { month: 'long' });
                    return lastMonthName;
                  })()
                }</Text>
                <Text style={[
                  styles.dropdownPLText,
                  { 
                    color: lastMonthPLValues[strategy.id]?.startsWith('+') 
                      ? theme.colors.betting.won 
                      : lastMonthPLValues[strategy.id]?.startsWith('-')
                        ? theme.colors.betting.lost
                        : theme.colors.text.secondary
                  }
                ]}>
                  {lastMonthPLValues[strategy.id] || '—'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  // Handle "Become a Seller" button press - replicate web app logic
  const handleBecomeASeller = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Use the existing seller service to start onboarding
      const result = await sellerService.startSellerOnboarding(user.id);
      
      if (!result.success) {
        Alert.alert(
          'Unable to Start Onboarding',
          result.error || 'Please try again later.',
          [{ text: 'OK' }]
        );
        return;
      }

      // If we have an onboarding URL, open it in the popup browser
      if (result.onboardingUrl) {
        setStripeBrowserUrl(result.onboardingUrl);
        setShowStripeBrowser(true);
      } else {
        // If no onboarding needed, refresh the seller status
        await checkSellerStatus();
        Alert.alert(
          'Account Setup Complete',
          'Your seller account is ready to use!',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error becoming a seller:', error);
      Alert.alert(
        'Error',
        'Failed to set up seller account. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const renderSummaryCards = () => {
    // If user is not a seller, show only the "Become a Seller" card
    if (sellerStatus && !sellerStatus.isSeller) {
      return (
        <View style={styles.summaryCardsContainer}>
          <View style={styles.becomeSellerCard}>
            <View style={styles.becomeSellerHeader}>
              <TrueSharpShield size={40} />
              <Text style={styles.becomeSellerTitle}>Become a Seller</Text>
            </View>
            <Text style={styles.becomeSellerDescription}>
              Start selling your strategies directly through TrueSharp. Set prices, earn revenue, and manage your subscribers easily.
            </Text>
            <TouchableOpacity 
              style={styles.becomeSellerButton} 
              onPress={handleBecomeASeller}
            >
              <LinearGradient
                colors={[theme.colors.primary, '#0056b3']}
                style={styles.becomeSellerButtonGradient}
              >
                <Text style={styles.becomeSellerButtonText}>Become a Seller</Text>
                <Ionicons name="arrow-forward" size={16} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // If user is a seller but Stripe account is incomplete, show completion card
    if (sellerStatus && sellerStatus.isSeller && !sellerStatus.canMonetizeStrategies) {
      return (
        <View style={styles.summaryCardsContainer}>
          <View style={styles.becomeSellerCard}>
            <View style={styles.becomeSellerHeader}>
              <Ionicons name="card-outline" size={40} color={theme.colors.primary} />
              <Text style={styles.becomeSellerTitle}>Complete Seller Onboarding</Text>
            </View>
            <Text style={styles.becomeSellerDescription}>
              Your seller account needs to be completed with Stripe to start monetizing strategies and receiving payments.
            </Text>
            <TouchableOpacity 
              style={styles.becomeSellerButton} 
              onPress={handleBecomeASeller}
            >
              <LinearGradient
                colors={[theme.colors.primary, '#0056b3']}
                style={styles.becomeSellerButtonGradient}
              >
                <Text style={styles.becomeSellerButtonText}>Complete Seller Onboarding</Text>
                <Ionicons name="arrow-forward" size={16} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // If user is fully set up as seller, show normal KPI cards
    return (
      <View style={styles.summaryCardsContainer}>
        {renderSellerActionButtons()}
        <View style={styles.summaryCardsRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardLabel}>Active Subscribers</Text>
            <Text style={styles.summaryCardValue}>
              {loading ? '...' : sellerStats.activeSubscribers}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardLabel}>Monthly Revenue</Text>
            <Text style={styles.summaryCardValue}>
              {loading ? '...' : `$${sellerStats.monthlyRevenue.toFixed(0)}`}
            </Text>
          </View>
        </View>
        <View style={styles.summaryCardsRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardLabel}>Retention Rate</Text>
            <Text style={styles.summaryCardValue}>
              {loading ? '...' : `${sellerStats.retentionRate.toFixed(1)}%`}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardLabel}>Growth This Month</Text>
            <Text style={styles.summaryCardValue}>
              {loading ? '...' : `+${sellerStats.growthThisMonth}`}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderStrategyModal = () => (
    <Modal
      visible={showStrategyModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowStrategyModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowStrategyModal(false)}
          >
            <Ionicons name="close" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Add to Strategies</Text>
          <View style={styles.modalHeaderSpacer} />
        </View>
        
        <View style={styles.modalContent}>
          <Text style={styles.modalSubtitle}>
            Select strategies to add {selectedBetIds.length} bet{selectedBetIds.length !== 1 ? 's' : ''} to:
          </Text>
          <Text style={styles.modalNote}>
            Only compatible strategies are selectable. Incompatible strategies don't match your selected bets' sport, type, or other filters.
          </Text>
          
          {filteredStrategies.length === 0 ? (
            <View style={styles.emptyStrategiesContainer}>
              <Ionicons name="bulb-outline" size={48} color={theme.colors.text.light} />
              <Text style={styles.emptyStrategiesTitle}>No Strategies Found</Text>
              <Text style={styles.emptyStrategiesSubtitle}>
                Create strategies first to add bets to them
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredStrategies}
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
                    <View style={styles.strategyCheckbox}>
                      <View style={[
                        styles.checkbox,
                        isSelected && styles.checkboxSelected,
                        !isCompatible && styles.checkboxDisabled
                      ]}>
                        {isSelected && (
                          <Ionicons name="checkmark" size={16} color="white" />
                        )}
                        {!isCompatible && (
                          <Ionicons name="close" size={16} color={theme.colors.text.light} />
                        )}
                      </View>
                    </View>
                    <View style={styles.strategyCardInfo}>
                      <Text style={[
                        styles.strategyCardName,
                        !isCompatible && styles.incompatibleStrategyText
                      ]}>
                        {item.name}
                      </Text>
                      <Text style={[
                        styles.strategyCardDescription,
                        !isCompatible && styles.incompatibleStrategyText
                      ]}>
                        {!isCompatible 
                          ? 'Incompatible with selected bets'
                          : (item.description || 'No description')
                        }
                      </Text>
                    </View>
                    {!isCompatible && (
                      <View style={styles.incompatibleIcon}>
                        <Ionicons name="warning" size={20} color={theme.colors.text.light} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
        
        {userStrategies.length > 0 && (
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[
                styles.confirmButton,
                (selectedStrategyIds.length === 0 || addingToStrategies) && styles.confirmButtonDisabled
              ]}
              onPress={confirmAddBetsToStrategies}
              disabled={selectedStrategyIds.length === 0 || addingToStrategies}
            >
              {addingToStrategies ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.confirmButtonText}>
                  Add bets to strategies
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );

  const renderEditStrategyModal = () => (
    <Modal
      visible={showEditModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowEditModal(false)}
    >
      <KeyboardAvoidingView 
        style={styles.modalContainer} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalContainer}>
            <View style={styles.editModalHeader}>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowEditModal(false)}
              >
                <Ionicons name="close" size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
              <View style={styles.editModalTitleContainer}>
                <TrueSharpShield size={20} variant="default" />
                <Text style={styles.editModalTitle}>Edit Strategy</Text>
              </View>
              <View style={styles.modalHeaderSpacer} />
            </View>
            
            <View style={styles.editModalContent}>
              <View style={styles.editInputsContainer}>
                <View style={styles.editInputGroup}>
                  <View style={styles.editInputLabelContainer}>
                    <Ionicons name="pencil" size={14} color={theme.colors.text.secondary} />
                    <Text style={styles.editInputLabel}>Strategy Name</Text>
                  </View>
                  <TextInput
                    style={styles.editTextInput}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Enter strategy name"
                    maxLength={100}
                  />
                </View>
                
                <View style={styles.editInputGroup}>
                  <View style={styles.editInputLabelContainer}>
                    <Ionicons name="pencil" size={14} color={theme.colors.text.secondary} />
                    <Text style={styles.editInputLabel}>Description</Text>
                  </View>
                  <TextInput
                    style={[styles.editTextInput, styles.editTextArea]}
                    value={editDescription}
                    onChangeText={setEditDescription}
                    placeholder="Enter strategy description"
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>
              </View>
              
              <View style={styles.editModalActions}>
                <TouchableOpacity
                  style={styles.editDeleteButton}
                  onPress={handleDeleteStrategy}
                >
                  <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                  <Text style={styles.editDeleteButtonText}>Delete</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.editSaveButton, !editName.trim() && styles.editSaveButtonDisabled]}
                  onPress={saveStrategyEdit}
                  disabled={!editName.trim()}
                >
                  <Text style={styles.editSaveButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );

  const renderMonetizeModal = () => (
    <Modal
      visible={showMonetizeModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowMonetizeModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowMonetizeModal(false)}
          >
            <Ionicons name="close" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Monetize Strategy</Text>
          <View style={styles.modalHeaderSpacer} />
        </View>
        
        <View style={styles.modalContent}>
          <View style={styles.disclaimerContainer}>
            <Ionicons name="information-circle" size={20} color={theme.colors.status.warning} />
            <Text style={styles.disclaimerText}>
              By monetizing your strategy, you agree to share your betting picks with subscribers. 
              Performance data and track record will be publicly visible.
            </Text>
          </View>
          
          <View style={styles.pricingContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Weekly Price ($)</Text>
              <TextInput
                style={styles.textInput}
                value={weeklyPrice}
                onChangeText={setWeeklyPrice}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Monthly Price ($)</Text>
              <TextInput
                style={styles.textInput}
                value={monthlyPrice}
                onChangeText={setMonthlyPrice}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Yearly Price ($)</Text>
              <TextInput
                style={styles.textInput}
                value={yearlyPrice}
                onChangeText={setYearlyPrice}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        </View>
        
        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={saveMonetizationSettings}
          >
            <Text style={styles.confirmButtonText}>Save Monetization Settings</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderAllBetsModal = () => (
    <Modal
      visible={showAllBetsModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowAllBetsModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowAllBetsModal(false)}
          >
            <Ionicons name="close" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {selectedStrategy?.name} - All Bets
          </Text>
          <View style={styles.modalHeaderSpacer} />
        </View>
        
        <View style={styles.modalContent}>
          {strategyBetsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Loading bets...</Text>
            </View>
          ) : groupedModalBets.length === 0 ? (
            <View style={styles.emptyBetsContainer}>
              <Ionicons name="list-outline" size={48} color={theme.colors.text.light} />
              <Text style={styles.emptyBetsTitle}>No Bets Found</Text>
              <Text style={styles.emptyBetsSubtitle}>
                No bets are associated with this strategy yet
              </Text>
            </View>
          ) : (
            <FlatList
              data={groupedModalBets}
              keyExtractor={(item) => 'legs' in item ? item.parlay_id : item.id}
              renderItem={({ item }) => (
                <View style={styles.modalBetCardWrapper}>
                  <UnifiedBetCard bet={item} />
                </View>
              )}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
    </Modal>
  );

  const renderOpenBetsModal = () => (
    <Modal
      visible={showOpenBetsModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowOpenBetsModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowOpenBetsModal(false)}
          >
            <Ionicons name="close" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            Open Bets - {selectedStrategy?.name}
          </Text>
          <TouchableOpacity
            style={styles.openBetsPromoteButton}
            onPress={() => {
              // Close the open bets modal first, then open the share modal
              setShowOpenBetsModal(false);
              setTimeout(() => {
                setSelectedShareBets([]);
                setSharePreviewMode(false);
                setIsStrategyPromotion(false);
                setShowShareModal(true);
              }, 100);
            }}
          >
            <TrueSharpShield size={16} variant="light" />
            <Text style={styles.openBetsPromoteButtonText}>Promote</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.openBetsModalContent}>
          <Text style={styles.modalSubtitle}>
            {currentOpenBets.length} pending bet{currentOpenBets.length !== 1 ? 's' : ''} for upcoming games
          </Text>
          
          {currentOpenBets.length === 0 ? (
            <View style={styles.emptyBetsContainer}>
              <Ionicons name="time-outline" size={48} color={theme.colors.text.light} />
              <Text style={styles.emptyBetsTitle}>No Open Bets</Text>
              <Text style={styles.emptyBetsSubtitle}>
                All bets for this strategy have been settled
              </Text>
            </View>
          ) : (
            <FlatList
              data={currentOpenBets}
              keyExtractor={(item) => 'legs' in item ? item.parlay_id : item.id}
              renderItem={({ item, index }) => (
                <View style={[
                  styles.openBetsModalBetWrapper,
                  index === currentOpenBets.length - 1 && styles.lastBetInContainer
                ]}>
                  <UnifiedBetCard bet={item} />
                </View>
              )}
              showsVerticalScrollIndicator={false}
              style={styles.openBetsModalList}
              contentContainerStyle={styles.openBetsModalContent}
            />
          )}
        </View>
      </View>
    </Modal>
  );

  // Blurred text component for preview mode
  const BlurredText = ({ children, style, blurred = false, ...props }) => {
    if (!blurred) {
      return <Text style={style} {...props}>{children}</Text>;
    }
    // Create a high-quality blur effect that maintains text shape while obscuring content
    return (
      <View style={{ 
        position: 'relative',
        borderRadius: 8,
        overflow: 'hidden',
        minHeight: 20,
        justifyContent: 'center',
        paddingVertical: 2,
        paddingHorizontal: 4,
      }}>
        {/* Background text shadow for shape */}
        <Text 
          style={[
            style, 
            { 
              opacity: 0.06,
              color: '#374151',
              textShadowColor: 'rgba(55, 65, 81, 0.08)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 3,
            }
          ]} 
          {...props}
        >
          {children}
        </Text>
        
        {/* Multiple overlay layers for smooth blur effect */}
        <View 
          style={[
            StyleSheet.absoluteFillObject, 
            { 
              backgroundColor: 'rgba(229, 231, 235, 0.92)',
              borderRadius: 8,
            }
          ]} 
        />
        <View 
          style={[
            StyleSheet.absoluteFillObject, 
            { 
              backgroundColor: 'rgba(156, 163, 175, 0.75)',
              borderRadius: 8,
              transform: [{ scale: 0.98 }],
            }
          ]} 
        />
        <View 
          style={[
            StyleSheet.absoluteFillObject, 
            { 
              backgroundColor: 'rgba(209, 213, 219, 0.65)',
              borderRadius: 8,
              transform: [{ scale: 0.96 }],
            }
          ]} 
        />
        
        {/* Subtle gradient overlay for depth */}
        <View 
          style={[
            StyleSheet.absoluteFillObject, 
            { 
              backgroundColor: 'rgba(243, 244, 246, 0.5)',
              borderRadius: 8,
              opacity: 0.85,
            }
          ]} 
        />
        
        {/* Enhanced visual pattern to indicate blurred content */}
        <View style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: [{ translateX: -18 }, { translateY: -1.5 }],
          flexDirection: 'row',
          gap: 2,
        }}>
          <View style={{ width: 5, height: 3, backgroundColor: 'rgba(107,114,128,0.35)', borderRadius: 1.5 }} />
          <View style={{ width: 10, height: 3, backgroundColor: 'rgba(107,114,128,0.35)', borderRadius: 1.5 }} />
          <View style={{ width: 7, height: 3, backgroundColor: 'rgba(107,114,128,0.35)', borderRadius: 1.5 }} />
          <View style={{ width: 12, height: 3, backgroundColor: 'rgba(107,114,128,0.35)', borderRadius: 1.5 }} />
        </View>
      </View>
    );
  };

  // Component that wraps UnifiedBetCard with blurring capability for share template
  const BlurrableUnifiedBetCard = ({ bet, blurFirstLine }: {
    bet: BetData | ParlayGroup;
    blurFirstLine: boolean;
  }) => {
    if ('legs' in bet) {
      // It's a parlay
      const parlay = bet as ParlayGroup;
      
      if (blurFirstLine) {
        // Preview mode: show parlay type and odds only (simple format for image)
        return (
          <View style={styles.blurredBetCard}>
            <View style={styles.blurredBetContent}>
              <View style={styles.blurredBetLeft}>
                <Text style={styles.blurredBetMainLine}>
                  {parlay.legs.length} Leg Parlay
                </Text>
                <Text style={styles.blurredBetSubLine}>
                  {parlay.sport}
                </Text>
                <Text style={styles.blurredBetTertiaryLine}>
                  {parlay.placed_at ? new Date(parlay.placed_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  }) : `${parlay.legs.length} legs`}
                </Text>
              </View>
              <View style={styles.blurredBetRight}>
                <Text style={styles.blurredBetOdds}>
                  {formatOdds(parlay.odds, parlay.stake, parlay.potential_payout)}
                </Text>
              </View>
            </View>
          </View>
        );
      } else {
        // No preview mode: show parlay with legs for image generation
        // Helper functions for formatting leg details (reused from ShareableUnifiedBetCard)
        const formatLegMarketLine = (leg: any): string => {
          // Special handling for SharpSports legs - use parsed bet_description
          if (leg.bet_source === 'sharpsports' && leg.bet_description) {
            const parts = leg.bet_description.split(' - ');
            if (parts.length >= 2) {
              const betDetails = parts.slice(1).join(' - ');
              // Apply reordering rules for better readability
              const moneylineMatch = betDetails.match(/^Moneyline - (.+)$/);
              if (moneylineMatch) {
                return `${moneylineMatch[1]} Moneyline`;
              }
              return betDetails;
            }
          }

          // Default logic for all other bet sources
          const betType = leg.bet_type || 'Unknown';
          const side = leg.side;
          const lineValue = leg.line_value;
          const playerName = leg.player_name;

          if (betType.toLowerCase() === 'moneyline') {
            const teamName = side === 'home' ? leg.home_team : side === 'away' ? leg.away_team : side;
            return `${teamName || 'Team'} ML`;
          }

          if (betType.toLowerCase() === 'spread') {
            const teamName = side === 'home' ? leg.home_team : side === 'away' ? leg.away_team : side;
            const formattedLine = lineValue !== null && lineValue !== undefined ? 
              (lineValue > 0 ? `+${lineValue}` : `${lineValue}`) : '';
            return `${teamName || 'Team'} ${formattedLine}`;
          }

          if (betType.toLowerCase() === 'total' || betType.toLowerCase() === 'over' || betType.toLowerCase() === 'under') {
            const overUnder = side ? side.toUpperCase() : (betType.toLowerCase() === 'over' ? 'OVER' : betType.toLowerCase() === 'under' ? 'UNDER' : 'OVER');
            return `${overUnder} ${lineValue || ''}`;
          }

          if (betType.toLowerCase().includes('prop') && playerName) {
            const overUnder = side ? side.toUpperCase() : 'OVER';
            let propType = 'Points';
            
            if (leg.prop_type) {
              const propTypeStr = leg.prop_type.toString();
              if (propTypeStr === 'home_runs') propType = 'Home Runs';
              else if (propTypeStr === 'total_bases') propType = 'Total Bases';
              else if (propTypeStr === 'passing_yards') propType = 'Passing Yards';
              else if (propTypeStr === 'rushing_yards') propType = 'Rushing Yards';
              else if (propTypeStr === 'receiving_yards') propType = 'Receiving Yards';
              else if (propTypeStr === 'touchdowns') propType = 'Touchdowns';
              else {
                propType = propTypeStr.replace(/_/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase());
              }
            }
            
            return `${playerName} ${propType} ${overUnder} ${lineValue || ''}`;
          }

          return leg.bet_description || `${betType} ${lineValue || ''}`;
        };

        const formatLegTeamMatchup = (leg: any): string => {
          // Special handling for SharpSports legs - extract matchup from bet_description
          if (leg.bet_source === 'sharpsports' && leg.bet_description) {
            const parts = leg.bet_description.split(' - ');
            if (parts.length >= 2) {
              const matchup = parts[0].trim();
              if (matchup.includes(' @ ')) {
                return matchup;
              }
            }
          }

          // Default logic for other bet sources
          if (!leg.home_team || !leg.away_team) {
            return '';
          }
          return `${leg.away_team} @ ${leg.home_team}`;
        };
        
        return (
          <View style={styles.blurredBetCard}>
            <View style={styles.blurredBetContent}>
              <View style={styles.blurredBetLeft}>
                <Text style={styles.blurredBetMainLine}>
                  {parlay.legs.length}-Leg Parlay
                </Text>
                <Text style={styles.blurredBetSubLine}>
                  {parlay.sport}
                </Text>
                <Text style={styles.blurredBetTertiaryLine}>
                  {parlay.placed_at ? new Date(parlay.placed_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  }) : `${parlay.legs.length} legs • ${parlay.sport}`}
                </Text>
              </View>
              <View style={styles.blurredBetRight}>
                <Text style={styles.blurredBetOdds}>
                  {formatOdds(parlay.odds, parlay.stake, parlay.potential_payout)}
                </Text>
              </View>
            </View>
            
            {/* Parlay Legs Section for image generation */}
            <View style={styles.blurredParlayLegs}>
              {parlay.legs.map((leg, index) => (
                <View key={leg.id} style={styles.blurredLegRow}>
                  {/* Leg Number */}
                  <View style={styles.blurredLegNumber}>
                    <Text style={styles.blurredLegNumberText}>{index + 1}</Text>
                  </View>
                  
                  {/* Leg Content */}
                  <View style={styles.blurredLegContent}>
                    <Text style={styles.blurredLegMarketLine} numberOfLines={1}>
                      {formatLegMarketLine(leg)}
                    </Text>
                    <Text style={styles.blurredLegTeamMatchup} numberOfLines={1}>
                      {formatLegTeamMatchup(leg)}
                    </Text>
                    <Text style={styles.blurredLegInfo} numberOfLines={1}>
                      {leg.bet_type || 'Unknown'} • {leg.league || leg.sport || 'Unknown'}
                    </Text>
                  </View>

                  {/* Leg Odds */}
                  <View style={styles.blurredLegRight}>
                    <Text style={styles.blurredLegOdds}>
                      {formatOdds(leg.odds, leg.stake, leg.potential_payout)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        );
      }
    } else {
      // It's a single bet
      const singleBet = bet as BetData;
      
      if (blurFirstLine) {
        // Preview mode: show teams/time, blur bet details  
        return (
          <View style={styles.blurredBetCard}>
            <View style={styles.blurredBetContent}>
              <View style={styles.blurredBetLeft}>
                <BlurredText style={styles.blurredBetMainLine} blurred={true}>
                  {formatMarketLineForShare(singleBet)}
                </BlurredText>
                <Text style={styles.blurredBetSubLine}>
                  {formatTeamMatchupForShare(singleBet)}
                </Text>
                <Text style={styles.blurredBetTertiaryLine}>
                  {singleBet.game_date ? new Date(singleBet.game_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  }) : formatPlacementInfoForShare(singleBet)}
                </Text>
              </View>
              <View style={styles.blurredBetRight}>
                <Text style={styles.blurredBetOdds}>
                  {singleBet.odds > 0 ? `+${singleBet.odds}` : `${singleBet.odds}`}
                </Text>
              </View>
            </View>
          </View>
        );
      } else {
        // No preview mode: match ShareableUnifiedBetCard format exactly
        return (
          <View style={styles.blurredBetCard}>
            <View style={styles.blurredBetContent}>
              <View style={styles.blurredBetLeft}>
                <Text style={styles.blurredBetMainLine}>
                  {formatMarketLineForShare(singleBet)}
                </Text>
                <Text style={styles.blurredBetSubLine}>
                  {formatTeamMatchupForShare(singleBet)}
                </Text>
                <Text style={styles.blurredBetTertiaryLine}>
                  {formatPlacementInfoForShare(singleBet)}
                </Text>
              </View>
              <View style={styles.blurredBetRight}>
                <Text style={styles.blurredBetOdds}>
                  {singleBet.odds > 0 ? `+${singleBet.odds}` : `${singleBet.odds}`}
                </Text>
              </View>
            </View>
          </View>
        );
      }
    }
  };

  // Share template component for image generation
  const ShareTemplate = () => {
    const selectedBets = currentOpenBets.filter(bet => {
      const betId = 'legs' in bet ? bet.parlay_id : bet.id;
      return selectedShareBets.includes(betId);
    });
    const strategyName = selectedStrategy?.name || 'My Strategy';
    const sellerName = sellerProfile?.display_name || sellerProfile?.username || 'Anonymous';
    
    return (
      <View 
        ref={shareTemplateRef}
        style={styles.enhancedShareTemplate}
      >
        {/* Banner Section with natural aspect ratio */}
        <View style={styles.bannerSection}>
          {sellerProfile?.banner_img ? (
            <Image
              source={{ uri: sellerProfile.banner_img }}
              style={styles.bannerImage}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primaryDark]}
              style={styles.defaultBanner}
            />
          )}
          
          {/* TrueSharp Badge overlaying banner */}
          <View style={styles.truesharpBadgeOverlay}>
            <TrueSharpShield size={10} variant="light" />
            <Text style={styles.poweredByTrueSharpOverlay}>Powered by TrueSharp</Text>
          </View>
        </View>

        {/* Profile Picture overlapping banner */}
        <View style={styles.profilePictureContainer}>
          {sellerProfile?.profile_picture_url ? (
            <Image 
              source={{ uri: sellerProfile.profile_picture_url }}
              style={styles.overlappingProfileImage}
            />
          ) : (
            <View style={styles.overlappingDefaultProfileImage}>
              <Ionicons name="person" size={28} color="white" />
            </View>
          )}
        </View>

        {/* Profile Info Section with username beside photo */}
        <View style={styles.profileInfoRowSection}>
          <View style={styles.profilePhotoSpacer} />
          <View style={styles.profileTextSection}>
            <Text style={styles.sellerNameBeside}>{sellerName}</Text>
          </View>
        </View>

        {/* Strategy title directly under profile photo */}
        <View style={styles.strategyTitleSection}>
          <Text style={styles.strategyNameBelow}>{strategyName}</Text>
        </View>

        {/* Bets section with enhanced styling */}
        <View style={styles.enhancedBetsContainer}>
          {selectedBets.map((bet, index) => {
            const betId = 'legs' in bet ? bet.parlay_id : bet.id;
            return (
              <View key={betId} style={[
                styles.enhancedBetCard,
                index === selectedBets.length - 1 && styles.lastBetInContainer
              ]}>
                <BlurrableUnifiedBetCard 
                  bet={bet} 
                  blurFirstLine={sharePreviewMode}
                />
              </View>
            );
          })}
        </View>

        {/* Enhanced Footer */}
        <View style={styles.enhancedShareFooter}>
          <View style={styles.footerGradient}>
            <LinearGradient
              colors={['rgba(59, 130, 246, 0.1)', 'rgba(59, 130, 246, 0.05)']}
              style={styles.footerGradientBg}
            />
            <Text style={styles.shareFooterText}>
              Get access to more winning strategies on TrueSharp
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // Strategy Share Template component for strategy promotion
  const StrategyShareTemplate = () => {
    const strategy = selectedStrategy;
    if (!strategy) return null;

    const groupedOpenBets = getStrategyOpenBets(strategy);
    const allBets = getStrategyAllBets(strategy);
    const leaderboard = strategy.leaderboard;
    const sellerName = sellerProfile?.display_name || sellerProfile?.username || 'Anonymous';

    return (
      <View 
        ref={shareTemplateRef}
        style={styles.strategyShareTemplate}
      >
        {/* Banner Section */}
        <View style={styles.bannerSection}>
          {sellerProfile?.banner_img ? (
            <Image
              source={{ uri: sellerProfile.banner_img }}
              style={styles.bannerImage}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primaryDark]}
              style={styles.defaultBanner}
            />
          )}
          
          {/* TrueSharp Badge overlaying banner */}
          <View style={styles.truesharpBadgeOverlay}>
            <TrueSharpShield size={10} variant="light" />
            <Text style={styles.poweredByTrueSharpOverlay}>Powered by TrueSharp</Text>
          </View>
        </View>

        {/* Profile Picture overlapping banner */}
        <View style={styles.profilePictureContainer}>
          {sellerProfile?.profile_picture_url ? (
            <Image 
              source={{ uri: sellerProfile.profile_picture_url }}
              style={styles.overlappingProfileImage}
            />
          ) : (
            <View style={styles.overlappingDefaultProfileImage}>
              <Ionicons name="person" size={28} color="white" />
            </View>
          )}
        </View>

        {/* Strategy Card Section - moved up to reduce white space */}
        <View style={styles.strategyShareCardContainer}>
          <View style={styles.strategyShareCard}>
            <Text style={styles.strategyShareTitle}>{strategy.name}</Text>
            <Text style={styles.strategyShareDescription} numberOfLines={2}>
              {strategy.description || 'No description'}
            </Text>
            
            {/* Strategy Stats */}
            <View style={styles.strategyShareStats}>
              <View style={styles.shareStatItem}>
                <Text style={styles.shareStatLabel}>Total Bets</Text>
                <Text style={styles.shareStatValue}>
                  {leaderboard?.total_bets !== undefined ? leaderboard.total_bets : allBets.length}
                </Text>
              </View>
              <View style={styles.shareStatItem}>
                <Text style={styles.shareStatLabel}>Win Rate</Text>
                <Text style={styles.shareStatValue}>
                  {leaderboard?.win_rate !== undefined && leaderboard.win_rate !== null 
                    ? `${(leaderboard.win_rate * 100).toFixed(1)}%` 
                    : (strategy.performance_win_rate ? `${strategy.performance_win_rate.toFixed(1)}%` : 'N/A')}
                </Text>
              </View>
              <View style={styles.shareStatItem}>
                <Text style={styles.shareStatLabel}>ROI</Text>
                <Text style={styles.shareStatValue}>
                  {leaderboard?.roi_percentage !== undefined && leaderboard.roi_percentage !== null
                    ? `${leaderboard.roi_percentage.toFixed(1)}%`
                    : (strategy.performance_roi ? `${strategy.performance_roi.toFixed(1)}%` : 'N/A')}
                </Text>
              </View>
              <View style={styles.shareStatItem}>
                <Text style={styles.shareStatLabel}>Subs</Text>
                <Text style={styles.shareStatValue}>{strategy.subscriber_count || 0}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderShareModal = () => {
    if (isStrategyPromotion) {
      return (
        <Modal
          visible={showShareModal}
          animationType="fade"
          transparent={true}
          onRequestClose={handleCloseShareModal}
        >
          <View style={styles.popupOverlay}>
            <View style={styles.popupContainer}>
              <TouchableOpacity
                style={styles.popupCloseButton}
                onPress={handleCloseShareModal}
              >
                <Ionicons name="close" size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
              
              {/* Strategy Share Preview */}
              <View style={styles.popupImageContainer}>
                <StrategyShareTemplate />
              </View>

              {/* Share Button */}
              <TouchableOpacity
                style={[
                  styles.popupShareButton,
                  isGeneratingImage && styles.shareButtonDisabled
                ]}
                onPress={handleGenerateShareImage}
                disabled={isGeneratingImage}
              >
                {isGeneratingImage ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Ionicons name="share-outline" size={20} color="white" />
                    <Text style={styles.shareButtonText}>Share Strategy</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      );
    }

    return (
    <Modal
      visible={showShareModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCloseShareModal}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={handleCloseShareModal}
          >
            <Ionicons name="close" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Share Strategy</Text>
          <View style={styles.modalHeaderSpacer} />
        </View>
        
        <FlatList
          style={styles.shareModalList}
          data={currentOpenBets}
          keyExtractor={(item) => 'legs' in item ? item.parlay_id : item.id}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={() => (
            <View>
              {/* Strategy Info */}
              <View style={styles.shareStrategyHeader}>
                <Text style={styles.shareStrategyName}>{selectedStrategy?.name}</Text>
                <Text style={styles.shareStrategyDescription}>
                  {selectedStrategy?.description || 'No description provided'}
                </Text>
              </View>

              {/* Controls */}
              <View style={styles.shareControlsContainer}>
                <View style={styles.shareControlsRow}>
                  <TouchableOpacity
                    style={styles.selectAllButton}
                    onPress={handleSelectAllShareBets}
                  >
                    <Text style={styles.selectAllButtonText}>
                      {selectedShareBets.length === currentOpenBets.length ? 'Deselect All' : 'Select All'}
                    </Text>
                  </TouchableOpacity>
                  
                  <View style={styles.previewToggleContainer}>
                    <Text style={styles.previewToggleLabel}>Preview</Text>
                    <TouchableOpacity
                      style={[styles.previewToggle, sharePreviewMode && styles.previewToggleActive]}
                      onPress={() => setSharePreviewMode(!sharePreviewMode)}
                    >
                      <View style={[styles.previewToggleThumb, sharePreviewMode && styles.previewToggleThumbActive]} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Section Title */}
              <View style={styles.shareSectionTitleContainer}>
                <Text style={styles.shareSectionTitle}>
                  Select Bets to Share ({selectedShareBets.length}/{currentOpenBets.length})
                </Text>
              </View>
            </View>
          )}
          renderItem={({ item, index }) => {
            const betId = 'legs' in item ? item.parlay_id : item.id;
            return (
              <ShareableBetCard
                bet={item}
                isSelected={selectedShareBets.includes(betId)}
                isLast={index === currentOpenBets.length - 1}
                previewMode={sharePreviewMode}
                onPress={() => handleShareBetSelection(item)}
              />
            );
          }}
          ListFooterComponent={() => (
            selectedShareBets.length > 0 ? (
              <View style={styles.shareTemplatePreview}>
                <Text style={styles.previewLabel}>Preview:</Text>
                <View style={styles.previewContainer}>
                  <ShareTemplate />
                </View>
              </View>
            ) : null
          )}
          contentContainerStyle={styles.modalScrollContent}
        />

        {/* Share Button */}
        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={[
              styles.shareButton,
              (selectedShareBets.length === 0 || isGeneratingImage) && styles.shareButtonDisabled
            ]}
            onPress={handleGenerateShareImage}
            disabled={selectedShareBets.length === 0 || isGeneratingImage}
          >
            {isGeneratingImage ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="share" size={20} color="white" />
            )}
            <Text style={styles.shareButtonText}>
              {isGeneratingImage 
                ? 'Generating...' 
                : `Share ${selectedShareBets.length} Bet${selectedShareBets.length !== 1 ? 's' : ''}`
              }
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
    );
  };

  const getTeamFromSide = (bet: BetData) => {
    if (bet.side === 'home') return bet.home_team;
    if (bet.side === 'away') return bet.away_team;
    return bet.side; // fallback to original side if no team match
  };

  // Render bet card in the same format as overview tab but without selection
  const renderModalBetCard = (item: BetData | ParlayGroup, isLast: boolean = false) => {
    return (
      <View style={[
        styles.modalBetCardWrapper,
        isLast && styles.lastBetInContainer
      ]}>
        <UnifiedBetCard bet={item} />
      </View>
    );
  };

  // NonSelectableParlayCard is no longer needed since we're using UnifiedBetCard
  const NonSelectableParlayCard = ({ parlay, isLast }: { 
    parlay: ParlayGroup; 
    isLast: boolean;
  }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    const toggleExpanded = () => {
      setIsExpanded(!isExpanded);
    };

    return (
      <View style={[
        styles.selectableBetCard, 
        isLast && styles.lastBetInContainer
      ]}>
        <View style={styles.parlayMainCard}>
          <View style={styles.betCardContent}>
            <View style={styles.betMainContent}>
              <Text style={styles.betTeams} numberOfLines={1}>
                {parlay.legs.length} leg parlay
              </Text>
              <Text style={styles.betMarket} numberOfLines={1}>
                {parlay.sport}
              </Text>
            </View>
            <View style={styles.betRightSection}>
              <Text style={styles.betOdds}>
                {formatOdds(parlay.odds, parlay.stake, parlay.potential_payout)}
              </Text>
              <Text style={styles.betStake}>${parlay.stake}</Text>
            </View>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.parlayExpandButton} 
          onPress={toggleExpanded}
        >
          <Text style={styles.parlayExpandText}>
            {isExpanded ? 'Hide legs' : `Show ${parlay.legs.length} legs`}
          </Text>
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={16} 
            color={theme.colors.text.secondary} 
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.parlayLegsContainer}>
            {parlay.legs.map((leg, index) => {
              const legTeams = leg.home_team && leg.away_team 
                ? `${leg.away_team} @ ${leg.home_team}`
                : leg.bet_description;
              
              const legMarketParts = [leg.bet_type];
              if (leg.side && (leg.side === 'home' || leg.side === 'away')) {
                const teamName = leg.side === 'home' ? leg.home_team : leg.away_team;
                if (teamName) legMarketParts.push(teamName);
              } else if (leg.side) {
                legMarketParts.push(leg.side);
              }
              if (leg.line_value) legMarketParts.push(`${leg.line_value}`);
              
              const legMarket = legMarketParts.join(' • ');

              return (
                <View key={leg.id} style={styles.parlayLegRow}>
                  <View style={styles.legNumber}>
                    <Text style={styles.legNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.legMainContent}>
                    <Text style={styles.betTeams} numberOfLines={1}>
                      {legTeams}
                    </Text>
                    <Text style={styles.betMarket} numberOfLines={1}>
                      {legMarket}
                    </Text>
                  </View>
                  <View style={styles.legRightSection}>
                    <Text style={styles.betOdds}>
                      {formatOdds(leg.odds, leg.stake, leg.potential_payout)}
                    </Text>
                    <Text style={styles.betStake}>${leg.stake}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  // Helper function to format market line like UnifiedBetCard (without monetary values)
  const formatMarketLineForShare = (bet: BetData): string => {
    // Enhanced handling for TrueSharp/manual bets with proper prop type detection  
    // This MUST come before generic total/prop handling to override default behavior
    const isTrueSharpOrManual = bet.bet_source === 'manual' || 
                                bet.sportsbook === 'TrueSharp' || 
                                (bet as any).odd_source === 'TrueSharp';
    
    if (isTrueSharpOrManual && bet.player_name) {
      // Try to determine prop type - prioritize oddid for multi-stat combinations
      let propType = null;
      
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
      if (!propType && bet.prop_type) {
        // Convert prop_type from database format to display format
        const propTypeStr = bet.prop_type.toString();
        if (propTypeStr === 'home_runs') propType = 'Home Runs';
        else if (propTypeStr === 'total_bases') propType = 'Total Bases';
        else if (propTypeStr === 'passing_yards') propType = 'Passing Yards';
        else if (propTypeStr === 'rushing_yards') propType = 'Rushing Yards';
        else if (propTypeStr === 'receiving_yards') propType = 'Receiving Yards';
        else if (propTypeStr === 'stolen_bases') propType = 'Stolen Bases';
        else if (propTypeStr === 'passing_touchdowns') propType = 'Passing TDs';
        else if (propTypeStr === 'rushing_touchdowns') propType = 'Rushing TDs';
        else if (propTypeStr === 'receiving_touchdowns') propType = 'Receiving TDs';
        else if (propTypeStr === 'touchdowns') propType = 'Touchdowns';
        else if (propTypeStr === 'field_goals') propType = 'Field Goals';
        else if (propTypeStr === 'three_pointers') propType = '3-Pointers';
        else if (propTypeStr === 'free_throws') propType = 'Free Throws';
        else {
          // For other prop types, replace underscores and capitalize
          propType = propTypeStr.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        }
      } else if (!propType && (bet as any).oddid) {
        // Final fallback: parse single stats from oddid
        const oddid = (bet as any).oddid;
        const parsedFromOddid = parseMultiStatOddid(oddid);
        if (parsedFromOddid) {
          propType = parsedFromOddid.replace(/\b\w/g, l => l.toUpperCase());
        }
      }
      
      // Final fallback if nothing worked
      if (!propType) {
        propType = 'Prop';
      }
      
      const overUnder = bet.side ? bet.side.toUpperCase() : 'OVER';
      const lineValue = bet.line_value;
      
      if (lineValue && (overUnder === 'OVER' || overUnder === 'UNDER')) {
        return `${overUnder} ${lineValue} ${propType}`;
      } else {
        return `${bet.player_name} ${propType}`;
      }
    }

    // Special handling for SharpSports bets - use parsed bet_description
    if (bet.bet_source === 'sharpsports' && bet.bet_description) {
      const parts = bet.bet_description.split(' - ');
      if (parts.length < 2) {
        return bet.bet_description;
      }
      const betDetails = parts.slice(1).join(' - ');
      
      // Apply reordering rules for better readability
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
    }

    // Default logic for all other bet sources
    const betType = bet.bet_type || 'Unknown';
    const side = bet.side;
    const lineValue = bet.line_value;
    const playerName = bet.player_name;

    if (betType.toLowerCase() === 'moneyline') {
      const teamName = side === 'home' ? bet.home_team : side === 'away' ? bet.away_team : side;
      return `${teamName || 'Team'} Moneyline`;
    }

    if (betType.toLowerCase() === 'spread') {
      const teamName = side === 'home' ? bet.home_team : side === 'away' ? bet.away_team : side;
      const formattedLine = lineValue !== null && lineValue !== undefined ? 
        (lineValue > 0 ? `+${lineValue}` : `${lineValue}`) : '';
      return `${teamName || 'Team'} ${formattedLine} Point Spread`;
    }

    if (betType.toLowerCase() === 'total' || betType.toLowerCase() === 'over' || betType.toLowerCase() === 'under') {
      const overUnder = side ? side.toUpperCase() : (betType.toLowerCase() === 'over' ? 'OVER' : betType.toLowerCase() === 'under' ? 'UNDER' : 'OVER');
      const getSportTotalType = (sport: string): string => {
        const sportTotals: { [key: string]: string } = {
          mlb: 'Runs',
          nfl: 'Points',
          nba: 'Points',
          ncaab: 'Points',
          ncaaf: 'Points',
          nhl: 'Goals',
          soccer: 'Goals',
        };
        return sportTotals[sport?.toLowerCase()] || 'Points';
      };
      const totalType = getSportTotalType(bet.sport);
      return `${overUnder} ${lineValue || ''} Total ${totalType}`;
    }

    if (betType.toLowerCase().includes('prop') && playerName) {
      const overUnder = side ? side.toUpperCase() : 'OVER';
      
      // Parse prop type - prioritize oddid for multi-stat combinations, fallback to 'Points'
      let propType = 'Points';
      
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
      if (propType === 'Points' && bet.prop_type) {
        // Convert prop_type from database format to display format
        const propTypeStr = bet.prop_type.toString();
        if (propTypeStr === 'home_runs') propType = 'Home Runs';
        else if (propTypeStr === 'total_bases') propType = 'Total Bases';
        else if (propTypeStr === 'passing_yards') propType = 'Passing Yards';
        else if (propTypeStr === 'rushing_yards') propType = 'Rushing Yards';
        else if (propTypeStr === 'receiving_yards') propType = 'Receiving Yards';
        else if (propTypeStr === 'stolen_bases') propType = 'Stolen Bases';
        else if (propTypeStr === 'passing_touchdowns') propType = 'Passing TDs';
        else if (propTypeStr === 'rushing_touchdowns') propType = 'Rushing TDs';
        else if (propTypeStr === 'receiving_touchdowns') propType = 'Receiving TDs';
        else if (propTypeStr === 'touchdowns') propType = 'Touchdowns';
        else if (propTypeStr === 'field_goals') propType = 'Field Goals';
        else if (propTypeStr === 'three_pointers') propType = '3-Pointers';
        else if (propTypeStr === 'free_throws') propType = 'Free Throws';
        else {
          // For other prop types, replace underscores and capitalize
          propType = propTypeStr.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        }
      } else if (propType === 'Points' && (bet as any).oddid) {
        // Final fallback: parse single stats from oddid
        const oddid = (bet as any).oddid;
        const parsedFromOddid = parseMultiStatOddid(oddid);
        if (parsedFromOddid) {
          propType = parsedFromOddid.replace(/\b\w/g, l => l.toUpperCase());
        }
      }
      
      return `${playerName} ${propType} ${overUnder} ${lineValue || ''}`;
    }

    // Only use bet_description parsing for complex cases where structured data isn't sufficient
    if (bet.bet_description && (!betType || betType === 'Unknown')) {
      const description = bet.bet_description.toLowerCase();
      
      // Handle team + over/under patterns like "baltimore ravens over 29.5 total points"
      const teamOverPattern = /(.+?)\s+(over|under)\s+(\d+\.?\d*)\s+(total\s+)?(points|runs|goals)/;
      const teamOverMatch = description.match(teamOverPattern);
      
      if (teamOverMatch) {
        const [, teamName, overUnder, lineValue, , totalType] = teamOverMatch;
        return `${teamName.trim().replace(/\b\w/g, l => l.toUpperCase())} ${overUnder.toUpperCase()} ${lineValue} Total ${totalType.charAt(0).toUpperCase() + totalType.slice(1)}`;
      }
      
      // Handle other patterns like "over total runs", "under total points"
      const overUnderPattern = /(over|under)\s+(\d+\.?\d*)\s+(total\s+)?(points|runs|goals)/;
      const overUnderMatch = description.match(overUnderPattern);
      
      if (overUnderMatch) {
        const [, overUnder, lineValue, , totalType] = overUnderMatch;
        return `${overUnder.toUpperCase()} ${lineValue} Total ${totalType.charAt(0).toUpperCase() + totalType.slice(1)}`;
      }
      
      // Clean up the description as fallback
      return bet.bet_description
        .replace(/\b(over|under)\b/gi, (match) => match.toUpperCase())
        .replace(/\b\w/g, (match) => match.toUpperCase());
    }

    // Final fallback
    return bet.bet_description || `${betType} ${lineValue ? (lineValue > 0 ? `+${lineValue}` : lineValue) : ''}`;
  };

  // Helper function to format team matchup like UnifiedBetCard
  const formatTeamMatchupForShare = (bet: BetData): string => {
    // For TrueSharp/manual bets, handle cases where team names might be generic
    const isTrueSharpOrManual2 = bet.bet_source === 'manual' || 
                                 bet.sportsbook === 'TrueSharp' || 
                                 (bet as any).odd_source === 'TrueSharp';
    
    if (isTrueSharpOrManual2) {
      // For player props, prioritize showing player name
      if (bet.player_name) {
        return bet.player_name;
      }
      
      // Check if we have proper team names (not generic "Home"/"Away")
      const hasProperTeams = bet.home_team && bet.away_team && 
        bet.home_team !== 'Home' && bet.away_team !== 'Away' &&
        bet.home_team !== 'Home Team' && bet.away_team !== 'Away Team';
      
      if (hasProperTeams) {
        return `${bet.away_team} @ ${bet.home_team}`;
      } else {
        // For other cases, show sport/league info
        const sport = bet.sport && bet.sport !== 'unknown' ? bet.sport : bet.league;
        return sport ? `${sport} Game` : '';
      }
    }

    if (bet.bet_source === 'sharpsports' && bet.bet_description) {
      const parts = bet.bet_description.split(' - ');
      if (parts.length >= 2) {
        const matchup = parts[0].trim();
        if (matchup.includes(' @ ')) {
          return matchup;
        }
      }
    }

    if (!bet.home_team || !bet.away_team) {
      return bet.bet_description || '';
    }
    return `${bet.away_team} @ ${bet.home_team}`;
  };

  // Helper function to format placement info like UnifiedBetCard (without monetary values)
  const formatPlacementInfoForShare = (bet: BetData): string => {
    if (bet.game_date) {
      try {
        const date = new Date(bet.game_date);
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      } catch {
        return 'Game Date';
      }
    }
    
    if (bet.placed_at) {
      try {
        const date = new Date(bet.placed_at);
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      } catch {
        return 'Placed';
      }
    }
    
    const sportsbook = bet.sportsbook || 'TrueSharp';
    const league = bet.league || bet.sport;
    return `${sportsbook}${league ? ` • ${league.toUpperCase()}` : ''}`;
  };

  // ShareableUnifiedBetCard - version without monetary values for share modal
  const ShareableUnifiedBetCard = ({ bet, showLegs = false, onToggleExpand }: { 
    bet: BetData | ParlayGroup; 
    showLegs?: boolean; 
    onToggleExpand?: () => void;
  }) => {
    if ('legs' in bet) {
      // It's a parlay - match EnhancedParlayCard format
      const parlay = bet as ParlayGroup;
      
      // Helper functions for formatting leg details (adapted from EnhancedParlayCard)
      const formatLegMarketLine = (leg: any): string => {
        // Special handling for SharpSports legs - use parsed bet_description
        if (leg.bet_source === 'sharpsports' && leg.bet_description) {
          const parts = leg.bet_description.split(' - ');
          if (parts.length >= 2) {
            const betDetails = parts.slice(1).join(' - ');
            // Apply reordering rules for better readability
            const moneylineMatch = betDetails.match(/^Moneyline - (.+)$/);
            if (moneylineMatch) {
              return `${moneylineMatch[1]} Moneyline`;
            }
            return betDetails;
          }
        }

        // Default logic for all other bet sources
        const betType = leg.bet_type || 'Unknown';
        const side = leg.side;
        const lineValue = leg.line_value;
        const playerName = leg.player_name;

        if (betType.toLowerCase() === 'moneyline') {
          const teamName = side === 'home' ? leg.home_team : side === 'away' ? leg.away_team : side;
          return `${teamName || 'Team'} ML`;
        }

        if (betType.toLowerCase() === 'spread') {
          const teamName = side === 'home' ? leg.home_team : side === 'away' ? leg.away_team : side;
          const formattedLine = lineValue !== null && lineValue !== undefined ? 
            (lineValue > 0 ? `+${lineValue}` : `${lineValue}`) : '';
          return `${teamName || 'Team'} ${formattedLine}`;
        }

        if (betType.toLowerCase() === 'total' || betType.toLowerCase() === 'over' || betType.toLowerCase() === 'under') {
          const overUnder = side ? side.toUpperCase() : (betType.toLowerCase() === 'over' ? 'OVER' : betType.toLowerCase() === 'under' ? 'UNDER' : 'OVER');
          return `${overUnder} ${lineValue || ''}`;
        }

        if (betType.toLowerCase().includes('prop') && playerName) {
          const overUnder = side ? side.toUpperCase() : 'OVER';
          let propType = 'Points';
          
          if (leg.prop_type) {
            const propTypeStr = leg.prop_type.toString();
            if (propTypeStr === 'home_runs') propType = 'Home Runs';
            else if (propTypeStr === 'total_bases') propType = 'Total Bases';
            else if (propTypeStr === 'passing_yards') propType = 'Passing Yards';
            else if (propTypeStr === 'rushing_yards') propType = 'Rushing Yards';
            else if (propTypeStr === 'receiving_yards') propType = 'Receiving Yards';
            else if (propTypeStr === 'touchdowns') propType = 'Touchdowns';
            else {
              propType = propTypeStr.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            }
          }
          
          return `${playerName} ${propType} ${overUnder} ${lineValue || ''}`;
        }

        return leg.bet_description || `${betType} ${lineValue || ''}`;
      };

      const formatLegTeamMatchup = (leg: any): string => {
        // Special handling for SharpSports legs - extract matchup from bet_description
        if (leg.bet_source === 'sharpsports' && leg.bet_description) {
          const parts = leg.bet_description.split(' - ');
          if (parts.length >= 2) {
            const matchup = parts[0].trim();
            if (matchup.includes(' @ ')) {
              return matchup;
            }
          }
        }

        // Default logic for other bet sources
        if (!leg.home_team || !leg.away_team) {
          return '';
        }
        return `${leg.away_team} @ ${leg.home_team}`;
      };
      
      return (
        <View style={styles.shareableBetCard}>
          <View style={styles.shareableBetContent}>
            <View style={styles.shareableBetLeft}>
              <Text style={styles.shareableBetMainLine}>
                {parlay.legs.length}-Leg Parlay
              </Text>
              <Text style={styles.shareableBetSubLine}>
                {parlay.sport}
              </Text>
              <Text style={styles.shareableBetTertiaryLine}>
                {parlay.placed_at ? new Date(parlay.placed_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }) : `${parlay.legs.length} legs • ${parlay.sport}`}
              </Text>
            </View>
            <View style={styles.shareableBetRight}>
              <Text style={styles.shareableBetOdds}>
                {formatOdds(parlay.odds, parlay.stake, parlay.potential_payout)}
              </Text>
            </View>

            {/* Expand/Collapse Icon - only show in selection area (when onToggleExpand is provided) */}
            {onToggleExpand && (
              <TouchableOpacity 
                style={styles.shareableExpandIcon}
                onPress={onToggleExpand}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons 
                  name={expandedParlays.has(parlay.parlay_id) ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={theme.colors.text.secondary} 
                />
              </TouchableOpacity>
            )}
          </View>
          
          {/* Parlay Legs Section - show when showLegs is true (image generation) OR when expanded in selection area */}
          {(showLegs || expandedParlays.has(parlay.parlay_id)) && (
            <View style={styles.shareableParlayLegs}>
              {parlay.legs.map((leg, index) => (
                <View key={leg.id} style={styles.shareableLegRow}>
                  {/* Leg Number */}
                  <View style={styles.shareableLegNumber}>
                    <Text style={styles.shareableLegNumberText}>{index + 1}</Text>
                  </View>
                  
                  {/* Leg Content */}
                  <View style={styles.shareableLegContent}>
                    <Text style={styles.shareableLegMarketLine} numberOfLines={1}>
                      {formatLegMarketLine(leg)}
                    </Text>
                    <Text style={styles.shareableLegTeamMatchup} numberOfLines={1}>
                      {formatLegTeamMatchup(leg)}
                    </Text>
                    <Text style={styles.shareableLegInfo} numberOfLines={1}>
                      {leg.bet_type || 'Unknown'} • {leg.league || leg.sport || 'Unknown'}
                    </Text>
                  </View>

                  {/* Leg Odds */}
                  <View style={styles.shareableLegRight}>
                    <Text style={styles.shareableLegOdds}>
                      {formatOdds(leg.odds, leg.stake, leg.potential_payout)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      );
    } else {
      // It's a single bet - match EnhancedBetCard format exactly
      const singleBet = bet as BetData;
      
      return (
        <View style={styles.shareableBetCard}>
          <View style={styles.shareableBetContent}>
            <View style={styles.shareableBetLeft}>
              {/* Line 1: Market description (matches UnifiedBetCard format) */}
              <Text style={styles.shareableBetMainLine}>
                {formatMarketLineForShare(singleBet)}
              </Text>
              {/* Line 2: Team matchup (matches UnifiedBetCard format) */}
              <Text style={styles.shareableBetSubLine}>
                {formatTeamMatchupForShare(singleBet)}
              </Text>
              {/* Line 3: Placement info (matches UnifiedBetCard format) */}
              <Text style={styles.shareableBetTertiaryLine}>
                {formatPlacementInfoForShare(singleBet)}
              </Text>
            </View>
            <View style={styles.shareableBetRight}>
              <Text style={styles.shareableBetOdds}>
                {singleBet.odds > 0 ? `+${singleBet.odds}` : `${singleBet.odds}`}
              </Text>
            </View>
          </View>
        </View>
      );
    }
  };

  const ShareableBetCard = ({ bet, isSelected, isLast, previewMode, onPress }: {
    bet: BetData | ParlayGroup;
    isSelected: boolean;
    isLast: boolean;
    previewMode: boolean;
    onPress: () => void;
  }) => {
    const isParlay = 'legs' in bet;
    // For image generation (when showLegs=true), we want to force show legs regardless of preview mode
    // For selection area (when showLegs=false), we respect the expanded state
    const showLegs = !previewMode && isParlay; // This forces legs to show in image generation
    
    const handleToggleExpand = () => {
      if ('legs' in bet) {
        const parlayId = bet.parlay_id;
        setExpandedParlays(prev => {
          const newSet = new Set(prev);
          if (newSet.has(parlayId)) {
            newSet.delete(parlayId);
          } else {
            newSet.add(parlayId);
          }
          return newSet;
        });
      }
    };
    
    return (
      <TouchableOpacity
        style={[
          styles.shareModalBetWrapper,
          isSelected && styles.shareModalSelectedBetCard,
          isLast && styles.lastBetInContainer
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.shareModalBetContent}>
          <View style={styles.unifiedBetCardContainer}>
            <ShareableUnifiedBetCard 
              bet={bet} 
              showLegs={false} // Never force show legs in selection area - use expand state instead
              onToggleExpand={isParlay ? handleToggleExpand : undefined}
            />
          </View>
          <View style={[
            styles.shareModalSelectionIndicator,
            isSelected && styles.shareModalSelectionIndicatorSelected
          ]}>
            <View style={[
              styles.checkbox, 
              isSelected && styles.checkboxSelected,
              { width: 26, height: 26, borderRadius: 13 }
            ]}>
              {isSelected && <Ionicons name="checkmark" size={18} color="white" />}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Financial KPI cards component
  const renderFinancialKPICards = () => (
    <View style={styles.compactKpiContainer}>
      <View style={styles.compactKpiGrid}>
        <View style={[styles.compactKpiCard, styles.compactKpiCardPrimary]}>
          <Text 
            style={styles.compactKpiValue}
            numberOfLines={1}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.7}
          >
            {financialLoading ? '...' : stripeSellerDataService.formatCurrency(financialData.totalNetRevenue)}
          </Text>
          <Text 
            style={styles.compactKpiLabel}
            numberOfLines={1}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.8}
          >
            Net Revenue
          </Text>
          {financialData.monthlyGrowthRate !== 0 && (
            <Text 
              style={styles.compactKpiGrowth}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.6}
              allowFontScaling={false}
            >
              {financialData.monthlyGrowthRate >= 0 ? '+' : ''}{financialData.monthlyGrowthRate.toFixed(1)}%
            </Text>
          )}
        </View>

        <View style={styles.compactKpiCard}>
          <Text 
            style={styles.compactKpiValueSecondary}
            numberOfLines={1}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.7}
          >
            {financialLoading ? '...' : financialData.totalSubscribers.toString()}
          </Text>
          <Text 
            style={styles.compactKpiLabelSecondary}
            numberOfLines={1}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.8}
          >
            Subscribers
          </Text>
        </View>

        <View style={styles.compactKpiCard}>
          <Text 
            style={styles.compactKpiValueSecondary}
            numberOfLines={1}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.7}
          >
            {financialLoading ? '...' : stripeSellerDataService.formatCurrency(financialData.averageRevenuePerUser)}
          </Text>
          <Text 
            style={styles.compactKpiLabelSecondary}
            numberOfLines={1}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.8}
          >
            ARPU
          </Text>
        </View>

        <View style={styles.compactKpiCard}>
          <Text 
            style={styles.compactKpiValueSecondary}
            numberOfLines={1}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.7}
          >
            {financialLoading ? '...' : stripeSellerDataService.formatCurrency(financialData.totalGrossRevenue)}
          </Text>
          <Text 
            style={styles.compactKpiLabelSecondary}
            numberOfLines={1}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.8}
          >
            Gross
          </Text>
        </View>
      </View>
    </View>
  );

  // Analytics KPI cards component
  const renderAnalyticsKPICards = () => (
    <View style={styles.summaryCardsContainer}>
      <View style={styles.summaryCardsRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryCardLabel}>ROI</Text>
          <Text style={styles.summaryCardValue}>
            {analyticsLoading ? '...' : `${analyticsData.totalROI > 0 ? '+' : ''}${analyticsData.totalROI.toFixed(1)}%`}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryCardLabel}>Win Rate</Text>
          <Text style={styles.summaryCardValue}>
            {analyticsLoading ? '...' : `${analyticsData.overallWinRate.toFixed(1)}%`}
          </Text>
        </View>
      </View>
      <View style={styles.summaryCardsRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryCardLabel}>Total Bets</Text>
          <Text style={styles.summaryCardValue}>
            {analyticsLoading ? '...' : analyticsData.totalBets.toString()}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryCardLabel}>Strategies</Text>
          <Text style={styles.summaryCardValue}>
            {analyticsLoading ? '...' : analyticsData.totalStrategies.toString()}
          </Text>
        </View>
      </View>
    </View>
  );

  // Top Performing Strategies component
  const renderTopPerformingStrategies = () => {
    if (analyticsData.topStrategies.length === 0) {
      return (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Top Performing Strategies</Text>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>No strategy data available</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Top Performing Strategies</Text>
        <View style={styles.strategiesListContainer}>
          {analyticsData.topStrategies.map((strategy, index) => (
            <View key={strategy.id} style={styles.performanceStrategyCard}>
              <View style={styles.strategyRankContainer}>
                <Text style={styles.strategyRank}>#{index + 1}</Text>
              </View>
              <View style={styles.strategyDetailsContainer}>
                <Text style={styles.performanceStrategyName} numberOfLines={1}>
                  {strategy.name}
                </Text>
                <Text style={styles.performanceStrategyStats}>
                  {strategy.bets} bet{strategy.bets !== 1 ? 's' : ''} • {strategy.winRate.toFixed(1)}% win rate
                </Text>
              </View>
              <View style={styles.strategyPerformanceContainer}>
                <Text style={[
                  styles.strategyROI,
                  { color: strategy.roi >= 0 ? '#10B981' : '#EF4444' }
                ]}>
                  {strategy.roi > 0 ? '+' : ''}{strategy.roi.toFixed(1)}%
                </Text>
                <Text style={styles.strategyROILabel}>ROI</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Performance by Sport component
  const renderPerformanceBySport = () => {
    if (analyticsData.performanceBySport.length === 0) {
      return (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Performance by Sport</Text>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>No sport data available</Text>
          </View>
        </View>
      );
    }

    const maxBets = Math.max(...analyticsData.performanceBySport.map(s => s.bets), 1);

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Performance by Sport</Text>
        <View style={styles.sportChartContainer}>
          {analyticsData.performanceBySport.map((sport, index) => {
            const widthPercentage = (sport.bets / maxBets) * 100;
            const color = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index % 5];
            
            return (
              <View key={sport.sport} style={styles.sportRow}>
                <View style={styles.sportInfo}>
                  <Text style={styles.sportName} numberOfLines={1}>{sport.sport}</Text>
                  <Text style={styles.sportStats}>
                    {sport.bets} bet{sport.bets !== 1 ? 's' : ''} • {sport.winRate.toFixed(1)}% win rate
                  </Text>
                </View>
                <View style={styles.sportBarContainer}>
                  <View style={[styles.sportBar, { width: `${widthPercentage}%`, backgroundColor: color }]} />
                </View>
                <View style={styles.sportMetrics}>
                  <Text style={[
                    styles.sportROI,
                    { color: sport.roi >= 0 ? '#10B981' : '#EF4444' }
                  ]}>
                    {sport.roi > 0 ? '+' : ''}{sport.roi.toFixed(1)}%
                  </Text>
                  <Text style={styles.sportROILabel}>ROI</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  // Analytics content component
  const renderAnalyticsContent = () => {
    if (analyticsLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading analytics data...</Text>
        </View>
      );
    }
    
    return (
      <ScrollView style={styles.financialsContainer} showsVerticalScrollIndicator={false}>
        {renderAnalyticsKPICards()}
        {renderTopPerformingStrategies()}
        {renderPerformanceBySport()}
      </ScrollView>
    );
  };

  // Revenue by Frequency chart
  const renderRevenueByFrequency = () => {
    const data = [
      { name: 'Weekly', value: financialData.revenueByFrequency.weekly, color: theme.colors.primary, icon: 'calendar' },
      { name: 'Monthly', value: financialData.revenueByFrequency.monthly, color: theme.colors.betting.won, icon: 'calendar-outline' },
      { name: 'Yearly', value: financialData.revenueByFrequency.yearly, color: theme.colors.secondary, icon: 'time' }
    ];

    const totalRevenue = data.reduce((sum, item) => sum + item.value, 0);

    return (
      <View style={styles.modernChartContainer}>
        <View style={styles.modernChartHeader}>
          <Ionicons name="bar-chart" size={18} color={theme.colors.text.primary} />
          <Text style={styles.modernChartTitle}>Revenue by Frequency</Text>
        </View>
        
        <View style={styles.frequencyGrid}>
          {data.map((item, index) => {
            const percentage = totalRevenue > 0 ? ((item.value / totalRevenue) * 100) : 0;
            return (
              <View key={index} style={styles.frequencyCard}>
                <View style={[styles.frequencyIconContainer, { backgroundColor: item.color + '20' }]}>
                  <Ionicons name={item.icon as any} size={18} color={item.color} />
                </View>
                <Text 
                  style={styles.frequencyValue}
                  numberOfLines={1}
                  adjustsFontSizeToFit={true}
                  minimumFontScale={0.5}
                  allowFontScaling={false}
                >
                  {stripeSellerDataService.formatCurrency(item.value)}
                </Text>
                <Text style={styles.frequencyLabel}>{item.name}</Text>
                <Text style={[styles.frequencyPercentage, { color: item.color }]}>
                  {percentage.toFixed(1)}%
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  // Revenue by Strategy chart
  const renderRevenueByStrategy = () => {
    if (financialData.topPerformingStrategies.length === 0) {
      return (
        <View style={styles.modernChartContainer}>
          <View style={styles.modernChartHeader}>
            <Ionicons name="trophy" size={18} color={theme.colors.text.primary} />
            <Text style={styles.modernChartTitle}>Top Strategies</Text>
          </View>
          <View style={styles.emptyStateContainer}>
            <Ionicons name="analytics-outline" size={48} color={theme.colors.text.secondary} />
            <Text style={styles.emptyStateText}>No revenue data yet</Text>
            <Text style={styles.emptyStateSubtext}>Start earning from your strategies</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.modernChartContainer}>
        <View style={styles.modernChartHeader}>
          <Ionicons name="trophy" size={18} color={theme.colors.text.primary} />
          <Text style={styles.modernChartTitle}>Top Strategies</Text>
        </View>
        
        <View style={styles.strategyList}>
          {financialData.topPerformingStrategies.slice(0, 3).map((strategy, index) => {
            const colors = [theme.colors.betting.won, theme.colors.primary, theme.colors.secondary];
            const color = colors[index];
            
            return (
              <View key={strategy.strategy_name} style={styles.modernStrategyCard}>
                <View style={[styles.modernStrategyRank, { backgroundColor: color }]}>
                  <Text style={styles.modernStrategyRankText}>{index + 1}</Text>
                </View>
                
                <View style={styles.modernStrategyInfo}>
                  <Text style={styles.modernStrategyName} numberOfLines={1}>
                    {strategy.strategy_name}
                  </Text>
                  <Text style={styles.modernStrategySubtitle}>
                    {strategy.subscriber_count} subscribers
                  </Text>
                </View>
                
                <View style={styles.modernStrategyRevenue}>
                  <Text 
                    style={[styles.modernStrategyAmount, { color }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.5}
                    allowFontScaling={false}
                  >
                    {stripeSellerDataService.formatCurrency(strategy.revenue)}
                  </Text>
                  <Text style={styles.modernStrategyPeriod}>monthly</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  // Clean revenue breakdown
  const renderRevenueSummary = () => {
    return (
      <View style={styles.modernChartContainer}>
        <View style={styles.modernChartHeader}>
          <Ionicons name="calculator" size={18} color={theme.colors.text.primary} />
          <Text style={styles.modernChartTitle}>Revenue Breakdown</Text>
        </View>
        
        <View style={styles.breakdownContainer}>
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownLabel}>
              <View style={[styles.breakdownDot, { backgroundColor: theme.colors.primary }]} />
              <Text style={styles.breakdownText}>Gross Revenue</Text>
            </View>
            <Text 
              style={[styles.breakdownValue, { color: theme.colors.primary }]}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.5}
              allowFontScaling={false}
            >
              {stripeSellerDataService.formatCurrency(financialData.totalGrossRevenue)}
            </Text>
          </View>
          
          
          <View style={[styles.breakdownRow, styles.breakdownTotal]}>
            <View style={styles.breakdownLabel}>
              <View style={[styles.breakdownDot, { backgroundColor: theme.colors.betting.won }]} />
              <Text style={[styles.breakdownText, styles.breakdownTextBold]}>Your Earnings</Text>
            </View>
            <Text 
              style={[styles.breakdownValue, styles.breakdownValueBold, { color: theme.colors.betting.won }]}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.5}
              allowFontScaling={false}
            >
              {stripeSellerDataService.formatCurrency(financialData.totalNetRevenue)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // Compact skeleton loader
  const renderFinancialSkeleton = () => (
    <ScrollView style={styles.financialsContainer} showsVerticalScrollIndicator={false}>
      {/* Compact KPI Cards Skeleton */}
      <View style={styles.compactKpiContainer}>
        <View style={styles.compactKpiGrid}>
          {[...Array(4)].map((_, i) => (
            <View key={i} style={[styles.compactKpiCard, styles.skeletonCard]}>
              <View style={styles.skeletonValue} />
              <View style={styles.skeletonLabel} />
            </View>
          ))}
        </View>
      </View>

      {/* Chart Skeletons */}
      {[...Array(3)].map((_, i) => (
        <View key={i} style={styles.modernChartContainer}>
          <View style={styles.skeletonChartHeader} />
          <View style={styles.skeletonChartContent} />
        </View>
      ))}
    </ScrollView>
  );

  // Main financials content
  const renderFinancialsContent = () => {
    if (financialLoading) {
      return renderFinancialSkeleton();
    }

    return (
      <ScrollView style={styles.financialsContainer} showsVerticalScrollIndicator={false}>
        {renderFinancialKPICards()}
        {renderRevenueByFrequency()}
        {renderRevenueByStrategy()}
        {renderRevenueSummary()}
      </ScrollView>
    );
  };

  const renderSelectableBetCard = (item: BetData | ParlayGroup, isLast: boolean = false) => {
    const betId = 'legs' in item ? item.parlay_id : item.id;
    const isSelected = selectedBetIds.includes(betId);
    
    return (
      <TouchableOpacity
        key={betId}
        style={[
          styles.selectableUnifiedBetCardWrapper,
          isSelected && styles.selectedBetCard,
          isLast && styles.lastBetInContainer
        ]}
        onPress={() => handleBetSelection(item)}
      >
        <View style={styles.selectableUnifiedBetCardContent}>
          <View style={styles.unifiedBetCardContainer}>
            <UnifiedBetCard bet={item} />
          </View>
          <View style={styles.selectionIndicatorContainer}>
            <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
              {isSelected && <Ionicons name="checkmark" size={14} color="white" />}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // SelectableParlayCard is no longer needed since we're using UnifiedBetCard
  const SelectableParlayCard = ({ parlay, isSelected, isLast, onPress }: { 
    parlay: ParlayGroup; 
    isSelected: boolean; 
    isLast: boolean;
    onPress: () => void; 
  }) => {
    // This component is deprecated - using UnifiedBetCard instead
    return null;
  };

  // Legacy code - keeping for reference but not used
  const SelectableParlayCardOld = ({ parlay, isSelected, isLast, onPress }: { 
    parlay: ParlayGroup; 
    isSelected: boolean; 
    isLast: boolean;
    onPress: () => void; 
  }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    const toggleExpanded = () => {
      setIsExpanded(!isExpanded);
    };

    return (
      <View style={[
        styles.selectableBetCard, 
        isSelected && styles.selectedBetCard,
        isLast && styles.lastBetInContainer
      ]}>
        <TouchableOpacity onPress={onPress} style={styles.parlayMainCard}>
          <View style={styles.betCardContent}>
            <View style={styles.betMainContent}>
              <Text style={styles.betTeams} numberOfLines={1}>
                {parlay.legs.length} leg parlay
              </Text>
              <Text style={styles.betMarket} numberOfLines={1}>
                {parlay.sport}
              </Text>
            </View>
            <View style={styles.betRightSection}>
              <Text style={styles.betOdds}>
                {formatOdds(parlay.odds, parlay.stake, parlay.potential_payout)}
              </Text>
              <Text style={styles.betStake}>${parlay.stake}</Text>
              <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                {isSelected && <Ionicons name="checkmark" size={14} color="white" />}
              </View>
            </View>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.parlayExpandButton} 
          onPress={toggleExpanded}
        >
          <Text style={styles.parlayExpandText}>
            {isExpanded ? 'Hide legs' : `Show ${parlay.legs.length} legs`}
          </Text>
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={16} 
            color={theme.colors.text.secondary} 
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.parlayLegsContainer}>
            {parlay.legs.map((leg, index) => {
              const legTeams = leg.home_team && leg.away_team 
                ? `${leg.away_team} @ ${leg.home_team}`
                : leg.bet_description;
              
              const legMarketParts = [leg.bet_type];
              if (leg.side && (leg.side === 'home' || leg.side === 'away')) {
                const teamName = leg.side === 'home' ? leg.home_team : leg.away_team;
                if (teamName) legMarketParts.push(teamName);
              } else if (leg.side) {
                legMarketParts.push(leg.side);
              }
              if (leg.line_value) legMarketParts.push(`${leg.line_value}`);
              
              const legMarket = legMarketParts.join(' • ');

              return (
                <View key={leg.id} style={styles.parlayLegRow}>
                  <View style={styles.legNumber}>
                    <Text style={styles.legNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.legMainContent}>
                    <Text style={styles.betTeams} numberOfLines={1}>
                      {legTeams}
                    </Text>
                    <Text style={styles.betMarket} numberOfLines={1}>
                      {legMarket}
                    </Text>
                  </View>
                  <View style={styles.legRightSection}>
                    <Text style={styles.betOdds}>
                      {formatOdds(leg.odds, leg.stake, leg.potential_payout)}
                    </Text>
                    <Text style={styles.betStake}>${leg.stake}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  const renderOverviewContent = () => {
    const data = openBetsLoading ? [] : unifiedOpenBetsList;
    const totalBetsCount = groupedOpenBets.parlays.length + groupedOpenBets.singles.length;
    
    return (
      <ScrollView style={styles.overviewContainer} showsVerticalScrollIndicator={false}>
        {renderSummaryCards()}
        
        <View style={styles.openBetsContainer}>
          <View style={styles.openBetsHeader}>
            <View style={styles.openBetsHeaderLeft}>
              <Text style={styles.openBetsTitle}>
                Open Bets ({totalBetsCount})
              </Text>
              {groupedOpenBets.parlays.length > 0 && (
                <Text style={styles.openBetsSubtitle}>
                  {groupedOpenBets.parlays.length} parlay{groupedOpenBets.parlays.length !== 1 ? 's' : ''} • {groupedOpenBets.singles.length} single bet{groupedOpenBets.singles.length !== 1 ? 's' : ''}
                </Text>
              )}
              {groupedOpenBets.parlays.length === 0 && (
                <Text style={styles.openBetsSubtitle}>
                  {openBetsLoading ? 'Loading...' : `${totalBetsCount} bet${totalBetsCount !== 1 ? 's' : ''} pending`}
                </Text>
              )}
            </View>
            
          </View>
          
          {openBetsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Loading open bets...</Text>
            </View>
          ) : data.length === 0 ? (
            <View style={styles.emptyBetsContainer}>
              <Ionicons name="list-outline" size={48} color={theme.colors.text.light} />
              <Text style={styles.emptyBetsTitle}>No Open Bets</Text>
              <Text style={styles.emptyBetsSubtitle}>
                Your pending bets will appear here
              </Text>
            </View>
          ) : (
            data.map((item, index) => 
              renderSelectableBetCard(item, index === data.length - 1)
            )
          )}
        </View>
        
        {selectedBetIds.length > 0 && (
          <View style={styles.addToStrategiesContainer}>
            <TouchableOpacity
              style={styles.addToStrategiesButton}
              onPress={handleAddToStrategies}
            >
              <Text style={styles.addToStrategiesButtonText}>
                Add to strategies ({selectedBetIds.length} bet{selectedBetIds.length !== 1 ? 's' : ''})
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.footerSpacer} />
      </ScrollView>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <View style={styles.overviewWrapper}>
            <ScrollView 
              style={styles.overviewScrollView} 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.overviewContentContainer}
            >
              {renderSummaryCards()}
              
              {/* Recent Open Bets Section */}
              {unifiedOpenBetsList.length > 0 && (
                <View style={styles.recentBetsSection}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                      Open Bets ({groupedOpenBets.parlays.length + groupedOpenBets.singles.length})
                    </Text>
                    {selectedBetIds.length > 0 && (
                      <TouchableOpacity
                        style={styles.addToStrategiesHeaderButton}
                        onPress={handleAddToStrategies}
                      >
                        <Ionicons name="add-circle-outline" size={16} color={theme.colors.primary} />
                        <Text style={styles.addToStrategiesHeaderButtonText}>
                          Add to Strategies
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  {unifiedOpenBetsList.map((item, index) => 
                    renderSelectableBetCard(item, index === unifiedOpenBetsList.length - 1)
                  )}
                  
                  {/* Add to Strategies Button Below Bets */}
                  {selectedBetIds.length > 0 && (
                    <View style={styles.addToStrategiesContainer}>
                      <TouchableOpacity
                        style={styles.addToStrategiesButton}
                        onPress={handleAddToStrategies}
                      >
                        <Text style={styles.addToStrategiesButtonText}>
                          Add to Strategies ({selectedBetIds.length} bet{selectedBetIds.length !== 1 ? 's' : ''})
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
              
            </ScrollView>
            {renderStrategyModal()}
          </View>
        );
      case 'strategies':
        return (
          <View style={styles.strategiesContainer}>
            <ScrollView style={styles.strategiesScrollView} showsVerticalScrollIndicator={false}>
              {strategiesLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text style={styles.loadingText}>Loading strategies...</Text>
                </View>
              ) : userStrategies.length === 0 ? (
                <View style={styles.emptyStrategiesContainer}>
                  <Ionicons name="bulb-outline" size={64} color={theme.colors.text.light} />
                  <Text style={styles.emptyStrategiesTitle}>No Strategies Found</Text>
                  <Text style={styles.emptyStrategiesSubtitle}>
                    Create strategies to start monetizing your betting expertise
                  </Text>
                </View>
              ) : (
                <View style={styles.strategiesGrid}>
                  {userStrategies.map(strategy => renderStrategyCard(strategy))}
                </View>
              )}
            </ScrollView>
            {renderEditStrategyModal()}
            {renderAllBetsModal()}
            {renderOpenBetsModal()}
            {renderShareModal()}
            {renderYesterdayModal()}
            {renderLastWeekModal()}
            {renderLastMonthModal()}
            
            {/* Enhanced Monetization Modals */}
            <MonetizeStrategyModal
              visible={showMonetizeModal}
              strategy={selectedStrategy}
              onClose={() => setShowMonetizeModal(false)}
              onSuccess={handleMonetizationSuccess}
              onError={handleMonetizationError}
            />
            
            <SellerOnboardingModal
              visible={showSellerOnboardingModal}
              onClose={() => setShowSellerOnboardingModal(false)}
              onSuccess={handleSellerOnboardingSuccess}
              onError={handleMonetizationError}
            />
          </View>
        );
      case 'financials':
        return renderFinancialsContent();
      case 'analytics':
        return renderAnalyticsContent();
      default:
        return null;
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={globalStyles.safeArea} edges={['left', 'right', 'bottom']}>
        <View style={styles.container}>
        {/* Banner */}
        <View style={styles.bannerBar}>
          <View style={styles.bannerContent}>
            <View style={styles.bannerLeft}>
              <TrueSharpShield size={18} variant="default" />
              <Text style={styles.bannerLabel}>Seller Dashboard</Text>
            </View>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabNavigation}>
          <View style={styles.tabContainer}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tab,
                  activeTab === tab.key && styles.activeTab,
                ]}
                onPress={() => setActiveTab(tab.key as SellTabType)}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={16}
                  color={activeTab === tab.key ? theme.colors.text.inverse : theme.colors.text.secondary}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    activeTab === tab.key && styles.activeTabLabel,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tab Content with Swipe Gesture */}
        <View style={styles.tabContent}>
          <View style={{ flex: 1 }}>
            {renderTabContent()}
          </View>
        </View>
        </View>
        
        <SellerProfileModal
          visible={showSellerProfileModal}
          onClose={() => setShowSellerProfileModal(false)}
          username={sellerProfile?.username || ''}
        />
        
        <EditSellerProfileModal
          visible={showEditSellerProfileModal}
          userId={user?.id || ''}
          onClose={() => setShowEditSellerProfileModal(false)}
          onSave={() => {
            // Refresh the seller profile data after save
            fetchSellerProfile();
          }}
        />

        <StripeConnectBrowser
          visible={showStripeBrowser}
          url={stripeBrowserUrl}
          onClose={() => {
            setShowStripeBrowser(false);
            setStripeBrowserUrl(null);
            // Refresh seller status and data after onboarding completion
            refreshProfile();
            checkSellerStatus();
            fetchSellerStats();
            fetchSellerProfile();
            fetchStrategiesForTab();
          }}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  bannerBar: {
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  bannerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  bannerLabel: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
  },
  tabNavigation: {
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.xs,
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.xs,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    marginHorizontal: 2,
    borderRadius: theme.borderRadius.md,
  },
  activeTab: {
    backgroundColor: theme.colors.primary,
    ...theme.shadows.sm,
  },
  tabLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.xs,
  },
  activeTabLabel: {
    color: theme.colors.text.inverse,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  tabContent: {
    flex: 1,
  },
  overviewWrapper: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  overviewContainer: {
    flex: 1,
  },
  modalBetCardWrapper: {
    marginHorizontal: -theme.spacing.md,
  },
  overviewBetCardWrapper: {
    marginHorizontal: -theme.spacing.md,
  },
  sellerActionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 0,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
  },
  sellerActionButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    ...theme.shadows.md,
    minHeight: 50,
  },
  sellerActionButtonText: {
    fontSize: 10,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary,
    marginTop: 2,
    textAlign: 'center',
    lineHeight: 11,
  },
  overviewWrapper: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  overviewScrollView: {
    flex: 1,
  },
  overviewContentContainer: {
    paddingBottom: theme.spacing.xl,
  },
  recentBetsSection: {
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  sectionLink: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  summaryCardsContainer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  // Seller onboarding styles
  sellerOnboardingCard: {
    backgroundColor: '#F0F9FF',
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
  },
  onboardingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  onboardingTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
    textAlign: 'center',
  },
  onboardingDescription: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.lg,
  },
  onboardingButton: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  onboardingButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  onboardingButtonText: {
    color: 'white',
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  // "Become a Seller" card styles
  becomeSellerCard: {
    backgroundColor: theme.colors.card,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
    ...theme.shadows.lg,
  },
  becomeSellerHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  becomeSellerTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  becomeSellerDescription: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.sm,
  },
  becomeSellerButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  becomeSellerButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  becomeSellerButtonText: {
    color: 'white',
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
  },
  summaryCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  summaryCard: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    flex: 1,
    marginHorizontal: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  summaryCardLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  summaryCardValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  openBetsContainer: {
    backgroundColor: theme.colors.card,
    marginVertical: theme.spacing.md,
    marginHorizontal: theme.spacing.xs,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.lg,
  },
  openBetsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
  },
  openBetsHeaderLeft: {
    flex: 1,
  },
  addToStrategiesHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '10',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  addToStrategiesHeaderButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary,
    marginLeft: theme.spacing.xs,
  },
  openBetsTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  openBetsSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  loadingContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
  },
  emptyBetsContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBetsTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  emptyBetsSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  selectableBetCard: {
    backgroundColor: theme.colors.card,
    marginHorizontal: 0,
    marginVertical: 0,
    borderRadius: 0,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  selectedBetCard: {
    backgroundColor: theme.colors.primary + '15',
  },
  betCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  betMainContent: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  betTeams: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  betMarket: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  betRightSection: {
    alignItems: 'flex-end',
    minWidth: 60,
  },
  betOdds: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  betStake: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  parlayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  parlayTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  parlayOdds: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  parlayLegContainer: {
    marginBottom: 4,
  },
  moreLegsSuffix: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.light,
    fontStyle: 'italic',
    marginTop: 2,
  },
  parlayMainCard: {
    // No additional styling needed, using existing betCardContent
  },
  parlayExpandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  parlayExpandText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginRight: theme.spacing.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  parlayLegsContainer: {
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  parlayLegRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  legNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  legNumberText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: 'white',
  },
  legMainContent: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  legRightSection: {
    alignItems: 'flex-end',
    minWidth: 60,
  },
  betInContainer: {
    // This contains each bet within the open bets container
  },
  lastBetInContainer: {
    borderBottomWidth: 0, // Remove border from last bet
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.card,
  },
  checkboxSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkboxDisabled: {
    backgroundColor: theme.colors.text.light + '20',
    borderColor: theme.colors.text.light,
  },
  selectableUnifiedBetCardWrapper: {
    marginHorizontal: theme.spacing.xs,
    marginVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  shareModalBetWrapper: {
    borderRadius: 0,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  selectedShareBetCard: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  },
  shareModalSelectedBetCard: {
    borderLeftWidth: 8,
    borderLeftColor: theme.colors.primary,
    borderRightWidth: 2,
    borderRightColor: theme.colors.primary,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderBottomColor: theme.colors.primary,
    transform: [{ scale: 1.02 }],
  },
  selectableUnifiedBetCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shareModalBetContent: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 80,
  },
  unifiedBetCardContainer: {
    flex: 1,
  },
  selectionIndicatorContainer: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareModalSelectionIndicator: {
    paddingHorizontal: theme.spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderLeftWidth: 1,
    borderLeftColor: theme.colors.border,
    minWidth: 80,
  },
  shareModalSelectionIndicatorSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderLeftWidth: 2,
    borderLeftColor: theme.colors.primary,
  },
  shareModalList: {
    flex: 1,
  },
  shareSectionTitleContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
  },
  blurredBetCard: {
    backgroundColor: '#FAFBFC',
    borderRadius: 0,
    marginHorizontal: 0,
    marginVertical: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  blurredBetContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    minHeight: 50,
  },
  blurredBetLeft: {
    flex: 1,
    marginRight: 8,
    justifyContent: 'flex-start',
    minHeight: 40,
  },
  blurredBetMainLine: {
    fontSize: 13,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#1F2937',
    marginBottom: 2,
    lineHeight: 16,
  },
  blurredBetSubLine: {
    fontSize: 11,
    fontWeight: theme.typography.fontWeight.medium,
    color: '#6B7280',
    marginBottom: 1,
    lineHeight: 13,
  },
  blurredBetRight: {
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    minWidth: 50,
    paddingTop: 2,
  },
  blurredBetOdds: {
    fontSize: 12,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#3B82F6',
  },
  blurredBetTertiaryLine: {
    fontSize: 9,
    fontWeight: theme.typography.fontWeight.normal,
    color: '#9CA3AF',
    lineHeight: 11,
  },
  shareableBetCard: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.sm,
  },
  shareableBetContent: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 60,
  },
  shareableBetLeft: {
    flex: 1,
    marginRight: theme.spacing.sm,
    justifyContent: 'space-between',
    minHeight: 45,
  },
  shareableBetMainLine: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: 3,
    lineHeight: 17,
  },
  shareableBetSubLine: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
    marginBottom: 2,
    lineHeight: 15,
  },
  shareableBetTertiaryLine: {
    fontSize: 10,
    fontWeight: theme.typography.fontWeight.normal,
    color: theme.colors.text.light,
    lineHeight: 13,
  },
  shareableBetRight: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    minWidth: 60,
  },
  shareableBetOdds: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  addToStrategiesContainer: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  footerSpacer: {
    height: theme.spacing.xl,
  },
  addToStrategiesButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToStrategiesButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.inverse,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    ...theme.shadows.sm,
  },
  modalCloseButton: {
    padding: theme.spacing.sm,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: theme.spacing.sm,
  },
  modalHeaderSpacer: {
    width: 40,
  },
  modalScrollContent: {
    flex: 1,
  },
  modalScrollContentContainer: {
    flexGrow: 1,
  },
  modalContent: {
    flex: 1,
    padding: theme.spacing.md,
  },
  modalSubtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  modalNote: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.light,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.md,
    lineHeight: 18,
  },
  emptyStrategiesContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing['2xl'],
  },
  emptyStrategiesTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  emptyStrategiesSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  strategyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectedStrategyItem: {
    backgroundColor: theme.colors.primary + '10',
    borderColor: theme.colors.primary,
  },
  incompatibleStrategyItem: {
    backgroundColor: theme.colors.text.light + '05',
    borderColor: theme.colors.text.light + '30',
    opacity: 0.6,
  },
  strategyCheckbox: {
    marginRight: theme.spacing.md,
  },
  strategyInfo: {
    flex: 1,
  },
  strategyName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  strategyDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  modalFooter: {
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  modalBottomPadding: {
    height: 100, // Extra padding to ensure save button is accessible above keyboard
  },
  confirmButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: theme.colors.text.light,
  },
  confirmButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.inverse,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  icon: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: '700' as const,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  description: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.light,
    textAlign: 'center',
    lineHeight: 24,
  },
  emptyContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  
  // Strategies tab styles
  strategiesContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  strategiesScrollView: {
    flex: 1,
  },
  strategiesGrid: {
    padding: theme.spacing.md,
  },
  
  // Strategy card styles
  strategyCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    marginBottom: 0,
    paddingTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderBottomWidth: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    ...theme.shadows.sm,
  },
  strategyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  strategyCardInfo: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  strategyNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  monetizedIcon: {
    marginLeft: theme.spacing.xs,
  },
  strategyHeaderRight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  promoteButtonContainer: {
    borderRadius: theme.borderRadius.lg,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  promoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.xs,
    minWidth: 85,
  },
  promoteButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: 'white',
    letterSpacing: 0.3,
  },
  strategyCardName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    flex: 1,
  },
  strategyCardDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  incompatibleStrategyText: {
    color: theme.colors.text.light,
  },
  incompatibleIcon: {
    marginLeft: theme.spacing.sm,
  },
  monetizedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.status.success,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },
  monetizedText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: 'white',
    marginLeft: theme.spacing.xs,
  },
  strategyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  statValue: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  openBetsPreview: {
    marginBottom: theme.spacing.md,
  },
  betPreview: {
    paddingVertical: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  betPreviewTeams: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  betPreviewDetails: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  moreBetsText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.light,
    fontStyle: 'italic',
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  strategyActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: theme.spacing.xs,
  },
  actionButtonWrapper: {
    flex: 1,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  actionButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: 'white',
    marginLeft: theme.spacing.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  
  // Dropdown tongue styles
  dropdownTongueContainer: {
    marginHorizontal: theme.spacing.sm,
    marginTop: 0,
    marginBottom: theme.spacing.md,
  },
  dropdownTab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: theme.borderRadius.md,
    borderBottomRightRadius: theme.borderRadius.md,
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  dropdownTabText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  dropdownContent: {
    backgroundColor: theme.colors.surface,
    borderBottomLeftRadius: theme.borderRadius.md,
    borderBottomRightRadius: theme.borderRadius.md,
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderColor: theme.colors.border,
    marginTop: 1,
    ...theme.shadows.sm,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  dropdownItemText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
  },
  dropdownPLText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  
  // Yesterday performance modal styles
  yesterdayPerformanceTemplate: {
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    width: '100%',
  },
  yesterdayMainCard: {
    padding: theme.spacing.lg,
    backgroundColor: 'white',
  },
  yesterdayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  yesterdayProfilePicture: {
    marginRight: theme.spacing.sm,
  },
  yesterdayProfileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: 'white',
  },
  yesterdayDefaultProfileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.text.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  yesterdayHeaderText: {
    flex: 1,
  },
  yesterdaySellerName: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  yesterdayStrategyName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  yesterdayTitle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
  },
  yesterdayStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  yesterdayStatItem: {
    alignItems: 'center',
  },
  yesterdayStatLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  yesterdayStatValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  yesterdayBrandingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    alignSelf: 'center',
  },
  yesterdayBrandingText: {
    fontSize: theme.typography.fontSize.xs,
    color: 'white',
    marginLeft: theme.spacing.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  noDataText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
    fontStyle: 'italic',
  },
  yesterdayShareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    alignSelf: 'center',
  },
  yesterdayShareButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
    color: 'white',
    marginLeft: theme.spacing.xs,
  },
  
  // Modal form styles
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  textInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.card,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.status.error,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.lg,
  },
  deleteButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: 'white',
    marginLeft: theme.spacing.sm,
  },
  disclaimerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.status.warning + '20',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
  },
  disclaimerText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.sm,
    flex: 1,
    lineHeight: 20,
  },
  pricingContainer: {
    // Container for pricing inputs
  },
  
  // Open bets banner styles
  openBetsBanner: {
    backgroundColor: `${theme.colors.primary}10`, // Light primary color background
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  openBetsBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  openBetsBannerText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semibold,
    flex: 1,
    marginLeft: theme.spacing.sm,
    marginRight: theme.spacing.sm,
  },
  openBetsModalList: {
    flex: 1,
  },
  openBetsModalContent: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xs,
  },
  openBetsModalBetWrapper: {
    marginVertical: theme.spacing.xs,
    marginHorizontal: 0,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.xs,
  },
  
  // Share modal styles
  modalShareButton: {
    padding: theme.spacing.sm,
  },
  openBetsPromoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.xs,
    ...theme.shadows.md,
  },
  openBetsPromoteButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: 'white',
  },
  shareStrategyHeader: {
    backgroundColor: theme.colors.card,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  shareStrategyName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  shareStrategyDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  shareControlsContainer: {
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    ...theme.shadows.xs,
  },
  shareControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  selectAllButton: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectAllButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
  },
  previewToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewToggleLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginRight: theme.spacing.sm,
  },
  previewToggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.border,
    padding: 2,
    justifyContent: 'center',
  },
  previewToggleActive: {
    backgroundColor: theme.colors.primary,
  },
  previewToggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  previewToggleThumbActive: {
    transform: [{ translateX: 22 }],
  },
  shareSectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
    textAlign: 'center',
  },
  shareBetsList: {
    flex: 1,
  },
  shareableBetCard: {
    backgroundColor: theme.colors.card,
    marginHorizontal: 0,
    marginVertical: 0,
    borderRadius: 0,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  selectedShareBetCard: {
    backgroundColor: theme.colors.primary + '15',
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  blurredText: {
    color: theme.colors.text.light,
  },
  shareButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  shareButtonDisabled: {
    backgroundColor: theme.colors.text.light,
  },
  shareButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: 'white',
    marginLeft: theme.spacing.sm,
  },
  
  // Share template styles
  shareTemplatePreview: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  previewContainer: {
    alignItems: 'center',
    width: '100%',
  },
  modalScrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  shareModalBetsList: {
    maxHeight: 200, // Limit height to make room for preview
  },
  // Enhanced share template styles
  // Strategy promotion styles
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.sm,
  },
  popupContainer: {
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
    width: '95%',
  },
  popupCloseButton: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    zIndex: 10,
    padding: theme.spacing.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 20,
  },
  popupImageContainer: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    width: '100%',
    alignItems: 'center',
  },
  popupShareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.sm,
    ...theme.shadows.md,
  },
  strategyShareTemplate: {
    width: Math.min(300, Dimensions.get('window').width - 100),
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  strategyShareCardContainer: {
    padding: theme.spacing.md,
    paddingTop: theme.spacing.sm,
  },
  strategyShareCard: {
    backgroundColor: 'white',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  strategyShareTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  strategyShareDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
    lineHeight: 18,
  },
  strategyShareStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.sm,
  },
  shareStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  shareStatLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.light,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  shareStatValue: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  enhancedShareTemplate: {
    width: Math.min(350, Dimensions.get('window').width - 60), // Responsive width with max 350
    backgroundColor: 'white',
    borderRadius: 0, // Sharp corners for clean professional look
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  truesharpBadgeOverlay: {
    position: 'absolute',
    top: 6,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    zIndex: 1,
  },
  poweredByTrueSharpOverlay: {
    fontSize: 8,
    fontWeight: theme.typography.fontWeight.medium,
    color: 'black',
    marginLeft: 2,
  },
  bannerSection: {
    width: '100%',
    height: 80, // Reduced height to make banner thinner
    overflow: 'hidden',
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  defaultBanner: {
    width: '100%',
    height: '100%',
  },
  profilePictureContainer: {
    position: 'absolute',
    top: 50, // Position to overlap the banner (80px banner - 30px overlap)
    left: 12, // Slightly to the left as requested
    zIndex: 3,
  },
  profileInfoRowSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: theme.spacing.xs,
    paddingRight: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    backgroundColor: 'white',
  },
  profilePhotoSpacer: {
    width: 72, // Width to account for profile photo (60px) + margin (12px)
  },
  profileTextSection: {
    flex: 1,
    justifyContent: 'center',
  },
  strategyTitleSection: {
    paddingLeft: 12, // Align with profile photo position
    paddingRight: theme.spacing.md,
    paddingTop: 0,
    paddingBottom: theme.spacing.xs,
    backgroundColor: 'white',
  },
  strategyNameBelow: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    marginBottom: 0,
  },
  overlappingProfileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: 'white',
    backgroundColor: 'white',
  },
  overlappingDefaultProfileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: 'white',
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sellerNameBeside: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    position: 'relative',
    zIndex: 1,
    padding: theme.spacing.md,
    paddingBottom: 0,
  },
  profileImageContainer: {
    marginRight: theme.spacing.sm,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  defaultProfileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  profileInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 2,
  },
  mainStrategyTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: 'white',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  truesharpSubtitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    position: 'relative',
    zIndex: 1,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  poweredByTrueSharp: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: 'white',
    marginLeft: theme.spacing.xs,
    letterSpacing: 0.5,
  },
  enhancedBetsContainer: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: 2,
    backgroundColor: 'white',
  },
  enhancedBetCard: {
    backgroundColor: '#FAFBFC',
    borderRadius: 0, // Sharp corners to match container
    marginBottom: 2,
    marginHorizontal: 0,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  enhancedBetContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  enhancedBetMainContent: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  enhancedBetTeams: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    lineHeight: 18,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  enhancedBetMarket: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
    lineHeight: 16,
    flexWrap: 'wrap',
  },
  enhancedBetRightSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 45,
  },
  enhancedBetOdds: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}15`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    textAlign: 'center',
    minWidth: 40,
  },
  enhancedShareFooter: {
    backgroundColor: '#F8F9FA',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerGradient: {
    position: 'relative',
    padding: theme.spacing.sm,
    alignItems: 'center',
  },
  footerGradientBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  shareFooterText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  
  // Financial tab styles
  financialsContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  chartContainer: {
    backgroundColor: theme.colors.card,
    margin: theme.spacing.md,
    marginTop: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  chartTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  barChartContainer: {
    padding: theme.spacing.md,
    paddingTop: 0,
  },
  barChartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  barContainer: {
    flex: 1,
    height: 24,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    marginHorizontal: theme.spacing.sm,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: theme.borderRadius.md,
  },
  barLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    minWidth: 60,
  },
  barValue: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    minWidth: 50,
    textAlign: 'right',
  },
  strategyChartContainer: {
    padding: theme.spacing.md,
    paddingTop: 0,
  },
  strategyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  revenueStrategyInfo: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  revenueStrategyName: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  revenueStrategySubtitle: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  strategyBarContainer: {
    flex: 2,
    height: 20,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.sm,
    marginHorizontal: theme.spacing.sm,
    overflow: 'hidden',
  },
  strategyBar: {
    height: '100%',
    borderRadius: theme.borderRadius.sm,
  },
  strategyValue: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    minWidth: 60,
    textAlign: 'right',
  },
  summaryMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    paddingTop: 0,
  },
  summaryMetricCard: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    flex: 1,
    marginHorizontal: theme.spacing.xs,
    alignItems: 'center',
  },
  summaryMetricValue: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  summaryMetricLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 2,
  },
  summaryMetricNote: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.light,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  lineChartContainer: {
    backgroundColor: theme.colors.card,
    margin: theme.spacing.md,
    marginTop: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  lineChartTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  lineChartWrapper: {
    padding: theme.spacing.md,
    paddingTop: 0,
    alignItems: 'center',
  },
  lineChartPoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    position: 'absolute',
    top: -4,
  },
  lineChartBar: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
    marginBottom: theme.spacing.xs,
  },
  lineChartLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  
  // Analytics tab styles
  strategiesListContainer: {
    padding: theme.spacing.md,
    paddingTop: 0,
  },
  performanceStrategyCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  strategyRankContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  strategyRank: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: 'white',
  },
  strategyDetailsContainer: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  performanceStrategyName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  performanceStrategyStats: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  strategyPerformanceContainer: {
    alignItems: 'flex-end',
  },
  strategyROI: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: 2,
  },
  strategyROILabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  sportChartContainer: {
    padding: theme.spacing.md,
    paddingTop: 0,
  },
  sportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  sportInfo: {
    flex: 2,
    marginRight: theme.spacing.sm,
  },
  sportName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: 2,
    textTransform: 'capitalize',
  },
  sportStats: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  sportBarContainer: {
    flex: 3,
    height: 20,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.sm,
    marginHorizontal: theme.spacing.sm,
    overflow: 'hidden',
  },
  sportBar: {
    height: '100%',
    borderRadius: theme.borderRadius.sm,
  },
  sportMetrics: {
    alignItems: 'flex-end',
    minWidth: 70,
  },
  sportROI: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: 2,
  },
  sportROILabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  
  // Enhanced financial UI styles
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCardNote: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  netRevenueCard: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.status.success,
  },
  grossRevenueCard: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  arpuCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6',
  },
  subscribersCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  strategyRankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  strategyRankText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: 'white',
  },
  summaryMetricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  feeBreakdownContainer: {
    backgroundColor: theme.colors.background,
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  feeBreakdownTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  feeBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  feeBreakdownLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  feeBreakdownValue: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
  },
  feeBreakdownTotal: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
  },
  feeBreakdownLabelBold: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  feeBreakdownValueBold: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  
  // Compact KPI Card Styles
  compactKpiContainer: {
    padding: theme.spacing.md,
  },
  compactKpiGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  compactKpiCard: {
    flex: 1,
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  compactKpiCardPrimary: {
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.status.success,
  },
  compactKpiValue: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.betting.won,
    marginBottom: 2,
    textAlign: 'center',
    flexShrink: 1,
    minWidth: 0,
  },
  compactKpiValueSecondary: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: 2,
    textAlign: 'center',
    flexShrink: 1,
    minWidth: 0,
  },
  compactKpiLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    flexShrink: 1,
    minWidth: 0,
  },
  compactKpiLabelSecondary: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    flexShrink: 1,
    minWidth: 0,
  },
  compactKpiGrowth: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.betting.won,
    fontWeight: theme.typography.fontWeight.medium,
    marginTop: 1,
    textAlign: 'center',
    flexShrink: 1,
    minWidth: 0,
  },

  // Modern Chart Styles
  modernChartContainer: {
    backgroundColor: theme.colors.card,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  modernChartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  modernChartTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },

  // Frequency Grid Styles
  frequencyGrid: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.sm,
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  frequencyCard: {
    flex: 1,
    alignItems: 'center',
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border + '20',
  },
  frequencyIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  frequencyValue: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: 2,
    textAlign: 'center',
    flexShrink: 1,
    minWidth: 0,
  },
  frequencyLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: 2,
  },
  frequencyPercentage: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },

  // Strategy Card Styles
  strategyList: {
    paddingHorizontal: theme.spacing.sm,
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  modernStrategyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border + '40',
  },
  modernStrategyRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  modernStrategyRankText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: 'white',
  },
  modernStrategyInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  modernStrategyName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  modernStrategySubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  modernStrategyRevenue: {
    alignItems: 'flex-end',
  },
  modernStrategyAmount: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: 2,
    textAlign: 'right',
    flexShrink: 1,
    minWidth: 0,
  },
  modernStrategyPeriod: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },

  // Breakdown Styles
  breakdownContainer: {
    paddingHorizontal: theme.spacing.sm,
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.sm,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    minHeight: 32,
  },
  breakdownTotal: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.md,
  },
  breakdownLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  breakdownDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.sm,
  },
  breakdownText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },
  breakdownTextBold: {
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  breakdownValue: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    flexShrink: 1,
    minWidth: 0,
    textAlign: 'right',
  },
  breakdownValueBold: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    flexShrink: 1,
    minWidth: 0,
    textAlign: 'right',
  },

  // Empty State Styles
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.sm,
  },
  emptyStateText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  emptyStateSubtext: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },

  // Updated Skeleton loading styles
  skeletonCard: {
    backgroundColor: theme.colors.card,
  },
  skeletonIcon: {
    width: 24,
    height: 24,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    marginBottom: theme.spacing.sm,
  },
  skeletonValue: {
    height: 28,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: theme.spacing.xs,
    width: '60%',
  },
  skeletonLabel: {
    height: 14,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    width: '80%',
  },
  skeletonChartHeader: {
    height: 20,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    margin: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    width: '50%',
  },
  skeletonChartContent: {
    height: 120,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  // Edit Modal Styles
  editModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  editModalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
    justifyContent: 'center',
  },
  editModalTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  editModalContent: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: 'space-between',
  },
  editInputsContainer: {
    flex: 0,
  },
  editInputGroup: {
    marginBottom: theme.spacing.md,
  },
  editInputLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  editInputLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  editTextInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.surface,
  },
  editTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  editModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    gap: theme.spacing.md,
  },
  editDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: '#FFF2F2',
    borderWidth: 1,
    borderColor: '#FFE6E6',
    gap: theme.spacing.sm,
  },
  editDeleteButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: '#FF3B30',
  },
  editSaveButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  editSaveButtonDisabled: {
    opacity: 0.5,
  },
  editSaveButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.inverse,
  },
  
  // Parlay legs styles for share modal
  shareableParlayLegs: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  shareableLegsHeader: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  shareableLegsHeaderText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  shareableLegRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    minHeight: 45,
  },
  shareableLegNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  shareableLegNumberText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: 'white',
  },
  shareableLegContent: {
    flex: 1,
    marginRight: theme.spacing.sm,
    justifyContent: 'space-between',
    minHeight: 32,
  },
  shareableLegMarketLine: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: 1,
    lineHeight: 14,
  },
  shareableLegTeamMatchup: {
    fontSize: 9,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
    marginBottom: 1,
    lineHeight: 12,
  },
  shareableLegInfo: {
    fontSize: 8,
    color: theme.colors.text.light,
    lineHeight: 10,
  },
  shareableLegRight: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 32,
  },
  shareableLegOdds: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  shareableExpandIcon: {
    marginLeft: theme.spacing.sm,
    justifyContent: 'center',
  },
  
  // Blurred parlay legs styles for image generation
  blurredParlayLegs: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  blurredLegRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    minHeight: 40,
  },
  blurredLegNumber: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  blurredLegNumberText: {
    fontSize: 10,
    fontWeight: theme.typography.fontWeight.bold,
    color: 'white',
  },
  blurredLegContent: {
    flex: 1,
    marginRight: theme.spacing.sm,
    justifyContent: 'space-between',
    minHeight: 28,
  },
  blurredLegMarketLine: {
    fontSize: 11,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: 1,
    lineHeight: 13,
  },
  blurredLegTeamMatchup: {
    fontSize: 9,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
    marginBottom: 1,
    lineHeight: 11,
  },
  blurredLegInfo: {
    fontSize: 8,
    color: theme.colors.text.light,
    lineHeight: 10,
  },
  blurredLegRight: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 28,
  },
  blurredLegOdds: {
    fontSize: 10,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
});