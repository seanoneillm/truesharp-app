'use client';

import { BetSelection, Game } from '@/lib/types/games';
import EnhancedDatabaseGameCard from '../enhanced-database-game-card';
import GameCard from '../game-card';

interface MLSGameCardProps {
  game: Game;
  onOddsClick: (bet: BetSelection) => void;
  useDatabaseOdds?: boolean;
}

export default function MLSGameCard({ game, onOddsClick, useDatabaseOdds = false }: MLSGameCardProps) {
  if (useDatabaseOdds) {
    return (
      <EnhancedDatabaseGameCard
        game={game}
        league="MLS"
        onOddsClick={onOddsClick}
        useDatabaseOdds={true}
      />
    );
  }

  return (
    <GameCard
      game={game}
      league="MLS"
      onOddsClick={onOddsClick}
    />
  );
}