# Complete SportGameOdds API Market Hierarchy

Here's the detailed market hierarchy with the SportGameOdds API market identifiers:

## BASEBALL (MLB)

**MLB**

- Main Lines
  - Moneyline (`points-home-game-ml-home`, `points-away-game-ml-away`)
  - Run Line (-1.5) (`points-home-game-sp-home`, `points-away-game-sp-away`)
  - Total Runs Over/Under (`points-all-game-ou-over`, `points-all-game-ou-under`)
- Player Props
  - Hitters
    - Hits Over/Under (`batting_hits-ANY_PLAYER_ID-game-ou-over`,
      `batting_hits-ANY_PLAYER_ID-game-ou-under`)
    - Home Runs Over/Under (`batting_homeRuns-ANY_PLAYER_ID-game-ou-over`,
      `batting_homeRuns-ANY_PLAYER_ID-game-ou-under`)
    - RBIs Over/Under (`batting_RBI-ANY_PLAYER_ID-game-ou-over`,
      `batting_RBI-ANY_PLAYER_ID-game-ou-under`)
    - Runs Scored Over/Under (`points-ANY_PLAYER_ID-game-ou-over`,
      `points-ANY_PLAYER_ID-game-ou-under`)
    - Total Bases Over/Under (`batting_totalBases-ANY_PLAYER_ID-game-ou-over`,
      `batting_totalBases-ANY_PLAYER_ID-game-ou-under`)
    - Singles Over/Under (`batting_singles-ANY_PLAYER_ID-game-ou-over`,
      `batting_singles-ANY_PLAYER_ID-game-ou-under`)
    - Doubles Over/Under (`batting_doubles-ANY_PLAYER_ID-game-ou-over`,
      `batting_doubles-ANY_PLAYER_ID-game-ou-under`)
    - Triples Over/Under (`batting_triples-ANY_PLAYER_ID-game-ou-over`,
      `batting_triples-ANY_PLAYER_ID-game-ou-under`)
    - Stolen Bases Over/Under (`batting_stolenBases-ANY_PLAYER_ID-game-ou-over`,
      `batting_stolenBases-ANY_PLAYER_ID-game-ou-under`)
    - Strikeouts Over/Under (`batting_strikeouts-ANY_PLAYER_ID-game-ou-over`,
      `batting_strikeouts-ANY_PLAYER_ID-game-ou-under`)
    - Walks Over/Under (`batting_basesOnBalls-ANY_PLAYER_ID-game-ou-over`,
      `batting_basesOnBalls-ANY_PLAYER_ID-game-ou-under`)
    - Hits + Runs + RBIs Over/Under (`batting_hits+runs+rbi-ANY_PLAYER_ID-game-ou-over`,
      `batting_hits+runs+rbi-ANY_PLAYER_ID-game-ou-under`)
    - Fantasy Score Over/Under (`fantasyScore-ANY_PLAYER_ID-game-ou-over`,
      `fantasyScore-ANY_PLAYER_ID-game-ou-under`)
    - First Home Run Yes/No (`batting_firstHomeRun-ANY_PLAYER_ID-game-yn-yes`,
      `batting_firstHomeRun-ANY_PLAYER_ID-game-yn-no`)
    - First Run Scored Yes/No (`firstToScore-ANY_PLAYER_ID-game-yn-yes`,
      `firstToScore-ANY_PLAYER_ID-game-yn-no`)
    - Last Run Scored Yes/No (`lastToScore-ANY_PLAYER_ID-game-yn-yes`,
      `lastToScore-ANY_PLAYER_ID-game-yn-no`)
  - Pitchers
    - Strikeouts Over/Under (`pitching_strikeouts-ANY_PLAYER_ID-game-ou-over`,
      `pitching_strikeouts-ANY_PLAYER_ID-game-ou-under`)
    - Hits Allowed Over/Under (`pitching_hits-ANY_PLAYER_ID-game-ou-over`,
      `pitching_hits-ANY_PLAYER_ID-game-ou-under`)
    - Earned Runs Allowed Over/Under (`pitching_earnedRuns-ANY_PLAYER_ID-game-ou-over`,
      `pitching_earnedRuns-ANY_PLAYER_ID-game-ou-under`)
    - Walks Allowed Over/Under (`pitching_basesOnBalls-ANY_PLAYER_ID-game-ou-over`,
      `pitching_basesOnBalls-ANY_PLAYER_ID-game-ou-under`)
    - Home Runs Allowed Over/Under (`pitching_homeRunsAllowed-ANY_PLAYER_ID-game-ou-over`,
      `pitching_homeRunsAllowed-ANY_PLAYER_ID-game-ou-under`)
    - Pitches Thrown Over/Under (`pitching_pitchesThrown-ANY_PLAYER_ID-game-ou-over`,
      `pitching_pitchesThrown-ANY_PLAYER_ID-game-ou-under`)
    - Outs Recorded Over/Under (`pitching_outs-ANY_PLAYER_ID-game-ou-over`,
      `pitching_outs-ANY_PLAYER_ID-game-ou-under`)
    - Pitching Win Yes/No (`pitching_win-ANY_PLAYER_ID-game-yn-yes`,
      `pitching_win-ANY_PLAYER_ID-game-yn-no`)
- Team Props
  - Team Total Runs Over/Under (`points-home-game-ou-over`, `points-away-game-ou-over`,
    `points-home-game-ou-under`, `points-away-game-ou-under`)
  - Team Home Runs Over/Under (`batting_homeRuns-home-game-ou-over`,
    `batting_homeRuns-away-game-ou-over`, `batting_homeRuns-home-game-ou-under`,
    `batting_homeRuns-away-game-ou-under`)
  - Team Strikeouts Over/Under (`pitching_strikeouts-home-game-ou-over`,
    `pitching_strikeouts-away-game-ou-over`, `pitching_strikeouts-home-game-ou-under`,
    `pitching_strikeouts-away-game-ou-under`)
  - Team Hits Over/Under (`pitching_hits-home-game-ou-over`, `pitching_hits-away-game-ou-over`,
    `pitching_hits-home-game-ou-under`, `pitching_hits-away-game-ou-under`)
  - Team Any Runs Yes/No (`points-home-game-yn-yes`, `points-away-game-yn-yes`,
    `points-home-game-yn-no`, `points-away-game-yn-no`)
  - Team Any Home Runs Yes/No (`batting_homeRuns-home-game-yn-yes`,
    `batting_homeRuns-away-game-yn-yes`, `batting_homeRuns-home-game-yn-no`,
    `batting_homeRuns-away-game-yn-no`)
- Game Props
  - Total Home Runs Over/Under (`batting_homeRuns-all-game-ou-over`,
    `batting_homeRuns-all-game-ou-under`)
  - Total Strikeouts Over/Under (`pitching_strikeouts-all-game-ou-over`,
    `pitching_strikeouts-all-game-ou-under`)
  - Total Hits Over/Under (`pitching_hits-all-game-ou-over`, `pitching_hits-all-game-ou-under`)
  - Runs Even/Odd (`points-all-game-eo-even`, `points-all-game-eo-odd`)
  - Home Runs Even/Odd (`batting_homeRuns-all-game-eo-even`, `batting_homeRuns-all-game-eo-odd`)
  - Any Runs Yes/No (`points-all-game-yn-yes`, `points-all-game-yn-no`)
  - Any Home Runs Yes/No (`batting_homeRuns-all-game-yn-yes`, `batting_homeRuns-all-game-yn-no`)
  - First Inning Runs Yes/No (`points-all-1i-yn-yes`, `points-all-1i-yn-no`)
  - First Inning Home Run Yes/No (`batting_homeRuns-all-1i-yn-yes`, `batting_homeRuns-all-1i-yn-no`)

