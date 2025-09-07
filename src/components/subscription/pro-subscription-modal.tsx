'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/lib/hooks/use-auth'
import { useProfile } from '@/lib/hooks/use-profile'
import { useProSubscription } from '@/lib/hooks/use-pro-subscription'
import { Check, Crown, X } from 'lucide-react'
import { useState } from 'react'

interface ProSubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function ProSubscriptionModal({ isOpen, onClose, onSuccess }: ProSubscriptionModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly')
  const { user } = useAuth()
  const { } = useProfile()
  const { subscribeToPro, isLoading, error } = useProSubscription()

  if (!isOpen) return null

  const handleSubscribe = async () => {
    if (!user) {
      return
    }

    const result = await subscribeToPro({ plan: selectedPlan })
    
    if (result.success) {
      // The hook will redirect to Stripe Checkout
      // When the user returns, the webhook will have updated their profile
      onSuccess?.()
      onClose()
    }
  }

  const plans = {
    monthly: {
      price: '$20',
      period: 'month',
      savings: null,
    },
    yearly: {
      price: '$200',
      period: 'year',
      savings: 'Save $40/year',
    },
  }

  const proFeatures = [
    'Advanced analytics',
    'Custom analytics chart creation',
    'CLV analysis',
    'Line movement analysis on all bets',
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <Card className="relative w-full max-w-lg p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 transition-colors hover:bg-gray-100"
          disabled={isLoading}
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>

        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 p-4">
            <Crown className="h-8 w-8 text-white" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900">Upgrade to TrueSharp Pro</h2>
          <p className="text-gray-600">Unlock the full potential of your betting analytics</p>
        </div>

        {/* Plan Selection */}
        <div className="mb-6">
          <div className="grid grid-cols-2 gap-3 mb-4">
            {Object.entries(plans).map(([planKey, planData]) => (
              <button
                key={planKey}
                onClick={() => setSelectedPlan(planKey as 'monthly' | 'yearly')}
                className={`relative p-4 rounded-xl border-2 transition-all ${
                  selectedPlan === planKey
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500 ring-opacity-20'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">
                    {planData.price}/{planData.period}
                  </div>
                  {planData.savings && (
                    <div className="text-xs font-medium text-green-600 mt-1">
                      {planData.savings}
                    </div>
                  )}
                </div>
                {selectedPlan === planKey && (
                  <div className="absolute top-2 right-2">
                    <Check className="h-4 w-4 text-blue-500" />
                  </div>
                )}
              </button>
            ))}
          </div>
          
          <div className="text-center text-sm text-gray-600 mb-4">
            Cancel anytime • Secure payment with Stripe
          </div>
        </div>

        {/* Features */}
        <div className="mb-6">
          <h3 className="mb-3 font-semibold text-gray-900">What&apos;s included:</h3>
          <div className="grid grid-cols-1 gap-2">
            {proFeatures.map((feature, index) => (
              <div key={index} className="flex items-center text-sm text-gray-700">
                <Check className="mr-3 h-4 w-4 flex-shrink-0 text-green-500" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <Button variant="outline" onClick={onClose} disabled={isLoading} className="flex-1">
            Maybe Later
          </Button>
          <Button
            onClick={handleSubscribe}
            disabled={isLoading}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                Upgrading...
              </div>
            ) : (
              <>
                <Crown className="mr-2 h-4 w-4" />
                Upgrade to Pro
              </>
            )}
          </Button>
        </div>

        {/* Fine Print */}
        <p className="mt-4 text-center text-xs text-gray-500">
          By subscribing, you agree to our terms of service. You can cancel anytime from your
          settings.
        </p>
      </Card>
    </div>
  )
}
