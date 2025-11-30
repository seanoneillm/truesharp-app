import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { useBetSlip, BetSlipBet } from '../../contexts/BetSlipContext';
import TrueSharpShield from '../common/TrueSharpShield';

const { width: screenWidth } = Dimensions.get('window');

// Format odds helper
const formatOdds = (odds: number): string => {
  if (!isFinite(odds)) {
    return '+100'; // Default fallback for infinity
  }
  if (odds > 0) {
    return `+${odds}`;
  }
  return odds.toString();
};

// Helper function to extract player name from market type
const getPlayerName = (marketType: string): string => {
  const nameMatch = marketType.match(/-([A-Z_]+_[A-Z_]+)_1_[A-Z]+-game/);
  if (nameMatch && nameMatch[1]) {
    const playerName = nameMatch[1]
      .split('_')
      .map(part => part.charAt(0) + part.slice(1).toLowerCase())
      .join(' ');
    return playerName;
  }
  return 'Player';
};

// Helper function to get prop display name from market type
const getPropDisplayName = (marketType: string): string => {
  const lowerMarketType = marketType.toLowerCase();

  // Baseball props
  if (lowerMarketType.includes('batting_hits')) return 'Hits';
  if (lowerMarketType.includes('batting_homeruns') || lowerMarketType.includes('batting_homerun'))
    return 'Home Runs';
  if (lowerMarketType.includes('batting_rbi')) return 'RBIs';
  if (lowerMarketType.includes('batting_runs')) return 'Runs';
  if (lowerMarketType.includes('batting_totalbases')) return 'Total Bases';
  if (lowerMarketType.includes('pitching_strikeouts')) return 'Strikeouts';
  if (lowerMarketType.includes('pitching_hits')) return 'Hits Allowed';

  // Football props
  if (lowerMarketType.includes('passing_yards')) return 'Passing Yards';
  if (lowerMarketType.includes('rushing_yards')) return 'Rushing Yards';
  if (lowerMarketType.includes('receiving_yards')) return 'Receiving Yards';
  if (lowerMarketType.includes('passing_touchdowns')) return 'Passing TDs';
  if (lowerMarketType.includes('rushing_touchdowns')) return 'Rushing TDs';
  if (lowerMarketType.includes('receiving_touchdowns')) return 'Receiving TDs';

  // Basketball props
  if (lowerMarketType.includes('points') && !lowerMarketType.includes('team')) return 'Points';
  if (lowerMarketType.includes('rebounds')) return 'Rebounds';
  if (lowerMarketType.includes('assists')) return 'Assists';

  // Hockey props
  if (lowerMarketType.includes('goals')) return 'Goals';
  if (lowerMarketType.includes('saves')) return 'Saves';

  return 'Prop';
};

// Parse bet information for better display
const parseBetInfo = (bet: BetSlipBet) => {
  const isPlayerProp =
    bet.marketType.match(/-[A-Z_]+_1_[A-Z]+-game/) || bet.marketType.match(/\d{4,}/);
  const isMainLine =
    bet.marketType.includes('points-home-game-ml') ||
    bet.marketType.includes('points-away-game-ml') ||
    bet.marketType.includes('points-home-game-sp') ||
    bet.marketType.includes('points-away-game-sp') ||
    bet.marketType.includes('points-all-game-ou');

  let playerOrTeam = '';
  let marketDisplay = '';
  let selectionDisplay = bet.selection;

  if (isPlayerProp) {
    playerOrTeam = getPlayerName(bet.marketType);
    marketDisplay = getPropDisplayName(bet.marketType);
    // For over/under, show Over/Under instead of just the selection
    if (bet.marketType.includes('-ou-over')) {
      selectionDisplay = 'Over';
    } else if (bet.marketType.includes('-ou-under')) {
      selectionDisplay = 'Under';
    }
  } else if (isMainLine) {
    // For main lines, use team names
    playerOrTeam = bet.selection;
    if (bet.marketType.includes('-ml-')) {
      marketDisplay = 'Moneyline';
    } else if (bet.marketType.includes('-sp-')) {
      marketDisplay = 'Spread';
    } else if (bet.marketType.includes('-ou-')) {
      marketDisplay = 'Total';
      selectionDisplay = bet.marketType.includes('over') ? 'Over' : 'Under';
    }
  } else {
    // Fallback for other bet types
    playerOrTeam = bet.selection;
    marketDisplay = bet.marketType;
  }

  return {
    playerOrTeam,
    marketDisplay,
    selectionDisplay,
    isPlayerProp,
    isMainLine,
  };
};