## FOOTBALL (NFL, NCAAF)

**NFL**

- Main Lines
  - Point Spread (`points-home-game-sp-home`, `points-away-game-sp-away`)
  - Total Points Over/Under (`points-all-game-ou-over`, `points-all-game-ou-under`)
  - Moneyline (`points-home-game-ml-home`, `points-away-game-ml-away`)
- Player Props
  - Quarterback
    - Passing Yards Over/Under (`passing_yards-ANY_PLAYER_ID-game-ou-over`,
      `passing_yards-ANY_PLAYER_ID-game-ou-under`)
    - Passing Touchdowns Over/Under (`passing_touchdowns-ANY_PLAYER_ID-game-ou-over`,
      `passing_touchdowns-ANY_PLAYER_ID-game-ou-under`)
    - Interceptions Over/Under (`defense_interceptions-ANY_PLAYER_ID-game-ou-over`,
      `defense_interceptions-ANY_PLAYER_ID-game-ou-under`)
    - Completions Over/Under (`passing_completions-ANY_PLAYER_ID-game-ou-over`,
      `passing_completions-ANY_PLAYER_ID-game-ou-under`)
    - Passing Attempts Over/Under (`passing_attempts-ANY_PLAYER_ID-game-ou-over`,
      `passing_attempts-ANY_PLAYER_ID-game-ou-under`)
    - Longest Completion Over/Under (`passing_longestCompletion-ANY_PLAYER_ID-game-ou-over`,
      `passing_longestCompletion-ANY_PLAYER_ID-game-ou-under`)
    - Rushing Yards Over/Under (`rushing_yards-ANY_PLAYER_ID-game-ou-over`,
      `rushing_yards-ANY_PLAYER_ID-game-ou-under`)
    - Rushing Touchdowns Over/Under (`rushing_touchdowns-ANY_PLAYER_ID-game-ou-over`,
      `rushing_touchdowns-ANY_PLAYER_ID-game-ou-under`)
    - Passing + Rushing Yards Over/Under (`passing+rushing_yards-ANY_PLAYER_ID-game-ou-over`,
      `passing+rushing_yards-ANY_PLAYER_ID-game-ou-under`)
    - Passer Rating Over/Under (`passing_passerRating-ANY_PLAYER_ID-game-ou-over`,
      `passing_passerRating-ANY_PLAYER_ID-game-ou-under`)
  - Running Back
    - Rushing Yards Over/Under (`rushing_yards-ANY_PLAYER_ID-game-ou-over`,
      `rushing_yards-ANY_PLAYER_ID-game-ou-under`)
    - Rushing Touchdowns Over/Under (`rushing_touchdowns-ANY_PLAYER_ID-game-ou-over`,
      `rushing_touchdowns-ANY_PLAYER_ID-game-ou-under`)
    - Rushing Attempts Over/Under (`rushing_attempts-ANY_PLAYER_ID-game-ou-over`,
      `rushing_attempts-ANY_PLAYER_ID-game-ou-under`)
    - Receptions Over/Under (`receiving_receptions-ANY_PLAYER_ID-game-ou-over`,
      `receiving_receptions-ANY_PLAYER_ID-game-ou-under`)
    - Receiving Yards Over/Under (`receiving_yards-ANY_PLAYER_ID-game-ou-over`,
      `receiving_yards-ANY_PLAYER_ID-game-ou-under`)
    - Receiving Touchdowns Over/Under (`receiving_touchdowns-ANY_PLAYER_ID-game-ou-over`,
      `receiving_touchdowns-ANY_PLAYER_ID-game-ou-under`)
    - Longest Rush Over/Under (`rushing_longestRush-ANY_PLAYER_ID-game-ou-over`,
      `rushing_longestRush-ANY_PLAYER_ID-game-ou-under`)
    - Rushing + Receiving Yards Over/Under (`rushing+receiving_yards-ANY_PLAYER_ID-game-ou-over`,
      `rushing+receiving_yards-ANY_PLAYER_ID-game-ou-under`)
  - Wide Receiver/Tight End
    - Receiving Yards Over/Under (`receiving_yards-ANY_PLAYER_ID-game-ou-over`,
      `receiving_yards-ANY_PLAYER_ID-game-ou-under`)
    - Receptions Over/Under (`receiving_receptions-ANY_PLAYER_ID-game-ou-over`,
      `receiving_receptions-ANY_PLAYER_ID-game-ou-under`)
    - Receiving Touchdowns Over/Under (`receiving_touchdowns-ANY_PLAYER_ID-game-ou-over`,
      `receiving_touchdowns-ANY_PLAYER_ID-game-ou-under`)
    - Longest Reception Over/Under (`receiving_longestReception-ANY_PLAYER_ID-game-ou-over`,
      `receiving_longestReception-ANY_PLAYER_ID-game-ou-under`)
    - Rushing Yards Over/Under (`rushing_yards-ANY_PLAYER_ID-game-ou-over`,
      `rushing_yards-ANY_PLAYER_ID-game-ou-under`)
    - Rushing Touchdowns Over/Under (`rushing_touchdowns-ANY_PLAYER_ID-game-ou-over`,
      `rushing_touchdowns-ANY_PLAYER_ID-game-ou-under`)
  - Kicker/Defense
    - Kicking Points Over/Under (`kicking_totalPoints-ANY_PLAYER_ID-game-ou-over`,
      `kicking_totalPoints-ANY_PLAYER_ID-game-ou-under`)
    - Field Goals Made Over/Under (`fieldGoals_made-ANY_PLAYER_ID-game-ou-over`,
      `fieldGoals_made-ANY_PLAYER_ID-game-ou-under`)
    - Extra Points Made Over/Under (`extraPoints_kicksMade-ANY_PLAYER_ID-game-ou-over`,
      `extraPoints_kicksMade-ANY_PLAYER_ID-game-ou-under`)
    - Longest Field Goal Over/Under (`fieldGoals_longestMade-ANY_PLAYER_ID-game-ou-over`,
      `fieldGoals_longestMade-ANY_PLAYER_ID-game-ou-under`)
    - Sacks Over/Under (`defense_sacks-ANY_PLAYER_ID-game-ou-over`,
      `defense_sacks-ANY_PLAYER_ID-game-ou-under`)
    - Interceptions Over/Under (`defense_interceptions-ANY_PLAYER_ID-game-ou-over`,
      `defense_interceptions-ANY_PLAYER_ID-game-ou-under`)
    - Fumble Recoveries Over/Under (`defense_fumbleRecoveries-ANY_PLAYER_ID-game-ou-over`,
      `defense_fumbleRecoveries-ANY_PLAYER_ID-game-ou-under`)
    - Defensive Touchdowns Over/Under (`defense_touchdowns-ANY_PLAYER_ID-game-ou-over`,
      `defense_touchdowns-ANY_PLAYER_ID-game-ou-under`)
    - Tackles Over/Under (`defense_tackles-ANY_PLAYER_ID-game-ou-over`,
      `defense_tackles-ANY_PLAYER_ID-game-ou-under`)
  - Any Player
    - Fantasy Score Over/Under (`fantasyScore-ANY_PLAYER_ID-game-ou-over`,
      `fantasyScore-ANY_PLAYER_ID-game-ou-under`)
    - Turnovers Over/Under (`turnovers-ANY_PLAYER_ID-game-ou-over`,
      `turnovers-ANY_PLAYER_ID-game-ou-under`)
    - First Touchdown Yes/No (`firstTouchdown-ANY_PLAYER_ID-game-yn-yes`,
      `firstTouchdown-ANY_PLAYER_ID-game-yn-no`)
    - Last Touchdown Yes/No (`lastTouchdown-ANY_PLAYER_ID-game-yn-yes`,
      `lastTouchdown-ANY_PLAYER_ID-game-yn-no`)
    - First Score Yes/No (`firstToScore-ANY_PLAYER_ID-game-yn-yes`,
      `firstToScore-ANY_PLAYER_ID-game-yn-no`)
    - Anytime Touchdown Yes/No (`touchdowns-ANY_PLAYER_ID-game-yn-yes`,
      `touchdowns-ANY_PLAYER_ID-game-yn-no`)
