import { createClient } from '@/lib/supabase';
import { DatabaseOdds } from '@/lib/types/database';

// TypeScript helpers for parsing and normalization
function toNumber(n: unknown): number | null {
  if (n === null || n === undefined) return null;
  const x = typeof n === "number" ? n : parseFloat(String(n));
  return Number.isFinite(x) ? x : null;
}

// Regex for parsing O/U oddIDs only
const OURE = /^([a-zA-Z+_]+)-([a-zA-Z0-9_]+)-([a-zA-Z0-9_]+)-ou-(over|under)$/;

type ParsedOddId = {
  metric: string;
  subject: string;
  scope: string;
  side: "over" | "under";
};

export function parseOddId(oddId: string): ParsedOddId | null {
  const m = oddId.match(OURE);
  if (!m) return null;
  const [, metric, subject, scope, side] = m;
  return { metric, subject, scope, side: side as "over" | "under" };
}

type NormalizedOUOdd = {
  gameId: string;
  league: string;
  row1: string;                   // main tab
  row2: string;                   // subtab
  row3: string;                   // sub-subtab (market label)
  entityType: "player" | "team" | "game";
  entityId?: string;              // playerId or "home"/"away"/"all"
  entityLabel: string;            // "Mac Jones", "Home Team Total", etc.
  side: "over" | "under";
  line: number;                   // from `line`
  price: number;                  // from `bookodds` (American)
  oddId: string;                  // original oddID
};

function subjectToEntity(subject: string): { entityType: "player" | "team" | "game"; entityId?: string } {
  if (subject === "all") return { entityType: "game" };
  if (subject === "home" || subject === "away") return { entityType: "team", entityId: subject };
  return { entityType: "player", entityId: subject }; // playerId
}

// League-specific metric maps for O/U markets (based on games-page.md)
const MLB_OU_MAP: Record<string, {
  row1: string;
  row2: string;
  row3: string;
  subjectToLabel?: (subj: string) => string;
}> = {
  // Game/Team totals → Main Lines
  "points": {
    row1: "Main Lines",
    row2: "Totals",
    row3: "Total Points",
    subjectToLabel: (subj: string) =>
      subj === "all" ? "Game Total" :
      subj === "home" ? "Home Team Total" :
      subj === "away" ? "Away Team Total" : "Total",
  },
  
  // Player props → Player Props → Position group → Market
  "batting_hits": { row1: "Player Props", row2: "Hitters", row3: "Hits" },
  "batting_homeRuns": { row1: "Player Props", row2: "Hitters", row3: "Home Runs" },
  "batting_RBI": { row1: "Player Props", row2: "Hitters", row3: "RBIs" },
  "batting_totalBases": { row1: "Player Props", row2: "Hitters", row3: "Total Bases" },
  "batting_singles": { row1: "Player Props", row2: "Hitters", row3: "Singles" },
  "batting_doubles": { row1: "Player Props", row2: "Hitters", row3: "Doubles" },
  "batting_triples": { row1: "Player Props", row2: "Hitters", row3: "Triples" },
  "batting_stolenBases": { row1: "Player Props", row2: "Hitters", row3: "Stolen Bases" },
  "batting_strikeouts": { row1: "Player Props", row2: "Hitters", row3: "Strikeouts" },
  "batting_basesOnBalls": { row1: "Player Props", row2: "Hitters", row3: "Walks" },
  "batting_hits+runs+rbi": { row1: "Player Props", row2: "Hitters", row3: "Hits + Runs + RBIs" },
  "fantasyScore": { row1: "Player Props", row2: "Hitters", row3: "Fantasy Score" },
  
  // Pitchers
  "pitching_strikeouts": { row1: "Player Props", row2: "Pitchers", row3: "Strikeouts" },
  "pitching_hits": { row1: "Player Props", row2: "Pitchers", row3: "Hits Allowed" },
  "pitching_earnedRuns": { row1: "Player Props", row2: "Pitchers", row3: "Earned Runs" },
  "pitching_basesOnBalls": { row1: "Player Props", row2: "Pitchers", row3: "Walks Allowed" },
  "pitching_homeRunsAllowed": { row1: "Player Props", row2: "Pitchers", row3: "HRs Allowed" },
  "pitching_pitchesThrown": { row1: "Player Props", row2: "Pitchers", row3: "Pitches Thrown" },
  "pitching_outs": { row1: "Player Props", row2: "Pitchers", row3: "Outs Recorded" },
  
  // Team Props
  "batting_homeRuns": { row1: "Team Props", row2: "Team Totals", row3: "Team Home Runs" },
  
  // Game Props
  "batting_homeRuns": { row1: "Game Props", row2: "Game Totals", row3: "Total Home Runs" },
  "pitching_strikeouts": { row1: "Game Props", row2: "Game Totals", row3: "Total Strikeouts" },
  "pitching_hits": { row1: "Game Props", row2: "Game Totals", row3: "Total Hits" }
};

