'use client'

import { gamesDataService } from '@/lib/services/games-data'
import { DatabaseOdds } from '@/lib/types/database'
import { BetSelection, Game } from '@/lib/types/games'
import { generateMarketDisplayName, organizeOddsByHierarchy } from '@/lib/utils/odds-hierarchy'
import { useEffect, useState } from 'react'
import { MainTabType } from '../tabs/hierarchical-tabs'

interface DatabaseMarketContentFullProps {
  game: Game
  activeMainTab: MainTabType
  activeSubTab?: string
  activeSubSubTab?: string
  onBetClick: (bet: BetSelection) => void
}

function DatabaseMarketContentFull({
  game,
  activeMainTab,
  activeSubTab,
  activeSubSubTab,
  onBetClick,
}: DatabaseMarketContentFullProps) {
  const [databaseOdds, setDatabaseOdds] = useState<DatabaseOdds[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch actual database odds for this game
  useEffect(() => {
    const fetchDatabaseOdds = async () => {
      try {
        setIsLoading(true)

        console.log('🔍 DatabaseMarketContentFull: Fetching odds for game:', game.id)

        // Fetch game with odds from database
        const gameWithOdds = await gamesDataService.getMLBGameWithOdds(game.id)

        console.log('📊 DatabaseMarketContentFull: Game data received:', {
          gameId: game.id,
          hasGameData: !!gameWithOdds,
          hasOdds: !!gameWithOdds?.odds,
          oddsCount: gameWithOdds?.odds?.length || 0,
        })

        if (gameWithOdds && gameWithOdds.odds && gameWithOdds.odds.length > 0) {
          console.log('✅ Using real database odds:', gameWithOdds.odds.length)
          console.log(
            '📈 Sample odds:',
            gameWithOdds.odds.slice(0, 3).map(odd => ({
              oddid: odd.oddid,
              sportsbook: odd.sportsbook,
              bookodds: odd.bookodds,
              marketname: odd.marketname,
            }))
          )
          setDatabaseOdds(gameWithOdds.odds)
        } else {
          console.log('⚠️ No odds found for this game')
          setDatabaseOdds([])
        }
      } catch (error) {
        console.error('❌ Error fetching database odds:', error)
        setDatabaseOdds([])
      } finally {
        setIsLoading(false)
      }
    }

    if (game.id) {
      fetchDatabaseOdds()
    }
  }, [game.id])

  // Organize odds using the new hierarchy system
  const organizedOdds = organizeOddsByHierarchy(databaseOdds, game.sport_key)

  // Map MainTabType to hierarchy system IDs
  const getHierarchyTabId = (tab: MainTabType): string => {
    switch (tab) {
      case 'Main Lines':
        return 'main'
      case 'Player Props':
        return 'player-props'
      case 'Team Props':
        return 'team-props'
      case 'Game Props':
        return 'game-props'
      default:
        return 'main'
    }
  }

  // Helper function to combine over/under markets
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

      // Extract base market (remove over/under from oddID)
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

  // Get the best odds from available sportsbooks
  const getBestOdds = (odd: DatabaseOdds): { odds: number; sportsbook: string } => {
    // Check all available sportsbook odds fields
    const oddsOptions = [
      { odds: odd.fanduelodds, sportsbook: 'FanDuel' },
      { odds: odd.draftkingsodds, sportsbook: 'DraftKings' },
      { odds: odd.espnbetodds, sportsbook: 'ESPN BET' },
      { odds: odd.ceasarsodds, sportsbook: 'Caesars' },
      { odds: odd.mgmodds, sportsbook: 'MGM' },
      { odds: odd.fanaticsodds, sportsbook: 'Fanatics' },
      { odds: odd.bookodds, sportsbook: odd.sportsbook || 'Unknown' },
    ].filter(option => option.odds != null && option.odds !== 0)

    if (oddsOptions.length === 0) {
      return { odds: 0, sportsbook: 'No odds' }
    }

    // For positive American odds, we want the highest number (better payout)
    // For negative American odds, we want the closest to 0 (better odds)
    const bestOption = oddsOptions.reduce((best, current) => {
      if (!best.odds) return current

      const currentOdds = current.odds!
      const bestOdds = best.odds!

      // If one is positive and one is negative, prefer the positive (underdog usually better payout)
      if (currentOdds > 0 && bestOdds < 0) return current
      if (bestOdds > 0 && currentOdds < 0) return best

      // Both positive - take the higher number
      if (currentOdds > 0 && bestOdds > 0) {
        return currentOdds > bestOdds ? current : best
      }

      // Both negative - take the one closer to 0 (higher number when negative)
      if (currentOdds < 0 && bestOdds < 0) {
        return currentOdds > bestOdds ? current : best
      }

      return best
    })

    return { odds: bestOption.odds!, sportsbook: bestOption.sportsbook }
  }

  // Convert odds to American format
  const toAmericanOdds = (odds: number): string => {
    if (!odds || odds === 0) return '--'

    // If already in American format (> 100 or < -100)
    if (Math.abs(odds) >= 100) {
      return odds > 0 ? `+${odds}` : `${odds}`
    }

    // Convert decimal odds to American
    if (odds > 0 && odds < 100) {
      if (odds >= 2) {
        return `+${Math.round((odds - 1) * 100)}`
      } else if (odds > 1) {
        return `-${Math.round(100 / (odds - 1))}`
      }
    }

    return '--'
  }

  // Filter odds based on active tabs
  const getFilteredOdds = (): DatabaseOdds[] => {
    const hierarchyTabId = getHierarchyTabId(activeMainTab)
    const mainTabOdds = organizedOdds[hierarchyTabId] || {}

    if (!activeSubTab) {
      // Return all odds for the main tab
      return Object.values(mainTabOdds).flatMap(subTabOdds => Object.values(subTabOdds).flat())
    }

    const subTabOdds = mainTabOdds[activeSubTab] || {}

    if (!activeSubSubTab) {
      // Return all odds for the sub tab
      return Object.values(subTabOdds).flat()
    }

    // Return odds for the specific sub-sub tab
    return subTabOdds[activeSubSubTab] || []
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

  const filteredOdds = getFilteredOdds()

  if (filteredOdds.length === 0) {
    return (
      <div className="py-8 text-center">
        <div className="rounded-lg bg-slate-50 p-4 text-center text-slate-500">
          <div className="text-sm">No odds available for this category</div>
          <div className="mt-1 text-xs">Try selecting a different tab</div>
        </div>
      </div>
    )
  }

  // Render different layouts based on main tab
  if (activeMainTab === 'Main Lines') {
    // Main lines: separate sections for moneyline, spread, totals
    const moneylineOdds = filteredOdds.filter(odd => odd.oddid?.includes('-ml-'))
    const spreadOdds = filteredOdds.filter(odd => odd.oddid?.includes('-sp-'))
    const totalOdds = filteredOdds.filter(odd => odd.oddid?.includes('-ou-'))

    return (
      <div className="space-y-6">
        {/* Moneyline */}
        {moneylineOdds.length > 0 && (
          <div>
            <h3 className="mb-3 flex items-center text-sm font-semibold text-slate-800">
              <span className="mr-2 h-2 w-2 rounded-full bg-blue-500"></span>
              Moneyline
            </h3>
            <div className="space-y-2">
              {moneylineOdds.slice(0, 2).map((odd, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg bg-slate-50 p-3"
                >
                  <span className="font-medium text-slate-700">
                    {odd.oddid?.includes('home') ? game.home_team : game.away_team}
                  </span>
                  <button
                    onClick={() => {
                      const bestOdds = getBestOdds(odd)
                      onBetClick({
                        gameId: game.id,
                        sport: game.sport_key,
                        homeTeam: game.home_team,
                        awayTeam: game.away_team,
                        gameTime: game.commence_time,
                        marketType: 'moneyline',
                        selection: odd.oddid?.includes('home') ? game.home_team : game.away_team,
                        odds: bestOdds.odds,
                        line: undefined,
                        sportsbook: bestOdds.sportsbook,
                        description: generateMarketDisplayName(odd.oddid || ''),
                      })
                    }}
                    className="transform rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md active:bg-blue-800"
                  >
                    {(() => {
                      const bestOdds = getBestOdds(odd)
                      return toAmericanOdds(bestOdds.odds)
                    })()}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Spread */}
        {spreadOdds.length > 0 && (
          <div>
            <h3 className="mb-3 flex items-center text-sm font-semibold text-slate-800">
              <span className="mr-2 h-2 w-2 rounded-full bg-orange-500"></span>
              Spread
            </h3>
            <div className="space-y-2">
              {spreadOdds.slice(0, 2).map((odd, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg bg-slate-50 p-3"
                >
                  <div>
                    <span className="font-medium text-slate-700">
                      {odd.oddid?.includes('home') ? game.home_team : game.away_team}
                    </span>
                    {odd.line && (
                      <span className="ml-2 text-slate-500">
                        {odd.oddid?.includes('home') ? `+${odd.line}` : odd.line}
                      </span>
                    )}
                  </div>
                  <button
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
                    className="transform rounded-xl bg-orange-600 px-4 py-2.5 font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-orange-700 hover:shadow-md active:bg-orange-800"
                  >
                    {toAmericanOdds(odd.bookodds || 0)}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Totals */}
        {totalOdds.length > 0 && (
          <div>
            <h3 className="mb-3 flex items-center text-sm font-semibold text-slate-800">
              <span className="mr-2 h-2 w-2 rounded-full bg-green-500"></span>
              Total
            </h3>
            {combineOverUnderMarkets(totalOdds)
              .slice(0, 1)
              .map((market, index) => (
                <div
                  key={index}
                  className="grid grid-cols-3 items-center gap-3 rounded-lg bg-slate-50 p-3"
                >
                  <div>
                    <div className="font-medium text-slate-700">Total</div>
                    {market.line && <div className="text-sm text-slate-500">{market.line}</div>}
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
                            marketType: 'total',
                            selection: 'Over',
                            odds: market.over?.bookodds || 0,
                            line:
                              typeof market.line === 'string'
                                ? parseFloat(market.line)
                                : market.line,
                            sportsbook: market.over?.sportsbook || 'Unknown',
                            description: `Total Over ${market.line || ''}`,
                          })
                        }
                        className="transform rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-green-700 hover:shadow-md active:bg-green-800"
                      >
                        O {toAmericanOdds(market.over?.bookodds || 0)}
                      </button>
                    )}
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
                            description: `Total Under ${market.line || ''}`,
                          })
                        }
                        className="transform rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-md active:bg-red-800"
                      >
                        U {toAmericanOdds(market.under?.bookodds || 0)}
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    )
  }

  // For props (player, team, game), use combined over/under layout
  const combinedMarkets = combineOverUnderMarkets(filteredOdds)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="grid grid-cols-4 gap-3 px-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
        <div>Market</div>
        <div className="text-center">Line</div>
        <div className="text-center">Over</div>
        <div className="text-center">Under</div>
      </div>

      {/* Markets */}
      <div className="space-y-2">
        {combinedMarkets.slice(0, 12).map((market, index) => (
          <div
            key={index}
            className="grid grid-cols-4 items-center gap-3 border-b border-slate-100 py-3 last:border-b-0"
          >
            <div className="text-sm">
              <div className="font-medium text-slate-800">{market.displayName}</div>
            </div>
            <div className="text-center text-sm text-slate-600">{market.line || '--'}</div>
            <div className="flex justify-center">
              {market.over ? (
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
                  className="transform rounded-xl border-2 border-green-300 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-green-600 hover:text-white hover:shadow-lg active:scale-95"
                >
                  {toAmericanOdds(market.over?.bookodds || 0)}
                </button>
              ) : (
                <span className="text-sm text-slate-400">--</span>
              )}
            </div>
            <div className="flex justify-center">
              {market.under ? (
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
                  className="transform rounded-xl border-2 border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-600 hover:text-white hover:shadow-lg active:scale-95"
                >
                  {toAmericanOdds(market.under?.bookodds || 0)}
                </button>
              ) : (
                <span className="text-sm text-slate-400">--</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {combinedMarkets.length === 0 && (
        <div className="py-8 text-center">
          <div className="rounded-lg bg-slate-50 p-4 text-center text-slate-500">
            <div className="text-sm">No {activeMainTab} available</div>
            <div className="mt-1 text-xs">Try selecting a different category</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DatabaseMarketContentFull