- Team Props
  - Team Total Points Over/Under (`points-home-game-ou-over`, `points-away-game-ou-over`,
    `points-home-game-ou-under`, `points-away-game-ou-under`)
  - Team Total Touchdowns Over/Under (`touchdowns-home-game-ou-over`,
    `touchdowns-away-game-ou-over`, `touchdowns-home-game-ou-under`,
    `touchdowns-away-game-ou-under`)
  - Team Total Field Goals Over/Under (`fieldGoals_made-home-game-ou-over`,
    `fieldGoals_made-away-game-ou-over`, `fieldGoals_made-home-game-ou-under`,
    `fieldGoals_made-away-game-ou-under`)
  - Team to Score First (`firstToScore-home-game-yn-yes`, `firstToScore-away-game-yn-yes`)
  - Team to Score Last (`lastToScore-home-game-yn-yes`, `lastToScore-away-game-yn-yes`)
  - Team Any Touchdowns Yes/No (`touchdowns-home-game-yn-yes`, `touchdowns-away-game-yn-yes`,
    `touchdowns-home-game-yn-no`, `touchdowns-away-game-yn-no`)
  - Team Any Field Goals Yes/No (`fieldGoals_made-home-game-yn-yes`,
    `fieldGoals_made-away-game-yn-yes`, `fieldGoals_made-home-game-yn-no`,
    `fieldGoals_made-away-game-yn-no`)
  - Team Total Turnovers Over/Under (`turnovers-home-game-ou-over`, `turnovers-away-game-ou-over`,
    `turnovers-home-game-ou-under`, `turnovers-away-game-ou-under`)
  - Team Total Sacks Over/Under (`defense_sacks-home-game-ou-over`,
    `defense_sacks-away-game-ou-over`, `defense_sacks-home-game-ou-under`,
    `defense_sacks-away-game-ou-under`)
  - Team Total Tackles Over/Under (`defense_tackles-home-game-ou-over`,
    `defense_tackles-away-game-ou-over`, `defense_tackles-home-game-ou-under`,
    `defense_tackles-away-game-ou-under`)
- Game Props
  - Total Touchdowns Over/Under (`touchdowns-all-game-ou-over`, `touchdowns-all-game-ou-under`)
  - Total Field Goals Over/Under (`fieldGoals_made-all-game-ou-over`,
    `fieldGoals_made-all-game-ou-under`)
  - Total Turnovers Over/Under (`turnovers-all-game-ou-over`, `turnovers-all-game-ou-under`)
  - Total Sacks Over/Under (`defense_sacks-all-game-ou-over`, `defense_sacks-all-game-ou-under`)
  - Game to Go to Overtime (`overtime-all-game-yn-yes`, `overtime-all-game-yn-no`)
  - First Score Type (TD/FG/Safety) (`firstScore-all-game-ms-touchdown`,
    `firstScore-all-game-ms-fieldgoal`, `firstScore-all-game-ms-safety`)
  - Last Score Type (TD/FG/Safety) (`lastScore-all-game-ms-touchdown`,
    `lastScore-all-game-ms-fieldgoal`, `lastScore-all-game-ms-safety`)
  - Points Scored Even/Odd (`points-all-game-eo-even`, `points-all-game-eo-odd`)
  - Longest Touchdown Over/Under (`longestTouchdown-all-game-ou-over`,
    `longestTouchdown-all-game-ou-under`)
  - First Quarter Points Over/Under (`points-all-1q-ou-over`, `points-all-1q-ou-under`)
  - First Half Points Over/Under (`points-all-1h-ou-over`, `points-all-1h-ou-under`)
  - Second Half Points Over/Under (`points-all-2h-ou-over`, `points-all-2h-ou-under`)
  - Times Tied Over/Under (`timesTied-all-game-ou-over`, `timesTied-all-game-ou-under`)

**NCAAF**

- Main Lines
  - Point Spread (`points-home-game-sp-home`, `points-away-game-sp-away`)
  - Total Points Over/Under (`points-all-game-ou-over`, `points-all-game-ou-under`)
  - Moneyline (`points-home-game-ml-home`, `points-away-game-ml-away`)
- Player Props
  - Quarterback
    - Passing Yards Over/Under (`passing_yards-ANY_PLAYER_ID-game-ou-over`,
      `passing_yards-ANY_PLAYER_ID-game-ou-under`)
    - Passing Touchdowns Over/Under (`passing_touchdowns-ANY_PLAYER_ID-game-ou-over`,
      `passing_touchdowns-ANY_PLAYER_ID-game-ou-under`)
    - Interceptions Over/Under (`defense_interceptions-ANY_PLAYER_ID-game-ou-over`,
      `defense_interceptions-ANY_PLAYER_ID-game-ou-under`)
    - Completions Over/Under (`passing_completions-ANY_PLAYER_ID-game-ou-over`,
      `passing_completions-ANY_PLAYER_ID-game-ou-under`)
    - Rushing Yards Over/Under (`rushing_yards-ANY_PLAYER_ID-game-ou-over`,
      `rushing_yards-ANY_PLAYER_ID-game-ou-under`)
    - Rushing Touchdowns Over/Under (`rushing_touchdowns-ANY_PLAYER_ID-game-ou-over`,
      `rushing_touchdowns-ANY_PLAYER_ID-game-ou-under`)
  - Running Back
    - Rushing Yards Over/Under (`rushing_yards-ANY_PLAYER_ID-game-ou-over`,
      `rushing_yards-ANY_PLAYER_ID-game-ou-under`)
    - Rushing Touchdowns Over/Under (`rushing_touchdowns-ANY_PLAYER_ID-game-ou-over`,
      `rushing_touchdowns-ANY_PLAYER_ID-game-ou-under`)
    - Rushing Attempts Over/Under (`rushing_attempts-ANY_PLAYER_ID-game-ou-over`,
      `rushing_attempts-ANY_PLAYER_ID-game-ou-under`)
    - Receptions Over/Under (`receiving_receptions-ANY_PLAYER_ID-game-ou-over`,
      `receiving_receptions-ANY_PLAYER_ID-game-ou-under`)
    - Receiving Yards Over/Under (`receiving_yards-ANY_PLAYER_ID-game-ou-over`,
      `receiving_yards-ANY_PLAYER_ID-game-ou-under`)
  - Wide Receiver/Tight End
    - Receiving Yards Over/Under (`receiving_yards-ANY_PLAYER_ID-game-ou-over`,
      `receiving_yards-ANY_PLAYER_ID-game-ou-under`)
    - Receptions Over/Under (`receiving_receptions-ANY_PLAYER_ID-game-ou-over`,
      `receiving_receptions-ANY_PLAYER_ID-game-ou-under`)
    - Receiving Touchdowns Over/Under (`receiving_touchdowns-ANY_PLAYER_ID-game-ou-over`,
      `receiving_touchdowns-ANY_PLAYER_ID-game-ou-under`)
    - Rushing Yards Over/Under (`rushing_yards-ANY_PLAYER_ID-game-ou-over`,
      `rushing_yards-ANY_PLAYER_ID-game-ou-under`)
  - Kicker/Defense
    - Kicking Points Over/Under (`kicking_totalPoints-ANY_PLAYER_ID-game-ou-over`,
      `kicking_totalPoints-ANY_PLAYER_ID-game-ou-under`)
    - Field Goals Made Over/Under (`fieldGoals_made-ANY_PLAYER_ID-game-ou-over`,
      `fieldGoals_made-ANY_PLAYER_ID-game-ou-under`)
    - Sacks Over/Under (`defense_sacks-ANY_PLAYER_ID-game-ou-over`,
      `defense_sacks-ANY_PLAYER_ID-game-ou-under`)
    - Interceptions Over/Under (`defense_interceptions-ANY_PLAYER_ID-game-ou-over`,
      `defense_interceptions-ANY_PLAYER_ID-game-ou-under`)