const NFL_OU_MAP: Record<string, {
  row1: string;
  row2: string;
  row3: string;
  subjectToLabel?: (subj: string) => string;
}> = {
  // Game/Team totals → Main Lines
  "points": {
    row1: "Main Lines",
    row2: "Totals",
    row3: "Total Points",
    subjectToLabel: (subj: string) =>
      subj === "all" ? "Game Total" :
      subj === "home" ? "Home Team Total" :
      subj === "away" ? "Away Team Total" : "Total",
  },
  
  // Player props → Player Props → Position group → Market
  "passing_yards": { row1: "Player Props", row2: "Quarterback", row3: "Passing Yards" },
  "passing_touchdowns": { row1: "Player Props", row2: "Quarterback", row3: "Passing TDs" },
  "defense_interceptions": { row1: "Player Props", row2: "Quarterback", row3: "Interceptions" },
  "passing_completions": { row1: "Player Props", row2: "Quarterback", row3: "Completions" },
  "passing_attempts": { row1: "Player Props", row2: "Quarterback", row3: "Attempts" },
  "passing_longestCompletion": { row1: "Player Props", row2: "Quarterback", row3: "Longest Completion" },
  "passing+rushing_yards": { row1: "Player Props", row2: "Quarterback", row3: "Passing + Rushing Yards" },
  "passing_passerRating": { row1: "Player Props", row2: "Quarterback", row3: "Passer Rating" },
  
  "rushing_yards": { row1: "Player Props", row2: "Running Back", row3: "Rushing Yards" },
  "rushing_touchdowns": { row1: "Player Props", row2: "Running Back", row3: "Rushing TDs" },
  "rushing_attempts": { row1: "Player Props", row2: "Running Back", row3: "Rushing Attempts" },
  "receiving_receptions": { row1: "Player Props", row2: "Running Back", row3: "Receptions" },
  "receiving_yards": { row1: "Player Props", row2: "Wide Receiver/Tight End", row3: "Receiving Yards" },
  "receiving_touchdowns": { row1: "Player Props", row2: "Wide Receiver/Tight End", row3: "Receiving TDs" },
  "rushing_longestRush": { row1: "Player Props", row2: "Running Back", row3: "Longest Rush" },
  "rushing+receiving_yards": { row1: "Player Props", row2: "Running Back", row3: "Rushing + Receiving Yards" },
  "receiving_longestReception": { row1: "Player Props", row2: "Wide Receiver/Tight End", row3: "Longest Reception" },
  
  "kicking_totalPoints": { row1: "Player Props", row2: "Kicker/Defense", row3: "Kicking Points" },
  "fieldGoals_made": { row1: "Player Props", row2: "Kicker/Defense", row3: "Field Goals" },
  "extraPoints_kicksMade": { row1: "Player Props", row2: "Kicker/Defense", row3: "Extra Points" },
  "fieldGoals_longestMade": { row1: "Player Props", row2: "Kicker/Defense", row3: "Longest FG" },
  "defense_sacks": { row1: "Player Props", row2: "Kicker/Defense", row3: "Sacks" },
  "defense_fumbleRecoveries": { row1: "Player Props", row2: "Kicker/Defense", row3: "Fumble Recoveries" },
  "defense_touchdowns": { row1: "Player Props", row2: "Kicker/Defense", row3: "Defensive TDs" },
  "defense_tackles": { row1: "Player Props", row2: "Kicker/Defense", row3: "Tackles" },
  
  "fantasyScore": { row1: "Player Props", row2: "Any Player", row3: "Fantasy Score" },
  "turnovers": { row1: "Player Props", row2: "Any Player", row3: "Turnovers" },
  
  // Team Props
  "touchdowns": { row1: "Team Props", row2: "Team Totals", row3: "Team Touchdowns" },
  "fieldGoals_made": { row1: "Team Props", row2: "Team Totals", row3: "Team Field Goals" },
  "turnovers": { row1: "Team Props", row2: "Team Totals", row3: "Team Turnovers" },
  "defense_sacks": { row1: "Team Props", row2: "Team Totals", row3: "Team Sacks" },
  "defense_tackles": { row1: "Team Props", row2: "Team Totals", row3: "Team Tackles" },
  
  // Game Props
  "touchdowns": { row1: "Game Props", row2: "Game Totals", row3: "Total Touchdowns" },
  "fieldGoals_made": { row1: "Game Props", row2: "Game Totals", row3: "Total Field Goals" },
  "turnovers": { row1: "Game Props", row2: "Game Totals", row3: "Total Turnovers" },
  "defense_sacks": { row1: "Game Props", row2: "Game Totals", row3: "Total Sacks" },
  "longestTouchdown": { row1: "Game Props", row2: "Game Totals", row3: "Longest TD" },
  "timesTied": { row1: "Game Props", row2: "Game Totals", row3: "Times Tied" }
};

