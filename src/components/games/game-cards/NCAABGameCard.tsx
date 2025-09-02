'use client'

import { BetSelection, Game } from '@/lib/types/games'
import EnhancedDatabaseGameCard from '../enhanced-database-game-card'
import GameCard from '../game-card'

interface NCAABGameCardProps {
  game: Game
  onOddsClick: (bet: BetSelection) => void
  useDatabaseOdds?: boolean
}

export default function NCAABGameCard({
  game,
  onOddsClick,
  useDatabaseOdds = false,
}: NCAABGameCardProps) {
  if (useDatabaseOdds) {
    return (
      <EnhancedDatabaseGameCard
        game={game}
        league="NCAAB"
        onOddsClick={onOddsClick}
        useDatabaseOdds={true}
      />
    )
  }

  return <GameCard game={game} league="NCAAB" onOddsClick={onOddsClick} />
}
