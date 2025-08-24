'use client'

import { Crown, Sparkles } from 'lucide-react'
import { useState } from 'react'

export function ProCTA() {
  const [isLoading, setIsLoading] = useState(false)

  // Check if user is already Pro (this would typically come from user profile data)
  // For now, we'll assume no user is Pro until we implement the subscription check
  const isProUser = false // TODO: Implement pro subscription check

  // Don't show CTA if user is already Pro
  if (isProUser) {
    return (
      <div className="px-4 py-3 mb-4">
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-4 text-white">
          <div className="flex items-center">
            <Crown className="h-5 w-5 mr-2" />
            <span className="text-sm font-semibold">TrueSharp Pro</span>
          </div>
          <p className="text-xs mt-1 text-yellow-100">
            You&apos;re a Pro member!
          </p>
        </div>
      </div>
    )
  }

  const handleUpgradeClick = async () => {
    setIsLoading(true)
    try {
      // Redirect to Stripe Checkout for Pro subscription
      const response = await fetch('/api/stripe/create-pro-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
          successUrl: `${window.location.origin}/dashboard?pro=success`,
          cancelUrl: `${window.location.origin}/dashboard?pro=cancelled`,
        }),
      })

      const { url } = await response.json()
      
      if (url) {
        window.location.href = url
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (error) {
      console.error('Error creating Pro checkout:', error)
      // You might want to show a toast notification here
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="px-4 py-3 mb-4">
      <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 rounded-xl p-4 text-white shadow-lg">
        <div className="flex items-center mb-2">
          <Sparkles className="h-5 w-5 mr-2 text-yellow-300" />
          <span className="text-sm font-semibold">Upgrade to Pro</span>
        </div>
        
        <p className="text-xs text-blue-100 mb-3 leading-relaxed">
          Unlock advanced analytics, unlimited strategies, and priority support
        </p>
        
        <div className="mb-3">
          <div className="text-lg font-bold">$20/month</div>
          <div className="text-xs text-blue-200">Cancel anytime</div>
        </div>

        <button
          onClick={handleUpgradeClick}
          disabled={isLoading}
          className="w-full bg-white text-purple-600 py-2.5 px-4 rounded-lg font-semibold text-sm hover:bg-blue-50 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
              Processing...
            </div>
          ) : (
            'Start Pro Trial'
          )}
        </button>

        <div className="mt-2 text-center">
          <span className="text-xs text-blue-200">
            7-day free trial included
          </span>
        </div>
      </div>
    </div>
  )
}