const NBA_OU_MAP: Record<string, {
  row1: string;
  row2: string;
  row3: string;
  subjectToLabel?: (subj: string) => string;
}> = {
  // Game/Team totals → Main Lines
  "points": {
    row1: "Main Lines",
    row2: "Totals",
    row3: "Total Points",
    subjectToLabel: (subj: string) =>
      subj === "all" ? "Game Total" :
      subj === "home" ? "Home Team Total" :
      subj === "away" ? "Away Team Total" : "Total",
  },
  
  // Player props → Player Props → Position group → Market
  "fieldGoals_made": { row1: "Player Props", row2: "Scoring", row3: "Field Goals" },
  "fieldGoals_attempts": { row1: "Player Props", row2: "Scoring", row3: "FG Attempts" },
  "threePointers_made": { row1: "Player Props", row2: "Scoring", row3: "Three-Pointers" },
  "threePointers_attempts": { row1: "Player Props", row2: "Scoring", row3: "3PT Attempts" },
  "freeThrows_made": { row1: "Player Props", row2: "Scoring", row3: "Free Throws" },
  "freeThrows_attempts": { row1: "Player Props", row2: "Scoring", row3: "FT Attempts" },
  
  "rebounds": { row1: "Player Props", row2: "Rebounding", row3: "Total Rebounds" },
  "rebounds_offensive": { row1: "Player Props", row2: "Rebounding", row3: "Offensive Rebounds" },
  "rebounds_defensive": { row1: "Player Props", row2: "Rebounding", row3: "Defensive Rebounds" },
  
  "assists": { row1: "Player Props", row2: "Playmaking", row3: "Assists" },
  "turnovers": { row1: "Player Props", row2: "Playmaking", row3: "Turnovers" },
  "steals": { row1: "Player Props", row2: "Playmaking", row3: "Steals" },
  "blocks": { row1: "Player Props", row2: "Playmaking", row3: "Blocks" },
  
  "points+rebounds": { row1: "Player Props", row2: "Combo Props", row3: "Points + Rebounds" },
  "points+assists": { row1: "Player Props", row2: "Combo Props", row3: "Points + Assists" },
  "rebounds+assists": { row1: "Player Props", row2: "Combo Props", row3: "Rebounds + Assists" },
  "points+rebounds+assists": { row1: "Player Props", row2: "Combo Props", row3: "Points + Rebounds + Assists" },
  "fantasyScore": { row1: "Player Props", row2: "Combo Props", row3: "Fantasy Score" },
  "blocks+steals": { row1: "Player Props", row2: "Combo Props", row3: "Blocks + Steals" },
  
  // Team Props
  "rebounds": { row1: "Team Props", row2: "Team Totals", row3: "Team Rebounds" },
  "assists": { row1: "Team Props", row2: "Team Totals", row3: "Team Assists" },
  "threePointers_made": { row1: "Team Props", row2: "Team Totals", row3: "Team 3-Pointers" },
  "turnovers": { row1: "Team Props", row2: "Team Totals", row3: "Team Turnovers" },
  
  // Game Props
  "rebounds": { row1: "Game Props", row2: "Game Totals", row3: "Total Rebounds" },
  "assists": { row1: "Game Props", row2: "Game Totals", row3: "Total Assists" },
  "threePointers_made": { row1: "Game Props", row2: "Game Totals", row3: "Total 3-Pointers" },
  "turnovers": { row1: "Game Props", row2: "Game Totals", row3: "Total Turnovers" },
  "steals": { row1: "Game Props", row2: "Game Totals", row3: "Total Steals" },
  "blocks": { row1: "Game Props", row2: "Game Totals", row3: "Total Blocks" }
};

