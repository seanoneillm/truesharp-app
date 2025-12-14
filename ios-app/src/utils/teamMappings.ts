// Team name to abbreviation and ESPN team ID mappings for multiple leagues

export interface TeamInfo {
  abbreviation: string;
  espnId: number;
  fullName: string;
  city: string;
  name: string;
}

export const NBA_TEAMS: Record<string, TeamInfo> = {
  // Atlanta Hawks
  'Atlanta Hawks': { abbreviation: 'ATL', espnId: 1, fullName: 'Atlanta Hawks', city: 'Atlanta', name: 'Hawks' },
  'Hawks': { abbreviation: 'ATL', espnId: 1, fullName: 'Atlanta Hawks', city: 'Atlanta', name: 'Hawks' },
  
  // Boston Celtics
  'Boston Celtics': { abbreviation: 'BOS', espnId: 2, fullName: 'Boston Celtics', city: 'Boston', name: 'Celtics' },
  'Celtics': { abbreviation: 'BOS', espnId: 2, fullName: 'Boston Celtics', city: 'Boston', name: 'Celtics' },
  
  // Brooklyn Nets
  'Brooklyn Nets': { abbreviation: 'BKN', espnId: 17, fullName: 'Brooklyn Nets', city: 'Brooklyn', name: 'Nets' },
  'Nets': { abbreviation: 'BKN', espnId: 17, fullName: 'Brooklyn Nets', city: 'Brooklyn', name: 'Nets' },
  
  // Charlotte Hornets
  'Charlotte Hornets': { abbreviation: 'CHA', espnId: 30, fullName: 'Charlotte Hornets', city: 'Charlotte', name: 'Hornets' },
  'Hornets': { abbreviation: 'CHA', espnId: 30, fullName: 'Charlotte Hornets', city: 'Charlotte', name: 'Hornets' },
  
  // Chicago Bulls
  'Chicago Bulls': { abbreviation: 'CHI', espnId: 4, fullName: 'Chicago Bulls', city: 'Chicago', name: 'Bulls' },
  'Bulls': { abbreviation: 'CHI', espnId: 4, fullName: 'Chicago Bulls', city: 'Chicago', name: 'Bulls' },
  
  // Cleveland Cavaliers
  'Cleveland Cavaliers': { abbreviation: 'CLE', espnId: 5, fullName: 'Cleveland Cavaliers', city: 'Cleveland', name: 'Cavaliers' },
  'Cavaliers': { abbreviation: 'CLE', espnId: 5, fullName: 'Cleveland Cavaliers', city: 'Cleveland', name: 'Cavaliers' },
  'Cavs': { abbreviation: 'CLE', espnId: 5, fullName: 'Cleveland Cavaliers', city: 'Cleveland', name: 'Cavaliers' },
  
  // Dallas Mavericks
  'Dallas Mavericks': { abbreviation: 'DAL', espnId: 6, fullName: 'Dallas Mavericks', city: 'Dallas', name: 'Mavericks' },
  'Mavericks': { abbreviation: 'DAL', espnId: 6, fullName: 'Dallas Mavericks', city: 'Dallas', name: 'Mavericks' },
  'Mavs': { abbreviation: 'DAL', espnId: 6, fullName: 'Dallas Mavericks', city: 'Dallas', name: 'Mavericks' },
  
  // Denver Nuggets
  'Denver Nuggets': { abbreviation: 'DEN', espnId: 7, fullName: 'Denver Nuggets', city: 'Denver', name: 'Nuggets' },
  'Nuggets': { abbreviation: 'DEN', espnId: 7, fullName: 'Denver Nuggets', city: 'Denver', name: 'Nuggets' },
  
  // Detroit Pistons
  'Detroit Pistons': { abbreviation: 'DET', espnId: 8, fullName: 'Detroit Pistons', city: 'Detroit', name: 'Pistons' },
  'Pistons': { abbreviation: 'DET', espnId: 8, fullName: 'Detroit Pistons', city: 'Detroit', name: 'Pistons' },
  
  // Golden State Warriors
  'Golden State Warriors': { abbreviation: 'GSW', espnId: 9, fullName: 'Golden State Warriors', city: 'Golden State', name: 'Warriors' },
  'Warriors': { abbreviation: 'GSW', espnId: 9, fullName: 'Golden State Warriors', city: 'Golden State', name: 'Warriors' },
  
  // Houston Rockets
  'Houston Rockets': { abbreviation: 'HOU', espnId: 10, fullName: 'Houston Rockets', city: 'Houston', name: 'Rockets' },
  'Rockets': { abbreviation: 'HOU', espnId: 10, fullName: 'Houston Rockets', city: 'Houston', name: 'Rockets' },
  
  // Indiana Pacers
  'Indiana Pacers': { abbreviation: 'IND', espnId: 11, fullName: 'Indiana Pacers', city: 'Indiana', name: 'Pacers' },
  'Pacers': { abbreviation: 'IND', espnId: 11, fullName: 'Indiana Pacers', city: 'Indiana', name: 'Pacers' },
  
  // Los Angeles Clippers
  'LA Clippers': { abbreviation: 'LAC', espnId: 12, fullName: 'LA Clippers', city: 'LA', name: 'Clippers' },
  'Los Angeles Clippers': { abbreviation: 'LAC', espnId: 12, fullName: 'LA Clippers', city: 'LA', name: 'Clippers' },
  'Clippers': { abbreviation: 'LAC', espnId: 12, fullName: 'LA Clippers', city: 'LA', name: 'Clippers' },
  
  // Los Angeles Lakers
  'LA Lakers': { abbreviation: 'LAL', espnId: 13, fullName: 'LA Lakers', city: 'LA', name: 'Lakers' },
  'Los Angeles Lakers': { abbreviation: 'LAL', espnId: 13, fullName: 'LA Lakers', city: 'LA', name: 'Lakers' },
  'Lakers': { abbreviation: 'LAL', espnId: 13, fullName: 'LA Lakers', city: 'LA', name: 'Lakers' },
  
  // Memphis Grizzlies
  'Memphis Grizzlies': { abbreviation: 'MEM', espnId: 29, fullName: 'Memphis Grizzlies', city: 'Memphis', name: 'Grizzlies' },
  'Grizzlies': { abbreviation: 'MEM', espnId: 29, fullName: 'Memphis Grizzlies', city: 'Memphis', name: 'Grizzlies' },
  
  // Miami Heat
  'Miami Heat': { abbreviation: 'MIA', espnId: 14, fullName: 'Miami Heat', city: 'Miami', name: 'Heat' },
  'Heat': { abbreviation: 'MIA', espnId: 14, fullName: 'Miami Heat', city: 'Miami', name: 'Heat' },
  
  // Milwaukee Bucks
  'Milwaukee Bucks': { abbreviation: 'MIL', espnId: 15, fullName: 'Milwaukee Bucks', city: 'Milwaukee', name: 'Bucks' },
  'Bucks': { abbreviation: 'MIL', espnId: 15, fullName: 'Milwaukee Bucks', city: 'Milwaukee', name: 'Bucks' },
  
  // Minnesota Timberwolves
  'Minnesota Timberwolves': { abbreviation: 'MIN', espnId: 16, fullName: 'Minnesota Timberwolves', city: 'Minnesota', name: 'Timberwolves' },
  'Timberwolves': { abbreviation: 'MIN', espnId: 16, fullName: 'Minnesota Timberwolves', city: 'Minnesota', name: 'Timberwolves' },
  'T-Wolves': { abbreviation: 'MIN', espnId: 16, fullName: 'Minnesota Timberwolves', city: 'Minnesota', name: 'Timberwolves' },
  
  // New Orleans Pelicans
  'New Orleans Pelicans': { abbreviation: 'NOP', espnId: 3, fullName: 'New Orleans Pelicans', city: 'New Orleans', name: 'Pelicans' },
  'Pelicans': { abbreviation: 'NOP', espnId: 3, fullName: 'New Orleans Pelicans', city: 'New Orleans', name: 'Pelicans' },
  
  // New York Knicks
  'New York Knicks': { abbreviation: 'NYK', espnId: 18, fullName: 'New York Knicks', city: 'New York', name: 'Knicks' },
  'Knicks': { abbreviation: 'NYK', espnId: 18, fullName: 'New York Knicks', city: 'New York', name: 'Knicks' },
  
  // Oklahoma City Thunder
  'Oklahoma City Thunder': { abbreviation: 'OKC', espnId: 25, fullName: 'Oklahoma City Thunder', city: 'Oklahoma City', name: 'Thunder' },
  'Thunder': { abbreviation: 'OKC', espnId: 25, fullName: 'Oklahoma City Thunder', city: 'Oklahoma City', name: 'Thunder' },
  
  // Orlando Magic
  'Orlando Magic': { abbreviation: 'ORL', espnId: 19, fullName: 'Orlando Magic', city: 'Orlando', name: 'Magic' },
  'Magic': { abbreviation: 'ORL', espnId: 19, fullName: 'Orlando Magic', city: 'Orlando', name: 'Magic' },
  
  // Philadelphia 76ers
  'Philadelphia 76ers': { abbreviation: 'PHI', espnId: 20, fullName: 'Philadelphia 76ers', city: 'Philadelphia', name: '76ers' },
  '76ers': { abbreviation: 'PHI', espnId: 20, fullName: 'Philadelphia 76ers', city: 'Philadelphia', name: '76ers' },
  'Sixers': { abbreviation: 'PHI', espnId: 20, fullName: 'Philadelphia 76ers', city: 'Philadelphia', name: '76ers' },
  
  // Phoenix Suns
  'Phoenix Suns': { abbreviation: 'PHX', espnId: 21, fullName: 'Phoenix Suns', city: 'Phoenix', name: 'Suns' },
  'Suns': { abbreviation: 'PHX', espnId: 21, fullName: 'Phoenix Suns', city: 'Phoenix', name: 'Suns' },
  
  // Portland Trail Blazers
  'Portland Trail Blazers': { abbreviation: 'POR', espnId: 22, fullName: 'Portland Trail Blazers', city: 'Portland', name: 'Trail Blazers' },
  'Trail Blazers': { abbreviation: 'POR', espnId: 22, fullName: 'Portland Trail Blazers', city: 'Portland', name: 'Trail Blazers' },
  'Blazers': { abbreviation: 'POR', espnId: 22, fullName: 'Portland Trail Blazers', city: 'Portland', name: 'Trail Blazers' },
  
  // Sacramento Kings
  'Sacramento Kings': { abbreviation: 'SAC', espnId: 23, fullName: 'Sacramento Kings', city: 'Sacramento', name: 'Kings' },
  'Kings': { abbreviation: 'SAC', espnId: 23, fullName: 'Sacramento Kings', city: 'Sacramento', name: 'Kings' },
  
  // San Antonio Spurs
  'San Antonio Spurs': { abbreviation: 'SAS', espnId: 24, fullName: 'San Antonio Spurs', city: 'San Antonio', name: 'Spurs' },
  'Spurs': { abbreviation: 'SAS', espnId: 24, fullName: 'San Antonio Spurs', city: 'San Antonio', name: 'Spurs' },
  
  // Toronto Raptors
  'Toronto Raptors': { abbreviation: 'TOR', espnId: 28, fullName: 'Toronto Raptors', city: 'Toronto', name: 'Raptors' },
  'Raptors': { abbreviation: 'TOR', espnId: 28, fullName: 'Toronto Raptors', city: 'Toronto', name: 'Raptors' },
  
  // Utah Jazz
  'Utah Jazz': { abbreviation: 'UTA', espnId: 26, fullName: 'Utah Jazz', city: 'Utah', name: 'Jazz' },
  'Jazz': { abbreviation: 'UTA', espnId: 26, fullName: 'Utah Jazz', city: 'Utah', name: 'Jazz' },
  
  // Washington Wizards
  'Washington Wizards': { abbreviation: 'WAS', espnId: 27, fullName: 'Washington Wizards', city: 'Washington', name: 'Wizards' },
  'Wizards': { abbreviation: 'WAS', espnId: 27, fullName: 'Washington Wizards', city: 'Washington', name: 'Wizards' },
};

