'use client';

import { BetSelection, Game } from '@/lib/types/games';
import EnhancedDatabaseGameCard from '../enhanced-database-game-card';
import GameCard from '../game-card';

interface NCAAFGameCardProps {
  game: Game;
  onOddsClick: (bet: BetSelection) => void;
  useDatabaseOdds?: boolean;
}

export default function NCAAFGameCard({ game, onOddsClick, useDatabaseOdds = false }: NCAAFGameCardProps) {
  if (useDatabaseOdds) {
    return (
      <EnhancedDatabaseGameCard
        game={game}
        league="NCAAF"
        onOddsClick={onOddsClick}
        useDatabaseOdds={true}
      />
    );
  }

  return (
    <GameCard
      game={game}
      league="NCAAF"
      onOddsClick={onOddsClick}
    />
  );
}