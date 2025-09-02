// src/components/dashboard/stats-grid.tsx
import StatsCard from './stats-card'
import { Target, Trophy, TrendingUp, DollarSign } from 'lucide-react'

const defaultStats = [
  {
    name: 'Total Bets',
    value: '247',
    change: '+12',
    changeType: 'positive' as const,
    icon: Target,
    period: 'last 30 days',
  },
  {
    name: 'Win Rate',
    value: '64.2%',
    change: '+2.1%',
    changeType: 'positive' as const,
    icon: Trophy,
    period: 'last 30 days',
  },
  {
    name: 'ROI',
    value: '+18.5%',
    change: '+3.2%',
    changeType: 'positive' as const,
    icon: TrendingUp,
    period: 'last 30 days',
  },
  {
    name: 'Monthly P&L',
    value: '+$2,847',
    change: '+$521',
    changeType: 'positive' as const,
    icon: DollarSign,
    period: 'this month',
  },
]

interface StatsGridProps {
  stats?: typeof defaultStats
  title?: string
}

export default function StatsGrid({
  stats = defaultStats,
  title = 'Performance Overview',
}: StatsGridProps) {
  return (
    <div className="mb-8">
      <h2 className="mb-4 text-lg font-medium text-gray-900">{title}</h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(stat => (
          <StatsCard key={stat.name} {...stat} />
        ))}
      </div>
    </div>
  )
}
