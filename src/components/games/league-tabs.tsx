'use client';

export type LeagueType = 'NFL' | 'NBA' | 'MLB' | 'NHL' | 'NCAAF' | 'NCAAB' | 'Champions League' | 'MLS';

interface LeagueTabsProps {
  activeLeague: LeagueType;
  onLeagueChange: (league: LeagueType) => void;
  availableLeagues: LeagueType[];
  gameCounts?: Record<string, number>;
  seasonStatus?: Record<LeagueType, boolean>;
}

const LEAGUE_CONFIGS = {
  'NFL': {
    name: 'NFL',
    color: 'from-blue-600 to-blue-700',
    icon: '🏈',
    sport_key: 'americanfootball_nfl'
  },
  'NBA': {
    name: 'NBA',
    color: 'from-orange-500 to-red-600',
    icon: '🏀',
    sport_key: 'basketball_nba'
  },
  'MLB': {
    name: 'MLB',
    color: 'from-green-600 to-blue-600',
    icon: '⚾',
    sport_key: 'baseball_mlb'
  },
  'NHL': {
    name: 'NHL',
    color: 'from-slate-600 to-slate-700',
    icon: '🏒',
    sport_key: 'icehockey_nhl'
  },
  'NCAAF': {
    name: 'NCAAF',
    color: 'from-purple-600 to-indigo-600',
    icon: '🏈',
    sport_key: 'americanfootball_ncaaf'
  },
  'NCAAB': {
    name: 'NCAAB',
    color: 'from-amber-500 to-orange-600',
    icon: '🏀',
    sport_key: 'basketball_ncaab'
  },
  'Champions League': {
    name: 'UCL',
    color: 'from-blue-800 to-purple-800',
    icon: '⚽',
    sport_key: 'soccer_uefa_champs_league'
  },
  'MLS': {
    name: 'MLS',
    color: 'from-green-500 to-emerald-600',
    icon: '⚽',
    sport_key: 'soccer_usa_mls'
  }
};

export default function LeagueTabs({ 
  activeLeague, 
  onLeagueChange, 
  availableLeagues, 
  gameCounts = {},
  seasonStatus = {}
}: LeagueTabsProps) {

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50">
      <div className="flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Sports & Markets</h3>
        </div>

        {/* League Tabs */}
        <div className="flex flex-wrap gap-2">
          {availableLeagues.map((league) => {
            const config = LEAGUE_CONFIGS[league];
            const gameCount = gameCounts[config.sport_key] || 0;
            const isActive = activeLeague === league;
            const inSeason = seasonStatus[league] ?? true;

            return (
              <button
                key={league}
                onClick={() => onLeagueChange(league)}
                className={`
                  relative flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200
                  ${isActive
                    ? `bg-gradient-to-r ${config.color} text-white shadow-lg transform scale-105`
                    : inSeason
                      ? 'bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 hover:shadow-md'
                      : 'bg-slate-50/50 text-slate-400 hover:bg-slate-100/50 hover:text-slate-500'
                  }
                `}
                title={inSeason ? undefined : `${league} is currently off-season`}
              >
                {!inSeason && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border border-white" />
                )}
                <span className="text-lg">{config.icon}</span>
                <span>{config.name}</span>
                {gameCount > 0 && (
                  <span className={`
                    inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full
                    ${isActive 
                      ? 'bg-white/20 text-white' 
                      : 'bg-green-100 text-green-600'
                    }
                  `}>
                    {gameCount}
                  </span>
                )}
                {!inSeason && gameCount === 0 && (
                  <span className="text-xs text-amber-600">OFF</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Active League Info */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${LEAGUE_CONFIGS[activeLeague].color}`}></div>
            <span className="text-sm font-medium text-slate-700">
              {LEAGUE_CONFIGS[activeLeague].name} Games
            </span>
          </div>
          <div className="text-sm text-slate-500">
            {gameCounts[LEAGUE_CONFIGS[activeLeague].sport_key] || 0} games available
          </div>
        </div>
      </div>
    </div>
  );
}