export const NFL_TEAMS: Record<string, TeamInfo> = {
  // Arizona Cardinals
  'Arizona Cardinals': { abbreviation: 'ARI', espnId: 22, fullName: 'Arizona Cardinals', city: 'Arizona', name: 'Cardinals' },
  'Cardinals': { abbreviation: 'ARI', espnId: 22, fullName: 'Arizona Cardinals', city: 'Arizona', name: 'Cardinals' },
  
  // Atlanta Falcons
  'Atlanta Falcons': { abbreviation: 'ATL', espnId: 1, fullName: 'Atlanta Falcons', city: 'Atlanta', name: 'Falcons' },
  'Falcons': { abbreviation: 'ATL', espnId: 1, fullName: 'Atlanta Falcons', city: 'Atlanta', name: 'Falcons' },
  
  // Baltimore Ravens
  'Baltimore Ravens': { abbreviation: 'BAL', espnId: 33, fullName: 'Baltimore Ravens', city: 'Baltimore', name: 'Ravens' },
  'Ravens': { abbreviation: 'BAL', espnId: 33, fullName: 'Baltimore Ravens', city: 'Baltimore', name: 'Ravens' },
  
  // Buffalo Bills
  'Buffalo Bills': { abbreviation: 'BUF', espnId: 2, fullName: 'Buffalo Bills', city: 'Buffalo', name: 'Bills' },
  'Bills': { abbreviation: 'BUF', espnId: 2, fullName: 'Buffalo Bills', city: 'Buffalo', name: 'Bills' },
  
  // Carolina Panthers
  'Carolina Panthers': { abbreviation: 'CAR', espnId: 29, fullName: 'Carolina Panthers', city: 'Carolina', name: 'Panthers' },
  'Panthers': { abbreviation: 'CAR', espnId: 29, fullName: 'Carolina Panthers', city: 'Carolina', name: 'Panthers' },
  
  // Chicago Bears
  'Chicago Bears': { abbreviation: 'CHI', espnId: 3, fullName: 'Chicago Bears', city: 'Chicago', name: 'Bears' },
  'Bears': { abbreviation: 'CHI', espnId: 3, fullName: 'Chicago Bears', city: 'Chicago', name: 'Bears' },
  
  // Cincinnati Bengals
  'Cincinnati Bengals': { abbreviation: 'CIN', espnId: 4, fullName: 'Cincinnati Bengals', city: 'Cincinnati', name: 'Bengals' },
  'Bengals': { abbreviation: 'CIN', espnId: 4, fullName: 'Cincinnati Bengals', city: 'Cincinnati', name: 'Bengals' },
  
  // Cleveland Browns
  'Cleveland Browns': { abbreviation: 'CLE', espnId: 5, fullName: 'Cleveland Browns', city: 'Cleveland', name: 'Browns' },
  'Browns': { abbreviation: 'CLE', espnId: 5, fullName: 'Cleveland Browns', city: 'Cleveland', name: 'Browns' },
  
  // Dallas Cowboys
  'Dallas Cowboys': { abbreviation: 'DAL', espnId: 6, fullName: 'Dallas Cowboys', city: 'Dallas', name: 'Cowboys' },
  'Cowboys': { abbreviation: 'DAL', espnId: 6, fullName: 'Dallas Cowboys', city: 'Dallas', name: 'Cowboys' },
  
  // Denver Broncos
  'Denver Broncos': { abbreviation: 'DEN', espnId: 7, fullName: 'Denver Broncos', city: 'Denver', name: 'Broncos' },
  'Broncos': { abbreviation: 'DEN', espnId: 7, fullName: 'Denver Broncos', city: 'Denver', name: 'Broncos' },
  
  // Detroit Lions
  'Detroit Lions': { abbreviation: 'DET', espnId: 8, fullName: 'Detroit Lions', city: 'Detroit', name: 'Lions' },
  'Lions': { abbreviation: 'DET', espnId: 8, fullName: 'Detroit Lions', city: 'Detroit', name: 'Lions' },
  
  // Green Bay Packers
  'Green Bay Packers': { abbreviation: 'GB', espnId: 9, fullName: 'Green Bay Packers', city: 'Green Bay', name: 'Packers' },
  'Packers': { abbreviation: 'GB', espnId: 9, fullName: 'Green Bay Packers', city: 'Green Bay', name: 'Packers' },
  
  // Houston Texans
  'Houston Texans': { abbreviation: 'HOU', espnId: 34, fullName: 'Houston Texans', city: 'Houston', name: 'Texans' },
  'Texans': { abbreviation: 'HOU', espnId: 34, fullName: 'Houston Texans', city: 'Houston', name: 'Texans' },
  
  // Indianapolis Colts
  'Indianapolis Colts': { abbreviation: 'IND', espnId: 11, fullName: 'Indianapolis Colts', city: 'Indianapolis', name: 'Colts' },
  'Colts': { abbreviation: 'IND', espnId: 11, fullName: 'Indianapolis Colts', city: 'Indianapolis', name: 'Colts' },
  
  // Jacksonville Jaguars
  'Jacksonville Jaguars': { abbreviation: 'JAX', espnId: 30, fullName: 'Jacksonville Jaguars', city: 'Jacksonville', name: 'Jaguars' },
  'Jaguars': { abbreviation: 'JAX', espnId: 30, fullName: 'Jacksonville Jaguars', city: 'Jacksonville', name: 'Jaguars' },
  'Jags': { abbreviation: 'JAX', espnId: 30, fullName: 'Jacksonville Jaguars', city: 'Jacksonville', name: 'Jaguars' },
  
  // Kansas City Chiefs
  'Kansas City Chiefs': { abbreviation: 'KC', espnId: 12, fullName: 'Kansas City Chiefs', city: 'Kansas City', name: 'Chiefs' },
  'Chiefs': { abbreviation: 'KC', espnId: 12, fullName: 'Kansas City Chiefs', city: 'Kansas City', name: 'Chiefs' },
  
  // Las Vegas Raiders
  'Las Vegas Raiders': { abbreviation: 'LV', espnId: 13, fullName: 'Las Vegas Raiders', city: 'Las Vegas', name: 'Raiders' },
  'Raiders': { abbreviation: 'LV', espnId: 13, fullName: 'Las Vegas Raiders', city: 'Las Vegas', name: 'Raiders' },
  
  // Los Angeles Chargers
  'Los Angeles Chargers': { abbreviation: 'LAC', espnId: 24, fullName: 'Los Angeles Chargers', city: 'Los Angeles', name: 'Chargers' },
  'LA Chargers': { abbreviation: 'LAC', espnId: 24, fullName: 'Los Angeles Chargers', city: 'Los Angeles', name: 'Chargers' },
  'Chargers': { abbreviation: 'LAC', espnId: 24, fullName: 'Los Angeles Chargers', city: 'Los Angeles', name: 'Chargers' },
  
  // Los Angeles Rams
  'Los Angeles Rams': { abbreviation: 'LAR', espnId: 14, fullName: 'Los Angeles Rams', city: 'Los Angeles', name: 'Rams' },
  'LA Rams': { abbreviation: 'LAR', espnId: 14, fullName: 'Los Angeles Rams', city: 'Los Angeles', name: 'Rams' },
  'Rams': { abbreviation: 'LAR', espnId: 14, fullName: 'Los Angeles Rams', city: 'Los Angeles', name: 'Rams' },
  
  // Miami Dolphins
  'Miami Dolphins': { abbreviation: 'MIA', espnId: 15, fullName: 'Miami Dolphins', city: 'Miami', name: 'Dolphins' },
  'Dolphins': { abbreviation: 'MIA', espnId: 15, fullName: 'Miami Dolphins', city: 'Miami', name: 'Dolphins' },
  
  // Minnesota Vikings
  'Minnesota Vikings': { abbreviation: 'MIN', espnId: 16, fullName: 'Minnesota Vikings', city: 'Minnesota', name: 'Vikings' },
  'Vikings': { abbreviation: 'MIN', espnId: 16, fullName: 'Minnesota Vikings', city: 'Minnesota', name: 'Vikings' },
  
  // New England Patriots
  'New England Patriots': { abbreviation: 'NE', espnId: 17, fullName: 'New England Patriots', city: 'New England', name: 'Patriots' },
  'Patriots': { abbreviation: 'NE', espnId: 17, fullName: 'New England Patriots', city: 'New England', name: 'Patriots' },
  'Pats': { abbreviation: 'NE', espnId: 17, fullName: 'New England Patriots', city: 'New England', name: 'Patriots' },
  
  // New Orleans Saints
  'New Orleans Saints': { abbreviation: 'NO', espnId: 18, fullName: 'New Orleans Saints', city: 'New Orleans', name: 'Saints' },
  'Saints': { abbreviation: 'NO', espnId: 18, fullName: 'New Orleans Saints', city: 'New Orleans', name: 'Saints' },
  
  // New York Giants
  'New York Giants': { abbreviation: 'NYG', espnId: 19, fullName: 'New York Giants', city: 'New York', name: 'Giants' },
  'Giants': { abbreviation: 'NYG', espnId: 19, fullName: 'New York Giants', city: 'New York', name: 'Giants' },
  
  // New York Jets
  'New York Jets': { abbreviation: 'NYJ', espnId: 20, fullName: 'New York Jets', city: 'New York', name: 'Jets' },
  'Jets': { abbreviation: 'NYJ', espnId: 20, fullName: 'New York Jets', city: 'New York', name: 'Jets' },
  
  // Philadelphia Eagles
  'Philadelphia Eagles': { abbreviation: 'PHI', espnId: 21, fullName: 'Philadelphia Eagles', city: 'Philadelphia', name: 'Eagles' },
  'Eagles': { abbreviation: 'PHI', espnId: 21, fullName: 'Philadelphia Eagles', city: 'Philadelphia', name: 'Eagles' },
  
  // Pittsburgh Steelers
  'Pittsburgh Steelers': { abbreviation: 'PIT', espnId: 23, fullName: 'Pittsburgh Steelers', city: 'Pittsburgh', name: 'Steelers' },
  'Steelers': { abbreviation: 'PIT', espnId: 23, fullName: 'Pittsburgh Steelers', city: 'Pittsburgh', name: 'Steelers' },
  
  // San Francisco 49ers
  'San Francisco 49ers': { abbreviation: 'SF', espnId: 25, fullName: 'San Francisco 49ers', city: 'San Francisco', name: '49ers' },
  '49ers': { abbreviation: 'SF', espnId: 25, fullName: 'San Francisco 49ers', city: 'San Francisco', name: '49ers' },
  'Niners': { abbreviation: 'SF', espnId: 25, fullName: 'San Francisco 49ers', city: 'San Francisco', name: '49ers' },
  
  // Seattle Seahawks
  'Seattle Seahawks': { abbreviation: 'SEA', espnId: 26, fullName: 'Seattle Seahawks', city: 'Seattle', name: 'Seahawks' },
  'Seahawks': { abbreviation: 'SEA', espnId: 26, fullName: 'Seattle Seahawks', city: 'Seattle', name: 'Seahawks' },
  
  // Tampa Bay Buccaneers
  'Tampa Bay Buccaneers': { abbreviation: 'TB', espnId: 27, fullName: 'Tampa Bay Buccaneers', city: 'Tampa Bay', name: 'Buccaneers' },
  'Buccaneers': { abbreviation: 'TB', espnId: 27, fullName: 'Tampa Bay Buccaneers', city: 'Tampa Bay', name: 'Buccaneers' },
  'Bucs': { abbreviation: 'TB', espnId: 27, fullName: 'Tampa Bay Buccaneers', city: 'Tampa Bay', name: 'Buccaneers' },
  
  // Tennessee Titans
  'Tennessee Titans': { abbreviation: 'TEN', espnId: 10, fullName: 'Tennessee Titans', city: 'Tennessee', name: 'Titans' },
  'Titans': { abbreviation: 'TEN', espnId: 10, fullName: 'Tennessee Titans', city: 'Tennessee', name: 'Titans' },
  
  // Washington Commanders
  'Washington Commanders': { abbreviation: 'WAS', espnId: 28, fullName: 'Washington Commanders', city: 'Washington', name: 'Commanders' },
  'Commanders': { abbreviation: 'WAS', espnId: 28, fullName: 'Washington Commanders', city: 'Washington', name: 'Commanders' },
};

