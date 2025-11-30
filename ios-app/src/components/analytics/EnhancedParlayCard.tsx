import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { ParlayGroup } from '../../services/parlayGrouping';
import { getStatusColor, parseMultiStatOddid } from '../../lib/betFormatting';
import { formatOddsWithFallback } from '../../utils/oddsCalculation';
import { UnitDisplayOptions, formatCurrencyOrUnits, formatStakeAmount, formatProfitLoss } from '../../utils/unitCalculations';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager?.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface EnhancedParlayCardProps {
  parlay: ParlayGroup;
  onPress?: (betId: string) => void;
  unitOptions?: UnitDisplayOptions;
}

export default function EnhancedParlayCard({ parlay, onPress, unitOptions }: EnhancedParlayCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const toggleExpanded = () => {
    LayoutAnimation.configureNext({
      duration: 300,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
    });
    setIsExpanded(!isExpanded);
  };

  const handleParlayPress = () => {
    // If there's an onPress handler, use it for bet details
    if (onPress) {
      onPress(parlay.parlay_id);
    } else {
      // Otherwise, just toggle expansion
      toggleExpanded();
    }
  };

  // Format currency based on unit options  
  const formatAmount = (amount: number, isProfit = false) => {
    if (!unitOptions) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    }
    
    // Convert dollars to cents for unit calculations
    const amountInCents = Math.round(amount * 100);
    return isProfit ? formatProfitLoss(amountInCents, unitOptions) : formatStakeAmount(amountInCents, unitOptions);
  };

  const formatOdds = (odds: string | number, stake?: number, potentialPayout?: number) => {
    if (odds === undefined || odds === null) return '0';
    const numericOdds = typeof odds === 'string' ? parseFloat(odds) : odds;
    return formatOddsWithFallback(numericOdds, stake, potentialPayout);
  };

  // Parse SharpSports bet_description to extract bet details
  const parseSharpSportsBetDescription = (description: string): string => {
    // Format: "Away Team @ Home Team - [Bet Details]"
    // Split on first " - " to separate matchup from bet details
    const parts = description.split(' - ');
    if (parts.length < 2) {
      return description; // Return as-is if format doesn't match
    }

    // Extract bet details (everything after first " - ")
    const betDetails = parts.slice(1).join(' - ');
    
    // Apply reordering rules for better readability
    return reorderBetDetails(betDetails);
  };

  // Reorder bet details for natural phrasing
  const reorderBetDetails = (details: string): string => {
    // Rule 1: "Moneyline - [Team]" → "[Team] Moneyline"
    const moneylineMatch = details.match(/^Moneyline - (.+)$/);
    if (moneylineMatch) {
      return `${moneylineMatch[1]} Moneyline`;
    }

    // Rule 2: "To Hit A Home Run - [Player]" → "[Player] To Hit A Home Run"
    const homeRunMatch = details.match(/^To Hit A Home Run - (.+)$/);
    if (homeRunMatch) {
      return `${homeRunMatch[1]} To Hit A Home Run`;
    }

    // Rule 3: General pattern "[Market] - [Entity]" → "[Entity] [Market]"
    const generalMatch = details.match(/^([^-]+) - (.+)$/);
    if (generalMatch) {
      const market = generalMatch[1].trim();
      const entity = generalMatch[2].trim();
      
      // Check if this looks like a market that should be reordered
      const marketKeywords = ['to hit', 'to score', 'to record', 'moneyline', 'spread', 'total'];
      const shouldReorder = marketKeywords.some(keyword => 
        market.toLowerCase().includes(keyword)
      );
      
      if (shouldReorder) {
        return `${entity} ${market}`;
      }
    }

    // Return as-is if no reordering rules apply
    return details;
  };

  // Format parlay description (Line 1)
  const formatParlayDescription = (): string => {
    const legCount = parlay.legs.length;
    return `${legCount}-Leg Parlay`;
  };

  // Format sport/league info (Line 2)
  const formatSportInfo = (): string => {
    const sports = [...new Set(parlay.legs.map(leg => leg.sport))].filter(Boolean);
    return sports.join(', ') || '';
  };

  // Format placement info (Line 3)
  const formatPlacementInfo = (): string => {
    // Try to find the earliest game_date from parlay legs
    const legGameDates = parlay.legs
      .map(leg => leg.game_date)
      .filter(Boolean)
      .sort();
    
    if (legGameDates.length > 0) {
      try {
        const date = new Date(legGameDates[0]!);
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      } catch {
        // Fall back to placed_at if game_date is invalid
      }
    }
    
    // Fall back to placed_at if no game_time is available
    if (parlay.placed_at) {
      try {
        const date = new Date(parlay.placed_at);
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
    
    return `${parlay.legs.length} legs • ${parlay.sport}`;
  };

  const statusColor = getStatusColor(parlay.status);
  
  // Calculate profit/payout for display
  const calculateDisplayAmount = () => {
    if (parlay.status === 'pending') {
      // For pending parlays, show potential payout (not profit)
      return { amount: parlay.potential_payout || 0, label: 'To Win' };
    }
    
    if (parlay.status === 'won') {
      return { amount: parlay.profit || 0, label: 'Won' };
    }
    
    if (parlay.status === 'lost') {
      return { amount: -(parlay.stake || 0), label: 'Lost' };
    }
    
    return { amount: 0, label: 'Amount' };
  };

  const { amount: displayAmount, label: amountLabel } = calculateDisplayAmount();

  // Format status badge text
  const getStatusBadgeText = (): string => {
    switch (parlay.status.toLowerCase()) {
      case 'won': return 'W';
      case 'lost': return 'L';
      case 'pending': return 'P';
      case 'void': return 'V';
      case 'push': return 'T';
      default: return parlay.status.charAt(0).toUpperCase();
    }
  };

  // Format individual leg market line
  const formatLegMarketLine = (leg: any): string => {
    // Special handling for SharpSports legs - use parsed bet_description
    if (leg.bet_source === 'sharpsports' && leg.bet_description) {
      return parseSharpSportsBetDescription(leg.bet_description);
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
      
      // Parse prop type from oddid if prop_type is null or fallback to 'Points'
      let propType = 'Points';
      
      if (leg.prop_type) {
        // Convert prop_type from database format to display format
        const propTypeStr = leg.prop_type.toString();
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
      }
      
      // Always check oddid for multi-stat combinations (takes priority)
      if ((leg as any).oddid) {
        const oddid = (leg as any).oddid;
        const parsedFromOddid = parseMultiStatOddid(oddid);
        // Use oddid parsing if it contains multiple stats (indicated by '+' in the result)
        if (parsedFromOddid && parsedFromOddid.includes('+')) {
          propType = parsedFromOddid.replace(/\b\w/g, l => l.toUpperCase());
        } else if (!propType) {
          // Fallback to oddid parsing for single stats only if prop_type is empty
          propType = parsedFromOddid.replace(/\b\w/g, l => l.toUpperCase());
        }
      }
      
      return `${playerName} ${propType} ${overUnder} ${lineValue || ''}`;
    }

    // Only use bet_description parsing for complex cases where structured data isn't sufficient
    if (leg.bet_description && (!betType || betType === 'Unknown')) {
      const description = leg.bet_description.toLowerCase();
      
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
      return leg.bet_description
        .replace(/\b(over|under)\b/gi, (match) => match.toUpperCase())
        .replace(/\b\w/g, (match) => match.toUpperCase());
    }

    // Final fallback
    return leg.bet_description || `${betType} ${lineValue || ''}`;
  };

  const formatLegTeamMatchup = (leg: any): string => {
    // Special handling for SharpSports legs - extract matchup from bet_description
    if (leg.bet_source === 'sharpsports' && leg.bet_description) {
      const parts = leg.bet_description.split(' - ');
      if (parts.length >= 2) {
        const matchup = parts[0].trim();
        // Check if it contains " @ " pattern
        if (matchup.includes(' @ ')) {
          return matchup;
        }
      }
    }

    // Default logic for other bet sources
    if (!leg.home_team || !leg.away_team) {
      return ''; // Return empty string if teams are missing
    }
    return `${leg.away_team} @ ${leg.home_team}`;
  };

  // Get border color based on status
  const getBorderStyle = () => {
    if (parlay.status === 'pending') return {};
    
    return {
      borderLeftWidth: 3,
      borderLeftColor: parlay.status === 'won' ? theme.colors.status.success : 
                       parlay.status === 'lost' ? theme.colors.status.error : 
                       theme.colors.text.light
    };
  };

  return (
    <View style={[styles.container, getBorderStyle()]}>
      {/* Main Parlay Card */}
      <TouchableOpacity style={styles.betCard} onPress={handleParlayPress} activeOpacity={0.7}>
        <View style={styles.cardContent}>
          {/* Left Side - 3 Lines of Text */}
          <View style={styles.leftContent}>
            {/* Line 1: Parlay Description (Bold and prominent) */}
            <Text style={styles.marketLine} numberOfLines={1}>
              {formatParlayDescription()}
            </Text>
            
            {/* Line 2: Sport Info (Smaller and lighter) */}
            <Text style={styles.teamMatchup} numberOfLines={1}>
              {formatSportInfo()}
            </Text>
            
            {/* Line 3: Timestamp or placement info (Subtle, secondary) */}
            <Text style={styles.placementInfo} numberOfLines={1}>
              {formatPlacementInfo()}
            </Text>
          </View>

          {/* Right Side - Odds, Wager, Payout/Profit, Status */}
          <View style={styles.rightContent}>
            {parlay.status === 'pending' ? (
              // For pending parlays: show odds with status badge
              <>
                <View style={styles.rightRow}>
                  {/* Odds */}
                  <Text style={styles.odds}>
                    {formatOdds(parlay.odds, parlay.stake, parlay.potential_payout)}
                  </Text>
                  
                  {/* Status Badge for pending only */}
                  <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                    <Text style={styles.statusText}>
                      {getStatusBadgeText()}
                    </Text>
                  </View>
                </View>
                
                {/* Pending parlay info */}
                <View style={styles.pendingBetInfo}>
                  <Text style={styles.wager}>
                    Stake: {formatAmount(parlay.stake || 0)}
                  </Text>
                  <Text style={[styles.payout, { color: statusColor }]}>
                    {amountLabel}: {formatAmount(displayAmount, true)}
                  </Text>
                </View>
              </>
            ) : (
              // For settled parlays: clean layout without badge
              <>
                <View style={styles.settledRightRow}>
                  <Text style={styles.odds}>
                    {formatOdds(parlay.odds, parlay.stake, parlay.potential_payout)}
                  </Text>
                </View>
                
                <View style={styles.settledBetInfo}>
                  <Text style={[styles.profitOnly, { 
                    color: parlay.status === 'won' ? theme.colors.status.success : 
                           parlay.status === 'lost' ? theme.colors.status.error : 
                           theme.colors.text.secondary 
                  }]}>
                    {formatAmount(displayAmount, true)}
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Expand/Collapse Icon */}
          <TouchableOpacity 
            style={styles.expandIcon}
            onPress={toggleExpanded}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={theme.colors.text.secondary} 
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* Expanded Legs Section */}
      {isExpanded && (
        <View style={styles.legsContainer}>
          <View style={styles.legsHeader}>
            <Text style={styles.legsHeaderText}>Parlay Legs ({parlay.legs.length})</Text>
          </View>
          
          {parlay.legs.map((leg, index) => {
            const legStatusColor = getStatusColor(leg.status);
            
            return (
              <View key={leg.id} style={styles.legRow}>
                {/* Leg Number */}
                <View style={styles.legNumber}>
                  <Text style={styles.legNumberText}>{index + 1}</Text>
                </View>
                
                {/* Leg Content - Following same 3-line structure */}
                <View style={styles.legLeftContent}>
                  <Text style={styles.legMarketLine} numberOfLines={1}>
                    {formatLegMarketLine(leg)}
                  </Text>
                  <Text style={styles.legTeamMatchup} numberOfLines={1}>
                    {formatLegTeamMatchup(leg)}
                  </Text>
                  <Text style={styles.legInfo} numberOfLines={1}>
                    {leg.bet_type || 'Unknown'} • {leg.league || leg.sport || 'Unknown'}
                  </Text>
                </View>

                {/* Leg Right Content */}
                <View style={styles.legRightContent}>
                  <Text style={styles.legOdds}>
                    {formatOdds(leg.odds, leg.stake, leg.potential_payout)}
                  </Text>
                  <View style={[styles.legStatusBadge, { backgroundColor: legStatusColor }]}>
                    <Text style={styles.legStatusText}>
                      {leg.status === 'won' ? 'W' : 
                       leg.status === 'lost' ? 'L' : 
                       leg.status === 'pending' ? 'P' : 
                       leg.status.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}

          {/* Parlay Totals */}
          <View style={styles.parlayTotals}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Odds:</Text>
              <Text style={styles.totalValue}>{formatOdds(parlay.odds, parlay.stake, parlay.potential_payout)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Stake:</Text>
              <Text style={styles.totalValue}>{formatAmount(parlay.stake || 0)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Potential Payout:</Text>
              <Text style={styles.totalValue}>{formatAmount(parlay.potential_payout || 0, true)}</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.card,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
    overflow: 'hidden',
  },
  betCard: {
    // No additional styles needed
  },
  cardContent: {
    flexDirection: 'row',
    padding: theme.spacing.sm,
    alignItems: 'center',
    minHeight: 60,
  },
  leftContent: {
    flex: 1,
    marginRight: theme.spacing.sm,
    justifyContent: 'space-between',
    minHeight: 45,
  },
  marketLine: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: 3,
    lineHeight: 17,
  },
  teamMatchup: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
    marginBottom: 2,
    lineHeight: 15,
  },
  placementInfo: {
    fontSize: 10,
    fontWeight: theme.typography.fontWeight.normal,
    color: theme.colors.text.light,
    lineHeight: 13,
  },
  rightContent: {
    justifyContent: 'space-between',
    minHeight: 45,
    minWidth: 90,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  settledRightRow: {
    alignItems: 'flex-end',
    marginBottom: 3,
  },
  pendingBetInfo: {
    alignItems: 'flex-end',
    gap: 2,
  },
  settledBetInfo: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  odds: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  wager: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
  },
  payout: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
  },
  profitOnly: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    textAlign: 'right',
  },
  statusBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 9,
    fontWeight: theme.typography.fontWeight.bold,
    color: 'white',
  },
  expandIcon: {
    marginLeft: theme.spacing.sm,
    justifyContent: 'center',
  },
  
  // Expanded legs styles
  legsContainer: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  legsHeader: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  legsHeaderText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  legRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    minHeight: 50,
  },
  legNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
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
  legLeftContent: {
    flex: 1,
    marginRight: theme.spacing.sm,
    justifyContent: 'space-between',
    minHeight: 36,
  },
  legMarketLine: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: 1,
    lineHeight: 15,
  },
  legTeamMatchup: {
    fontSize: 10,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
    marginBottom: 1,
    lineHeight: 13,
  },
  legInfo: {
    fontSize: 9,
    color: theme.colors.text.light,
    lineHeight: 11,
  },
  legRightContent: {
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 36,
  },
  legOdds: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: 3,
  },
  legStatusBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legStatusText: {
    fontSize: 9,
    fontWeight: theme.typography.fontWeight.bold,
    color: 'white',
  },
  parlayTotals: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  totalLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
  },
  totalValue: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
});