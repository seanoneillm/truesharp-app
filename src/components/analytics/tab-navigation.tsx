'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BarChart3, History, TrendingUp, Target } from 'lucide-react'

export type AnalyticsTab = 'overview' | 'bets' | 'analytics' | 'strategies'

interface TabNavigationProps {
  activeTab: AnalyticsTab
  onTabChange: (tab: AnalyticsTab) => void
  betCount?: number
  strategyCount?: number
}

const tabs = [
  {
    id: 'overview' as AnalyticsTab,
    label: 'Overview',
    icon: BarChart3,
    description: 'Recent bets and profit overview',
  },
  {
    id: 'bets' as AnalyticsTab,
    label: 'Bets',
    icon: History,
    description: 'Complete betting history',
  },
  {
    id: 'analytics' as AnalyticsTab,
    label: 'Analytics',
    icon: TrendingUp,
    description: 'Advanced charts and custom analytics',
  },
  {
    id: 'strategies' as AnalyticsTab,
    label: 'Strategies',
    icon: Target,
    description: 'Create and manage strategies',
  },
]

export function TabNavigation({
  activeTab,
  onTabChange,
  betCount = 0,
  strategyCount = 0,
}: TabNavigationProps) {
  return (
    <Card className="mb-6">
      <CardContent className="p-0">
        <div className="flex border-b">
          {tabs.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            // Get count for badge display
            let badgeCount = undefined
            if (tab.id === 'bets' && betCount > 0) badgeCount = betCount
            if (tab.id === 'strategies' && strategyCount > 0) badgeCount = strategyCount

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`relative flex-1 p-4 text-left transition-colors ${
                  isActive ? 'border-b-2 border-blue-600 bg-blue-50' : 'hover:bg-gray-50'
                } `}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`rounded-lg p-2 ${
                      isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                    } `}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <h3
                        className={`font-medium ${isActive ? 'text-blue-900' : 'text-gray-900'} `}
                      >
                        {tab.label}
                      </h3>

                      {badgeCount !== undefined && (
                        <span
                          className={`rounded-full px-2 py-1 text-xs ${
                            isActive ? 'bg-blue-200 text-blue-700' : 'bg-gray-200 text-gray-600'
                          } `}
                        >
                          {badgeCount.toLocaleString()}
                        </span>
                      )}
                    </div>

                    <p className={`mt-1 text-sm ${isActive ? 'text-blue-700' : 'text-gray-600'} `}>
                      {tab.description}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
