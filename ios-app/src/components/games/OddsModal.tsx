import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Animated,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '../../styles/theme';
import TrueSharpShield from '../common/TrueSharpShield';
import { OddsDetailModal } from './OddsDetailModal';
import { supabase } from '../../lib/supabase';

const { width: screenWidth } = Dimensions.get('window');

// Types
interface Game {
  id: string;
  home_team: string;
  away_team: string;
  home_team_name: string;
  away_team_name: string;
  game_time: string;
  sport: string;
  league?: string;
  status?: string;
}

interface DatabaseOdds {
  id: string;
  eventid: string;
  oddid: string;
  line?: string;
  sportsbook: string;
  fanduelodds?: number;
  draftkingsodds?: number;
  espnbetodds?: number;
  ceasarsodds?: number;
  mgmodds?: number;
  fanaticsodds?: number;
  bookodds?: number;
  playerid?: string;
  marketname: string;
  score?: string;
}

interface OddsModalProps {
  isVisible: boolean;
  onClose: () => void;
  game: Game;
  league: string;
}

// Main tab types
type MainTabType = 'Main Lines' | 'Player Props' | 'Team Props' | 'Game Props';

const MAIN_TABS: MainTabType[] = ['Main Lines', 'Player Props', 'Team Props', 'Game Props'];

// Sport-specific sub-tabs mapping based on games-page.md
const getSubTabs = (sport: string, league: string, mainTab: MainTabType): string[] => {
  const sportLower = sport?.toLowerCase() || '';
  const leagueLower = league?.toLowerCase() || '';
  
  // Main Lines doesn't have sub-tabs, it shows the actual odds
  if (mainTab === 'Main Lines') {
    return [];
  }
  
  // Base sub-tabs for each main tab
  const subTabsMap: Record<MainTabType, Record<string, string[]>> = {
    'Main Lines': {},
    'Player Props': {
      'mlb': ['Hitters', 'Pitchers'],
      'nfl': ['Offense', 'Defense'],
      'ncaaf': ['Offense', 'Defense'],
      'nba': ['Scoring', 'Rebounding', 'Playmaking', 'Combo Props'],
      'wnba': ['Scoring', 'Rebounding', 'Playmaking', 'Combo Props'],
      'ncaab': ['Scoring', 'Rebounding', 'Playmaking', 'Combo Props'],
      'nhl': ['Skaters', 'Goalies'],
      'soccer': ['Forwards', 'Midfielders', 'Defenders', 'Goalkeepers'],
      'default': ['Offense', 'Defense']
    },
    'Team Props': {
      'mlb': ['Team Total Runs', 'Team Hits', 'Team Home Runs', 'Team Strikeouts'],
      'nfl': ['Team Scoring', 'Team Stats'],
      'ncaaf': ['Team Scoring', 'Team Stats'],
      'nba': ['Team Total Points'],
      'wnba': ['Team Total Points'],
      'ncaab': ['Team Total Points'],
      'nhl': [], // Very limited Team Props in database
      'soccer': [], // Very limited Team Props in database
      'default': []
    },
    'Game Props': {
      'mlb': ['Total Hits', 'Total Home Runs', 'Total Strikeouts', 'Innings'],
      'nfl': ['Quarters/Halves'],
      'ncaaf': ['Quarters/Halves'],
      'nba': ['Quarters/Halves'],
      'wnba': ['Quarters/Halves'],
      'ncaab': ['Quarters/Halves'],
      'nhl': [], // Very limited Game Props in database
      'soccer': [], // Very limited Game Props in database
      'default': []
    }
  };

  // Determine sport key
  let sportKey = 'default';
  if (sportLower.includes('baseball') || leagueLower === 'mlb') {
    sportKey = 'mlb';
  } else if (sportLower.includes('football') || leagueLower === 'nfl') {
    sportKey = 'nfl';
  } else if (leagueLower === 'ncaaf') {
    sportKey = 'ncaaf';
  } else if (sportLower.includes('basketball') || leagueLower === 'nba') {
    sportKey = 'nba';
  } else if (leagueLower === 'wnba') {
    sportKey = 'nba'; // WNBA uses same oddid patterns as NBA
  } else if (leagueLower === 'ncaab') {
    sportKey = 'ncaab';
  } else if (sportLower.includes('hockey') || leagueLower === 'nhl') {
    sportKey = 'nhl';
  } else if (sportLower.includes('soccer') || leagueLower === 'mls' || leagueLower === 'champions league') {
    sportKey = 'soccer';
  }

  return subTabsMap[mainTab][sportKey] || subTabsMap[mainTab]['default'] || [];
};

// Get specific market tabs for the third level
const getMarketTabs = (sport: string, league: string, mainTab: MainTabType, subTab: string): string[] => {
  const sportLower = sport?.toLowerCase() || '';
  const leagueLower = league?.toLowerCase() || '';
  
  if (mainTab === 'Main Lines' || !subTab) {
    return [];
  }
  
  // Market tabs based on games-page.md structure
  const marketTabsMap: Record<string, string[]> = {
    // MLB Player Props
    'mlb-Hitters': [
      'Hits', 'Home Runs', 'RBIs', 'Runs Scored', 'Total Bases', 
      'Singles', 'Doubles', 'Triples', 'Stolen Bases', 'Strikeouts', 
      'Walks', 'Hits + Runs + RBIs', 'Fantasy Score', 'First Home Run'
    ],
    'mlb-Pitchers': [
      'Strikeouts', 'Hits Allowed', 'Earned Runs Allowed', 'Walks Allowed',
      'Home Runs Allowed', 'Pitches Thrown', 'Outs Recorded', 'Pitching Win'
    ],
    
    // NFL Player Props
    'nfl-Offense': [
      'Anytime Touchdowns', 'Passing Yards', 'Passing Touchdowns', 'Passing Interceptions', 'Completions',
      'Passing Attempts', 'Longest Completion', 'Rushing Yards', 'Passing + Rushing Yards', 
      'Receiving Yards', 'Receptions', 'Longest Reception', 'Rushing + Receiving Yards', 
      'Kicking Points', 'Field Goals Made', 'Extra Points Made'
    ],
    'nfl-Defense': [
      'Sacks', 'Tackles'
    ],
    
    // NBA Player Props
    'nba-Scoring': [
      'Points', 'Field Goals Made', 'Field Goal Attempts', 'Three-Pointers Made',
      'Three-Point Attempts', 'Free Throws Made', 'Free Throw Attempts'
    ],
    'nba-Rebounding': [
      'Total Rebounds', 'Offensive Rebounds', 'Defensive Rebounds'
    ],
    'nba-Playmaking': [
      'Assists', 'Turnovers', 'Steals', 'Blocks'
    ],
    'nba-Combo Props': [
      'Points + Rebounds', 'Points + Assists', 'Rebounds + Assists',
      'Points + Rebounds + Assists', 'Fantasy Score', 'Blocks + Steals'
    ],
    
    // NHL Player Props
    'nhl-Skaters': [
      'Goals', 'Assists', 'Points (Goals + Assists)', 'Shots on Goal', 'Hits',
      'Blocked Shots', 'Penalty Minutes', 'Power Play Points', 'Time on Ice',
      'Faceoff Wins', 'First Goal Scorer', 'Anytime Goal Scorer'
    ],
    'nhl-Goalies': [
      'Saves', 'Goals Against', 'Save Percentage'
    ],

    // NCAAB Player Props (same as NBA)
    'ncaab-Scoring': [
      'Points', 'Field Goals Made', 'Field Goal Attempts', 'Three-Pointers Made',
      'Three-Point Attempts', 'Free Throws Made', 'Free Throw Attempts'
    ],
    'ncaab-Rebounding': [
      'Total Rebounds', 'Offensive Rebounds', 'Defensive Rebounds'
    ],
    'ncaab-Playmaking': [
      'Assists', 'Turnovers', 'Steals', 'Blocks'
    ],
    'ncaab-Combo Props': [
      'Points + Rebounds', 'Points + Assists', 'Rebounds + Assists',
      'Points + Rebounds + Assists', 'Fantasy Score', 'Blocks + Steals'
    ],
    
    // Soccer Player Props
    'soccer-Forwards': [
      'Goals', 'Shots on Target', 'Shots', 'Assists', 'Fouls Committed',
      'Cards Received', 'First Goal Scorer', 'Anytime Goal Scorer'
    ],
    'soccer-Midfielders': [
      'Passes Completed', 'Pass Completion %', 'Tackles', 'Assists',
      'Shots', 'Fouls Committed', 'Cards Received'
    ],
    'soccer-Defenders': [
      'Tackles', 'Clearances', 'Blocks', 'Interceptions', 'Fouls Committed', 'Cards Received'
    ],
    'soccer-Goalkeepers': [
      'Saves', 'Goals Conceded', 'Punches/Catches'
    ]
  };
  
  // Build key for lookup
  let sportKey = 'default';
  if (sportLower.includes('baseball') || leagueLower === 'mlb') {
    sportKey = 'mlb';
  } else if (sportLower.includes('football') || leagueLower === 'nfl') {
    sportKey = 'nfl';
  } else if (leagueLower === 'ncaaf') {
    sportKey = 'ncaaf';
  } else if (sportLower.includes('basketball') || leagueLower === 'nba') {
    sportKey = 'nba';
  } else if (leagueLower === 'wnba') {
    sportKey = 'nba'; // WNBA uses same oddid patterns as NBA
  } else if (leagueLower === 'ncaab') {
    sportKey = 'ncaab';
  } else if (sportLower.includes('hockey') || leagueLower === 'nhl') {
    sportKey = 'nhl';
  } else if (sportLower.includes('soccer') || leagueLower === 'mls' || leagueLower === 'champions league') {
    sportKey = 'soccer';
  }
  
  const lookupKey = `${sportKey}-${subTab}`;
  return marketTabsMap[lookupKey] || [];
};

