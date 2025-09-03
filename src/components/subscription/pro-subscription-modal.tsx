'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/lib/hooks/use-auth'
import { useProfile } from '@/lib/hooks/use-profile'
import { Check, Crown, /* Sparkles, */ X } from 'lucide-react'
import { useState } from 'react'

interface ProSubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function ProSubscriptionModal({ isOpen, onClose, onSuccess }: ProSubscriptionModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const { refreshProfile } = useProfile()

  if (!isOpen) return null

  const handleSubscribe = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Check if user is authenticated
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Use the API endpoint to update pro status
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pro: 'yes',
        }),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to upgrade to Pro')
      }

      // Refresh profile data to update the UI
      await refreshProfile()

      onSuccess?.()
      onClose()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to upgrade to Pro')
    } finally {
      setIsLoading(false)
    }
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

        {/* Pricing */}
        <div className="mb-6 text-center">
          <div className="mb-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
            <div className="text-3xl font-bold">$20/month</div>
            <div className="text-sm text-blue-200">Cancel anytime</div>
          </div>
        </div>

        {/* Features */}
        <div className="mb-6">
          <h3 className="mb-3 font-semibold text-gray-900">What's included:</h3>
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