export const MLB_TEAMS: Record<string, TeamInfo> = {
  // Arizona Diamondbacks
  'Arizona Diamondbacks': { abbreviation: 'ARI', espnId: 29, fullName: 'Arizona Diamondbacks', city: 'Arizona', name: 'Diamondbacks' },
  'Diamondbacks': { abbreviation: 'ARI', espnId: 29, fullName: 'Arizona Diamondbacks', city: 'Arizona', name: 'Diamondbacks' },
  'D-backs': { abbreviation: 'ARI', espnId: 29, fullName: 'Arizona Diamondbacks', city: 'Arizona', name: 'Diamondbacks' },
  
  // Atlanta Braves
  'Atlanta Braves': { abbreviation: 'ATL', espnId: 15, fullName: 'Atlanta Braves', city: 'Atlanta', name: 'Braves' },
  'Braves': { abbreviation: 'ATL', espnId: 15, fullName: 'Atlanta Braves', city: 'Atlanta', name: 'Braves' },
  
  // Baltimore Orioles
  'Baltimore Orioles': { abbreviation: 'BAL', espnId: 1, fullName: 'Baltimore Orioles', city: 'Baltimore', name: 'Orioles' },
  'Orioles': { abbreviation: 'BAL', espnId: 1, fullName: 'Baltimore Orioles', city: 'Baltimore', name: 'Orioles' },
  'O\'s': { abbreviation: 'BAL', espnId: 1, fullName: 'Baltimore Orioles', city: 'Baltimore', name: 'Orioles' },
  
  // Boston Red Sox
  'Boston Red Sox': { abbreviation: 'BOS', espnId: 2, fullName: 'Boston Red Sox', city: 'Boston', name: 'Red Sox' },
  'Red Sox': { abbreviation: 'BOS', espnId: 2, fullName: 'Boston Red Sox', city: 'Boston', name: 'Red Sox' },
  
  // Chicago Cubs
  'Chicago Cubs': { abbreviation: 'CHC', espnId: 16, fullName: 'Chicago Cubs', city: 'Chicago', name: 'Cubs' },
  'Cubs': { abbreviation: 'CHC', espnId: 16, fullName: 'Chicago Cubs', city: 'Chicago', name: 'Cubs' },
  
  // Chicago White Sox
  'Chicago White Sox': { abbreviation: 'CWS', espnId: 4, fullName: 'Chicago White Sox', city: 'Chicago', name: 'White Sox' },
  'White Sox': { abbreviation: 'CWS', espnId: 4, fullName: 'Chicago White Sox', city: 'Chicago', name: 'White Sox' },
  
  // Cincinnati Reds
  'Cincinnati Reds': { abbreviation: 'CIN', espnId: 17, fullName: 'Cincinnati Reds', city: 'Cincinnati', name: 'Reds' },
  'Reds': { abbreviation: 'CIN', espnId: 17, fullName: 'Cincinnati Reds', city: 'Cincinnati', name: 'Reds' },
  
  // Cleveland Guardians
  'Cleveland Guardians': { abbreviation: 'CLE', espnId: 5, fullName: 'Cleveland Guardians', city: 'Cleveland', name: 'Guardians' },
  'Guardians': { abbreviation: 'CLE', espnId: 5, fullName: 'Cleveland Guardians', city: 'Cleveland', name: 'Guardians' },
  
  // Colorado Rockies
  'Colorado Rockies': { abbreviation: 'COL', espnId: 27, fullName: 'Colorado Rockies', city: 'Colorado', name: 'Rockies' },
  'Rockies': { abbreviation: 'COL', espnId: 27, fullName: 'Colorado Rockies', city: 'Colorado', name: 'Rockies' },
  
  // Detroit Tigers
  'Detroit Tigers': { abbreviation: 'DET', espnId: 6, fullName: 'Detroit Tigers', city: 'Detroit', name: 'Tigers' },
  'Tigers': { abbreviation: 'DET', espnId: 6, fullName: 'Detroit Tigers', city: 'Detroit', name: 'Tigers' },
  
  // Houston Astros
  'Houston Astros': { abbreviation: 'HOU', espnId: 18, fullName: 'Houston Astros', city: 'Houston', name: 'Astros' },
  'Astros': { abbreviation: 'HOU', espnId: 18, fullName: 'Houston Astros', city: 'Houston', name: 'Astros' },
  
  // Kansas City Royals
  'Kansas City Royals': { abbreviation: 'KC', espnId: 7, fullName: 'Kansas City Royals', city: 'Kansas City', name: 'Royals' },
  'Royals': { abbreviation: 'KC', espnId: 7, fullName: 'Kansas City Royals', city: 'Kansas City', name: 'Royals' },
  
  // Los Angeles Angels
  'Los Angeles Angels': { abbreviation: 'LAA', espnId: 3, fullName: 'Los Angeles Angels', city: 'Los Angeles', name: 'Angels' },
  'Angels': { abbreviation: 'LAA', espnId: 3, fullName: 'Los Angeles Angels', city: 'Los Angeles', name: 'Angels' },
  'LA Angels': { abbreviation: 'LAA', espnId: 3, fullName: 'Los Angeles Angels', city: 'Los Angeles', name: 'Angels' },
  
  // Los Angeles Dodgers
  'Los Angeles Dodgers': { abbreviation: 'LAD', espnId: 19, fullName: 'Los Angeles Dodgers', city: 'Los Angeles', name: 'Dodgers' },
  'Dodgers': { abbreviation: 'LAD', espnId: 19, fullName: 'Los Angeles Dodgers', city: 'Los Angeles', name: 'Dodgers' },
  'LA Dodgers': { abbreviation: 'LAD', espnId: 19, fullName: 'Los Angeles Dodgers', city: 'Los Angeles', name: 'Dodgers' },
  
  // Miami Marlins
  'Miami Marlins': { abbreviation: 'MIA', espnId: 28, fullName: 'Miami Marlins', city: 'Miami', name: 'Marlins' },
  'Marlins': { abbreviation: 'MIA', espnId: 28, fullName: 'Miami Marlins', city: 'Miami', name: 'Marlins' },
  
  // Milwaukee Brewers
  'Milwaukee Brewers': { abbreviation: 'MIL', espnId: 8, fullName: 'Milwaukee Brewers', city: 'Milwaukee', name: 'Brewers' },
  'Brewers': { abbreviation: 'MIL', espnId: 8, fullName: 'Milwaukee Brewers', city: 'Milwaukee', name: 'Brewers' },
  
  // Minnesota Twins
  'Minnesota Twins': { abbreviation: 'MIN', espnId: 9, fullName: 'Minnesota Twins', city: 'Minnesota', name: 'Twins' },
  'Twins': { abbreviation: 'MIN', espnId: 9, fullName: 'Minnesota Twins', city: 'Minnesota', name: 'Twins' },
  
  // New York Mets
  'New York Mets': { abbreviation: 'NYM', espnId: 21, fullName: 'New York Mets', city: 'New York', name: 'Mets' },
  'Mets': { abbreviation: 'NYM', espnId: 21, fullName: 'New York Mets', city: 'New York', name: 'Mets' },
  
  // New York Yankees
  'New York Yankees': { abbreviation: 'NYY', espnId: 10, fullName: 'New York Yankees', city: 'New York', name: 'Yankees' },
  'Yankees': { abbreviation: 'NYY', espnId: 10, fullName: 'New York Yankees', city: 'New York', name: 'Yankees' },
  'Yanks': { abbreviation: 'NYY', espnId: 10, fullName: 'New York Yankees', city: 'New York', name: 'Yankees' },
  
  // Oakland Athletics
  'Oakland Athletics': { abbreviation: 'OAK', espnId: 11, fullName: 'Oakland Athletics', city: 'Oakland', name: 'Athletics' },
  'Athletics': { abbreviation: 'OAK', espnId: 11, fullName: 'Oakland Athletics', city: 'Oakland', name: 'Athletics' },
  'A\'s': { abbreviation: 'OAK', espnId: 11, fullName: 'Oakland Athletics', city: 'Oakland', name: 'Athletics' },
  
  // Philadelphia Phillies
  'Philadelphia Phillies': { abbreviation: 'PHI', espnId: 22, fullName: 'Philadelphia Phillies', city: 'Philadelphia', name: 'Phillies' },
  'Phillies': { abbreviation: 'PHI', espnId: 22, fullName: 'Philadelphia Phillies', city: 'Philadelphia', name: 'Phillies' },
  
  // Pittsburgh Pirates
  'Pittsburgh Pirates': { abbreviation: 'PIT', espnId: 23, fullName: 'Pittsburgh Pirates', city: 'Pittsburgh', name: 'Pirates' },
  'Pirates': { abbreviation: 'PIT', espnId: 23, fullName: 'Pittsburgh Pirates', city: 'Pittsburgh', name: 'Pirates' },
  
  // San Diego Padres
  'San Diego Padres': { abbreviation: 'SD', espnId: 25, fullName: 'San Diego Padres', city: 'San Diego', name: 'Padres' },
  'Padres': { abbreviation: 'SD', espnId: 25, fullName: 'San Diego Padres', city: 'San Diego', name: 'Padres' },
  
  // San Francisco Giants
  'San Francisco Giants': { abbreviation: 'SF', espnId: 26, fullName: 'San Francisco Giants', city: 'San Francisco', name: 'Giants' },
  'SF Giants': { abbreviation: 'SF', espnId: 26, fullName: 'San Francisco Giants', city: 'San Francisco', name: 'Giants' },
  
  // Seattle Mariners
  'Seattle Mariners': { abbreviation: 'SEA', espnId: 12, fullName: 'Seattle Mariners', city: 'Seattle', name: 'Mariners' },
  'Mariners': { abbreviation: 'SEA', espnId: 12, fullName: 'Seattle Mariners', city: 'Seattle', name: 'Mariners' },
  'M\'s': { abbreviation: 'SEA', espnId: 12, fullName: 'Seattle Mariners', city: 'Seattle', name: 'Mariners' },
  
  // St. Louis Cardinals
  'St. Louis Cardinals': { abbreviation: 'STL', espnId: 24, fullName: 'St. Louis Cardinals', city: 'St. Louis', name: 'Cardinals' },
  'Cardinals': { abbreviation: 'STL', espnId: 24, fullName: 'St. Louis Cardinals', city: 'St. Louis', name: 'Cardinals' },
  
  // Tampa Bay Rays
  'Tampa Bay Rays': { abbreviation: 'TB', espnId: 30, fullName: 'Tampa Bay Rays', city: 'Tampa Bay', name: 'Rays' },
  'Rays': { abbreviation: 'TB', espnId: 30, fullName: 'Tampa Bay Rays', city: 'Tampa Bay', name: 'Rays' },
  
  // Texas Rangers
  'Texas Rangers': { abbreviation: 'TEX', espnId: 13, fullName: 'Texas Rangers', city: 'Texas', name: 'Rangers' },
  'Rangers': { abbreviation: 'TEX', espnId: 13, fullName: 'Texas Rangers', city: 'Texas', name: 'Rangers' },
  
  // Toronto Blue Jays
  'Toronto Blue Jays': { abbreviation: 'TOR', espnId: 14, fullName: 'Toronto Blue Jays', city: 'Toronto', name: 'Blue Jays' },
  'Blue Jays': { abbreviation: 'TOR', espnId: 14, fullName: 'Toronto Blue Jays', city: 'Toronto', name: 'Blue Jays' },
  'Jays': { abbreviation: 'TOR', espnId: 14, fullName: 'Toronto Blue Jays', city: 'Toronto', name: 'Blue Jays' },
  
  // Washington Nationals
  'Washington Nationals': { abbreviation: 'WAS', espnId: 20, fullName: 'Washington Nationals', city: 'Washington', name: 'Nationals' },
  'Nationals': { abbreviation: 'WAS', espnId: 20, fullName: 'Washington Nationals', city: 'Washington', name: 'Nationals' },
  'Nats': { abbreviation: 'WAS', espnId: 20, fullName: 'Washington Nationals', city: 'Washington', name: 'Nationals' },
};

