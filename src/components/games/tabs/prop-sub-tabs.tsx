'use client'

type SubTabConfig = {
  [key: string]: { label: string; icon: string; description: string }
}

interface PropSubTabsProps {
  sport: string
  activeSubTab: string
  onSubTabChange: (subTab: string) => void
  availableSubTabs: string[]
  propCounts?: Record<string, number>
}

export default function PropSubTabs({
  sport,
  activeSubTab,
  onSubTabChange,
  availableSubTabs,
  propCounts = {},
}: PropSubTabsProps) {
  const getSubTabConfig = (sport: string): SubTabConfig => {
    switch (sport) {
      case 'americanfootball_nfl':
      case 'americanfootball_ncaaf':
        return {
          qb: { label: 'QB', icon: '🎯', description: 'Passing Yards, TDs, Completions' },
          rb: { label: 'RB', icon: '🏃', description: 'Rushing Yards, TDs, Receptions' },
          wr: { label: 'WR/TE', icon: '🙌', description: 'Receiving Yards, Receptions, TDs' },
          def: { label: 'K/DEF', icon: '🛡️', description: 'Kicking, Sacks, Tackles' },
        }

      case 'basketball_nba':
      case 'basketball_ncaab':
        return {
          scoring: { label: 'Scoring', icon: '🏀', description: 'Points, FGs, 3-Pointers, FTs' },
          rebounding: {
            label: 'Rebounding',
            icon: '↩️',
            description: 'Total, Offensive, Defensive Rebounds',
          },
          playmaking: {
            label: 'Playmaking',
            icon: '🎯',
            description: 'Assists, Turnovers, Steals, Blocks',
          },
        }

      case 'baseball_mlb':
        return {
          hitters: { label: 'Hitters', icon: '⚾', description: 'Hits, Home Runs, RBIs, Runs' },
          pitchers: {
            label: 'Pitchers',
            icon: '🥎',
            description: 'Strikeouts, Walks, Innings, ERs',
          },
        }

      case 'icehockey_nhl':
        return {
          skaters: {
            label: 'Skaters',
            icon: '🏒',
            description: 'Goals, Assists, Points, Shots, Hits',
          },
          goalies: { label: 'Goalies', icon: '🥅', description: 'Saves, Goals Against, Save %' },
        }

      case 'soccer_uefa_champs_league':
      case 'soccer_usa_mls':
        return {
          forwards: {
            label: 'Forwards',
            icon: '⚽',
            description: 'Goals, Shots on Target, Assists',
          },
          midfielders: {
            label: 'Midfielders',
            icon: '🎯',
            description: 'Passes, Tackles, Assists',
          },
          defenders: { label: 'Defenders', icon: '🛡️', description: 'Tackles, Clearances, Blocks' },
          goalkeepers: { label: 'Goalkeepers', icon: '🧤', description: 'Saves, Clean Sheets' },
        }

      default:
        return {
          all: { label: 'All Props', icon: '📊', description: 'All available player props' },
        }
    }
  }

  const subTabConfig = getSubTabConfig(sport)

  // Filter available sub-tabs to only show those that exist in config
  const validSubTabs = availableSubTabs.filter(tab => subTabConfig[tab])

  if (validSubTabs.length <= 1) {
    return null // Don't show sub-tabs if there's only one or none
  }

  return (
    <div className="border-b border-slate-100 bg-white">
      <div className="px-6 py-3">
        <div className="flex flex-wrap gap-2">
          {validSubTabs.map(subTab => {
            const config = subTabConfig[subTab]
            if (!config) return null // Handle undefined case
            const isActive = activeSubTab === subTab
            const count = propCounts[subTab] || 0

            return (
              <button
                key={subTab}
                onClick={() => onSubTabChange(subTab)}
                className={`flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                } `}
              >
                <span>{config.icon}</span>
                <span>{config.label}</span>
                {count > 0 && (
                  <span
                    className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-xs font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600'
                    } `}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Active Sub-Tab Description */}
        <div className="mt-2 text-xs text-slate-500">{subTabConfig[activeSubTab]?.description}</div>
      </div>
    </div>
  )
}