- Team Props
  - Team Total Points Over/Under (`points-home-game-ou-over`, `points-away-game-ou-over`,
    `points-home-game-ou-under`, `points-away-game-ou-under`)
  - Team Total Touchdowns Over/Under (`touchdowns-home-game-ou-over`,
    `touchdowns-away-game-ou-over`, `touchdowns-home-game-ou-under`,
    `touchdowns-away-game-ou-under`)
  - Team Total Field Goals Over/Under (`fieldGoals_made-home-game-ou-over`,
    `fieldGoals_made-away-game-ou-over`, `fieldGoals_made-home-game-ou-under`,
    `fieldGoals_made-away-game-ou-under`)
  - Team to Score First (`firstToScore-home-game-yn-yes`, `firstToScore-away-game-yn-yes`)
  - Team Total Turnovers Over/Under (`turnovers-home-game-ou-over`, `turnovers-away-game-ou-over`,
    `turnovers-home-game-ou-under`, `turnovers-away-game-ou-under`)
- Game Props
  - Total Touchdowns Over/Under (`touchdowns-all-game-ou-over`, `touchdowns-all-game-ou-under`)
  - Total Field Goals Over/Under (`fieldGoals_made-all-game-ou-over`,
    `fieldGoals_made-all-game-ou-under`)
  - Total Turnovers Over/Under (`turnovers-all-game-ou-over`, `turnovers-all-game-ou-under`)
  - Game to Go to Overtime (`overtime-all-game-yn-yes`, `overtime-all-game-yn-no`)
  - First Score Type (TD/FG/Safety) (`firstScore-all-game-ms-touchdown`,
    `firstScore-all-game-ms-fieldgoal`, `firstScore-all-game-ms-safety`)
  - Points Scored Even/Odd (`points-all-game-eo-even`, `points-all-game-eo-odd`)
  - First Quarter Points Over/Under (`points-all-1q-ou-over`, `points-all-1q-ou-under`)
  - First Half Points Over/Under (`points-all-1h-ou-over`, `points-all-1h-ou-under`)

## BASKETBALL (NBA, NCAAB)

