export interface MarketCategory {
  id: string;
  label: string;
  icon: string;
  subcategories?: MarketSubcategory[];
}

export interface MarketSubSubcategory {
  id: string;
  label: string;
  markets: string[];
}

export interface MarketSubcategory {
  id: string;
  label: string;
  markets?: string[];
  subcategories?: MarketSubSubcategory[];
}

export interface SportMarketConfig {
  mainLines: {
    markets: string[];
  };
  playerProps: MarketSubcategory[];
  teamProps: {
    markets?: string[];
    subcategories?: MarketSubcategory[];
  };
  gameProps: {
    markets?: string[];
    subcategories?: MarketSubcategory[];
  };
}

export const sportsMarketConfigs: Record<string, SportMarketConfig> = {
  // Baseball (MLB) - Updated from games-page.md
  'baseball_mlb': {
    mainLines: {
      markets: [
        'Moneyline', // points-home-game-ml-home, points-away-game-ml-away
        'Run Line (-1.5)', // points-home-game-sp-home, points-away-game-sp-away  
        'Total Runs Over/Under' // points-all-game-ou-over, points-all-game-ou-under
      ]
    },
    playerProps: [
      {
        id: 'hitters',
        label: 'Hitters',
        markets: [
          'Hits Over/Under', // batting_hits-ANY_PLAYER_ID-game-ou-over/under
          'Home Runs Over/Under', // batting_homeRuns-ANY_PLAYER_ID-game-ou-over/under
          'RBIs Over/Under', // batting_RBI-ANY_PLAYER_ID-game-ou-over/under
          'Runs Scored Over/Under', // points-ANY_PLAYER_ID-game-ou-over/under
          'Total Bases Over/Under', // batting_totalBases-ANY_PLAYER_ID-game-ou-over/under
          'Singles Over/Under', // batting_singles-ANY_PLAYER_ID-game-ou-over/under
          'Doubles Over/Under', // batting_doubles-ANY_PLAYER_ID-game-ou-over/under
          'Triples Over/Under', // batting_triples-ANY_PLAYER_ID-game-ou-over/under
          'Stolen Bases Over/Under', // batting_stolenBases-ANY_PLAYER_ID-game-ou-over/under
          'Strikeouts Over/Under', // batting_strikeouts-ANY_PLAYER_ID-game-ou-over/under
          'Walks Over/Under', // batting_basesOnBalls-ANY_PLAYER_ID-game-ou-over/under
          'Hits + Runs + RBIs Over/Under', // batting_hits+runs+rbi-ANY_PLAYER_ID-game-ou-over/under
          'Fantasy Score Over/Under', // fantasyScore-ANY_PLAYER_ID-game-ou-over/under
          'First Home Run Yes/No', // batting_firstHomeRun-ANY_PLAYER_ID-game-yn-yes/no
          'First Run Scored Yes/No', // firstToScore-ANY_PLAYER_ID-game-yn-yes/no
          'Last Run Scored Yes/No' // lastToScore-ANY_PLAYER_ID-game-yn-yes/no
        ]
      },
      {
        id: 'pitchers',
        label: 'Pitchers',
        markets: [
          'Strikeouts Over/Under', // pitching_strikeouts-ANY_PLAYER_ID-game-ou-over/under
          'Hits Allowed Over/Under', // pitching_hits-ANY_PLAYER_ID-game-ou-over/under
          'Earned Runs Allowed Over/Under', // pitching_earnedRuns-ANY_PLAYER_ID-game-ou-over/under
          'Walks Allowed Over/Under', // pitching_basesOnBalls-ANY_PLAYER_ID-game-ou-over/under
          'Home Runs Allowed Over/Under', // pitching_homeRunsAllowed-ANY_PLAYER_ID-game-ou-over/under
          'Pitches Thrown Over/Under', // pitching_pitchesThrown-ANY_PLAYER_ID-game-ou-over/under
          'Outs Recorded Over/Under', // pitching_outs-ANY_PLAYER_ID-game-ou-over/under
          'Pitching Win Yes/No' // pitching_win-ANY_PLAYER_ID-game-yn-yes/no
        ]
      }
    ],
    teamProps: {
      markets: [
        'Team Total Runs Over/Under', // points-home/away-game-ou-over/under
        'Team Home Runs Over/Under', // batting_homeRuns-home/away-game-ou-over/under
        'Team Strikeouts Over/Under', // pitching_strikeouts-home/away-game-ou-over/under
        'Team Hits Over/Under', // pitching_hits-home/away-game-ou-over/under
        'Team Any Runs Yes/No', // points-home/away-game-yn-yes/no
        'Team Any Home Runs Yes/No' // batting_homeRuns-home/away-game-yn-yes/no
      ]
    },
    gameProps: {
      markets: [
        'Total Home Runs Over/Under', // batting_homeRuns-all-game-ou-over/under
        'Total Strikeouts Over/Under', // pitching_strikeouts-all-game-ou-over/under
        'Total Hits Over/Under', // pitching_hits-all-game-ou-over/under
        'Runs Even/Odd', // points-all-game-eo-even/odd
        'Home Runs Even/Odd', // batting_homeRuns-all-game-eo-even/odd
        'Any Runs Yes/No', // points-all-game-yn-yes/no
        'Any Home Runs Yes/No', // batting_homeRuns-all-game-yn-yes/no
        'First Inning Runs Yes/No', // points-all-1i-yn-yes/no
        'First Inning Home Run Yes/No' // batting_homeRuns-all-1i-yn-yes/no
      ]
    }
  },

  // Football (NFL) - Updated from games-page.md
  'americanfootball_nfl': {
    mainLines: {
      markets: [
        'Point Spread', // points-home-game-sp-home, points-away-game-sp-away
        'Total Points Over/Under', // points-all-game-ou-over, points-all-game-ou-under
        'Moneyline' // points-home-game-ml-home, points-away-game-ml-away
      ]
    },
    playerProps: [
      {
        id: 'quarterback',
        label: 'Quarterback',
        markets: [
          'Passing Yards Over/Under', // passing_yards-ANY_PLAYER_ID-game-ou-over/under
          'Passing Touchdowns Over/Under', // passing_touchdowns-ANY_PLAYER_ID-game-ou-over/under
          'Interceptions Over/Under', // defense_interceptions-ANY_PLAYER_ID-game-ou-over/under
          'Completions Over/Under', // passing_completions-ANY_PLAYER_ID-game-ou-over/under
          'Passing Attempts Over/Under', // passing_attempts-ANY_PLAYER_ID-game-ou-over/under
          'Longest Completion Over/Under', // passing_longestCompletion-ANY_PLAYER_ID-game-ou-over/under
          'Rushing Yards Over/Under', // rushing_yards-ANY_PLAYER_ID-game-ou-over/under
          'Rushing Touchdowns Over/Under', // rushing_touchdowns-ANY_PLAYER_ID-game-ou-over/under
          'Passing + Rushing Yards Over/Under', // passing+rushing_yards-ANY_PLAYER_ID-game-ou-over/under
          'Passer Rating Over/Under' // passing_passerRating-ANY_PLAYER_ID-game-ou-over/under
        ]
      },
      {
        id: 'running-back',
        label: 'Running Back',
        markets: [
          'Rushing Yards Over/Under', // rushing_yards-ANY_PLAYER_ID-game-ou-over/under
          'Rushing Touchdowns Over/Under', // rushing_touchdowns-ANY_PLAYER_ID-game-ou-over/under
          'Rushing Attempts Over/Under', // rushing_attempts-ANY_PLAYER_ID-game-ou-over/under
          'Receptions Over/Under', // receiving_receptions-ANY_PLAYER_ID-game-ou-over/under
          'Receiving Yards Over/Under', // receiving_yards-ANY_PLAYER_ID-game-ou-over/under
          'Receiving Touchdowns Over/Under', // receiving_touchdowns-ANY_PLAYER_ID-game-ou-over/under
          'Longest Rush Over/Under', // rushing_longestRush-ANY_PLAYER_ID-game-ou-over/under
          'Rushing + Receiving Yards Over/Under' // rushing+receiving_yards-ANY_PLAYER_ID-game-ou-over/under
        ]
      },
      {
        id: 'receiver',
        label: 'Wide Receiver/TE',
        markets: [
          'Receiving Yards Over/Under', // receiving_yards-ANY_PLAYER_ID-game-ou-over/under
          'Receptions Over/Under', // receiving_receptions-ANY_PLAYER_ID-game-ou-over/under
          'Receiving Touchdowns Over/Under', // receiving_touchdowns-ANY_PLAYER_ID-game-ou-over/under
          'Longest Reception Over/Under', // receiving_longestReception-ANY_PLAYER_ID-game-ou-over/under
          'Rushing Yards Over/Under', // rushing_yards-ANY_PLAYER_ID-game-ou-over/under
          'Rushing Touchdowns Over/Under' // rushing_touchdowns-ANY_PLAYER_ID-game-ou-over/under
        ]
      },
      {
        id: 'kicker-defense',
        label: 'Kicker/Defense',
        markets: [
          'Kicking Points Over/Under', // kicking_totalPoints-ANY_PLAYER_ID-game-ou-over/under
          'Field Goals Made Over/Under', // fieldGoals_made-ANY_PLAYER_ID-game-ou-over/under
          'Extra Points Made Over/Under', // extraPoints_kicksMade-ANY_PLAYER_ID-game-ou-over/under
          'Longest Field Goal Over/Under', // fieldGoals_longestMade-ANY_PLAYER_ID-game-ou-over/under
          'Sacks Over/Under', // defense_sacks-ANY_PLAYER_ID-game-ou-over/under
          'Interceptions Over/Under', // defense_interceptions-ANY_PLAYER_ID-game-ou-over/under
          'Fumble Recoveries Over/Under', // defense_fumbleRecoveries-ANY_PLAYER_ID-game-ou-over/under
          'Defensive Touchdowns Over/Under', // defense_touchdowns-ANY_PLAYER_ID-game-ou-over/under
          'Tackles Over/Under' // defense_tackles-ANY_PLAYER_ID-game-ou-over/under
        ]
      },
      {
        id: 'any-player',
        label: 'Any Player',
        markets: [
          'Fantasy Score Over/Under', // fantasyScore-ANY_PLAYER_ID-game-ou-over/under
          'Turnovers Over/Under', // turnovers-ANY_PLAYER_ID-game-ou-over/under
          'First Touchdown Yes/No', // firstTouchdown-ANY_PLAYER_ID-game-yn-yes/no
          'Last Touchdown Yes/No', // lastTouchdown-ANY_PLAYER_ID-game-yn-yes/no
          'First Score Yes/No', // firstToScore-ANY_PLAYER_ID-game-yn-yes/no
          'Anytime Touchdown Yes/No' // touchdowns-ANY_PLAYER_ID-game-yn-yes/no
        ]
      }
    ],
    teamProps: {
      markets: [
        'Team Total Points Over/Under', // points-home/away-game-ou-over/under
        'Team Total Touchdowns Over/Under', // touchdowns-home/away-game-ou-over/under
        'Team Total Field Goals Over/Under', // fieldGoals_made-home/away-game-ou-over/under
        'Team to Score First', // firstToScore-home/away-game-yn-yes
        'Team to Score Last', // lastToScore-home/away-game-yn-yes
        'Team Any Touchdowns Yes/No', // touchdowns-home/away-game-yn-yes/no
        'Team Any Field Goals Yes/No', // fieldGoals_made-home/away-game-yn-yes/no
        'Team Total Turnovers Over/Under', // turnovers-home/away-game-ou-over/under
        'Team Total Sacks Over/Under', // defense_sacks-home/away-game-ou-over/under
        'Team Total Tackles Over/Under' // defense_tackles-home/away-game-ou-over/under
      ]
    },
    gameProps: {
      markets: [
        'Total Touchdowns Over/Under', // touchdowns-all-game-ou-over/under
        'Total Field Goals Over/Under', // fieldGoals_made-all-game-ou-over/under
        'Total Turnovers Over/Under', // turnovers-all-game-ou-over/under
        'Total Sacks Over/Under', // defense_sacks-all-game-ou-over/under
        'Game to Go to Overtime', // overtime-all-game-yn-yes/no
        'First Score Type (TD/FG/Safety)', // firstScore-all-game-ms-touchdown/fieldgoal/safety
        'Last Score Type (TD/FG/Safety)', // lastScore-all-game-ms-touchdown/fieldgoal/safety
        'Points Scored Even/Odd', // points-all-game-eo-even/odd
        'Longest Touchdown Over/Under', // longestTouchdown-all-game-ou-over/under
        'First Quarter Points Over/Under', // points-all-1q-ou-over/under
        'First Half Points Over/Under', // points-all-1h-ou-over/under
        'Second Half Points Over/Under', // points-all-2h-ou-over/under
        'Times Tied Over/Under' // timesTied-all-game-ou-over/under
      ]
    }
  },

  // Football (NCAAF)
  'americanfootball_ncaaf': {
    mainLines: {
      markets: ['Point Spread', 'Total Points Over/Under', 'Moneyline']
    },
    playerProps: [
      {
        id: 'quarterback',
        label: 'Quarterback',
        markets: [
          'Passing Yards Over/Under',
          'Passing Touchdowns Over/Under',
          'Interceptions Over/Under',
          'Completions Over/Under',
          'Rushing Yards Over/Under',
          'Rushing Touchdowns Over/Under'
        ]
      },
      {
        id: 'running-back',
        label: 'Running Back',
        markets: [
          'Rushing Yards Over/Under',
          'Rushing Touchdowns Over/Under',
          'Rushing Attempts Over/Under',
          'Receptions Over/Under',
          'Receiving Yards Over/Under'
        ]
      },
      {
        id: 'receiver',
        label: 'Wide Receiver/TE',
        markets: [
          'Receiving Yards Over/Under',
          'Receptions Over/Under',
          'Receiving Touchdowns Over/Under',
          'Rushing Yards Over/Under'
        ]
      },
      {
        id: 'kicker-defense',
        label: 'Kicker/Defense',
        markets: [
          'Kicking Points Over/Under',
          'Field Goals Made Over/Under',
          'Sacks Over/Under',
          'Interceptions Over/Under'
        ]
      }
    ],
    teamProps: {
      markets: [
        'Team Total Points Over/Under',
        'Team Total Touchdowns Over/Under',
        'Team Total Field Goals Over/Under',
        'Team to Score First',
        'Team Total Turnovers Over/Under',
        'Team Total Penalties Over/Under'
      ]
    },
    gameProps: {
      markets: [
        'Total Touchdowns Over/Under',
        'Total Field Goals Over/Under',
        'Total Turnovers Over/Under',
        'Game to Go to Overtime',
        'First Score Type (TD/FG/Safety)',
        'Points Scored Even/Odd',
        'First Quarter Points Over/Under',
        'First Half Points Over/Under'
      ]
    }
  },

  // Basketball (NBA)
  'basketball_nba': {
    mainLines: {
      markets: ['Point Spread', 'Total Points Over/Under', 'Moneyline']
    },
    playerProps: [
      {
        id: 'scoring',
        label: 'Scoring',
        markets: [
          'Points Over/Under',
          'Field Goals Made Over/Under',
          'Field Goal Attempts Over/Under',
          'Three-Pointers Made Over/Under',
          'Three-Point Attempts Over/Under',
          'Free Throws Made Over/Under',
          'Free Throw Attempts Over/Under',
          'Fantasy Score Over/Under'
        ]
      },
      {
        id: 'rebounding',
        label: 'Rebounding',
        markets: [
          'Total Rebounds Over/Under',
          'Offensive Rebounds Over/Under',
          'Defensive Rebounds Over/Under'
        ]
      },
      {
        id: 'playmaking',
        label: 'Playmaking',
        markets: [
          'Assists Over/Under',
          'Turnovers Over/Under',
          'Steals Over/Under',
          'Blocks Over/Under'
        ]
      },
      {
        id: 'combinations',
        label: 'Combinations',
        markets: [
          'Points + Rebounds Over/Under',
          'Points + Assists Over/Under',
          'Rebounds + Assists Over/Under',
          'Points + Rebounds + Assists Over/Under',
          'Steals + Blocks Over/Under'
        ]
      },
      {
        id: 'specials',
        label: 'Specials',
        markets: [
          'Double-Double Yes/No',
          'Triple-Double Yes/No',
          'First Basket Yes/No',
          'Last Basket Yes/No'
        ]
      }
    ],
    teamProps: {
      subcategories: [
        {
          id: 'offense',
          label: 'Offense',
          markets: [
            'Team Total Points Over/Under',
            'Team Total Three-Pointers Over/Under',
            'Team to Score First',
            'Team to Score Last'
          ]
        },
        {
          id: 'defense',
          label: 'Defense',
          markets: [
            'Team Total Rebounds Over/Under',
            'Team Total Steals Over/Under',
            'Team Total Blocks Over/Under'
          ]
        },
        {
          id: 'playmaking',
          label: 'Playmaking',
          markets: [
            'Team Total Assists Over/Under',
            'Team Total Turnovers Over/Under'
          ]
        }
      ]
    },
    gameProps: {
      subcategories: [
        {
          id: 'totals',
          label: 'Game Totals',
          markets: [
            'Total Rebounds Over/Under',
            'Total Assists Over/Under',
            'Total Three-Pointers Over/Under',
            'Total Turnovers Over/Under',
            'Total Steals Over/Under',
            'Total Blocks Over/Under'
          ]
        },
        {
          id: 'quarters',
          label: 'Quarter Props',
          markets: [
            'First Quarter Points Over/Under',
            'First Half Points Over/Under',
            'Second Half Points Over/Under'
          ]
        },
        {
          id: 'specials',
          label: 'Game Specials',
          markets: [
            'Game to Go to Overtime',
            'Points Scored Even/Odd',
            'Highest Scoring Quarter',
            'Lowest Scoring Quarter'
          ]
        }
      ]
    }
  },

  // Basketball (NCAAB)
  'basketball_ncaab': {
    mainLines: {
      markets: ['Point Spread', 'Total Points Over/Under', 'Moneyline']
    },
    playerProps: [
      {
        id: 'scoring',
        label: 'Scoring',
        markets: [
          'Points Over/Under',
          'Field Goals Made Over/Under',
          'Three-Pointers Made Over/Under',
          'Free Throws Made Over/Under'
        ]
      },
      {
        id: 'rebounding',
        label: 'Rebounding',
        markets: [
          'Total Rebounds Over/Under',
          'Offensive Rebounds Over/Under',
          'Defensive Rebounds Over/Under'
        ]
      },
      {
        id: 'playmaking',
        label: 'Playmaking',
        markets: [
          'Assists Over/Under',
          'Turnovers Over/Under',
          'Steals Over/Under',
          'Blocks Over/Under'
        ]
      },
      {
        id: 'combo-props',
        label: 'Combo Props',
        markets: [
          'Points + Rebounds Over/Under',
          'Points + Assists Over/Under',
          'Double-Double Yes/No'
        ]
      }
    ],
    teamProps: {
      markets: [
        'Team Total Points Over/Under',
        'Team Total Rebounds Over/Under',
        'Team Total Assists Over/Under',
        'Team Total Three-Pointers Over/Under',
        'Team to Score First'
      ]
    },
    gameProps: {
      markets: [
        'Total Rebounds Over/Under',
        'Total Assists Over/Under',
        'Total Three-Pointers Over/Under',
        'Game to Go to Overtime',
        'First Half Points Over/Under',
        'Second Half Points Over/Under'
      ]
    }
  },

  // Hockey (NHL)
  'icehockey_nhl': {
    mainLines: {
      markets: ['Moneyline', 'Puck Line (-1.5)', 'Total Goals Over/Under']
    },
    playerProps: [
      {
        id: 'skaters',
        label: 'Skaters',
        markets: [
          'Goals Over/Under',
          'Assists Over/Under',
          'Points (Goals + Assists) Over/Under',
          'Shots on Goal Over/Under',
          'Hits Over/Under',
          'Blocked Shots Over/Under',
          'Penalty Minutes Over/Under',
          'Power Play Points Over/Under',
          'Time on Ice Over/Under',
          'Faceoff Wins Over/Under',
          'First Goal Scorer Yes/No',
          'Anytime Goal Scorer Yes/No'
        ]
      },
      {
        id: 'goalies',
        label: 'Goalies',
        markets: [
          'Saves Over/Under',
          'Goals Against Over/Under',
          'Save Percentage Over/Under',
          'Shutout Yes/No',
          'Win Yes/No'
        ]
      }
    ],
    teamProps: {
      markets: [
        'Team Total Goals Over/Under',
        'Team Total Shots Over/Under',
        'Team Total Hits Over/Under',
        'Team Total Penalty Minutes Over/Under',
        'Team to Score First',
        'Team to Score Last',
        'Team Any Goals Yes/No',
        'Team Power Play Goals Over/Under',
        'Team Short-Handed Goals Over/Under'
      ]
    },
    gameProps: {
      markets: [
        'Total Shots on Goal Over/Under',
        'Total Hits Over/Under',
        'Total Penalty Minutes Over/Under',
        'Total Power Plays Over/Under',
        'Game to Go to Overtime',
        'Game to Go to Shootout',
        'Goals Scored Even/Odd',
        'First Goal Time Over/Under',
        'First Period Goals Over/Under',
        'Second Period Goals Over/Under',
        'Third Period Goals Over/Under'
      ]
    }
  },

  // Soccer (Champions League)
  'soccer_uefa_champs_league': {
    mainLines: {
      markets: ['Moneyline (1X2)', 'Asian Handicap', 'Total Goals Over/Under']
    },
    playerProps: [
      {
        id: 'forwards',
        label: 'Forwards',
        markets: [
          'Goals Over/Under',
          'Shots on Target Over/Under',
          'Shots Over/Under',
          'Assists Over/Under',
          'Fouls Committed Over/Under',
          'Cards Received Over/Under',
          'First Goal Scorer Yes/No',
          'Anytime Goal Scorer Yes/No'
        ]
      },
      {
        id: 'midfielders',
        label: 'Midfielders',
        markets: [
          'Passes Completed Over/Under',
          'Pass Completion % Over/Under',
          'Tackles Over/Under',
          'Assists Over/Under',
          'Shots Over/Under',
          'Fouls Committed Over/Under',
          'Cards Received Over/Under'
        ]
      },
      {
        id: 'defenders',
        label: 'Defenders',
        markets: [
          'Tackles Over/Under',
          'Clearances Over/Under',
          'Blocks Over/Under',
          'Interceptions Over/Under',
          'Fouls Committed Over/Under',
          'Cards Received Over/Under'
        ]
      },
      {
        id: 'goalkeepers',
        label: 'Goalkeepers',
        markets: [
          'Saves Over/Under',
          'Goals Conceded Over/Under',
          'Clean Sheet Yes/No',
          'Punches/Catches Over/Under'
        ]
      }
    ],
    teamProps: {
      markets: [
        'Team Total Goals Over/Under',
        'Team Total Shots Over/Under',
        'Team Total Shots on Target Over/Under',
        'Team Total Corners Over/Under',
        'Team Total Cards Over/Under',
        'Team to Score First',
        'Team to Score Last',
        'Team Any Goals Yes/No',
        'Team Clean Sheet Yes/No',
        'Team Total Fouls Over/Under',
        'Team Total Offsides Over/Under'
      ]
    },
    gameProps: {
      markets: [
        'Total Shots Over/Under',
        'Total Shots on Target Over/Under',
        'Total Corners Over/Under',
        'Total Cards Over/Under',
        'Total Fouls Over/Under',
        'Total Offsides Over/Under',
        'Game to Go to Extra Time',
        'Game to Go to Penalty Shootout',
        'Goals Scored Even/Odd',
        'Both Teams to Score Yes/No',
        'First Goal Time Over/Under',
        'First Half Goals Over/Under',
        'Second Half Goals Over/Under'
      ]
    }
  },

  // Soccer (MLS)
  'soccer_usa_mls': {
    mainLines: {
      markets: ['Moneyline (1X2)', 'Asian Handicap', 'Total Goals Over/Under']
    },
    playerProps: [
      {
        id: 'forwards',
        label: 'Forwards',
        markets: [
          'Goals Over/Under',
          'Shots on Target Over/Under',
          'Assists Over/Under',
          'First Goal Scorer Yes/No',
          'Anytime Goal Scorer Yes/No'
        ]
      },
      {
        id: 'midfielders',
        label: 'Midfielders',
        markets: [
          'Passes Completed Over/Under',
          'Tackles Over/Under',
          'Assists Over/Under',
          'Shots Over/Under'
        ]
      },
      {
        id: 'defenders',
        label: 'Defenders',
        markets: [
          'Tackles Over/Under',
          'Clearances Over/Under',
          'Blocks Over/Under',
          'Interceptions Over/Under'
        ]
      },
      {
        id: 'goalkeepers',
        label: 'Goalkeepers',
        markets: [
          'Saves Over/Under',
          'Goals Conceded Over/Under',
          'Clean Sheet Yes/No'
        ]
      }
    ],
    teamProps: {
      markets: [
        'Team Total Goals Over/Under',
        'Team Total Shots Over/Under',
        'Team Total Corners Over/Under',
        'Team Total Cards Over/Under',
        'Team to Score First',
        'Team Clean Sheet Yes/No'
      ]
    },
    gameProps: {
      markets: [
        'Total Shots Over/Under',
        'Total Corners Over/Under',
        'Total Cards Over/Under',
        'Both Teams to Score Yes/No',
        'Goals Scored Even/Odd',
        'First Half Goals Over/Under',
        'Second Half Goals Over/Under'
      ]
    }
  }
};

export const getMarketConfigForSport = (sportKey: string): SportMarketConfig | null => {
  // Handle both short and full sport keys
  const mappings: Record<string, string> = {
    'mlb': 'baseball_mlb',
    'nfl': 'americanfootball_nfl',
    'nba': 'basketball_nba',
    'nhl': 'icehockey_nhl',
    'ncaaf': 'americanfootball_ncaaf',
    'ncaab': 'basketball_ncaab',
    'champions_league': 'soccer_uefa_champs_league',
    'mls': 'soccer_usa_mls'
  };
  
  // Try the original key first, then try the mapped key
  return sportsMarketConfigs[sportKey] || (mappings[sportKey] ? sportsMarketConfigs[mappings[sportKey]] : null) || null;
};