export const WNBA_TEAMS: Record<string, TeamInfo> = {
  // Atlanta Dream
  'Atlanta Dream': { abbreviation: 'ATL', espnId: 1, fullName: 'Atlanta Dream', city: 'Atlanta', name: 'Dream' },
  'Dream': { abbreviation: 'ATL', espnId: 1, fullName: 'Atlanta Dream', city: 'Atlanta', name: 'Dream' },
  
  // Chicago Sky
  'Chicago Sky': { abbreviation: 'CHI', espnId: 2, fullName: 'Chicago Sky', city: 'Chicago', name: 'Sky' },
  'Sky': { abbreviation: 'CHI', espnId: 2, fullName: 'Chicago Sky', city: 'Chicago', name: 'Sky' },
  
  // Connecticut Sun
  'Connecticut Sun': { abbreviation: 'CONN', espnId: 3, fullName: 'Connecticut Sun', city: 'Connecticut', name: 'Sun' },
  'Sun': { abbreviation: 'CONN', espnId: 3, fullName: 'Connecticut Sun', city: 'Connecticut', name: 'Sun' },
  
  // Dallas Wings
  'Dallas Wings': { abbreviation: 'DAL', espnId: 4, fullName: 'Dallas Wings', city: 'Dallas', name: 'Wings' },
  'Wings': { abbreviation: 'DAL', espnId: 4, fullName: 'Dallas Wings', city: 'Dallas', name: 'Wings' },
  
  // Indiana Fever
  'Indiana Fever': { abbreviation: 'IND', espnId: 5, fullName: 'Indiana Fever', city: 'Indiana', name: 'Fever' },
  'Fever': { abbreviation: 'IND', espnId: 5, fullName: 'Indiana Fever', city: 'Indiana', name: 'Fever' },
  
  // Las Vegas Aces
  'Las Vegas Aces': { abbreviation: 'LV', espnId: 6, fullName: 'Las Vegas Aces', city: 'Las Vegas', name: 'Aces' },
  'Aces': { abbreviation: 'LV', espnId: 6, fullName: 'Las Vegas Aces', city: 'Las Vegas', name: 'Aces' },
  
  // Los Angeles Sparks
  'Los Angeles Sparks': { abbreviation: 'LA', espnId: 7, fullName: 'Los Angeles Sparks', city: 'Los Angeles', name: 'Sparks' },
  'LA Sparks': { abbreviation: 'LA', espnId: 7, fullName: 'Los Angeles Sparks', city: 'Los Angeles', name: 'Sparks' },
  'Sparks': { abbreviation: 'LA', espnId: 7, fullName: 'Los Angeles Sparks', city: 'Los Angeles', name: 'Sparks' },
  
  // Minnesota Lynx
  'Minnesota Lynx': { abbreviation: 'MIN', espnId: 8, fullName: 'Minnesota Lynx', city: 'Minnesota', name: 'Lynx' },
  'Lynx': { abbreviation: 'MIN', espnId: 8, fullName: 'Minnesota Lynx', city: 'Minnesota', name: 'Lynx' },
  
  // New York Liberty
  'New York Liberty': { abbreviation: 'NY', espnId: 9, fullName: 'New York Liberty', city: 'New York', name: 'Liberty' },
  'Liberty': { abbreviation: 'NY', espnId: 9, fullName: 'New York Liberty', city: 'New York', name: 'Liberty' },
  
  // Phoenix Mercury
  'Phoenix Mercury': { abbreviation: 'PHX', espnId: 10, fullName: 'Phoenix Mercury', city: 'Phoenix', name: 'Mercury' },
  'Mercury': { abbreviation: 'PHX', espnId: 10, fullName: 'Phoenix Mercury', city: 'Phoenix', name: 'Mercury' },
  
  // Seattle Storm
  'Seattle Storm': { abbreviation: 'SEA', espnId: 11, fullName: 'Seattle Storm', city: 'Seattle', name: 'Storm' },
  'Storm': { abbreviation: 'SEA', espnId: 11, fullName: 'Seattle Storm', city: 'Seattle', name: 'Storm' },
  
  // Washington Mystics
  'Washington Mystics': { abbreviation: 'WAS', espnId: 12, fullName: 'Washington Mystics', city: 'Washington', name: 'Mystics' },
  'Mystics': { abbreviation: 'WAS', espnId: 12, fullName: 'Washington Mystics', city: 'Washington', name: 'Mystics' },
};

