import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  Share,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { globalStyles } from '../../styles/globalStyles';
import { fetchMarketplaceLeaderboard, MarketplaceStrategy } from '../../services/supabaseAnalytics';
import { captureRef } from 'react-native-view-shot';
import { useAuth } from '../../contexts/AuthContext';
import { adminService } from '../../services/adminService';
import LeagueGamesCard from './LeagueGamesCard';

export default function MarketingTab() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [topStrategies, setTopStrategies] = useState<MarketplaceStrategy[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  
  const leaderboardRef = useRef<View>(null);

  const fetchTopStrategies = useCallback(async () => {
    try {
      setError(null);
      
      // Use the same marketplace leaderboard function to ensure identical ranking
      const strategies = await fetchMarketplaceLeaderboard(10);
      
      setTopStrategies(strategies);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading leaderboard');
      console.error('Error fetching top strategies:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    validateAccess();
  }, [user]);

  useEffect(() => {
    if (hasAccess) {
      fetchTopStrategies();
    }
  }, [hasAccess, fetchTopStrategies]);

  const validateAccess = async () => {
    try {
      const isValidAdmin = await adminService.validateAdminAccess(user);
      setHasAccess(isValidAdmin);
      
      if (!isValidAdmin) {
        setError('Access denied: Admin privileges required');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error validating admin access:', err);
      setError('Failed to validate admin access');
      setHasAccess(false);
      setLoading(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTopStrategies().finally(() => setRefreshing(false));
  }, [fetchTopStrategies]);

  const formatROI = (roi: number | null | undefined) => {
    if (roi === null || roi === undefined) return '0.0%';
    const value = roi >= 0 ? `+${roi.toFixed(1)}` : roi.toFixed(1);
    return `${value}%`;
  };

  const formatRecord = (wins: number | null | undefined, losses: number | null | undefined, pushes: number | null | undefined) => {
    const w = wins || 0;
    const l = losses || 0;
    const p = pushes || 0;
    const total = w + l + p;
    if (total === 0) return '0-0';
    return p > 0 ? `${w}-${l}-${p}` : `${w}-${l}`;
  };

  const handleGenerateShareImage = async () => {
    // Double-check admin access before allowing image generation
    const isValidAdmin = await adminService.validateAdminAccess(user);
    if (!isValidAdmin) {
      Alert.alert('Access Denied', 'Admin privileges required to share leaderboard.');
      return;
    }

    if (!leaderboardRef.current) {
      Alert.alert('Error', 'Leaderboard not ready. Please try again.');
      return;
    }

    try {
      setIsGeneratingImage(true);

      // Wait a moment for any animations to settle
      await new Promise(resolve => setTimeout(resolve, 300));

      // Capture the leaderboard card as an image
      const templateWidth = Math.min(400, Dimensions.get('window').width - 40);
      const uri = await captureRef(leaderboardRef.current, {
        format: 'png',
        quality: 0.95,
        width: templateWidth,
        backgroundColor: 'white',
        result: 'tmpfile',
      });

      // Share the captured image
      await Share.share({
        url: uri,
        message: `🏆 TrueSharp Top 10 Leaderboard - ${new Date().toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        })}\n\nDiscover the top performing strategies on TrueSharp!`,
      });
    } catch (error) {
      console.error('Error generating share image:', error);
      Alert.alert('Error', 'Failed to generate share image. Please try again.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading TrueSharp Top 10...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={theme.colors.status.error} />
        <Text style={styles.errorTitle}>Error Loading Leaderboard</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchTopStrategies}>
          <Ionicons name="refresh-outline" size={20} color={theme.colors.card} />
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.primary}
        />
      }
    >
      <View style={styles.section}>
        <View style={styles.leaderboardContainer}>
          <View ref={leaderboardRef} style={styles.leaderboardCard}>
            <View style={styles.titleContainer}>
              <View style={styles.titleRow}>
                <Image 
                  source={require('../../assets/truesharp-logo.png')}
                  style={styles.titleLogo}
                  resizeMode="contain"
                />
                <Text style={styles.sectionTitle}>TrueSharp Top 10</Text>
              </View>
              <Text style={styles.dateText}>{new Date().toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              })}</Text>
            </View>
            
            <View style={styles.leaderboardContent}>
            {topStrategies.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="trophy-outline" size={48} color={theme.colors.text.secondary} />
              <Text style={styles.emptyStateText}>No strategies available</Text>
            </View>
          ) : (
            topStrategies.map((strategy, index) => (
              <View key={strategy.id} style={styles.leaderboardRow}>
                <View style={styles.rankContainer}>
                  <Text style={styles.rankText}>#{index + 1}</Text>
                </View>
                
                <View style={styles.profilePictureContainer}>
                  {strategy.profile_picture_url ? (
                    <Image
                      source={{ uri: strategy.profile_picture_url }}
                      style={styles.profilePicture}
                    />
                  ) : (
                    <View style={styles.defaultAvatar}>
                      <Ionicons name="person-outline" size={20} color={theme.colors.text.secondary} />
                    </View>
                  )}
                </View>
                
                <View style={styles.strategyInfo}>
                  <Text style={styles.strategyName} numberOfLines={1}>
                    {strategy.strategy_name || 'Unnamed Strategy'}
                  </Text>
                  <Text style={styles.username} numberOfLines={1}>
                    @{strategy.username || 'anonymous'}
                  </Text>
                </View>
                
                <View style={styles.statsContainer}>
                  <View style={styles.statGroup}>
                    <Text style={[styles.roiText, { color: (strategy.roi_percentage || 0) >= 0 ? theme.colors.status.success : theme.colors.status.error }]}>
                      {formatROI(strategy.roi_percentage)}
                    </Text>
                    <Text style={styles.recordText}>
                      {formatRecord(strategy.winning_bets || 0, strategy.losing_bets || 0, strategy.push_bets || 0)}
                    </Text>
                  </View>
                  
                  <View style={styles.statGroup}>
                    <Text style={styles.winRateText}>
                      {(((strategy.win_rate || 0) * 100) || 0).toFixed(1)}%
                    </Text>
                    <Text style={styles.betsText}>
                      {(strategy.total_bets || 0).toLocaleString()} bets
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
            </View>
          </View>
          
          {/* Share Button */}
          <TouchableOpacity
            style={[
              styles.shareButton,
              isGeneratingImage && styles.shareButtonDisabled
            ]}
            onPress={handleGenerateShareImage}
            disabled={isGeneratingImage || topStrategies.length === 0}
            activeOpacity={0.8}
          >
            {isGeneratingImage ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="share-outline" size={20} color="white" />
            )}
            <Text style={styles.shareButtonText}>
              {isGeneratingImage ? 'Generating...' : 'Share Leaderboard'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* League Games Cards */}
      <LeagueGamesCard 
        league="MLB" 
        leagueColor={theme.colors.sports.mlb}
        title="MLB"
      />
      
      <LeagueGamesCard 
        league="NBA" 
        leagueColor={theme.colors.sports.nba}
        title="NBA"
      />
      
      <LeagueGamesCard 
        league="NHL" 
        leagueColor={theme.colors.sports.nhl}
        title="NHL"
      />
      
      <LeagueGamesCard 
        league="NFL" 
        leagueColor={theme.colors.sports.nfl}
        title="NFL"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.sm,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  leaderboardContainer: {
    // This container will be useful for future image generation feature
  },
  leaderboardCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    ...theme.shadows.sm,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleLogo: {
    width: 24,
    height: 24,
    marginRight: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  dateText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  leaderboardContent: {
    // Content area for the leaderboard rows
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  rankContainer: {
    width: 28,
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  rankText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  profilePictureContainer: {
    marginRight: theme.spacing.sm,
  },
  profilePicture: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
  },
  defaultAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  strategyInfo: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  strategyName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 1,
  },
  username: {
    fontSize: 11,
    color: theme.colors.text.secondary,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  statGroup: {
    alignItems: 'center',
    minWidth: 50,
  },
  roiText: {
    fontSize: 13,
    fontWeight: '700',
  },
  recordText: {
    fontSize: 10,
    color: theme.colors.text.secondary,
  },
  winRateText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  betsText: {
    fontSize: 10,
    color: theme.colors.text.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  loadingText: {
    ...globalStyles.body,
    marginTop: theme.spacing.md,
    color: theme.colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  errorTitle: {
    ...globalStyles.h3,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    color: theme.colors.status.error,
  },
  errorText: {
    ...globalStyles.body,
    textAlign: 'center',
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.lg,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  retryText: {
    ...globalStyles.bodyBold,
    color: theme.colors.card,
  },
  emptyState: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyStateText: {
    ...globalStyles.body,
    marginTop: theme.spacing.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  shareButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  shareButtonDisabled: {
    backgroundColor: theme.colors.text.secondary,
    opacity: 0.6,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});