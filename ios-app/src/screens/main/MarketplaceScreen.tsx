import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Image, Alert, TextInput, Modal, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles } from '../../styles/globalStyles';
import { theme } from '../../styles/theme';
import { MarketplaceStrategy, fetchMarketplaceLeaderboard, StrategyLeaderboard } from '../../services/supabaseAnalytics';
import TrueSharpShield from '../../components/common/TrueSharpShield';
import { LeagueLogo } from '../../components/common/LeagueLogo';
import SellerProfileModal from '../../components/marketplace/SellerProfileModal';
import SubscribeToStrategyModal from '../../components/subscription/SubscribeToStrategyModal';

// Helper function to normalize sport/league names for filtering
const normalizeSportForFiltering = (sport: string): string => {
  const normalized = sport.toUpperCase().trim();
  // Treat NCAAB, NCAAM, and NCAAMB as the same league
  if (normalized === 'NCAAM' || normalized === 'NCAAMB') {
    return 'NCAAB';
  }
  return normalized;
};

export default function MarketplaceScreen() {
  const [strategies, setStrategies] = useState<MarketplaceStrategy[]>([]);
  const [allStrategies, setAllStrategies] = useState<MarketplaceStrategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSellerUsername, setSelectedSellerUsername] = useState<string | null>(null);
  const [showSellerModal, setShowSellerModal] = useState(false);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeague, setSelectedLeague] = useState('all');
  const [selectedPerformance, setSelectedPerformance] = useState('rank');
  
  // Dropdown state
  const [showLeagueDropdown, setShowLeagueDropdown] = useState(false);
  const [showPerformanceDropdown, setShowPerformanceDropdown] = useState(false);
  
  // Search input ref and current text ref
  const searchInputRef = useRef<TextInput>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentSearchText = useRef<string>('');
  
  // Stable key to prevent TextInput remounting
  const inputKey = useMemo(() => 'marketplace-search-input', []);

  // Load marketplace leaderboard - fetch more to ensure we have enough for filtering
  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      // Fetch more strategies to ensure we have enough for search and filtering
      const data = await fetchMarketplaceLeaderboard(200);
      setAllStrategies(data);
      applyFilters(data);
    } catch (error) {
      console.error('Error loading marketplace leaderboard:', error);
      Alert.alert('Error', 'Failed to load marketplace strategies');
    } finally {
      setLoading(false);
    }
  };

  // Available leagues for filtering
  const leagues = [
    'all', 'NFL', 'NBA', 'MLB', 'NHL', 'NCAAF', 'NCAAB', 'WNBA', 'CFL', 'XFL',
    'Premier League', 'Champions League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1', 'MLS',
    'ATP Tour', 'WTA Tour', 'PGA Tour', 'UFC', 'Bellator', 'Boxing', 'Formula 1', 'NASCAR'
  ];

  // Performance filter options
  const performanceOptions = [
    { label: 'Best Rank', value: 'rank' },
    { label: 'Highest ROI', value: 'roi' },
    { label: 'Win Rate', value: 'winRate' },
    { label: 'Total Bets', value: 'totalBets' },
    { label: 'Most Subscribers', value: 'subscribers' }
  ];

  // Apply search and filters with useCallback to prevent re-renders
  const applyFilters = useCallback((data: MarketplaceStrategy[] = allStrategies) => {
    let filtered = [...data];

    // Apply league filter first (before search for better performance)
    if (selectedLeague !== 'all') {
      filtered = filtered.filter(strategy => {
        const strategySport = normalizeSportForFiltering(strategy.primary_sport || '');
        const selectedSport = normalizeSportForFiltering(selectedLeague);
        return strategySport === selectedSport;
      });
    }

    // Apply search filter with ranking
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      
      // Score and sort by search relevance
      const searchResults = filtered
        .map(strategy => {
          const username = strategy.username.toLowerCase();
          const strategyName = strategy.strategy_name.toLowerCase();
          const strategyId = strategy.strategy_id.toLowerCase();
          
          let score = 0;
          
          // Exact matches get highest score
          if (username === search) score += 100;
          if (strategyName === search) score += 90;
          
          // Start-of-word matches get high score
          if (username.startsWith(search)) score += 80;
          if (strategyName.startsWith(search)) score += 70;
          
          // General contains matches
          if (username.includes(search)) score += 50;
          if (strategyName.includes(search)) score += 40;
          if (strategyId.includes(search)) score += 30;
          
          return { strategy, score };
        })
        .filter(item => item.score > 0)
        .sort((a, b) => {
          // Sort by search score first, then by marketplace rank
          if (a.score !== b.score) return b.score - a.score;
          return (b.strategy.marketplace_rank_score || 0) - (a.strategy.marketplace_rank_score || 0);
        })
        .map(item => item.strategy);
      
      filtered = searchResults;
    }

    // Apply performance sorting (only if not searching, as search has its own ranking)
    if (!searchTerm.trim()) {
      switch (selectedPerformance) {
        case 'roi':
          filtered.sort((a, b) => (b.roi_percentage || 0) - (a.roi_percentage || 0));
          break;
        case 'winRate':
          filtered.sort((a, b) => (b.win_rate || 0) - (a.win_rate || 0));
          break;
        case 'totalBets':
          filtered.sort((a, b) => (b.total_bets || 0) - (a.total_bets || 0));
          break;
        case 'subscribers':
          filtered.sort((a, b) => (b.subscriber_count || 0) - (a.subscriber_count || 0));
          break;
        case 'rank':
        default:
          // Use our new marketplace ranking algorithm (marketplace_rank_score)
          filtered.sort((a, b) => (b.marketplace_rank_score || 0) - (a.marketplace_rank_score || 0));
          break;
      }
    }

    // Always limit to top 50 results
    const finalResults = filtered.slice(0, 50);
    setStrategies(finalResults);
  }, [searchTerm, selectedLeague, selectedPerformance, allStrategies]);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  // Apply filters only when searchTerm, league, or performance changes
  useEffect(() => {
    applyFilters();
  }, [searchTerm, selectedLeague, selectedPerformance, allStrategies, applyFilters]);

  // Handle search with uncontrolled input - no keyboard dismissal
  const handleSearchChange = useCallback((text: string) => {
    // Store current text in ref for reference
    currentSearchText.current = text;
    
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // If text is empty, clear search immediately
    if (text.trim() === '') {
      setSearchTerm('');
      return;
    }
    
    // Set a new timeout for debounced search with much longer delay
    searchTimeoutRef.current = setTimeout(() => {
      setSearchTerm(text);
    }, 1500); // 1.5 second debounce - gives users plenty of time to type
  }, []);

  // Clear search function
  const clearSearch = useCallback(() => {
    currentSearchText.current = '';
    if (searchInputRef.current) {
      searchInputRef.current.clear();
    }
    setSearchTerm('');
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Handle league selection
  const handleLeagueSelect = (league: string) => {
    setSelectedLeague(league);
    setShowLeagueDropdown(false);
  };

  // Handle performance selection
  const handlePerformanceSelect = (performance: string) => {
    setSelectedPerformance(performance);
    setShowPerformanceDropdown(false);
  };

  // Debug arrays
  // Add a quick test to verify data exists
  useEffect(() => {
    const testQuery = async () => {
      try {
        const response = await fetch('your-supabase-url/rest/v1/strategy_leaderboard?select=*', {
          headers: {
            'apikey': 'your-supabase-anon-key',
            'Authorization': 'Bearer your-supabase-anon-key'
          }
        });
        const result = await response.json();
      } catch (error) {
      }
    };
    // testQuery(); // Uncomment if needed for debugging
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadLeaderboard();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatRecord = (wins: number, losses: number, pushes: number) => {
    return `${wins}-${losses}${pushes > 0 ? `-${pushes}` : ''}`;
  };

  const renderProfilePicture = (url?: string, username?: string) => {
    if (url) {
      return (
        <Image 
          source={{ uri: url }}
          style={styles.profilePicture}
          onError={() => {
            // If image fails to load, show initials
          }}
        />
      );
    }
    
    // Show user initials as fallback
    const initials = username ? username.substring(0, 2).toUpperCase() : '??';
    return (
      <View style={[styles.profilePicture, styles.initialsContainer]}>
        <Text style={styles.initialsText}>{initials}</Text>
      </View>
    );
  };

  const renderStrategyItem = useCallback(({ item: strategy, index }: { item: MarketplaceStrategy; index: number }) => {
    return (
      <TouchableOpacity style={styles.strategyCard} onPress={() => handleStrategyPress(strategy)}>
        <View style={styles.strategyContent}>
        {/* Header with Title and Subscribe Button */}
        <View style={styles.headerRow}>
          <View style={styles.titleSection}>
            <Text style={styles.strategyName} numberOfLines={2}>
              {strategy.strategy_name}
            </Text>
          </View>
          <TouchableOpacity style={styles.subscribeButtonContainer} onPress={() => handleSubscribe(strategy)}>
            <LinearGradient
              colors={[theme.colors.primary, '#1E40AF', '#1D4ED8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.subscribeButton}
            >
              <Ionicons name="add-circle" size={20} color="white" />
              <Text style={styles.subscribeButtonText}>Follow Picks</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* User Info Row */}
        <View style={styles.userInfoRow}>
          <View style={styles.profileContainer}>
            {renderProfilePicture(strategy.profile_picture_url, strategy.username)}
            <View style={styles.rankBadge}>
              <Text style={styles.rankBadgeText}>{index + 1}</Text>
            </View>
          </View>
          <View style={styles.userDetails}>
            <View style={styles.userMetaRow}>
              <Text style={styles.username}>@{strategy.username}</Text>
              {strategy.verification_status !== 'unverified' && (
                <View style={[styles.verificationBadge, 
                  { backgroundColor: strategy.verification_status === 'premium' ? theme.colors.primary : theme.colors.secondary }
                ]}>
                  <Ionicons name="checkmark-circle" size={12} color="white" />
                  <Text style={styles.verificationText}>
                    {strategy.verification_status === 'premium' ? 'Premium' : 'Verified'}
                  </Text>
                </View>
              )}
            </View>
          </View>
          {strategy.primary_sport && (
            <View style={styles.sportTag}>
              <LeagueLogo leagueName={strategy.primary_sport} size={16} style={styles.sportLogo} />
              <Text style={styles.sportText}>{strategy.primary_sport}</Text>
            </View>
          )}
        </View>

        {/* Metrics Row - Fixed Layout */}
        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>ROI</Text>
            <Text style={[
              styles.metricValue,
              { color: (strategy.roi_percentage || 0) >= 0 ? theme.colors.betting.won : theme.colors.betting.lost }
            ]}>
              {(strategy.roi_percentage || 0) >= 0 ? '+' : ''}{(strategy.roi_percentage || 0).toFixed(1)}%
            </Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Record</Text>
            <Text style={styles.metricValue}>
              {formatRecord(strategy.winning_bets, strategy.losing_bets, strategy.push_bets)}
            </Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Win Rate</Text>
            <Text style={styles.metricValue}>
              {((strategy.win_rate || 0) * 100).toFixed(1)}%
            </Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Bets</Text>
            <Text style={styles.metricValue}>
              {strategy.total_bets || 0}
            </Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Subs</Text>
            <Text style={styles.metricValue}>
              {strategy.subscriber_count || 0}
            </Text>
          </View>
        </View>

        {/* Pricing Row - Show all 3 options */}
        {strategy.is_monetized && (
          <View style={styles.pricingRow}>
            <View style={styles.pricingOptions}>
              {strategy.subscription_price_weekly && (
                <View style={styles.pricingOption}>
                  <Text style={styles.pricingLabel}>Weekly</Text>
                  <Text style={styles.pricingValue}>
                    {formatCurrency(strategy.subscription_price_weekly)}
                  </Text>
                </View>
              )}
              {strategy.subscription_price_monthly && (
                <View style={styles.pricingOption}>
                  <Text style={styles.pricingLabel}>Monthly</Text>
                  <Text style={styles.pricingValue}>
                    {formatCurrency(strategy.subscription_price_monthly)}
                  </Text>
                </View>
              )}
              {strategy.subscription_price_yearly && (
                <View style={styles.pricingOption}>
                  <Text style={styles.pricingLabel}>Yearly</Text>
                  <Text style={styles.pricingValue}>
                    {formatCurrency(strategy.subscription_price_yearly)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
    );
  }, []);

  const handleStrategyPress = (strategy: MarketplaceStrategy) => {
    setSelectedSellerUsername(strategy.username);
    setShowSellerModal(true);
  };

  const handleSubscribe = (strategy: MarketplaceStrategy | StrategyLeaderboard) => {
    setSelectedStrategyId(strategy.strategy_id);
    setShowSubscribeModal(true);
  };

  const handleCloseSellerModal = () => {
    setShowSellerModal(false);
    setSelectedSellerUsername(null);
  };

  const renderHeader = () => {    
    return (
      <View style={styles.header}>
        {/* Title Row */}
        <View style={styles.titleRow}>
          <View style={styles.titleContainer}>
            <TrueSharpShield size={20} variant="default" style={styles.shieldIcon} />
            <Text style={styles.title}>Strategy Marketplace</Text>
          </View>
          <Text style={styles.resultCount}>{strategies.length} strategies</Text>
        </View>
        
        {/* Search Row */}
        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={16} color={theme.colors.text.secondary} style={styles.searchIcon} />
            <TextInput
              key={inputKey}
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="Search by username or strategy..."
              placeholderTextColor={theme.colors.text.secondary}
              onChangeText={handleSearchChange}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
          </View>
        </View>
        
        {/* Filter Row */}
        <View style={styles.filterRow}>
          <View style={styles.filterContainer}>
            <Text style={styles.filterLabel}>League:</Text>
            <TouchableOpacity 
              style={styles.dropdownButton} 
              onPress={() => setShowLeagueDropdown(true)}
            >
              <Text style={styles.dropdownButtonText}>
                {selectedLeague === 'all' ? 'All Leagues' : selectedLeague}
              </Text>
              <Ionicons name="chevron-down" size={14} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.filterContainer}>
            <Text style={styles.filterLabel}>Sort:</Text>
            <TouchableOpacity 
              style={styles.dropdownButton} 
              onPress={() => setShowPerformanceDropdown(true)}
            >
              <Text style={styles.dropdownButtonText}>
                {performanceOptions.find(opt => opt.value === selectedPerformance)?.label || 'Best Rank'}
              </Text>
              <Ionicons name="chevron-down" size={14} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="trophy-outline" size={64} color={theme.colors.text.light} />
      <Text style={styles.emptyTitle}>No Strategies Available</Text>
      <Text style={styles.emptySubtitle}>
        Check back later for verified betting strategies
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={globalStyles.safeArea} edges={['bottom']}>
        <View style={styles.container}>
          {renderHeader()}
          <View style={styles.loadingContainer}>
            <Ionicons name="analytics" size={48} color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading marketplace strategies...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={globalStyles.safeArea} edges={['bottom']}>
      <View style={styles.container}>
        <FlatList
          data={strategies}
          renderItem={renderStrategyItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyState}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      </View>

      {/* Seller Profile Modal */}
      <SellerProfileModal
        visible={showSellerModal}
        username={selectedSellerUsername || ''}
        onClose={handleCloseSellerModal}
        onSubscribe={handleSubscribe}
      />

      {/* Subscribe to Strategy Modal */}
      <SubscribeToStrategyModal
        visible={showSubscribeModal}
        strategyId={selectedStrategyId || undefined}
        onClose={() => {
          setShowSubscribeModal(false);
          setSelectedStrategyId(null);
        }}
        onSubscribe={(strategyId, priceType, price) => {
          // Handle the subscription logic here
          setShowSubscribeModal(false);
          setSelectedStrategyId(null);
        }}
      />

      {/* League Dropdown Modal */}
      <Modal
        visible={showLeagueDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLeagueDropdown(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackground} 
            activeOpacity={1} 
            onPress={() => setShowLeagueDropdown(false)}
          />
          <View style={styles.dropdownModal}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>Select League</Text>
              <TouchableOpacity onPress={() => setShowLeagueDropdown(false)}>
                <Ionicons name="close" size={20} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.dropdownList} showsVerticalScrollIndicator={false}>
              {leagues.map((league, index) => (
                <TouchableOpacity
                  key={`league-${league}-${index}`}
                  style={[
                    styles.dropdownItem,
                    selectedLeague === league && styles.dropdownItemSelected,
                    index === leagues.length - 1 && styles.dropdownItemLast
                  ]}
                  onPress={() => handleLeagueSelect(league)}
                  activeOpacity={0.7}
                >
                  <View style={styles.dropdownItemContent}>
                    {league !== 'all' && (
                      <LeagueLogo leagueName={league} size={20} style={styles.dropdownLeagueLogo} />
                    )}
                    <Text style={[
                      styles.dropdownItemText,
                      selectedLeague === league && styles.dropdownItemTextSelected,
                      league !== 'all' && styles.dropdownItemTextWithLogo
                    ]}>
                      {league === 'all' ? 'All Leagues' : league}
                    </Text>
                  </View>
                  {selectedLeague === league && (
                    <Ionicons name="checkmark" size={16} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Performance Dropdown Modal */}
      <Modal
        visible={showPerformanceDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPerformanceDropdown(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackground} 
            activeOpacity={1} 
            onPress={() => setShowPerformanceDropdown(false)}
          />
          <View style={styles.dropdownModal}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>Sort By</Text>
              <TouchableOpacity onPress={() => setShowPerformanceDropdown(false)}>
                <Ionicons name="close" size={20} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.dropdownList} showsVerticalScrollIndicator={false}>
              {performanceOptions.map((option, index) => (
                <TouchableOpacity
                  key={`performance-${option.value}-${index}`}
                  style={[
                    styles.dropdownItem,
                    selectedPerformance === option.value && styles.dropdownItemSelected,
                    index === performanceOptions.length - 1 && styles.dropdownItemLast
                  ]}
                  onPress={() => handlePerformanceSelect(option.value)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    selectedPerformance === option.value && styles.dropdownItemTextSelected
                  ]}>
                    {option.label}
                  </Text>
                  {selectedPerformance === option.value && (
                    <Ionicons name="checkmark" size={16} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContent: {
    paddingBottom: theme.spacing.xl,
  },
  header: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  shieldIcon: {
    opacity: 0.8,
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  resultCount: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  searchRow: {
    marginBottom: theme.spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchIcon: {
    marginRight: theme.spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    paddingVertical: 0,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  filterContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
    marginRight: theme.spacing.xs,
    minWidth: 40,
  },
  dropdownButton: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    height: 32,
    paddingHorizontal: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownButtonText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.primary,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dropdownModal: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    maxHeight: '70%',
    width: '100%',
    maxWidth: 300,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  dropdownTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  dropdownList: {
    maxHeight: 300,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    minHeight: 44,
  },
  dropdownItemLast: {
    borderBottomWidth: 0,
  },
  dropdownItemSelected: {
    backgroundColor: theme.colors.surface,
  },
  dropdownItemText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    flex: 1,
  },
  dropdownItemTextSelected: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  dropdownItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dropdownLeagueLogo: {
    marginRight: theme.spacing.sm,
  },
  dropdownItemTextWithLogo: {
    marginLeft: 0,
  },
  strategyCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  strategyContent: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.xs,
  },
  titleSection: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  profileContainer: {
    position: 'relative',
    marginRight: theme.spacing.sm,
  },
  profilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
  },
  rankBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.card,
  },
  rankBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: 'white',
    lineHeight: theme.typography.fontSize.xs,
  },
  initialsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
  },
  initialsText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: 'white',
  },
  userDetails: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  userMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  strategyName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    lineHeight: 24,
  },
  username: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.full,
    gap: 2,
  },
  verificationText: {
    fontSize: theme.typography.fontSize.xs,
    color: 'white',
    fontWeight: theme.typography.fontWeight.medium,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
    minWidth: 50,
  },
  metricLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  sportTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
  },
  sportLogo: {
    // No additional styles needed, just for reference
  },
  sportText: {
    fontSize: theme.typography.fontSize.xs,
    color: 'white',
    fontWeight: theme.typography.fontWeight.medium,
  },
  pricingRow: {
    paddingTop: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  pricingOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pricingOption: {
    alignItems: 'center',
    flex: 1,
  },
  pricingLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginBottom: 2,
  },
  pricingValue: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  subscribeButtonContainer: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  subscribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
    minHeight: 40,
  },
  subscribeButtonText: {
    fontSize: theme.typography.fontSize.base,
    color: 'white',
    fontWeight: theme.typography.fontWeight.semibold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing['2xl'],
  },
  loadingText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing['2xl'],
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptySubtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});