coringQuarter-away-game-ms-3q`, `highestScoringQuarter-home-game-ms-4q`, `highestScoringQuarter-away-game-ms-4q`)

- Game Props
  - Total Rebounds Over/Under (`rebounds-all-game-ou-over`, `rebounds-all-game-ou-under`)
  - Total Assists Over/Under (`assists-all-game-ou-over`, `assists-all-game-ou-under`)
  - Total Three-Pointers Over/Under (`threePointers_made-all-game-ou-over`,
    `threePointers_made-all-game-ou-under`)
  - Total Turnovers Over/Under (`turnovers-all-game-ou-over`, `turnovers-all-game-ou-under`)
  - Total Steals Over/Under (`steals-all-game-ou-over`, `steals-all-game-ou-under`)
  - Total Blocks Over/Under (`blocks-all-game-ou-over`, `blocks-all-game-ou-under`)
  - Game to Go to Overtime (`overtime-all-game-yn-yes`, `overtime-all-game-yn-no`)
  - Highest Scoring Quarter (`highestScoringQuarter-all-game-ms-1q`,
    `highestScoringQuarter-all-game-ms-2q`, `highestScoringQuarter-all-game-ms-3q`,
    `highestScoringQuarter-all-game-ms-4q`)
  - Lowest Scoring Quarter (`lowestScoringQuarter-all-game-ms-1q`,
    `lowestScoringQuarter-all-game-ms-2q`, `lowestScoringQuarter-all-game-ms-3q`,
    `lowestScoringQuarter-all-game-ms-4q`)
  - First Quarter Points Over/Under (`points-all-1q-ou-over`, `points-all-1q-ou-under`)
  - First Half Points Over/Under (`points-all-1h-ou-over`, `points-all-1h-ou-under`)
  - Second Half Points Over/Under (`points-all-2h-ou-over`, `points-all-2h-ou-under`)

**NCAAB**

- Main Lines
  - Point Spread (`points-home-game-sp-home`, `points-away-game-sp-away`)
  - Total Points Over/Under (`points-all-game-ou-over`, `points-all-game-ou-under`)
  - Moneyline (`points-home-game-ml-home`, `points-away-game-ml-away`)
- Player Props
  - Scoring
    - Points Over/Under (`points-ANY_PLAYER_ID-game-ou-over`, `points-ANY_PLAYER_ID-game-ou-under`)
    - Field Goals Made Over/Under (`fieldGoals_made-ANY_PLAYER_ID-game-ou-over`,
      `fieldGoals_made-ANY_PLAYER_ID-game-ou-under`)
    - Three-Pointers Made Over/Under (`threePointers_made-ANY_PLAYER_ID-game-ou-over`,
      `threePointers_made-ANY_PLAYER_ID-game-ou-under`)
    - Free Throws Made Over/Under (`freeThrows_made-ANY_PLAYER_ID-game-ou-over`,
      `freeThrows_made-ANY_PLAYER_ID-game-ou-under`)
  - Rebounding
    - Total Rebounds Over/Under (`rebounds-ANY_PLAYER_ID-game-ou-over`,
      `rebounds-ANY_PLAYER_ID-game-ou-under`)
    - Offensive Rebounds Over/Under (`rebounds_offensive-ANY_PLAYER_ID-game-ou-over`,
      `rebounds_offensive-ANY_PLAYER_ID-game-ou-under`)
    - Defensive Rebounds Over/Under (`rebounds_defensive-ANY_PLAYER_ID-game-ou-over`,
      `rebounds_defensive-ANY_PLAYER_ID-game-ou-under`)
  - Playmaking
    - Assists Over/Under (`assists-ANY_PLAYER_ID-game-ou-over`,
      `assists-ANY_PLAYER_ID-game-ou-under`)
    - Turnovers Over/Under (`turnovers-ANY_PLAYER_ID-game-ou-over`,
      `turnovers-ANY_PLAYER_ID-game-ou-under`)
    - Steals Over/Under (`steals-ANY_PLAYER_ID-game-ou-over`, `steals-ANY_PLAYER_ID-game-ou-under`)
    - Blocks Over/Under (`blocks-ANY_PLAYER_ID-game-ou-over`, `blocks-ANY_PLAYER_ID-game-ou-under`)
  - Combo Props
    - Points + Rebounds Over/Under (`points+rebounds-ANY_PLAYER_ID-game-ou-over`,
      `points+rebounds-ANY_PLAYER_ID-game-ou-under`)
    - Points + Assists Over/Under (`points+assists-ANY_PLAYER_ID-game-ou-over`,
      `points+assists-ANY_PLAYER_ID-game-ou-under`)
    - Double-Double Yes/No (`doubleDouble-ANY_PLAYER_ID-game-yn-yes`,
      `doubleDouble-ANY_PLAYER_ID-game-yn-no`)
    - Fantasy Score Over/Under (`fantasyScore-ANY_PLAYER_ID-game-ou-over`,
      `fantasyScore-ANY_PLAYER_ID-game-ou-under`)
- Team Props
  - Team Total Points Over/Under (`points-home-game-ou-over`, `points-away-game-ou-over`,
    `points-home-game-ou-under`, `points-away-game-ou-under`)
  - Team Total Rebounds Over/Under (`rebounds-home-game-ou-over`, `rebounds-away-game-ou-over`,
    `rebounds-home-game-ou-under`, `rebounds-away-game-ou-under`)
  - Team Total Assists Over/Under (`assists-home-game-ou-over`, `assists-away-game-ou-over`,
    `assists-home-game-ou-under`, `assists-away-game-ou-under`)
  - Team Total Three-Pointers Over/Under (`threePointers_made-home-game-ou-over`,
    `threePointers_made-away-game-ou-over`, `threePointers_made-home-game-ou-under`,
    `threePointers_made-away-game-ou-under`)
  - Team to Score First (`firstToScore-home-game-yn-yes`, `firstToScore-away-game-yn-yes`)
- Game Props
  - Total Rebounds Over/Under (`rebounds-all-game-ou-over`, `rebounds-all-game-ou-under`)
  - Total Assists Over/Under (`assists-all-game-ou-over`, `assists-all-game-ou-under`)
  - Total Three-Pointers Over/Under (`threePointers_made-all-game-ou-over`,
    `threePointers_made-all-game-ou-under`)
  - Game to Go to Overtime (`overtime-all-game-yn-yes`, `overtime-all-game-yn-no`)
  - First Half Points Over/Under (`points-all-1h-ou-over`, `points-all-1h-ou-under`)
  - Second Half Points Over/Under (`points-all-2h-ou-over`, `points-all-2h-ou-under`)

## HOCKEY (NHL)

**NHL**

- Main Lines
  - Moneyline (`points-home-game-ml-home`, `points-away-game-ml-away`)
  - Puck Line (-1.5) (`points-home-game-sp-home`, `points-away-game-sp-away`)
  - Total Goals Over/Under (`points-all-game-ou-over`, `points-all-game-ou-under`)
- Player Props
  - Skaters
    - Goals Over/Under (`goals-ANY_PLAYER_ID-game-ou-over`, `goals-ANY_PLAYER_ID-game-ou-under`)
    - Assists Over/Under (`assists-ANY_PLAYER_ID-game-ou-over`,
      `assists-ANY_PLAYER_ID-game-ou-under`)
    - Points (Goals + Assists) Over/Under (`points-ANY_PLAYER_ID-game-ou-over`,
      `points-ANY_PLAYER_ID-game-ou-under`)
    - Shots on Goal Over/Under (`shots_onGoal-ANY_PLAYER_ID-game-ou-over`,
      `shots_onGoal-ANY_PLAYER_ID-game-ou-under`)
    - Hits Over/Under (`hits-ANY_PLAYER_ID-game-ou-over`, `hits-ANY_PLAYER_ID-game-ou-under`)
    - Blocked Shots Over/Under (`blockedShots-ANY_PLAYER_ID-game-ou-over`,
      `blockedShots-ANY_PLAYER_ID-game-ou-under`)
    - Penalty Minutes Over/Under (`penaltyMinutes-ANY_PLAYER_ID-game-ou-over`,
      `penaltyMinutes-ANY_PLAYER_ID-game-ou-under`)
    - Power Play Points Over/Under (`powerPlayPoints-ANY_PLAYER_ID-game-ou-over`,
      `powerPlayPoints-ANY_PLAYER_ID-game-ou-under`)
    - Time on Ice Over/Under (`timeOnIce-ANY_PLAYER_ID-game-ou-over`,
      `timeOnIce-ANY_PLAYER_ID-game-ou-under`)
    - Faceoff Wins Over/Under (`faceoffWins-ANY_PLAYER_ID-game-ou-over`,
      `faceoffWins-ANY_PLAYER_ID-game-ou-under`)
    - First Goal Scorer Yes/No (`firstGoal-ANY_PLAYER_ID-game-yn-yes`,
      `firstGoal-ANY_PLAYER_ID-game-yn-no`)
    - Anytime Goal Scorer Yes/No (`goals-ANY_PLAYER_ID-game-yn-yes`,
      `goals-ANY_PLAYER_ID-game-yn-no`)
  - Goalies
    - Saves Over/Under (`saves-ANY_PLAYER_ID-game-ou-over`, `saves-ANY_PLAYER_ID-game-ou-under`)
    - Goals Against Over/Under (`goalsAgainst-ANY_PLAYER_ID-game-ou-over`,
      `goalsAgainst-ANY_PLAYER_ID-game-ou-under`)
    - Save Percentage Over/Under (`savePercentage-ANY_PLAYER_ID-game-ou-over`,
      `savePercentage-ANY_PLAYER_ID-game-ou-under`)
    - Shutout Yes/No (`shutout-ANY_PLAYER_ID-game-yn-yes`, `shutout-ANY_PLAYER_ID-game-yn-no`)
    - Win Yes/No (`win-ANY_PLAYER_ID-game-yn-yes`, `win-ANY_PLAYER_ID-game-yn-no`)
- Team Props
  - Team Total Goals Over/Under (`points-home-game-ou-over`, `points-away-game-ou-over`,
    `points-home-game-ou-under`, `points-away-game-ou-under`)
  - Team Total Shots Over/Under (`shots_onGoal-home-game-ou-over`, `shots_onGoal-away-game-ou-over`,
    `shots_onGoal-home-game-ou-under`, `shots_onGoal-away-game-ou-under`)
  - Team Total Hits Over/Under (`hits-home-game-ou-over`, `hits-away-game-ou-over`,
    `hits-home-game-ou-under`, `hits-away-game-ou-under`)
  - Team Total Penalty Minutes Over/Under (`penaltyMinutes-home-game-ou-over`,
    `penaltyMinutes-away-game-ou-over`, `penaltyMinutes-home-game-ou-under`,
    `penaltyMinutes-away-game-ou-under`)
  - Team to Score First (`firstGoal-home-game-yn-yes`, `firstGoal-away-game-yn-yes`)
  - Team to Score Last (`lastGoal-home-game-yn-yes`, `lastGoal-away-game-yn-yes`)
  - Team Any Goals Yes/No (`points-home-game-yn-yes`, `points-away-game-yn-yes`,
    `points-home-game-yn-no`, `points-away-game-yn-no`)
  - Team Power Play Goals Over/Under (`powerPlayGoals-home-game-ou-over`,
    `powerPlayGoals-away-game-ou-over`, `powerPlayGoals-home-game-ou-under`,
    `powerPlayGoals-away-game-ou-under`)
  - Team Short-Handed Goals Over/Under (`shortHandedGoals-home-game-ou-over`,
    `shortHandedGoals-away-game-ou-over`, `shortHandedGoals-home-game-ou-under`,
    `shortHandedGoals-away-game-ou-under`)
- Game Props
  - Total Shots on Goal Over/Under (`shots_onGoal-all-game-ou-over`,
    `shots_onGoal-all-game-ou-under`)
  - Total Hits Over/Under (`hits-all-game-ou-over`, `hits-all-game-ou-under`)
  - Total Penalty Minutes Over/Under (`penaltyMinutes-all-game-ou-over`,
    `penaltyMinutes-all-game-ou-under`)
  - Total Power Plays Over/Under (`powerPlays-all-game-ou-over`, `powerPlays-all-game-ou-under`)
  - Game to Go to Overtime (`overtime-all-game-yn-yes`, `overtime-all-game-yn-no`)
  - Game to Go to Shootout (`shootout-all-game-yn-yes`, `shootout-all-game-yn-no`)
  - Goals Scored Even/Odd (`points-all-game-eo-even`, `points-all-game-eo-odd`)
  - First Goal Time Over/Under (`firstGoalTime-all-game-ou-over`, `firstGoalTime-all-game-ou-under`)
  - First Period Goals Over/Under (`points-all-1p-ou-over`, `points-all-1p-ou-under`)
  - Second Period Goals Over/Under (`points-all-2p-ou-over`, `points-all-2p-ou-under`)
  - Third Period Goals Over/Under (`points-all-3p-ou-over`, `points-all-3p-ou-under`)

## SOCCER (Champions League, MLS)

**Champions League**

- Main Lines
  - Moneyline (1X2) (`points-home-game-ml-home`, `points-away-game-ml-away`,
    `points-all-game-ml-draw`)
  - Asian Handicap (`points-home-game-sp-home`, `points-away-game-sp-away`)
  - Total Goals Over/Under (`points-all-game-ou-over`, `points-all-game-ou-under`)
- Player Props**NBA**
- Main Lines
  - Point Spread (`points-home-game-sp-home`, `points-away-game-sp-away`)
  - Total Points Over/Under (`points-all-game-ou-over`, `points-all-game-ou-under`)
  - Moneyline (`points-home-game-ml-home`, `points-away-game-ml-away`)
- Player Props
  - Scoring
    - Points Over/Under (`points-ANY_PLAYER_ID-game-ou-over`, `points-ANY_PLAYER_ID-game-ou-under`)
    - Field Goals Made Over/Under (`fieldGoals_made-ANY_PLAYER_ID-game-ou-over`,
      `fieldGoals_made-ANY_PLAYER_ID-game-ou-under`)
    - Field Goal Attempts Over/Under (`fieldGoals_attempts-ANY_PLAYER_ID-game-ou-over`,
      `fieldGoals_attempts-ANY_PLAYER_ID-game-ou-under`)
    - Three-Pointers Made Over/Under (`threePointers_made-ANY_PLAYER_ID-game-ou-over`,
      `threePointers_made-ANY_PLAYER_ID-game-ou-under`)
    - Three-Point Attempts Over/Under (`threePointers_attempts-ANY_PLAYER_ID-game-ou-over`,
      `threePointers_attempts-ANY_PLAYER_ID-game-ou-under`)
    - Free Throws Made Over/Under (`freeThrows_made-ANY_PLAYER_ID-game-ou-over`,
      `freeThrows_made-ANY_PLAYER_ID-game-ou-under`)
    - Free Throw Attempts Over/Under (`freeThrows_attempts-ANY_PLAYER_ID-game-ou-over`,
      `freeThrows_attempts-ANY_PLAYER_ID-game-ou-under`)
  - Rebounding
    - Total Rebounds Over/Under (`rebounds-ANY_PLAYER_ID-game-ou-over`,
      `rebounds-ANY_PLAYER_ID-game-ou-under`)
    - Offensive Rebounds Over/Under (`rebounds_offensive-ANY_PLAYER_ID-game-ou-over`,
      `rebounds_offensive-ANY_PLAYER_ID-game-ou-under`)
    - Defensive Rebounds Over/Under (`rebounds_defensive-ANY_PLAYER_ID-game-ou-over`,
      `rebounds_defensive-ANY_PLAYER_ID-game-ou-under`)
  - Playmaking
    - Assists Over/Under (`assists-ANY_PLAYER_ID-game-ou-over`,
      `assists-ANY_PLAYER_ID-game-ou-under`)
    - Turnovers Over/Under (`turnovers-ANY_PLAYER_ID-game-ou-over`,
      `turnovers-ANY_PLAYER_ID-game-ou-under`)
    - Steals Over/Under (`steals-ANY_PLAYER_ID-game-ou-over`, `steals-ANY_PLAYER_ID-game-ou-under`)
    - Blocks Over/Under (`blocks-ANY_PLAYER_ID-game-ou-over`, `blocks-ANY_PLAYER_ID-game-ou-under`)
  - Combo Props
    - Points + Rebounds Over/Under (`points+rebounds-ANY_PLAYER_ID-game-ou-over`,
      `points+rebounds-ANY_PLAYER_ID-game-ou-under`)
    - Points + Assists Over/Under (`points+assists-ANY_PLAYER_ID-game-ou-over`,
      `points+assists-ANY_PLAYER_ID-game-ou-under`)
    - Rebounds + Assists Over/Under (`rebounds+assists-ANY_PLAYER_ID-game-ou-over`,
      `rebounds+assists-ANY_PLAYER_ID-game-ou-under`)
    - Points + Rebounds + Assists Over/Under (`points+rebounds+assists-ANY_PLAYER_ID-game-ou-over`,
      `points+rebounds+assists-ANY_PLAYER_ID-game-ou-under`)
    - Double-Double Yes/No (`doubleDouble-ANY_PLAYER_ID-game-yn-yes`,
      `doubleDouble-ANY_PLAYER_ID-game-yn-no`)
    - Triple-Double Yes/No (`tripleDouble-ANY_PLAYER_ID-game-yn-yes`,
      `tripleDouble-ANY_PLAYER_ID-game-yn-no`)
    - Fantasy Score Over/Under (`fantasyScore-ANY_PLAYER_ID-game-ou-over`,
      `fantasyScore-ANY_PLAYER_ID-game-ou-under`)
    - First Basket Yes/No (`firstBasket-ANY_PLAYER_ID-game-yn-yes`,
      `firstBasket-ANY_PLAYER_ID-game-yn-no`)
    - First Score Yes/No (`firstToScore-ANY_PLAYER_ID-game-yn-yes`,
      `firstToScore-ANY_PLAYER_ID-game-yn-no`)
    - Blocks + Steals Over/Under (`blocks+steals-ANY_PLAYER_ID-game-ou-over`,
      `blocks+steals-ANY_PLAYER_ID-game-ou-under`)
- Team Props
  - Team Total Points Over/Under (`points-home-game-ou-over`, `points-away-game-ou-over`,
    `points-home-game-ou-under`, `points-away-game-ou-under`)
  - Team Total Rebounds Over/Under (`rebounds-home-game-ou-over`, `rebounds-away-game-ou-over`,
    `rebounds-home-game-ou-under`, `rebounds-away-game-ou-under`)
  - Team Total Assists Over/Under (`assists-home-game-ou-over`, `assists-away-game-ou-over`,
    `assists-home-game-ou-under`, `assists-away-game-ou-under`)
  - Team Total Three-Pointers Over/Under (`threePointers_made-home-game-ou-over`,
    `threePointers_made-away-game-ou-over`, `threePointers_made-home-game-ou-under`,
    `threePointers_made-away-game-ou-under`)
  - Team Total Turnovers Over/Under (`turnovers-home-game-ou-over`, `turnovers-away-game-ou-over`,
    `turnovers-home-game-ou-under`, `turnovers-away-game-ou-under`)
  - Team to Score First (`firstToScore-home-game-yn-yes`, `firstToScore-away-game-yn-yes`)
  - Team Highest Scoring Quarter (`highestScoringQuarter-home-game-ms-1q`,
    `highestScoringQuarter-away-game-ms-1q`, `highestScoringQuarter-home-game-ms-2q`,
    `highestScoringQuarter-away-game-ms-2q`, `highestScoringQuarter-home-game-ms-3q`, `highestS
  - Forwards
    - Goals Over/Under (`goals-ANY_PLAYER_ID-game-ou-over`, `goals-ANY_PLAYER_ID-game-ou-under`)
    - Shots on Target Over/Under (`shots_onTarget-ANY_PLAYER_ID-game-ou-over`,
      `shots_onTarget-ANY_PLAYER_ID-game-ou-under`)
    - Shots Over/Under (`shots-ANY_PLAYER_ID-game-ou-over`, `shots-ANY_PLAYER_ID-game-ou-under`)
    - Assists Over/Under (`assists-ANY_PLAYER_ID-game-ou-over`,
      `assists-ANY_PLAYER_ID-game-ou-under`)
    - Fouls Committed Over/Under (`fouls-ANY_PLAYER_ID-game-ou-over`,
      `fouls-ANY_PLAYER_ID-game-ou-under`)
    - Cards Received Over/Under (`cards-ANY_PLAYER_ID-game-ou-over`,
      `cards-ANY_PLAYER_ID-game-ou-under`)
    - First Goal Scorer Yes/No (`firstGoal-ANY_PLAYER_ID-game-yn-yes`,
      `firstGoal-ANY_PLAYER_ID-game-yn-no`)
    - Anytime Goal Scorer Yes/No (`goals-ANY_PLAYER_ID-game-yn-yes`,
      `goals-ANY_PLAYER_ID-game-yn-no`)
  - Midfielders
    - Passes Completed Over/Under (`passesCompleted-ANY_PLAYER_ID-game-ou-over`,
      `passesCompleted-ANY_PLAYER_ID-game-ou-under`)
    - Pass Completion % Over/Under (`passCompletionPercentage-ANY_PLAYER_ID-game-ou-over`,
      `passCompletionPercentage-ANY_PLAYER_ID-game-ou-under`)
    - Tackles Over/Under (`tackles-ANY_PLAYER_ID-game-ou-over`,
      `tackles-ANY_PLAYER_ID-game-ou-under`)
    - Assists Over/Under (`assists-ANY_PLAYER_ID-game-ou-over`,
      `assists-ANY_PLAYER_ID-game-ou-under`)
    - Shots Over/Under (`shots-ANY_PLAYER_ID-game-ou-over`, `shots-ANY_PLAYER_ID-game-ou-under`)
    - Fouls Committed Over/Under (`fouls-ANY_PLAYER_ID-game-ou-over`,
      `fouls-ANY_PLAYER_ID-game-ou-under`)
    - Cards Received Over/Under (`cards-ANY_PLAYER_ID-game-ou-over`,
      `cards-ANY_PLAYER_ID-game-ou-under`)
  - Defenders
    - Tackles Over/Under (`tackles-ANY_PLAYER_ID-game-ou-over`,
      `tackles-ANY_PLAYER_ID-game-ou-under`)
    - Clearances Over/Under (`clearances-ANY_PLAYER_ID-game-ou-over`,
      `clearances-ANY_PLAYER_ID-game-ou-under`)
    - Blocks Over/Under (`blocks-ANY_PLAYER_ID-game-ou-over`, `blocks-ANY_PLAYER_ID-game-ou-under`)
    - Interceptions Over/Under (`interceptions-ANY_PLAYER_ID-game-ou-over`,
      `interceptions-ANY_PLAYER_ID-game-ou-under`)
    - Fouls Committed Over/Under (`fouls-ANY_PLAYER_ID-game-ou-over`,
      `fouls-ANY_PLAYER_ID-game-ou-under`)
    - Cards Received Over/Under (`cards-ANY_PLAYER_ID-game-ou-over`,
      `cards-ANY_PLAYER_ID-game-ou-under`)
  - Goalkeepers
    - Saves Over/Under (`saves-ANY_PLAYER_ID-game-ou-over`, `saves-ANY_PLAYER_ID-game-ou-under`)
    - Goals Conceded Over/Under (`goalsConceded-ANY_PLAYER_ID-game-ou-over`,
      `goalsConceded-ANY_PLAYER_ID-game-ou-under`)
    - Clean Sheet Yes/No (`cleanSheet-ANY_PLAYER_ID-game-yn-yes`,
      `cleanSheet-ANY_PLAYER_ID-game-yn-no`)
    - Punches/Catches Over/Under (`punchesCatches-ANY_PLAYER_ID-game-ou-over`,
      `punchesCatches-ANY_PLAYER_ID-game-ou-under`)
