'use client'

import { ArrowRight, Check, Crown } from 'lucide-react'
import Link from 'next/link'

export default function ProPrompt() {
  const proFeatures = [
    'Advanced analytics and insights',
    'Unlimited strategy tracking', 
    'Priority customer support',
    'Early access to new features',
    'Line movement tracking',
    'Custom dashboard views'
  ]

  return (
    <div className="bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 border border-yellow-200 shadow-xl rounded-xl p-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-200/20 to-amber-200/20 rounded-full -mr-16 -mt-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-amber-200/15 to-yellow-200/15 rounded-full -ml-12 -mb-12"></div>
      
      <div className="relative">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            
            {/* Left side - Main content */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-yellow-200 rounded-xl">
                  <Crown className="h-8 w-8 text-yellow-700" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Upgrade to TrueSharp Pro</h2>
                  <p className="text-lg text-yellow-700">Unlock premium betting analytics</p>
                </div>
              </div>

              <p className="text-gray-600 mb-6 text-lg">
                Take your betting strategy to the next level with advanced analytics, 
                unlimited tracking, and exclusive features designed for serious bettors.
              </p>

              {/* Features Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {proFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right side - Pricing and CTA */}
            <div className="text-center lg:text-right">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-yellow-200 mb-6">
                <div className="mb-4">
                  <div className="text-5xl font-bold text-yellow-600 mb-2">$20</div>
                  <div className="text-lg text-gray-600">/month</div>
                  <div className="text-sm text-yellow-600 font-medium">Limited time offer</div>
                </div>
                
                <div className="space-y-3">
                  <Link
                    href="/subscriptions/pro"
                    className="w-full inline-flex justify-center items-center px-6 py-4 border border-transparent text-lg font-semibold rounded-xl text-white bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Crown className="h-5 w-5 mr-2" />
                    Upgrade to Pro
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Link>
                  
                  <Link
                    href="/pro"
                    className="w-full inline-flex justify-center items-center px-6 py-3 border border-yellow-300 text-sm font-medium rounded-xl text-yellow-700 bg-yellow-50 hover:bg-yellow-100 transition-colors"
                  >
                    Learn More About Pro Features
                  </Link>
                </div>
              </div>

              {/* Trust Badge */}
              <div className="text-center">
                <p className="text-sm text-gray-500">
                  Join 500+ pro bettors already using advanced analytics
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
