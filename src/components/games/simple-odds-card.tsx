import React from 'react'
import { Game } from '@/lib/types/games'

interface SimpleOddsCardProps {
  game: Game
}

const SimpleOddsCard: React.FC<SimpleOddsCardProps> = ({ game }) => {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-center">
        <span className="font-medium">{game.away_team}</span>
        <span>@</span>
        <span className="font-medium">{game.home_team}</span>
      </div>
    </div>
  )
}

export default SimpleOddsCard