'use client';

import { BetSelection, Game } from '@/lib/types/games';
import EnhancedDatabaseGameCard from '../enhanced-database-game-card';
import GameCard from '../game-card';

interface NHLGameCardProps {
  game: Game;
  onOddsClick: (bet: BetSelection) => void;
  useDatabaseOdds?: boolean;
}

export default function NHLGameCard({ game, onOddsClick, useDatabaseOdds = false }: NHLGameCardProps) {
  if (useDatabaseOdds) {
    return (
      <EnhancedDatabaseGameCard
        game={game}
        league="NHL"
        onOddsClick={onOddsClick}
        useDatabaseOdds={true}
      />
    );
  }

  return (
    <GameCard
      game={game}
      league="NHL"
      onOddsClick={onOddsClick}
    />
  );
}