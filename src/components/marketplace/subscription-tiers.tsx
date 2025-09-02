// src/components/marketplace/subscription-tiers.tsx
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Seller } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'
import { Award, CheckCircle, Crown, Star } from 'lucide-react'

interface SubscriptionTiersProps {
  seller: Seller
}

export function SubscriptionTiers({ seller }: SubscriptionTiersProps) {
  const tiers = [
    {
      name: 'Bronze',
      price: seller.pricing.bronze,
      icon: Award,
      color: 'from-amber-400 to-amber-600',
      features: [
        'Basic picks and analysis',
        'Weekly performance reports',
        'Community access',
        'Email notifications',
      ],
      popular: false,
    },
    {
      name: 'Silver',
      price: seller.pricing.silver,
      icon: Star,
      color: 'from-gray-400 to-gray-600',
      features: [
        'All Bronze features',
        'Detailed pick analysis',
        'Early access to picks',
        'SMS notifications',
        'Monthly strategy calls',
      ],
      popular: true,
    },
    {
      name: 'Premium',
      price: seller.pricing.premium,
      icon: Crown,
      color: 'from-purple-400 to-purple-600',
      features: [
        'All Silver features',
        'Personal pick recommendations',
        'Direct message access',
        'Custom analysis requests',
        'Priority support',
        'Exclusive content',
      ],
      popular: false,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Choose Your Subscription</h2>
        <p className="mt-2 text-gray-600">
          Get access to verified picks and analysis from @{seller.userId}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {tiers.map(tier => (
          <Card
            key={tier.name}
            className={`relative p-6 ${tier.popular ? 'ring-2 ring-blue-500' : ''}`}
          >
            {tier.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 transform">
                <Badge className="bg-blue-500 px-3 py-1 font-medium text-white">Most Popular</Badge>
              </div>
            )}

            <div className="text-center">
              {/* Icon */}
              <div
                className={`mx-auto h-16 w-16 rounded-full bg-gradient-to-r ${tier.color} mb-4 flex items-center justify-center`}
              >
                <tier.icon className="h-8 w-8 text-white" />
              </div>

              {/* Tier Name */}
              <h3 className="text-xl font-bold text-gray-900">{tier.name}</h3>

              {/* Price */}
              <div className="mt-4">
                <span className="text-4xl font-bold text-gray-900">
                  {formatCurrency(tier.price)}
                </span>
                <span className="text-gray-500">/month</span>
              </div>

              {/* Features */}
              <ul className="mt-6 space-y-3">
                {tier.features.map(feature => (
                  <li key={feature} className="flex items-center text-sm">
                    <CheckCircle className="mr-2 h-4 w-4 flex-shrink-0 text-green-500" />
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Button
                className={`mt-8 w-full ${
                  tier.popular ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-900 hover:bg-gray-800'
                }`}
              >
                Subscribe to {tier.name}
              </Button>

              {/* Trial Info */}
              <p className="mt-3 text-xs text-gray-500">7-day free trial • Cancel anytime</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Additional Info */}
      <Card className="bg-gray-50 p-6">
        <div className="text-center">
          <h3 className="mb-2 text-lg font-medium text-gray-900">
            What makes this seller special?
          </h3>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="flex items-center justify-center">
              <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
              <span className="text-sm text-gray-600">100% Verified Performance</span>
            </div>
            <div className="flex items-center justify-center">
              <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
              <span className="text-sm text-gray-600">
                {seller.stats.totalPicks}+ Tracked Picks
              </span>
            </div>
            <div className="flex items-center justify-center">
              <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
              <span className="text-sm text-gray-600">
                {/* You can add a stat or description here if needed */}
              </span>
            </div>
            <div className="flex items-center justify-center">
              <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
              <span className="text-sm text-gray-600">{seller.stats.rating}/5 Star Rating</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Money Back Guarantee */}
      <div className="text-center">
        <div className="inline-flex items-center rounded-lg border border-green-200 bg-green-50 px-4 py-2">
          <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
          <span className="text-sm font-medium text-green-800">30-day money-back guarantee</span>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Not satisfied? Get a full refund within 30 days, no questions asked.
        </p>
      </div>
    </div>
  )
}
