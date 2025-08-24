'use client';

import { BetSelection, Game } from '@/lib/types/games';
import EnhancedDatabaseGameCard from '../enhanced-database-game-card';
import GameCard from '../game-card';

interface NFLGameCardProps {
  game: Game;
  onOddsClick: (bet: BetSelection) => void;
  useDatabaseOdds?: boolean;
}

export default function NFLGameCard({ game, onOddsClick, useDatabaseOdds = false }: NFLGameCardProps) {
  if (useDatabaseOdds) {
    return (
      <EnhancedDatabaseGameCard
        game={game}
        league="NFL"
        onOddsClick={onOddsClick}
        useDatabaseOdds={true}
      />
    );
  }

  return (
    <GameCard
      game={game}
      league="NFL"
      onOddsClick={onOddsClick}
    />
  );
}