- Team Props
  - Team Total Goals Over/Under (`points-home-game-ou-over`, `points-away-game-ou-over`,
    `points-home-game-ou-under`, `points-away-game-ou-under`)
  - Team Total Shots Over/Under (`shots-home-game-ou-over`, `shots-away-game-ou-over`,
    `shots-home-game-ou-under`, `shots-away-game-ou-under`)
  - Team Total Shots on Target Over/Under (`shots_onTarget-home-game-ou-over`,
    `shots_onTarget-away-game-ou-over`, `shots_onTarget-home-game-ou-under`,
    `shots_onTarget-away-game-ou-under`)
  - Team Total Corners Over/Under (`corners-home-game-ou-over`, `corners-away-game-ou-over`,
    `corners-home-game-ou-under`, `corners-away-game-ou-under`)
  - Team Total Cards Over/Under (`cards-home-game-ou-over`, `cards-away-game-ou-over`,
    `cards-home-game-ou-under`, `cards-away-game-ou-under`)
  - Team to Score First (`firstGoal-home-game-yn-yes`, `firstGoal-away-game-yn-yes`)
  - Team to Score Last (`lastGoal-home-game-yn-yes`, `lastGoal-away-game-yn-yes`)
  - Team Any Goals Yes/No (`points-home-game-yn-yes`, `points-away-game-yn-yes`,
    `points-home-game-yn-no`, `points-away-game-yn-no`)
  - Team Clean Sheet Yes/No (`cleanSheet-home-game-yn-yes`, `cleanSheet-away-game-yn-yes`,
    `cleanSheet-home-game-yn-no`, `cleanSheet-away-game-yn-no`)
  - Team Total Fouls Over/Under (`fouls-home-game-ou-over`, `fouls-away-game-ou-over`,
    `fouls-home-game-ou-under`, `fouls-away-game-ou-under`)
  - Team Total Offsides Over/Under (`offsides-home-game-ou-over`, `offsides-away-game-ou-over`,
    `offsides-home-game-ou-under`, `offsides-away-game-ou-under`)