// Get oddids for a specific market tab
const getMarketOddIds = (sport: string, league: string, mainTab: MainTabType, subTab: string, marketTab: string): string[] => {
  const sportLower = sport?.toLowerCase() || '';
  const leagueLower = league?.toLowerCase() || '';
  
  // Determine sport key
  let sportKey = 'default';
  if (sportLower.includes('baseball') || leagueLower === 'mlb') {
    sportKey = 'mlb';
  } else if (sportLower.includes('football') || leagueLower === 'nfl') {
    sportKey = 'nfl';
  } else if (leagueLower === 'ncaaf') {
    sportKey = 'ncaaf';
  } else if (sportLower.includes('basketball') || leagueLower === 'nba') {
    sportKey = 'nba';
  } else if (leagueLower === 'wnba') {
    sportKey = 'nba'; // WNBA uses same oddid patterns as NBA
  } else if (leagueLower === 'ncaab') {
    sportKey = 'ncaab';
  } else if (sportLower.includes('hockey') || leagueLower === 'nhl') {
    sportKey = 'nhl';
  } else if (sportLower.includes('soccer') || leagueLower === 'mls' || leagueLower === 'champions league') {
    sportKey = 'soccer';
  }

  // Handle Main Lines separately
  if (mainTab === 'Main Lines') {
    if (sportKey === 'mlb') {
      return [
        'points-home-game-ml-home', 'points-away-game-ml-away', // Moneyline
        'points-home-game-sp-home', 'points-away-game-sp-away', // Run Line
        'points-all-game-ou-over', 'points-all-game-ou-under' // Total
      ];
    } else if (sportKey === 'nfl' || sportKey === 'ncaaf') {
      return [
        'points-home-game-ml-home', 'points-away-game-ml-away', // Moneyline
        'points-home-game-sp-home', 'points-away-game-sp-away', // Spread
        'points-all-game-ou-over', 'points-all-game-ou-under' // Total
      ];
    } else if (sportKey === 'nba' || sportKey === 'ncaab') {
      return [
        'points-home-game-ml-home', 'points-away-game-ml-away', // Moneyline
        'points-home-game-sp-home', 'points-away-game-sp-away', // Spread
        'points-all-game-ou-over', 'points-all-game-ou-under' // Total
      ];
    } else if (sportKey === 'nhl') {
      return [
        'points-home-game-ml-home', 'points-away-game-ml-away', // Moneyline
        'points-home-game-sp-home', 'points-away-game-sp-away', // Puck Line
        'points-all-game-ou-over', 'points-all-game-ou-under' // Total
      ];
    } else if (sportKey === 'soccer') {
      return [
        'points-home-game-ml-home', 'points-away-game-ml-away', 'points-all-game-ml-draw', // 1X2
        'points-home-game-sp-home', 'points-away-game-sp-away', // Asian Handicap
        'points-all-game-ou-over', 'points-all-game-ou-under' // Total Goals
      ];
    }
    return [];
  }

  // Market-specific oddid mapping
  const marketOddIds: Record<string, Record<string, string[]>> = {
    // MLB Player Props
    'mlb-Hitters': {
      'Hits': ['batting_hits-ANY_PLAYER_ID-game-ou-over', 'batting_hits-ANY_PLAYER_ID-game-ou-under'],
      'Home Runs': ['batting_homeRuns-ANY_PLAYER_ID-game-ou-over', 'batting_homeRuns-ANY_PLAYER_ID-game-ou-under'],
      'RBIs': ['batting_RBI-ANY_PLAYER_ID-game-ou-over', 'batting_RBI-ANY_PLAYER_ID-game-ou-under'],
      'Runs Scored': ['points-ANY_PLAYER_ID-game-ou-over', 'points-ANY_PLAYER_ID-game-ou-under'],
      'Total Bases': ['batting_totalBases-ANY_PLAYER_ID-game-ou-over', 'batting_totalBases-ANY_PLAYER_ID-game-ou-under'],
      'Singles': ['batting_singles-ANY_PLAYER_ID-game-ou-over', 'batting_singles-ANY_PLAYER_ID-game-ou-under'],
      'Doubles': ['batting_doubles-ANY_PLAYER_ID-game-ou-over', 'batting_doubles-ANY_PLAYER_ID-game-ou-under'],
      'Triples': ['batting_triples-ANY_PLAYER_ID-game-ou-over', 'batting_triples-ANY_PLAYER_ID-game-ou-under'],
      'Stolen Bases': ['batting_stolenBases-ANY_PLAYER_ID-game-ou-over', 'batting_stolenBases-ANY_PLAYER_ID-game-ou-under'],
      'Strikeouts': ['batting_strikeouts-ANY_PLAYER_ID-game-ou-over', 'batting_strikeouts-ANY_PLAYER_ID-game-ou-under'],
      'Walks': ['batting_basesOnBalls-ANY_PLAYER_ID-game-ou-over', 'batting_basesOnBalls-ANY_PLAYER_ID-game-ou-under'],
      'Hits + Runs + RBIs': ['batting_hits+runs+rbi-ANY_PLAYER_ID-game-ou-over', 'batting_hits+runs+rbi-ANY_PLAYER_ID-game-ou-under'],
      'Fantasy Score': ['fantasyScore-ANY_PLAYER_ID-game-ou-over', 'fantasyScore-ANY_PLAYER_ID-game-ou-under'],
      'First Home Run': ['batting_firstHomeRun-ANY_PLAYER_ID-game-yn-yes', 'batting_firstHomeRun-ANY_PLAYER_ID-game-yn-no']
    },
    'mlb-Pitchers': {
      'Strikeouts': ['pitching_strikeouts-ANY_PLAYER_ID-game-ou-over', 'pitching_strikeouts-ANY_PLAYER_ID-game-ou-under'],
      'Hits Allowed': ['pitching_hits-ANY_PLAYER_ID-game-ou-over', 'pitching_hits-ANY_PLAYER_ID-game-ou-under'],
      'Earned Runs Allowed': ['pitching_earnedRuns-ANY_PLAYER_ID-game-ou-over', 'pitching_earnedRuns-ANY_PLAYER_ID-game-ou-under'],
      'Walks Allowed': ['pitching_basesOnBalls-ANY_PLAYER_ID-game-ou-over', 'pitching_basesOnBalls-ANY_PLAYER_ID-game-ou-under'],
      'Home Runs Allowed': ['pitching_homeRunsAllowed-ANY_PLAYER_ID-game-ou-over', 'pitching_homeRunsAllowed-ANY_PLAYER_ID-game-ou-under'],
      'Pitches Thrown': ['pitching_pitchesThrown-ANY_PLAYER_ID-game-ou-over', 'pitching_pitchesThrown-ANY_PLAYER_ID-game-ou-under'],
      'Outs Recorded': ['pitching_outs-ANY_PLAYER_ID-game-ou-over', 'pitching_outs-ANY_PLAYER_ID-game-ou-under'],
      'Pitching Win': ['pitching_win-ANY_PLAYER_ID-game-yn-yes', 'pitching_win-ANY_PLAYER_ID-game-yn-no']
    },
    
    // NFL Player Props
    'nfl-Offense': {
      'Anytime Touchdowns': ['touchdowns-ANY_PLAYER_ID-game-ou-over', 'touchdowns-ANY_PLAYER_ID-game-ou-under', 'touchdowns-ANY_PLAYER_ID-game-yn-yes', 'touchdowns-ANY_PLAYER_ID-game-yn-no', 'firstTouchdown-ANY_PLAYER_ID-game-yn-yes', 'firstTouchdown-ANY_PLAYER_ID-game-yn-no', 'lastTouchdown-ANY_PLAYER_ID-game-yn-yes', 'lastTouchdown-ANY_PLAYER_ID-game-yn-no'],
      'Passing Yards': ['passing_yards-ANY_PLAYER_ID-game-ou-over', 'passing_yards-ANY_PLAYER_ID-game-ou-under'],
      'Passing Touchdowns': ['passing_touchdowns-ANY_PLAYER_ID-game-ou-over', 'passing_touchdowns-ANY_PLAYER_ID-game-ou-under'],
      'Passing Interceptions': ['passing_interceptions-ANY_PLAYER_ID-game-ou-over', 'passing_interceptions-ANY_PLAYER_ID-game-ou-under'],
      'Completions': ['passing_completions-ANY_PLAYER_ID-game-ou-over', 'passing_completions-ANY_PLAYER_ID-game-ou-under'],
      'Passing Attempts': ['passing_attempts-ANY_PLAYER_ID-game-ou-over', 'passing_attempts-ANY_PLAYER_ID-game-ou-under'],
      'Longest Completion': ['passing_longestCompletion-ANY_PLAYER_ID-game-ou-over', 'passing_longestCompletion-ANY_PLAYER_ID-game-ou-under'],
      'Rushing Yards': ['rushing_yards-ANY_PLAYER_ID-game-ou-over', 'rushing_yards-ANY_PLAYER_ID-game-ou-under'],
      'Passing + Rushing Yards': ['passing+rushing_yards-ANY_PLAYER_ID-game-ou-over', 'passing+rushing_yards-ANY_PLAYER_ID-game-ou-under'],
      'Receiving Yards': ['receiving_yards-ANY_PLAYER_ID-game-ou-over', 'receiving_yards-ANY_PLAYER_ID-game-ou-under'],
      'Receptions': ['receiving_receptions-ANY_PLAYER_ID-game-ou-over', 'receiving_receptions-ANY_PLAYER_ID-game-ou-under'],
      'Longest Reception': ['receiving_longestReception-ANY_PLAYER_ID-game-ou-over', 'receiving_longestReception-ANY_PLAYER_ID-game-ou-under'],
      'Rushing + Receiving Yards': ['rushing+receiving_yards-ANY_PLAYER_ID-game-ou-over', 'rushing+receiving_yards-ANY_PLAYER_ID-game-ou-under'],
      'Kicking Points': ['kicking_totalPoints-ANY_PLAYER_ID-game-ou-over', 'kicking_totalPoints-ANY_PLAYER_ID-game-ou-under'],
      'Field Goals Made': ['fieldGoals_made-ANY_PLAYER_ID-game-ou-over', 'fieldGoals_made-ANY_PLAYER_ID-game-ou-under'],
      'Extra Points Made': ['extraPoints_kicksMade-ANY_PLAYER_ID-game-ou-over', 'extraPoints_kicksMade-ANY_PLAYER_ID-game-ou-under']
    },
    'nfl-Defense': {
      'Sacks': ['defense_sacks-ANY_PLAYER_ID-game-ou-over', 'defense_sacks-ANY_PLAYER_ID-game-ou-under'],
      'Tackles': ['defense_combinedTackles-ANY_PLAYER_ID-game-ou-over', 'defense_combinedTackles-ANY_PLAYER_ID-game-ou-under']
    },

    // NCAAF Player Props (same as NFL)
    'ncaaf-Offense': {
      'Anytime Touchdowns': ['touchdowns-ANY_PLAYER_ID-game-ou-over', 'touchdowns-ANY_PLAYER_ID-game-ou-under', 'touchdowns-ANY_PLAYER_ID-game-yn-yes', 'touchdowns-ANY_PLAYER_ID-game-yn-no', 'firstTouchdown-ANY_PLAYER_ID-game-yn-yes', 'firstTouchdown-ANY_PLAYER_ID-game-yn-no', 'lastTouchdown-ANY_PLAYER_ID-game-yn-yes', 'lastTouchdown-ANY_PLAYER_ID-game-yn-no'],
      'Passing Yards': ['passing_yards-ANY_PLAYER_ID-game-ou-over', 'passing_yards-ANY_PLAYER_ID-game-ou-under'],
      'Passing Touchdowns': ['passing_touchdowns-ANY_PLAYER_ID-game-ou-over', 'passing_touchdowns-ANY_PLAYER_ID-game-ou-under'],
      'Passing Interceptions': ['passing_interceptions-ANY_PLAYER_ID-game-ou-over', 'passing_interceptions-ANY_PLAYER_ID-game-ou-under'],
      'Completions': ['passing_completions-ANY_PLAYER_ID-game-ou-over', 'passing_completions-ANY_PLAYER_ID-game-ou-under'],
      'Passing Attempts': ['passing_attempts-ANY_PLAYER_ID-game-ou-over', 'passing_attempts-ANY_PLAYER_ID-game-ou-under'],
      'Longest Completion': ['passing_longestCompletion-ANY_PLAYER_ID-game-ou-over', 'passing_longestCompletion-ANY_PLAYER_ID-game-ou-under'],
      'Rushing Yards': ['rushing_yards-ANY_PLAYER_ID-game-ou-over', 'rushing_yards-ANY_PLAYER_ID-game-ou-under'],
      'Passing + Rushing Yards': ['passing+rushing_yards-ANY_PLAYER_ID-game-ou-over', 'passing+rushing_yards-ANY_PLAYER_ID-game-ou-under'],
      'Receiving Yards': ['receiving_yards-ANY_PLAYER_ID-game-ou-over', 'receiving_yards-ANY_PLAYER_ID-game-ou-under'],
      'Receptions': ['receiving_receptions-ANY_PLAYER_ID-game-ou-over', 'receiving_receptions-ANY_PLAYER_ID-game-ou-under'],
      'Longest Reception': ['receiving_longestReception-ANY_PLAYER_ID-game-ou-over', 'receiving_longestReception-ANY_PLAYER_ID-game-ou-under'],
      'Rushing + Receiving Yards': ['rushing+receiving_yards-ANY_PLAYER_ID-game-ou-over', 'rushing+receiving_yards-ANY_PLAYER_ID-game-ou-under'],
      'Kicking Points': ['kicking_totalPoints-ANY_PLAYER_ID-game-ou-over', 'kicking_totalPoints-ANY_PLAYER_ID-game-ou-under'],
      'Field Goals Made': ['fieldGoals_made-ANY_PLAYER_ID-game-ou-over', 'fieldGoals_made-ANY_PLAYER_ID-game-ou-under'],
      'Extra Points Made': ['extraPoints_kicksMade-ANY_PLAYER_ID-game-ou-over', 'extraPoints_kicksMade-ANY_PLAYER_ID-game-ou-under']
    },
    'ncaaf-Defense': {
      'Sacks': ['defense_sacks-ANY_PLAYER_ID-game-ou-over', 'defense_sacks-ANY_PLAYER_ID-game-ou-under'],
      'Tackles': ['defense_combinedTackles-ANY_PLAYER_ID-game-ou-over', 'defense_combinedTackles-ANY_PLAYER_ID-game-ou-under']
    },

    // NBA Player Props (same for NCAAB)
    'nba-Scoring': {
      'Points': ['points-ANY_PLAYER_ID-game-ou-over', 'points-ANY_PLAYER_ID-game-ou-under'],
      'Field Goals Made': ['fieldGoalsMade-ANY_PLAYER_ID-game-ou-over', 'fieldGoalsMade-ANY_PLAYER_ID-game-ou-under'],
      'Field Goal Attempts': ['fieldGoalsAttempted-ANY_PLAYER_ID-game-ou-over', 'fieldGoalsAttempted-ANY_PLAYER_ID-game-ou-under'],
      'Two-Pointers Made': ['twoPointersMade-ANY_PLAYER_ID-game-ou-over', 'twoPointersMade-ANY_PLAYER_ID-game-ou-under'],
      'Three-Pointers Made': ['threePointersMade-ANY_PLAYER_ID-game-ou-over', 'threePointersMade-ANY_PLAYER_ID-game-ou-under'],
      'Free Throws Made': ['freeThrowsMade-ANY_PLAYER_ID-game-ou-over', 'freeThrowsMade-ANY_PLAYER_ID-game-ou-under']
    },
    'nba-Rebounding': {
      'Total Rebounds': ['rebounds-ANY_PLAYER_ID-game-ou-over', 'rebounds-ANY_PLAYER_ID-game-ou-under']
    },
    'nba-Playmaking': {
      'Assists': ['assists-ANY_PLAYER_ID-game-ou-over', 'assists-ANY_PLAYER_ID-game-ou-under'],
      'Turnovers': ['turnovers-ANY_PLAYER_ID-game-ou-over', 'turnovers-ANY_PLAYER_ID-game-ou-under'],
      'Steals': ['steals-ANY_PLAYER_ID-game-ou-over', 'steals-ANY_PLAYER_ID-game-ou-under'],
      'Blocks': ['blocks-ANY_PLAYER_ID-game-ou-over', 'blocks-ANY_PLAYER_ID-game-ou-under']
    },
    'nba-Combo Props': {
      'Points + Rebounds': ['points+rebounds-ANY_PLAYER_ID-game-ou-over', 'points+rebounds-ANY_PLAYER_ID-game-ou-under'],
      'Points + Assists': ['points+assists-ANY_PLAYER_ID-game-ou-over', 'points+assists-ANY_PLAYER_ID-game-ou-under'],
      'Rebounds + Assists': ['rebounds+assists-ANY_PLAYER_ID-game-ou-over', 'rebounds+assists-ANY_PLAYER_ID-game-ou-under'],
      'Points + Rebounds + Assists': ['points+rebounds+assists-ANY_PLAYER_ID-game-ou-over', 'points+rebounds+assists-ANY_PLAYER_ID-game-ou-under'],
      'Blocks + Steals': ['blocks+steals-ANY_PLAYER_ID-game-ou-over', 'blocks+steals-ANY_PLAYER_ID-game-ou-under']
    },

    // NHL Player Props
    'nhl-Skaters': {
      'Goals': ['goals-ANY_PLAYER_ID-game-ou-over', 'goals-ANY_PLAYER_ID-game-ou-under'],
      'Assists': ['assists-ANY_PLAYER_ID-game-ou-over', 'assists-ANY_PLAYER_ID-game-ou-under'],
      'Points (Goals + Assists)': ['points-ANY_PLAYER_ID-game-ou-over', 'points-ANY_PLAYER_ID-game-ou-under'],
      'Shots on Goal': ['shots_onGoal-ANY_PLAYER_ID-game-ou-over', 'shots_onGoal-ANY_PLAYER_ID-game-ou-under'],
      'Hits': ['hits-ANY_PLAYER_ID-game-ou-over', 'hits-ANY_PLAYER_ID-game-ou-under'],
      'Blocked Shots': ['blockedShots-ANY_PLAYER_ID-game-ou-over', 'blockedShots-ANY_PLAYER_ID-game-ou-under'],
      'Penalty Minutes': ['penaltyMinutes-ANY_PLAYER_ID-game-ou-over', 'penaltyMinutes-ANY_PLAYER_ID-game-ou-under'],
      'Power Play Points': ['powerPlayPoints-ANY_PLAYER_ID-game-ou-over', 'powerPlayPoints-ANY_PLAYER_ID-game-ou-under'],
      'Time on Ice': ['timeOnIce-ANY_PLAYER_ID-game-ou-over', 'timeOnIce-ANY_PLAYER_ID-game-ou-under'],
      'Faceoff Wins': ['faceoffWins-ANY_PLAYER_ID-game-ou-over', 'faceoffWins-ANY_PLAYER_ID-game-ou-under'],
      'First Goal Scorer': ['firstGoal-ANY_PLAYER_ID-game-yn-yes', 'firstGoal-ANY_PLAYER_ID-game-yn-no'],
      'Anytime Goal Scorer': ['goals-ANY_PLAYER_ID-game-yn-yes', 'goals-ANY_PLAYER_ID-game-yn-no']
    },
    'nhl-Goalies': {
      'Saves': ['saves-ANY_PLAYER_ID-game-ou-over', 'saves-ANY_PLAYER_ID-game-ou-under'],
      'Goals Against': ['goalsAgainst-ANY_PLAYER_ID-game-ou-over', 'goalsAgainst-ANY_PLAYER_ID-game-ou-under'],
      'Save Percentage': ['savePercentage-ANY_PLAYER_ID-game-ou-over', 'savePercentage-ANY_PLAYER_ID-game-ou-under'],
      'Shutout': ['shutout-ANY_PLAYER_ID-game-yn-yes', 'shutout-ANY_PLAYER_ID-game-yn-no'],
      'Win': ['win-ANY_PLAYER_ID-game-yn-yes', 'win-ANY_PLAYER_ID-game-yn-no']
    },

    // Soccer Player Props (Champions League & MLS)
    'soccer-Forwards': {
      'Goals': ['goals-ANY_PLAYER_ID-game-ou-over', 'goals-ANY_PLAYER_ID-game-ou-under'],
      'Shots on Target': ['shots_onTarget-ANY_PLAYER_ID-game-ou-over', 'shots_onTarget-ANY_PLAYER_ID-game-ou-under'],
      'Shots': ['shots-ANY_PLAYER_ID-game-ou-over', 'shots-ANY_PLAYER_ID-game-ou-under'],
      'Assists': ['assists-ANY_PLAYER_ID-game-ou-over', 'assists-ANY_PLAYER_ID-game-ou-under'],
      'Fouls Committed': ['fouls-ANY_PLAYER_ID-game-ou-over', 'fouls-ANY_PLAYER_ID-game-ou-under'],
      'Cards Received': ['cards-ANY_PLAYER_ID-game-ou-over', 'cards-ANY_PLAYER_ID-game-ou-under'],
      'First Goal Scorer': ['firstGoal-ANY_PLAYER_ID-game-yn-yes', 'firstGoal-ANY_PLAYER_ID-game-yn-no'],
      'Anytime Goal Scorer': ['goals-ANY_PLAYER_ID-game-yn-yes', 'goals-ANY_PLAYER_ID-game-yn-no']
    },
    'soccer-Midfielders': {
      'Passes Completed': ['passesCompleted-ANY_PLAYER_ID-game-ou-over', 'passesCompleted-ANY_PLAYER_ID-game-ou-under'],
      'Pass Completion %': ['passCompletionPercentage-ANY_PLAYER_ID-game-ou-over', 'passCompletionPercentage-ANY_PLAYER_ID-game-ou-under'],
      'Tackles': ['tackles-ANY_PLAYER_ID-game-ou-over', 'tackles-ANY_PLAYER_ID-game-ou-under'],
      'Assists': ['assists-ANY_PLAYER_ID-game-ou-over', 'assists-ANY_PLAYER_ID-game-ou-under'],
      'Shots': ['shots-ANY_PLAYER_ID-game-ou-over', 'shots-ANY_PLAYER_ID-game-ou-under'],
      'Fouls Committed': ['fouls-ANY_PLAYER_ID-game-ou-over', 'fouls-ANY_PLAYER_ID-game-ou-under'],
      'Cards Received': ['cards-ANY_PLAYER_ID-game-ou-over', 'cards-ANY_PLAYER_ID-game-ou-under']
    },
    'soccer-Defenders': {
      'Tackles': ['tackles-ANY_PLAYER_ID-game-ou-over', 'tackles-ANY_PLAYER_ID-game-ou-under'],
      'Clearances': ['clearances-ANY_PLAYER_ID-game-ou-over', 'clearances-ANY_PLAYER_ID-game-ou-under'],
      'Blocks': ['blocks-ANY_PLAYER_ID-game-ou-over', 'blocks-ANY_PLAYER_ID-game-ou-under'],
      'Interceptions': ['interceptions-ANY_PLAYER_ID-game-ou-over', 'interceptions-ANY_PLAYER_ID-game-ou-under'],
      'Fouls Committed': ['fouls-ANY_PLAYER_ID-game-ou-over', 'fouls-ANY_PLAYER_ID-game-ou-under'],
      'Cards Received': ['cards-ANY_PLAYER_ID-game-ou-over', 'cards-ANY_PLAYER_ID-game-ou-under']
    },
    'soccer-Goalkeepers': {
      'Saves': ['saves-ANY_PLAYER_ID-game-ou-over', 'saves-ANY_PLAYER_ID-game-ou-under'],
      'Goals Conceded': ['goalsConceded-ANY_PLAYER_ID-game-ou-over', 'goalsConceded-ANY_PLAYER_ID-game-ou-under'],
      'Clean Sheet': ['cleanSheet-ANY_PLAYER_ID-game-yn-yes', 'cleanSheet-ANY_PLAYER_ID-game-yn-no'],
      'Punches/Catches': ['punchesCatches-ANY_PLAYER_ID-game-ou-over', 'punchesCatches-ANY_PLAYER_ID-game-ou-under']
    },

    // NBA Team Props (direct subtab to oddid mapping)
    'nba-Team Total Points': ['points-home-game-ou-over', 'points-away-game-ou-over', 'points-home-game-ou-under', 'points-away-game-ou-under'],

    // Game Props (direct subtab to oddid mapping)
    'nba-Quarters/Halves': ['points-all-1q-ou-over', 'points-all-1q-ou-under', 'points-all-1h-ou-over', 'points-all-1h-ou-under', 'points-all-2h-ou-over', 'points-all-2h-ou-under'],

    // MLB Team Props
    'mlb-Team Total Runs': ['points-home-game-ou-over', 'points-away-game-ou-over', 'points-home-game-ou-under', 'points-away-game-ou-under', 'points-home-1h-ou-over', 'points-home-1h-ou-under', 'points-away-1h-ou-over', 'points-away-1h-ou-under'],
    'mlb-Team Hits': ['batting_hits-home-game-ou-over', 'batting_hits-away-game-ou-over', 'batting_hits-home-game-ou-under', 'batting_hits-away-game-ou-under'],
    'mlb-Team Home Runs': ['batting_homeRuns-home-game-ou-over', 'batting_homeRuns-away-game-ou-over', 'batting_homeRuns-home-game-ou-under', 'batting_homeRuns-away-game-ou-under'],
    'mlb-Team Strikeouts': ['pitching_strikeouts-home-game-ou-over', 'pitching_strikeouts-away-game-ou-over', 'pitching_strikeouts-home-game-ou-under', 'pitching_strikeouts-away-game-ou-under'],

    // MLB Game Props
    'mlb-Total Hits': ['batting_hits-all-game-ou-over', 'batting_hits-all-game-ou-under'],
    'mlb-Total Home Runs': ['batting_homeRuns-all-game-ou-over', 'batting_homeRuns-all-game-ou-under'],
    'mlb-Total Strikeouts': ['pitching_strikeouts-all-game-ou-over', 'pitching_strikeouts-all-game-ou-under'],
    'mlb-Innings': [],

    // NFL Team Props  
    'nfl-Team Scoring': ['points-home-game-ou-over', 'points-away-game-ou-over', 'points-home-game-ou-under', 'points-away-game-ou-under', 'firstToScore-home-game-ml-home', 'firstToScore-away-game-ml-away'],
    'nfl-Team Stats': ['touchdowns-home-game-ou-over', 'touchdowns-away-game-ou-over', 'touchdowns-home-game-ou-under', 'touchdowns-away-game-ou-under', 'fieldGoals_made-home-game-ou-over', 'fieldGoals_made-away-game-ou-over', 'fieldGoals_made-home-game-ou-under', 'fieldGoals_made-away-game-ou-under', 'turnovers-home-game-ou-over', 'turnovers-away-game-ou-over', 'turnovers-home-game-ou-under', 'turnovers-away-game-ou-under'],

    // NFL Game Props
    'nfl-Quarters/Halves': ['points-all-1q-ou-over', 'points-all-1q-ou-under', 'points-all-2q-ou-over', 'points-all-2q-ou-under', 'points-all-3q-ou-over', 'points-all-3q-ou-under', 'points-all-4q-ou-over', 'points-all-4q-ou-under', 'points-all-1h-ou-over', 'points-all-1h-ou-under', 'points-all-2h-ou-over', 'points-all-2h-ou-under'],

    // NCAAF Team Props (same as NFL)
    'ncaaf-Team Scoring': ['points-home-game-ou-over', 'points-away-game-ou-over', 'points-home-game-ou-under', 'points-away-game-ou-under', 'firstToScore-home-game-ml-home', 'firstToScore-away-game-ml-away'],
    'ncaaf-Team Stats': ['touchdowns-home-game-ou-over', 'touchdowns-away-game-ou-over', 'touchdowns-home-game-ou-under', 'touchdowns-away-game-ou-under', 'fieldGoals_made-home-game-ou-over', 'fieldGoals_made-away-game-ou-over', 'fieldGoals_made-home-game-ou-under', 'fieldGoals_made-away-game-ou-under', 'turnovers-home-game-ou-over', 'turnovers-away-game-ou-over', 'turnovers-home-game-ou-under', 'turnovers-away-game-ou-under'],

    // NCAAF Game Props (same as NFL)
    'ncaaf-Quarters/Halves': ['points-all-1q-ou-over', 'points-all-1q-ou-under', 'points-all-2q-ou-over', 'points-all-2q-ou-under', 'points-all-3q-ou-over', 'points-all-3q-ou-under', 'points-all-4q-ou-over', 'points-all-4q-ou-under', 'points-all-1h-ou-over', 'points-all-1h-ou-under', 'points-all-2h-ou-over', 'points-all-2h-ou-under'],

    // NCAAB Game Props
    'ncaab-Quarters/Halves': ['points-all-1q-ou-over', 'points-all-1q-ou-under', 'points-all-1h-ou-over', 'points-all-1h-ou-under', 'points-all-2h-ou-over', 'points-all-2h-ou-under'],

    // NHL Team Props
    'nhl-Team Total Goals': ['points-home-game-ou-over', 'points-away-game-ou-over', 'points-home-game-ou-under', 'points-away-game-ou-under'],
    'nhl-Team Shots': ['shots_onGoal-home-game-ou-over', 'shots_onGoal-away-game-ou-over', 'shots_onGoal-home-game-ou-under', 'shots_onGoal-away-game-ou-under'],
    'nhl-Team Hits': ['hits-home-game-ou-over', 'hits-away-game-ou-over', 'hits-home-game-ou-under', 'hits-away-game-ou-under'],
    'nhl-Team Penalty Minutes': ['penaltyMinutes-home-game-ou-over', 'penaltyMinutes-away-game-ou-over', 'penaltyMinutes-home-game-ou-under', 'penaltyMinutes-away-game-ou-under'],
    'nhl-Team Scoring': ['firstGoal-home-game-yn-yes', 'firstGoal-away-game-yn-yes', 'lastGoal-home-game-yn-yes', 'lastGoal-away-game-yn-yes'],
    'nhl-Team Power Play': ['powerPlayGoals-home-game-ou-over', 'powerPlayGoals-away-game-ou-over', 'powerPlayGoals-home-game-ou-under', 'powerPlayGoals-away-game-ou-under'],

    // NHL Game Props
    'nhl-Total Shots': ['shots_onGoal-all-game-ou-over', 'shots_onGoal-all-game-ou-under'],
    'nhl-Total Hits': ['hits-all-game-ou-over', 'hits-all-game-ou-under'],
    'nhl-Total Penalty Minutes': ['penaltyMinutes-all-game-ou-over', 'penaltyMinutes-all-game-ou-under'],
    'nhl-Game Flow': ['overtime-all-game-yn-yes', 'overtime-all-game-yn-no', 'shootout-all-game-yn-yes', 'shootout-all-game-yn-no', 'points-all-game-eo-even', 'points-all-game-eo-odd'],
    'nhl-Periods': ['points-all-1p-ou-over', 'points-all-1p-ou-under', 'points-all-2p-ou-over', 'points-all-2p-ou-under', 'points-all-3p-ou-over', 'points-all-3p-ou-under'],

    // Soccer Team Props
    'soccer-Team Total Goals': ['points-home-game-ou-over', 'points-away-game-ou-over', 'points-home-game-ou-under', 'points-away-game-ou-under'],
    'soccer-Team Shots': ['shots-home-game-ou-over', 'shots-away-game-ou-over', 'shots-home-game-ou-under', 'shots-away-game-ou-under'],
    'soccer-Team Corners': ['corners-home-game-ou-over', 'corners-away-game-ou-over', 'corners-home-game-ou-under', 'corners-away-game-ou-under'],
    'soccer-Team Cards': ['cards-home-game-ou-over', 'cards-away-game-ou-over', 'cards-home-game-ou-under', 'cards-away-game-ou-under'],
    'soccer-Team Scoring': ['firstGoal-home-game-yn-yes', 'firstGoal-away-game-yn-yes', 'lastGoal-home-game-yn-yes', 'lastGoal-away-game-yn-yes'],
    'soccer-Team Defense': ['cleanSheet-home-game-yn-yes', 'cleanSheet-away-game-yn-yes', 'cleanSheet-home-game-yn-no', 'cleanSheet-away-game-yn-no'],

    // Soccer Game Props
    'soccer-Total Shots': ['shots-all-game-ou-over', 'shots-all-game-ou-under'],
    'soccer-Total Corners': ['corners-all-game-ou-over', 'corners-all-game-ou-under'],
    'soccer-Total Cards': ['cards-all-game-ou-over', 'cards-all-game-ou-under'],
    'soccer-Game Flow': ['extraTime-all-game-yn-yes', 'extraTime-all-game-yn-no', 'penaltyShootout-all-game-yn-yes', 'penaltyShootout-all-game-yn-no', 'points-all-game-eo-even', 'points-all-game-eo-odd'],
    'soccer-Halves': ['points-all-1h-ou-over', 'points-all-1h-ou-under', 'points-all-2h-ou-over', 'points-all-2h-ou-under']
  };

  // Copy mappings for similar sports
  marketOddIds['ncaaf-Offense'] = marketOddIds['nfl-Offense'];
  marketOddIds['ncaaf-Defense'] = marketOddIds['nfl-Defense'];
  
  marketOddIds['ncaab-Scoring'] = marketOddIds['nba-Scoring'];
  marketOddIds['ncaab-Rebounding'] = marketOddIds['nba-Rebounding'];
  marketOddIds['ncaab-Playmaking'] = marketOddIds['nba-Playmaking'];
  marketOddIds['ncaab-Combo Props'] = marketOddIds['nba-Combo Props'];
  
  marketOddIds['wnba-Scoring'] = marketOddIds['nba-Scoring'];
  marketOddIds['wnba-Rebounding'] = marketOddIds['nba-Rebounding'];
  marketOddIds['wnba-Playmaking'] = marketOddIds['nba-Playmaking'];
  marketOddIds['wnba-Combo Props'] = marketOddIds['nba-Combo Props'];
  
  // Copy NBA Team Props to WNBA
  marketOddIds['wnba-Team Total Points'] = marketOddIds['nba-Team Total Points'];
  
  // Copy NBA Game Props to WNBA
  marketOddIds['wnba-Quarters/Halves'] = marketOddIds['nba-Quarters/Halves'];
  
  // Copy NBA Team Props to NCAAB
  marketOddIds['ncaab-Team Total Points'] = marketOddIds['nba-Team Total Points'];
  
  // Copy NBA Game Props to NCAAB
  marketOddIds['ncaab-Quarters/Halves'] = marketOddIds['nba-Quarters/Halves'];
  
  // Copy NFL Team Props to NCAAF
  marketOddIds['ncaaf-Team Scoring'] = marketOddIds['nfl-Team Scoring'];
  marketOddIds['ncaaf-Team Stats'] = marketOddIds['nfl-Team Stats'];
  
  // Copy NFL Game Props to NCAAF
  marketOddIds['ncaaf-Quarters/Halves'] = marketOddIds['nfl-Quarters/Halves'];
  
  // Build key for lookup
  const lookupKey = `${sportKey}-${subTab}`;
  const marketMap = marketOddIds[lookupKey];
  
  // For Team Props and Game Props, the mapping is direct (no nested marketTab)
  if (mainTab === 'Team Props' || mainTab === 'Game Props') {
    const directKey = `${sportKey}-${marketTab}`;
    const result = marketOddIds[directKey];
    return Array.isArray(result) ? result : [];
  }
  
  // For Player Props, use nested structure
  if (!marketMap || !marketTab) {
    return [];
  }
  
  return marketMap[marketTab] || [];
};

