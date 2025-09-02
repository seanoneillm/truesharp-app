'use client'

import { TrendingUp, Users, Target, Building } from 'lucide-react'

export type GameCardTab = 'main' | 'player-props' | 'team-props' | 'game-props'

interface GameCardTabsProps {
  activeTab: GameCardTab
  onTabChange: (tab: GameCardTab) => void
  playerPropsCount?: number
  teamPropsCount?: number
  gamePropsCount?: number
}

export default function GameCardTabs({
  activeTab,
  onTabChange,
  playerPropsCount = 0,
  teamPropsCount = 0,
  gamePropsCount = 0,
}: GameCardTabsProps) {
  const tabs = [
    {
      id: 'main' as GameCardTab,
      label: 'Main Lines',
      icon: TrendingUp,
      count: null,
      description: 'Moneyline, Spread, Total',
    },
    {
      id: 'player-props' as GameCardTab,
      label: 'Player Props',
      icon: Users,
      count: playerPropsCount,
      description: 'Individual player markets',
    },
    {
      id: 'team-props' as GameCardTab,
      label: 'Team Props',
      icon: Building,
      count: teamPropsCount,
      description: 'Team-specific markets',
    },
    {
      id: 'game-props' as GameCardTab,
      label: 'Game Props',
      icon: Target,
      count: gamePropsCount,
      description: 'Game-wide propositions',
    },
  ]

  return (
    <div className="border-t border-slate-100 bg-gradient-to-r from-slate-50/50 to-blue-50/30">
      <div className="px-6 py-4">
        <div className="flex flex-wrap gap-2">
          {tabs.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center space-x-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'border border-slate-200/50 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                } `}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.count !== null && tab.count > 0 && (
                  <span
                    className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600'
                    } `}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Active Tab Description */}
        <div className="mt-3 border-t border-slate-100/50 pt-3">
          <div className="text-xs text-slate-500">
            {tabs.find(tab => tab.id === activeTab)?.description}
          </div>
        </div>
      </div>
    </div>
  )
}
