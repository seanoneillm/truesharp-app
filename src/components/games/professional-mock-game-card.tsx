'use client'

import { Game } from '@/lib/types/games'
import { Calendar, Clock } from 'lucide-react'

interface ProfessionalMockGameCardProps {
  game?: Game
  league: string
}

// Mock tab structure for each sport
const getMockTabs = (league: string) => {
  switch (league) {
    case 'MLB':
      return {
        mainTabs: ['Main Lines', 'Player Props', 'Team Props', 'Game Props'],
        subTabs: ['Batters', 'Pitchers'],
        subSubTabs: ['Offense', 'Discipline', 'Speed'],
      }
    case 'NFL':
      return {
        mainTabs: ['Main Lines', 'Player Props', 'Team Props', 'Game Props'],
        subTabs: ['QB', 'RB', 'WR/TE', 'Defense/K'],
        subSubTabs: ['Passing', 'Rushing', 'Receiving'],
      }
    case 'NBA':
      return {
        mainTabs: ['Main Lines', 'Player Props', 'Team Props', 'Game Props'],
        subTabs: ['Points', 'Rebounds', 'Assists', 'Combos'],
        subSubTabs: ['Points', 'Field Goals', '3PT', 'FT'],
      }
    case 'NHL':
      return {
        mainTabs: ['Main Lines', 'Player Props', 'Team Props', 'Game Props'],
        subTabs: ['Skaters', 'Goalies'],
        subSubTabs: ['Goals', 'Assists', 'Shots'],
      }
    default:
      return {
        mainTabs: ['Main Lines', 'Player Props', 'Team Props', 'Game Props'],
        subTabs: ['All Players'],
        subSubTabs: ['All Markets'],
      }
  }
}

export default function ProfessionalMockGameCard({ game, league }: ProfessionalMockGameCardProps) {
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
    <div className="overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-white opacity-75 shadow-sm">
      {/* Header Section */}
      <div className="border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Teams and info */}
          <div className="flex items-center space-x-4">
            <div>
              <div className="mb-1 text-lg font-bold text-slate-700">
                {awayTeam} @ {homeTeam}
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <span className="font-medium text-slate-500">
                  <Clock className="mr-1 inline h-4 w-4" />
                  {gameTime}
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                  {league}
                </span>
                <div className="rounded-full bg-slate-200 px-2 py-1 text-xs font-medium text-slate-600">
                  NO ODDS
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Secondary button */}
          <button className="flex items-center space-x-1 rounded-lg px-3 py-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-500">
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">Add to Calendar</span>
          </button>
        </div>
      </div>

      {/* Mock Three-Row Tab System */}
      <div className="space-y-3 border-b border-slate-200 bg-slate-50 px-6 py-4">
        {/* Row 1: Main Categories (always visible) */}
        <div className="flex items-center space-x-2">
          {tabs.mainTabs.map((tab, index) => (
            <div
              key={tab}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                index === 0
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'border border-slate-200 bg-white text-slate-600'
              }`}
            >
              {tab}
            </div>
          ))}
        </div>

        {/* Row 2: Subcategories */}
        <div className="flex items-center space-x-2 pl-4">
          {tabs.subTabs.map((subTab, index) => (
            <div
              key={subTab}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                index === 0
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'border border-slate-200 bg-white text-slate-600'
              }`}
            >
              {subTab}
            </div>
          ))}
        </div>

        {/* Row 3: Markets */}
        <div className="flex items-center space-x-2 pl-8">
          {tabs.subSubTabs.map((subSubTab, index) => (
            <div
              key={subSubTab}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                index === 0
                  ? 'bg-green-500 text-white shadow-sm'
                  : 'border border-slate-200 bg-white text-slate-500'
              }`}
            >
              {subSubTab}
            </div>
          ))}
        </div>
      </div>

      {/* Mock Content Area */}
      <div className="p-6">
        <div className="py-12 text-center">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-8">
            <div className="text-slate-500">
              <div className="mb-2 text-lg font-semibold">No odds available for this game</div>
              <div className="mb-4 text-sm">
                Odds will appear here when available from sportsbooks
              </div>

              {/* Mock main lines layout */}
              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Spread
                  </div>
                  <div className="h-16 rounded-lg bg-slate-100"></div>
                  <div className="h-16 rounded-lg bg-slate-100"></div>
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Total
                  </div>
                  <div className="h-16 rounded-lg bg-slate-100"></div>
                  <div className="h-16 rounded-lg bg-slate-100"></div>
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Moneyline
                  </div>
                  <div className="h-16 rounded-lg bg-slate-100"></div>
                  <div className="h-16 rounded-lg bg-slate-100"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
