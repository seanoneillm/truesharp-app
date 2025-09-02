'use client'

import { gamesDataService } from '@/lib/services/games-data'
import { DatabaseOdds, getMLBPlayerPropsSubTab } from '@/lib/types/database'
import { BetSelection, Game } from '@/lib/types/games'
import { organizeOddsByMarketTabs } from '@/lib/utils/database-to-game-converter'
import { formatTeamForDisplay } from '@/lib/utils/team-abbreviations'
import { useEffect, useState } from 'react'
import { MainTabType } from '../tabs/hierarchical-tabs'

interface DatabaseMarketContentProps {
  game: Game
  activeMainTab: MainTabType
  activeSubTab?: string
  activeSubSubTab?: string
  onBetClick: (bet: BetSelection) => void
}

function DatabaseMarketContent({
  game,
  activeMainTab,
  activeSubTab,
  activeSubSubTab, // eslint-disable-line @typescript-eslint/no-unused-vars
  onBetClick,
}: DatabaseMarketContentProps) {
  const [databaseOdds, setDatabaseOdds] = useState<DatabaseOdds[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch actual database odds for this game
  useEffect(() => {
    const fetchDatabaseOdds = async () => {
      try {
        setIsLoading(true)

        // Fetch game with odds from database
        const gameWithOdds = await gamesDataService.getMLBGameWithOdds(game.id)

        if (gameWithOdds && gameWithOdds.odds && gameWithOdds.odds.length > 0) {
          console.log('✅ Using real database odds:', gameWithOdds.odds.length)
          setDatabaseOdds(gameWithOdds.odds)
        } else {
          console.log('⚠️ No odds found for this game')
          setDatabaseOdds([])
        }
      } catch (error) {
        console.error('Error fetching database odds:', error)
        setDatabaseOdds([])
      } finally {
        setIsLoading(false)
      }
    }

    if (game.id) {
      fetchDatabaseOdds()
    }
  }, [game.id])

  // Organize odds by tab structure
  const organizedOdds = organizeOddsByMarketTabs(databaseOdds)

  // Helper function to combine over/under markets into single rows
  const combineOverUnderMarkets = (
    odds: DatabaseOdds[]
  ): {
    marketName: string
    over?: DatabaseOdds
    under?: DatabaseOdds
    line?: string | number | undefined
  }[] => {
    const marketGroups: Record<
      string,
      { over?: DatabaseOdds; under?: DatabaseOdds; line?: string | number | undefined }
    > = {}

    odds.forEach(odd => {
      // Extract the base market name (without over/under)
      const baseMarketName = odd.marketname
        .replace(/_over$|_under$/, '')
        .replace(/\s+(over|under)$/i, '')

      if (!marketGroups[baseMarketName]) {
        marketGroups[baseMarketName] = {}
      }

      const isOver = odd.sideid?.toLowerCase().includes('over') || odd.sideid?.toLowerCase() === 'o'
      const isUnder =
        odd.sideid?.toLowerCase().includes('under') || odd.sideid?.toLowerCase() === 'u'

      if (isOver) {
        marketGroups[baseMarketName].over = odd
        // Use line field instead of closebookodds for the betting line
        marketGroups[baseMarketName].line = odd.line || undefined
      } else if (isUnder) {
        marketGroups[baseMarketName].under = odd
        // Only set line if not already set (prefer over line, but fallback to under)
        if (!marketGroups[baseMarketName].line) {
          marketGroups[baseMarketName].line = odd.line || undefined
        }
      }
    })

    // Return all markets that have at least one side (over OR under)
    return Object.entries(marketGroups)
      .map(([marketName, group]) => ({
        marketName,
        ...group,
      }))
      .filter(group => group.over || group.under)
  }

  // Enhanced MLB-specific player props filtering based on hierarchy
  const filterPlayerPropsBySubTab = (odds: DatabaseOdds[], subTab: string): DatabaseOdds[] => {
    if (!subTab) return odds

    return odds.filter(odd => {
      const predictedSubTab = getMLBPlayerPropsSubTab(odd.marketname, odd.oddid || undefined)
      return predictedSubTab === subTab
    })
  }

  // Convert decimal/negative odds to American format
  const toAmericanOdds = (odds: number): string => {
    if (!odds || odds === 0) return '--'

    // If already in American format (> 100 or < -100), return as is
    if (Math.abs(odds) >= 100) {
      return odds > 0 ? `+${odds}` : `${odds}`
    }

    // If decimal format (1.x to 99.x), convert to American
    if (odds > 0 && odds < 100) {
      if (odds >= 2) {
        return `+${Math.round((odds - 1) * 100)}`
      } else {
        return `-${Math.round(100 / (odds - 1))}`
      }
    }

    return '--'
  }

  // Helper functions to extract player names and market types
  const extractPlayerName = (marketName: string): string => {
    // Try to extract player name from market name
    const parts = marketName.split(/[\s_-]+/)

    // Look for patterns that might indicate a player name
    const playerNamePattern = /^[A-Z][a-z]+\s[A-Z][a-z]+/
    const fullName = parts.slice(0, 2).join(' ')

    if (playerNamePattern.test(fullName)) {
      return fullName
    }

    // Fallback: return first part
    return parts[0] || 'Unknown Player'
  }

  const extractMarketType = (marketName: string): string => {
    const cleanName = marketName
      .replace(/^[A-Z][a-z]+\s[A-Z][a-z]+\s?/i, '') // Remove player name
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())

    return cleanName || 'Props'
  }

  // Main Lines Rendering
  const renderMainLines = (odds: Record<string, DatabaseOdds[]> = organizedOdds) => {
    const mainOdds = odds['main'] || []

    if (mainOdds.length === 0) {
      return (
        <div className="py-8 text-center">
          <div className="rounded-lg bg-slate-50 p-3 text-center text-slate-500">
            <div className="text-sm">No main line odds available</div>
            <div className="mt-1 text-xs">Check enhanced odds or try refreshing</div>
          </div>
        </div>
      )
    }

    // Group by market type for better organization
    const moneylineOdds = mainOdds.filter(
      odd =>
        odd.marketname?.toLowerCase().includes('moneyline') ||
        odd.marketname?.toLowerCase().includes('h2h') ||
        odd.marketname?.toLowerCase() === 'ml'
    )
    const spreadOdds = mainOdds.filter(
      odd =>
        odd.marketname?.toLowerCase().includes('spread') ||
        odd.marketname?.toLowerCase().includes('run_line') ||
        odd.marketname?.toLowerCase().includes('runline')
    )
    const totalOdds = mainOdds.filter(
      odd =>
        odd.marketname?.toLowerCase().includes('total') ||
        odd.marketname?.toLowerCase().includes('over/under') ||
        odd.marketname?.toLowerCase().includes('ou')
    )

    return (
      <div className="space-y-4">
        {/* 3-Column Grid Header */}
        <div className="grid grid-cols-3 gap-3 px-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
          <div>Market</div>
          <div className="text-center">Line</div>
          <div className="text-center">Odds</div>
        </div>

        {/* Spread */}
        {spreadOdds.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center text-sm font-medium text-slate-800">
              <span className="mr-2 h-2 w-2 rounded-full bg-orange-500"></span>
              Spread
            </div>
            {spreadOdds.slice(0, 2).map((odd, index) => {
              const isHome = odd.sideid?.includes('home') || index === 1
              const teamName = isHome ? game.home_team : game.away_team
              const line = odd.line // Use line field instead of closebookodds

              return (
                <div key={`spread-${index}`} className="grid grid-cols-3 items-center gap-3">
                  <div className="text-sm font-medium text-slate-700">
                    {formatTeamForDisplay(teamName, 8)}
                  </div>
                  <div className="text-center text-sm text-slate-600">
                    {line ? (isHome ? `+${line}` : line) : '--'}
                  </div>
                  <div className="flex justify-center">
                    <button
                      onClick={() =>
                        onBetClick({
                          gameId: game.id,
                          sport: game.sport_key,
                          homeTeam: game.home_team,
                          awayTeam: game.away_team,
                          gameTime: game.commence_time,
                          marketType: 'spread',
                          selection: teamName,
                          odds: odd.bookodds || 0,
                          line: typeof line === 'string' ? parseFloat(line) : line || undefined,
                          sportsbook: odd.sportsbook || 'Unknown',
                          description: `${game.away_team} @ ${game.home_team} - ${teamName} ${line || ''}`,
                        })
                      }
                      className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-sm font-medium text-orange-700 shadow-sm transition-all duration-200 hover:bg-orange-100 hover:shadow-md"
                    >
                      {toAmericanOdds(odd.bookodds || 0)}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Total - Combined Over/Under */}
        {totalOdds.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center text-sm font-medium text-slate-800">
              <span className="mr-2 h-2 w-2 rounded-full bg-green-500"></span>
              Total
            </div>
            {combineOverUnderMarkets(totalOdds)
              .slice(0, 1)
              .map((market, index) => (
                <div
                  key={`total-combined-${index}`}
                  className="grid grid-cols-4 items-center gap-3"
                >
                  <div className="text-sm font-medium text-slate-700">Total</div>
                  <div className="text-center text-sm text-slate-600">{market.line || '--'}</div>
                  <div className="flex justify-center">
                    {market.over && (
                      <button
                        onClick={() =>
                          onBetClick({
                            gameId: game.id,
                            sport: game.sport_key,
                            homeTeam: game.home_team,
                            awayTeam: game.away_team,
                            gameTime: game.commence_time,
                            marketType: 'total',
                            selection: 'Over',
                            odds: market.over?.bookodds || 0,
                            line:
                              typeof market.line === 'string'
                                ? parseFloat(market.line)
                                : market.line,
                            sportsbook: market.over?.sportsbook || 'Unknown',
                            description: `${game.away_team} @ ${game.home_team} - Over ${market.line || ''}`,
                          })
                        }
                        className="rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 shadow-sm transition-all duration-200 hover:bg-green-100 hover:shadow-md"
                      >
                        {toAmericanOdds(market.over?.bookodds || 0)}
                      </button>
                    )}
                    {!market.over && <span className="text-sm text-slate-400">--</span>}
                  </div>
                  <div className="flex justify-center">
                    {market.under && (
                      <button
                        onClick={() =>
                          onBetClick({
                            gameId: game.id,
                            sport: game.sport_key,
                            homeTeam: game.home_team,
                            awayTeam: game.away_team,
                            gameTime: game.commence_time,
                            marketType: 'total',
                            selection: 'Under',
                            odds: market.under?.bookodds || 0,
                            line:
                              typeof market.line === 'string'
                                ? parseFloat(market.line)
                                : market.line,
                            sportsbook: market.under?.sportsbook || 'Unknown',
                            description: `${game.away_team} @ ${game.home_team} - Under ${market.line || ''}`,
                          })
                        }
                        className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 shadow-sm transition-all duration-200 hover:bg-red-100 hover:shadow-md"
                      >
                        {toAmericanOdds(market.under?.bookodds || 0)}
                      </button>
                    )}
                    {!market.under && <span className="text-sm text-slate-400">--</span>}
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Moneyline */}
        {moneylineOdds.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center text-sm font-medium text-slate-800">
              <span className="mr-2 h-2 w-2 rounded-full bg-blue-500"></span>
              Moneyline
            </div>
            {moneylineOdds.slice(0, 2).map((odd, index) => {
              const isHome = odd.sideid?.includes('home') || index === 1
              const teamName = isHome ? game.home_team : game.away_team

              return (
                <div key={`moneyline-${index}`} className="grid grid-cols-3 items-center gap-3">
                  <div className="text-sm font-medium text-slate-700">
                    {formatTeamForDisplay(teamName, 8)}
                  </div>
                  <div className="text-center text-sm text-slate-600">--</div>
                  <div className="flex justify-center">
                    <button
                      onClick={() =>
                        onBetClick({
                          gameId: game.id,
                          sport: game.sport_key,
                          homeTeam: game.home_team,
                          awayTeam: game.away_team,
                          gameTime: game.commence_time,
                          marketType: 'moneyline',
                          selection: teamName,
                          odds: odd.bookodds || 0,
                          line: undefined,
                          sportsbook: odd.sportsbook || 'Unknown',
                          description: `${game.away_team} @ ${game.home_team} - ${teamName} Moneyline`,
                        })
                      }
                      className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 shadow-sm transition-all duration-200 hover:bg-blue-100 hover:shadow-md"
                    >
                      {toAmericanOdds(odd.bookodds || 0)}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // Player Props Rendering
  const renderPlayerProps = (odds: Record<string, DatabaseOdds[]> = organizedOdds) => {
    const playerPropsOdds = odds['player-props'] || []

    if (playerPropsOdds.length === 0) {
      return (
        <div className="py-8 text-center">
          <div className="rounded-lg bg-slate-50 p-3 text-center text-slate-500">
            <div className="text-sm">No player props available</div>
            <div className="mt-1 text-xs">Check back later for more markets</div>
          </div>
        </div>
      )
    }

    // Filter by active subtab if specified
    const filteredOdds = activeSubTab
      ? filterPlayerPropsBySubTab(playerPropsOdds, activeSubTab)
      : playerPropsOdds

    if (filteredOdds.length === 0) {
      return (
        <div className="py-8 text-center">
          <div className="rounded-lg bg-slate-50 p-3 text-center text-slate-500">
            <div className="text-sm">No {activeSubTab} props available</div>
            <div className="mt-1 text-xs">Try selecting a different category</div>
          </div>
        </div>
      )
    }

    // Combine over/under markets into single rows
    const combinedMarkets = combineOverUnderMarkets(filteredOdds)

    return (
      <div className="space-y-4">
        {/* 4-Column Grid Header */}
        <div className="grid grid-cols-4 gap-3 px-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
          <div>Player & Market</div>
          <div className="text-center">Line</div>
          <div className="text-center">Over</div>
          <div className="text-center">Under</div>
        </div>

        <div className="space-y-2">
          {combinedMarkets.slice(0, 8).map((market, index) => {
            const playerName = extractPlayerName(market.marketName)
            const marketType = extractMarketType(market.marketName)

            return (
              <div
                key={`combined-${index}`}
                className="grid grid-cols-4 items-center gap-3 border-b border-slate-100 py-2 last:border-b-0"
              >
                <div className="text-sm">
                  <div className="font-medium text-slate-800">{playerName}</div>
                  <div className="text-xs text-slate-600">{marketType}</div>
                </div>
                <div className="text-center text-sm text-slate-600">
                  {market.line !== null && market.line !== undefined ? market.line : '--'}
                </div>
                <div className="flex justify-center">
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
                          line:
                            typeof market.line === 'string' ? parseFloat(market.line) : market.line,
                          sportsbook: market.over?.sportsbook || 'Unknown',
                          description: `${playerName} - ${marketType} Over ${market.line || ''}`,
                        })
                      }
                      className="rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 shadow-sm transition-all duration-200 hover:bg-green-100 hover:shadow-md"
                    >
                      {toAmericanOdds(market.over?.bookodds || 0)}
                    </button>
                  )}
                  {!market.over && <span className="text-sm text-slate-400">--</span>}
                </div>
                <div className="flex justify-center">
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
                          line:
                            typeof market.line === 'string' ? parseFloat(market.line) : market.line,
                          sportsbook: market.under?.sportsbook || 'Unknown',
                          description: `${playerName} - ${marketType} Under ${market.line || ''}`,
                        })
                      }
                      className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 shadow-sm transition-all duration-200 hover:bg-red-100 hover:shadow-md"
                    >
                      {toAmericanOdds(market.under?.bookodds || 0)}
                    </button>
                  )}
                  {!market.under && <span className="text-sm text-slate-400">--</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Team Props Rendering
  const renderTeamProps = (odds: Record<string, DatabaseOdds[]> = organizedOdds) => {
    const teamPropsOdds = odds['team-props'] || []

    if (teamPropsOdds.length === 0) {
      return (
        <div className="py-8 text-center">
          <div className="rounded-lg bg-slate-50 p-3 text-center text-slate-500">
            <div className="text-sm">No team props available</div>
            <div className="mt-1 text-xs">Check back later for more markets</div>
          </div>
        </div>
      )
    }

    // Combine over/under markets into single rows
    const combinedMarkets = combineOverUnderMarkets(teamPropsOdds)

    return (
      <div className="space-y-4">
        {/* 4-Column Grid Header */}
        <div className="grid grid-cols-4 gap-3 px-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
          <div>Team & Market</div>
          <div className="text-center">Line</div>
          <div className="text-center">Over</div>
          <div className="text-center">Under</div>
        </div>

        <div className="space-y-2">
          {combinedMarkets.slice(0, 6).map((market, index) => (
            <div
              key={`team-combined-${index}`}
              className="grid grid-cols-4 items-center gap-3 border-b border-slate-100 py-2 last:border-b-0"
            >
              <div className="text-sm">
                <div className="font-medium text-slate-800">{market.marketName}</div>
              </div>
              <div className="text-center text-sm text-slate-600">
                {market.line !== null && market.line !== undefined ? market.line : '--'}
              </div>
              <div className="flex justify-center">
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
                        line:
                          typeof market.line === 'string' ? parseFloat(market.line) : market.line,
                        sportsbook: market.over?.sportsbook || 'Unknown',
                        description: `${market.marketName} Over ${market.line || ''}`,
                      })
                    }
                    className="rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 shadow-sm transition-all duration-200 hover:bg-green-100 hover:shadow-md"
                  >
                    {toAmericanOdds(market.over?.bookodds || 0)}
                  </button>
                )}
                {!market.over && <span className="text-sm text-slate-400">--</span>}
              </div>
              <div className="flex justify-center">
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
                        line:
                          typeof market.line === 'string' ? parseFloat(market.line) : market.line,
                        sportsbook: market.under?.sportsbook || 'Unknown',
                        description: `${market.marketName} Under ${market.line || ''}`,
                      })
                    }
                    className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 shadow-sm transition-all duration-200 hover:bg-red-100 hover:shadow-md"
                  >
                    {toAmericanOdds(market.under?.bookodds || 0)}
                  </button>
                )}
                {!market.under && <span className="text-sm text-slate-400">--</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Game Props Rendering
  const renderGameProps = (odds: Record<string, DatabaseOdds[]> = organizedOdds) => {
    const gamePropsOdds = odds['game-props'] || []

    if (gamePropsOdds.length === 0) {
      return (
        <div className="py-8 text-center">
          <div className="rounded-lg bg-slate-50 p-3 text-center text-slate-500">
            <div className="text-sm">No game props available</div>
            <div className="mt-1 text-xs">Check back later for more markets</div>
          </div>
        </div>
      )
    }

    // Combine over/under markets into single rows
    const combinedMarkets = combineOverUnderMarkets(gamePropsOdds)

    return (
      <div className="space-y-4">
        {/* 4-Column Grid Header */}
        <div className="grid grid-cols-4 gap-3 px-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
          <div>Game Market</div>
          <div className="text-center">Line</div>
          <div className="text-center">Over</div>
          <div className="text-center">Under</div>
        </div>

        <div className="space-y-2">
          {combinedMarkets.slice(0, 6).map((market, index) => (
            <div
              key={`game-combined-${index}`}
              className="grid grid-cols-4 items-center gap-3 border-b border-slate-100 py-2 last:border-b-0"
            >
              <div className="text-sm">
                <div className="font-medium text-slate-800">{market.marketName}</div>
              </div>
              <div className="text-center text-sm text-slate-600">
                {market.line !== null && market.line !== undefined ? market.line : '--'}
              </div>
              <div className="flex justify-center">
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
                        line:
                          typeof market.line === 'string' ? parseFloat(market.line) : market.line,
                        sportsbook: market.over?.sportsbook || 'Unknown',
                        description: `${market.marketName} Over ${market.line || ''}`,
                      })
                    }
                    className="rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 shadow-sm transition-all duration-200 hover:bg-green-100 hover:shadow-md"
                  >
                    {toAmericanOdds(market.over?.bookodds || 0)}
                  </button>
                )}
                {!market.over && <span className="text-sm text-slate-400">--</span>}
              </div>
              <div className="flex justify-center">
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
                        line:
                          typeof market.line === 'string' ? parseFloat(market.line) : market.line,
                        sportsbook: market.under?.sportsbook || 'Unknown',
                        description: `${market.marketName} Under ${market.line || ''}`,
                      })
                    }
                    className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 shadow-sm transition-all duration-200 hover:bg-red-100 hover:shadow-md"
                  >
                    {toAmericanOdds(market.under?.bookodds || 0)}
                  </button>
                )}
                {!market.under && <span className="text-sm text-slate-400">--</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center space-x-2 text-slate-600">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"></div>
          <span className="text-sm">Loading odds...</span>
        </div>
      </div>
    )
  }

  // No odds state
  if (databaseOdds.length === 0) {
    return (
      <div className="py-8 text-center">
        <div className="rounded-lg bg-slate-50 p-4 text-center text-slate-500">
          <div className="text-lg font-medium">No odds available</div>
          <div className="mt-1 text-sm">This game may not have betting lines yet</div>
        </div>
      </div>
    )
  }

  // Render content based on active tab
  switch (activeMainTab) {
    case 'main':
      return renderMainLines(organizedOdds)
    case 'player-props':
      return renderPlayerProps(organizedOdds)
    case 'team-props':
      return renderTeamProps(organizedOdds)
    case 'game-props':
      return renderGameProps(organizedOdds)
    default:
      return renderMainLines(organizedOdds)
  }
}

export default DatabaseMarketContent
