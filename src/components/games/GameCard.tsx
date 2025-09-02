'use client'

import { useBetSlip } from '@/contexts/BetSlipContext'
import { extractGameOdds } from '@/lib/odds/odds-api'
import { enhancedOddsAPI, formatOdds, formatSpread } from '@/lib/odds/odds-api-client'
import { playerPropsAPI, type EnhancedPlayerProp } from '@/lib/odds/player-props-api'
import { BetSelection, EnhancedGameOdds, Game } from '@/lib/types/games'
import {
  Award,
  ChevronDown,
  ChevronUp,
  Search,
  Star,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import AnimatedCollapse from '../ui/AnimatedCollapse'
import EnhancedPlayerProps from './EnhancedPlayerProps'
import OddsComparisonTable from './OddsComparisonTable'
import ParlayButton from './ParlayButton'
import PlayerPropsMarketTabs from './PlayerPropsMarketTabs'
import PropMarketsSection from './PropMarketsSection'
import SimpleLineChart from './SimpleLineChart'

interface GameCardProps {
  game: Game
  marketFilter?: 'all' | 'main' | 'props' | 'futures'
}

function formatGameTime(commenceTime: string): string {
  const date = new Date(commenceTime)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const gameDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  const isToday = gameDate.getTime() === today.getTime()

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

export default function GameCard({ game, marketFilter = 'all' }: GameCardProps) {
  // Set initial tab based on market filter
  const getInitialTab = () => {
    switch (marketFilter) {
      case 'props':
        return 'props'
      default:
        return 'main'
    }
  }

  const [activeMarketTab, setActiveMarketTab] = useState<
    'main' | 'odds-comparison' | 'props' | 'alternate'
  >(getInitialTab())
  const [isExpanded, setIsExpanded] = useState(marketFilter !== 'all') // Auto-expand when filter is active
  const [playerSearch, setPlayerSearch] = useState('')
  const [enhancedOdds, setEnhancedOdds] = useState<EnhancedGameOdds | null>(null)
  const [isLoadingOdds, setIsLoadingOdds] = useState(true)
  const [selectedPropsMarket, setSelectedPropsMarket] = useState('all')
  const [allPlayerProps, setAllPlayerProps] = useState<EnhancedPlayerProp[]>([])
  const gameTime = formatGameTime(game.commence_time)

  const { addBet } = useBetSlip()

  // Mock Pro user status - in production, this would come from auth context
  const isProUser = false

  const handleBetClick = (betSelection: BetSelection) => {
    addBet(betSelection)
  }

  useEffect(() => {
    const loadEnhancedOdds = () => {
      try {
        setIsLoadingOdds(true)
        const enhanced = enhancedOddsAPI.extractEnhancedGameOdds(game)
        setEnhancedOdds(enhanced)
      } catch (error) {
        console.error('Failed to extract enhanced odds:', error)
        // Fallback to basic odds
        const basic = extractGameOdds(game)
        setEnhancedOdds({
          ...basic,
          bestMoneyline: { home: null, away: null },
          bestSpread: { home: null, away: null },
          bestTotal: { over: null, under: null },
          allBookmakerOdds: [],
          lastUpdated: new Date().toISOString(),
        })
      } finally {
        setIsLoadingOdds(false)
      }
    }

    loadEnhancedOdds()
  }, [game])

  // Fetch player props when props tab is active
  useEffect(() => {
    const fetchPlayerProps = async () => {
      if (activeMarketTab === 'props') {
        try {
          const props = await playerPropsAPI.fetchPlayerPropsForGame(game.id, game.sport_key)
          setAllPlayerProps(props)
        } catch (error) {
          console.error('Failed to fetch player props:', error)
          setAllPlayerProps([])
        }
      }
    }

    fetchPlayerProps()
  }, [activeMarketTab, game.id, game.sport_key])

  const filteredPlayerProps =
    enhancedOdds?.playerProps?.filter(
      prop =>
        prop.playerName.toLowerCase().includes(playerSearch.toLowerCase()) ||
        prop.propType.toLowerCase().includes(playerSearch.toLowerCase())
    ) || []

  // Enhanced game status detection
  const gameStartTime = new Date(game.commence_time)
  const now = new Date()
  const timeDiffHours = (now.getTime() - gameStartTime.getTime()) / (1000 * 60 * 60)

  // Game status logic
  const isLive = timeDiffHours >= 0 && timeDiffHours <= 4 // Games are typically 3-4 hours max
  const isCompleted = timeDiffHours > 4

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/50 bg-white/70 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-blue-300/50 hover:shadow-xl">
      {/* Game Header */}
      <div className="flex items-center justify-between border-b border-slate-100/50 bg-gradient-to-r from-slate-50 to-blue-50/30 px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold uppercase tracking-wide text-blue-700">
            {game.sport_title}
          </div>
          {isLive && (
            <div className="flex items-center space-x-1 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-sm font-semibold text-red-600">
              <div className="h-2 w-2 animate-pulse rounded-full bg-red-500"></div>
              <span>LIVE</span>
            </div>
          )}
          {isCompleted && (
            <div className="flex items-center space-x-1 rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
              <span>FINAL</span>
            </div>
          )}
        </div>
        <div className="rounded-full border border-slate-200/50 bg-white/80 px-3 py-1 text-sm font-medium text-slate-700 backdrop-blur-sm">
          {gameTime}
        </div>
      </div>

      {/* Teams and Odds Grid */}
      <div className="p-6">
        {/* Column Headers */}
        <div className="mb-4 hidden grid-cols-4 gap-4 border-b border-slate-100 pb-2 sm:grid">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Teams</div>
          <div className="text-center text-xs font-medium uppercase tracking-wide text-slate-500">
            Moneyline
          </div>
          <div className="text-center text-xs font-medium uppercase tracking-wide text-slate-500">
            Spread
          </div>
          <div className="text-center text-xs font-medium uppercase tracking-wide text-slate-500">
            Total
          </div>
        </div>

        {isLoadingOdds ? (
          <div className="animate-pulse space-y-3">
            <div className="grid grid-cols-1 gap-4 py-3 sm:grid-cols-4">
              <div className="h-12 rounded bg-slate-200"></div>
              <div className="h-8 rounded bg-slate-200"></div>
              <div className="h-8 rounded bg-slate-200"></div>
              <div className="h-8 rounded bg-slate-200"></div>
            </div>
            <div className="grid grid-cols-1 gap-4 py-3 sm:grid-cols-4">
              <div className="h-12 rounded bg-slate-200"></div>
              <div className="h-8 rounded bg-slate-200"></div>
              <div className="h-8 rounded bg-slate-200"></div>
              <div className="h-8 rounded bg-slate-200"></div>
            </div>
          </div>
        ) : (
          <>
            {/* Away Team Row */}
            <div className="grid grid-cols-1 gap-4 rounded-xl py-3 transition-colors hover:bg-blue-50/30 sm:grid-cols-4">
              <div className="flex items-center">
                <div>
                  <div className="font-semibold leading-tight text-slate-900">
                    @ {game.away_team}
                  </div>
                  <div className="mt-1 text-xs font-medium text-slate-500">Away</div>
                </div>
              </div>

              <div className="text-center">
                <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500 sm:hidden">
                  Moneyline
                </div>
                {enhancedOdds?.bestMoneyline.away ? (
                  <div className="relative">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() =>
                          handleBetClick({
                            gameId: game.id,
                            sport: game.sport_key,
                            homeTeam: game.home_team,
                            awayTeam: game.away_team,
                            gameTime: game.commence_time,
                            marketType: 'moneyline',
                            selection: 'away',
                            odds: enhancedOdds.bestMoneyline.away.price,
                            sportsbook: enhancedOdds.bestMoneyline.away.sportsbookShort,
                            description: `${game.away_team} ML`,
                          })
                        }
                        className={`cursor-pointer rounded-xl border border-green-200/50 bg-gradient-to-r from-green-50 to-emerald-50 px-3 py-1 text-sm font-semibold text-green-700 transition-all duration-200 hover:from-green-100 hover:to-emerald-100 hover:shadow-md`}
                      >
                        {formatOdds(enhancedOdds.bestMoneyline.away.price)}
                      </button>
                      <ParlayButton
                        gameId={game.id}
                        homeTeam={game.home_team}
                        awayTeam={game.away_team}
                        gameTime={game.commence_time}
                        sport={game.sport_key}
                        marketType="moneyline"
                        selection="away"
                        odds={enhancedOdds.bestMoneyline.away.price}
                        team={game.away_team}
                        description={`${game.away_team} ML`}
                        size="sm"
                        sportsbook={enhancedOdds.bestMoneyline.away.sportsbookShort}
                        onManualPickClick={handleBetClick}
                        showBothButtons={false}
                      />
                    </div>
                    <div className="mt-1 flex items-center justify-center">
                      <Star className="mr-1 h-3 w-3 text-green-600" />
                      <span className="text-xs font-medium text-green-600">
                        {enhancedOdds.bestMoneyline.away.sportsbookShort}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-500">
                    N/A
                  </div>
                )}
              </div>

              <div className="text-center">
                <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500 sm:hidden">
                  Spread
                </div>
                {enhancedOdds?.bestSpread.away ? (
                  <div className="space-y-1">
                    <div className="font-semibold text-slate-900">
                      {formatSpread(enhancedOdds.bestSpread.away.point)}
                    </div>
                    <div className="relative">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() =>
                            handleBetClick({
                              gameId: game.id,
                              sport: game.sport_key,
                              homeTeam: game.home_team,
                              awayTeam: game.away_team,
                              gameTime: game.commence_time,
                              marketType: 'spread',
                              selection: 'away',
                              line: enhancedOdds.bestSpread.away.point,
                              odds: enhancedOdds.bestSpread.away.price,
                              sportsbook: enhancedOdds.bestSpread.away.sportsbookShort,
                              description: `${game.away_team} ${formatSpread(enhancedOdds.bestSpread.away.point)}`,
                            })
                          }
                          className="cursor-pointer rounded border border-green-200/50 bg-gradient-to-r from-green-50 to-emerald-50 px-2 py-1 text-xs font-medium text-green-700 transition-all duration-200 hover:from-green-100 hover:to-emerald-100 hover:shadow-md"
                        >
                          {formatOdds(enhancedOdds.bestSpread.away.price)}
                        </button>
                        <ParlayButton
                          gameId={game.id}
                          homeTeam={game.home_team}
                          awayTeam={game.away_team}
                          gameTime={game.commence_time}
                          sport={game.sport_key}
                          marketType="spread"
                          selection="away"
                          odds={enhancedOdds.bestSpread.away.price}
                          team={game.away_team}
                          line={enhancedOdds.bestSpread.away.point}
                          description={`${game.away_team} ${formatSpread(enhancedOdds.bestSpread.away.point)}`}
                          size="sm"
                          sportsbook={enhancedOdds.bestSpread.away.sportsbookShort}
                          onManualPickClick={handleBetClick}
                          showBothButtons={false}
                        />
                      </div>
                      <div className="mt-0.5 text-xs text-green-600">
                        {enhancedOdds.bestSpread.away.sportsbookShort}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="font-medium text-slate-400">N/A</div>
                )}
              </div>

              <div className="text-center">
                <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500 sm:hidden">
                  Total
                </div>
                {enhancedOdds?.bestTotal.over ? (
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-slate-600">
                      O {enhancedOdds.bestTotal.over.point}
                    </div>
                    <div className="relative">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() =>
                            enhancedOdds?.bestTotal.over &&
                            handleBetClick({
                              gameId: game.id,
                              sport: game.sport_key,
                              homeTeam: game.home_team,
                              awayTeam: game.away_team,
                              gameTime: game.commence_time,
                              marketType: 'total',
                              selection: 'over',
                              line: enhancedOdds.bestTotal.over.point,
                              odds: enhancedOdds.bestTotal.over.price,
                              sportsbook: enhancedOdds.bestTotal.over.sportsbookShort,
                              description: `Over ${enhancedOdds.bestTotal.over.point}`,
                            })
                          }
                          className="cursor-pointer rounded border border-green-200/50 bg-gradient-to-r from-green-50 to-emerald-50 px-2 py-1 text-xs font-medium text-green-700 transition-all duration-200 hover:from-green-100 hover:to-emerald-100 hover:shadow-md"
                        >
                          {formatOdds(enhancedOdds.bestTotal.over.price)}
                        </button>
                        <ParlayButton
                          gameId={game.id}
                          homeTeam={game.home_team}
                          awayTeam={game.away_team}
                          gameTime={game.commence_time}
                          sport={game.sport_key}
                          marketType="total"
                          selection="over"
                          odds={enhancedOdds.bestTotal.over.price}
                          line={enhancedOdds.bestTotal.over.point}
                          description={`Over ${enhancedOdds.bestTotal.over.point}`}
                          size="sm"
                          sportsbook={enhancedOdds.bestTotal.over.sportsbookShort}
                          onManualPickClick={handleBetClick}
                          showBothButtons={false}
                        />
                      </div>
                      <div className="mt-0.5 text-xs text-green-600">
                        {enhancedOdds.bestTotal.over.sportsbookShort}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="font-medium text-slate-400">N/A</div>
                )}
              </div>
            </div>

            {/* Home Team Row */}
            <div className="grid grid-cols-1 gap-4 rounded-xl py-3 transition-colors hover:bg-blue-50/30 sm:grid-cols-4">
              <div className="flex items-center">
                <div>
                  <div className="font-semibold leading-tight text-slate-900">{game.home_team}</div>
                  <div className="mt-1 text-xs font-medium text-slate-500">Home</div>
                </div>
              </div>

              <div className="text-center">
                <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500 sm:hidden">
                  Moneyline
                </div>
                {enhancedOdds?.bestMoneyline.home ? (
                  <div className="relative">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() =>
                          enhancedOdds?.bestMoneyline.home &&
                          handleBetClick({
                            gameId: game.id,
                            sport: game.sport_key,
                            homeTeam: game.home_team,
                            awayTeam: game.away_team,
                            gameTime: game.commence_time,
                            marketType: 'moneyline',
                            selection: 'home',
                            odds: enhancedOdds.bestMoneyline.home.price,
                            sportsbook: enhancedOdds.bestMoneyline.home.sportsbookShort,
                            description: `${game.home_team} ML`,
                          })
                        }
                        className={`cursor-pointer rounded-xl border border-green-200/50 bg-gradient-to-r from-green-50 to-emerald-50 px-3 py-1 text-sm font-semibold text-green-700 transition-all duration-200 hover:from-green-100 hover:to-emerald-100 hover:shadow-md`}
                      >
                        {formatOdds(enhancedOdds.bestMoneyline.home.price)}
                      </button>
                      <ParlayButton
                        gameId={game.id}
                        homeTeam={game.home_team}
                        awayTeam={game.away_team}
                        gameTime={game.commence_time}
                        sport={game.sport_key}
                        marketType="moneyline"
                        selection="home"
                        odds={enhancedOdds.bestMoneyline.home.price}
                        team={game.home_team}
                        description={`${game.home_team} ML`}
                        size="sm"
                        sportsbook={enhancedOdds.bestMoneyline.home.sportsbookShort}
                        onManualPickClick={handleBetClick}
                        showBothButtons={false}
                      />
                    </div>
                    <div className="mt-1 flex items-center justify-center">
                      <Star className="mr-1 h-3 w-3 text-green-600" />
                      <span className="text-xs font-medium text-green-600">
                        {enhancedOdds.bestMoneyline.home.sportsbookShort}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-500">
                    N/A
                  </div>
                )}
              </div>

              <div className="text-center">
                <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500 sm:hidden">
                  Spread
                </div>
                {enhancedOdds?.bestSpread.home ? (
                  <div className="space-y-1">
                    <div className="font-semibold text-slate-900">
                      {formatSpread(enhancedOdds.bestSpread.home.point)}
                    </div>
                    <div className="relative">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() =>
                            enhancedOdds?.bestSpread.home &&
                            handleBetClick({
                              gameId: game.id,
                              sport: game.sport_key,
                              homeTeam: game.home_team,
                              awayTeam: game.away_team,
                              gameTime: game.commence_time,
                              marketType: 'spread',
                              selection: 'home',
                              line: enhancedOdds.bestSpread.home.point,
                              odds: enhancedOdds.bestSpread.home.price,
                              sportsbook: enhancedOdds.bestSpread.home.sportsbookShort,
                              description: `${game.home_team} ${formatSpread(enhancedOdds.bestSpread.home.point)}`,
                            })
                          }
                          className="cursor-pointer rounded border border-green-200/50 bg-gradient-to-r from-green-50 to-emerald-50 px-2 py-1 text-xs font-medium text-green-700 transition-all duration-200 hover:from-green-100 hover:to-emerald-100 hover:shadow-md"
                        >
                          {formatOdds(enhancedOdds.bestSpread.home.price)}
                        </button>
                        <ParlayButton
                          gameId={game.id}
                          homeTeam={game.home_team}
                          awayTeam={game.away_team}
                          gameTime={game.commence_time}
                          sport={game.sport_key}
                          marketType="spread"
                          selection="home"
                          odds={enhancedOdds.bestSpread.home.price}
                          team={game.home_team}
                          line={enhancedOdds.bestSpread.home.point}
                          description={`${game.home_team} ${formatSpread(enhancedOdds.bestSpread.home.point)}`}
                          size="sm"
                          sportsbook={enhancedOdds.bestSpread.home.sportsbookShort}
                          onManualPickClick={handleBetClick}
                          showBothButtons={false}
                        />
                      </div>
                      <div className="mt-0.5 text-xs text-green-600">
                        {enhancedOdds.bestSpread.home.sportsbookShort}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="font-medium text-slate-400">N/A</div>
                )}
              </div>

              <div className="text-center">
                <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500 sm:hidden">
                  Total
                </div>
                {enhancedOdds?.bestTotal.under ? (
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-slate-600">
                      U {enhancedOdds.bestTotal.under.point}
                    </div>
                    <div className="relative">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() =>
                            enhancedOdds?.bestTotal.under &&
                            handleBetClick({
                              gameId: game.id,
                              sport: game.sport_key,
                              homeTeam: game.home_team,
                              awayTeam: game.away_team,
                              gameTime: game.commence_time,
                              marketType: 'total',
                              selection: 'under',
                              line: enhancedOdds.bestTotal.under.point,
                              odds: enhancedOdds.bestTotal.under.price,
                              sportsbook: enhancedOdds.bestTotal.under.sportsbookShort,
                              description: `Under ${enhancedOdds.bestTotal.under.point}`,
                            })
                          }
                          className="cursor-pointer rounded border border-green-200/50 bg-gradient-to-r from-green-50 to-emerald-50 px-2 py-1 text-xs font-medium text-green-700 transition-all duration-200 hover:from-green-100 hover:to-emerald-100 hover:shadow-md"
                        >
                          {formatOdds(enhancedOdds.bestTotal.under.price)}
                        </button>
                        <ParlayButton
                          gameId={game.id}
                          homeTeam={game.home_team}
                          awayTeam={game.away_team}
                          gameTime={game.commence_time}
                          sport={game.sport_key}
                          marketType="total"
                          selection="under"
                          odds={enhancedOdds.bestTotal.under.price}
                          line={enhancedOdds.bestTotal.under.point}
                          description={`Under ${enhancedOdds.bestTotal.under.point}`}
                          size="sm"
                          sportsbook={enhancedOdds.bestTotal.under.sportsbookShort}
                          onManualPickClick={handleBetClick}
                          showBothButtons={false}
                        />
                      </div>
                      <div className="mt-0.5 text-xs text-green-600">
                        {enhancedOdds.bestTotal.under.sportsbookShort}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="font-medium text-slate-400">N/A</div>
                )}
              </div>
            </div>

            {/* Best Odds Indicator */}
            {enhancedOdds && enhancedOdds.allBookmakerOdds.length > 1 && (
              <div className="mt-4 rounded-lg border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Award className="mr-2 h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Best Available Odds</span>
                  </div>
                  <div className="text-xs text-green-600">
                    Compared across {enhancedOdds.allBookmakerOdds.length} sportsbooks
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Market Tabs */}
        <div className="mt-6 border-t border-slate-100 pt-4">
          <div className="mb-4 flex flex-wrap gap-2 text-sm">
            <button
              onClick={() => {
                setActiveMarketTab('main')
                setIsExpanded(true)
              }}
              className={`flex items-center space-x-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
                activeMarketTab === 'main'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              <span>Line Movement</span>
            </button>
            <button
              onClick={() => {
                setActiveMarketTab('odds-comparison')
                setIsExpanded(true)
              }}
              className={`flex items-center space-x-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
                activeMarketTab === 'odds-comparison'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Star className="h-4 w-4" />
              <span>Compare Odds ({enhancedOdds?.allBookmakerOdds?.length || 0})</span>
            </button>
            <button
              onClick={() => {
                setActiveMarketTab('props')
                setIsExpanded(true)
              }}
              className={`flex items-center space-x-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
                activeMarketTab === 'props'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>More Props ({enhancedOdds?.playerProps?.length || 0})</span>
            </button>
            <button
              onClick={() => {
                setActiveMarketTab('alternate')
                setIsExpanded(true)
              }}
              className={`flex items-center space-x-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
                activeMarketTab === 'alternate'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Target className="h-4 w-4" />
              <span>Alt Lines ({enhancedOdds?.alternateLines?.length || 0})</span>
            </button>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex w-full items-center justify-center space-x-2 rounded-xl py-3 text-sm font-medium text-blue-600 transition-all duration-200 hover:bg-blue-50/50 hover:text-blue-700"
          >
            <span>{isExpanded ? 'Hide Markets' : 'View All Markets'}</span>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Expandable Markets Section */}
      <AnimatedCollapse isOpen={isExpanded}>
        <div className="border-t border-slate-100/50 bg-gradient-to-b from-slate-50/30 to-white/50">
          <div className="space-y-6 p-6">
            {/* Main Lines Tab */}
            {activeMarketTab === 'main' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">Line Movement Charts</h3>
                  <div className="text-sm text-slate-500">Historical odds data</div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-700">Spread Movement</h4>
                      <div className="text-xs text-slate-500">
                        Opening:{' '}
                        {enhancedOdds?.bestSpread.home
                          ? formatSpread(enhancedOdds.bestSpread.home.point)
                          : 'N/A'}
                      </div>
                    </div>
                    <div className="h-32 rounded-lg border border-slate-200/50 bg-white p-3">
                      <SimpleLineChart
                        gameId={game.id}
                        marketType="spreads"
                        team="home"
                        isProUser={isProUser}
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-700">Total Movement</h4>
                      <div className="text-xs text-slate-500">
                        Opening:{' '}
                        {enhancedOdds?.bestTotal.over
                          ? enhancedOdds.bestTotal.over.point.toString()
                          : 'N/A'}
                      </div>
                    </div>
                    <div className="h-32 rounded-lg border border-slate-200/50 bg-white p-3">
                      <SimpleLineChart
                        gameId={game.id}
                        marketType="totals"
                        team="over"
                        isProUser={isProUser}
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-700">Moneyline Movement</h4>
                      <div className="text-xs text-slate-500">
                        Opening:{' '}
                        {enhancedOdds?.bestMoneyline.home
                          ? formatOdds(enhancedOdds.bestMoneyline.home.price)
                          : 'N/A'}
                      </div>
                    </div>
                    <div className="h-32 rounded-lg border border-slate-200/50 bg-white p-3">
                      <SimpleLineChart
                        gameId={game.id}
                        marketType="h2h"
                        team="home"
                        isProUser={isProUser}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Odds Comparison Tab */}
            {activeMarketTab === 'odds-comparison' && enhancedOdds && (
              <div className="space-y-6">
                <OddsComparisonTable
                  gameOdds={enhancedOdds}
                  homeTeam={game.home_team}
                  awayTeam={game.away_team}
                />
              </div>
            )}

            {/* Enhanced Player Props Tab - Sport-Specific Organization */}
            {activeMarketTab === 'props' && (
              <div className="space-y-0">
                {/* Player Props Market Tabs */}
                {allPlayerProps.length > 0 && (
                  <PlayerPropsMarketTabs
                    sport={game.sport_key}
                    allProps={allPlayerProps}
                    selectedMarket={selectedPropsMarket}
                    onMarketChange={setSelectedPropsMarket}
                  />
                )}

                {/* Player Props Content */}
                <div className="mt-6">
                  <EnhancedPlayerProps
                    gameId={game.id}
                    sport={game.sport_key}
                    homeTeam={game.home_team}
                    awayTeam={game.away_team}
                    gameTime={game.commence_time}
                    selectedMarket={selectedPropsMarket}
                    onMarketChange={setSelectedPropsMarket}
                    showMarketTabs={false}
                  />
                </div>

                {/* Fallback to additional markets if available */}
                {enhancedOdds &&
                  enhancedOdds.alternateLines &&
                  enhancedOdds.alternateLines.length > 0 && (
                    <div className="mt-6 border-t pt-6">
                      <h4 className="text-md mb-4 flex items-center space-x-2 font-semibold text-slate-800">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                        <span>Additional Markets</span>
                      </h4>
                      <PropMarketsSection
                        playerProps={[]}
                        alternateLines={enhancedOdds.alternateLines || []}
                        futures={enhancedOdds.futures || []}
                        sport={game.sport_key}
                        homeTeam={game.home_team}
                        awayTeam={game.away_team}
                      />
                    </div>
                  )}
              </div>
            )}

            {/* Legacy Player Props Tab - Removed */}
            {false && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">Player Props</h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search players or props..."
                      value={playerSearch}
                      onChange={e => setPlayerSearch(e.target.value)}
                      className="rounded-lg border border-slate-200 py-2 pl-10 pr-4 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredPlayerProps.map(prop => (
                    <div
                      key={prop.id}
                      className="rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">
                            {prop.playerName}
                          </div>
                          <div className="text-xs text-slate-500">{prop.propType}</div>
                        </div>
                        <div className="text-xs font-medium text-slate-400">{prop.sportsbook}</div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-slate-700">O/U {prop.line}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-700 transition-colors hover:bg-green-100">
                            Over {formatOdds(prop.overPrice)}
                          </button>
                          <button className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100">
                            Under {formatOdds(prop.underPrice)}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredPlayerProps.length === 0 && (
                  <div className="py-8 text-center">
                    <div className="text-slate-500">No player props match your search.</div>
                  </div>
                )}
              </div>
            )}

            {/* Alternate Lines Tab */}
            {activeMarketTab === 'alternate' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">Alternate Lines</h3>
                  <div className="text-sm text-slate-500">Better odds, different lines</div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {/* Alternate Spreads */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold text-slate-700">Alternate Spreads</h4>
                    <div className="max-h-96 space-y-2 overflow-y-auto">
                      {enhancedOdds?.alternateLines
                        ?.filter(line => line.type === 'spread')
                        .map(line => (
                          <div
                            key={line.id}
                            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 transition-colors hover:bg-slate-50"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="text-sm font-medium text-slate-900">
                                {line.team} {formatSpread(line.line)}
                              </div>
                              <div className="text-xs text-slate-500">{line.sportsbook}</div>
                            </div>
                            <button className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100">
                              {formatOdds(line.price)}
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Alternate Totals */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold text-slate-700">Alternate Totals</h4>
                    <div className="max-h-96 space-y-2 overflow-y-auto">
                      {enhancedOdds?.alternateLines
                        ?.filter(line => line.type === 'total')
                        .map(line => (
                          <div
                            key={line.id}
                            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 transition-colors hover:bg-slate-50"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="text-sm font-medium text-slate-900">
                                O/U {line.line}
                              </div>
                              <div className="text-xs text-slate-500">{line.sportsbook}</div>
                            </div>
                            <button className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100">
                              {formatOdds(line.price)}
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </AnimatedCollapse>
    </div>
  )
}
