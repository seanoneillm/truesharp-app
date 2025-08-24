import { Game } from '@/lib/types/games';

export const mockGamesData: Record<string, Game[]> = {
  // NFL Games
  'americanfootball_nfl': [
    {
      id: 'nfl_game_1',
      sport_key: 'americanfootball_nfl',
      sport_title: 'NFL',
      commence_time: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours from now
      home_team: 'Kansas City Chiefs',
      away_team: 'Buffalo Bills',
      bookmakers: [
        {
          key: 'draftkings',
          title: 'DraftKings',
          last_update: new Date().toISOString(),
          markets: [
            {
              key: 'h2h',
              last_update: new Date().toISOString(),
              outcomes: [
                { name: 'Kansas City Chiefs', price: -150 },
                { name: 'Buffalo Bills', price: 130 }
              ]
            },
            {
              key: 'spreads',
              last_update: new Date().toISOString(),
              outcomes: [
                { name: 'Kansas City Chiefs', price: -110, point: -3.5 },
                { name: 'Buffalo Bills', price: -110, point: 3.5 }
              ]
            },
            {
              key: 'totals',
              last_update: new Date().toISOString(),
              outcomes: [
                { name: 'Over', price: -105, point: 48.5 },
                { name: 'Under', price: -115, point: 48.5 }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'nfl_game_2',
      sport_key: 'americanfootball_nfl',
      sport_title: 'NFL',
      commence_time: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(), // 5 hours from now
      home_team: 'Dallas Cowboys',
      away_team: 'Philadelphia Eagles',
      bookmakers: [
        {
          key: 'fanduel',
          title: 'FanDuel',
          last_update: new Date().toISOString(),
          markets: [
            {
              key: 'h2h',
              last_update: new Date().toISOString(),
              outcomes: [
                { name: 'Dallas Cowboys', price: -120 },
                { name: 'Philadelphia Eagles', price: 100 }
              ]
            },
            {
              key: 'spreads',
              last_update: new Date().toISOString(),
              outcomes: [
                { name: 'Dallas Cowboys', price: -110, point: -2.5 },
                { name: 'Philadelphia Eagles', price: -110, point: 2.5 }
              ]
            },
            {
              key: 'totals',
              last_update: new Date().toISOString(),
              outcomes: [
                { name: 'Over', price: -110, point: 45.5 },
                { name: 'Under', price: -110, point: 45.5 }
              ]
            }
          ]
        }
      ]
    }
  ],

  // NBA Games
  'basketball_nba': [
    {
      id: 'nba_game_1',
      sport_key: 'basketball_nba',
      sport_title: 'NBA',
      commence_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
      home_team: 'Los Angeles Lakers',
      away_team: 'Boston Celtics',
      bookmakers: [
        {
          key: 'caesars',
          title: 'Caesars',
          last_update: new Date().toISOString(),
          markets: [
            {
              key: 'h2h',
              last_update: new Date().toISOString(),
              outcomes: [
                { name: 'Los Angeles Lakers', price: -140 },
                { name: 'Boston Celtics', price: 120 }
              ]
            },
            {
              key: 'spreads',
              last_update: new Date().toISOString(),
              outcomes: [
                { name: 'Los Angeles Lakers', price: -110, point: -3.0 },
                { name: 'Boston Celtics', price: -110, point: 3.0 }
              ]
            },
            {
              key: 'totals',
              last_update: new Date().toISOString(),
              outcomes: [
                { name: 'Over', price: -110, point: 220.5 },
                { name: 'Under', price: -110, point: 220.5 }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'nba_game_2',
      sport_key: 'basketball_nba',
      sport_title: 'NBA',
      commence_time: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
      home_team: 'Golden State Warriors',
      away_team: 'Miami Heat',
      bookmakers: [
        {
          key: 'draftkings',
          title: 'DraftKings',
          last_update: new Date().toISOString(),
          markets: [
            {
              key: 'h2h',
              last_update: new Date().toISOString(),
              outcomes: [
                { name: 'Golden State Warriors', price: -200 },
                { name: 'Miami Heat', price: 170 }
              ]
            },
            {
              key: 'spreads',
              last_update: new Date().toISOString(),
              outcomes: [
                { name: 'Golden State Warriors', price: -110, point: -5.5 },
                { name: 'Miami Heat', price: -110, point: 5.5 }
              ]
            },
            {
              key: 'totals',
              last_update: new Date().toISOString(),
              outcomes: [
                { name: 'Over', price: -105, point: 215.0 },
                { name: 'Under', price: -115, point: 215.0 }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'nba_game_3',
      sport_key: 'basketball_nba',
      sport_title: 'NBA',
      commence_time: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours from now
      home_team: 'Phoenix Suns',
      away_team: 'Denver Nuggets',
      bookmakers: [
        {
          key: 'betmgm',
          title: 'BetMGM',
          last_update: new Date().toISOString(),
          markets: [
            {
              key: 'h2h',
              last_update: new Date().toISOString(),
              outcomes: [
                { name: 'Phoenix Suns', price: 110 },
                { name: 'Denver Nuggets', price: -130 }
              ]
            },
            {
              key: 'spreads',
              last_update: new Date().toISOString(),
              outcomes: [
                { name: 'Phoenix Suns', price: -110, point: 2.5 },
                { name: 'Denver Nuggets', price: -110, point: -2.5 }
              ]
            },
            {
              key: 'totals',
              last_update: new Date().toISOString(),
              outcomes: [
                { name: 'Over', price: -110, point: 225.5 },
                { name: 'Under', price: -110, point: 225.5 }
              ]
            }
          ]
        }
      ]
    }
  ],

  // MLB Games
  'baseball_mlb': [
    {
      id: 'mlb_game_1',
      sport_key: 'baseball_mlb',
      sport_title: 'MLB',
      commence_time: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours from now
      home_team: 'New York Yankees',
      away_team: 'Boston Red Sox',
      bookmakers: [
        {
          key: 'betmgm',
          title: 'BetMGM',
          last_update: new Date().toISOString(),
          markets: [
            {
              key: 'h2h',
              last_update: new Date().toISOString(),
              outcomes: [
                { name: 'New York Yankees', price: -130 },
                { name: 'Boston Red Sox', price: 110 }
              ]
            },
            {
              key: 'spreads',
              last_update: new Date().toISOString(),
              outcomes: [
                { name: 'New York Yankees', price: -110, point: -1.5 },
                { name: 'Boston Red Sox', price: -110, point: 1.5 }
              ]
            },
            {
              key: 'totals',
              last_update: new Date().toISOString(),
              outcomes: [
                { name: 'Over', price: -110, point: 9.5 },
                { name: 'Under', price: -110, point: 9.5 }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'mlb_game_2',
      sport_key: 'baseball_mlb',
      sport_title: 'MLB',
      commence_time: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString(), // 7 hours from now
      home_team: 'Los Angeles Dodgers',
      away_team: 'San Francisco Giants',
      bookmakers: [
        {
          key: 'fanduel',
          title: 'FanDuel',
          last_update: new Date().toISOString(),
          markets: [
            {
              key: 'h2h',
              last_update: new Date().toISOString(),
              outcomes: [
                { name: 'Los Angeles Dodgers', price: -180 },
                { name: 'San Francisco Giants', price: 155 }
              ]
            },
            {
              key: 'spreads',
              last_update: new Date().toISOString(),
              outcomes: [
                { name: 'Los Angeles Dodgers', price: -115, point: -1.5 },
                { name: 'San Francisco Giants', price: -105, point: 1.5 }
              ]
            },
            {
              key: 'totals',
              last_update: new Date().toISOString(),
              outcomes: [
                { name: 'Over', price: -105, point: 8.0 },
                { name: 'Under', price: -115, point: 8.0 }
              ]
            }
          ]
        }
      ]
    },
    // Additional MLB games for comprehensive testing (15 more games)
    ...Array.from({ length: 15 }, (_, i) => {
      const teams = [
        ['Houston Astros', 'Texas Rangers'],
        ['Atlanta Braves', 'Philadelphia Phillies'],
        ['Tampa Bay Rays', 'Baltimore Orioles'],
        ['Minnesota Twins', 'Cleveland Guardians'],
        ['Seattle Mariners', 'Oakland Athletics'],
        ['Toronto Blue Jays', 'Chicago White Sox'],
        ['Milwaukee Brewers', 'Cincinnati Reds'],
        ['St. Louis Cardinals', 'Pittsburgh Pirates'],
        ['Arizona Diamondbacks', 'Colorado Rockies'],
        ['San Diego Padres', 'Miami Marlins'],
        ['Chicago Cubs', 'Detroit Tigers'],
        ['New York Mets', 'Washington Nationals'],
        ['Kansas City Royals', 'Los Angeles Angels'],
        ['Detroit Tigers', 'Minnesota Twins'],
        ['Colorado Rockies', 'San Diego Padres']
      ];
      
      const [homeTeam, awayTeam] = teams[i] || ['Team A', 'Team B'];
      const gameNum = i + 3;
      
      return {
        id: `mlb_game_${gameNum}`,
        sport_key: 'baseball_mlb',
        sport_title: 'MLB',
        commence_time: new Date(Date.now() + (8 + i) * 60 * 60 * 1000).toISOString(),
        home_team: homeTeam,
        away_team: awayTeam,
        bookmakers: [
          {
            key: ['draftkings', 'fanduel', 'betmgm', 'caesars'][i % 4],
            title: ['DraftKings', 'FanDuel', 'BetMGM', 'Caesars'][i % 4],
            last_update: new Date().toISOString(),
            markets: [
              {
                key: 'h2h',
                last_update: new Date().toISOString(),
                outcomes: [
                  { name: homeTeam, price: -120 - (i * 10) % 100 },
                  { name: awayTeam, price: 100 + (i * 8) % 80 }
                ]
              },
              {
                key: 'spreads',
                last_update: new Date().toISOString(),
                outcomes: [
                  { name: homeTeam, price: -110, point: -1.5 },
                  { name: awayTeam, price: -110, point: 1.5 }
                ]
              },
              {
                key: 'totals',
                last_update: new Date().toISOString(),
                outcomes: [
                  { name: 'Over', price: -105, point: 8.5 + (i % 3) * 0.5 },
                  { name: 'Under', price: -115, point: 8.5 + (i % 3) * 0.5 }
                ]
              }
            ]
          }
        ]
      };
    })
  ],

  // NHL Games
  'icehockey_nhl': [
    {
      id: 'nhl_game_1',
      sport_key: 'icehockey_nhl',
      sport_title: 'NHL',
      commence_time: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(), // 1 hour from now
      home_team: 'Edmonton Oilers',
      away_team: 'Calgary Flames',
      bookmakers: [
        {
          key: 'draftkings',
          title: 'DraftKings',
          last_update: new Date().toISOString(),
          markets: [
            {
              key: 'h2h',
              last_update: new Date().toISOString(),
              outcomes: [
                { name: 'Edmonton Oilers', price: -125 },
                { name: 'Calgary Flames', price: 105 }
              ]
            },
            {
              key: 'spreads',
              last_update: new Date().toISOString(),
              outcomes: [
                { name: 'Edmonton Oilers', price: -110, point: -1.5 },
                { name: 'Calgary Flames', price: -110, point: 1.5 }
              ]
            },
            {
              key: 'totals',
              last_update: new Date().toISOString(),
              outcomes: [
                { name: 'Over', price: -110, point: 6.5 },
                { name: 'Under', price: -110, point: 6.5 }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'nhl_game_2',
      sport_key: 'icehockey_nhl',
      sport_title: 'NHL',
      commence_time: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours from now
      home_team: 'Toronto Maple Leafs',
      away_team: 'Montreal Canadiens',
      bookmakers: [
        {
          key: 'fanduel',
          title: 'FanDuel',
          last_update: new Date().toISOString(),
          markets: [
            {
              key: 'h2h',
              last_update: new Date().toISOString(),
              outcomes: [
                { name: 'Toronto Maple Leafs', price: -160 },
                { name: 'Montreal Canadiens', price: 140 }
              ]
            },
            {
              key: 'spreads',
              last_update: new Date().toISOString(),
              outcomes: [
                { name: 'Toronto Maple Leafs', price: -110, point: -1.5 },
                { name: 'Montreal Canadiens', price: -110, point: 1.5 }
              ]
            },
            {
              key: 'totals',
              last_update: new Date().toISOString(),
              outcomes: [
                { name: 'Over', price: -105, point: 6.0 },
                { name: 'Under', price: -115, point: 6.0 }
              ]
            }
          ]
        }
      ]
    }
  ],

  // NCAAF Games
  'americanfootball_ncaaf': [
    {
      id: 'ncaaf_game_1',
      sport_key: 'americanfootball_ncaaf',
      sport_title: 'NCAAF',
      commence_time: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours from now
      home_team: 'Alabama Crimson Tide',
      away_team: 'Georgia Bulldogs',
      bookmakers: [
        {
          key: 'caesars',
          title: 'Caesars',
          last_update: new Date().toISOString(),
          markets: [
            {
              key: 'h2h',
              last_update: new Date().toISOString(),
              outcomes: [
                { name: 'Alabama Crimson Tide', price: -110 },
                { name: 'Georgia Bulldogs', price: -110 }
              ]
            },
            {
              key: 'spreads',
              last_update: new Date().toISOString(),
              outcomes: [
                { name: 'Alabama Crimson Tide', price: -110, point: -1.0 },
                { name: 'Georgia Bulldogs', price: -110, point: 1.0 }
              ]
            },
            {
              key: 'totals',
              last_update: new Date().toISOString(),
              outcomes: [
                { name: 'Over', price: -110, point: 52.5 },
                { name: 'Under', price: -110, point: 52.5 }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'ncaaf_game_2',
      sport_key: 'americanfootball_ncaaf',
      sport_title: 'NCAAF',
      commence_time: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(), // Tomorrow
      home_team: 'Ohio State Buckeyes',
      away_team: 'Michigan Wolverines',
      bookmakers: [
        {
          key: 'draftkings',
          title: 'DraftKings',
          last_update: new Date().toISOString(),
          markets: [
            {
              key: 'h2h',
              last_update: new Date().toISOString(),
              outcomes: [
                { name: 'Ohio State Buckeyes', price: -140 },
                { name: 'Michigan Wolverines', price: 120 }
              ]
            },
            {
              key: 'spreads',
              last_update: new Date().toISOString(),
              outcomes: [
                { name: 'Ohio State Buckeyes', price: -110, point: -3.0 },
                { name: 'Michigan Wolverines', price: -110, point: 3.0 }
              ]
            },
            {
              key: 'totals',
              last_update: new Date().toISOString(),
              outcomes: [
                { name: 'Over', price: -110, point: 58.5 },
                { name: 'Under', price: -110, point: 58.5 }
              ]
            }
          ]
        }
      ]
    }
  ],

  // NCAAB Games
  'basketball_ncaab': [
    {
      id: 'ncaab_game_1',
      sport_key: 'basketball_ncaab',
      sport_title: 'NCAAB',
      commence_time: new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString(), // 9 hours from now
      home_team: 'Duke Blue Devils',
      away_team: 'North Carolina Tar Heels',
      bookmakers: [
        {
          key: 'betmgm',
          title: 'BetMGM',
          last_update: new Date().toISOString(),
          markets: [
            {
              key: 'h2h',
              last_update: new Date().toISOString(),
              outcomes: [
                { name: 'Duke Blue Devils', price: -160 },
                { name: 'North Carolina Tar Heels', price: 140 }
              ]
            },
            {
              key: 'spreads',
              last_update: new Date().toISOString(),
              outcomes: [
                { name: 'Duke Blue Devils', price: -110, point: -4.0 },
                { name: 'North Carolina Tar Heels', price: -110, point: 4.0 }
              ]
            },
            {
              key: 'totals',
              last_update: new Date().toISOString(),
              outcomes: [
                { name: 'Over', price: -110, point: 155.5 },
                { name: 'Under', price: -110, point: 155.5 }
              ]
            }
          ]
        }
      ]
    }
  ],

  // Champions League Games
  'soccer_uefa_champs_league': [
    {
      id: 'ucl_game_1',
      sport_key: 'soccer_uefa_champs_league',
      sport_title: 'Champions League',
      commence_time: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString(), // 10 hours from now
      home_team: 'Manchester City',
      away_team: 'Real Madrid',
      bookmakers: [
        {
          key: 'fanduel',
          title: 'FanDuel',
          last_update: new Date().toISOString(),
          markets: [
            {
              key: 'h2h',
              last_update: new Date().toISOString(),
              outcomes: [
                { name: 'Manchester City', price: -110 },
                { name: 'Draw', price: 250 },
                { name: 'Real Madrid', price: 280 }
              ]
            },
            {
              key: 'spreads',
              last_update: new Date().toISOString(),
              outcomes: [
                { name: 'Manchester City', price: -110, point: -0.5 },
                { name: 'Real Madrid', price: -110, point: 0.5 }
              ]
            },
            {
              key: 'totals',
              last_update: new Date().toISOString(),
              outcomes: [
                { name: 'Over', price: -110, point: 2.5 },
                { name: 'Under', price: -110, point: 2.5 }
              ]
            }
          ]
        }
      ]
    }
  ],

  // MLS Games
  'soccer_usa_mls': [
    {
      id: 'mls_game_1',
      sport_key: 'soccer_usa_mls',
      sport_title: 'MLS',
      commence_time: new Date(Date.now() + 11 * 60 * 60 * 1000).toISOString(), // 11 hours from now
      home_team: 'LA Galaxy',
      away_team: 'LAFC',
      bookmakers: [
        {
          key: 'draftkings',
          title: 'DraftKings',
          last_update: new Date().toISOString(),
          markets: [
            {
              key: 'h2h',
              last_update: new Date().toISOString(),
              outcomes: [
                { name: 'LA Galaxy', price: 170 },
                { name: 'Draw', price: 220 },
                { name: 'LAFC', price: 150 }
              ]
            },
            {
              key: 'spreads',
              last_update: new Date().toISOString(),
              outcomes: [
                { name: 'LA Galaxy', price: -110, point: 0.0 },
                { name: 'LAFC', price: -110, point: 0.0 }
              ]
            },
            {
              key: 'totals',
              last_update: new Date().toISOString(),
              outcomes: [
                { name: 'Over', price: -105, point: 3.0 },
                { name: 'Under', price: -115, point: 3.0 }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'mls_game_2',
      sport_key: 'soccer_usa_mls',
      sport_title: 'MLS',
      commence_time: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(), // Tomorrow
      home_team: 'Seattle Sounders FC',
      away_team: 'Portland Timbers',
      bookmakers: [
        {
          key: 'betmgm',
          title: 'BetMGM',
          last_update: new Date().toISOString(),
          markets: [
            {
              key: 'h2h',
              last_update: new Date().toISOString(),
              outcomes: [
                { name: 'Seattle Sounders FC', price: 130 },
                { name: 'Draw', price: 200 },
                { name: 'Portland Timbers', price: 180 }
              ]
            },
            {
              key: 'spreads',
              last_update: new Date().toISOString(),
              outcomes: [
                { name: 'Seattle Sounders FC', price: -110, point: -0.5 },
                { name: 'Portland Timbers', price: -110, point: 0.5 }
              ]
            },
            {
              key: 'totals',
              last_update: new Date().toISOString(),
              outcomes: [
                { name: 'Over', price: -110, point: 2.5 },
                { name: 'Under', price: -110, point: 2.5 }
              ]
            }
          ]
        }
      ]
    }
  ]
};

// Function to get mock games for testing
export const getMockGamesForSport = (sportKey: string): Game[] => {
  return mockGamesData[sportKey] || [];
};

// Function to get all mock games
export const getAllMockGames = (): Record<string, Game[]> => {
  return mockGamesData;
};