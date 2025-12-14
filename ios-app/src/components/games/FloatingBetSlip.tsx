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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../styles/theme';
import { useBetSlip, BetSlipBet } from '../../contexts/BetSlipContext';
import TrueSharpShield from '../common/TrueSharpShield';
import { formatOddsWithFallback } from '../../utils/oddsCalculation';
import { formatTeamsDisplayPublic } from '../../lib/betFormatting';
import { Image } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

// Format odds helper using the same logic as EnhancedBetCard
const formatOdds = (odds: number, stake?: number, potentialPayout?: number): string => {
  if (!isFinite(odds)) {
    return '+100'; // Default fallback for infinity
  }
  return formatOddsWithFallback(odds, stake, potentialPayout);
};

// Format Market + Side + Line using EnhancedBetCard logic
const formatMarketLine = (bet: BetSlipBet): string => {
  // Create a synthetic bet object that matches the structure expected by the formatting logic
  const betType = bet.marketType?.includes('-ml-') ? 'moneyline' : 
                  bet.marketType?.includes('-sp-') ? 'spread' : 
                  bet.marketType?.includes('-ou-') ? 'total' : 'prop';
  const side = bet.selection?.toLowerCase();
  const lineValue = bet.line;
  const playerName = extractPlayerName(bet.marketType || '');

  if (betType === 'moneyline') {
    const teamName = side === 'home' ? bet.homeTeam : side === 'away' ? bet.awayTeam : bet.selection;
    return `${teamName || 'Team'} Moneyline`;
  }

  if (betType === 'spread') {
    const teamName = side === 'home' ? bet.homeTeam : side === 'away' ? bet.awayTeam : bet.selection;
    const formattedLine = lineValue !== null && lineValue !== undefined ? 
      (lineValue > 0 ? `+${lineValue}` : `${lineValue}`) : '';
    return `${teamName || 'Team'} ${formattedLine}`;
  }

  if (playerName) {
    let propType = extractPropType(bet.marketType || '');
    if (!propType) propType = 'Prop';
    
    const overUnder = side?.toUpperCase() || 'OVER';
    return lineValue && (overUnder === 'OVER' || overUnder === 'UNDER') 
      ? `${overUnder} ${lineValue} ${propType}`
      : `${playerName} ${propType}`;
  }

  if (betType === 'total') {
    const overUnder = side?.toUpperCase() || 'OVER';
    const totalType = getSportTotalType(bet.sport || '');
    return `${overUnder} ${lineValue || ''} ${totalType}`;
  }

  // Fallback
  return bet.selection || 'Bet';
};

// Helper function to extract player name from market type
const extractPlayerName = (marketType: string): string | null => {
  const nameMatch = marketType.match(/-([A-Z_]+_[A-Z_]+)_1_[A-Z]+-game/);
  if (nameMatch && nameMatch[1]) {
    return nameMatch[1]
      .split('_')
      .map(part => part.charAt(0) + part.slice(1).toLowerCase())
      .join(' ');
  }
  return null;
};

// Helper function to extract prop type from market type
const extractPropType = (marketType: string): string => {
  const lowerMarketType = marketType.toLowerCase();
  if (lowerMarketType.includes('batting_hits')) return 'Hits';
  if (lowerMarketType.includes('batting_homeruns') || lowerMarketType.includes('batting_homerun')) return 'Home Runs';
  if (lowerMarketType.includes('batting_rbi')) return 'RBIs';
  if (lowerMarketType.includes('batting_runs')) return 'Runs';
  if (lowerMarketType.includes('batting_totalbases')) return 'Total Bases';
  if (lowerMarketType.includes('pitching_strikeouts')) return 'Strikeouts';
  if (lowerMarketType.includes('pitching_hits')) return 'Hits Allowed';
  if (lowerMarketType.includes('passing_yards')) return 'Passing Yards';
  if (lowerMarketType.includes('rushing_yards')) return 'Rushing Yards';
  if (lowerMarketType.includes('receiving_yards')) return 'Receiving Yards';
  if (lowerMarketType.includes('passing_touchdowns')) return 'Passing TDs';
  if (lowerMarketType.includes('rushing_touchdowns')) return 'Rushing TDs';
  if (lowerMarketType.includes('receiving_touchdowns')) return 'Receiving TDs';
  if (lowerMarketType.includes('points') && !lowerMarketType.includes('team')) return 'Points';
  if (lowerMarketType.includes('rebounds')) return 'Rebounds';
  if (lowerMarketType.includes('assists')) return 'Assists';
  if (lowerMarketType.includes('goals')) return 'Goals';
  if (lowerMarketType.includes('saves')) return 'Saves';
  return 'Prop';
};

