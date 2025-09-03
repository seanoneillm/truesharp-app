// Team abbreviation mappings for better display in odds buttons
export const teamAbbreviations: Record<string, string> = {
  // MLB Teams
  'Los Angeles Angels': 'LAA',
  'Houston Astros': 'HOU',
  'Oakland Athletics': 'OAK',
  'Toronto Blue Jays': 'TOR',
  'Atlanta Braves': 'ATL',
  'Milwaukee Brewers': 'MIL',
  'St. Louis Cardinals': 'STL',
  'Chicago Cubs': 'CHC',
  'Arizona Diamondbacks': 'ARI',
  'Colorado Rockies': 'COL',
  'Los Angeles Dodgers': 'LAD',
  'San Diego Padres': 'SD',
  'San Francisco Giants': 'SF',
  'Cleveland Guardians': 'CLE',
  'Detroit Tigers': 'DET',
  'Kansas City Royals': 'KC',
  'Minnesota Twins': 'MIN',
  'Chicago White Sox': 'CWS',
  'Baltimore Orioles': 'BAL',
  'Boston Red Sox': 'BOS',
  'New York Yankees': 'NYY',
  'Tampa Bay Rays': 'TB',
  'Texas Rangers': 'TEX',
  'Seattle Mariners': 'SEA',
  'Miami Marlins': 'MIA',
  'New York Mets': 'NYM',
  'Washington Nationals': 'WSH',
  'Philadelphia Phillies': 'PHI',
  'Pittsburgh Pirates': 'PIT',
  'Cincinnati Reds': 'CIN',

  // NFL Teams
  'Arizona Cardinals': 'ARI',
  'Atlanta Falcons': 'ATL',
  'Baltimore Ravens': 'BAL',
  'Buffalo Bills': 'BUF',
  'Carolina Panthers': 'CAR',
  'Chicago Bears': 'CHI',
  'Cincinnati Bengals': 'CIN',
  'Cleveland Browns': 'CLE',
  'Dallas Cowboys': 'DAL',
  'Denver Broncos': 'DEN',
  'Detroit Lions': 'DET',
  'Green Bay Packers': 'GB',
  'Houston Texans': 'HOU',
  'Indianapolis Colts': 'IND',
  'Jacksonville Jaguars': 'JAX',
  'Kansas City Chiefs': 'KC',
  'Las Vegas Raiders': 'LV',
  'Los Angeles Chargers': 'LAC',
  'Los Angeles Rams': 'LAR',
  'Miami Dolphins': 'MIA',
  'Minnesota Vikings': 'MIN',
  'New England Patriots': 'NE',
  'New Orleans Saints': 'NO',
  'New York Giants': 'NYG',
  'New York Jets': 'NYJ',
  'Philadelphia Eagles': 'PHI',
  'Pittsburgh Steelers': 'PIT',
  'San Francisco 49ers': 'SF',
  'Seattle Seahawks': 'SEA',
  'Tampa Bay Buccaneers': 'TB',
  'Tennessee Titans': 'TEN',
  'Washington Commanders': 'WSH',

  // NBA Teams
  'Atlanta Hawks': 'ATL',
  'Boston Celtics': 'BOS',
  'Brooklyn Nets': 'BKN',
  'Charlotte Hornets': 'CHA',
  'Chicago Bulls': 'CHI',
  'Cleveland Cavaliers': 'CLE',
  'Dallas Mavericks': 'DAL',
  'Denver Nuggets': 'DEN',
  'Detroit Pistons': 'DET',
  'Golden State Warriors': 'GSW',
  'Houston Rockets': 'HOU',
  'Indiana Pacers': 'IND',
  'LA Clippers': 'LAC',
  'Los Angeles Lakers': 'LAL',
  'Memphis Grizzlies': 'MEM',
  'Miami Heat': 'MIA',
  'Milwaukee Bucks': 'MIL',
  'Minnesota Timberwolves': 'MIN',
  'New Orleans Pelicans': 'NO',
  'New York Knicks': 'NYK',
  'Oklahoma City Thunder': 'OKC',
  'Orlando Magic': 'ORL',
  'Philadelphia 76ers': 'PHI',
  'Phoenix Suns': 'PHX',
  'Portland Trail Blazers': 'POR',
  'Sacramento Kings': 'SAC',
  'San Antonio Spurs': 'SA',
  'Toronto Raptors': 'TOR',
  'Utah Jazz': 'UTA',
  'Washington Wizards': 'WSH',

  // NHL Teams
  'Anaheim Ducks': 'ANA',
  'Arizona Coyotes': 'ARI',
  'Boston Bruins': 'BOS',
  'Buffalo Sabres': 'BUF',
  'Calgary Flames': 'CGY',
  'Carolina Hurricanes': 'CAR',
  'Chicago Blackhawks': 'CHI',
  'Colorado Avalanche': 'COL',
  'Columbus Blue Jackets': 'CBJ',
  'Dallas Stars': 'DAL',
  'Detroit Red Wings': 'DET',
  'Edmonton Oilers': 'EDM',
  'Florida Panthers': 'FLA',
  'Los Angeles Kings': 'LAK',
  'Minnesota Wild': 'MIN',
  'Montreal Canadiens': 'MTL',
  'Nashville Predators': 'NSH',
  'New Jersey Devils': 'NJ',
  'New York Islanders': 'NYI',
  'New York Rangers': 'NYR',
  'Ottawa Senators': 'OTT',
  'Philadelphia Flyers': 'PHI',
  'Pittsburgh Penguins': 'PIT',
  'San Jose Sharks': 'SJ',
  'Seattle Kraken': 'SEA',
  'St. Louis Blues': 'STL',
  'Tampa Bay Lightning': 'TB',
  'Toronto Maple Leafs': 'TOR',
  'Vancouver Canucks': 'VAN',
  'Vegas Golden Knights': 'VGK',
  'Washington Capitals': 'WSH',
  'Winnipeg Jets': 'WPG',

  // MLS Teams
  'Atlanta United FC': 'ATL',
  'Austin FC': 'AUS',
  'Charlotte FC': 'CLT',
  'Chicago Fire FC': 'CHI',
  'FC Cincinnati': 'CIN',
  'Colorado Rapids': 'COL',
  'Columbus Crew': 'CLB',
  'FC Dallas': 'DAL',
  'D.C. United': 'DC',
  'Houston Dynamo FC': 'HOU',
  'Inter Miami CF': 'MIA',
  'LA Galaxy': 'LAG',
  'Los Angeles FC': 'LAFC',
  'Minnesota United FC': 'MIN',
  'CF Montreal': 'MTL',
  'Nashville SC': 'NSH',
  'New England Revolution': 'NE',
  'New York City FC': 'NYC',
  'New York Red Bulls': 'NYRB',
  'Orlando City SC': 'ORL',
  'Philadelphia Union': 'PHI',
  'Portland Timbers': 'POR',
  'Real Salt Lake': 'RSL',
  'San Jose Earthquakes': 'SJ',
  'Seattle Sounders FC': 'SEA',
  'Sporting Kansas City': 'SKC',
  'St. Louis City SC': 'STL',
  'Toronto FC': 'TOR',
  'Vancouver Whitecaps FC': 'VAN',
}

