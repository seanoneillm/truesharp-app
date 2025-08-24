// src/components/marketplace/featured-sellers.tsx
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Seller, User } from '@/lib/types'
import { cn, formatCurrency, formatPercentage } from '@/lib/utils'
import { CheckCircle, Crown, Star, TrendingUp, Users } from 'lucide-react'
import Link from 'next/link'

interface FeaturedSellersProps {
  sellers: (Seller & { user: User })[]
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
    case 'pro': return Star
    case 'rising': return TrendingUp
    default: return Star
  }
}

export function FeaturedSellers({ sellers }: FeaturedSellersProps) {
  if (sellers.length === 0) return null

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Featured Sellers</h2>
          <p className="text-gray-600">Top performing verified sellers</p>
        </div>
        <Link href="/marketplace?featured=true">
          <Button variant="outline">View All Featured</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {sellers.map((seller, index) => {
          const TierIcon = getTierIcon(seller.tier)
          const minPrice = Math.min(seller.pricing.bronze, seller.pricing.silver, seller.pricing.premium)
          
          return (
            <Card 
              key={seller.userId} 
              className={cn(
                "relative overflow-hidden hover:shadow-lg transition-shadow",
                index === 0 && "ring-2 ring-yellow-400 ring-opacity-50"
              )}
            >
              {/* Featured Badge */}
              {index === 0 && (
                <div className="absolute top-4 right-4 z-10">
                  <Badge className="bg-yellow-400 text-yellow-900 font-medium">
                    <Crown className="h-3 w-3 mr-1" />
                    #1 Seller
                  </Badge>
                </div>
              )}

              {/* Background Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 opacity-50" />
              
              <div className="relative p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="h-14 w-14 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
                      {seller.user.avatar}
                    </div>
                    <div className="ml-3">
                      <div className="flex items-center">
                        <h3 className="text-lg font-bold text-gray-900">@{seller.user.username}</h3>
                        {seller.user.isVerified && (
                          <CheckCircle className="h-5 w-5 text-blue-500 ml-2" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{seller.user.displayName}</p>
                    </div>
                  </div>
                  <Badge className={cn(getTierColor(seller.tier))}>
                    <TierIcon className="h-3 w-3 mr-1" />
                    {seller.tier}
                  </Badge>
                </div>

                {/* Key Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-white bg-opacity-60 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{formatPercentage(seller.stats.roi)}</p>
                    <p className="text-xs text-gray-600">ROI</p>
                  </div>
                  <div className="text-center p-3 bg-white bg-opacity-60 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{formatPercentage(seller.stats.winRate)}</p>
                    <p className="text-xs text-gray-600">Win Rate</p>
                  </div>
                </div>

                {/* Specialization */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {seller.specialization.map((sport) => (
                      <Badge key={sport} variant="secondary" className="bg-white bg-opacity-80">
                        {sport}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="flex justify-between items-center mb-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {seller.stats.subscribers.toLocaleString()}
                  </div>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 mr-1 text-yellow-400 fill-current" />
                    {seller.stats.rating}
                  </div>
                  <div>
                    {seller.stats.totalPicks} picks
                  </div>
                </div>

                {/* Pricing */}
                <div className="mb-4">
                  <p className="text-sm text-gray-600">Starting at</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(minPrice)}/month</p>
                </div>

                {/* CTA */}
                <div className="flex space-x-2">
                  <Link href={`/marketplace/${seller.user.username}`} passHref legacyBehavior>
                    <a className="w-full flex-1 inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none">
                      View Profile
                    </a>
                  </Link>
                  <Button className="flex-1">
                    Subscribe
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
