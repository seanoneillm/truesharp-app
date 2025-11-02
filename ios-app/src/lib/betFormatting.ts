/**
 * Utility functions for formatting bets to match web app display style
 */

export interface BetData {
  id: string;
  sport: string;
  league?: string;
  home_team?: string;
  away_team?: string;
  bet_type?: string;
  bet_description: string;
  odds: string | number;
  stake?: number;
  potential_payout?: number;
  status: string;
  placed_at?: string;
  game_date?: string;
  sportsbook?: string;
  player_name?: string | null;
  line_value?: number | null;
  side?: string | null;
  prop_type?: string | null;
  bet_source?: string;
  is_parlay?: boolean;
  parlay_id?: string;
  profit?: number;
}

export interface FormattedBet {
  sport: string;
  betType: string;
  sportsbook: string;
  status: string;
  mainDescription: string;
  odds: string;
  stake: string;
  gameDateTime?: string;
  lineDisplay?: string;
  teamsDisplay?: string;
  potentialProfit: number;
  rawBet: BetData;
}

/**
 * Format a bet to match web app display style
 */
export function formatBetForDisplay(bet: BetData): FormattedBet {
  // Extract key information
  const sport = formatSport(bet.sport);
  const betType = formatBetType(bet.bet_type);
  const sportsbook = bet.sportsbook || 'TrueSharp';
  const status = formatStatus(bet.status);

  // Create the main description following web app format
  const mainDescription = createMainDescription(bet);

  // Format odds
  const formattedOdds = formatOdds(bet.odds);

  // Format stake (optional for parlay legs)
  const formattedStake = bet.stake ? `$${bet.stake.toFixed(2)}` : '';

  // Format game date/time
  const gameDateTime = formatGameDateTime(bet.game_date);

  // Format line value
  const lineDisplay = formatLineValue(bet.line_value);

  // Format teams
  const teamsDisplay = formatTeamsDisplay(bet.home_team, bet.away_team);

  // Calculate potential profit (optional for parlay legs)
  const potentialProfit = bet.potential_payout && bet.stake ? bet.potential_payout - bet.stake : 0;

  return {
    sport,
    betType,
    sportsbook,
    status,
    mainDescription,
    odds: formattedOdds,
    stake: formattedStake,
    gameDateTime,
    lineDisplay,
    teamsDisplay,
    potentialProfit,
    rawBet: bet,
  };
}

/**
 * Format sport name to match web app style
 */
function formatSport(sport: string): string {
  const sportMap: { [key: string]: string } = {
    mlb: 'Baseball',
    nfl: 'Football',
    nba: 'Basketball',
    nhl: 'Hockey',
    soccer: 'Soccer',
    ncaaf: 'College Football',
    ncaab: 'College Basketball',
  };

  return (
    sportMap[sport?.toLowerCase()] ||
    sport?.charAt(0).toUpperCase() + sport?.slice(1).toLowerCase() ||
    'Unknown'
  );
}

/**
 * Format bet type to match web app style
 */
function formatBetType(betType?: string): string {
  if (!betType) return 'moneyline';

  const typeMap: { [key: string]: string } = {
    moneyline: 'ML',
    spread: 'Spread',
    total: 'O/U',
    over: 'Over',
    under: 'Under',
    prop: 'Prop',
    player_prop: 'Player Prop',
  };

  return typeMap[betType.toLowerCase()] || betType;
}

/**
 * Format status to match web app style
 */
function formatStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

/**
 * Create main description for bet display
 */
function createMainDescription(bet: BetData): string {
  if (bet.bet_description) {
    return bet.bet_description;
  }

  // Fallback: construct from available data
  if (bet.home_team && bet.away_team) {
    return `${bet.home_team} vs ${bet.away_team}`;
  }

  return 'Unknown Bet';
}

/**
 * Format odds for display
 */
function formatOdds(odds: string | number): string {
  const numOdds = typeof odds === 'string' ? parseFloat(odds) : odds;
  
  if (isNaN(numOdds)) return '+100';
  
  return numOdds > 0 ? `+${numOdds}` : `${numOdds}`;
}

