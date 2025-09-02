'use client'

import { ProSubscriptionModal } from '@/components/subscription/pro-subscription-modal'
import { useProfile } from '@/lib/hooks/use-profile'
import { Crown, Sparkles } from 'lucide-react'
import { useState } from 'react'

export function ProCTA() {
  const [showModal, setShowModal] = useState(false)
  const { profile, loading } = useProfile()

  // Show loading state while profile is being fetched
  if (loading) {
    return (
      <div className="mb-4 px-4 py-3">
        <div className="animate-pulse rounded-xl bg-gray-200 p-4">
          <div className="mb-2 h-4 rounded bg-gray-300"></div>
          <div className="mb-3 h-3 rounded bg-gray-300"></div>
          <div className="h-8 rounded bg-gray-300"></div>
        </div>
      </div>
    )
  }

  // Show Pro member status if user is already Pro
  if (profile?.pro === 'yes') {
    return (
      <div className="mb-4 px-4 py-3">
        <div className="rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 p-4 text-white">
          <div className="flex items-center">
            <Crown className="mr-2 h-5 w-5" />
            <span className="text-sm font-semibold">TrueSharp Pro</span>
          </div>
          <p className="mt-1 text-xs text-yellow-100">You&apos;re a Pro member!</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="mb-4 px-4 py-3">
        <div className="rounded-xl bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 p-4 text-white shadow-lg">
          <div className="mb-2 flex items-center">
            <Sparkles className="mr-2 h-5 w-5 text-yellow-300" />
            <span className="text-sm font-semibold">Upgrade to Pro</span>
          </div>

          <p className="mb-3 text-xs leading-relaxed text-blue-100">
            Unlock advanced analytics, custom charts, CLV analysis, and line movement tracking
          </p>

          <div className="mb-3">
            <div className="text-lg font-bold">$20/month</div>
            <div className="text-xs text-blue-200">Cancel anytime</div>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="w-full rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-purple-600 shadow-md transition-all duration-200 hover:bg-blue-50 hover:shadow-lg"
          >
            Upgrade to Pro
          </button>
        </div>
      </div>

      <ProSubscriptionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => {
          // Modal will close automatically and profile will refresh
        }}
      />
    </>
  )
}
