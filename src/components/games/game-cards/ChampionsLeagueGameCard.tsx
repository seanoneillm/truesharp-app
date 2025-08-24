'use client';

import { BetSelection, Game } from '@/lib/types/games';
import EnhancedDatabaseGameCard from '../enhanced-database-game-card';
import GameCard from '../game-card';

interface ChampionsLeagueGameCardProps {
  game: Game;
  onOddsClick: (bet: BetSelection) => void;
  useDatabaseOdds?: boolean;
}

export default function ChampionsLeagueGameCard({ game, onOddsClick, useDatabaseOdds = false }: ChampionsLeagueGameCardProps) {
  if (useDatabaseOdds) {
    return (
      <EnhancedDatabaseGameCard
        game={game}
        league="Champions League"
        onOddsClick={onOddsClick}
        useDatabaseOdds={true}
      />
    );
  }

  return (
    <GameCard
      game={game}
      league="Champions League"
      onOddsClick={onOddsClick}
    />
  );
}