// src/components/marketplace/seller-profile.tsx
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Seller, User } from '@/lib/types'
import { cn, formatCurrency, formatPercentage } from '@/lib/utils'
import { Activity, DollarSign, Star, Target, TrendingUp, Trophy } from 'lucide-react'

interface SellerProfileProps {
  seller: Seller & { user: User }
}

export function SellerProfile({ seller }: SellerProfileProps) {
  const stats = [
    {
      name: 'Total ROI',
      value: formatPercentage(seller.stats.roi),
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      name: 'Win Rate',
      value: formatPercentage(seller.stats.winRate),
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      name: 'Total Picks',
      value: seller.stats.totalPicks.toString(),
      icon: Activity,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      name: 'Rating',
      value: seller.stats.rating.toFixed(1),
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      name: 'Subscribers',
      value: seller.stats.subscribers.toLocaleString(),
      icon: Trophy,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      name: 'Total Revenue',
      value: formatCurrency(seller.stats.totalRevenue),
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Performance Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map(stat => (
          <Card key={stat.name} className="p-6">
            <div className="flex items-center">
              <div className={cn('rounded-md p-3', stat.bgColor)}>
                <stat.icon className={cn('h-6 w-6', stat.color)} />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500">{stat.name}</dt>
                  <dd className="text-lg font-medium text-gray-900">{stat.value}</dd>
                </dl>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* About Section */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-medium text-gray-900">About</h3>
        <div className="space-y-4">
          <div>
            <h4 className="mb-2 text-sm font-medium text-gray-700">Bio</h4>
            <p className="text-gray-600">{seller.user.bio}</p>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-medium text-gray-700">Specialization</h4>
            <div className="flex flex-wrap gap-2">
              {seller.specialization.map(sport => (
                <Badge key={sport} variant="secondary">
                  {sport}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-medium text-gray-700">Verification Badges</h4>
            <div className="flex flex-wrap gap-2">
              {seller.verificationBadges.map(badge => (
                <Badge key={badge} variant="outline" className="text-xs">
                  {badge}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Recent Activity */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-medium text-gray-900">Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center text-sm">
            <div className="mr-3 h-2 w-2 rounded-full bg-green-400"></div>
            <span className="text-gray-600">Posted 3 new picks in the last 24 hours</span>
          </div>
          <div className="flex items-center text-sm">
            <div className="mr-3 h-2 w-2 rounded-full bg-blue-400"></div>
            <span className="text-gray-600">Gained 12 new subscribers this week</span>
          </div>
          <div className="flex items-center text-sm">
            <div className="mr-3 h-2 w-2 rounded-full bg-purple-400"></div>
            <span className="text-gray-600">Achieved 5-game winning streak</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