/**
 * Format game date/time for display
 */
function formatGameDateTime(gameDate?: string): string | undefined {
  if (!gameDate) return undefined;

  try {
    const date = new Date(gameDate);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return undefined;
  }
}

/**
 * Format line value for display
 */
function formatLineValue(lineValue?: number | null): string | undefined {
  if (lineValue === null || lineValue === undefined) return undefined;
  
  return lineValue > 0 ? `+${lineValue}` : `${lineValue}`;
}

/**
 * Format teams display (correct sports format: Away @ Home)
 */
function formatTeamsDisplay(homeTeam?: string, awayTeam?: string): string | undefined {
  if (!homeTeam || !awayTeam) return undefined;
  
  return `${awayTeam} @ ${homeTeam}`;
}

/**
 * Public version of formatTeamsDisplay for external use
 */
export function formatTeamsDisplayPublic(homeTeam?: string, awayTeam?: string): string | undefined {
  return formatTeamsDisplay(homeTeam, awayTeam);
}

/**
 * Get display side for bet
 */
export function getDisplaySide(bet: BetData): string | null {
  if (bet.side) return bet.side;
  
  // Try to extract from bet description
  if (bet.bet_description?.includes('Over')) return 'Over';
  if (bet.bet_description?.includes('Under')) return 'Under';
  if (bet.bet_description?.includes(bet.home_team || '')) return 'Home';
  if (bet.bet_description?.includes(bet.away_team || '')) return 'Away';
  
  return null;
}

/**
 * Get profit display based on bet status
 */
export function getProfitDisplay(bet: BetData): string {
  if (bet.status === 'pending') {
    return `$${bet.potential_payout?.toFixed(2) || '0.00'}`;
  }

  if (bet.status === 'won' && bet.profit) {
    return `+$${bet.profit.toFixed(2)}`;
  }

  if (bet.status === 'lost') {
    return `-$${bet.stake?.toFixed(2) || '0.00'}`;
  }

  if (bet.status === 'void') {
    return `$0.00`;
  }

  return `$${bet.stake?.toFixed(2) || '0.00'}`;
}

/**
 * Get two-line bet description formatting
 * Line 1: "Away Team @ Home Team" (correct sports format)
 * Line 2: The bet description (e.g., "Total Over 7.5", "Spread +5.5")
 */
