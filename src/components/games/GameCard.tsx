'use client';

import { useBetSlip } from '@/contexts/BetSlipContext';
import { extractGameOdds } from '@/lib/odds/odds-api';
import { enhancedOddsAPI, formatOdds, formatSpread } from '@/lib/odds/odds-api-client';
import { playerPropsAPI, type EnhancedPlayerProp } from '@/lib/odds/player-props-api';
import { BetSelection, EnhancedGameOdds, Game } from '@/lib/types/games';
import { Award, ChevronDown, ChevronUp, Search, Star, Target, TrendingUp, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import AnimatedCollapse from '../ui/AnimatedCollapse';
import EnhancedPlayerProps from './EnhancedPlayerProps';
import OddsComparisonTable from './OddsComparisonTable';
import ParlayButton from './ParlayButton';
import PlayerPropsMarketTabs from './PlayerPropsMarketTabs';
import PropMarketsSection from './PropMarketsSection';
import SimpleLineChart from './SimpleLineChart';

interface GameCardProps {
  game: Game;
  marketFilter?: 'all' | 'main' | 'props' | 'futures';
}

function formatGameTime(commenceTime: string): string {
  const date = new Date(commenceTime);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const gameDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  const isToday = gameDate.getTime() === today.getTime();
  
  if (isToday) {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }
}

export default function GameCard({ game, marketFilter = 'all' }: GameCardProps) {
  // Set initial tab based on market filter
  const getInitialTab = () => {
    switch (marketFilter) {
      case 'props': return 'props';
      default: return 'main';
    }
  };
  
  const [activeMarketTab, setActiveMarketTab] = useState<'main' | 'odds-comparison' | 'props' | 'alternate'>(getInitialTab());
  const [isExpanded, setIsExpanded] = useState(marketFilter !== 'all'); // Auto-expand when filter is active
  const [playerSearch, setPlayerSearch] = useState('');
  const [enhancedOdds, setEnhancedOdds] = useState<EnhancedGameOdds | null>(null);
  const [isLoadingOdds, setIsLoadingOdds] = useState(true);
  const [selectedPropsMarket, setSelectedPropsMarket] = useState('all');
  const [allPlayerProps, setAllPlayerProps] = useState<EnhancedPlayerProp[]>([]);
  const gameTime = formatGameTime(game.commence_time);
  
  const { addBet } = useBetSlip();
  
  // Mock Pro user status - in production, this would come from auth context
  const isProUser = false;

  const handleBetClick = (betSelection: BetSelection) => {
    addBet(betSelection);
  };

  useEffect(() => {
    const loadEnhancedOdds = () => {
      try {
        setIsLoadingOdds(true);
        const enhanced = enhancedOddsAPI.extractEnhancedGameOdds(game);
        setEnhancedOdds(enhanced);
      } catch (error) {
        console.error('Failed to extract enhanced odds:', error);
        // Fallback to basic odds
        const basic = extractGameOdds(game);
        setEnhancedOdds({
          ...basic,
          bestMoneyline: { home: null, away: null },
          bestSpread: { home: null, away: null },
          bestTotal: { over: null, under: null },
          allBookmakerOdds: [],
          lastUpdated: new Date().toISOString()
        });
      } finally {
        setIsLoadingOdds(false);
      }
    };

    loadEnhancedOdds();
  }, [game]);

  // Fetch player props when props tab is active
  useEffect(() => {
    const fetchPlayerProps = async () => {
      if (activeMarketTab === 'props') {
        try {
          const props = await playerPropsAPI.fetchPlayerPropsForGame(game.id, game.sport_key);
          setAllPlayerProps(props);
        } catch (error) {
          console.error('Failed to fetch player props:', error);
          setAllPlayerProps([]);
        }
      }
    };

    fetchPlayerProps();
  }, [activeMarketTab, game.id, game.sport_key]);

  const filteredPlayerProps = enhancedOdds?.playerProps?.filter(prop => 
    prop.playerName.toLowerCase().includes(playerSearch.toLowerCase()) ||
    prop.propType.toLowerCase().includes(playerSearch.toLowerCase())
  ) || [];

  // Enhanced game status detection
  const gameStartTime = new Date(game.commence_time);
  const now = new Date();
  const timeDiffHours = (now.getTime() - gameStartTime.getTime()) / (1000 * 60 * 60);
  
  // Game status logic
  const isLive = timeDiffHours >= 0 && timeDiffHours <= 4; // Games are typically 3-4 hours max
  const isCompleted = timeDiffHours > 4;

  return (
    <div className="bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:border-blue-300/50 overflow-hidden">
      {/* Game Header */}
      <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-slate-50 to-blue-50/30 border-b border-slate-100/50">
        <div className="flex items-center space-x-3">
          <div className="text-sm font-semibold uppercase tracking-wide px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
            {game.sport_title}
          </div>
          {isLive && (
            <div className="flex items-center space-x-1 text-sm font-semibold text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span>LIVE</span>
            </div>
          )}
          {isCompleted && (
            <div className="flex items-center space-x-1 text-sm font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-300">
              <span>FINAL</span>
            </div>
          )}
        </div>
        <div className="text-sm font-medium text-slate-700 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full border border-slate-200/50">
          {gameTime}
        </div>
      </div>

      {/* Teams and Odds Grid */}
      <div className="p-6">
        {/* Column Headers */}
        <div className="hidden sm:grid grid-cols-4 gap-4 mb-4 pb-2 border-b border-slate-100">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Teams
          </div>
          <div className="text-center text-xs font-medium text-slate-500 uppercase tracking-wide">
            Moneyline
          </div>
          <div className="text-center text-xs font-medium text-slate-500 uppercase tracking-wide">
            Spread
          </div>
          <div className="text-center text-xs font-medium text-slate-500 uppercase tracking-wide">
            Total
          </div>
        </div>

        {isLoadingOdds ? (
          <div className="animate-pulse space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 py-3">
              <div className="h-12 bg-slate-200 rounded"></div>
              <div className="h-8 bg-slate-200 rounded"></div>
              <div className="h-8 bg-slate-200 rounded"></div>
              <div className="h-8 bg-slate-200 rounded"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 py-3">
              <div className="h-12 bg-slate-200 rounded"></div>
              <div className="h-8 bg-slate-200 rounded"></div>
              <div className="h-8 bg-slate-200 rounded"></div>
              <div className="h-8 bg-slate-200 rounded"></div>
            </div>
          </div>
        ) : (
          <>
            {/* Away Team Row */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 py-3 hover:bg-blue-50/30 rounded-xl transition-colors">
              <div className="flex items-center">
                <div>
                  <div className="font-semibold text-slate-900 leading-tight">
                    @ {game.away_team}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 font-medium">Away</div>
                </div>
              </div>
              
              <div className="text-center">
                <div className="sm:hidden text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Moneyline</div>
                {enhancedOdds?.bestMoneyline.away ? (
                  <div className="relative">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleBetClick({
                          gameId: game.id,
                          sport: game.sport_key,
                          homeTeam: game.home_team,
                          awayTeam: game.away_team,
                          gameTime: game.commence_time,
                          marketType: 'moneyline',
                          selection: 'away',
                          odds: enhancedOdds.bestMoneyline.away.price,
                          sportsbook: enhancedOdds.bestMoneyline.away.sportsbookShort,
                          description: `${game.away_team} ML`
                        })}
                        className={`font-semibold text-sm px-3 py-1 rounded-xl transition-all duration-200 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200/50 hover:from-green-100 hover:to-emerald-100 hover:shadow-md cursor-pointer`}
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
                    <div className="flex items-center justify-center mt-1">
                      <Star className="w-3 h-3 text-green-600 mr-1" />
                      <span className="text-xs text-green-600 font-medium">{enhancedOdds.bestMoneyline.away.sportsbookShort}</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-100 text-slate-500 border border-slate-200 font-semibold text-sm px-3 py-1 rounded-xl">N/A</div>
                )}
              </div>
              
              <div className="text-center">
                <div className="sm:hidden text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Spread</div>
                {enhancedOdds?.bestSpread.away ? (
                  <div className="space-y-1">
                    <div className="font-semibold text-slate-900">
                      {formatSpread(enhancedOdds.bestSpread.away.point)}
                    </div>
                    <div className="relative">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => handleBetClick({
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
                            description: `${game.away_team} ${formatSpread(enhancedOdds.bestSpread.away.point)}`
                          })}
                          className="text-xs bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200/50 px-2 py-1 rounded font-medium hover:from-green-100 hover:to-emerald-100 hover:shadow-md cursor-pointer transition-all duration-200"
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
                      <div className="text-xs text-green-600 mt-0.5">{enhancedOdds.bestSpread.away.sportsbookShort}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-400 font-medium">N/A</div>
                )}
              </div>

              <div className="text-center">
                <div className="sm:hidden text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Total</div>
                {enhancedOdds?.bestTotal.over ? (
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-slate-600">O {enhancedOdds.bestTotal.over.point}</div>
                    <div className="relative">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => enhancedOdds?.bestTotal.over && handleBetClick({
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
                            description: `Over ${enhancedOdds.bestTotal.over.point}`
                          })}
                          className="text-xs bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200/50 px-2 py-1 rounded font-medium hover:from-green-100 hover:to-emerald-100 hover:shadow-md cursor-pointer transition-all duration-200"
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
                      <div className="text-xs text-green-600 mt-0.5">{enhancedOdds.bestTotal.over.sportsbookShort}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-400 font-medium">N/A</div>
                )}
              </div>
            </div>

            {/* Home Team Row */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 py-3 hover:bg-blue-50/30 rounded-xl transition-colors">
              <div className="flex items-center">
                <div>
                  <div className="font-semibold text-slate-900 leading-tight">
                    {game.home_team}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 font-medium">Home</div>
                </div>
              </div>
              
              <div className="text-center">
                <div className="sm:hidden text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Moneyline</div>
                {enhancedOdds?.bestMoneyline.home ? (
                  <div className="relative">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => enhancedOdds?.bestMoneyline.home && handleBetClick({
                          gameId: game.id,
                          sport: game.sport_key,
                          homeTeam: game.home_team,
                          awayTeam: game.away_team,
                          gameTime: game.commence_time,
                          marketType: 'moneyline',
                          selection: 'home',
                          odds: enhancedOdds.bestMoneyline.home.price,
                          sportsbook: enhancedOdds.bestMoneyline.home.sportsbookShort,
                          description: `${game.home_team} ML`
                        })}
                        className={`font-semibold text-sm px-3 py-1 rounded-xl transition-all duration-200 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200/50 hover:from-green-100 hover:to-emerald-100 hover:shadow-md cursor-pointer`}
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
                    <div className="flex items-center justify-center mt-1">
                      <Star className="w-3 h-3 text-green-600 mr-1" />
                      <span className="text-xs text-green-600 font-medium">{enhancedOdds.bestMoneyline.home.sportsbookShort}</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-100 text-slate-500 border border-slate-200 font-semibold text-sm px-3 py-1 rounded-xl">N/A</div>
                )}
              </div>
              
              <div className="text-center">
                <div className="sm:hidden text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Spread</div>
                {enhancedOdds?.bestSpread.home ? (
                  <div className="space-y-1">
                    <div className="font-semibold text-slate-900">
                      {formatSpread(enhancedOdds.bestSpread.home.point)}
                    </div>
                    <div className="relative">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => enhancedOdds?.bestSpread.home && handleBetClick({
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
                            description: `${game.home_team} ${formatSpread(enhancedOdds.bestSpread.home.point)}`
                          })}
                          className="text-xs bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200/50 px-2 py-1 rounded font-medium hover:from-green-100 hover:to-emerald-100 hover:shadow-md cursor-pointer transition-all duration-200"
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
                      <div className="text-xs text-green-600 mt-0.5">{enhancedOdds.bestSpread.home.sportsbookShort}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-400 font-medium">N/A</div>
                )}
              </div>

              <div className="text-center">
                <div className="sm:hidden text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Total</div>
                {enhancedOdds?.bestTotal.under ? (
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-slate-600">U {enhancedOdds.bestTotal.under.point}</div>
                    <div className="relative">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => enhancedOdds?.bestTotal.under && handleBetClick({
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
                            description: `Under ${enhancedOdds.bestTotal.under.point}`
                          })}
                          className="text-xs bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200/50 px-2 py-1 rounded font-medium hover:from-green-100 hover:to-emerald-100 hover:shadow-md cursor-pointer transition-all duration-200"
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
                      <div className="text-xs text-green-600 mt-0.5">{enhancedOdds.bestTotal.under.sportsbookShort}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-400 font-medium">N/A</div>
                )}
              </div>
            </div>

            {/* Best Odds Indicator */}
            {enhancedOdds && enhancedOdds.allBookmakerOdds.length > 1 && (
              <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Award className="w-4 h-4 text-green-600 mr-2" />
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
        <div className="mt-6 pt-4 border-t border-slate-100">
          <div className="flex flex-wrap gap-2 mb-4 text-sm">
            <button
              onClick={() => { setActiveMarketTab('main'); setIsExpanded(true); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                activeMarketTab === 'main'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Line Movement</span>
            </button>
            <button
              onClick={() => { setActiveMarketTab('odds-comparison'); setIsExpanded(true); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                activeMarketTab === 'odds-comparison'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Star className="w-4 h-4" />
              <span>Compare Odds ({enhancedOdds?.allBookmakerOdds?.length || 0})</span>
            </button>
            <button
              onClick={() => { setActiveMarketTab('props'); setIsExpanded(true); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                activeMarketTab === 'props'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>More Props ({enhancedOdds?.playerProps?.length || 0})</span>
            </button>
            <button
              onClick={() => { setActiveMarketTab('alternate'); setIsExpanded(true); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                activeMarketTab === 'alternate'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>Alt Lines ({enhancedOdds?.alternateLines?.length || 0})</span>
            </button>
          </div>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-center space-x-2 py-3 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50/50 rounded-xl transition-all duration-200"
          >
            <span>{isExpanded ? 'Hide Markets' : 'View All Markets'}</span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Expandable Markets Section */}
      <AnimatedCollapse isOpen={isExpanded}>
        <div className="border-t border-slate-100/50 bg-gradient-to-b from-slate-50/30 to-white/50">
          <div className="p-6 space-y-6">
            {/* Main Lines Tab */}
            {activeMarketTab === 'main' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">Line Movement Charts</h3>
                  <div className="text-sm text-slate-500">Historical odds data</div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-700">Spread Movement</h4>
                      <div className="text-xs text-slate-500">
                        Opening: {enhancedOdds?.bestSpread.home ? formatSpread(enhancedOdds.bestSpread.home.point) : 'N/A'}
                      </div>
                    </div>
                    <div className="h-32 bg-white rounded-lg border border-slate-200/50 p-3">
                      <SimpleLineChart gameId={game.id} marketType="spreads" team="home" isProUser={isProUser} />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-700">Total Movement</h4>
                      <div className="text-xs text-slate-500">
                        Opening: {enhancedOdds?.bestTotal.over ? enhancedOdds.bestTotal.over.point.toString() : 'N/A'}
                      </div>
                    </div>
                    <div className="h-32 bg-white rounded-lg border border-slate-200/50 p-3">
                      <SimpleLineChart gameId={game.id} marketType="totals" team="over" isProUser={isProUser} />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-700">Moneyline Movement</h4>
                      <div className="text-xs text-slate-500">
                        Opening: {enhancedOdds?.bestMoneyline.home ? formatOdds(enhancedOdds.bestMoneyline.home.price) : 'N/A'}
                      </div>
                    </div>
                    <div className="h-32 bg-white rounded-lg border border-slate-200/50 p-3">
                      <SimpleLineChart gameId={game.id} marketType="h2h" team="home" isProUser={isProUser} />
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
                {enhancedOdds && enhancedOdds.alternateLines && enhancedOdds.alternateLines.length > 0 && (
                  <div className="border-t pt-6 mt-6">
                    <h4 className="text-md font-semibold text-slate-800 mb-4 flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
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
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search players or props..."
                      value={playerSearch}
                      onChange={(e) => setPlayerSearch(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPlayerProps.map((prop) => (
                    <div key={prop.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-semibold text-slate-900 text-sm">{prop.playerName}</div>
                          <div className="text-xs text-slate-500">{prop.propType}</div>
                        </div>
                        <div className="text-xs text-slate-400 font-medium">{prop.sportsbook}</div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-slate-700">O/U {prop.line}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button className="bg-green-50 text-green-700 border border-green-200 rounded-lg py-2 px-3 text-sm font-medium hover:bg-green-100 transition-colors">
                            Over {formatOdds(prop.overPrice)}
                          </button>
                          <button className="bg-red-50 text-red-700 border border-red-200 rounded-lg py-2 px-3 text-sm font-medium hover:bg-red-100 transition-colors">
                            Under {formatOdds(prop.underPrice)}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {filteredPlayerProps.length === 0 && (
                  <div className="text-center py-8">
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
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Alternate Spreads */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold text-slate-700">Alternate Spreads</h4>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {enhancedOdds?.alternateLines?.filter(line => line.type === 'spread').map((line) => (
                        <div key={line.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-3 hover:bg-slate-50 transition-colors">
                          <div className="flex items-center space-x-3">
                            <div className="text-sm font-medium text-slate-900">
                              {line.team} {formatSpread(line.line)}
                            </div>
                            <div className="text-xs text-slate-500">{line.sportsbook}</div>
                          </div>
                          <button className="bg-blue-50 text-blue-700 border border-blue-200 rounded-lg py-1 px-3 text-sm font-medium hover:bg-blue-100 transition-colors">
                            {formatOdds(line.price)}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Alternate Totals */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold text-slate-700">Alternate Totals</h4>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {enhancedOdds?.alternateLines?.filter(line => line.type === 'total').map((line) => (
                        <div key={line.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-3 hover:bg-slate-50 transition-colors">
                          <div className="flex items-center space-x-3">
                            <div className="text-sm font-medium text-slate-900">
                              O/U {line.line}
                            </div>
                            <div className="text-xs text-slate-500">{line.sportsbook}</div>
                          </div>
                          <button className="bg-blue-50 text-blue-700 border border-blue-200 rounded-lg py-1 px-3 text-sm font-medium hover:bg-blue-100 transition-colors">
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
  );
}