const NHL_OU_MAP: Record<string, {
  row1: string;
  row2: string;
  row3: string;
  subjectToLabel?: (subj: string) => string;
}> = {
  // Game/Team totals → Main Lines
  "points": {
    row1: "Main Lines",
    row2: "Totals",
    row3: "Total Goals",
    subjectToLabel: (subj: string) =>
      subj === "all" ? "Game Total" :
      subj === "home" ? "Home Team Total" :
      subj === "away" ? "Away Team Total" : "Total",
  },
  
  // Player props → Player Props → Position group → Market
  "goals": { row1: "Player Props", row2: "Skaters", row3: "Goals" },
  "assists": { row1: "Player Props", row2: "Skaters", row3: "Assists" },
  "shots_onGoal": { row1: "Player Props", row2: "Skaters", row3: "Shots on Goal" },
  "hits": { row1: "Player Props", row2: "Skaters", row3: "Hits" },
  "blockedShots": { row1: "Player Props", row2: "Skaters", row3: "Blocked Shots" },
  "penaltyMinutes": { row1: "Player Props", row2: "Skaters", row3: "Penalty Minutes" },
  "powerPlayPoints": { row1: "Player Props", row2: "Skaters", row3: "Power Play Points" },
  "timeOnIce": { row1: "Player Props", row2: "Skaters", row3: "Time on Ice" },
  "faceoffWins": { row1: "Player Props", row2: "Skaters", row3: "Faceoff Wins" },
  
  "saves": { row1: "Player Props", row2: "Goalies", row3: "Saves" },
  "goalsAgainst": { row1: "Player Props", row2: "Goalies", row3: "Goals Against" },
  "savePercentage": { row1: "Player Props", row2: "Goalies", row3: "Save Percentage" },
  
  // Team Props
  "shots_onGoal": { row1: "Team Props", row2: "Team Totals", row3: "Team Shots" },
  "hits": { row1: "Team Props", row2: "Team Totals", row3: "Team Hits" },
  "penaltyMinutes": { row1: "Team Props", row2: "Team Totals", row3: "Team Penalty Minutes" },
  "powerPlayGoals": { row1: "Team Props", row2: "Team Totals", row3: "Power Play Goals" },
  "shortHandedGoals": { row1: "Team Props", row2: "Team Totals", row3: "Short Handed Goals" },
  
  // Game Props
  "shots_onGoal": { row1: "Game Props", row2: "Game Totals", row3: "Total Shots" },
  "hits": { row1: "Game Props", row2: "Game Totals", row3: "Total Hits" },
  "penaltyMinutes": { row1: "Game Props", row2: "Game Totals", row3: "Total Penalty Minutes" },
  "powerPlays": { row1: "Game Props", row2: "Game Totals", row3: "Total Power Plays" },
  "firstGoalTime": { row1: "Game Props", row2: "Game Totals", row3: "First Goal Time" }
};