export function getTwoLineBetDescription(bet: BetData): { line1: string; line2: string } {
  // Line 1: Team matchup (Away @ Home - correct sports format)
  const line1 = `${bet.away_team || 'Away Team'} @ ${bet.home_team || 'Home Team'}`;
  
  // Line 2: Bet description (clean, no team names)
  let line2 = '';
  
  if (bet.bet_description) {
    // Clean any team names from bet description if they exist
    let cleanDescription = bet.bet_description;
    if (bet.home_team) {
      cleanDescription = cleanDescription.replace(new RegExp(bet.home_team, 'gi'), '').trim();
    }
    if (bet.away_team) {
      cleanDescription = cleanDescription.replace(new RegExp(bet.away_team, 'gi'), '').trim();
    }
    // Clean up extra spaces and @ symbols
    cleanDescription = cleanDescription.replace(/\s+/g, ' ').replace(/^[@\s]+|[@\s]+$/g, '').trim();
    line2 = cleanDescription;
  } else {
    // Construct bet description from available data without team names
    const lineValue = bet.line_value;
    const side = bet.side;
    
    if (bet.bet_type === 'moneyline') {
      // For moneyline: "Moneyline Team Name" or just "Moneyline"
      const teamName = getTeamNameFromSide(bet);
      line2 = teamName ? `Moneyline ${teamName}` : 'Moneyline';
    } else if (bet.bet_type === 'spread') {
      // For spread: "Spread Team Name +5.5" or "Spread Team Name -3.5"
      const teamName = getTeamNameFromSide(bet);
      const formattedLine = lineValue !== null && lineValue !== undefined ? 
        (lineValue > 0 ? `+${lineValue}` : `${lineValue}`) : '';
      line2 = teamName ? `Spread ${teamName} ${formattedLine}`.trim() : `Spread ${formattedLine}`.trim();
    } else if (bet.bet_type === 'total' || bet.bet_type === 'over' || bet.bet_type === 'under') {
      // For totals: "Total Over 7.5" or "Total Under 215.5" (no sport type)
      const overUnder = side || (bet.bet_type === 'over' ? 'Over' : bet.bet_type === 'under' ? 'Under' : 'Over');
      line2 = `Total ${overUnder} ${lineValue || ''}`.trim();
    } else if (bet.bet_type === 'player_prop' && bet.player_name) {
      // For player props: "Player Name Points Over 25.5" (keep player name for props)
      const overUnder = side || 'Over';
      
      // Parse prop type from oddid if prop_type is null or fallback to 'Points'
      let propType = 'Points';
      
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
      } else if ((bet as any).oddid) {
        // If prop_type is null, parse from oddid
        const oddid = (bet as any).oddid;
        const parts = oddid.split('-');
        if (parts.length > 0) {
          const statPart = parts[0];
          if (statPart === 'touchdowns') propType = 'Touchdowns';
          else if (statPart === 'passing_touchdowns') propType = 'Passing TDs';
          else if (statPart === 'rushing_touchdowns') propType = 'Rushing TDs';
          else if (statPart === 'receiving_touchdowns') propType = 'Receiving TDs';
          else if (statPart === 'passing_yards') propType = 'Passing Yards';
          else if (statPart === 'rushing_yards') propType = 'Rushing Yards';
          else if (statPart === 'receiving_yards') propType = 'Receiving Yards';
          else if (statPart === 'batting_hits') propType = 'Hits';
          else if (statPart === 'batting_homeruns') propType = 'Home Runs';
          else if (statPart === 'batting_rbi') propType = 'RBIs';
          else if (statPart === 'batting_runs') propType = 'Runs';
          else if (statPart === 'batting_totalbases') propType = 'Total Bases';
          else if (statPart === 'batting_stolenbases') propType = 'Stolen Bases';
          else if (statPart === 'pitching_strikeouts') propType = 'Strikeouts';
          else if (statPart === 'rebounds') propType = 'Rebounds';
          else if (statPart === 'assists') propType = 'Assists';
          else if (statPart === 'steals') propType = 'Steals';
          else if (statPart === 'blocks') propType = 'Blocks';
          else if (statPart === 'goals') propType = 'Goals';
          else if (statPart === 'saves') propType = 'Saves';
          else {
            // For other stat types, replace underscores and capitalize
            propType = statPart.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          }
        }
      }
      
      line2 = `${bet.player_name} ${propType} ${overUnder} ${lineValue || ''}`.trim();
    } else {
      // Fallback
      const betType = formatBetType(bet.bet_type);
      line2 = `${betType} ${lineValue ? (lineValue > 0 ? `+${lineValue}` : lineValue) : ''}`.trim();
    }
  }
  
  return {
    line1: line1 || 'Unknown Matchup',
    line2: line2 || 'Unknown Bet'
  };
}

/**
 * Get team name from side (converts home/away to actual team names)
 */
function getTeamNameFromSide(bet: BetData): string | null {
  if (!bet.side) return null;
  
  if (bet.side.toLowerCase() === 'home') {
    return bet.home_team || null;
  } else if (bet.side.toLowerCase() === 'away') {
    return bet.away_team || null;
  }
  
  // For other sides (like Over/Under), return as-is
  return bet.side;
}

/**
 * Get sport-specific total type (e.g., Points, Runs, Goals)
 */
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

/**
 * Get status color for betting status (updated for mobile)
 */
export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'won':
      return '#10B981'; // Green-500 (more vibrant for mobile)
    case 'lost':
      return '#EF4444'; // Red-500 (more vibrant for mobile)
    case 'pending':
      return '#F59E0B'; // Yellow-500 (more visible)
    case 'void':
      return '#8B5CF6'; // Purple-500
    case 'push':
      return '#6B7280'; // Gray-500
    default:
      return '#6B7280'; // Gray-500
  }
}