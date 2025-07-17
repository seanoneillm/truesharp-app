// src/components/marketplace/seller-card.tsx
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Seller, User } from '@/lib/types'
import { cn, formatCurrency, formatPercentage } from '@/lib/utils'
import { CheckCircle, Crown, Eye, Shield, Star, TrendingUp, UserPlus, Users } from 'lucide-react'
import Link from 'next/link'

interface SellerCardProps {
  seller: Seller & { user: User }
  viewMode?: 'grid' | 'list'
}

const getTierColor = (tier: string) => {
  switch (tier) {
    case 'elite': return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'pro': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'rising': return 'bg-green-100 text-green-800 border-green-200'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

const getTierIcon = (tier: string) => {
  switch (tier) {
    case 'elite': return Crown
    case 'pro': return Shield
    case 'rising': return TrendingUp
    default: return Star
  }
}

export function SellerCard({ seller, viewMode = 'grid' }: SellerCardProps) {
  const TierIcon = getTierIcon(seller.tier)
  const minPrice = Math.min(seller.pricing.bronze, seller.pricing.silver, seller.pricing.premium)

  if (viewMode === 'list') {
    return (
      <Card className="p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1">
            <div className="h-16 w-16 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
              {seller.user.avatar}
            </div>
            <div className="ml-4 flex-1">
              <div className="flex items-center">
                <h3 className="text-lg font-medium text-gray-900">@{seller.user.username}</h3>
                {seller.user.isVerified && (
                  <CheckCircle className="h-5 w-5 text-blue-500 ml-2" />
                )}
                <Badge className={cn("ml-3", getTierColor(seller.tier))}>
                  <TierIcon className="h-3 w-3 mr-1" />
                  {seller.tier}
                </Badge>
              </div>
              <p className="text-sm text-gray-500 mt-1">{seller.user.displayName}</p>
              <p className="text-sm text-gray-600 mt-2 max-w-2xl line-clamp-2">{seller.user.bio}</p>
              <div className="flex items-center mt-3 space-x-6">
                <div className="flex items-center text-sm text-gray-500">
                  <Users className="h-4 w-4 mr-1" />
                  {seller.stats.subscribers.toLocaleString()} subscribers
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <span className="font-medium">{seller.specialization.join(', ')}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-8">
            {/* Stats */}
            <div className="text-center">
              <p className="text-lg font-semibold text-green-600">{formatPercentage(seller.stats.roi)}</p>
              <p className="text-xs text-gray-500">ROI</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900">{formatPercentage(seller.stats.winRate)}</p>
              <p className="text-xs text-gray-500">Win Rate</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900">{seller.stats.totalPicks}</p>
              <p className="text-xs text-gray-500">Picks</p>
            </div>
            {/* Pricing */}
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">{formatCurrency(minPrice)}</p>
              <p className="text-xs text-gray-500">per month</p>
            </div>
            {/* Actions */}
            <div className="flex flex-col space-y-2">
              <Link href={`/marketplace/${seller.user.username}`}>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
              </Link>
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
              {seller.user.avatar}
            </div>
            <div className="ml-3">
              <div className="flex items-center">
                <h3 className="text-lg font-medium text-gray-900">@{seller.user.username}</h3>
                {seller.user.isVerified && (
                  <CheckCircle className="h-5 w-5 text-blue-500 ml-2" />
                )}
              </div>
              <p className="text-sm text-gray-500">{seller.user.displayName}</p>
            </div>
          </div>
          <Badge className={cn(getTierColor(seller.tier))}>
            <TierIcon className="h-3 w-3 mr-1" />
            {seller.tier}
          </Badge>
        </div>

        {/* Performance Stats */}
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-lg font-semibold text-green-600">{formatPercentage(seller.stats.roi)}</p>
            <p className="text-xs text-gray-500">ROI</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">{formatPercentage(seller.stats.winRate)}</p>
            <p className="text-xs text-gray-500">Win Rate</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">{seller.stats.totalPicks}</p>
            <p className="text-xs text-gray-500">Total Picks</p>
          </div>
        </div>

        {/* Specialization */}
        <div className="mt-4">
          <div className="flex flex-wrap gap-2">
            {seller.specialization.map((sport) => (
              <Badge key={sport} variant="secondary">
                {sport}
              </Badge>
            ))}
          </div>
        </div>

        {/* Rating */}
        <div className="mt-3">
          <div className="flex items-center">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-4 w-4",
                    i < Math.floor(seller.stats.rating)
                      ? "text-yellow-400 fill-current"
                      : "text-gray-300"
                  )}
                />
              ))}
            </div>
            <span className="ml-2 text-sm text-gray-600">{seller.stats.rating}</span>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="px-6 pb-4">
        <p className="text-sm text-gray-600 line-clamp-2">
          {seller.user.bio}
        </p>
      </div>

      {/* Verification Badges */}
      <div className="px-6 pb-4">
        <div className="flex flex-wrap gap-2">
          {seller.verificationBadges.slice(0, 2).map((badge) => (
            <Badge key={badge} variant="outline" className="text-xs">
              {badge}
            </Badge>
          ))}
          {seller.verificationBadges.length > 2 && (
            <span className="text-xs text-gray-500">+{seller.verificationBadges.length - 2} more</span>
          )}
        </div>
      </div>

      {/* Pricing */}
      <div className="px-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Starting at</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(minPrice)}/month</p>
          </div>
          <div className="text-right">
            <div className="flex items-center text-sm text-gray-500">
              <Users className="h-4 w-4 mr-1" />
              {seller.stats.subscribers.toLocaleString()} subscribers
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 pb-6 border-t border-gray-100 pt-4">
        <div className="flex space-x-3">
          <Link href={`/marketplace/${seller.user.username}`} className="flex-1">
            <Button variant="outline" className="w-full">
              <Eye className="h-4 w-4 mr-2" />
              View Profile
            </Button>
          </Link>
          <Button className="flex-1">
            <UserPlus className="h-4 w-4 mr-2" />
            Subscribe
          </Button>
        </div>
      </div>
    </Card>
  )
}