export const NHL_TEAMS: Record<string, TeamInfo> = {
  // Anaheim Ducks
  'Anaheim Ducks': { abbreviation: 'ANA', espnId: 1, fullName: 'Anaheim Ducks', city: 'Anaheim', name: 'Ducks' },
  'Ducks': { abbreviation: 'ANA', espnId: 1, fullName: 'Anaheim Ducks', city: 'Anaheim', name: 'Ducks' },
  
  // Arizona Coyotes
  'Arizona Coyotes': { abbreviation: 'ARI', espnId: 2, fullName: 'Arizona Coyotes', city: 'Arizona', name: 'Coyotes' },
  'Coyotes': { abbreviation: 'ARI', espnId: 2, fullName: 'Arizona Coyotes', city: 'Arizona', name: 'Coyotes' },
  
  // Boston Bruins
  'Boston Bruins': { abbreviation: 'BOS', espnId: 3, fullName: 'Boston Bruins', city: 'Boston', name: 'Bruins' },
  'Bruins': { abbreviation: 'BOS', espnId: 3, fullName: 'Boston Bruins', city: 'Boston', name: 'Bruins' },
  
  // Buffalo Sabres
  'Buffalo Sabres': { abbreviation: 'BUF', espnId: 4, fullName: 'Buffalo Sabres', city: 'Buffalo', name: 'Sabres' },
  'Sabres': { abbreviation: 'BUF', espnId: 4, fullName: 'Buffalo Sabres', city: 'Buffalo', name: 'Sabres' },
  
  // Calgary Flames
  'Calgary Flames': { abbreviation: 'CGY', espnId: 5, fullName: 'Calgary Flames', city: 'Calgary', name: 'Flames' },
  'Flames': { abbreviation: 'CGY', espnId: 5, fullName: 'Calgary Flames', city: 'Calgary', name: 'Flames' },
  
  // Carolina Hurricanes
  'Carolina Hurricanes': { abbreviation: 'CAR', espnId: 6, fullName: 'Carolina Hurricanes', city: 'Carolina', name: 'Hurricanes' },
  'Hurricanes': { abbreviation: 'CAR', espnId: 6, fullName: 'Carolina Hurricanes', city: 'Carolina', name: 'Hurricanes' },
  'Canes': { abbreviation: 'CAR', espnId: 6, fullName: 'Carolina Hurricanes', city: 'Carolina', name: 'Hurricanes' },
  
  // Chicago Blackhawks
  'Chicago Blackhawks': { abbreviation: 'CHI', espnId: 7, fullName: 'Chicago Blackhawks', city: 'Chicago', name: 'Blackhawks' },
  'Blackhawks': { abbreviation: 'CHI', espnId: 7, fullName: 'Chicago Blackhawks', city: 'Chicago', name: 'Blackhawks' },
  'Hawks': { abbreviation: 'CHI', espnId: 7, fullName: 'Chicago Blackhawks', city: 'Chicago', name: 'Blackhawks' },
  
  // Colorado Avalanche
  'Colorado Avalanche': { abbreviation: 'COL', espnId: 8, fullName: 'Colorado Avalanche', city: 'Colorado', name: 'Avalanche' },
  'Avalanche': { abbreviation: 'COL', espnId: 8, fullName: 'Colorado Avalanche', city: 'Colorado', name: 'Avalanche' },
  'Avs': { abbreviation: 'COL', espnId: 8, fullName: 'Colorado Avalanche', city: 'Colorado', name: 'Avalanche' },
  
  // Columbus Blue Jackets
  'Columbus Blue Jackets': { abbreviation: 'CBJ', espnId: 9, fullName: 'Columbus Blue Jackets', city: 'Columbus', name: 'Blue Jackets' },
  'Blue Jackets': { abbreviation: 'CBJ', espnId: 9, fullName: 'Columbus Blue Jackets', city: 'Columbus', name: 'Blue Jackets' },
  
  // Dallas Stars
  'Dallas Stars': { abbreviation: 'DAL', espnId: 10, fullName: 'Dallas Stars', city: 'Dallas', name: 'Stars' },
  'Stars': { abbreviation: 'DAL', espnId: 10, fullName: 'Dallas Stars', city: 'Dallas', name: 'Stars' },
  
  // Detroit Red Wings
  'Detroit Red Wings': { abbreviation: 'DET', espnId: 11, fullName: 'Detroit Red Wings', city: 'Detroit', name: 'Red Wings' },
  'Red Wings': { abbreviation: 'DET', espnId: 11, fullName: 'Detroit Red Wings', city: 'Detroit', name: 'Red Wings' },
  
  // Edmonton Oilers
  'Edmonton Oilers': { abbreviation: 'EDM', espnId: 12, fullName: 'Edmonton Oilers', city: 'Edmonton', name: 'Oilers' },
  'Oilers': { abbreviation: 'EDM', espnId: 12, fullName: 'Edmonton Oilers', city: 'Edmonton', name: 'Oilers' },
  
  // Florida Panthers
  'Florida Panthers': { abbreviation: 'FLA', espnId: 13, fullName: 'Florida Panthers', city: 'Florida', name: 'Panthers' },
  'Panthers': { abbreviation: 'FLA', espnId: 13, fullName: 'Florida Panthers', city: 'Florida', name: 'Panthers' },
  
  // Los Angeles Kings
  'Los Angeles Kings': { abbreviation: 'LAK', espnId: 14, fullName: 'Los Angeles Kings', city: 'Los Angeles', name: 'Kings' },
  'LA Kings': { abbreviation: 'LAK', espnId: 14, fullName: 'Los Angeles Kings', city: 'Los Angeles', name: 'Kings' },
  'Kings': { abbreviation: 'LAK', espnId: 14, fullName: 'Los Angeles Kings', city: 'Los Angeles', name: 'Kings' },
  
  // Minnesota Wild
  'Minnesota Wild': { abbreviation: 'MIN', espnId: 15, fullName: 'Minnesota Wild', city: 'Minnesota', name: 'Wild' },
  'Wild': { abbreviation: 'MIN', espnId: 15, fullName: 'Minnesota Wild', city: 'Minnesota', name: 'Wild' },
  
  // Montreal Canadiens
  'Montreal Canadiens': { abbreviation: 'MTL', espnId: 16, fullName: 'Montreal Canadiens', city: 'Montreal', name: 'Canadiens' },
  'Canadiens': { abbreviation: 'MTL', espnId: 16, fullName: 'Montreal Canadiens', city: 'Montreal', name: 'Canadiens' },
  'Habs': { abbreviation: 'MTL', espnId: 16, fullName: 'Montreal Canadiens', city: 'Montreal', name: 'Canadiens' },
  
  // Nashville Predators
  'Nashville Predators': { abbreviation: 'NSH', espnId: 17, fullName: 'Nashville Predators', city: 'Nashville', name: 'Predators' },
  'Predators': { abbreviation: 'NSH', espnId: 17, fullName: 'Nashville Predators', city: 'Nashville', name: 'Predators' },
  'Preds': { abbreviation: 'NSH', espnId: 17, fullName: 'Nashville Predators', city: 'Nashville', name: 'Predators' },
  
  // New Jersey Devils
  'New Jersey Devils': { abbreviation: 'NJ', espnId: 18, fullName: 'New Jersey Devils', city: 'New Jersey', name: 'Devils' },
  'Devils': { abbreviation: 'NJ', espnId: 18, fullName: 'New Jersey Devils', city: 'New Jersey', name: 'Devils' },
  
  // New York Islanders
  'New York Islanders': { abbreviation: 'NYI', espnId: 19, fullName: 'New York Islanders', city: 'New York', name: 'Islanders' },
  'Islanders': { abbreviation: 'NYI', espnId: 19, fullName: 'New York Islanders', city: 'New York', name: 'Islanders' },
  'Isles': { abbreviation: 'NYI', espnId: 19, fullName: 'New York Islanders', city: 'New York', name: 'Islanders' },
  
  // New York Rangers
  'New York Rangers': { abbreviation: 'NYR', espnId: 20, fullName: 'New York Rangers', city: 'New York', name: 'Rangers' },
  'Rangers': { abbreviation: 'NYR', espnId: 20, fullName: 'New York Rangers', city: 'New York', name: 'Rangers' },
  
  // Ottawa Senators
  'Ottawa Senators': { abbreviation: 'OTT', espnId: 21, fullName: 'Ottawa Senators', city: 'Ottawa', name: 'Senators' },
  'Senators': { abbreviation: 'OTT', espnId: 21, fullName: 'Ottawa Senators', city: 'Ottawa', name: 'Senators' },
  'Sens': { abbreviation: 'OTT', espnId: 21, fullName: 'Ottawa Senators', city: 'Ottawa', name: 'Senators' },
  
  // Philadelphia Flyers
  'Philadelphia Flyers': { abbreviation: 'PHI', espnId: 22, fullName: 'Philadelphia Flyers', city: 'Philadelphia', name: 'Flyers' },
  'Flyers': { abbreviation: 'PHI', espnId: 22, fullName: 'Philadelphia Flyers', city: 'Philadelphia', name: 'Flyers' },
  
  // Pittsburgh Penguins
  'Pittsburgh Penguins': { abbreviation: 'PIT', espnId: 23, fullName: 'Pittsburgh Penguins', city: 'Pittsburgh', name: 'Penguins' },
  'Penguins': { abbreviation: 'PIT', espnId: 23, fullName: 'Pittsburgh Penguins', city: 'Pittsburgh', name: 'Penguins' },
  'Pens': { abbreviation: 'PIT', espnId: 23, fullName: 'Pittsburgh Penguins', city: 'Pittsburgh', name: 'Penguins' },
  
  // San Jose Sharks
  'San Jose Sharks': { abbreviation: 'SJ', espnId: 24, fullName: 'San Jose Sharks', city: 'San Jose', name: 'Sharks' },
  'Sharks': { abbreviation: 'SJ', espnId: 24, fullName: 'San Jose Sharks', city: 'San Jose', name: 'Sharks' },
  
  // Seattle Kraken
  'Seattle Kraken': { abbreviation: 'SEA', espnId: 25, fullName: 'Seattle Kraken', city: 'Seattle', name: 'Kraken' },
  'Kraken': { abbreviation: 'SEA', espnId: 25, fullName: 'Seattle Kraken', city: 'Seattle', name: 'Kraken' },
  
  // St. Louis Blues
  'St. Louis Blues': { abbreviation: 'STL', espnId: 26, fullName: 'St. Louis Blues', city: 'St. Louis', name: 'Blues' },
  'Blues': { abbreviation: 'STL', espnId: 26, fullName: 'St. Louis Blues', city: 'St. Louis', name: 'Blues' },
  
  // Tampa Bay Lightning
  'Tampa Bay Lightning': { abbreviation: 'TB', espnId: 27, fullName: 'Tampa Bay Lightning', city: 'Tampa Bay', name: 'Lightning' },
  'Lightning': { abbreviation: 'TB', espnId: 27, fullName: 'Tampa Bay Lightning', city: 'Tampa Bay', name: 'Lightning' },
  'Bolts': { abbreviation: 'TB', espnId: 27, fullName: 'Tampa Bay Lightning', city: 'Tampa Bay', name: 'Lightning' },
  
  // Toronto Maple Leafs
  'Toronto Maple Leafs': { abbreviation: 'TOR', espnId: 28, fullName: 'Toronto Maple Leafs', city: 'Toronto', name: 'Maple Leafs' },
  'Maple Leafs': { abbreviation: 'TOR', espnId: 28, fullName: 'Toronto Maple Leafs', city: 'Toronto', name: 'Maple Leafs' },
  'Leafs': { abbreviation: 'TOR', espnId: 28, fullName: 'Toronto Maple Leafs', city: 'Toronto', name: 'Maple Leafs' },
  
  // Utah Hockey Club
  'Utah Hockey Club': { abbreviation: 'UTA', espnId: 29, fullName: 'Utah Hockey Club', city: 'Utah', name: 'Hockey Club' },
  'Utah HC': { abbreviation: 'UTA', espnId: 29, fullName: 'Utah Hockey Club', city: 'Utah', name: 'Hockey Club' },
  
  // Vancouver Canucks
  'Vancouver Canucks': { abbreviation: 'VAN', espnId: 30, fullName: 'Vancouver Canucks', city: 'Vancouver', name: 'Canucks' },
  'Canucks': { abbreviation: 'VAN', espnId: 30, fullName: 'Vancouver Canucks', city: 'Vancouver', name: 'Canucks' },
  'Nucks': { abbreviation: 'VAN', espnId: 30, fullName: 'Vancouver Canucks', city: 'Vancouver', name: 'Canucks' },
  
  // Vegas Golden Knights
  'Vegas Golden Knights': { abbreviation: 'VGK', espnId: 31, fullName: 'Vegas Golden Knights', city: 'Vegas', name: 'Golden Knights' },
  'Golden Knights': { abbreviation: 'VGK', espnId: 31, fullName: 'Vegas Golden Knights', city: 'Vegas', name: 'Golden Knights' },
  'Knights': { abbreviation: 'VGK', espnId: 31, fullName: 'Vegas Golden Knights', city: 'Vegas', name: 'Golden Knights' },
  
  // Washington Capitals
  'Washington Capitals': { abbreviation: 'WAS', espnId: 32, fullName: 'Washington Capitals', city: 'Washington', name: 'Capitals' },
  'Capitals': { abbreviation: 'WAS', espnId: 32, fullName: 'Washington Capitals', city: 'Washington', name: 'Capitals' },
  'Caps': { abbreviation: 'WAS', espnId: 32, fullName: 'Washington Capitals', city: 'Washington', name: 'Capitals' },
  
  // Winnipeg Jets
  'Winnipeg Jets': { abbreviation: 'WPG', espnId: 33, fullName: 'Winnipeg Jets', city: 'Winnipeg', name: 'Jets' },
  'Jets': { abbreviation: 'WPG', espnId: 33, fullName: 'Winnipeg Jets', city: 'Winnipeg', name: 'Jets' },
};