export default function OddsModal({ isVisible, onClose, game, league }: OddsModalProps) {
  const [selectedMainTab, setSelectedMainTab] = useState<MainTabType>('Main Lines');
  const [selectedSubTab, setSelectedSubTab] = useState<string>('');
  const [selectedMarketTab, setSelectedMarketTab] = useState<string>('');
  const [odds, setOdds] = useState<DatabaseOdds[]>([]);
  const [isLoadingOdds, setIsLoadingOdds] = useState(false);
  const [oddsError, setOddsError] = useState<string | null>(null);
  const [isOddsDetailModalVisible, setIsOddsDetailModalVisible] = useState(false);
  const [selectedOddsDetail, setSelectedOddsDetail] = useState<{
    eventId: string;
    oddId: string;
    marketName: string;
    playerName?: string;
    teamName?: string;
    line?: string;
    currentOdds: number;
    side?: string;
  } | null>(null);

  // Line navigation state for props with multiple alt lines
  const [currentLineIndex, setCurrentLineIndex] = useState<Record<string, number>>({});

  // Helper function to find index of line with odds closest to 100
  const findClosestTo100Index = (sortedLines: Array<[string, any]>): number => {
    let closestIndex = 0;
    let closestDiff = Infinity;
    
    sortedLines.forEach(([lineValue, lineOdds], index) => {
      const { over: overOdd, under: underOdd, home: homeOdd, away: awayOdd, draw: drawOdd } = lineOdds;
      
      // Get all available odds for this line
      const availableOdds = [overOdd, underOdd, homeOdd, awayOdd, drawOdd]
        .filter(odd => odd && odd.bookodds !== undefined)
        .map(odd => Math.abs(getBookOdds(odd)));
      
      if (availableOdds.length > 0) {
        // Find the odds closest to 100 in this line
        const lineClosest = Math.min(...availableOdds.map(odds => Math.abs(odds - 100)));
        if (lineClosest < closestDiff) {
          closestDiff = lineClosest;
          closestIndex = index;
        }
      }
    });
    
    return closestIndex;
  };

  // Helper functions for line navigation
  const getCurrentLineIndex = (playerName: string, sortedLines?: Array<[string, any]>): number => {
    if (currentLineIndex[playerName] !== undefined) {
      return currentLineIndex[playerName];
    }
    // Default to line with odds closest to 100
    if (sortedLines && sortedLines.length > 0) {
      const defaultIndex = findClosestTo100Index(sortedLines);
      setPlayerLineIndex(playerName, defaultIndex);
      return defaultIndex;
    }
    return 0;
  };

  const setPlayerLineIndex = (playerName: string, index: number) => {
    setCurrentLineIndex(prev => ({ ...prev, [playerName]: index }));
  };

  const navigateToNextLine = (playerName: string, maxIndex: number) => {
    const current = getCurrentLineIndex(playerName);
    const next = current >= maxIndex ? 0 : current + 1;
    setPlayerLineIndex(playerName, next);
  };

  const navigateToPrevLine = (playerName: string, maxIndex: number) => {
    const current = getCurrentLineIndex(playerName);
    const prev = current <= 0 ? maxIndex : current - 1;
    setPlayerLineIndex(playerName, prev);
  };

  // Track scroll position for each player's wheel
  const scrollRefs = useRef<Record<string, any>>({});
  const scrollTimeouts = useRef<Record<string, NodeJS.Timeout>>({});

  // Handle scroll wheel momentum and navigation (Horizontal)
  const handleScrollWheel = (playerName: string, maxIndex: number, event: any) => {
    const { contentOffset } = event.nativeEvent;
    const scrollX = contentOffset.x; // Use X for horizontal scrolling
    
    // Clear existing timeout
    if (scrollTimeouts.current[playerName]) {
      clearTimeout(scrollTimeouts.current[playerName]);
    }
    
    // Calculate which line should be active based on scroll position
    const itemWidth = 32; // Width of each scroll item (horizontal)
    const wheelWidth = 150; // Width of the scroll container
    
    // Calculate target index accounting for the center selection and blank tab offset
    // We need to find which item is currently centered in the wheel
    // The center of the wheel is at wheelWidth/2, adjust scrollX accordingly
    let targetLineIndex = Math.round((scrollX + (wheelWidth / 2 - itemWidth / 2)) / itemWidth) - 2; // -2 for two blank tabs at start
    
    // Clamp to valid range
    targetLineIndex = Math.max(0, Math.min(maxIndex, targetLineIndex));
    
    // Debounce the line change to avoid too frequent updates
    scrollTimeouts.current[playerName] = setTimeout(() => {
      const currentPlayerLineIndex = currentLineIndex[playerName] || 0;
      
      // Only trigger haptic feedback if the line actually changed
      if (targetLineIndex !== currentPlayerLineIndex) {
        // Subtle haptic feedback for line changes
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      setPlayerLineIndex(playerName, targetLineIndex);
    }, 100);
  };

  // Reset scroll position when lines change (Horizontal)
  const resetScrollPosition = (playerName: string, lineIndex: number) => {
    const scrollRef = scrollRefs.current[playerName];
    if (scrollRef) {
      const itemWidth = 32; // Width of each scroll item (horizontal)
      const wheelWidth = 150; // Width of the scroll container
      
      // Calculate scroll position to center the selected item
      // We want item at lineIndex to appear in the center of the wheel
      // With two blank tabs at start, the actual item we want is at position (lineIndex + 2)
      // To center it, we scroll so that item's left is at (wheelWidth/2 - itemWidth/2)
      const targetX = Math.max(0, ((lineIndex + 2) * itemWidth) - (wheelWidth / 2 - itemWidth / 2));
      
      setTimeout(() => {
        scrollRef.scrollTo({ x: targetX, animated: false });
      }, 100);
    }
  };

  // Initialize scroll positions when component updates
  useEffect(() => {
    Object.keys(scrollRefs.current).forEach(playerName => {
      const currentIdx = getCurrentLineIndex(playerName);
      resetScrollPosition(playerName, currentIdx);
    });
  }, [selectedMainTab, selectedSubTab, selectedMarketTab]);

  // Initialize scroll positions when odds data loads
  useEffect(() => {
    if (odds.length > 0) {
      // Wait a bit for refs to be ready, then set scroll positions
      setTimeout(() => {
        Object.keys(scrollRefs.current).forEach(playerName => {
          const currentIdx = getCurrentLineIndex(playerName);
          resetScrollPosition(playerName, currentIdx);
        });
      }, 200);
    }
  }, [odds]);

  // Get sub-tabs for current selection
  const subTabs = getSubTabs(game.sport, league, selectedMainTab);

  // Handle odds button selection
  const handleOddsSelection = (odd: DatabaseOdds) => {
    const marketName = odd.marketname || '';
    let playerName: string | undefined;
    let teamName: string | undefined;
    let side: string | undefined;

    // Determine the side based on oddid
    if (odd.oddid?.includes('-over')) {
      side = 'over';
    } else if (odd.oddid?.includes('-under')) {
      side = 'under';
    } else if (odd.oddid?.includes('-home-')) {
      teamName = game.home_team;
      side = 'home';
    } else if (odd.oddid?.includes('-away-')) {
      teamName = game.away_team;
      side = 'away';
    } else if (odd.oddid && !odd.oddid.includes('-all-') && !odd.oddid.includes('-ml-') && !odd.oddid.includes('-sp-') && !odd.oddid.includes('-ou-')) {
      // Extract player name from oddid for player props
      playerName = parsePlayerName(odd.oddid);
      // Check if it's over/under for player props
      if (odd.oddid?.includes('-over')) {
        side = 'over';
      } else if (odd.oddid?.includes('-under')) {
        side = 'under';
      }
    }

    setSelectedOddsDetail({
      eventId: game.id,
      oddId: odd.oddid || '',
      marketName,
      playerName,
      teamName,
      line: odd.line || (currentLineValue !== 'standard' ? currentLineValue : undefined),
      currentOdds: getBookOdds(odd),
      side,
    });
    setIsOddsDetailModalVisible(true);
  };
  
  // Get market tabs for current sub-tab selection
  const marketTabs = getMarketTabs(game.sport, league, selectedMainTab, selectedSubTab);
  
  // Get relevant oddids for current selection
  const relevantOddIds = getMarketOddIds(game.sport, league, selectedMainTab, selectedSubTab, selectedMarketTab);

  // Fetch odds from Supabase
  const fetchOdds = React.useCallback(async () => {
    if (!game.id) return;

    setIsLoadingOdds(true);
    setOddsError(null);

    try {
      // CHUNKED PAGINATION: Fetch all odds in chunks to bypass server limits
      const allOdds: any[] = [];
      let hasMore = true;
      let offset = 0;
      const chunkSize = 1000; // Use the max we know works
      
      while (hasMore) { // Removed artificial 10k limit to show all odds
        const { data: chunk, error } = await supabase
          .from('odds')
          .select('*')
          .eq('eventid', game.id)
          // Remove .is('score', null) filter temporarily to debug 0-odds issue
          .order('created_at', { ascending: false })
          .range(offset, offset + chunkSize - 1); // Use range() for pagination
        
        if (error) {
          console.error(`❌ Error fetching chunk at offset ${offset}:`, error);
          throw error;
        }
        
        if (!chunk || chunk.length === 0) {
          hasMore = false;
        } else {
          allOdds.push(...chunk);
          // If chunk is smaller than chunkSize, we've reached the end
          if (chunk.length < chunkSize) {
            hasMore = false;
          } else {
            offset += chunkSize;
          }
        }
      }

      setOdds(allOdds);
    } catch (err) {
      console.error('❌ Error fetching odds:', err);
      setOddsError(err instanceof Error ? err.message : 'Failed to fetch odds');
      setOdds([]);
    } finally {
      setIsLoadingOdds(false);
    }
  }, [game.id]);

  // Fetch odds when modal opens
  React.useEffect(() => {
    if (isVisible && game.id) {
      fetchOdds();
      // Reset line indices to ensure we start with closest to 100 odds
      setCurrentLineIndex({});
    }
  }, [isVisible, game.id, fetchOdds]);

  // Initialize selected sub-tab when main tab changes
  React.useEffect(() => {
    const newSubTabs = getSubTabs(game.sport, league, selectedMainTab);
    if (newSubTabs.length > 0) {
      setSelectedSubTab(newSubTabs[0]);
    } else {
      setSelectedSubTab('');
    }
  }, [selectedMainTab, game.sport, league]);

  // Initialize selected market tab when sub-tab changes
  React.useEffect(() => {
    const newMarketTabs = getMarketTabs(game.sport, league, selectedMainTab, selectedSubTab);
    if (newMarketTabs.length > 0) {
      setSelectedMarketTab(newMarketTabs[0]);
    } else {
      setSelectedMarketTab('');
    }
  }, [selectedSubTab, game.sport, league, selectedMainTab]);

  // Format game time
  const formatGameDateTime = (gameTime: string): { date: string; time: string } => {
    const date = new Date(gameTime);
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
    };
  };

  const { date, time } = formatGameDateTime(game.game_time);

  // Filter odds based on current selection
  const getFilteredOdds = (): DatabaseOdds[] => {
    // For Main Lines, get all alternate lines (don't deduplicate by oddid)
    if (selectedMainTab === 'Main Lines') {
      const mainLineOddIds = getMarketOddIds(game.sport, league, selectedMainTab, '', '');
      return odds.filter(odd => mainLineOddIds.includes(odd.oddid));
    }
    
    // For Team Props and Game Props, show odds at subTab level (no marketTab needed)
    if (selectedMainTab === 'Team Props' || selectedMainTab === 'Game Props') {
      if (!selectedSubTab) return [];
      
      // For Team Props and Game Props, the subTab IS the marketTab (flat structure)
      const subTabOddIds = getMarketOddIds(game.sport, league, selectedMainTab, '', selectedSubTab);
      if (!Array.isArray(subTabOddIds) || subTabOddIds.length === 0) return [];
      
      return odds.filter(odd => {
        if (!odd.oddid) return false;
        
        return subTabOddIds.some(pattern => {
          if (pattern.includes('ANY_PLAYER_ID')) {
            const escapedPattern = pattern.replace(/\+/g, '\\+');
            const regexPattern = escapedPattern.replace('ANY_PLAYER_ID', '[A-Za-z0-9_]+');
            const regex = new RegExp(`^${regexPattern}$`);
            return regex.test(odd.oddid);
          } else {
            return odd.oddid === pattern;
          }
        });
      });
    }
    
    // For Player Props, need marketTab selection (3rd level)
    if (selectedMainTab === 'Player Props') {
      if (!selectedMarketTab || relevantOddIds.length === 0) return [];
      
      const filteredOdds = odds.filter(odd => {
        if (!odd.oddid) return false;
        
        return relevantOddIds.some(pattern => {
          if (pattern.includes('ANY_PLAYER_ID')) {
            const escapedPattern = pattern.replace(/\+/g, '\\+');
            const regexPattern = escapedPattern.replace('ANY_PLAYER_ID', '[A-Za-z0-9_]+');
            const regex = new RegExp(`^${regexPattern}$`);
            return regex.test(odd.oddid);
          } else {
            return odd.oddid === pattern;
          }
        });
      });

      // Special filtering for "Anytime Touchdowns" - show players with 0.5 line OR yes/no data
      if (selectedMarketTab === 'Anytime Touchdowns') {
        // Get players who have either 0.5 line odds OR yes/no touchdown odds
        const playersWithAnytimeData = new Set();
        const ynOddsToConvert = []; // Store yes/no odds that need to be converted to 0.5 line
        
        // Find players with 0.5 line odds
        filteredOdds.forEach(odd => {
          if (odd.line === '0.5' && odd.oddid.includes('touchdowns-') && odd.oddid.includes('-game-ou-')) {
            const playerMatch = odd.oddid.match(/touchdowns-([^-]+)-/);
            if (playerMatch) {
              playersWithAnytimeData.add(playerMatch[1]);
            }
          }
        });
        
        // Find players with yes/no touchdown odds (who don't already have 0.5 line)
        filteredOdds.forEach(odd => {
          if (odd.oddid.includes('touchdowns-') && odd.oddid.includes('-game-yn-')) {
            const playerMatch = odd.oddid.match(/touchdowns-([^-]+)-/);
            if (playerMatch && !playersWithAnytimeData.has(playerMatch[1])) {
              playersWithAnytimeData.add(playerMatch[1]);
              
              // Convert yes/no odds to 0.5 line odds
              if (odd.oddid.includes('-yn-yes')) {
                // Convert "yes" to "over 0.5"
                const overOddId = odd.oddid.replace('-yn-yes', '-ou-over');
                ynOddsToConvert.push({
                  ...odd,
                  oddid: overOddId,
                  line: '0.5'
                });
              } else if (odd.oddid.includes('-yn-no')) {
                // Convert "no" to "under 0.5"  
                const underOddId = odd.oddid.replace('-yn-no', '-ou-under');
                ynOddsToConvert.push({
                  ...odd,
                  oddid: underOddId,
                  line: '0.5'
                });
              }
            }
          }
        });
        
        
        // Filter existing odds and add converted yes/no odds
        const baseFilteredOdds = filteredOdds.filter(odd => {
          const playerMatch = odd.oddid.match(/touchdowns-([^-]+)-/);
          if (playerMatch) {
            return playersWithAnytimeData.has(playerMatch[1]);
          }
          return true; // Keep non-player-specific odds
        });
        
        // Add converted yes/no odds to the results
        return [...baseFilteredOdds, ...ynOddsToConvert];
      }

      return filteredOdds;
    }
    
    return [];
  };

  const filteredOdds = getFilteredOdds();

  // Parse player name from oddid
  const parsePlayerName = (oddid: string): string => {
    // Extract player ID from oddid patterns like "batting_hits-PLAYER_ID-game-ou-over"
    const parts = oddid.split('-');
    if (parts.length >= 2) {
      const playerPart = parts[1];
      
      // Convert underscore/camelCase to proper name format
      let name = playerPart
        .replace(/_/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space before capital letters
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      
      // Remove number and league suffixes like "1 mlb", "2 nba", etc.
      name = name.replace(/\s+\d+\s+(mlb|nba|nfl|nhl|wnba|ncaaf|ncaab|mls)$/gi, '');
      
      // Handle common formatting issues
      name = name.replace(/\bJr\b/gi, 'Jr.');
      name = name.replace(/\bSr\b/gi, 'Sr.');
      name = name.replace(/\bIii\b/gi, 'III');
      name = name.replace(/\bIi\b/gi, 'II');
      
      return name || 'Unknown Player';
    }
    return 'Unknown Player';
  };

  // Parse team name from oddid
  const parseTeamName = (oddid: string, game: Game): string => {
    if (oddid.includes('-home-')) {
      return `${game.home_team} (Home)`;
    } else if (oddid.includes('-away-')) {
      return `${game.away_team} (Away)`;
    }
    return 'Team';
  };

  // Parse prop name from oddid
  const parsePropName = (oddid: string): string => {
    const parts = oddid.split('-');
    if (parts.length >= 1) {
      const statPart = parts[0];
      const scopePart = parts[1]; // all, home, away, player
      const contextPart = parts[2]; // 1i, 1h, 1q, 2q, game, etc.
      
      // Handle inning/period specific props
      let contextName = '';
      if (contextPart === '1i') {
        contextName = ' (1st Inning)';
      } else if (contextPart === '1h') {
        contextName = ' (1st Half)';
      } else if (contextPart === '2h') {
        contextName = ' (2nd Half)';
      } else if (contextPart === '1ix3') {
        contextName = ' (Innings 1-3)';
      } else if (contextPart === '1ix5') {
        contextName = ' (Innings 1-5)';
      } else if (contextPart === '1ix7') {
        contextName = ' (Innings 1-7)';
      } else if (contextPart === '2i') {
        contextName = ' (2nd Inning)';
      } else if (contextPart === '3i') {
        contextName = ' (3rd Inning)';
      } else if (contextPart === '4i') {
        contextName = ' (4th Inning)';
      } else if (contextPart === '5i') {
        contextName = ' (5th Inning)';
      } else if (contextPart === '8i') {
        contextName = ' (8th Inning)';
      } else if (contextPart === '1q') {
        contextName = ' (1st Quarter)';
      } else if (contextPart === '2q') {
        contextName = ' (2nd Quarter)';
      } else if (contextPart === '3q') {
        contextName = ' (3rd Quarter)';
      } else if (contextPart === '4q') {
        contextName = ' (4th Quarter)';
      }
      
      // Convert stat names to readable format (sport-specific)
      const sportLower = game.sport?.toLowerCase() || '';
      const leagueLower = league?.toLowerCase() || '';
      
      let pointsLabel = 'Total Points';
      if (sportLower.includes('baseball') || leagueLower === 'mlb') {
        pointsLabel = 'Total Runs';
      }
      
      const statMappings: Record<string, string> = {
        'points': pointsLabel,
        'rebounds': 'Rebounds', 
        'assists': 'Assists',
        'batting_hits': 'Total Hits',
        'batting_homeRuns': 'Total Home Runs',
        'batting_RBI': 'RBIs',
        'pitching_strikeouts': 'Total Strikeouts',
        'passing_yards': 'Passing Yards',
        'rushing_yards': 'Rushing Yards',
        'receiving_yards': 'Receiving Yards',
        'goals': 'Goals',
        'saves': 'Saves',
        'shots_onGoal': 'Shots on Goal',
        'touchdowns': 'Touchdowns',
        'fieldGoals_made': 'Field Goals Made',
        'threePointers_made': 'Three-Pointers Made',
        'steals': 'Steals',
        'blocks': 'Blocks',
        'turnovers': 'Turnovers',
        'firstToScore': 'First to Score',
        'lastToScore': 'Last to Score'
      };
      
      const baseName = statMappings[statPart] || statPart.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim();
      return baseName + contextName;
    }
    return 'Prop';
  };

  // Get bookodds (guaranteed to be available)
  const getBookOdds = (odd: DatabaseOdds): number => {
    return odd.bookodds || 0;
  };

  // Format odds display
  const formatOdds = (odds: number): string => {
    // Handle 0 odds as +100
    if (odds === 0) {
      return '+100';
    }
    // Handle infinity values
    if (!isFinite(odds)) {
      return '+100';
    }
    if (odds > 0) {
      return `+${odds}`;
    }
    return odds.toString();
  };

  const renderMainTab = (tab: MainTabType) => (
    <TouchableOpacity
      key={tab}
      style={[
        styles.mainTab,
        selectedMainTab === tab && styles.mainTabActive,
      ]}
      onPress={() => setSelectedMainTab(tab)}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.mainTabText,
        selectedMainTab === tab && styles.mainTabTextActive,
      ]}>
        {tab}
      </Text>
    </TouchableOpacity>
  );

  const renderSubTab = (tab: string) => (
    <TouchableOpacity
      key={tab}
      style={[
        styles.subTab,
        selectedSubTab === tab && styles.subTabActive,
      ]}
      onPress={() => setSelectedSubTab(tab)}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.subTabText,
        selectedSubTab === tab && styles.subTabTextActive,
      ]}>
        {tab}
      </Text>
    </TouchableOpacity>
  );

  const renderMarketTab = (tab: string) => (
    <TouchableOpacity
      key={tab}
      style={[
        styles.marketTab,
        selectedMarketTab === tab && styles.marketTabActive,
      ]}
      onPress={() => setSelectedMarketTab(tab)}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.marketTabText,
        selectedMarketTab === tab && styles.marketTabTextActive,
      ]}>
        {tab}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.gameInfoContainer}>
            <View style={styles.matchupContainer}>
              <View style={styles.teamContainer}>
                <Text style={styles.teamLabel}>AWAY</Text>
                <Text style={styles.teamName}>{game.away_team}</Text>
              </View>
              <View style={styles.vsContainer}>
                <TrueSharpShield size={16} variant="light" style={styles.shieldIcon} />
                <Text style={styles.vsText}>@</Text>
              </View>
              <View style={styles.teamContainer}>
                <Text style={styles.teamLabel}>HOME</Text>
                <Text style={styles.teamName}>{game.home_team}</Text>
              </View>
            </View>
            <View style={styles.gameDetailsContainer}>
              <Text style={styles.dateTimeText}>
                {date} • {time}
              </Text>
            </View>
          </View>
        </View>

        {/* Main Tabs */}
        <View style={styles.mainTabsSection}>
          <View style={styles.mainTabsContainer}>
            {MAIN_TABS.map(renderMainTab)}
          </View>
        </View>

        {/* Sub Tabs */}
        {subTabs.length > 0 && (
          <View style={styles.subTabsSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.subTabsContainer}
              style={styles.subTabsScrollView}
            >
              {subTabs.map(renderSubTab)}
            </ScrollView>
          </View>
        )}

        {/* Market Tabs (Third Level) */}
        {marketTabs.length > 0 && (
          <View style={styles.marketTabsSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.marketTabsContainer}
              style={styles.marketTabsScrollView}
            >
              {marketTabs.map(renderMarketTab)}
            </ScrollView>
          </View>
        )}

        {/* Content Area - Live Odds */}
        <ScrollView 
          style={styles.contentArea} 
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          bounces={false}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.placeholderContent}>
            
            {/* Loading State */}
            {isLoadingOdds && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Loading odds...</Text>
              </View>
            )}

            {/* Error State */}
            {oddsError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Error: {oddsError}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchOdds}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Odds Data */}
            {!isLoadingOdds && !oddsError && (
              <>
                {/* Show odds based on selection level */}
                {(selectedMainTab === 'Main Lines') || 
                 (selectedMainTab === 'Team Props' && selectedSubTab) ||
                 (selectedMainTab === 'Game Props' && selectedSubTab) ||
                 (selectedMainTab === 'Player Props' && selectedMarketTab) ? (
                  <>
                    
                    {filteredOdds.length > 0 ? (
                      selectedMainTab === 'Main Lines' ? (
                        // Main Lines: Three sections (Moneyline, Spread, Total)
                        (() => {
                          // Handle both regular sports and soccer patterns
                          const moneylineOdds = filteredOdds.filter(odd => 
                            odd.oddid.includes('-ml-') || 
                            odd.oddid.includes('reg-ml-') || 
                            odd.oddid.includes('reg-ml3way-')
                          );
                          const spreadOdds = filteredOdds.filter(odd => 
                            odd.oddid.includes('-sp-') || 
                            odd.oddid.includes('reg-sp-')
                          );
                          const totalOdds = filteredOdds.filter(odd => 
                            odd.oddid.includes('-ou-') || 
                            odd.oddid.includes('reg-ou-')
                          );

                          const renderMainLineSection = (title: string, odds: DatabaseOdds[], marketType: 'ml' | 'sp' | 'ou') => {
                            if (odds.length === 0) return null;

                            // Group by home/away or over/under
                            const groupedOdds = new Map<string, DatabaseOdds[]>();
                            odds.forEach(odd => {
                              let groupKey = '';
                              if (marketType === 'ml' || marketType === 'sp') {
                                groupKey = odd.oddid.includes('-home-') || odd.oddid.includes('home-') ? 'home' : 
                                          odd.oddid.includes('-away-') || odd.oddid.includes('away-') ? 'away' : 'draw';
                              } else {
                                groupKey = odd.oddid.includes('-over') ? 'over' : 'under';
                              }
                              
                              if (!groupedOdds.has(groupKey)) {
                                groupedOdds.set(groupKey, []);
                              }
                              groupedOdds.get(groupKey)!.push(odd);
                            });

                            // Sort within each group based on market type
                            groupedOdds.forEach((odds) => {
                              if (marketType === 'ml') {
                                // For moneyline: Sort by highest value odds (best for user)
                                odds.sort((a, b) => {
                                  const oddsA = getBookOdds(a);
                                  const oddsB = getBookOdds(b);
                                  return oddsB - oddsA; // Descending order (highest first)
                                });
                              } else {
                                // For spread/total: Sort by line value to maintain order
                                odds.sort((a, b) => {
                                  if (a.line && b.line) {
                                    const lineA = parseFloat(a.line);
                                    const lineB = parseFloat(b.line);
                                    if (!isNaN(lineA) && !isNaN(lineB)) {
                                      return lineA - lineB; // Ascending order by line value
                                    }
                                  }
                                  // Fallback to odds comparison if no line values
                                  const oddsA = getBookOdds(a);
                                  const oddsB = getBookOdds(b);
                                  return Math.abs(Math.abs(oddsA) - 100) - Math.abs(Math.abs(oddsB) - 100);
                                });
                              }
                            });

                            // For spread/total: Find the index of the line with odds closest to -100 for default positioning
                            let defaultScrollIndex = 0;
                            if (marketType === 'sp' || marketType === 'ou') {
                              const awayOrOverOdds = groupedOdds.get(marketType === 'sp' ? 'away' : 'over') || [];
                              if (awayOrOverOdds.length > 0) {
                                let bestOddsIndex = 0;
                                let bestOddsDiff = Math.abs(Math.abs(getBookOdds(awayOrOverOdds[0])) - 100);
                                
                                awayOrOverOdds.forEach((odd, index) => {
                                  const oddsDiff = Math.abs(Math.abs(getBookOdds(odd)) - 100);
                                  if (oddsDiff < bestOddsDiff) {
                                    bestOddsDiff = oddsDiff;
                                    bestOddsIndex = index;
                                  }
                                });
                                defaultScrollIndex = bestOddsIndex;
                              }
                            }

                            return (
                              <View key={title} style={styles.mainLineSection}>
                                <Text style={styles.mainLineSectionTitle}>{title}</Text>
                                <View style={styles.mainLinePairs}>
                                  {marketType === 'ml' && (
                                    <View style={styles.mainLinePair}>
                                      <View style={styles.mainLineRow}>
                                        <Text style={styles.mainLineTeamLabel}>{game.away_team}</Text>
                                        <View style={styles.mainLineButtons}>
                                          {/* Show all available moneyline odds for away team */}
                                          {groupedOdds.get('away')?.map((odd, index) => (
                                            <TouchableOpacity
                                              key={index}
                                              style={[styles.mainLineButton, styles.mainLineButtonMain]}
                                              onPress={() => handleOddsSelection(odd)}
                                              activeOpacity={0.7}
                                            >
                                              <Text style={styles.mainLineButtonText}>
                                                {formatOdds(getBookOdds(odd))}
                                              </Text>
                                            </TouchableOpacity>
                                          ))}
                                        </View>
                                      </View>
                                      <View style={styles.mainLineRow}>
                                        <Text style={styles.mainLineTeamLabel}>{game.home_team}</Text>
                                        <View style={styles.mainLineButtons}>
                                          {/* Show all available moneyline odds for home team */}
                                          {groupedOdds.get('home')?.map((odd, index) => (
                                            <TouchableOpacity
                                              key={index}
                                              style={[styles.mainLineButton, styles.mainLineButtonMain]}
                                              onPress={() => handleOddsSelection(odd)}
                                              activeOpacity={0.7}
                                            >
                                              <Text style={styles.mainLineButtonText}>
                                                {formatOdds(getBookOdds(odd))}
                                              </Text>
                                            </TouchableOpacity>
                                          ))}
                                        </View>
                                      </View>
                                    </View>
                                  )}

                                  {(marketType === 'sp' || marketType === 'ou') && (
                                    <View style={styles.mainLinePair}>
                                      {/* Show pairs side by side */}
                                      <View style={styles.sideBySideContainer}>
                                        <View style={styles.sideContainer}>
                                          <Text style={styles.sideLabel}>
                                            {marketType === 'sp' ? game.away_team : 'Over'}
                                          </Text>
                                          <ScrollView 
                                            style={styles.alternatesList} 
                                            showsVerticalScrollIndicator={false}
                                            ref={(ref) => {
                                              if (ref && defaultScrollIndex > 0) {
                                                // Scroll to default position after a short delay
                                                setTimeout(() => {
                                                  ref.scrollTo({
                                                    y: defaultScrollIndex * 50, // Approximate height per item
                                                    animated: false
                                                  });
                                                }, 100);
                                              }
                                            }}
                                          >
                                            {groupedOdds.get(marketType === 'sp' ? 'away' : 'over')?.map((odd, index) => (
                                              <TouchableOpacity
                                                key={index}
                                                style={[styles.alternateButton, index === defaultScrollIndex && styles.alternateButtonMain]}
                                                onPress={() => handleOddsSelection(odd)}
                                                activeOpacity={0.7}
                                              >
                                                <Text style={styles.alternateButtonLine}>
                                                  {odd.line || '-'}
                                                </Text>
                                                <Text style={styles.alternateButtonOdds}>
                                                  {formatOdds(getBookOdds(odd))}
                                                </Text>
                                              </TouchableOpacity>
                                            ))}
                                          </ScrollView>
                                        </View>
                                        
                                        <View style={styles.sideContainer}>
                                          <Text style={styles.sideLabel}>
                                            {marketType === 'sp' ? game.home_team : 'Under'}
                                          </Text>
                                          <ScrollView 
                                            style={styles.alternatesList} 
                                            showsVerticalScrollIndicator={false}
                                            ref={(ref) => {
                                              if (ref && defaultScrollIndex > 0) {
                                                // Scroll to default position after a short delay
                                                setTimeout(() => {
                                                  ref.scrollTo({
                                                    y: defaultScrollIndex * 50, // Approximate height per item
                                                    animated: false
                                                  });
                                                }, 100);
                                              }
                                            }}
                                          >
                                            {groupedOdds.get(marketType === 'sp' ? 'home' : 'under')?.map((odd, index) => (
                                              <TouchableOpacity
                                                key={index}
                                                style={[styles.alternateButton, index === defaultScrollIndex && styles.alternateButtonMain]}
                                                onPress={() => handleOddsSelection(odd)}
                                                activeOpacity={0.7}
                                              >
                                                <Text style={styles.alternateButtonLine}>
                                                  {odd.line || '-'}
                                                </Text>
                                                <Text style={styles.alternateButtonOdds}>
                                                  {formatOdds(getBookOdds(odd))}
                                                </Text>
                                              </TouchableOpacity>
                                            ))}
                                          </ScrollView>
                                        </View>
                                      </View>
                                    </View>
                                  )}
                                </View>
                              </View>
                            );
                          };

                          return (
                            <ScrollView 
                              style={styles.mainLinesContainer} 
                              showsVerticalScrollIndicator={false}
                              bounces={false}
                              scrollEventThrottle={16}
                            >
                              {renderMainLineSection('Moneyline', moneylineOdds, 'ml')}
                              {renderMainLineSection('Spread', spreadOdds, 'sp')}
                              {renderMainLineSection('Total', totalOdds, 'ou')}
                            </ScrollView>
                          );
                        })()
                      ) : (
                        // Player Props, Team Props, Game Props: Concise row display
                        (() => {
                          const groupedOdds = new Map<string, Map<string, { over?: DatabaseOdds, under?: DatabaseOdds, home?: DatabaseOdds, away?: DatabaseOdds, draw?: DatabaseOdds, not_draw?: DatabaseOdds }>>();
                          
                          // Group odds by player/team name, then by line value
                          filteredOdds.forEach(odd => {
                            let playerName = '';
                            
                            // Skip even/odd and multiple selection props for Player Props only
                            // Allow yes/no props since they display as over/under format
                            if (selectedMainTab === 'Player Props' && (odd.oddid.includes('-eo-') || odd.oddid.includes('-ms-'))) {
                              return; // Skip even/odd and multiple selection props for player props only
                            }
                            
                            if (selectedMainTab === 'Player Props') {
                              // Only include actual player props (oddids with player IDs, not home/away/all)
                              if (odd.oddid.includes('-home-') || odd.oddid.includes('-away-') || odd.oddid.includes('-all-')) {
                                return; // Skip team/game props that leaked into player props
                              }
                              playerName = parsePlayerName(odd.oddid);
                              
                              // For passing interceptions, only show players who have passing yards odds
                              if (selectedMarketTab === 'Passing Interceptions' && odd.oddid.includes('passing_interceptions')) {
                                const currentPlayerName = parsePlayerName(odd.oddid);
                                const hasPassingYards = odds.some(yardOdd => 
                                  yardOdd.oddid.includes('passing_yards') && 
                                  parsePlayerName(yardOdd.oddid) === currentPlayerName
                                );
                                if (!hasPassingYards) {
                                  return; // Skip defensive players who don't have passing yards
                                }
                              }
                            } else if (selectedMainTab === 'Team Props') {
                              // Only include team props (home/away, not all)
                              if (!odd.oddid.includes('-home-') && !odd.oddid.includes('-away-')) {
                                return; // Skip non-team props
                              }
                              playerName = parseTeamName(odd.oddid, game);
                            } else if (selectedMainTab === 'Game Props') {
                              // Only include game props (all, not home/away/player)
                              if (!odd.oddid.includes('-all-')) {
                                return; // Skip non-game props
                              }
                              playerName = parsePropName(odd.oddid);
                            } else {
                              playerName = parsePropName(odd.oddid);
                            }
                            
                            // Skip odds with no line value for Player Props, Team Props, and Game Props
                            // BUT allow touchdown under odds which may have null line values (they are actually 1.5+ line bets)
                            if ((selectedMainTab === 'Player Props' || selectedMainTab === 'Team Props' || selectedMainTab === 'Game Props') && !odd.line) {
                              // Special handling for touchdown under odds that have null line values
                              const isTouchdownUnder = odd.oddid.includes('touchdown') && odd.oddid.includes('-under');
                              if (!isTouchdownUnder) {
                                return; // Skip odds without line value, except touchdown under odds
                              }
                            }

                            // Skip odds that have no real value (null TrueSharp odds or +100 with no sportsbook data)
                            if (selectedMainTab === 'Player Props' && selectedMarketTab === 'Anytime Touchdowns') {
                              // Check if this odd has any sportsbook data
                              const hasSportsbookData = !!(
                                odd.fanduelodds || odd.draftkingsodds || odd.ceasarsodds || odd.mgmodds ||
                                odd.fanaticsodds || odd.bovadaodds || odd.unibetodds || odd.espnbetodds
                              );
                              
                              // Skip odds with null TrueSharp value and no sportsbook data
                              if ((odd.bookodds === null || odd.bookodds === 100) && !hasSportsbookData) {
                                return; // Skip odds with no real data
                              }
                            }
                            
                            if (!groupedOdds.has(playerName)) {
                              groupedOdds.set(playerName, new Map());
                            }
                            
                            // Special handling for touchdown under odds with null line values
                            let lineKey = odd.line || 'standard';
                            if (!odd.line && odd.oddid.includes('touchdown') && odd.oddid.includes('-under')) {
                              // These null line touchdown under odds are actually for anytime touchdowns (0.5 line)
                              // Extract player name and find the corresponding 0.5 over odd
                              const playerMatch = odd.oddid.match(/touchdowns-([^-]+)-/);
                              if (playerMatch) {
                                const playerNameFromOddid = playerMatch[1];
                                // Look for corresponding 0.5 over odd first (anytime touchdown)
                                const correspondingOverOdd = odds.find(o => 
                                  o.oddid.includes(`touchdowns-${playerNameFromOddid}-`) && 
                                  o.oddid.includes('-over') && 
                                  o.line === '0.5'
                                );
                                if (correspondingOverOdd) {
                                  lineKey = '0.5'; // This is the anytime touchdown line
                                } else {
                                  // If no 0.5 line found, check for other lines and pick the lowest
                                  const anyOverOdd = odds.find(o => 
                                    o.oddid.includes(`touchdowns-${playerNameFromOddid}-`) && 
                                    o.oddid.includes('-over') && 
                                    o.line
                                  );
                                  if (anyOverOdd) {
                                    lineKey = anyOverOdd.line;
                                  } else {
                                    // Default to 0.5 for anytime touchdowns
                                    lineKey = '0.5';
                                  }
                                }
                              }
                            }
                            if (!groupedOdds.get(playerName)!.has(lineKey)) {
                              groupedOdds.get(playerName)!.set(lineKey, {});
                            }
                            
                            if (odd.oddid.includes('-over') || odd.oddid.includes('-yes')) {
                              groupedOdds.get(playerName)!.get(lineKey)!.over = odd;
                            } else if (odd.oddid.includes('-under') || odd.oddid.includes('-no')) {
                              groupedOdds.get(playerName)!.get(lineKey)!.under = odd;
                            } else if (odd.oddid.includes('-home') || odd.oddid.includes('-away')) {
                              // Handle moneyline and spread bets for teams
                              const side = odd.oddid.includes('-home') ? 'home' : 'away';
                              groupedOdds.get(playerName)!.get(lineKey)![side] = odd;
                            } else if (odd.oddid.includes('-draw') || odd.oddid.includes('-not_draw')) {
                              // Handle 3-way moneyline bets
                              const side = odd.oddid.includes('-draw') ? 'draw' : 'not_draw';
                              groupedOdds.get(playerName)!.get(lineKey)![side] = odd;
                            }
                          });

                          return (
                            <ScrollView 
                              style={styles.compactContainer} 
                              showsVerticalScrollIndicator={false}
                              bounces={false}
                              scrollEventThrottle={16}
                            >
                              {Array.from(groupedOdds.entries()).map(([playerName, lines]) => {
                                // Sort lines by value
                                const sortedLines = Array.from(lines.entries()).sort(([a], [b]) => {
                                  if (a === 'standard') return -1;
                                  if (b === 'standard') return 1;
                                  const numA = parseFloat(a);
                                  const numB = parseFloat(b);
                                  if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
                                  return a.localeCompare(b);
                                });

                                // Find the index with odds closest to -100 for default positioning
                                let defaultScrollIndex = 0;
                                if (sortedLines.length > 0) {
                                  let bestOddsDiff = Infinity;
                                  
                                  sortedLines.forEach(([, lineOdds], index) => {
                                    const allOdds = Object.values(lineOdds).filter(Boolean);
                                    if (allOdds.length > 0) {
                                      const minDiff = Math.min(...allOdds.map(odd => Math.abs(Math.abs(getBookOdds(odd)) - 100)));
                                      if (minDiff < bestOddsDiff) {
                                        bestOddsDiff = minDiff;
                                        defaultScrollIndex = index;
                                      }
                                    }
                                  });
                                }

                                const currentIndex = getCurrentLineIndex(playerName, sortedLines);
                                const maxIndex = sortedLines.length - 1;
                                const hasMultipleLines = sortedLines.length > 1;
                                
                                // Get current line data
                                const [currentLineValue, currentLineOdds] = sortedLines[currentIndex] || sortedLines[0];

                                return (
                                  <View key={playerName} style={styles.enhancedRowWithBorder}>
                                    {/* Player Name Section - Left Side */}
                                    <View style={styles.enhancedPlayerSection}>
                                      <Text style={styles.enhancedPlayerName}>
                                        {playerName}
                                      </Text>
                                    </View>
                                    
                                    {/* Odds Section - Right Side */}
                                    <View style={styles.enhancedOddsSection}>
                                      {(() => {
                                          const { over: overOdd, under: underOdd, home: homeOdd, away: awayOdd, draw: drawOdd, not_draw: notDrawOdd } = currentLineOdds;
                                          
                                          // Determine bet type and format accordingly
                                          const isOverUnder = overOdd || underOdd;
                                          const isMoneyline = homeOdd || awayOdd;
                                          const is3Way = drawOdd || notDrawOdd;
                                          
                                          return (
                                            <>
                                              {/* Odds Display */}
                                              <View style={styles.enhancedOddsDisplay}>
                                                {isOverUnder && (
                                                  <>
                                                    {/* Under Button */}
                                                    {underOdd && (
                                                      <TouchableOpacity
                                                        style={[
                                                          styles.enhancedOddsButton, 
                                                          styles.underButton
                                                        ]}
                                                        onPress={() => handleOddsSelection(underOdd)}
                                                        activeOpacity={0.7}
                                                      >
                                                        <Text style={styles.enhancedButtonLine}>
                                                          U{currentLineValue !== 'standard' ? ` ${currentLineValue}` : ''}
                                                        </Text>
                                                        <Text style={styles.enhancedButtonOdds}>
                                                          {formatOdds(getBookOdds(underOdd))}
                                                        </Text>
                                                      </TouchableOpacity>
                                                    )}
                                                    
                                                    {/* Over Button */}
                                                    {overOdd && (
                                                      <TouchableOpacity
                                                        style={[
                                                          styles.enhancedOddsButton, 
                                                          styles.overButton
                                                        ]}
                                                        onPress={() => handleOddsSelection(overOdd)}
                                                        activeOpacity={0.7}
                                                      >
                                                        <Text style={styles.enhancedButtonLine}>
                                                          O{currentLineValue !== 'standard' ? ` ${currentLineValue}` : ''}
                                                        </Text>
                                                        <Text style={styles.enhancedButtonOdds}>
                                                          {formatOdds(getBookOdds(overOdd))}
                                                        </Text>
                                                      </TouchableOpacity>
                                                    )}
                                                  </>
                                                )}
                                                
                                                {isMoneyline && (
                                                  <>
                                                    {/* Home Button */}
                                                    {homeOdd && (
                                                      <TouchableOpacity
                                                        style={[
                                                          styles.enhancedOddsButton, 
                                                          styles.homeButton
                                                        ]}
                                                        onPress={() => handleOddsSelection(homeOdd)}
                                                        activeOpacity={0.7}
                                                      >
                                                        <Text style={styles.enhancedButtonLine}>
                                                          Home{currentLineValue !== 'standard' ? ` ${currentLineValue}` : ''}
                                                        </Text>
                                                        <Text style={styles.enhancedButtonOdds}>
                                                          {formatOdds(getBookOdds(homeOdd))}
                                                        </Text>
                                                      </TouchableOpacity>
                                                    )}
                                                    
                                                    {/* Away Button */}
                                                    {awayOdd && (
                                                      <TouchableOpacity
                                                        style={[
                                                          styles.enhancedOddsButton, 
                                                          styles.awayButton
                                                        ]}
                                                        onPress={() => handleOddsSelection(awayOdd)}
                                                        activeOpacity={0.7}
                                                      >
                                                        <Text style={styles.enhancedButtonLine}>
                                                          Away{currentLineValue !== 'standard' ? ` ${currentLineValue}` : ''}
                                                        </Text>
                                                        <Text style={styles.enhancedButtonOdds}>
                                                          {formatOdds(getBookOdds(awayOdd))}
                                                        </Text>
                                                      </TouchableOpacity>
                                                    )}
                                                  </>
                                                )}
                                                
                                                {is3Way && (
                                                  <>
                                                    {/* Draw Button */}
                                                    {drawOdd && (
                                                      <TouchableOpacity
                                                        style={[
                                                          styles.enhancedOddsButton, 
                                                          styles.overButton
                                                        ]}
                                                        onPress={() => handleOddsSelection(drawOdd)}
                                                        activeOpacity={0.7}
                                                      >
                                                        <Text style={styles.enhancedButtonLine}>
                                                          Draw
                                                        </Text>
                                                        <Text style={styles.enhancedButtonOdds}>
                                                          {formatOdds(getBookOdds(drawOdd))}
                                                        </Text>
                                                      </TouchableOpacity>
                                                    )}
                                                    
                                                    {/* No Draw Button */}
                                                    {notDrawOdd && (
                                                      <TouchableOpacity
                                                        style={[
                                                          styles.enhancedOddsButton, 
                                                          styles.underButton
                                                        ]}
                                                        onPress={() => handleOddsSelection(notDrawOdd)}
                                                        activeOpacity={0.7}
                                                      >
                                                        <Text style={styles.enhancedButtonLine}>
                                                          No Draw
                                                        </Text>
                                                        <Text style={styles.enhancedButtonOdds}>
                                                          {formatOdds(getBookOdds(notDrawOdd))}
                                                        </Text>
                                                      </TouchableOpacity>
                                                    )}
                                                  </>
                                                )}
                                              </View>
                                              
                                              {/* Scrollable Bar */}
                                              {hasMultipleLines ? (
                                                <View style={styles.scrollBarContainer}>
                                                  {/* Inner visual container */}
                                                  <View style={styles.scrollBarInner}>
                                                    <ScrollView
                                                    ref={(ref) => {
                                                      scrollRefs.current[playerName] = ref;
                                                      if (ref) {
                                                        // Set initial scroll position when ref is first set
                                                        setTimeout(() => {
                                                          const currentIdx = getCurrentLineIndex(playerName, sortedLines);
                                                          resetScrollPosition(playerName, currentIdx);
                                                        }, 100);
                                                      }
                                                    }}
                                                    style={styles.scrollBar}
                                                    contentContainerStyle={styles.scrollBarContent}
                                                    horizontal={true}
                                                    showsHorizontalScrollIndicator={false}
                                                    showsVerticalScrollIndicator={false}
                                                    indicatorStyle="default"
                                                    onScroll={(event) => handleScrollWheel(playerName, maxIndex, event)}
                                                    onScrollBeginDrag={() => {
                                                      // Light haptic feedback when starting to scroll
                                                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                    }}
                                                    scrollEventThrottle={16}
                                                    bounces={true}
                                                    decelerationRate="normal"
                                                    directionalLockEnabled={true}
                                                    alwaysBounceHorizontal={true}
                                                    nestedScrollEnabled={true}
                                                    scrollEnabled={true}
                                                    simultaneousHandlers={[]}
                                                    disallowInterruption={true}
                                                    pagingEnabled={false}
                                                    pinchGestureEnabled={false}
                                                    onTouchStart={() => {
                                                      // Ensure this scroll view gets priority
                                                    }}
                                                    onResponderGrant={() => true}
                                                    onStartShouldSetResponder={() => true}
                                                    onMoveShouldSetResponder={() => true}
                                                  >
                                                    {/* Create scrollable line indicators with blank tabs at left and right */}
                                                    {Array.from({ length: maxIndex + 5 }).map((_, index) => {
                                                      // Add blank tabs at start (index 0, 1) and end (maxIndex + 3, maxIndex + 4)
                                                      const isBlankTab = index < 2 || index > maxIndex + 1;
                                                      const actualIndex = index - 2; // Offset by 2 for the two blank tabs at start
                                                      const isActive = !isBlankTab && actualIndex === currentIndex;
                                                      
                                                      return (
                                                        <View 
                                                          key={index} 
                                                          style={[
                                                            styles.scrollBarItem,
                                                            isActive && styles.scrollBarItemActive
                                                          ]}
                                                        >
                                                          {!isBlankTab && (
                                                            <View style={[
                                                              styles.scrollBarIndicator,
                                                              { 
                                                                backgroundColor: isActive 
                                                                  ? theme.colors.primary 
                                                                  : theme.colors.text.secondary,
                                                              }
                                                            ]} />
                                                          )}
                                                        </View>
                                                      );
                                                    })}
                                                    </ScrollView>
                                                  </View>
                                                </View>
                                              ) : (
                                                <View style={styles.scrollBarDisabled}>
                                                  <View style={styles.scrollBarIndicatorDisabled} />
                                                </View>
                                              )}
                                            </>
                                          );
                                        })()}
                                    </View>
                                  </View>
                                );
                              })}
                            </ScrollView>
                          );
                        })()
                      )
                    ) : (
                      <View style={styles.noOddsContainer}>
                        <Text style={styles.noOddsText}>
                          No odds for this market, check back soon
                        </Text>
                        <Text style={styles.noOddsSubtext}>
                          {selectedMainTab === 'Team Props' || selectedMainTab === 'Game Props'
                            ? 'Most betting markets are available in Player Props or Main Lines'
                            : `Looking for ${selectedMainTab} - ${selectedSubTab} ${selectedMarketTab && `- ${selectedMarketTab}`}`
                          }
                        </Text>
                      </View>
                    )}
                  </>
                ) : (
                  <>
                    <Text style={styles.placeholderSubtitle}>
                      {selectedMainTab === 'Player Props' 
                        ? 'Select a market to view available odds' 
                        : selectedMainTab === 'Team Props' || selectedMainTab === 'Game Props'
                        ? 'Select a category to view available odds'
                        : 'Select a market to view available odds'
                      }
                    </Text>
                    <Text style={styles.placeholderDetails}>
                      Total odds in database: {odds.length}
                    </Text>
                  </>
                )}
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Odds Detail Modal */}
      {selectedOddsDetail && (
        <OddsDetailModal
          visible={isOddsDetailModalVisible}
          onClose={() => setIsOddsDetailModalVisible(false)}
          eventId={selectedOddsDetail.eventId}
          oddId={selectedOddsDetail.oddId}
          marketName={selectedOddsDetail.marketName}
          playerName={selectedOddsDetail.playerName}
          teamName={selectedOddsDetail.teamName}
          line={selectedOddsDetail.line}
          currentOdds={selectedOddsDetail.currentOdds}
          gameTime={game.game_time}
          side={selectedOddsDetail.side}
        />
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  
  // Header
  header: {
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
  },
  gameInfoContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
  },
  matchupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  teamContainer: {
    flex: 1,
    alignItems: 'center',
  },
  teamLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.inverse,
    opacity: 0.8,
    marginBottom: theme.spacing.xs / 2,
    letterSpacing: 1,
  },
  teamName: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.inverse,
    textAlign: 'center',
  },
  vsContainer: {
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
  },
  shieldIcon: {
    marginBottom: theme.spacing.xs / 2,
  },
  vsText: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.inverse,
    opacity: 0.7,
  },
  gameDetailsContainer: {
    alignItems: 'center',
  },
  dateTimeText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.inverse,
    textAlign: 'center',
    opacity: 0.9,
  },
  closeButton: {
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
  },

  // Main Tabs
  mainTabsSection: {
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  mainTabsScrollView: {
    paddingHorizontal: theme.spacing.sm,
  },
  mainTabsContainer: {
    flexDirection: 'row',
    paddingVertical: theme.spacing.xs + 2,
    paddingHorizontal: theme.spacing.sm,
  },
  mainTab: {
    flex: 1,
    paddingVertical: theme.spacing.xs + 2,
    paddingHorizontal: theme.spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.sm,
    marginHorizontal: theme.spacing.xs / 2,
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
    backgroundColor: 'transparent',
    minHeight: 36,
  },
  mainTabActive: {
    borderBottomColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}10`,
  },
  mainTabText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  mainTabTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.bold,
  },

  // Sub Tabs
  subTabsSection: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  subTabsScrollView: {
    paddingHorizontal: theme.spacing.sm,
  },
  subTabsContainer: {
    paddingVertical: theme.spacing.xs + 2,
    paddingRight: theme.spacing.sm,
    alignItems: 'center',
  },
  subTab: {
    paddingHorizontal: theme.spacing.sm - 2,
    paddingVertical: theme.spacing.xs + 1,
    marginRight: theme.spacing.xs + 2,
    borderRadius: theme.borderRadius.md,
    borderWidth: 0.8,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    minHeight: 30,
  },
  subTabActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  subTabText: {
    fontSize: theme.typography.fontSize.xs + 1,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  subTabTextActive: {
    color: theme.colors.text.inverse,
    fontWeight: theme.typography.fontWeight.semibold,
  },

  // Market Tabs (Third Level)
  marketTabsSection: {
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  marketTabsScrollView: {
    paddingHorizontal: theme.spacing.sm,
  },
  marketTabsContainer: {
    paddingVertical: theme.spacing.xs + 1,
    paddingRight: theme.spacing.sm,
    alignItems: 'center',
  },
  marketTab: {
    paddingHorizontal: theme.spacing.sm - 2,
    paddingVertical: theme.spacing.xs - 1,
    marginRight: theme.spacing.xs - 1,
    borderRadius: theme.borderRadius.xs,
    borderWidth: 0.8,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    minHeight: 26,
  },
  marketTabActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  marketTabText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  marketTabTextActive: {
    color: theme.colors.text.inverse,
    fontWeight: theme.typography.fontWeight.semibold,
  },

  // Content Area
  contentArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    paddingBottom: theme.spacing.xl * 2, // Add extra bottom padding for better scrolling
  },
  placeholderContent: {
    padding: theme.spacing.sm,
  },
  placeholderTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  placeholderSubtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  placeholderDetails: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.light,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  placeholderItem: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  placeholderItemText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  
  // Odd IDs Display
  oddIdsContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  oddIdText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    fontFamily: 'monospace',
    marginBottom: theme.spacing.xs / 2,
    lineHeight: theme.typography.fontSize.xs * 1.4,
  },
  
  // Coming Soon
  comingSoonContainer: {
    backgroundColor: `${theme.colors.primary}10`,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}30`,
    alignItems: 'center',
  },
  comingSoonTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  comingSoonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: theme.typography.fontSize.sm * 1.5,
  },

  // Loading & Error States
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
  },
  loadingText: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  errorContainer: {
    backgroundColor: `${theme.colors.status.error}10`,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    alignItems: 'center',
  },
  errorText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.status.error,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  retryButton: {
    backgroundColor: theme.colors.status.error,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  retryButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },

  // Odds Display
  oddsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  
  // Main Lines Display
  mainLinesContainer: {
    flex: 1,
    padding: theme.spacing.sm,
  },
  mainLineSection: {
    marginBottom: theme.spacing.xl,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  mainLineSectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  mainLinePairs: {
    padding: theme.spacing.sm,
  },
  mainLinePair: {
    marginBottom: theme.spacing.sm,
  },
  mainLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  mainLineTeamLabel: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    flex: 1,
  },
  mainLineButtons: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  mainLineButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg, // More rounded corners
    minWidth: 85, // Slightly larger for consistency
    height: 44, // Standard height
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  mainLineButtonMain: {
    backgroundColor: theme.colors.primary,
    borderWidth: 2,
    borderColor: theme.colors.accent || theme.colors.primary,
  },
  mainLineButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
  },
  sideBySideContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  sideContainer: {
    flex: 1,
  },
  sideLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
  },
  alternatesList: {
    maxHeight: 200,
  },
  alternateButton: {
    backgroundColor: theme.colors.background,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg, // More rounded corners
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44, // Standard height
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  alternateButtonMain: {
    backgroundColor: theme.colors.primary + '20',
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  alternateButtonLine: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
  },
  alternateButtonOdds: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },

  // Props Display
  propsContainer: {
    flex: 1,
    padding: theme.spacing.sm,
  },
  propGroup: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  propGroupHeader: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  propGroupName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  propGroupSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs / 2,
  },
  propLines: {
    padding: theme.spacing.sm,
  },
  propLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  propLineLeft: {
    flex: 1,
  },
  propLineLabel: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
  },
  propLineValue: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs / 2,
  },
  propLineButtons: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  propButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    minWidth: 120,
    alignItems: 'center',
  },
  propButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    textAlign: 'center',
  },

  // Compact Display for Props
  compactContainer: {
    flex: 1,
    paddingHorizontal: theme.spacing.xs,
    paddingTop: theme.spacing.xs,
  },
  compactRowWithBorder: {
    flexDirection: 'column',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    marginVertical: 1,
    marginHorizontal: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 0.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 1.5,
    elevation: 1,
  },
  compactPlayerName: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs / 2,
    textAlign: 'left',
  },
  compactScrollContainer: {
    flex: 1,
  },
  compactScrollView: {
    flex: 1,
  },
  compactLinePair: {
    marginBottom: theme.spacing.xs / 2,
    backgroundColor: 'rgba(0,0,0,0.015)',
    borderRadius: theme.borderRadius.xs,
    paddingVertical: theme.spacing.xs / 2,
    paddingHorizontal: theme.spacing.xs,
  },
  compactTwoColumnLayout: {
    flexDirection: 'row',
    // justifyContent: 'space-between', // REMOVED - causes ScrollView error
    // alignItems: 'center', // REMOVED - causes ScrollView error
  },
  compactColumn: {
    flex: 1,
    // alignItems: 'center', // REMOVED - causes ScrollView error
    // justifyContent: 'center', // REMOVED - causes ScrollView error
  },
  
  // Additional button styles for different bet types
  homeButton: {
    backgroundColor: '#1e40af', // Blue for home
    borderColor: '#1e3a8a',
  },
  awayButton: {
    backgroundColor: '#dc2626', // Red for away
    borderColor: '#b91c1c',
  },
  drawButton: {
    backgroundColor: '#6b7280', // Gray for draw
    borderColor: '#4b5563',
  },
  
  compactBetSection: {
    flexDirection: 'row',
    // justifyContent: 'space-between', // REMOVED - causes ScrollView error
    // alignItems: 'center', // REMOVED - causes ScrollView error
    marginBottom: theme.spacing.xs,
  },
  
  compactLineLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  compactButtonMain: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  compactButton: {
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.xs + 2,
    borderRadius: theme.borderRadius.xs,
    flex: 1,
    minHeight: 36,
    // alignItems: 'center', // REMOVED - causes ScrollView error
    // justifyContent: 'center', // REMOVED - causes ScrollView error
    borderWidth: 0.5,
    marginHorizontal: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 0.5,
    },
    shadowOpacity: 0.08,
    shadowRadius: 0.8,
    elevation: 0.5,
  },
  underButton: {
    backgroundColor: '#e11d48', // Vibrant red
    borderColor: '#be185d',
  },
  overButton: {
    backgroundColor: '#059669', // Vibrant green
    borderColor: '#047857',
  },
  compactButtonLine: {
    color: '#ffffff',
    fontSize: theme.typography.fontSize.xs - 1,
    fontWeight: theme.typography.fontWeight.bold,
    textAlign: 'center',
    marginBottom: 1,
    letterSpacing: 0.2,
  },
  compactButtonOdds: {
    color: '#ffffff',
    fontSize: theme.typography.fontSize.sm - 1,
    fontWeight: theme.typography.fontWeight.black,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  
  // Enhanced navigation layout styles
  enhancedRowWithBorder: {
    flexDirection: 'row',
    alignItems: 'center', // Center items vertically
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    marginVertical: 2,
    marginHorizontal: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 0.5,
    borderColor: theme.colors.border,
    minHeight: 56, // Ensure consistent row height
    backgroundColor: theme.colors.card,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 1.5,
    elevation: 1,
    minHeight: 60,
  },
  enhancedPlayerSection: {
    flex: 0.4,
    paddingRight: theme.spacing.sm,
    justifyContent: 'center', // Center content vertically
    alignItems: 'center', // Center content horizontally
  },
  enhancedPlayerName: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    lineHeight: 18,
  },
  enhancedOddsSection: {
    flex: 0.6,
    flexDirection: 'column', // Stack odds buttons and scroll wheel vertically
    justifyContent: 'center',
    alignItems: 'flex-end', // Align everything to the right
  },
  navigationArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  navigationArrowDisabled: {
    opacity: 0.3,
  },
  enhancedOddsDisplay: {
    flexDirection: 'row',
    justifyContent: 'center', // Center the buttons
    alignItems: 'center',
    marginHorizontal: theme.spacing.xs,
    gap: theme.spacing.xs, // Add gap between buttons
  },
  enhancedOddsButton: {
    width: 75, // Fixed width for consistency
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg, // More rounded corners
    height: 44, // Fixed height
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enhancedButtonLine: {
    color: '#ffffff',
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    textAlign: 'center',
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  enhancedButtonOdds: {
    color: '#ffffff',
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.black,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  lineIndicator: {
    position: 'absolute',
    top: 4,
    right: 6,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 16,
  },
  lineIndicatorText: {
    color: '#ffffff',
    fontSize: theme.typography.fontSize.xs - 2,
    fontWeight: theme.typography.fontWeight.bold,
    textAlign: 'center',
  },
  // Scrollable Bar Styles (Horizontal)
  scrollBarContainer: {
    width: 150, // Wide enough for horizontal scrolling
    height: 44, // Slightly taller for better touch area
    backgroundColor: 'transparent', // Transparent background for larger touch area
    position: 'relative',
    marginTop: 2, // Minimal space above scroll wheel
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Inner visual scroll area
  scrollBarInner: {
    width: '100%',
    height: 32, // Taller for better visibility and touch
    backgroundColor: theme.colors.surface,
    borderTopWidth: 2, // Only top border
    borderBottomWidth: 2, // Only bottom border
    borderLeftWidth: 0, // No left border
    borderRightWidth: 0, // No right border
    borderColor: theme.colors.border,
    borderRadius: 0, // No rounded corners
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  scrollBar: {
    flex: 1,
    width: '100%',
  },
  scrollBarContent: {
    paddingHorizontal: theme.spacing.sm, // Reduced horizontal padding
    flexDirection: 'row', // Arrange items horizontally
  },
  scrollBarItem: {
    width: 32, // Width instead of height for horizontal layout
    height: '100%',
    paddingHorizontal: 4,
    paddingVertical: 2, // Reduced vertical padding significantly
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollBarItemActive: {
    backgroundColor: `${theme.colors.primary}15`,
  },
  scrollBarIndicator: {
    width: 8, // Even smaller to fit very narrow container
    height: 3, // Keep height the same
    borderRadius: 2, // More rounded
    marginHorizontal: 'auto',
    marginVertical: 'auto',
  },
  // Remove text styles as we're using dashes only
  scrollBarDisabled: {
    width: 150, // Match the horizontal width
    height: 32, // Match the new taller height
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1.5, // Only top border
    borderBottomWidth: 1.5, // Only bottom border
    borderLeftWidth: 0, // No left border
    borderRightWidth: 0, // No right border
    borderColor: theme.colors.border,
    borderRadius: 0, // No rounded corners
    paddingHorizontal: 4,
    paddingVertical: 2,
    opacity: 0.5,
  },
  scrollBarIndicatorDisabled: {
    width: 8, // Match the active indicator width
    height: 3,
    borderRadius: 2,
    backgroundColor: theme.colors.text.secondary,
    marginHorizontal: 'auto',
    marginVertical: 'auto',
  },
  // Remove disabled text styles as we're using dashes only
  scrollItemActive: {
    // Active item styling
  },
  scrollIndicatorTop: {
    position: 'absolute',
    top: 2,
    left: 0,
    right: 0,
    zIndex: 1,
    backgroundColor: theme.colors.surface,
    opacity: 0.8,
    paddingLeft: '50%',
    transform: [{ translateX: -4 }], // Center the chevron
  },
  scrollIndicatorBottom: {
    position: 'absolute',
    bottom: 2,
    left: 0,
    right: 0,
    zIndex: 1,
    backgroundColor: theme.colors.surface,
    opacity: 0.8,
    paddingLeft: '50%',
    transform: [{ translateX: -4 }], // Center the chevron
  },
  
  oddButton: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg, // Increased border radius for more rounded corners
    padding: theme.spacing.md, // Slightly increased padding
    minWidth: '30%',
    maxWidth: '32%',
    borderWidth: 1.5, // Slightly thicker border
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3, // Enhanced shadow for iOS
    flex: 1,
  },
  oddButtonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.xs,
  },
  oddIdLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    fontFamily: 'monospace',
    flex: 1,
    marginRight: theme.spacing.xs,
  },
  sportsbookLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
    textTransform: 'uppercase',
  },
  lineLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.light,
    marginBottom: theme.spacing.xs,
  },
  oddsValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  
  // No Odds State
  noOddsContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.sm,
    alignItems: 'center',
  },
  noOddsText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  noOddsSubtext: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.light,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
});