'use client'

export type LeagueType =
  | 'NFL'
  | 'NBA'
  | 'WNBA'
  | 'MLB'
  | 'NHL'
  | 'NCAAF'
  | 'NCAAB'
  | 'Champions League'
  | 'MLS'

interface LeagueTabsProps {
  activeLeague: LeagueType
  onLeagueChange: (league: LeagueType) => void
  availableLeagues: LeagueType[]
  gameCounts?: Record<string, number>
  seasonStatus?: Record<LeagueType, boolean>
}

const LEAGUE_CONFIGS = {
  NFL: {
    name: 'NFL',
    color: 'from-blue-600 to-blue-700',
    icon: '🏈',
    sport_key: 'americanfootball_nfl',
  },
  NBA: {
    name: 'NBA',
    color: 'from-orange-500 to-red-600',
    icon: '🏀',
    sport_key: 'basketball_nba',
  },
  WNBA: {
    name: 'WNBA',
    color: 'from-pink-500 to-purple-600',
    icon: '🏀',
    sport_key: 'basketball_wnba',
  },
  MLB: {
    name: 'MLB',
    color: 'from-green-600 to-blue-600',
    icon: '⚾',
    sport_key: 'baseball_mlb',
  },
  NHL: {
    name: 'NHL',
    color: 'from-slate-600 to-slate-700',
    icon: '🏒',
    sport_key: 'icehockey_nhl',
  },
  NCAAF: {
    name: 'NCAAF',
    color: 'from-purple-600 to-indigo-600',
    icon: '🏈',
    sport_key: 'americanfootball_ncaaf',
  },
  NCAAB: {
    name: 'NCAAB',
    color: 'from-amber-500 to-orange-600',
    icon: '🏀',
    sport_key: 'basketball_ncaab',
  },
  'Champions League': {
    name: 'UCL',
    color: 'from-blue-800 to-purple-800',
    icon: '⚽',
    sport_key: 'soccer_uefa_champs_league',
  },
  MLS: {
    name: 'MLS',
    color: 'from-green-500 to-emerald-600',
    icon: '⚽',
    sport_key: 'soccer_usa_mls',
  },
}

export default function LeagueTabs({
  activeLeague,
  onLeagueChange,
  availableLeagues,
  gameCounts = {},
  seasonStatus = {
    NFL: false,
    NBA: false,
    WNBA: false,
    MLB: false,
    NHL: false,
    NCAAF: false,
    NCAAB: false,
    'Champions League': false,
    MLS: false,
  },
}: LeagueTabsProps) {
  return (
    <div className="rounded-lg border border-slate-200/50 bg-white px-4 py-3 shadow-sm">
      <div className="flex flex-col space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Leagues & Markets</h3>
          <div className="text-xs text-slate-500">
            {gameCounts[LEAGUE_CONFIGS[activeLeague].sport_key] || 0} available
          </div>
        </div>

        {/* League Tabs */}
        <div className="flex flex-wrap gap-1.5">
          {availableLeagues.map(league => {
            const config = LEAGUE_CONFIGS[league]
            const gameCount = gameCounts[config.sport_key] || 0
            const isActive = activeLeague === league
            const inSeason = seasonStatus[league] ?? true

            return (
              <button
                key={league}
                onClick={() => onLeagueChange(league)}
                className={`relative flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? `bg-gradient-to-r ${config.color} text-white shadow-sm`
                    : inSeason
                      ? 'bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                      : 'bg-slate-50/50 text-slate-400 hover:bg-slate-100/50 hover:text-slate-500'
                } `}
                title={inSeason ? undefined : `${league} is currently off-season`}
              >
                {!inSeason && (
                  <div className="absolute -right-1 -top-1 h-2 w-2 rounded-full border border-white bg-amber-400" />
                )}
                <span className="text-sm">{config.icon}</span>
                <span>{config.name}</span>
                {gameCount > 0 && (
                  <span
                    className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-xs font-bold ${
                      isActive ? 'bg-white/25 text-white' : 'bg-green-100 text-green-700'
                    } `}
                  >
                    {gameCount}
                  </span>
                )}
                {!inSeason && gameCount === 0 && (
                  <span className="text-xs text-amber-600">OFF</span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