- Game Props
  - Total Shots Over/Under (`shots-all-game-ou-over`, `shots-all-game-ou-under`)
  - Total Shots on Target Over/Under (`shots_onTarget-all-game-ou-over`,
    `shots_onTarget-all-game-ou-under`)
  - Total Corners Over/Under (`corners-all-game-ou-over`, `corners-all-game-ou-under`)
  - Total Cards Over/Under (`cards-all-game-ou-over`, `cards-all-game-ou-under`)
  - Total Fouls Over/Under (`fouls-all-game-ou-over`, `fouls-all-game-ou-under`)
  - Total Offsides Over/Under (`offsides-all-game-ou-over`, `offsides-all-game-ou-under`)
  - Game to Go to Extra Time (`extraTime-all-game-yn-yes`, `extraTime-all-game-yn-no`)
  - Game to Go to Penalty Shootout (`penaltyShootout-all-game-yn-yes`,
    `penaltyShootout-all-game-yn-no`)
  - Goals Scored Even/Odd (`points-all-game-eo-even`, `points-all-game-eo-odd`)
  - Both Teams to Score Yes/No (`bothTeamsToScore-all-game-yn-yes`,
    `bothTeamsToScore-all-game-yn-no`)
  - First Goal Time Over/Under (`firstGoalTime-all-game-ou-over`, `firstGoalTime-all-game-ou-under`)
  - First Half Goals Over/Under (`points-all-1h-ou-over`, `points-all-1h-ou-under`)
  - Second Half Goals Over/Under (`points-all-2h-ou-over`, `points-all-2h-ou-under`)