export const MLS_TEAMS: Record<string, TeamInfo> = {
  // Atlanta United FC
  'Atlanta United FC': { abbreviation: 'ATL', espnId: 1, fullName: 'Atlanta United FC', city: 'Atlanta', name: 'United FC' },
  'Atlanta United': { abbreviation: 'ATL', espnId: 1, fullName: 'Atlanta United FC', city: 'Atlanta', name: 'United FC' },
  'United': { abbreviation: 'ATL', espnId: 1, fullName: 'Atlanta United FC', city: 'Atlanta', name: 'United FC' },
  
  // Austin FC
  'Austin FC': { abbreviation: 'AUS', espnId: 2, fullName: 'Austin FC', city: 'Austin', name: 'FC' },
  
  // Charlotte FC
  'Charlotte FC': { abbreviation: 'CLT', espnId: 3, fullName: 'Charlotte FC', city: 'Charlotte', name: 'FC' },
  
  // Chicago Fire FC
  'Chicago Fire FC': { abbreviation: 'CHI', espnId: 4, fullName: 'Chicago Fire FC', city: 'Chicago', name: 'Fire FC' },
  'Chicago Fire': { abbreviation: 'CHI', espnId: 4, fullName: 'Chicago Fire FC', city: 'Chicago', name: 'Fire FC' },
  'Fire': { abbreviation: 'CHI', espnId: 4, fullName: 'Chicago Fire FC', city: 'Chicago', name: 'Fire FC' },
  
  // FC Cincinnati
  'FC Cincinnati': { abbreviation: 'CIN', espnId: 5, fullName: 'FC Cincinnati', city: 'Cincinnati', name: 'FC' },
  'Cincinnati': { abbreviation: 'CIN', espnId: 5, fullName: 'FC Cincinnati', city: 'Cincinnati', name: 'FC' },
  
  // Colorado Rapids
  'Colorado Rapids': { abbreviation: 'COL', espnId: 6, fullName: 'Colorado Rapids', city: 'Colorado', name: 'Rapids' },
  'Rapids': { abbreviation: 'COL', espnId: 6, fullName: 'Colorado Rapids', city: 'Colorado', name: 'Rapids' },
  
  // Columbus Crew
  'Columbus Crew': { abbreviation: 'CLB', espnId: 7, fullName: 'Columbus Crew', city: 'Columbus', name: 'Crew' },
  'Crew': { abbreviation: 'CLB', espnId: 7, fullName: 'Columbus Crew', city: 'Columbus', name: 'Crew' },
  
  // D.C. United
  'D.C. United': { abbreviation: 'DC', espnId: 8, fullName: 'D.C. United', city: 'D.C.', name: 'United' },
  'DC United': { abbreviation: 'DC', espnId: 8, fullName: 'D.C. United', city: 'D.C.', name: 'United' },
  
  // FC Dallas
  'FC Dallas': { abbreviation: 'DAL', espnId: 9, fullName: 'FC Dallas', city: 'Dallas', name: 'FC' },
  'Dallas': { abbreviation: 'DAL', espnId: 9, fullName: 'FC Dallas', city: 'Dallas', name: 'FC' },
  
  // Houston Dynamo FC
  'Houston Dynamo FC': { abbreviation: 'HOU', espnId: 10, fullName: 'Houston Dynamo FC', city: 'Houston', name: 'Dynamo FC' },
  'Houston Dynamo': { abbreviation: 'HOU', espnId: 10, fullName: 'Houston Dynamo FC', city: 'Houston', name: 'Dynamo FC' },
  'Dynamo': { abbreviation: 'HOU', espnId: 10, fullName: 'Houston Dynamo FC', city: 'Houston', name: 'Dynamo FC' },
  
  // Inter Miami CF
  'Inter Miami CF': { abbreviation: 'MIA', espnId: 11, fullName: 'Inter Miami CF', city: 'Miami', name: 'Inter CF' },
  'Inter Miami': { abbreviation: 'MIA', espnId: 11, fullName: 'Inter Miami CF', city: 'Miami', name: 'Inter CF' },
  'Miami': { abbreviation: 'MIA', espnId: 11, fullName: 'Inter Miami CF', city: 'Miami', name: 'Inter CF' },
  
  // LA Galaxy
  'LA Galaxy': { abbreviation: 'LAG', espnId: 12, fullName: 'LA Galaxy', city: 'LA', name: 'Galaxy' },
  'Los Angeles Galaxy': { abbreviation: 'LAG', espnId: 12, fullName: 'LA Galaxy', city: 'LA', name: 'Galaxy' },
  'Galaxy': { abbreviation: 'LAG', espnId: 12, fullName: 'LA Galaxy', city: 'LA', name: 'Galaxy' },
  
  // Los Angeles FC
  'Los Angeles FC': { abbreviation: 'LAFC', espnId: 13, fullName: 'Los Angeles FC', city: 'Los Angeles', name: 'FC' },
  'LAFC': { abbreviation: 'LAFC', espnId: 13, fullName: 'Los Angeles FC', city: 'Los Angeles', name: 'FC' },
  
  // Minnesota United FC
  'Minnesota United FC': { abbreviation: 'MIN', espnId: 14, fullName: 'Minnesota United FC', city: 'Minnesota', name: 'United FC' },
  'Minnesota United': { abbreviation: 'MIN', espnId: 14, fullName: 'Minnesota United FC', city: 'Minnesota', name: 'United FC' },
  'Loons': { abbreviation: 'MIN', espnId: 14, fullName: 'Minnesota United FC', city: 'Minnesota', name: 'United FC' },
  
  // Montreal Impact
  'CF Montréal': { abbreviation: 'MTL', espnId: 15, fullName: 'CF Montréal', city: 'Montréal', name: 'CF' },
  'Montreal Impact': { abbreviation: 'MTL', espnId: 15, fullName: 'CF Montréal', city: 'Montréal', name: 'CF' },
  'Impact': { abbreviation: 'MTL', espnId: 15, fullName: 'CF Montréal', city: 'Montréal', name: 'CF' },
  
  // Nashville SC
  'Nashville SC': { abbreviation: 'NSH', espnId: 16, fullName: 'Nashville SC', city: 'Nashville', name: 'SC' },
  
  // New England Revolution
  'New England Revolution': { abbreviation: 'NE', espnId: 17, fullName: 'New England Revolution', city: 'New England', name: 'Revolution' },
  'Revolution': { abbreviation: 'NE', espnId: 17, fullName: 'New England Revolution', city: 'New England', name: 'Revolution' },
  'Revs': { abbreviation: 'NE', espnId: 17, fullName: 'New England Revolution', city: 'New England', name: 'Revolution' },
  
  // New York City FC
  'New York City FC': { abbreviation: 'NYC', espnId: 18, fullName: 'New York City FC', city: 'New York City', name: 'FC' },
  'NYCFC': { abbreviation: 'NYC', espnId: 18, fullName: 'New York City FC', city: 'New York City', name: 'FC' },
  
  // New York Red Bulls
  'New York Red Bulls': { abbreviation: 'NYRB', espnId: 19, fullName: 'New York Red Bulls', city: 'New York', name: 'Red Bulls' },
  'Red Bulls': { abbreviation: 'NYRB', espnId: 19, fullName: 'New York Red Bulls', city: 'New York', name: 'Red Bulls' },
  'RBNY': { abbreviation: 'NYRB', espnId: 19, fullName: 'New York Red Bulls', city: 'New York', name: 'Red Bulls' },
  
  // Orlando City SC
  'Orlando City SC': { abbreviation: 'ORL', espnId: 20, fullName: 'Orlando City SC', city: 'Orlando', name: 'City SC' },
  'Orlando City': { abbreviation: 'ORL', espnId: 20, fullName: 'Orlando City SC', city: 'Orlando', name: 'City SC' },
  
  // Philadelphia Union
  'Philadelphia Union': { abbreviation: 'PHI', espnId: 21, fullName: 'Philadelphia Union', city: 'Philadelphia', name: 'Union' },
  'Union': { abbreviation: 'PHI', espnId: 21, fullName: 'Philadelphia Union', city: 'Philadelphia', name: 'Union' },
  
  // Portland Timbers
  'Portland Timbers': { abbreviation: 'POR', espnId: 22, fullName: 'Portland Timbers', city: 'Portland', name: 'Timbers' },
  'Timbers': { abbreviation: 'POR', espnId: 22, fullName: 'Portland Timbers', city: 'Portland', name: 'Timbers' },
  
  // Real Salt Lake
  'Real Salt Lake': { abbreviation: 'RSL', espnId: 23, fullName: 'Real Salt Lake', city: 'Salt Lake', name: 'Real' },
  'RSL': { abbreviation: 'RSL', espnId: 23, fullName: 'Real Salt Lake', city: 'Salt Lake', name: 'Real' },
  
  // San Jose Earthquakes
  'San Jose Earthquakes': { abbreviation: 'SJ', espnId: 24, fullName: 'San Jose Earthquakes', city: 'San Jose', name: 'Earthquakes' },
  'Earthquakes': { abbreviation: 'SJ', espnId: 24, fullName: 'San Jose Earthquakes', city: 'San Jose', name: 'Earthquakes' },
  'Quakes': { abbreviation: 'SJ', espnId: 24, fullName: 'San Jose Earthquakes', city: 'San Jose', name: 'Earthquakes' },
  
  // Seattle Sounders FC
  'Seattle Sounders FC': { abbreviation: 'SEA', espnId: 25, fullName: 'Seattle Sounders FC', city: 'Seattle', name: 'Sounders FC' },
  'Seattle Sounders': { abbreviation: 'SEA', espnId: 25, fullName: 'Seattle Sounders FC', city: 'Seattle', name: 'Sounders FC' },
  'Sounders': { abbreviation: 'SEA', espnId: 25, fullName: 'Seattle Sounders FC', city: 'Seattle', name: 'Sounders FC' },
  
  // Sporting Kansas City
  'Sporting Kansas City': { abbreviation: 'SKC', espnId: 26, fullName: 'Sporting Kansas City', city: 'Kansas City', name: 'Sporting' },
  'Sporting KC': { abbreviation: 'SKC', espnId: 26, fullName: 'Sporting Kansas City', city: 'Kansas City', name: 'Sporting' },
  'SKC': { abbreviation: 'SKC', espnId: 26, fullName: 'Sporting Kansas City', city: 'Kansas City', name: 'Sporting' },
  
  // St. Louis City SC
  'St. Louis City SC': { abbreviation: 'STL', espnId: 27, fullName: 'St. Louis City SC', city: 'St. Louis', name: 'City SC' },
  'St. Louis CITY': { abbreviation: 'STL', espnId: 27, fullName: 'St. Louis City SC', city: 'St. Louis', name: 'City SC' },
  'CITY SC': { abbreviation: 'STL', espnId: 27, fullName: 'St. Louis City SC', city: 'St. Louis', name: 'City SC' },
  
  // Toronto FC
  'Toronto FC': { abbreviation: 'TOR', espnId: 28, fullName: 'Toronto FC', city: 'Toronto', name: 'FC' },
  'TFC': { abbreviation: 'TOR', espnId: 28, fullName: 'Toronto FC', city: 'Toronto', name: 'FC' },
  
  // Vancouver Whitecaps FC
  'Vancouver Whitecaps FC': { abbreviation: 'VAN', espnId: 29, fullName: 'Vancouver Whitecaps FC', city: 'Vancouver', name: 'Whitecaps FC' },
  'Vancouver Whitecaps': { abbreviation: 'VAN', espnId: 29, fullName: 'Vancouver Whitecaps FC', city: 'Vancouver', name: 'Whitecaps FC' },
  'Whitecaps': { abbreviation: 'VAN', espnId: 29, fullName: 'Vancouver Whitecaps FC', city: 'Vancouver', name: 'Whitecaps FC' },
};