// Additional maps for Champions League and MLS (soccer)
const SOCCER_OU_MAP: Record<string, {
  row1: string;
  row2: string;
  row3: string;
  subjectToLabel?: (subj: string) => string;
}> = {
  // Game/Team totals → Main Lines
  "points": {
    row1: "Main Lines",
    row2: "Totals",
    row3: "Total Goals",
    subjectToLabel: (subj: string) =>
      subj === "all" ? "Game Total" :
      subj === "home" ? "Home Team Total" :
      subj === "away" ? "Away Team Total" : "Total",
  },
  
  // Player props → Player Props → Position group → Market
  "goals": { row1: "Player Props", row2: "Forwards", row3: "Goals" },
  "shots_onTarget": { row1: "Player Props", row2: "Forwards", row3: "Shots on Target" },
  "shots": { row1: "Player Props", row2: "Forwards", row3: "Shots" },
  "assists": { row1: "Player Props", row2: "Forwards", row3: "Assists" },
  "fouls": { row1: "Player Props", row2: "Forwards", row3: "Fouls" },
  "cards": { row1: "Player Props", row2: "Forwards", row3: "Cards" },
  
  "passesCompleted": { row1: "Player Props", row2: "Midfielders", row3: "Passes Completed" },
  "passCompletionPercentage": { row1: "Player Props", row2: "Midfielders", row3: "Pass Completion %" },
  "tackles": { row1: "Player Props", row2: "Midfielders", row3: "Tackles" },
  
  "clearances": { row1: "Player Props", row2: "Defenders", row3: "Clearances" },
  "blocks": { row1: "Player Props", row2: "Defenders", row3: "Blocks" },
  "interceptions": { row1: "Player Props", row2: "Defenders", row3: "Interceptions" },
  
  "saves": { row1: "Player Props", row2: "Goalkeepers", row3: "Saves" },
  "goalsConceded": { row1: "Player Props", row2: "Goalkeepers", row3: "Goals Conceded" },
  "punchesCatches": { row1: "Player Props", row2: "Goalkeepers", row3: "Punches/Catches" },
  
  // Team Props
  "shots": { row1: "Team Props", row2: "Team Totals", row3: "Team Shots" },
  "corners": { row1: "Team Props", row2: "Team Totals", row3: "Team Corners" },
  "cards": { row1: "Team Props", row2: "Team Totals", row3: "Team Cards" },
  "fouls": { row1: "Team Props", row2: "Team Totals", row3: "Team Fouls" },
  "offsides": { row1: "Team Props", row2: "Team Totals", row3: "Team Offsides" },
  
  // Game Props
  "shots": { row1: "Game Props", row2: "Game Totals", row3: "Total Shots" },
  "corners": { row1: "Game Props", row2: "Game Totals", row3: "Total Corners" },
  "cards": { row1: "Game Props", row2: "Game Totals", row3: "Total Cards" },
  "fouls": { row1: "Game Props", row2: "Game Totals", row3: "Total Fouls" },
  "offsides": { row1: "Game Props", row2: "Game Totals", row3: "Total Offsides" },
  "firstGoalTime": { row1: "Game Props", row2: "Game Totals", row3: "First Goal Time" }
};

