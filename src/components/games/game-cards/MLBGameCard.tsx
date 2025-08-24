'use client';

import { BetSelection, Game } from '@/lib/types/games';
import EnhancedMLBGameCard from '../enhanced-mlb-game-card';
import EnhancedDatabaseGameCard from '../enhanced-database-game-card';
import GameCard from '../game-card';

interface MLBGameCardProps {
  game: Game;
  onOddsClick: (bet: BetSelection) => void;
  useDatabaseOdds?: boolean;
  useEnhancedMLBOdds?: boolean;
}

export default function MLBGameCard({ 
  game, 
  onOddsClick, 
  useDatabaseOdds = false,
  useEnhancedMLBOdds = false
}: MLBGameCardProps) {
  if (useDatabaseOdds) {
    if (useEnhancedMLBOdds) {
      return (
        <EnhancedMLBGameCard
          game={game}
          onOddsClick={onOddsClick}
          useDatabaseOdds={true}
          useNewMLBOdds={true}
        />
      );
    }
    
    return (
      <EnhancedDatabaseGameCard
        game={game}
        league="MLB"
        onOddsClick={onOddsClick}
        useDatabaseOdds={true}
      />
    );
  }

  return (
    <GameCard
      game={game}
      league="MLB"
      onOddsClick={onOddsClick}
    />
  );
}