// Helper function to get sport-specific total type
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

// Format team matchup
const formatTeamMatchup = (bet: BetSlipBet): string => {
  if (!bet.homeTeam || !bet.awayTeam) {
    return '';
  }
  return formatTeamsDisplayPublic(bet.homeTeam, bet.awayTeam) || '';
};

// Format sportsbook info
const formatBetInfo = (bet: BetSlipBet): string => {
  return bet.sportsbook || 'TrueSharp';
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
  const insets = useSafeAreaInsets();

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
      {/* Tongue-Style Bet Slip Button */}
      <View style={[styles.tongueContainer, { bottom: -30 }]}>
        <TouchableOpacity
          style={styles.tongueButton}
          onPress={handleFloatingBarPress}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[theme.colors.primary, '#1e40af', '#0f172a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.tongueGradient}
          >
            <View style={styles.tongueContent}>
              <View style={styles.tongueLeft}>
                <Image 
                  source={require('../../assets/truesharp-logo.png')} 
                  style={styles.tongueLogo}
                  resizeMode="contain"
                />
                <Text style={styles.tongueText}>
                  Bet Slip ({totalLegs})
                </Text>
              </View>
              <View style={styles.tongueRight}>
                {parlayOdds ? (
                  <Text style={styles.tongueOdds}>
                    {formatOdds(parlayOdds)}
                  </Text>
                ) : (
                  <Text style={styles.tongueOdds}>
                    {formatOdds(bets[0]?.odds || 0)}
                  </Text>
                )}
                <Ionicons name="chevron-up" size={14} color={theme.colors.text.inverse} />
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

          {/* Enhanced Modal Header with gradient like BetDetailsModal */}
          <LinearGradient
            colors={[theme.colors.primary, '#1e40af', '#0f172a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.modalHeader}
          >
            <TouchableOpacity 
              onPress={() => setIsFullModalVisible(false)} 
              style={styles.closeButtonNew}
            >
              <View style={styles.closeButtonContainer}>
                <Ionicons name="close" size={22} color="white" />
              </View>
            </TouchableOpacity>
            
            <View style={styles.headerCenter}>
              <View style={styles.headerContent}>
                <Image 
                  source={require('../../assets/truesharp-logo.png')} 
                  style={styles.headerLogo}
                  resizeMode="contain"
                />
                <View style={styles.titleContainer}>
                  <Text style={styles.modalTitleNew}>Bet Slip</Text>
                  <Text style={styles.modalSubtitle}>TrueSharp Betting</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.headerSpacer} />
          </LinearGradient>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Bets List */}
            <View style={styles.betsContainer}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderContent}>
                  <View style={styles.sectionIconContainer}>
                    <Ionicons name="receipt" size={18} color={theme.colors.primary} />
                  </View>
                  <Text style={styles.sectionTitle}>Your Bets ({totalLegs})</Text>
                </View>
              </View>
              
              <View style={styles.betsContent}>
                {bets.map((bet, index) => {
                  return (
                    <View key={bet.id} style={[styles.betCard, index === bets.length - 1 && { borderBottomWidth: 0 }]}>
                      {/* Left Side - Bet Information */}
                      <View style={styles.betLeft}>
                        <Text style={styles.betDescription} numberOfLines={1}>
                          {formatMarketLine(bet)}
                        </Text>
                        <Text style={styles.betMatchup} numberOfLines={1}>
                          {formatTeamMatchup(bet)}
                        </Text>
                        <Text style={styles.betSportsbook} numberOfLines={1}>
                          {formatBetInfo(bet)}
                        </Text>
                      </View>

                      {/* Right Side - Odds and Remove */}
                      <View style={styles.betRight}>
                        <View style={styles.oddsContainer}>
                          <Text style={styles.odds}>
                            {formatOdds(bet.odds, wagerAmount, calculatePayout().payout)}
                          </Text>
                        </View>
                        
                        <TouchableOpacity
                          style={styles.removeButton}
                          onPress={() => removeBet(bet.id)}
                        >
                          <Ionicons name="close" size={14} color={theme.colors.status.error} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Wager Input */}
            <View style={styles.wagerContainer}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderContent}>
                  <View style={styles.sectionIconContainer}>
                    <Ionicons name="wallet" size={18} color={theme.colors.primary} />
                  </View>
                  <Text style={styles.sectionTitle}>Wager Amount</Text>
                </View>
              </View>
              <View style={styles.wagerInput}>
                <Text style={styles.dollarSign}>$</Text>
                <TextInput
                  style={styles.wagerField}
                  value={wagerAmount?.toString() || '10'}
                  onChangeText={(text) => {
                    const numericText = text.replace(/[^0-9.]/g, '');
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

            {/* Payout Summary */}
            <View style={styles.payoutContainer}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderContent}>
                  <View style={styles.sectionIconContainer}>
                    <Ionicons name="trending-up" size={18} color={theme.colors.primary} />
                  </View>
                  <Text style={styles.sectionTitle}>Payout Summary</Text>
                </View>
              </View>
              <View style={styles.payoutContent}>
                <View style={styles.payoutRow}>
                  <Text style={styles.payoutLabel}>Potential Payout</Text>
                  <Text style={styles.payoutValue}>
                    ${(calculatePayout()?.payout || 0).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.payoutRow}>
                  <Text style={styles.profitLabel}>Potential Profit</Text>
                  <Text style={styles.profitValue}>
                    ${(calculateProfit() || 0).toFixed(2)}
                  </Text>
                </View>
                {totalLegs > 1 && parlayOdds && (
                  <View style={styles.payoutRow}>
                    <Text style={styles.parlayLabel}>Parlay Odds</Text>
                    <Text style={styles.parlayValue}>
                      {formatOdds(parlayOdds)}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity style={styles.clearButton} onPress={clearAllBets}>
                <Ionicons name="trash-outline" size={16} color={theme.colors.text.secondary} />
                <Text style={styles.clearButtonText}>Clear</Text>
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
                  style={styles.placeBetGradient}
                >
                  {isPlacingBet ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.placeBetText}>
                      {wagerAmount >= 1 ? `Place Bet ($${wagerAmount.toFixed(2)})` : 'Place Bet'}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.disclaimerText}>
                This is a theoretical wager for strategy testing purposes only.
              </Text>
              <Text style={styles.betCount}>{totalLegs}/10 legs</Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  // Tongue-Style Bet Slip Button
  tongueContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
    margin: 0,
    padding: 0,
  },
  tongueButton: {
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: 'hidden',
    margin: 0,
    marginBottom: -30,
    paddingBottom: 30,
  },
  tongueGradient: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  tongueContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tongueLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  tongueLogo: {
    width: 24,
    height: 24,
  },
  tongueText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '700',
  },
  tongueRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  tongueOdds: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSize.base,
    fontWeight: '700',
    fontFamily: 'monospace',
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  headerLogo: {
    width: 40,
    height: 40,
  },
  headerSpacer: {
    width: 44,
  },
  titleContainer: {
    alignItems: 'center',
  },
  modalTitleNew: {
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
  closeButtonNew: {
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
  modalContent: {
    flex: 1,
    padding: theme.spacing.sm,
  },

  // Sections
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
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
  
  // Bets Container
  betsContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },

  // Bet Cards
  betsContent: {
    paddingTop: 2,
  },
  betCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  betLeft: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  betDescription: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  betMatchup: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: 2,
  },
  betSportsbook: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.light,
  },
  betRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },

  oddsContainer: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    minWidth: 60,
    alignItems: 'center',
  },
  odds: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '700',
    color: 'white',
  },

  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  // Wager Section
  wagerContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  wagerInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  dollarSign: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.primary,
    marginRight: theme.spacing.xs,
  },
  wagerField: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.text.primary,
    flex: 1,
  },
  wagerLimits: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },

  // Payout Section
  payoutContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  payoutContent: {
    paddingTop: 2,
  },
  payoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  payoutLabel: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  payoutValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.status.success,
  },
  profitLabel: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  profitValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.status.success,
  },
  parlayLabel: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  parlayValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.primary,
  },

  // Actions
  actionsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.status.error,
    gap: theme.spacing.xs,
  },
  clearButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
    color: theme.colors.status.error,
  },
  placeBetButton: {
    flex: 1,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.sm,
  },
  placeBetButtonDisabled: {
    opacity: 0.6,
  },
  placeBetGradient: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeBetText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '700',
    color: 'white',
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  disclaimerText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.light,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: theme.spacing.sm,
  },
  betCount: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: '500',
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