// Get metric map for league
function getMetricMap(league: string): Record<string, {
  row1: string;
  row2: string;
  row3: string;
  subjectToLabel?: (subj: string) => string;
}> {
  switch (league.toUpperCase()) {
    case 'MLB': return MLB_OU_MAP;
    case 'NFL': 
    case 'NCAAF': return NFL_OU_MAP;
    case 'NBA':
    case 'NCAAB': return NBA_OU_MAP;
    case 'NHL': return NHL_OU_MAP;
    case 'CHAMPIONS LEAGUE':
    case 'MLS': return SOCCER_OU_MAP;
    default: 
      console.warn(`⚠️ No metric map found for league: ${league}, using NFL default`);
      return NFL_OU_MAP;
  }
}

// Enhanced odds service focusing on O/U markets only
export class OUOddsService {
  private supabase = createClient();

  /**
   * Filter raw odds to only O/U markets
   */
  private filterToOUOdds(odds: DatabaseOdds[]): DatabaseOdds[] {
    return odds.filter(odd => {
      if (!odd.oddid) return false;
      // Only include odds that contain '-ou-' and end with '-over' or '-under'
      return odd.oddid.includes('-ou-') && (odd.oddid.endsWith('-over') || odd.oddid.endsWith('-under'));
    });
  }

  /**
   * Parse oddID and normalize to consistent structure
   */
  private normalizeOUOdd(odd: DatabaseOdds, league: string): NormalizedOUOdd | null {
    try {
      // Parse the oddID
      const parsed = parseOddId(odd.oddid || '');
      if (!parsed) {
        console.warn(`⚠️ Failed to parse oddID: ${odd.oddid}`);
        return null;
      }

      const { metric, subject, scope, side } = parsed;
      
      // Get metric mapping for this league
      const metricMap = getMetricMap(league);
      const mapping = metricMap[metric];
      
      if (!mapping) {
        console.warn(`⚠️ No mapping found for metric '${metric}' in league '${league}'`);
        return null;
      }

      // Determine entity type and ID
      const { entityType, entityId } = subjectToEntity(subject);
      
      // Get entity label
      let entityLabel: string;
      if (entityType === "player") {
        // TODO: Implement player lookup using existing method
        // For now, use player ID as label
        entityLabel = `Player ${entityId}`;
      } else if (entityType === "team") {
        entityLabel = mapping.subjectToLabel ? mapping.subjectToLabel(subject) : subject;
      } else {
        entityLabel = mapping.subjectToLabel ? mapping.subjectToLabel(subject) : "Game Total";
      }

      // Parse line and price
      const line = toNumber(odd.line);
      const price = toNumber(odd.bookodds);
      
      if (line === null || price === null) {
        console.warn(`⚠️ Invalid line (${odd.line}) or price (${odd.bookodds}) for oddID: ${odd.oddid}`);
        return null;
      }

      return {
        gameId: odd.eventid || '',
        league,
        row1: mapping.row1,
        row2: mapping.row2,
        row3: mapping.row3,
        entityType,
        entityId,
        entityLabel,
        side,
        line,
        price,
        oddId: odd.oddid || ''
      };
    } catch (error) {
      console.error(`❌ Error normalizing odd ${odd.oddid}:`, error);
      return null;
    }
  }

  /**
   * Get O/U odds for a specific game, properly parsed and normalized
   */
  async getOUOddsForGame(gameId: string, league: string): Promise<NormalizedOUOdd[]> {
    try {
      console.log(`🔍 Fetching O/U odds for game: ${gameId} (${league})`);
      
      // Fetch all odds for this game
      const { data: odds, error } = await this.supabase
        .from('odds')
        .select('*')
        .eq('eventid', gameId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching odds:', error);
        return [];
      }

      if (!odds || odds.length === 0) {
        console.log('⚠️ No odds found for this game');
        return [];
      }

      console.log(`📊 Found ${odds.length} total odds, filtering to O/U only...`);

      // Filter to O/U odds only
      const ouOdds = this.filterToOUOdds(odds);
      console.log(`📊 Filtered to ${ouOdds.length} O/U odds`);

      // Normalize each odd
      const normalizedOdds: NormalizedOUOdd[] = [];
      for (const odd of ouOdds) {
        const normalized = this.normalizeOUOdd(odd, league);
        if (normalized) {
          normalizedOdds.push(normalized);
        }
      }

      console.log(`✅ Successfully normalized ${normalizedOdds.length} O/U odds`);
      return normalizedOdds;
    } catch (error) {
      console.error('❌ Failed to get O/U odds for game:', error);
      return [];
    }
  }