// Note: For Champions League, we include major European clubs that commonly appear
export const CHAMPIONS_LEAGUE_TEAMS: Record<string, TeamInfo> = {
  // Real Madrid
  'Real Madrid': { abbreviation: 'RMA', espnId: 86, fullName: 'Real Madrid', city: 'Madrid', name: 'Real Madrid' },
  
  // Barcelona
  'Barcelona': { abbreviation: 'BAR', espnId: 83, fullName: 'FC Barcelona', city: 'Barcelona', name: 'Barcelona' },
  'FC Barcelona': { abbreviation: 'BAR', espnId: 83, fullName: 'FC Barcelona', city: 'Barcelona', name: 'Barcelona' },
  'Barça': { abbreviation: 'BAR', espnId: 83, fullName: 'FC Barcelona', city: 'Barcelona', name: 'Barcelona' },
  
  // Manchester United
  'Manchester United': { abbreviation: 'MUN', espnId: 360, fullName: 'Manchester United', city: 'Manchester', name: 'United' },
  'Man United': { abbreviation: 'MUN', espnId: 360, fullName: 'Manchester United', city: 'Manchester', name: 'United' },
  'Man Utd': { abbreviation: 'MUN', espnId: 360, fullName: 'Manchester United', city: 'Manchester', name: 'United' },
  
  // Manchester City
  'Manchester City': { abbreviation: 'MCI', espnId: 382, fullName: 'Manchester City', city: 'Manchester', name: 'City' },
  'Man City': { abbreviation: 'MCI', espnId: 382, fullName: 'Manchester City', city: 'Manchester', name: 'City' },
  
  // Liverpool
  'Liverpool': { abbreviation: 'LIV', espnId: 364, fullName: 'Liverpool FC', city: 'Liverpool', name: 'Liverpool' },
  'Liverpool FC': { abbreviation: 'LIV', espnId: 364, fullName: 'Liverpool FC', city: 'Liverpool', name: 'Liverpool' },
  
  // Chelsea
  'Chelsea': { abbreviation: 'CHE', espnId: 363, fullName: 'Chelsea FC', city: 'London', name: 'Chelsea' },
  'Chelsea FC': { abbreviation: 'CHE', espnId: 363, fullName: 'Chelsea FC', city: 'London', name: 'Chelsea' },
  
  // Arsenal
  'Arsenal': { abbreviation: 'ARS', espnId: 359, fullName: 'Arsenal FC', city: 'London', name: 'Arsenal' },
  'Arsenal FC': { abbreviation: 'ARS', espnId: 359, fullName: 'Arsenal FC', city: 'London', name: 'Arsenal' },
  
  // Bayern Munich
  'Bayern Munich': { abbreviation: 'BAY', espnId: 132, fullName: 'FC Bayern Munich', city: 'Munich', name: 'Bayern' },
  'Bayern München': { abbreviation: 'BAY', espnId: 132, fullName: 'FC Bayern Munich', city: 'Munich', name: 'Bayern' },
  'FC Bayern': { abbreviation: 'BAY', espnId: 132, fullName: 'FC Bayern Munich', city: 'Munich', name: 'Bayern' },
  
  // Paris Saint-Germain
  'Paris Saint-Germain': { abbreviation: 'PSG', espnId: 160, fullName: 'Paris Saint-Germain', city: 'Paris', name: 'PSG' },
  'PSG': { abbreviation: 'PSG', espnId: 160, fullName: 'Paris Saint-Germain', city: 'Paris', name: 'PSG' },
  
  // Juventus
  'Juventus': { abbreviation: 'JUV', espnId: 111, fullName: 'Juventus FC', city: 'Turin', name: 'Juventus' },
  'Juventus FC': { abbreviation: 'JUV', espnId: 111, fullName: 'Juventus FC', city: 'Turin', name: 'Juventus' },
  'Juve': { abbreviation: 'JUV', espnId: 111, fullName: 'Juventus FC', city: 'Turin', name: 'Juventus' },
  
  // AC Milan
  'AC Milan': { abbreviation: 'MIL', espnId: 105, fullName: 'AC Milan', city: 'Milan', name: 'Milan' },
  'Milan': { abbreviation: 'MIL', espnId: 105, fullName: 'AC Milan', city: 'Milan', name: 'Milan' },
  
  // Inter Milan
  'Inter Milan': { abbreviation: 'INT', espnId: 110, fullName: 'Inter Milan', city: 'Milan', name: 'Inter' },
  'Internazionale': { abbreviation: 'INT', espnId: 110, fullName: 'Inter Milan', city: 'Milan', name: 'Inter' },
  'Inter': { abbreviation: 'INT', espnId: 110, fullName: 'Inter Milan', city: 'Milan', name: 'Inter' },
  
  // Atletico Madrid
  'Atletico Madrid': { abbreviation: 'ATM', espnId: 1244, fullName: 'Atletico Madrid', city: 'Madrid', name: 'Atletico' },
  'Atlético Madrid': { abbreviation: 'ATM', espnId: 1244, fullName: 'Atletico Madrid', city: 'Madrid', name: 'Atletico' },
  'Atletico': { abbreviation: 'ATM', espnId: 1244, fullName: 'Atletico Madrid', city: 'Madrid', name: 'Atletico' },
  
  // Borussia Dortmund
  'Borussia Dortmund': { abbreviation: 'BVB', espnId: 131, fullName: 'Borussia Dortmund', city: 'Dortmund', name: 'Dortmund' },
  'Dortmund': { abbreviation: 'BVB', espnId: 131, fullName: 'Borussia Dortmund', city: 'Dortmund', name: 'Dortmund' },
  'BVB': { abbreviation: 'BVB', espnId: 131, fullName: 'Borussia Dortmund', city: 'Dortmund', name: 'Dortmund' },
};

// Note: For college sports, we include major programs. There are 130+ football and 350+ basketball teams.
export const NCAAF_TEAMS: Record<string, TeamInfo> = {
  // Alabama
  'Alabama': { abbreviation: 'ALA', espnId: 333, fullName: 'Alabama Crimson Tide', city: 'Alabama', name: 'Crimson Tide' },
  'Alabama Crimson Tide': { abbreviation: 'ALA', espnId: 333, fullName: 'Alabama Crimson Tide', city: 'Alabama', name: 'Crimson Tide' },
  'Crimson Tide': { abbreviation: 'ALA', espnId: 333, fullName: 'Alabama Crimson Tide', city: 'Alabama', name: 'Crimson Tide' },
  
  // Georgia
  'Georgia': { abbreviation: 'UGA', espnId: 61, fullName: 'Georgia Bulldogs', city: 'Georgia', name: 'Bulldogs' },
  'Georgia Bulldogs': { abbreviation: 'UGA', espnId: 61, fullName: 'Georgia Bulldogs', city: 'Georgia', name: 'Bulldogs' },
  'UGA': { abbreviation: 'UGA', espnId: 61, fullName: 'Georgia Bulldogs', city: 'Georgia', name: 'Bulldogs' },
  
  // Ohio State
  'Ohio State': { abbreviation: 'OSU', espnId: 194, fullName: 'Ohio State Buckeyes', city: 'Ohio State', name: 'Buckeyes' },
  'Ohio State Buckeyes': { abbreviation: 'OSU', espnId: 194, fullName: 'Ohio State Buckeyes', city: 'Ohio State', name: 'Buckeyes' },
  'Buckeyes': { abbreviation: 'OSU', espnId: 194, fullName: 'Ohio State Buckeyes', city: 'Ohio State', name: 'Buckeyes' },
  
  // Texas
  'Texas': { abbreviation: 'TEX', espnId: 251, fullName: 'Texas Longhorns', city: 'Texas', name: 'Longhorns' },
  'Texas Longhorns': { abbreviation: 'TEX', espnId: 251, fullName: 'Texas Longhorns', city: 'Texas', name: 'Longhorns' },
  'Longhorns': { abbreviation: 'TEX', espnId: 251, fullName: 'Texas Longhorns', city: 'Texas', name: 'Longhorns' },
  
  // Michigan
  'Michigan': { abbreviation: 'MICH', espnId: 130, fullName: 'Michigan Wolverines', city: 'Michigan', name: 'Wolverines' },
  'Michigan Wolverines': { abbreviation: 'MICH', espnId: 130, fullName: 'Michigan Wolverines', city: 'Michigan', name: 'Wolverines' },
  'Wolverines': { abbreviation: 'MICH', espnId: 130, fullName: 'Michigan Wolverines', city: 'Michigan', name: 'Wolverines' },
  
  // Notre Dame
  'Notre Dame': { abbreviation: 'ND', espnId: 87, fullName: 'Notre Dame Fighting Irish', city: 'Notre Dame', name: 'Fighting Irish' },
  'Notre Dame Fighting Irish': { abbreviation: 'ND', espnId: 87, fullName: 'Notre Dame Fighting Irish', city: 'Notre Dame', name: 'Fighting Irish' },
  'Fighting Irish': { abbreviation: 'ND', espnId: 87, fullName: 'Notre Dame Fighting Irish', city: 'Notre Dame', name: 'Fighting Irish' },
  
  // LSU
  'LSU': { abbreviation: 'LSU', espnId: 99, fullName: 'LSU Tigers', city: 'LSU', name: 'Tigers' },
  'LSU Tigers': { abbreviation: 'LSU', espnId: 99, fullName: 'LSU Tigers', city: 'LSU', name: 'Tigers' },
  
  // Clemson
  'Clemson': { abbreviation: 'CLEM', espnId: 228, fullName: 'Clemson Tigers', city: 'Clemson', name: 'Tigers' },
  'Clemson Tigers': { abbreviation: 'CLEM', espnId: 228, fullName: 'Clemson Tigers', city: 'Clemson', name: 'Tigers' },
  
  // USC
  'USC': { abbreviation: 'USC', espnId: 30, fullName: 'USC Trojans', city: 'USC', name: 'Trojans' },
  'USC Trojans': { abbreviation: 'USC', espnId: 30, fullName: 'USC Trojans', city: 'USC', name: 'Trojans' },
  'Trojans': { abbreviation: 'USC', espnId: 30, fullName: 'USC Trojans', city: 'USC', name: 'Trojans' },
  
  // Oklahoma
  'Oklahoma': { abbreviation: 'OU', espnId: 201, fullName: 'Oklahoma Sooners', city: 'Oklahoma', name: 'Sooners' },
  'Oklahoma Sooners': { abbreviation: 'OU', espnId: 201, fullName: 'Oklahoma Sooners', city: 'Oklahoma', name: 'Sooners' },
  'Sooners': { abbreviation: 'OU', espnId: 201, fullName: 'Oklahoma Sooners', city: 'Oklahoma', name: 'Sooners' },
};

