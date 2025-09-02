'use client'

import { ProSubscriptionModal } from '@/components/subscription/pro-subscription-modal'
import { useProfile } from '@/lib/hooks/use-profile'
import { ArrowRight, Check, Crown } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export default function ProPrompt() {
  const [showModal, setShowModal] = useState(false)
  const { profile, loading } = useProfile()

  const proFeatures = [
    'Advanced analytics',
    'Custom analytics chart creation',
    'CLV analysis',
    'Line movement analysis on all bets',
  ]

  // Show loading state while profile is being fetched
  if (loading) {
    return (
      <div className="animate-pulse rounded-xl bg-gray-200 p-8">
        <div className="mb-4 h-6 rounded bg-gray-300"></div>
        <div className="mb-6 h-4 rounded bg-gray-300"></div>
        <div className="h-10 rounded bg-gray-300"></div>
      </div>
    )
  }

  // Don't show if user is already Pro
  if (profile?.pro === 'yes') {
    return null
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-yellow-200 bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 p-8 shadow-xl">
      {/* Background decoration */}
      <div className="absolute right-0 top-0 -mr-16 -mt-16 h-32 w-32 rounded-full bg-gradient-to-br from-yellow-200/20 to-amber-200/20"></div>
      <div className="absolute bottom-0 left-0 -mb-12 -ml-12 h-24 w-24 rounded-full bg-gradient-to-tr from-amber-200/15 to-yellow-200/15"></div>

      <div className="relative">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
            {/* Left side - Main content */}
            <div>
              <div className="mb-4 flex items-center space-x-3">
                <div className="rounded-xl bg-yellow-200 p-3">
                  <Crown className="h-8 w-8 text-yellow-700" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Upgrade to TrueSharp Pro</h2>
                  <p className="text-lg text-yellow-700">Unlock premium betting analytics</p>
                </div>
              </div>

              <p className="mb-6 text-lg text-gray-600">
                Take your betting strategy to the next level with advanced analytics, unlimited
                tracking, and exclusive features designed for serious bettors.
              </p>

              {/* Features Grid */}
              <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {proFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <Check className="h-5 w-5 flex-shrink-0 text-green-500" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right side - Pricing and CTA */}
            <div className="text-center lg:text-right">
              <div className="mb-6 rounded-2xl border border-yellow-200 bg-white p-6 shadow-lg">
                <div className="mb-4">
                  <div className="mb-2 text-5xl font-bold text-yellow-600">$20</div>
                  <div className="text-lg text-gray-600">/month</div>
                  <div className="text-sm font-medium text-yellow-600">Limited time offer</div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => setShowModal(true)}
                    className="inline-flex w-full items-center justify-center rounded-xl border border-transparent bg-gradient-to-r from-yellow-500 to-amber-500 px-6 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-200 hover:from-yellow-600 hover:to-amber-600 hover:shadow-xl"
                  >
                    <Crown className="mr-2 h-5 w-5" />
                    Upgrade to Pro
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </button>

                  <button
                    onClick={() => setShowModal(true)}
                    className="inline-flex w-full items-center justify-center rounded-xl border border-yellow-300 bg-yellow-50 px-6 py-3 text-sm font-medium text-yellow-700 transition-colors hover:bg-yellow-100"
                  >
                    Learn More About Pro Features
                  </button>
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

      <ProSubscriptionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => {
          // Modal will close automatically and profile will refresh
        }}
      />
    </div>
  )
}