  /**
   * Get O/U odds for multiple games on a specific date
   */
  async getOUOddsForDate(date: string, leagues: string[] = ['MLB', 'NFL', 'NBA', 'NHL']): Promise<Record<string, NormalizedOUOdd[]>> {
    try {
      console.log(`🎯 Fetching O/U odds for date: ${date}, leagues: ${leagues.join(', ')}`);
      
      // First get all games for the date
      const { data: games, error: gamesError } = await this.supabase
        .from('games')
        .select('id, league')
        .in('league', leagues.map(l => l.toUpperCase()))
        .gte('game_time', `${date}T00:00:00.000Z`)
        .lt('game_time', `${date}T23:59:59.999Z`)
        .order('game_time', { ascending: true });

      if (gamesError) {
        console.error('❌ Error fetching games:', gamesError);
        return {};
      }

      if (!games || games.length === 0) {
        console.log('⚠️ No games found for this date');
        return {};
      }

      const gameIds = games.map(game => game.id);
      console.log(`📊 Found ${games.length} games`);

      // Fetch all odds for these games in batch
      const { data: odds, error: oddsError } = await this.supabase
        .from('odds')
        .select('*')
        .in('eventid', gameIds)
        .order('created_at', { ascending: false });

      if (oddsError) {
        console.error('❌ Error fetching odds:', oddsError);
        return {};
      }

      console.log(`📊 Found ${odds?.length || 0} total odds entries`);

      // Filter to O/U odds only
      const ouOdds = this.filterToOUOdds(odds || []);
      console.log(`📊 Filtered to ${ouOdds.length} O/U odds`);

      // Group by game and normalize
      const oddsByGame: Record<string, NormalizedOUOdd[]> = {};
      
      for (const game of games) {
        const gameOdds = ouOdds.filter(odd => odd.eventid === game.id);
        const normalizedOdds: NormalizedOUOdd[] = [];
        
        for (const odd of gameOdds) {
          const normalized = this.normalizeOUOdd(odd, game.league);
          if (normalized) {
            normalizedOdds.push(normalized);
          }
        }
        
        oddsByGame[game.id] = normalizedOdds;
        console.log(`  Game ${game.id} (${game.league}): ${normalizedOdds.length} normalized O/U odds`);
      }

      return oddsByGame;
    } catch (error) {
      console.error('❌ Failed to get O/U odds for date:', error);
      return {};
    }
  }

  /**
   * Organize normalized odds into the hierarchical tab structure expected by UI
   */
  organizeOddsForUI(normalizedOdds: NormalizedOUOdd[]): {
    [row1: string]: {
      [row2: string]: {
        [row3: string]: NormalizedOUOdd[]
      }
    }
  } {
    const organized: {
      [row1: string]: {
        [row2: string]: {
          [row3: string]: NormalizedOUOdd[]
        }
      }
    } = {};

    // Initialize all tab structure (even empty ones)
    const allTabs = ['Main Lines', 'Player Props', 'Team Props', 'Game Props'];
    for (const tab of allTabs) {
      organized[tab] = {};
    }

    // Organize odds
    for (const odd of normalizedOdds) {
      if (!organized[odd.row1]) {
        organized[odd.row1] = {};
      }
      if (!organized[odd.row1][odd.row2]) {
        organized[odd.row1][odd.row2] = {};
      }
      if (!organized[odd.row1][odd.row2][odd.row3]) {
        organized[odd.row1][odd.row2][odd.row3] = [];
      }
      
      organized[odd.row1][odd.row2][odd.row3].push(odd);
    }

    return organized;
  }
}

// Create singleton instance
export const ouOddsService = new OUOddsService();