'use client'

import { BetSelection, Game } from '@/lib/types/games'
import EnhancedDatabaseGameCard from '../enhanced-database-game-card'
import GameCard from '../game-card'

interface NBAGameCardProps {
  game: Game
  onOddsClick: (bet: BetSelection) => void
  useDatabaseOdds?: boolean
}

export default function NBAGameCard({
  game,
  onOddsClick,
  useDatabaseOdds = false,
}: NBAGameCardProps) {
  if (useDatabaseOdds) {
    return (
      <EnhancedDatabaseGameCard
        game={game}
        league="NBA"
        onOddsClick={onOddsClick}
        useDatabaseOdds={true}
      />
    )
  }

  return <GameCard game={game} league="NBA" onOddsClick={onOddsClick} />
}
