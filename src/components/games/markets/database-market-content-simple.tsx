'use client'

import { BetSelection, Game } from '@/lib/types/games'
import { MainTabType } from '../tabs/hierarchical-tabs'

interface DatabaseMarketContentProps {
  game: Game
  activeMainTab: MainTabType
  activeSubTab?: string
  activeSubSubTab?: string
  onBetClick: (bet: BetSelection) => void
}

function DatabaseMarketContent({
  game,
  activeMainTab,
  activeSubTab,
  activeSubSubTab,
  onBetClick,
}: DatabaseMarketContentProps) {
  return (
    <div className="space-y-4">
      <div className="text-sm text-slate-600">
        Debug: activeMainTab={activeMainTab}, activeSubTab={activeSubTab}, activeSubSubTab=
        {activeSubSubTab}
      </div>
      <div className="text-sm text-slate-600">
        Game: {game.home_team} vs {game.away_team}
      </div>
      <div className="rounded-lg bg-slate-50 p-4 text-center">
        <div className="text-lg font-medium">DatabaseMarketContent Component Working</div>
        <div className="mt-1 text-sm">
          Simple test version to verify React component is properly exported
        </div>
      </div>
    </div>
  )
}

export default DatabaseMarketContent
