'use client';

import { BetSelection, Game } from '@/lib/types/games';
import { Clock } from 'lucide-react';
import { useState } from 'react';
import DatabaseMarketContent from './markets/database-market-content';
import MarketContent from './markets/market-content';
import HierarchicalTabs, { MainTabType } from './tabs/hierarchical-tabs';

interface EnhancedDatabaseGameCardProps {
  game: Game;
  league: string;
  onOddsClick: (bet: BetSelection) => void;
  useDatabaseOdds?: boolean;
}

export default function EnhancedDatabaseGameCard({ 
  game, 
  league, 
  onOddsClick,
  useDatabaseOdds = false
}: EnhancedDatabaseGameCardProps) {
  const [activeMainTab, setActiveMainTab] = useState<MainTabType>('player-props');
  const [activeSubTab, setActiveSubTab] = useState<string>('hitters');
  const [showPropsSection, setShowPropsSection] = useState<boolean>(false);

  const formatGameTime = (commenceTime: string): string => {
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
  };

  const getGameStatus = () => {
    const gameStartTime = new Date(game.commence_time);
    const now = new Date();
    const timeDiffHours = (now.getTime() - gameStartTime.getTime()) / (1000 * 60 * 60);
    
    if (timeDiffHours >= 0 && timeDiffHours <= 4) {
      return { status: 'live', label: 'LIVE' };
    } else if (timeDiffHours > 4) {
      return { status: 'final', label: 'FINAL' };
    } else {
      return { status: 'scheduled', label: formatGameTime(game.commence_time) };
    }
  };

  const gameStatus = getGameStatus();

  // Extract odds data for main lines (for non-database mode)
  const extractMainLinesOdds = () => {
    if (!game.bookmakers || game.bookmakers.length === 0) {
      return {
        moneylineOdds: undefined,
        spreadOdds: undefined,
        totalOdds: undefined
      };
    }

    // Get the first bookmaker's odds (in production, you'd want to compare and get best odds)
    const bookmaker = game.bookmakers[0];
    
    let moneylineOdds, spreadOdds, totalOdds;

    bookmaker.markets.forEach(market => {
      if (market.key === 'h2h') {
        moneylineOdds = {
          home: market.outcomes.find(o => o.name === game.home_team) 
            ? { price: market.outcomes.find(o => o.name === game.home_team)!.price, sportsbook: bookmaker.title }
            : undefined,
          away: market.outcomes.find(o => o.name === game.away_team)
            ? { price: market.outcomes.find(o => o.name === game.away_team)!.price, sportsbook: bookmaker.title }
            : undefined
        };
      } else if (market.key === 'spreads') {
        spreadOdds = {
          home: market.outcomes.find(o => o.name === game.home_team)
            ? { 
                price: market.outcomes.find(o => o.name === game.home_team)!.price, 
                point: market.outcomes.find(o => o.name === game.home_team)!.point || 0,
                sportsbook: bookmaker.title 
              }
            : undefined,
          away: market.outcomes.find(o => o.name === game.away_team)
            ? { 
                price: market.outcomes.find(o => o.name === game.away_team)!.price, 
                point: market.outcomes.find(o => o.name === game.away_team)!.point || 0,
                sportsbook: bookmaker.title 
              }
            : undefined
        };
      } else if (market.key === 'totals') {
        const overOutcome = market.outcomes.find(o => o.name === 'Over');
        const underOutcome = market.outcomes.find(o => o.name === 'Under');
        
        totalOdds = {
          over: overOutcome 
            ? { price: overOutcome.price, point: overOutcome.point || 0, sportsbook: bookmaker.title }
            : undefined,
          under: underOutcome
            ? { price: underOutcome.price, point: underOutcome.point || 0, sportsbook: bookmaker.title }
            : undefined
        };
      }
    });

    return { moneylineOdds, spreadOdds, totalOdds };
  };

  const { moneylineOdds, spreadOdds, totalOdds } = extractMainLinesOdds();

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Compact Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50/50 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <span className="text-xs font-semibold uppercase tracking-wide px-2 py-1 bg-blue-600 text-white rounded">
            {league}
          </span>
          {useDatabaseOdds && (
            <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded">
              Live Data
            </span>
          )}
          {gameStatus.status === 'live' && (
            <div className="flex items-center space-x-1 text-xs font-medium text-red-600">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
              <span>LIVE</span>
            </div>
          )}
          {gameStatus.status === 'final' && (
            <span className="text-xs font-medium text-slate-500">FINAL</span>
          )}
        </div>
        
        {gameStatus.status === 'scheduled' && (
          <div className="flex items-center space-x-1 text-xs text-slate-600">
            <Clock className="w-3 h-3" />
            <span>{gameStatus.label}</span>
          </div>
        )}
      </div>

      {/* Teams & Main Odds */}
      <div className="p-3 sm:p-4">
        <div className="space-y-3 sm:space-y-4">
          {/* Teams Section - Responsive Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="flex items-center justify-between py-1.5 px-2 bg-slate-50/50 rounded">
              <div className="font-medium text-slate-900 truncate text-sm sm:text-base">
                @ {game.away_team}
              </div>
              <span className="text-xs text-slate-500 font-medium">AWAY</span>
            </div>
            <div className="flex items-center justify-between py-1.5 px-2 bg-blue-50/50 rounded">
              <div className="font-medium text-slate-900 truncate text-sm sm:text-base">
                {game.home_team}
              </div>
              <span className="text-xs text-blue-600 font-medium">HOME</span>
            </div>
          </div>

          {/* Main Lines Section - Always Visible */}
          <div className="mt-3">
            {useDatabaseOdds ? (
              <DatabaseMarketContent
                game={game}
                activeMainTab="main"
                activeSubTab=""
                onBetClick={onOddsClick}
              />
            ) : (
              <MarketContent
                sportKey={game.sport_key}
                activeMainTab="main"
                activeSubTab=""
                gameId={game.id}
                homeTeam={game.home_team}
                awayTeam={game.away_team}
                gameTime={game.commence_time}
                moneylineOdds={moneylineOdds}
                spreadOdds={spreadOdds}
                totalOdds={totalOdds}
                onBetClick={onOddsClick}
              />
            )}
          </div>

          {/* Props Toggle Button */}
          <div className="mt-4 border-t border-gray-200 pt-3">
            <button
              onClick={() => setShowPropsSection(!showPropsSection)}
              className="flex items-center justify-between w-full text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              <span>Player Props, Team Props & More</span>
              <span className={`transform transition-transform duration-200 ${showPropsSection ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>
          </div>

          {/* Collapsible Props Section */}
          {showPropsSection && (
            <div className="mt-3">
              {/* Props Tabs */}
              <div className="-mx-3 sm:-mx-4 mb-3">
                <HierarchicalTabs
                  sportKey={game.sport_key}
                  activeMainTab={activeMainTab}
                  activeSubTab={activeSubTab}
                  onMainTabChange={setActiveMainTab}
                  onSubTabChange={setActiveSubTab}
                />
              </div>

              {/* Props Content */}
              <div>
                {useDatabaseOdds ? (
                  <DatabaseMarketContent
                    game={game}
                    activeMainTab={activeMainTab}
                    activeSubTab={activeSubTab}
                    onBetClick={onOddsClick}
                  />
                ) : (
                  <MarketContent
                    sportKey={game.sport_key}
                    activeMainTab={activeMainTab}
                    activeSubTab={activeSubTab}
                    gameId={game.id}
                    homeTeam={game.home_team}
                    awayTeam={game.away_team}
                    gameTime={game.commence_time}
                    moneylineOdds={moneylineOdds}
                    spreadOdds={spreadOdds}
                    totalOdds={totalOdds}
                    onBetClick={onOddsClick}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}