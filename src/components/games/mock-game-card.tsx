'use client'

import { Game } from '@/lib/types/games'
import { Clock } from 'lucide-react'

interface MockGameCardProps {
  game?: Game
  league: string
}

// Mock tab structure for each sport
const getMockTabs = (league: string) => {
  switch (league) {
    case 'MLB':
      return {
        mainTabs: ['Main Lines', 'Player Props', 'Team Props', 'Game Props'],
        subTabs: {
          'Main Lines': ['Moneyline', 'Run Line', 'Total'],
          'Player Props': ['Hitters', 'Pitchers'],
          'Team Props': ['Team Totals'],
          'Game Props': ['Game Totals'],
        },
        subSubTabs: {
          Hitters: ['Offense', 'Discipline', 'Speed'],
          Pitchers: ['Strikeouts', 'Hits Allowed', 'Earned Runs'],
        },
      }
    case 'NFL':
      return {
        mainTabs: ['Main Lines', 'Player Props', 'Team Props', 'Game Props'],
        subTabs: {
          'Main Lines': ['Spread', 'Moneyline', 'Total'],
          'Player Props': ['QB', 'RB', 'WR/TE', 'Defense/Kicker'],
          'Team Props': ['Team Totals'],
          'Game Props': ['Game Totals'],
        },
        subSubTabs: {
          QB: ['Passing', 'Rushing'],
          RB: ['Rushing', 'Receiving'],
          'WR/TE': ['Receiving', 'Rushing'],
        },
      }
    case 'NBA':
      return {
        mainTabs: ['Main Lines', 'Player Props', 'Team Props', 'Game Props'],
        subTabs: {
          'Main Lines': ['Spread', 'Moneyline', 'Total'],
          'Player Props': ['Scoring', 'Rebounding', 'Playmaking', 'Combo'],
          'Team Props': ['Team Totals'],
          'Game Props': ['Game Totals'],
        },
        subSubTabs: {
          Scoring: ['Points', 'Field Goals', '3-Pointers', 'Free Throws'],
          Rebounding: ['Total', 'Offensive', 'Defensive'],
          Playmaking: ['Assists', 'Defense', 'Turnovers'],
        },
      }
    case 'NHL':
      return {
        mainTabs: ['Main Lines', 'Player Props', 'Team Props', 'Game Props'],
        subTabs: {
          'Main Lines': ['Moneyline', 'Puck Line', 'Total'],
          'Player Props': ['Skaters', 'Goalies'],
          'Team Props': ['Team Totals'],
          'Game Props': ['Game Totals'],
        },
        subSubTabs: {
          Skaters: ['Goals', 'Assists', 'Shots', 'Hits'],
          Goalies: ['Saves', 'Goals Against'],
        },
      }
    default:
      return {
        mainTabs: ['Main Lines', 'Player Props', 'Team Props', 'Game Props'],
        subTabs: {
          'Main Lines': ['Spread', 'Moneyline', 'Total'],
          'Player Props': ['All Players'],
          'Team Props': ['Team Totals'],
          'Game Props': ['Game Totals'],
        },
        subSubTabs: {
          'All Players': ['All Markets'],
        },
      }
  }
}

