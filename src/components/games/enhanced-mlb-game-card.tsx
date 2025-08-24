'use client';

import { useMLBOdds } from '@/hooks/use-mlb-odds';
import { DatabaseGame } from '@/lib/types/database';
import { BetSelection, Game } from '@/lib/types/games';
import { Clock } from 'lucide-react';
import { useState } from 'react';
import DatabaseMarketContent from './markets/database-market-content';
import MLBOddsDisplay from './mlb-odds-display';
import HierarchicalTabs, { MainTabType } from './tabs/hierarchical-tabs';

interface EnhancedMLBGameCardProps {
  game: Game | DatabaseGame;
  onOddsClick: (bet: BetSelection) => void;
  useDatabaseOdds?: boolean;
  useNewMLBOdds?: boolean;
}

export default function EnhancedMLBGameCard({ 
  game, 
  onOddsClick,
  useDatabaseOdds = false,
  useNewMLBOdds = false
}: EnhancedMLBGameCardProps) {
  const [activeMainTab, setActiveMainTab] = useState<MainTabType>('main');
  const [activeSubTab, setActiveSubTab] = useState<string>('hitters');

  // Type guard to check if it's a DatabaseGame
  const isDatabaseGame = (g: Game | DatabaseGame): g is DatabaseGame => {
    return 'game_time' in g;
  };

  // Get game time consistently
  const getGameTime = (): string => {
    return isDatabaseGame(game) ? game.game_time : game.commence_time;
  };

  // Get team names consistently
  const getTeamNames = () => {
    if (isDatabaseGame(game)) {
      return {
        homeTeam: game.home_team_name || game.home_team,
        awayTeam: game.away_team_name || game.away_team
      };
    }
    return {
      homeTeam: game.home_team,
      awayTeam: game.away_team
    };
  };

  const { homeTeam, awayTeam } = getTeamNames();

  // Use the new MLB odds hook
  const { gameOdds, isLoading, error } = useMLBOdds({ 
    gameId: game.id, 
    enabled: useNewMLBOdds && useDatabaseOdds 
  });

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
    const gameStartTime = new Date(getGameTime());
    const now = new Date();
    const timeDiffHours = (now.getTime() - gameStartTime.getTime()) / (1000 * 60 * 60);
    
    // Check if game has a recorded score (indicates completion)
    const hasScore = isDatabaseGame(game) && 
      game.home_score !== null && 
      game.away_score !== null;
    
    if (hasScore) {
      return { 
        status: 'final' as const, 
        label: 'FINAL',
        homeScore: (game as DatabaseGame).home_score,
        awayScore: (game as DatabaseGame).away_score
      };
    } else if (timeDiffHours >= 0 && timeDiffHours <= 4) {
      return { status: 'live' as const, label: 'LIVE' };
    } else if (timeDiffHours > 4) {
      return { status: 'final' as const, label: 'FINAL' };
    } else {
      return { status: 'scheduled' as const, label: formatGameTime(getGameTime()) };
    }
  };

  const gameStatus = getGameStatus();

  // Convert DatabaseGame to Game format for components that expect it
  const gameForComponents: Game = isDatabaseGame(game) ? {
    id: game.id,
    sport_key: game.sport || 'baseball_mlb',
    sport_title: 'MLB',
    commence_time: game.game_time,
    home_team: game.home_team,
    away_team: game.away_team,
    bookmakers: []
  } : game;

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Compact Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-medium uppercase tracking-wide px-2 py-1 bg-blue-600 text-white rounded">
            MLB
          </span>
          {useDatabaseOdds && (
            <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded">
              {useNewMLBOdds ? 'Enhanced' : 'Live'}
            </span>
          )}
          {gameStatus.status === 'live' && (
            <div className="flex items-center space-x-1 text-xs font-medium text-red-600">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
              <span>LIVE</span>
            </div>
          )}
          {gameStatus.status === 'final' && (
            <span className="text-xs font-medium text-slate-600 px-2 py-1 bg-slate-100 rounded">
              {gameStatus.label}
            </span>
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
          {/* Teams Section - Optimized Layout with Scores */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="font-semibold text-slate-900 text-sm">
                  @ {awayTeam}
                </div>
                {gameStatus.status === 'final' && gameStatus.awayScore !== null && (
                  <div className="text-lg font-bold text-slate-700">
                    {gameStatus.awayScore}
                  </div>
                )}
              </div>
              <span className="text-xs text-slate-500 font-medium">AWAY</span>
            </div>
            <div className="flex items-center justify-between py-2 px-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="font-semibold text-slate-900 text-sm">
                  {homeTeam}
                </div>
                {gameStatus.status === 'final' && gameStatus.homeScore !== null && (
                  <div className="text-lg font-bold text-blue-700">
                    {gameStatus.homeScore}
                  </div>
                )}
              </div>
              <span className="text-xs text-blue-600 font-medium">HOME</span>
            </div>
          </div>

          {/* Enhanced MLB Odds Section */}
          {useNewMLBOdds && useDatabaseOdds && (
            <div className="mt-3">
              {isLoading && (
                <div className="flex items-center justify-center py-6">
                  <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  <span className="ml-2 text-sm text-slate-600">Loading enhanced odds...</span>
                </div>
              )}
              
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-sm text-red-700">Failed to load enhanced odds: {error}</div>
                  <div className="text-xs text-red-600 mt-1">Showing standard view...</div>
                </div>
              )}
              
              {gameOdds && !isLoading && !error && (
                <MLBOddsDisplay
                  gameOdds={gameOdds}
                  homeTeam={homeTeam}
                  awayTeam={awayTeam}
                  onBetClick={onOddsClick}
                />
              )}
              
              {!gameOdds && !isLoading && !error && (
                <div className="p-4 text-center text-slate-500 bg-slate-50 rounded-lg">
                  <div className="text-sm">No enhanced odds available for this game</div>
                  <div className="text-xs mt-1">Showing standard view...</div>
                </div>
              )}
            </div>
          )}

          {/* Standard/Fallback Odds Section */}
          {(!useNewMLBOdds || !useDatabaseOdds || error || !gameOdds) && (
            <div className="mt-3">
              {/* Always show main lines */}
              <div className="mb-3">
                <DatabaseMarketContent
                  game={gameForComponents}
                  activeMainTab="main"
                  activeSubTab=""
                  onBetClick={onOddsClick}
                />
              </div>

              {/* Hierarchical Tabs for Props */}
              <div className="border-t border-gray-200 pt-3">
                <HierarchicalTabs
                  sportKey="baseball_mlb"
                  activeMainTab={activeMainTab}
                  activeSubTab={activeSubTab}
                  onMainTabChange={setActiveMainTab}
                  onSubTabChange={setActiveSubTab}
                />

                {/* Tab Content */}
                <div className="mt-3">
                  <DatabaseMarketContent
                    game={gameForComponents}
                    activeMainTab={activeMainTab}
                    activeSubTab={activeSubTab}
                    onBetClick={onOddsClick}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}