/**
 * Get abbreviated team name for display in odds buttons
 */
export function getTeamAbbreviation(teamName: string): string {
  // First try exact match
  if (teamAbbreviations[teamName]) {
    return teamAbbreviations[teamName]
  }

  // Try partial matches for variations
  const lowerTeamName = teamName.toLowerCase()
  for (const [fullName, abbrev] of Object.entries(teamAbbreviations)) {
    if (
      fullName.toLowerCase().includes(lowerTeamName) ||
      lowerTeamName.includes(fullName.toLowerCase())
    ) {
      return abbrev
    }
  }

  // Fallback: create abbreviation from team name
  const words = teamName.split(' ')
  if (words.length === 1) {
    return teamName.slice(0, 3).toUpperCase()
  } else if (words.length === 2) {
    return ((words[0]?.[0] || '') + (words[1]?.[0] || '')).toUpperCase()
  } else {
    return ((words[0]?.[0] || '') + (words[1]?.[0] || '') + (words[2]?.[0] || '')).toUpperCase()
  }
}

/**
 * Format team name for display - abbreviated if too long
 */
export function formatTeamForDisplay(teamName: string, maxLength: number = 8): string {
  if (teamName.length <= maxLength) {
    return teamName
  }
  return getTeamAbbreviation(teamName)
}