export default function MockGameCard({ game, league }: MockGameCardProps) {
  const tabs = getMockTabs(league)

  // Format team names for display
  const formatTeamForDisplay = (teamName: string): string => {
    return teamName
      .replace(/^(Los Angeles|San Francisco|New York|Kansas City|Tampa Bay)/, '$1')
      .replace(/\s+(Angels|Dodgers|Giants|Yankees|Mets|Royals|Rays)/, ' $1')
      .trim()
  }

  const homeTeam = game ? formatTeamForDisplay(game.home_team) : 'Home Team'
  const awayTeam = game ? formatTeamForDisplay(game.away_team) : 'Away Team'
  const gameTime = game
    ? new Date(game.commence_time).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    : 'TBD'

  return (
    <div className="overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-white">
      {/* Game Header */}
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {league}
            </div>
            <div className="rounded-full bg-slate-200 px-2 py-1 text-xs font-medium text-slate-600">
              NO ODDS
            </div>
          </div>

          <div className="flex items-center space-x-2 text-sm text-slate-500">
            <Clock className="h-4 w-4" />
            <span className="font-medium">{gameTime}</span>
          </div>
        </div>
      </div>

      {/* Team Names */}
      <div className="border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1 opacity-60">
            <div className="text-sm font-bold text-slate-700">{awayTeam}</div>
            <div className="text-sm font-bold text-slate-700">{homeTeam}</div>
          </div>
          <div className="text-xs text-slate-400">vs</div>
        </div>
      </div>

      {/* Mock Tab Structure */}
      <div className="border-b border-slate-200 px-4 py-3">
        {/* Level 1: Main Tabs */}
        <div className="flex items-center gap-1 rounded-2xl bg-slate-50 p-1.5 opacity-50">
          {tabs.mainTabs.map((tab, index) => (
            <div
              key={tab}
              className={`flex-1 rounded-xl border-2 border-transparent px-4 py-2.5 text-sm font-semibold ${
                index === 0
                  ? 'border-slate-200 bg-white text-slate-600 shadow-md'
                  : 'bg-slate-100 text-slate-500'
              } `}
            >
              {tab}
            </div>
          ))}
        </div>

        {/* Level 2: Subtabs (show first main tab's subtabs) */}
        <div className="border-l-3 mt-4 border-slate-200 pl-3 opacity-40">
          <div className="flex flex-wrap gap-2">
            {(() => {
              const firstMainTab = tabs.mainTabs[0]
              const subTabsForFirst = firstMainTab
                ? (tabs.subTabs as Record<string, string[]>)[firstMainTab]
                : null
              return subTabsForFirst
                ? subTabsForFirst.map((subTab: string, index: number) => (
                    <div
                      key={subTab}
                      className={`rounded-xl border-2 border-transparent px-4 py-2 text-xs font-semibold ${
                        index === 0
                          ? 'border-slate-200 bg-slate-100 text-slate-600 shadow-sm'
                          : 'bg-slate-50 text-slate-500'
                      } `}
                    >
                      {subTab}
                    </div>
                  ))
                : null
            })()}
          </div>

          {/* Level 3: Sub-subtabs (show first subtab's options if available) */}
          {(() => {
            const firstMainTab = tabs.mainTabs[0]
            const subTabsForFirst = firstMainTab
              ? (tabs.subTabs as Record<string, string[]>)[firstMainTab]
              : null
            const firstSubTab = subTabsForFirst?.[0]
            const subSubTabsForFirst = firstSubTab
              ? (tabs.subSubTabs as Record<string, string[]>)[firstSubTab]
              : null

            return subSubTabsForFirst ? (
              <div className="border-l-3 mt-3 border-slate-200 pl-4 opacity-70">
                <div className="flex flex-wrap gap-1.5">
                  {subSubTabsForFirst.map((subSubTab: string, index: number) => (
                    <div
                      key={subSubTab}
                      className={`rounded-lg border-2 border-transparent px-3 py-1.5 text-xs font-semibold ${
                        index === 0
                          ? 'border-slate-200 bg-slate-100 text-slate-600 shadow-sm'
                          : 'bg-slate-50 text-slate-500'
                      } `}
                    >
                      {subSubTab}
                    </div>
                  ))}
                </div>
              </div>
            ) : null
          })()}
        </div>
      </div>

      {/* Mock Content Area */}
      <div className="p-4">
        <div className="py-8 text-center opacity-50">
          <div className="space-y-3">
            <div className="mb-4 text-sm font-medium text-slate-600">
              Available betting markets will appear here once odds are loaded
            </div>

            {/* Mock betting buttons */}
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="h-10 rounded-xl bg-slate-100"></div>
                <div className="h-10 rounded-xl bg-slate-100"></div>
                <div className="h-10 rounded-xl bg-slate-100"></div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div className="h-8 rounded-lg bg-slate-50"></div>
                <div className="h-8 rounded-lg bg-slate-50"></div>
                <div className="h-8 rounded-lg bg-slate-50"></div>
                <div className="h-8 rounded-lg bg-slate-50"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