export const NCAAM_TEAMS: Record<string, TeamInfo> = {
  // Duke
  'Duke': { abbreviation: 'DUKE', espnId: 150, fullName: 'Duke Blue Devils', city: 'Duke', name: 'Blue Devils' },
  'Duke Blue Devils': { abbreviation: 'DUKE', espnId: 150, fullName: 'Duke Blue Devils', city: 'Duke', name: 'Blue Devils' },
  'Blue Devils': { abbreviation: 'DUKE', espnId: 150, fullName: 'Duke Blue Devils', city: 'Duke', name: 'Blue Devils' },
  
  // North Carolina
  'North Carolina': { abbreviation: 'UNC', espnId: 153, fullName: 'North Carolina Tar Heels', city: 'North Carolina', name: 'Tar Heels' },
  'UNC': { abbreviation: 'UNC', espnId: 153, fullName: 'North Carolina Tar Heels', city: 'North Carolina', name: 'Tar Heels' },
  'Tar Heels': { abbreviation: 'UNC', espnId: 153, fullName: 'North Carolina Tar Heels', city: 'North Carolina', name: 'Tar Heels' },
  
  // Kentucky
  'Kentucky': { abbreviation: 'UK', espnId: 96, fullName: 'Kentucky Wildcats', city: 'Kentucky', name: 'Wildcats' },
  'Kentucky Wildcats': { abbreviation: 'UK', espnId: 96, fullName: 'Kentucky Wildcats', city: 'Kentucky', name: 'Wildcats' },
  'Wildcats': { abbreviation: 'UK', espnId: 96, fullName: 'Kentucky Wildcats', city: 'Kentucky', name: 'Wildcats' },
  
  // Kansas
  'Kansas': { abbreviation: 'KU', espnId: 2305, fullName: 'Kansas Jayhawks', city: 'Kansas', name: 'Jayhawks' },
  'Kansas Jayhawks': { abbreviation: 'KU', espnId: 2305, fullName: 'Kansas Jayhawks', city: 'Kansas', name: 'Jayhawks' },
  'Jayhawks': { abbreviation: 'KU', espnId: 2305, fullName: 'Kansas Jayhawks', city: 'Kansas', name: 'Jayhawks' },
  
  // Villanova
  'Villanova': { abbreviation: 'NOVA', espnId: 222, fullName: 'Villanova Wildcats', city: 'Villanova', name: 'Wildcats' },
  'Villanova Wildcats': { abbreviation: 'NOVA', espnId: 222, fullName: 'Villanova Wildcats', city: 'Villanova', name: 'Wildcats' },
  
  // Gonzaga
  'Gonzaga': { abbreviation: 'GONZ', espnId: 2250, fullName: 'Gonzaga Bulldogs', city: 'Gonzaga', name: 'Bulldogs' },
  'Gonzaga Bulldogs': { abbreviation: 'GONZ', espnId: 2250, fullName: 'Gonzaga Bulldogs', city: 'Gonzaga', name: 'Bulldogs' },
  
  // Michigan State
  'Michigan State': { abbreviation: 'MSU', espnId: 127, fullName: 'Michigan State Spartans', city: 'Michigan State', name: 'Spartans' },
  'Michigan State Spartans': { abbreviation: 'MSU', espnId: 127, fullName: 'Michigan State Spartans', city: 'Michigan State', name: 'Spartans' },
  'Spartans': { abbreviation: 'MSU', espnId: 127, fullName: 'Michigan State Spartans', city: 'Michigan State', name: 'Spartans' },
  
  // UCLA
  'UCLA': { abbreviation: 'UCLA', espnId: 26, fullName: 'UCLA Bruins', city: 'UCLA', name: 'Bruins' },
  'UCLA Bruins': { abbreviation: 'UCLA', espnId: 26, fullName: 'UCLA Bruins', city: 'UCLA', name: 'Bruins' },
  'Bruins': { abbreviation: 'UCLA', espnId: 26, fullName: 'UCLA Bruins', city: 'UCLA', name: 'Bruins' },
  
  // Arizona
  'Arizona': { abbreviation: 'ARIZ', espnId: 12, fullName: 'Arizona Wildcats', city: 'Arizona', name: 'Wildcats' },
  'Arizona Wildcats': { abbreviation: 'ARIZ', espnId: 12, fullName: 'Arizona Wildcats', city: 'Arizona', name: 'Wildcats' },
  
  // Syracuse
  'Syracuse': { abbreviation: 'SYR', espnId: 183, fullName: 'Syracuse Orange', city: 'Syracuse', name: 'Orange' },
  'Syracuse Orange': { abbreviation: 'SYR', espnId: 183, fullName: 'Syracuse Orange', city: 'Syracuse', name: 'Orange' },
  'Orange': { abbreviation: 'SYR', espnId: 183, fullName: 'Syracuse Orange', city: 'Syracuse', name: 'Orange' },
};

// Helper function to get team info from any team name variation for a specific league
export const getTeamInfo = (teamName: string, league?: string): TeamInfo | null => {
  const normalizedName = teamName?.trim();
  if (!normalizedName) return null;
  
  // Determine which team database to search
  let teamDatabases: Record<string, TeamInfo>[] = [];
  
  if (league) {
    const lowerLeague = league.toLowerCase();
    if (lowerLeague === 'nba') {
      teamDatabases = [NBA_TEAMS];
    } else if (lowerLeague === 'nfl') {
      teamDatabases = [NFL_TEAMS];
    } else if (lowerLeague === 'mlb') {
      teamDatabases = [MLB_TEAMS];
    } else if (lowerLeague === 'wnba') {
      teamDatabases = [WNBA_TEAMS];
    } else if (lowerLeague === 'nhl') {
      teamDatabases = [NHL_TEAMS];
    } else if (lowerLeague === 'mls') {
      teamDatabases = [MLS_TEAMS];
    } else if (lowerLeague === 'champions league') {
      teamDatabases = [CHAMPIONS_LEAGUE_TEAMS];
    } else if (lowerLeague === 'ncaaf') {
      teamDatabases = [NCAAF_TEAMS];
    } else if (lowerLeague === 'ncaam' || lowerLeague === 'ncaab') {
      teamDatabases = [NCAAM_TEAMS];
    }
  }
  
  // If no specific league or league not supported, search all databases
  if (teamDatabases.length === 0) {
    teamDatabases = [NBA_TEAMS, NFL_TEAMS, MLB_TEAMS, WNBA_TEAMS, NHL_TEAMS, MLS_TEAMS, CHAMPIONS_LEAGUE_TEAMS, NCAAF_TEAMS, NCAAM_TEAMS];
  }
  
  // Search through the appropriate databases
  for (const database of teamDatabases) {
    // Direct lookup
    if (database[normalizedName]) {
      return database[normalizedName];
    }
    
    // Case-insensitive lookup
    const lowerName = normalizedName.toLowerCase();
    for (const [key, value] of Object.entries(database)) {
      if (key.toLowerCase() === lowerName) {
        return value;
      }
    }
    
    // Partial match (useful for variations like "Los Angeles Lakers" vs "L.A. Lakers")
    for (const [key, value] of Object.entries(database)) {
      if (key.toLowerCase().includes(lowerName) || lowerName.includes(key.toLowerCase())) {
        return value;
      }
    }
  }
  
  return null;
};

// Helper function to get team logo URL for multiple leagues with improved fallback system
export const getTeamLogoUrl = (teamName: string, league?: string): string | null => {
  const teamInfo = getTeamInfo(teamName, league);
  if (!teamInfo) return null;
  
  // Determine sport for ESPN logo URL
  const lowerLeague = league?.toLowerCase() || '';
  let sport = 'nba'; // default
  
  if (lowerLeague === 'nfl') {
    sport = 'nfl';
  } else if (lowerLeague === 'mlb') {
    sport = 'mlb';
  } else if (lowerLeague === 'nba') {
    sport = 'nba';
  } else if (lowerLeague === 'wnba') {
    sport = 'wnba';
  } else if (lowerLeague === 'nhl') {
    sport = 'nhl';
  } else if (lowerLeague === 'mls') {
    sport = 'soccer';
  } else if (lowerLeague === 'champions league') {
    sport = 'soccer';
  } else if (lowerLeague === 'ncaaf') {
    sport = 'college-football';
  } else if (lowerLeague === 'ncaam' || lowerLeague === 'ncaab') {
    sport = 'mens-college-basketball';
  }
  
  // Use ESPN logo endpoint with improved URL patterns
  // For leagues that support abbreviation-based URLs (more current logos)
  if (sport === 'nhl' || sport === 'nba' || sport === 'mlb' || sport === 'wnba') {
    return `https://a.espncdn.com/i/teamlogos/${sport}/500/${teamInfo.abbreviation.toLowerCase()}.png`;
  }
  
  // Use ESPN logo endpoint for other sports (reliable PNG format)
  return `https://a.espncdn.com/i/teamlogos/${sport}/500/${teamInfo.espnId}.png`;
};

// Alternative logo URL function with multiple fallback sources
export const getTeamLogoUrls = (teamName: string, league?: string): string[] => {
  const teamInfo = getTeamInfo(teamName, league);
  if (!teamInfo) return [];
  
  const lowerLeague = league?.toLowerCase() || '';
  let sport = 'nba'; // default
  
  if (lowerLeague === 'nfl') {
    sport = 'nfl';
  } else if (lowerLeague === 'mlb') {
    sport = 'mlb';
  } else if (lowerLeague === 'nba') {
    sport = 'nba';
  } else if (lowerLeague === 'wnba') {
    sport = 'wnba';
  } else if (lowerLeague === 'nhl') {
    sport = 'nhl';
  } else if (lowerLeague === 'mls') {
    sport = 'soccer';
  } else if (lowerLeague === 'champions league') {
    sport = 'soccer';
  } else if (lowerLeague === 'ncaaf') {
    sport = 'college-football';
  } else if (lowerLeague === 'ncaam' || lowerLeague === 'ncaab') {
    sport = 'mens-college-basketball';
  }
  
  const urls: string[] = [];
  
  // For leagues that support abbreviation-based URLs (more current logos)
  if (sport === 'nhl' || sport === 'nba' || sport === 'mlb' || sport === 'wnba') {
    // Primary: abbreviation-based URL
    urls.push(`https://a.espncdn.com/i/teamlogos/${sport}/500/${teamInfo.abbreviation.toLowerCase()}.png`);
    // Fallback: numeric ID-based URL
    urls.push(`https://a.espncdn.com/i/teamlogos/${sport}/500/${teamInfo.espnId}.png`);
  } else {
    // Primary ESPN logo URL for other sports
    urls.push(`https://a.espncdn.com/i/teamlogos/${sport}/500/${teamInfo.espnId}.png`);
  }
  
  return urls;
};