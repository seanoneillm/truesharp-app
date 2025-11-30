import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../styles/theme';
import { BetData } from '../../services/supabaseAnalytics';
import { getStatusColor, formatTeamsDisplayPublic, parseMultiStatOddid } from '../../lib/betFormatting';
import { formatOddsWithFallback } from '../../utils/oddsCalculation';
import { UnitDisplayOptions, formatCurrencyOrUnits, formatStakeAmount, formatProfitLoss } from '../../utils/unitCalculations';

interface EnhancedBetCardProps {
  bet: BetData;
  onPress?: (betId: string) => void;
  unitOptions?: UnitDisplayOptions;
}

export default function EnhancedBetCard({ bet, onPress, unitOptions }: EnhancedBetCardProps) {
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

  // Format Market + Side + Line (Line 1)
  const formatMarketLine = (): string => {
    // Special handling for SharpSports bets - use parsed bet_description
    if (bet.bet_source === 'sharpsports' && bet.bet_description) {
      return parseSharpSportsBetDescription(bet.bet_description);
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

    // Enhanced handling for TrueSharp/manual bets with proper prop type detection  
    // This MUST come before generic total/prop handling to override default behavior
    const isTrueSharpOrManual = bet.bet_source === 'manual' || 
                                bet.sportsbook === 'TrueSharp' || 
                                (bet as any).odd_source === 'TrueSharp';
    
    if (isTrueSharpOrManual && playerName) {
      // Try to determine prop type from prop_type column first, then oddid, fallback to 'Prop'
      let propType = null;
      
      if (bet.prop_type) {
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
      }
      
      // Always check oddid for multi-stat combinations (takes priority over prop_type)
      if ((bet as any).oddid) {
        const oddid = (bet as any).oddid;
        const parsedFromOddid = parseMultiStatOddid(oddid);
        // Use oddid parsing if it contains multiple stats (indicated by '+' in the result)
        if (parsedFromOddid && parsedFromOddid.includes('+')) {
          propType = parsedFromOddid.replace(/\b\w/g, l => l.toUpperCase());
        } else if (!propType) {
          // Fallback to oddid parsing for single stats only if prop_type is empty
          propType = parsedFromOddid.replace(/\b\w/g, l => l.toUpperCase());
        }
      }
      
      // Final fallback if nothing worked
      if (!propType) {
        propType = 'Prop';
      }
      
      const overUnder = side ? side.toUpperCase() : 'OVER';
      const result = lineValue && (overUnder === 'OVER' || overUnder === 'UNDER') 
        ? `${overUnder} ${lineValue} ${propType}`
        : `${playerName} ${propType}`;
      return result;
    }

    if (betType.toLowerCase() === 'total' || betType.toLowerCase() === 'over' || betType.toLowerCase() === 'under') {
      const overUnder = side ? side.toUpperCase() : (betType.toLowerCase() === 'over' ? 'OVER' : betType.toLowerCase() === 'under' ? 'UNDER' : 'OVER');
      const totalType = getSportTotalType(bet.sport);
      return `${overUnder} ${lineValue || ''} Total ${totalType}`;
    }

    if (betType.toLowerCase().includes('prop') && playerName) {
      const overUnder = side ? side.toUpperCase() : 'OVER';
      const propType = bet.prop_type || 'Points';
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

  // Format Away @ Home (Line 2)
  const formatTeamMatchup = (): string => {
    // Special handling for SharpSports bets - extract matchup from bet_description
    if (bet.bet_source === 'sharpsports' && bet.bet_description) {
      const parts = bet.bet_description.split(' - ');
      if (parts.length >= 2) {
        const matchup = parts[0].trim();
        // Check if it contains " @ " pattern
        if (matchup.includes(' @ ')) {
          return matchup;
        }
      }
    }

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
        return formatTeamsDisplayPublic(bet.home_team, bet.away_team) || '';
      } else {
        // For other cases, show sport/league info
        const sport = bet.sport && bet.sport !== 'unknown' ? bet.sport : bet.league;
        return sport ? `${sport} Game` : '';
      }
    }

    // Default logic for other bet sources
    if (!bet.home_team || !bet.away_team) {
      return ''; // Return empty string if teams are missing
    }
    return formatTeamsDisplayPublic(bet.home_team, bet.away_team) || '';
  };

  // Format game time or placement info (Line 3)
  const formatPlacementInfo = (): string => {
    // Prioritize game_date if available
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
        // Fall back to placed_at if game_date is invalid
      }
    }
    
    // Fall back to placed_at if game_time is not available
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

  const statusColor = getStatusColor(bet.status);
  
  // Calculate profit/payout for display
  const calculateDisplayAmount = () => {
    if (bet.status === 'pending') {
      const potentialProfit = (bet.potential_payout || 0) - (bet.stake || 0);
      return { amount: potentialProfit, label: 'Potential' };
    }
    
    if (bet.status === 'won') {
      const profit = bet.profit !== null && bet.profit !== undefined 
        ? bet.profit 
        : (bet.potential_payout || 0) - (bet.stake || 0);
      return { amount: profit, label: 'Profit' };
    }
    
    if (bet.status === 'lost') {
      return { amount: -(bet.stake || 0), label: 'Loss' };
    }
    
    return { amount: 0, label: 'Amount' };
  };

  const { amount: displayAmount, label: amountLabel } = calculateDisplayAmount();

  // Format status badge text
  const getStatusBadgeText = (): string => {
    switch (bet.status.toLowerCase()) {
      case 'won': return 'W';
      case 'lost': return 'L';
      case 'pending': return 'P';
      case 'void': return 'V';
      case 'push': return 'T';
      default: return bet.status.charAt(0).toUpperCase();
    }
  };

  // Get border color based on status
  const getBorderStyle = () => {
    if (bet.status === 'pending') return {};
    
    return {
      borderLeftWidth: 3,
      borderLeftColor: bet.status === 'won' ? theme.colors.status.success : 
                       bet.status === 'lost' ? theme.colors.status.error : 
                       theme.colors.text.light
    };
  };

  return (
    <TouchableOpacity 
      style={[styles.betCard, getBorderStyle()]}
      onPress={() => onPress?.(bet.id)}
      disabled={!onPress}
    >
      <View style={styles.cardContent}>
        {/* Left Side - 3 Lines of Text */}
        <View style={styles.leftContent}>
          {/* Line 1: Market + Side + Line (Bold and prominent) */}
          <Text style={styles.marketLine} numberOfLines={1}>
            {formatMarketLine()}
          </Text>
          
          {/* Line 2: Away Team @ Home Team (Smaller and lighter) */}
          <Text style={styles.teamMatchup} numberOfLines={1}>
            {formatTeamMatchup()}
          </Text>
          
          {/* Line 3: Timestamp or placement info (Subtle, secondary) */}
          <Text style={styles.placementInfo} numberOfLines={1}>
            {formatPlacementInfo()}
          </Text>
        </View>

        {/* Right Side - Odds, Wager, Payout/Profit, Status */}
        <View style={styles.rightContent}>
          {bet.status === 'pending' ? (
            // For pending bets: show odds with status badge
            <>
              <View style={styles.rightRow}>
                {/* Odds */}
                <Text style={styles.odds}>
                  {formatOdds(bet.odds, bet.stake, bet.potential_payout)}
                </Text>
                
                {/* Status Badge for pending only */}
                <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                  <Text style={styles.statusText}>
                    {getStatusBadgeText()}
                  </Text>
                </View>
              </View>
              
              {/* Pending bet info */}
              <View style={styles.pendingBetInfo}>
                <Text style={styles.wager}>
                  Stake: {formatAmount(bet.stake || 0)}
                </Text>
                <Text style={[styles.payout, { color: statusColor }]}>
                  To Win: {formatAmount(displayAmount, true)}
                </Text>
              </View>
            </>
          ) : (
            // For settled bets: clean layout without badge
            <>
              <View style={styles.settledRightRow}>
                <Text style={styles.odds}>
                  {formatOdds(bet.odds, bet.stake, bet.potential_payout)}
                </Text>
              </View>
              
              <View style={styles.settledBetInfo}>
                <Text style={[styles.profitOnly, { 
                  color: bet.status === 'won' ? theme.colors.status.success : 
                         bet.status === 'lost' ? theme.colors.status.error : 
                         theme.colors.text.secondary 
                }]}>
                  {formatAmount(displayAmount, true)}
                </Text>
              </View>
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// Helper function to get sport-specific total type
function getSportTotalType(sport: string): string {
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
}

const styles = StyleSheet.create({
  betCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
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
});