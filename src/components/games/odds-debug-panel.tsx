'use client';

import { DatabaseGame, DatabaseOdds } from '@/lib/types/database';
import { AlertCircle, Database, TrendingUp } from 'lucide-react';
import { useState } from 'react';

interface OddsDebugPanelProps {
  game: DatabaseGame;
  odds: DatabaseOdds[];
}

export default function OddsDebugPanel({ game, odds }: OddsDebugPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasOdds = odds.length > 0;
  const uniqueSportsbooks = [...new Set(odds.map(odd => odd.sportsbook))];
  const uniqueMarkets = [...new Set(odds.map(odd => odd.marketname))];
  
  // Analyze odds structure
  const mainLineMarkets = odds.filter(odd => 
    ['moneyline', 'spread', 'total', 'run_line', 'h2h', 'totals', 'spreads'].includes(odd.marketname?.toLowerCase() || '')
  );
  
  const playerPropsMarkets = odds.filter(odd => 
    odd.marketname && (
      odd.marketname.includes('_') || 
      ['hits', 'rbi', 'runs', 'strikeouts', 'home_runs'].some(term => odd.marketname.toLowerCase().includes(term))
    )
  );

  // Get game status
  const gameTime = new Date(game.game_time);
  const now = new Date();
  const hoursSinceGame = (now.getTime() - gameTime.getTime()) / (1000 * 60 * 60);
  
  const gameStatus = game.home_score !== null && game.away_score !== null 
    ? 'completed' 
    : hoursSinceGame > 0 && hoursSinceGame <= 4 
    ? 'live' 
    : hoursSinceGame > 4 
    ? 'likely_completed' 
    : 'scheduled';

  return (
    <div className="bg-white border border-slate-200 rounded-lg">
      {/* Summary Header */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center space-x-2">
          {hasOdds ? (
            <div className="flex items-center space-x-1 text-green-600">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">{odds.length} odds available</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 text-amber-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">No odds available</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <span className="capitalize">{gameStatus.replace('_', ' ')}</span>
          <span>{isExpanded ? '−' : '+'}</span>
        </div>
      </div>

      {/* Detailed Debug Info */}
      {isExpanded && (
        <div className="border-t border-slate-100 p-3 space-y-3">
          {/* Game Info */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="font-medium text-slate-700 mb-1">Game Details</div>
              <div className="space-y-1 text-slate-600">
                <div>ID: {game.id}</div>
                <div>Status: {game.status}</div>
                <div>Time: {new Date(game.game_time).toLocaleString()}</div>
                {game.home_score !== null && (
                  <div>Score: {game.away_team_name} {game.away_score} - {game.home_score} {game.home_team_name}</div>
                )}
              </div>
            </div>
            
            <div>
              <div className="font-medium text-slate-700 mb-1">Odds Summary</div>
              <div className="space-y-1 text-slate-600">
                <div>Total Odds: {odds.length}</div>
                <div>Sportsbooks: {uniqueSportsbooks.length}</div>
                <div>Markets: {uniqueMarkets.length}</div>
                <div>Main Lines: {mainLineMarkets.length}</div>
                <div>Player Props: {playerPropsMarkets.length}</div>
              </div>
            </div>
          </div>

          {/* Odds Analysis */}
          {!hasOdds ? (
            <div className="bg-amber-50 border border-amber-200 rounded p-3">
              <div className="font-medium text-amber-800 mb-2">Possible Reasons for Missing Odds:</div>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• Game may not be covered by sportsbooks yet</li>
                <li>• Odds may have been removed after game completion</li>
                <li>• API fetch may have failed for this specific game</li>
                <li>• Game might be too far in the future</li>
                <li>• Sportsbooks may have suspended betting</li>
              </ul>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="font-medium text-slate-700 text-sm">Available Markets:</div>
              <div className="flex flex-wrap gap-1">
                {uniqueMarkets.slice(0, 10).map(market => (
                  <span key={market} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {market}
                  </span>
                ))}
                {uniqueMarkets.length > 10 && (
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                    +{uniqueMarkets.length - 10} more
                  </span>
                )}
              </div>
              
              <div className="font-medium text-slate-700 text-sm">Available Sportsbooks:</div>
              <div className="flex flex-wrap gap-1">
                {uniqueSportsbooks.map(sportsbook => (
                  <span key={sportsbook} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    {sportsbook}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Raw Data Link */}
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                console.log('🎯 Game Debug Data:', {
                  game,
                  odds,
                  analysis: {
                    gameStatus,
                    uniqueSportsbooks,
                    uniqueMarkets,
                    mainLineMarkets: mainLineMarkets.length,
                    playerPropsMarkets: playerPropsMarkets.length
                  }
                });
              }}
              className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-700"
            >
              <Database className="w-3 h-3" />
              <span>Log debug data to console</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
