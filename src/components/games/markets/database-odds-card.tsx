'use client';

import { BetSelection, Game } from '@/lib/types/games';
import { DatabaseOdds } from '@/lib/types/database';

interface DatabaseOddsCardProps {
  odd: DatabaseOdds;
  game: Game;
  onBetClick: (bet: BetSelection) => void;
}

export default function DatabaseOddsCard({ odd, game, onBetClick }: DatabaseOddsCardProps) {
  const formatOdds = (odds: number | null): string => {
    if (!odds) return '--';
    return odds > 0 ? `+${odds}` : `${odds}`;
  };

  const getSelectionName = (): string => {
    const marketName = odd.marketname.toLowerCase();
    
    if (marketName.includes('moneyline') || marketName.includes('h2h')) {
      if (odd.sideid === 'home') return game.home_team;
      if (odd.sideid === 'away') return game.away_team;
    } else if (marketName.includes('spread') || marketName.includes('run line')) {
      if (odd.sideid === 'home') {
        return `${game.home_team} ${odd.closebookodds ? (odd.closebookodds > 0 ? '+' : '') + odd.closebookodds : ''}`;
      }
      if (odd.sideid === 'away') {
        return `${game.away_team} ${odd.closebookodds ? (odd.closebookodds > 0 ? '+' : '') + odd.closebookodds : ''}`;
      }
    } else if (marketName.includes('total') || marketName.includes('over/under')) {
      if (odd.sideid === 'over') {
        return `Over ${odd.closebookodds || '--'}`;
      }
      if (odd.sideid === 'under') {
        return `Under ${odd.closebookodds || '--'}`;
      }
    }
    
    // For props and other markets, use the market name
    return odd.marketname;
  };

  const getMarketType = (): 'moneyline' | 'spread' | 'total' | 'prop' => {
    const marketName = odd.marketname.toLowerCase();
    if (marketName.includes('moneyline') || marketName.includes('h2h')) return 'moneyline';
    if (marketName.includes('spread') || marketName.includes('run line')) return 'spread';
    if (marketName.includes('total') || marketName.includes('over/under')) return 'total';
    return 'prop';
  };

  const handleClick = () => {
    const betSelection: BetSelection = {
      gameId: game.id,
      sport: game.sport_key,
      homeTeam: game.home_team,
      awayTeam: game.away_team,
      gameTime: game.commence_time,
      marketType: getMarketType(),
      selection: getSelectionName(),
      line: odd.closebookodds || undefined,
      odds: odd.bookodds || 0,
      sportsbook: odd.sportsbook,
      description: `${odd.marketname} - ${getSelectionName()}`
    };
    
    onBetClick(betSelection);
  };

  const getOddsColor = () => {
    if (!odd.bookodds) return 'text-slate-400';
    if (odd.bookodds > 0) return 'text-green-700';
    return 'text-red-700';
  };

  const getOddsBackgroundColor = () => {
    if (!odd.bookodds) return 'bg-slate-50 border-slate-200';
    if (odd.bookodds > 0) return 'bg-green-50 border-green-200 hover:bg-green-100';
    return 'bg-red-50 border-red-200 hover:bg-red-100';
  };

  return (
    <div className="flex items-center justify-between p-2 bg-slate-50/50 rounded border border-slate-100">
      <div className="flex-1 min-w-0">
        <div className="text-xs text-slate-600 truncate">
          {getSelectionName()}
        </div>
        <div className="text-xs text-slate-400 truncate">
          {odd.sportsbook}
        </div>
      </div>
      
      <button
        onClick={handleClick}
        disabled={!odd.bookodds}
        className={`px-2 py-1 text-xs font-medium border rounded transition-colors ${getOddsBackgroundColor()} ${getOddsColor()}`}
      >
        {formatOdds(odd.bookodds)}
      </button>
    </div>
  );
}