**MLS**

- Main Lines
  - Moneyline (1X2) (`points-home-game-ml-home`, `points-away-game-ml-away`,
    `points-all-game-ml-draw`)
  - Asian Handicap (`points-home-game-sp-home`, `points-away-game-sp-away`)
  - Total Goals Over/Under (`points-all-game-ou-over`, `points-all-game-ou-under`)
- Player Props
  - Forwards
    - Goals Over/Under (`goals-ANY_PLAYER_ID-game-ou-over`, `goals-ANY_PLAYER_ID-game-ou-under`)
    - Shots on Target Over/Under (`shots_onTarget-ANY_PLAYER_ID-game-ou-over`,
      `shots_onTarget-ANY_PLAYER_ID-game-ou-under`)
    - Assists Over/Under (`assists-ANY_PLAYER_ID-game-ou-over`,
      `assists-ANY_PLAYER_ID-game-ou-under`)
    - First Goal Scorer Yes/No (`firstGoal-ANY_PLAYER_ID-game-yn-yes`,
      `firstGoal-ANY_PLAYER_ID-game-yn-no`)
    - Anytime Goal Scorer Yes/No (`goals-ANY_PLAYER_ID-game-yn-yes`,
      `goals-ANY_PLAYER_ID-game-yn-no`)
  - Midfielders
    - Passes Completed Over/Under (`passesCompleted-ANY_PLAYER_ID-game-ou-over`,
      `passesCompleted-ANY_PLAYER_ID-game-ou-under`)
    - Tackles Over/Under (`tackles-ANY_PLAYER_ID-game-ou-over`,
      `tackles-ANY_PLAYER_ID-game-ou-under`)
    - Assists Over/Under (`assists-ANY_PLAYER_ID-game-ou-over`,
      `assists-ANY_PLAYER_ID-game-ou-under`)
    - Shots Over/Under (`shots-ANY_PLAYER_ID-game-ou-over`, `shots-ANY_PLAYER_ID-game-ou-under`)
  - Defenders
    - Tackles Over/Under (`tackles-ANY_PLAYER_ID-game-ou-over`,
      `tackles-ANY_PLAYER_ID-game-ou-under`)
    - Clearances Over/Under (`clearances-ANY_PLAYER_ID-game-ou-over`,
      `clearances-ANY_PLAYER_ID-game-ou-under`)
    - Blocks Over/Under (`blocks-ANY_PLAYER_ID-game-ou-over`, `blocks-ANY_PLAYER_ID-game-ou-under`)
    - Interceptions Over/Under (`interceptions-ANY_PLAYER_ID-game-ou-over`,
      `interceptions-ANY_PLAYER_ID-game-ou-under`)
  - Goalkeepers
    - Saves Over/Under (`saves-ANY_PLAYER_ID-game-ou-over`, `saves-ANY_PLAYER_ID-game-ou-under`)
    - Goals Conceded Over/Under (`goalsConceded-ANY_PLAYER_ID-game-ou-over`,
      `goalsConceded-ANY_PLAYER_ID-game-ou-under`)
    - Clean Sheet Yes/No (`cleanSheet-ANY_PLAYER_ID-game-yn-yes`,
      `cleanSheet-ANY_PLAYER_ID-game-yn-no`)
- Team Props
  - Team Total Goals Over/Under (`points-home-game-ou-over`, `points-away-game-ou-over`,
    `points-home-game-ou-under`, `points-away-game-ou-under`)
  - Team Total Shots Over/Under (`shots-home-game-ou-over`, `shots-away-game-ou-over`,
    `shots-home-game-ou-under`, `shots-away-game-ou-under`)
  - Team Total Corners Over/Under (`corners-home-game-ou-over`, `corners-away-game-ou-over`,
    `corners-home-game-ou-under`, `corners-away-game-ou-under`)
  - Team Total Cards Over/Under (`cards-home-game-ou-over`, `cards-away-game-ou-over`,
    `cards-home-game-ou-under`, `cards-away-game-ou-under`)
  - Team to Score First (`firstGoal-home-game-yn-yes`, `firstGoal-away-game-yn-yes`)
  - Team Clean Sheet Yes/No (`cleanSheet-home-game-yn-yes`, `cleanSheet-away-game-yn-yes`,
    `cleanSheet-home-game-yn-no`, `cleanSheet-away-game-yn-no`)
- Game Props
  - Total Shots Over/Under (`shots-all-game-ou-over`, `shots-all-game-ou-under`)
  - Total Corners Over/Under (`corners-all-game-ou-over`, `corners-all-game-ou-under`)
  - Total Cards Over/Under (`cards-all-game-ou-over`, `cards-all-game-ou-under`)
  - Both Teams to Score Yes/No (`bothTeamsToScore-all-game-yn-yes`,
    `bothTeamsToScore-all-game-yn-no`)
  - Goals Scored Even/Odd (`points-all-game-eo-even`, `points-all-game-eo-odd`)
  - First Half Goals Over/Under (`points-all-1h-ou-over`, `points-all-1h-ou-under`)
  - Second Half Goals Over/Under (`points-all-2h-ou-over`, `points-all-2h-ou-under`)

## Notes

- `ANY_PLAYER_ID` should be replaced with the actual player ID from the SportGameOdds API
- For team-specific props: `home` refers to the home team, `away` refers to the away team, `all`
  refers to both teams combined
- Period identifiers: `game` (full game), `1h` (first half), `2h` (second half), `1q` (first
  quarter), `2q` (second quarter), `3q` (third quarter), `4q` (fourth quarter), `1p` (first period),
  `2p` (second period), `3p` (third period), `reg` (regulation time), `1i` (first inning)
- Bet type identifiers: `ml` (moneyline), `sp` (spread), `ou` (over/under), `yn` (yes/no), `eo`
  (even/odd), `ms` (multiple selection)
- The API identifiers shown are based on the actual SportGameOdds API documentation. Some
  identifiers for hockey and soccer may need verification as they were not fully documented in the
  available materials.
- Additional markets may be available through custom plans by contacting SportGameOdds directly.

## API Usage Examples

### Baseball Example

```
Market: Player Home Runs Over/Under
API Identifier: batting_homeRuns-12345-game-ou-over
Where 12345 is the actual player ID
```

### Football Example

```
Market: QB Passing Yards Over
API Identifier: passing_yards-67890-game-ou-over
Where 67890 is the actual player ID
```

### Basketball Example

```
Market: Player Points Over/Under
API Identifier: points-54321-game-ou-over
Where 54321 is the actual player ID
```

### Hockey Example

```
Market: Player Goals Over/Under
API Identifier: goals-98765-game-ou-over
Where 98765 is the actual player ID
```

### Soccer Example

```
Market: Player Goals Over/Under
API Identifier: goals-13579-game-ou-over
Where 13579 is the actual player ID
```

This comprehensive hierarchy covers all major betting markets across the six primary sports
supported by the SportGameOdds API, with their corresponding API identifiers for programmatic
access.
