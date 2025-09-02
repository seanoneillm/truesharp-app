// src/components/marketplace/performance-display.tsx
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Seller } from '@/lib/types'
import { cn, formatCurrency, formatPercentage } from '@/lib/utils'
import { Activity, BarChart3, DollarSign, Target, TrendingDown, TrendingUp } from 'lucide-react'

interface PerformanceDisplayProps {
  seller: Seller
  detailed?: boolean
}

export function PerformanceDisplay({ seller, detailed = false }: PerformanceDisplayProps) {
  // Mock sport breakdown data
  const sportBreakdown = [
    { sport: 'NFL', picks: 89, winRate: 67.4, roi: 22.1, profit: 1247 },
    { sport: 'NBA', picks: 67, winRate: 61.5, roi: 15.8, profit: 892 },
    { sport: 'MLB', picks: 45, winRate: 58.2, roi: 12.3, profit: 456 },
  ]

  // Mock recent performance trends
  const recentTrends = [
    { period: 'This Week', roi: 12.5, winRate: 68.2, trend: 'up' as const },
    { period: 'Last Week', roi: 8.3, winRate: 62.1, trend: 'up' as const },
    { period: '2 Weeks Ago', roi: 15.7, winRate: 71.4, trend: 'up' as const },
    { period: '3 Weeks Ago', roi: -2.1, winRate: 48.6, trend: 'down' as const },
  ]

  const mainStats = [
    {
      name: 'Overall ROI',
      value: formatPercentage(seller.stats.roi),
      change: '+3.2%',
      changeType: 'positive' as const,
      icon: TrendingUp,
      description: 'Return on investment',
    },
    {
      name: 'Win Rate',
      value: formatPercentage(seller.stats.winRate),
      change: '+2.1%',
      changeType: 'positive' as const,
      icon: Target,
      description: 'Percentage of winning picks',
    },
    {
      name: 'Total Picks',
      value: seller.stats.totalPicks.toString(),
      change: '+23',
      changeType: 'positive' as const,
      icon: Activity,
      description: 'All verified picks',
    },
    {
      name: 'Avg Monthly Revenue',
      value: formatCurrency(seller.stats.totalRevenue / 12),
      change: '+$247',
      changeType: 'positive' as const,
      icon: DollarSign,
      description: 'Average monthly earnings',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Main Performance Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {mainStats.map(stat => (
          <Card key={stat.name} className="relative overflow-hidden p-5">
            <dt>
              <div className="absolute rounded-md bg-blue-500 p-3">
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500">{stat.name}</p>
            </dt>
            <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
              <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              <p
                className={cn(
                  'ml-2 flex items-baseline text-sm font-semibold',
                  stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                )}
              >
                {stat.changeType === 'positive' ? (
                  <TrendingUp className="h-4 w-4 flex-shrink-0 self-center" />
                ) : (
                  <TrendingDown className="h-4 w-4 flex-shrink-0 self-center" />
                )}
                <span className="ml-1">{stat.change}</span>
              </p>
              <div className="absolute inset-x-0 bottom-0 bg-gray-50 px-4 py-4 sm:px-6">
                <div className="text-sm">
                  <span className="text-gray-600">{stat.description}</span>
                </div>
              </div>
            </dd>
          </Card>
        ))}
      </div>

      {/* Performance Chart Placeholder */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Performance Over Time</h3>
          <BarChart3 className="h-5 w-5 text-gray-400" />
        </div>
        <div className="flex h-64 items-center justify-center rounded-lg bg-gray-50">
          <div className="text-center">
            <BarChart3 className="mx-auto mb-2 h-12 w-12 text-gray-400" />
            <p className="text-sm text-gray-500">Performance chart visualization</p>
            <p className="text-xs text-gray-400">ROI and win rate trends over time</p>
          </div>
        </div>
      </Card>

      {detailed && (
        <>
          {/* Sport Breakdown */}
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-medium text-gray-900">Performance by Sport</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Sport
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Picks
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Win Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      ROI
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Profit
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {sportBreakdown.map(sport => (
                    <tr key={sport.sport}>
                      <td className="whitespace-nowrap px-6 py-4">
                        <Badge variant="secondary">{sport.sport}</Badge>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {sport.picks}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {formatPercentage(sport.winRate)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-green-600">
                        {formatPercentage(sport.roi)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-green-600">
                        +{formatCurrency(sport.profit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Recent Trends */}
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-medium text-gray-900">Recent Performance Trends</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {recentTrends.map((trend, index) => (
                <div key={index} className="rounded-lg bg-gray-50 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900">{trend.period}</h4>
                    <div
                      className={cn(
                        'rounded-full p-1',
                        trend.trend === 'up' ? 'bg-green-100' : 'bg-red-100'
                      )}
                    >
                      {trend.trend === 'up' ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p
                      className={cn(
                        'text-lg font-semibold',
                        trend.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      )}
                    >
                      {formatPercentage(trend.roi)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatPercentage(trend.winRate)} win rate
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <h3 className="mb-4 text-lg font-medium text-gray-900">Bet Type Performance</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Spread Bets</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">67.2% win rate</span>
                    <span className="text-sm text-green-600">+18.4% ROI</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Totals</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">63.8% win rate</span>
                    <span className="text-sm text-green-600">+15.2% ROI</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Moneylines</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">59.1% win rate</span>
                    <span className="text-sm text-green-600">+12.7% ROI</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="mb-4 text-lg font-medium text-gray-900">Subscriber Growth</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">This Month</span>
                  <span className="text-sm font-medium text-green-600">
                    +{seller.stats.subscribers > 1000 ? '124' : '23'} subscribers
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Month</span>
                  <span className="text-sm font-medium text-green-600">
                    +{seller.stats.subscribers > 1000 ? '89' : '18'} subscribers
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Retention Rate</span>
                  <span className="text-sm font-medium">94.2%</span>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