const FloatingBetSlip: React.FC = () => {
  const { 
    bets, 
    isCollapsed, 
    removeBet, 
    clearAllBets, 
    toggleCollapsed, 
    parlayOdds, 
    totalLegs,
    wagerAmount,
    isPlacingBet,
    setWagerAmount,
    placeBet,
    calculatePayout
  } = useBetSlip();
  const [isFullModalVisible, setIsFullModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Don't render if no bets
  if (totalLegs === 0) return null;

  // Calculate profit (payout minus wager)
  const calculateProfit = (): number => {
    const payoutCalculation = calculatePayout();
    return payoutCalculation.profit;
  };

  // Show error message with auto-dismiss
  const showError = (message: string) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(null), 4000);
  };

  // Show success message with auto-dismiss
  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleFloatingBarPress = () => {
    setIsFullModalVisible(true);
  };

  const handlePlaceBet = async () => {
    try {
      // Clear any existing messages
      setErrorMessage(null);
      setSuccessMessage(null);

      // Submit bet using context method
      const result = await placeBet();

      if (result.success) {
        const betType = totalLegs === 1 ? 'bet' : `${totalLegs}-leg parlay`;
        const message = result.message || `Your ${betType} has been placed for $${wagerAmount.toFixed(2)}`;
        
        showSuccess(message);
        
        // Close modal after showing success
        setTimeout(() => {
          setIsFullModalVisible(false);
        }, 2000);
      } else {
        showError(result.error || 'Failed to place bet');
      }
    } catch (error) {
      console.error('❌ Error in handlePlaceBet:', error);
      showError('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <>
      {/* Floating Bar */}
      <View style={styles.floatingContainer}>
        <TouchableOpacity
          style={styles.floatingBar}
          onPress={handleFloatingBarPress}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.primary + 'DD']}
            style={styles.floatingBarGradient}
          >
            <View style={styles.floatingBarContent}>
              <View style={styles.floatingBarLeft}>
                <TrueSharpShield size={16} variant="light" />
                <Text style={styles.floatingBarText}>
                  Bet Slip ({totalLegs})
                </Text>
              </View>
              <View style={styles.floatingBarRight}>
                {parlayOdds ? (
                  <Text style={styles.floatingBarOdds}>
                    {formatOdds(parlayOdds)}
                  </Text>
                ) : (
                  <Text style={styles.floatingBarOdds}>
                    {formatOdds(bets[0]?.odds || 0)}
                  </Text>
                )}
                <Ionicons name="chevron-up" size={16} color={theme.colors.text.inverse} />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Full Bet Slip Modal */}
      <Modal
        visible={isFullModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          {/* Error/Success Messages */}
          {errorMessage && (
            <View style={styles.errorToast}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}
          
          {successMessage && (
            <View style={styles.successToast}>
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          )}

          {/* Header */}
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.primary + 'E6']}
            style={styles.modalHeader}
          >
            <View style={styles.modalHeaderContent}>
              <View style={styles.modalHeaderLeft}>
                <TrueSharpShield size={24} variant="light" />
                <Text style={styles.modalTitle}>TrueSharp Bet Slip</Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsFullModalVisible(false)}
              >
                <Ionicons name="close" size={24} color={theme.colors.text.inverse} />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Bets List */}
            <View style={styles.betsSection}>
              <Text style={styles.sectionTitle}>Your Bets ({totalLegs})</Text>
              
              {bets.map(bet => {
                const betInfo = parseBetInfo(bet);
                return (
                  <View key={bet.id} style={styles.betCard}>
                    <View style={styles.betCardContent}>
                      {/* Game Info */}
                      <Text style={styles.gameInfo}>
                        {bet.awayTeam} @ {bet.homeTeam}
                      </Text>

                      {/* Player/Team Name */}
                      <Text style={styles.betTitle}>
                        {betInfo.isPlayerProp ? (
                          <Text style={styles.playerName}>{betInfo.playerOrTeam}</Text>
                        ) : (
                          <Text style={styles.teamName}>{betInfo.playerOrTeam}</Text>
                        )}
                      </Text>

                      {/* Market Info */}
                      <View style={styles.betDetails}>
                        <Text style={styles.marketName}>{betInfo.marketDisplay}</Text>
                        {betInfo.selectionDisplay &&
                          betInfo.selectionDisplay !== betInfo.playerOrTeam && (
                            <>
                              <Text style={styles.detailSeparator}>•</Text>
                              <Text style={styles.selection}>
                                {betInfo.selectionDisplay}
                              </Text>
                            </>
                          )}
                        {bet.line && bet.line !== null && (
                          <>
                            <Text style={styles.detailSeparator}>•</Text>
                            <Text style={styles.line}>
                              Line: {bet.line.toString()}
                            </Text>
                          </>
                        )}
                        <Text style={styles.detailSeparator}>•</Text>
                        <Text style={styles.sportsbook}>{bet.sportsbook}</Text>
                      </View>
                    </View>

                    <View style={styles.betCardRight}>
                      {/* Odds */}
                      <LinearGradient
                        colors={['#3b82f6', '#1d4ed8']}
                        style={styles.oddsContainer}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Text style={styles.odds}>{formatOdds(bet.odds)}</Text>
                      </LinearGradient>

                      {/* Remove Button */}
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => removeBet(bet.id)}
                      >
                        <Ionicons name="close" size={16} color={theme.colors.status.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Wager Section */}
            <View style={styles.wagerSection}>
              <Text style={styles.sectionTitle}>Wager Amount</Text>
              <View style={styles.wagerInputContainer}>
                <Text style={styles.dollarSign}>$</Text>
                <TextInput
                  style={styles.wagerInput}
                  value={wagerAmount?.toString() || '10'}
                  onChangeText={(text) => {
                    // Only allow numbers and decimal point
                    const numericText = text.replace(/[^0-9.]/g, '');
                    // Ensure only one decimal point
                    const parts = numericText.split('.');
                    const cleanText = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : numericText;
                    
                    const numValue = parseFloat(cleanText) || 0;
                    if (numValue <= 10000) {
                      setWagerAmount(numValue);
                    }
                  }}
                  keyboardType="numeric"
                  placeholder="10.00"
                  placeholderTextColor={theme.colors.text.light}
                  maxLength={8}
                />
              </View>
              <Text style={styles.wagerLimits}>Min: $1 • Max: $10,000</Text>
            </View>

            {/* Payout Section */}
            <View style={styles.payoutSection}>
              <View style={styles.payoutCard}>
                <View style={styles.payoutRow}>
                  <Text style={styles.payoutLabel}>Potential Payout</Text>
                  <Text style={styles.payoutValue}>
                    ${(calculatePayout()?.payout || 0).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.payoutRow}>
                  <Text style={styles.profitLabel}>Profit: ${(calculateProfit() || 0).toFixed(2)}</Text>
                  {totalLegs > 1 && parlayOdds && (
                    <View style={styles.parlayOddsContainer}>
                      <Text style={styles.parlayOdds}>
                        {formatOdds(parlayOdds)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionSection}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearAllBets}
              >
                <Ionicons name="trash-outline" size={16} color={theme.colors.text.secondary} />
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.placeBetButton,
                  (wagerAmount < 1 || isPlacingBet) && styles.placeBetButtonDisabled,
                ]}
                onPress={handlePlaceBet}
                disabled={wagerAmount < 1 || isPlacingBet}
              >
                <LinearGradient
                  colors={wagerAmount >= 1 && !isPlacingBet ? [theme.colors.primary, theme.colors.primary + 'DD'] : ['#9ca3af', '#6b7280']}
                  style={styles.placeBetButtonGradient}
                >
                  {isPlacingBet ? (
                    <ActivityIndicator size="small" color={theme.colors.text.inverse} />
                  ) : (
                    <Ionicons name="checkmark" size={16} color={theme.colors.text.inverse} />
                  )}
                  <Text style={styles.placeBetButtonText}>
                    {isPlacingBet ? 'Placing...' : `Place Bet (${wagerAmount >= 1 ? `$${wagerAmount.toFixed(2)}` : ''})`}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Disclaimer */}
            <View style={styles.disclaimerSection}>
              <Text style={styles.disclaimerText}>
                This is a theoretical wager for strategy testing and subscriber sharing purposes only. No real money is wagered.
              </Text>
            </View>

            {/* Bet Count */}
            <Text style={styles.betCount}>{totalLegs}/10 legs</Text>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  // Floating Bar
  floatingContainer: {
    position: 'absolute',
    bottom: 0, // Position flush with bottom
    left: theme.spacing.sm,
    right: theme.spacing.sm,
    zIndex: 9999, // Higher z-index to appear over modals
  },
  floatingBar: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.lg,
  },
  floatingBarGradient: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  floatingBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  floatingBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  floatingBarText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
  },
  floatingBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  floatingBarOdds: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    fontFamily: 'monospace',
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border + '40',
    ...theme.shadows.sm,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  modalTitle: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
  },

  // Bets Section
  betsSection: {
    marginVertical: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  betCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  betCardContent: {
    flex: 1,
  },
  gameInfo: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  betTitle: {
    marginBottom: 2,
  },
  playerName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  teamName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  betDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginTop: 2,
  },
  marketName: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
  },
  detailSeparator: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.light,
  },
  selection: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  line: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: 'monospace',
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
  },
  sportsbook: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  betCardRight: {
    alignItems: 'center',
    gap: theme.spacing.md,
    minWidth: 80,
  },
  oddsContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.sm,
  },
  odds: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.inverse,
    fontFamily: 'monospace',
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.status.error + '15',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.status.error + '30',
  },

  // Wager Section
  wagerSection: {
    marginBottom: theme.spacing.md,
  },
  wagerInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
    marginBottom: theme.spacing.xs,
    ...theme.shadows.sm,
  },
  dollarSign: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
    marginRight: theme.spacing.xs,
  },
  wagerInput: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    fontFamily: 'monospace',
    flex: 1,
  },
  wagerLimits: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },

  // Payout Section
  payoutSection: {
    marginBottom: theme.spacing.md,
  },
  payoutCard: {
    backgroundColor: theme.colors.status.success + '08',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.status.success + '20',
    ...theme.shadows.sm,
  },
  payoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  payoutLabel: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.status.success,
  },
  payoutValue: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.status.success,
    fontFamily: 'monospace',
  },
  profitLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.status.success,
  },
  parlayOddsContainer: {
    backgroundColor: theme.colors.status.success,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  },
  parlayOdds: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.inverse,
    fontFamily: 'monospace',
  },

  // Action Section
  actionSection: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  clearButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.xs,
    ...theme.shadows.sm,
  },
  clearButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
  },
  placeBetButton: {
    flex: 2,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.sm,
  },
  placeBetButtonDisabled: {
    opacity: 0.6,
  },
  placeBetButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  placeBetButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.inverse,
  },

  // Disclaimer
  disclaimerSection: {
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
  },
  disclaimerText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: theme.typography.fontSize.xs * 1.4,
    fontStyle: 'italic',
  },

  // Bet Count
  betCount: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },

  // Error/Success Toasts
  errorToast: {
    position: 'absolute',
    top: 60,
    left: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: theme.colors.status.error,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    zIndex: 10000,
    ...theme.shadows.lg,
  },
  errorText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    textAlign: 'center',
  },
  successToast: {
    position: 'absolute',
    top: 60,
    left: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: theme.colors.status.success,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    zIndex: 10000,
    ...theme.shadows.lg,
  },
  successText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    textAlign: 'center',
  },
});

export default FloatingBetSlip;