export interface LeagueInfo {
  name: string;
  logoUrl: string;
  color: string;
}

const LEAGUE_MAPPINGS: Record<string, LeagueInfo> = {
  'MLB': {
    name: 'MLB',
    logoUrl: 'https://a.espncdn.com/combiner/i?img=/redesign/assets/img/icons/ESPN-icon-baseball.png&h=80&w=80',
    color: '#005A9C'
  },
  'NFL': {
    name: 'NFL',
    logoUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/leagues/500/nfl.png&h=80&w=80',
    color: '#013369'
  },
  'NBA': {
    name: 'NBA',
    logoUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/leagues/500/nba.png&h=80&w=80',
    color: '#C8102E'
  },
  'WNBA': {
    name: 'WNBA',
    logoUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/wnba/500/scoreboard/default.png&h=80&w=80',
    color: '#FE5000'
  },
  'NHL': {
    name: 'NHL',
    logoUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/leagues/500/nhl.png&h=80&w=80',
    color: '#000000'
  },
  'NCAAF': {
    name: 'NCAAF',
    logoUrl: 'https://a.espncdn.com/combiner/i?img=/redesign/assets/img/icons/ESPN-icon-football.png&h=80&w=80',
    color: '#8B0000'
  },
  'NCAAB': {
    name: 'NCAAB',
    logoUrl: 'https://a.espncdn.com/combiner/i?img=/redesign/assets/img/icons/ESPN-icon-basketball.png&h=80&w=80',
    color: '#FF8C00'
  },
  'NCAAM': {
    name: 'NCAAM',
    logoUrl: 'https://a.espncdn.com/combiner/i?img=/redesign/assets/img/icons/ESPN-icon-basketball.png&h=80&w=80',
    color: '#FF8C00'
  },
  'Champions League': {
    name: 'Champions League',
    logoUrl: 'https://a.espncdn.com/combiner/i?img=/redesign/assets/img/icons/ESPN-icon-soccer.png&h=80&w=80',
    color: '#003399'
  },
  'MLS': {
    name: 'MLS',
    logoUrl: 'https://a.espncdn.com/combiner/i?img=/redesign/assets/img/icons/ESPN-icon-soccer.png&h=80&w=80',
    color: '#005DAA'
  },
  'CFL': {
    name: 'CFL',
    logoUrl: 'https://a.espncdn.com/combiner/i?img=/redesign/assets/img/icons/ESPN-icon-football.png&h=80&w=80',
    color: '#C8102E'
  },
  'XFL': {
    name: 'XFL',
    logoUrl: 'https://a.espncdn.com/combiner/i?img=/redesign/assets/img/icons/ESPN-icon-football.png&h=80&w=80',
    color: '#000000'
  },
  'Premier League': {
    name: 'Premier League',
    logoUrl: 'https://a.espncdn.com/combiner/i?img=/redesign/assets/img/icons/ESPN-icon-soccer.png&h=80&w=80',
    color: '#37003C'
  },
  'La Liga': {
    name: 'La Liga',
    logoUrl: 'https://a.espncdn.com/combiner/i?img=/redesign/assets/img/icons/ESPN-icon-soccer.png&h=80&w=80',
    color: '#FF6600'
  },
  'Serie A': {
    name: 'Serie A',
    logoUrl: 'https://a.espncdn.com/combiner/i?img=/redesign/assets/img/icons/ESPN-icon-soccer.png&h=80&w=80',
    color: '#0066CC'
  },
  'Bundesliga': {
    name: 'Bundesliga',
    logoUrl: 'https://a.espncdn.com/combiner/i?img=/redesign/assets/img/icons/ESPN-icon-soccer.png&h=80&w=80',
    color: '#D20515'
  },
  'Ligue 1': {
    name: 'Ligue 1',
    logoUrl: 'https://a.espncdn.com/combiner/i?img=/redesign/assets/img/icons/ESPN-icon-soccer.png&h=80&w=80',
    color: '#003399'
  },
  'ATP Tour': {
    name: 'ATP Tour',
    logoUrl: 'https://a.espncdn.com/combiner/i?img=/redesign/assets/img/icons/ESPN-icon-tennis.png&h=80&w=80',
    color: '#0066CC'
  },
  'WTA Tour': {
    name: 'WTA Tour',
    logoUrl: 'https://a.espncdn.com/combiner/i?img=/redesign/assets/img/icons/ESPN-icon-tennis.png&h=80&w=80',
    color: '#E4007C'
  },
  'UFC': {
    name: 'UFC',
    logoUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/mma/500/ufc.png&h=80&w=80',
    color: '#D20A0A'
  },
  'Bellator': {
    name: 'Bellator',
    logoUrl: 'https://a.espncdn.com/combiner/i?img=/redesign/assets/img/icons/ESPN-icon-mma.png&h=80&w=80',
    color: '#000000'
  },
  'Boxing': {
    name: 'Boxing',
    logoUrl: 'https://a.espncdn.com/combiner/i?img=/redesign/assets/img/icons/ESPN-icon-boxing.png&h=80&w=80',
    color: '#8B0000'
  },
  'Formula 1': {
    name: 'Formula 1',
    logoUrl: 'https://a.espncdn.com/combiner/i?img=/redesign/assets/img/icons/ESPN-icon-racing.png&h=80&w=80',
    color: '#E10600'
  },
  'NASCAR': {
    name: 'NASCAR',
    logoUrl: 'https://a.espncdn.com/combiner/i?img=/redesign/assets/img/icons/ESPN-icon-racing.png&h=80&w=80',
    color: '#FFD320'
  },
  'PGA Tour': {
    name: 'PGA Tour',
    logoUrl: 'https://a.espncdn.com/combiner/i?img=/redesign/assets/img/icons/ESPN-icon-golf.png&h=80&w=80',
    color: '#005DAA'
  }
};

export const getLeagueInfo = (leagueName: string): LeagueInfo | null => {
  const normalizedName = leagueName.trim();
  return LEAGUE_MAPPINGS[normalizedName] || null;
};

export const getLeagueLogoUrl = (leagueName: string): string | null => {
  const leagueInfo = getLeagueInfo(leagueName);
  return leagueInfo?.logoUrl || null;
};