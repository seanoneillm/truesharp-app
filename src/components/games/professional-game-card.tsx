'use client'

import { gamesDataService } from '@/lib/services/games-data'
import { DatabaseOdds } from '@/lib/types/database'
import { BetSelection, Game } from '@/lib/types/games'
import {
  getAvailableTabs,
  organizeOddsByHierarchy,
  generateMarketDisplayName,
} from '@/lib/utils/odds-hierarchy'
import { Calendar, CircleDot, Clock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { MainTabType } from './tabs/hierarchical-tabs'

interface ProfessionalGameCardProps {
  game: Game
  league: string
  onOddsClick?: (bet: BetSelection) => void
  selectedBets?: BetSelection[]
}

export default function ProfessionalGameCard({
  game,
  league,
  onOddsClick = () => {},
  selectedBets = [],
}: ProfessionalGameCardProps) {
  const [activeTab, setActiveTab] = useState<MainTabType>('Main Lines')
  const [activeSubTab, setActiveSubTab] = useState<string>('')
  const [activeSubSubTab, setActiveSubSubTab] = useState<string>('')
  const [databaseOdds, setDatabaseOdds] = useState<DatabaseOdds[]>([])
  const [isLoadingOdds, setIsLoadingOdds] = useState(true)

  // Fetch odds - FIXED to work with all leagues
  useEffect(() => {
    const fetchOdds = async () => {
      try {
        setIsLoadingOdds(true)

        // Use the game's bookmakers data if available (already converted from database)
        if (game.bookmakers && game.bookmakers.length > 0) {
          // Extract odds from the converted game data
          const extractedOdds: DatabaseOdds[] = []

          game.bookmakers.forEach(bookmaker => {
            bookmaker.markets.forEach(market => {
              market.outcomes.forEach(outcome => {
                // Convert back to database format for processing
                const baseOddId = getOddIdFromMarket(market.key, outcome, game)
                if (baseOddId) {
                  extractedOdds.push({
                    id: `${bookmaker.key}_${market.key}_${outcome.name}`,
                    eventid: game.id,
                    sportsbook: bookmaker.title,
                    marketname: market.key,
                    oddid: baseOddId,
                    bookodds: convertDecimalToAmericanOdds(outcome.price),
                    line: outcome.point || null,
                    closebookodds: null,
                    created_at: market.last_update,
                    hometeam: game.home_team,
                    awayteam: game.away_team,
                    sideid: outcome.name.toLowerCase(),
                  })
                }
              })
            })
          })

          setDatabaseOdds(extractedOdds)
        } else {
          // Fallback to direct database query
          console.log(
            `📊 No bookmaker data found, fetching from database for ${league} game ${game.id}`
          )
          const gameWithOdds = await gamesDataService.getMLBGameWithOdds(game.id)

          if (gameWithOdds && gameWithOdds.odds && gameWithOdds.odds.length > 0) {
            setDatabaseOdds(gameWithOdds.odds)
          } else {
            setDatabaseOdds([])
          }
        }
      } catch (error) {
        console.error('Error fetching odds:', error)
        setDatabaseOdds([])
      } finally {
        setIsLoadingOdds(false)
      }
    }

    if (game.id) {
      fetchOdds()
    }
  }, [game.id, league])

  // Helper function to generate oddID from market data
  const getOddIdFromMarket = (marketKey: string, outcome: any, game: Game): string | null => {
    const sportKey = game.sport_key

    if (marketKey === 'totals' || marketKey === 'Over/Under') {
      const side = outcome.name.toLowerCase() === 'over' ? 'over' : 'under'
      return `points-all-game-ou-${side}`
    }

    if (marketKey === 'h2h' || marketKey === 'moneyline') {
      const isHome = outcome.name === game.home_team
      const side = isHome ? 'home' : 'away'
      return `points-${side}-game-ml-${side}`
    }

    if (marketKey === 'spreads' || marketKey === 'spread') {
      const isHome = outcome.name === game.home_team
      const side = isHome ? 'home' : 'away'
      return `points-${side}-game-sp-${side}`
    }

    return null
  }

  // Helper function to convert decimal to American odds
  const convertDecimalToAmericanOdds = (decimal: number): number => {
    if (decimal >= 2) {
      return Math.round((decimal - 1) * 100)
    } else {
      return Math.round(-100 / (decimal - 1))
    }
  }

  // Organize odds and get available tabs
  const organizedOdds = organizeOddsByHierarchy(databaseOdds, game.sport_key)
  const availableTabs = getAvailableTabs(organizedOdds)

  // Format team names
  const formatTeamForDisplay = (teamName: string): string => {
    return teamName
      .replace(/^(Los Angeles|San Francisco|New York|Kansas City|Tampa Bay)/, '$1')
      .replace(/\s+(Angels|Dodgers|Giants|Yankees|Mets|Royals|Rays)/, ' $1')
      .trim()
  }

  const homeTeam = formatTeamForDisplay(game.home_team)
  const awayTeam = formatTeamForDisplay(game.away_team)

  // Game status and time
  const gameStartTime = new Date(game.commence_time)
  const now = new Date()
  const timeDiffHours = (now.getTime() - gameStartTime.getTime()) / (1000 * 60 * 60)

  const isLive = timeDiffHours >= 0 && timeDiffHours <= 4
  const isFinal = timeDiffHours > 4
  const isUpcoming = timeDiffHours < 0

  const formatGameTime = (timeString: string): string => {
    const date = new Date(timeString)
    const today = new Date()
    const isToday = date.toDateString() === today.toDateString()

    if (isToday) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    }
  }

  const getStatusBadge = () => {
    if (isLive) {
      return (
        <div className="flex animate-pulse items-center space-x-1 rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white shadow-sm">
          <CircleDot className="h-3 w-3" />
          <span>LIVE</span>
        </div>
      )
    }

    if (isFinal) {
      return (
        <div className="rounded-full bg-slate-600 px-2 py-1 text-xs font-bold text-white">
          FINAL
        </div>
      )
    }

    return (
      <div className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
        UPCOMING
      </div>
    )
  }

  // Tab handlers
  const handleTabChange = (tab: MainTabType) => {
    setActiveTab(tab)
    setActiveSubTab('')
    setActiveSubSubTab('')
  }

  const handleSubTabChange = (subTab: string) => {
    setActiveSubTab(subTab)
    setActiveSubSubTab('')
  }

  const handleSubSubTabChange = (subSubTab: string) => {
    setActiveSubSubTab(subSubTab)
  }

  // Get display names for tabs (simplified since we're using direct names)
  const getTabDisplayName = (tab: MainTabType): string => {
    return tab // Direct mapping since we're using the actual names now
  }

  const getSubTabDisplayName = (subTab: string): string => {
    const displayNames: Record<string, string> = {
      // Baseball
      Hitters: 'Hitters',
      Pitchers: 'Pitchers',
      // Football
      Quarterback: 'Quarterback',
      'Running Back': 'Running Back',
      'Wide Receiver/Tight End': 'WR/TE',
      'Kicker/Defense': 'K/Defense',
      'Any Player': 'Any Player',
      // Basketball
      Scoring: 'Scoring',
      Rebounding: 'Rebounding',
      Playmaking: 'Playmaking',
      'Combo Props': 'Combo Props',
      // Hockey
      Skaters: 'Skaters',
      Goalies: 'Goalies',
      // Soccer
      Forwards: 'Forwards',
      Midfielders: 'Midfielders',
      Defenders: 'Defenders',
      Goalkeepers: 'Goalkeepers',
      // Common
      'Team Totals': 'Team Totals',
      'Game Totals': 'Game Totals',
      Totals: 'Totals',
      all: 'All',
    }
    return displayNames[subTab] || subTab
  }

  const getSubSubTabDisplayName = (subSubTab: string): string => {
    const displayNames: Record<string, string> = {
      offense: 'Offense',
      discipline: 'Discipline',
      speed: 'Speed',
      passing: 'Passing',
      rushing: 'Rushing',
      receiving: 'Receiving',
      points: 'Points',
      'field-goals': 'Field Goals',
      'three-pointers': '3PT',
      'free-throws': 'FT',
      total: 'Total',
      offensive: 'Offensive',
      defensive: 'Defensive',
      assists: 'Assists',
      defense: 'Defense',
      turnovers: 'Turnovers',
      all: 'All',
    }
    return displayNames[subSubTab] || subSubTab
  }

  // Get current tabs
  const currentSubTabs = availableTabs.getSubTabs(activeTab)
  const currentSubSubTabs = availableTabs.getSubSubTabs(activeTab, activeSubTab)

  // All main tabs (always show even if no odds) - UPDATED to match games-page.md
  const allMainTabs: MainTabType[] = ['Main Lines', 'Player Props', 'Team Props', 'Game Props']

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">
      {/* Header Section */}
      <div className="border-b border-slate-100 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Teams and info */}
          <div className="flex items-center space-x-4">
            <div>
              <div className="mb-1 text-lg font-bold text-slate-900">
                {awayTeam} @ {homeTeam}
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <span className="font-medium text-slate-600">
                  <Clock className="mr-1 inline h-4 w-4" />
                  {isUpcoming ? formatGameTime(game.commence_time) : 'In Progress'}
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                  {league}
                </span>
                {getStatusBadge()}
              </div>
            </div>
          </div>

          {/* Right side - Secondary button */}
          <button className="flex items-center space-x-1 rounded-lg px-3 py-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700">
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">Add to Calendar</span>
          </button>
        </div>
      </div>

      {/* Three-Row Tab System */}
      <div className="space-y-4 border-b border-slate-100 bg-slate-50/50 px-6 py-4">
        {/* Row 1: Main Categories (always visible) */}
        <div className="flex items-center space-x-3">
          {allMainTabs.map(tab => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                activeTab === tab
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-blue-50 hover:text-blue-700'
              }`}
            >
              {getTabDisplayName(tab)}
            </button>
          ))}
        </div>

        {/* Row 2: Subcategories */}
        {(currentSubTabs.length > 0 || !isLoadingOdds) && (
          <div className="flex items-center space-x-2 border-l-4 border-blue-200 pl-6">
            {currentSubTabs.length > 0 ? (
              currentSubTabs.map(subTab => (
                <button
                  key={subTab}
                  onClick={() => handleSubTabChange(subTab)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    activeSubTab === subTab
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-orange-50 hover:text-orange-700'
                  }`}
                >
                  {getSubTabDisplayName(subTab)}
                </button>
              ))
            ) : (
              <span className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm italic text-slate-500">
                No subcategories available
              </span>
            )}
          </div>
        )}

        {/* Row 3: Markets */}
        {(currentSubSubTabs.length > 0 ||
          (currentSubTabs.length > 0 && activeSubTab && !isLoadingOdds)) && (
          <div className="flex items-center space-x-2 border-l-4 border-orange-200 pl-10">
            {currentSubSubTabs.length > 0 ? (
              currentSubSubTabs.map(subSubTab => (
                <button
                  key={subSubTab}
                  onClick={() => handleSubSubTabChange(subSubTab)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                    activeSubSubTab === subSubTab
                      ? 'bg-green-500 text-white shadow-md'
                      : 'border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-green-50 hover:text-green-700'
                  }`}
                >
                  {getSubSubTabDisplayName(subSubTab)}
                </button>
              ))
            ) : currentSubTabs.length > 0 && activeSubTab ? (
              <span className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs italic text-slate-500">
                No markets available
              </span>
            ) : null}
          </div>
        )}
      </div>

      {/* Odds Display */}
      <div className="p-6">
        <ProfessionalOddsDisplay
          game={game}
          activeMainTab={activeTab}
          activeSubTab={activeSubTab}
          activeSubSubTab={activeSubSubTab}
          onBetClick={onOddsClick}
          isLoadingOdds={isLoadingOdds}
          databaseOdds={databaseOdds}
        />
      </div>
    </div>
  )
}

// Separate component for odds display
interface ProfessionalOddsDisplayProps {
  game: Game
  activeMainTab: MainTabType
  activeSubTab?: string
  activeSubSubTab?: string
  onBetClick: (bet: BetSelection) => void
  isLoadingOdds: boolean
  databaseOdds: DatabaseOdds[]
}

function ProfessionalOddsDisplay({
  game,
  activeMainTab,
  activeSubTab,
  activeSubSubTab,
  onBetClick,
  isLoadingOdds,
  databaseOdds,
}: ProfessionalOddsDisplayProps) {
  // Convert odds to American format
  const toAmericanOdds = (odds: number): string => {
    if (!odds || odds === 0) return '--'

    if (Math.abs(odds) >= 100) {
      return odds > 0 ? `+${odds}` : `${odds}`
    }

    if (odds > 0 && odds < 100) {
      if (odds >= 2) {
        return `+${Math.round((odds - 1) * 100)}`
      } else {
        return `-${Math.round(100 / (odds - 1))}`
      }
    }

    return '--'
  }

  // Loading state
  if (isLoadingOdds) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-3 text-slate-600">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"></div>
          <span className="text-sm">Loading odds...</span>
        </div>
      </div>
    )
  }

  // No odds - blank state (but tabs still visible)
  if (databaseOdds.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-8">
          <div className="text-slate-500">
            <div className="mb-2 text-lg font-semibold">No odds available for this game</div>
            <div className="text-sm">Odds will appear here when available from sportsbooks</div>
          </div>
        </div>
      </div>
    )
  }

  // Organize odds and filter
  const organizedOdds = organizeOddsByHierarchy(databaseOdds, game.sport_key)

  const getFilteredOdds = (): DatabaseOdds[] => {
    const mainTabOdds = organizedOdds[activeMainTab] || {}

    if (!activeSubTab) {
      return Object.values(mainTabOdds).flatMap(subTabOdds => Object.values(subTabOdds).flat())
    }

    const subTabOdds = mainTabOdds[activeSubTab] || {}

    if (!activeSubSubTab) {
      return Object.values(subTabOdds).flat()
    }

    return subTabOdds[activeSubSubTab] || []
  }

  const filteredOdds = getFilteredOdds()

  // Main Lines Display (side by side format)
  if (activeMainTab === 'Main Lines') {
    const moneylineOdds = filteredOdds.filter(odd => odd.oddid?.includes('-ml-'))
    const spreadOdds = filteredOdds.filter(odd => odd.oddid?.includes('-sp-'))
    const totalOdds = filteredOdds.filter(odd => odd.oddid?.includes('-ou-'))

    return (
      <div className="space-y-6">
        {/* Main Lines Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Spread */}
          {spreadOdds.length >= 2 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                Spread
              </h3>
              <div className="space-y-2">
                {spreadOdds.slice(0, 2).map((odd, index) => (
                  <button
                    key={index}
                    onClick={() =>
                      onBetClick({
                        gameId: game.id,
                        sport: game.sport_key,
                        homeTeam: game.home_team,
                        awayTeam: game.away_team,
                        gameTime: game.commence_time,
                        marketType: 'spread',
                        selection: odd.oddid?.includes('home') ? game.home_team : game.away_team,
                        odds: odd.bookodds || 0,
                        line: odd.line
                          ? typeof odd.line === 'string'
                            ? parseFloat(odd.line)
                            : odd.line
                          : undefined,
                        sportsbook: odd.sportsbook || 'Unknown',
                        description: generateMarketDisplayName(odd.oddid || ''),
                      })
                    }
                    className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 transition-all duration-200 hover:border-blue-200 hover:bg-blue-50"
                  >
                    <div className="text-left">
                      <div className="text-sm font-semibold text-slate-900">
                        {odd.oddid?.includes('home') ? game.home_team : game.away_team}
                      </div>
                      {odd.line && (
                        <div className="text-xs text-slate-500">
                          {odd.oddid?.includes('home') ? `+${odd.line}` : odd.line}
                        </div>
                      )}
                    </div>
                    <div className="text-sm font-bold text-blue-600">
                      {toAmericanOdds(odd.bookodds || 0)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Total */}
          {totalOdds.length >= 2 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                Total
              </h3>
              <div className="space-y-2">
                {totalOdds.slice(0, 2).map((odd, index) => (
                  <button
                    key={index}
                    onClick={() =>
                      onBetClick({
                        gameId: game.id,
                        sport: game.sport_key,
                        homeTeam: game.home_team,
                        awayTeam: game.away_team,
                        gameTime: game.commence_time,
                        marketType: 'total',
                        selection: odd.oddid?.includes('over') ? 'Over' : 'Under',
                        odds: odd.bookodds || 0,
                        line: odd.line
                          ? typeof odd.line === 'string'
                            ? parseFloat(odd.line)
                            : odd.line
                          : undefined,
                        sportsbook: odd.sportsbook || 'Unknown',
                        description: `Total ${odd.oddid?.includes('over') ? 'Over' : 'Under'} ${odd.line || ''}`,
                      })
                    }
                    className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 transition-all duration-200 hover:border-green-200 hover:bg-green-50"
                  >
                    <div className="text-left">
                      <div className="text-sm font-semibold text-slate-900">
                        {odd.oddid?.includes('over') ? 'Over' : 'Under'}
                      </div>
                      {odd.line && <div className="text-xs text-slate-500">{odd.line}</div>}
                    </div>
                    <div className="text-sm font-bold text-green-600">
                      {toAmericanOdds(odd.bookodds || 0)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Moneyline */}
          {moneylineOdds.length >= 2 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                Moneyline
              </h3>
              <div className="space-y-2">
                {moneylineOdds.slice(0, 2).map((odd, index) => (
                  <button
                    key={index}
                    onClick={() =>
                      onBetClick({
                        gameId: game.id,
                        sport: game.sport_key,
                        homeTeam: game.home_team,
                        awayTeam: game.away_team,
                        gameTime: game.commence_time,
                        marketType: 'moneyline',
                        selection: odd.oddid?.includes('home') ? game.home_team : game.away_team,
                        odds: odd.bookodds || 0,
                        line: undefined,
                        sportsbook: odd.sportsbook || 'Unknown',
                        description: generateMarketDisplayName(odd.oddid || ''),
                      })
                    }
                    className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 transition-all duration-200 hover:border-orange-200 hover:bg-orange-50"
                  >
                    <div className="text-sm font-semibold text-slate-900">
                      {odd.oddid?.includes('home') ? game.home_team : game.away_team}
                    </div>
                    <div className="text-sm font-bold text-orange-600">
                      {toAmericanOdds(odd.bookodds || 0)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* If no main lines available */}
        {spreadOdds.length === 0 && totalOdds.length === 0 && moneylineOdds.length === 0 && (
          <div className="py-8 text-center">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
              <div className="text-sm text-slate-500">No main lines available</div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Props/Other Odds (list style grid)
  const combineOverUnderMarkets = (
    odds: DatabaseOdds[]
  ): {
    marketName: string
    over?: DatabaseOdds
    under?: DatabaseOdds
    line?: string | number | undefined
    displayName: string
  }[] => {
    const marketGroups: Record<
      string,
      {
        over?: DatabaseOdds
        under?: DatabaseOdds
        line?: string | number | undefined
        displayName: string
      }
    > = {}

    odds.forEach(odd => {
      if (!odd.oddid) return

      const baseOddID = odd.oddid.replace(/-over$|-under$/, '')

      if (!marketGroups[baseOddID]) {
        marketGroups[baseOddID] = {
          displayName: generateMarketDisplayName(baseOddID),
        }
      }

      const isOver = odd.oddid.includes('-over')
      const isUnder = odd.oddid.includes('-under')

      if (isOver) {
        marketGroups[baseOddID].over = odd
        marketGroups[baseOddID].line = odd.line || undefined
      } else if (isUnder) {
        marketGroups[baseOddID].under = odd
        if (!marketGroups[baseOddID].line) {
          marketGroups[baseOddID].line = odd.line || undefined
        }
      }
    })

    return Object.entries(marketGroups)
      .map(([marketName, group]) => ({
        marketName,
        ...group,
      }))
      .filter(group => group.over || group.under)
  }

  const combinedMarkets = combineOverUnderMarkets(filteredOdds)

  if (combinedMarkets.length === 0) {
    return (
      <div className="py-8 text-center">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
          <div className="text-sm text-slate-500">No odds available for this category</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* List Style Grid for Props */}
      <div className="space-y-3">
        {combinedMarkets.slice(0, 12).map((market, index) => (
          <div
            key={index}
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4"
          >
            {/* Left: Market name + line */}
            <div>
              <div className="text-sm font-semibold text-slate-900">{market.displayName}</div>
              {market.line && <div className="text-xs text-slate-500">Line: {market.line}</div>}
            </div>

            {/* Right: Odds buttons */}
            <div className="flex items-center space-x-3">
              {market.over && (
                <button
                  onClick={() =>
                    onBetClick({
                      gameId: game.id,
                      sport: game.sport_key,
                      homeTeam: game.home_team,
                      awayTeam: game.away_team,
                      gameTime: game.commence_time,
                      marketType: 'prop',
                      selection: 'Over',
                      odds: market.over?.bookodds || 0,
                      line: typeof market.line === 'string' ? parseFloat(market.line) : market.line,
                      sportsbook: market.over?.sportsbook || 'Unknown',
                      description: `${market.displayName} Over ${market.line || ''}`,
                    })
                  }
                  className="rounded-lg bg-green-500 px-4 py-2 font-semibold text-white transition-colors hover:bg-green-600"
                >
                  {toAmericanOdds(market.over?.bookodds || 0)}
                </button>
              )}

              {market.under && (
                <button
                  onClick={() =>
                    onBetClick({
                      gameId: game.id,
                      sport: game.sport_key,
                      homeTeam: game.home_team,
                      awayTeam: game.away_team,
                      gameTime: game.commence_time,
                      marketType: 'prop',
                      selection: 'Under',
                      odds: market.under?.bookodds || 0,
                      line: typeof market.line === 'string' ? parseFloat(market.line) : market.line,
                      sportsbook: market.under?.sportsbook || 'Unknown',
                      description: `${market.displayName} Under ${market.line || ''}`,
                    })
                  }
                  className="rounded-lg bg-red-500 px-4 py-2 font-semibold text-white transition-colors hover:bg-red-600"
                >
                  {toAmericanOdds(market.under?.bookodds || 0)}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
