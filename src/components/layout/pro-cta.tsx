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
      <div className="px-4 py-3 mb-4">
        <div className="bg-gray-200 rounded-xl p-4 animate-pulse">
          <div className="h-4 bg-gray-300 rounded mb-2"></div>
          <div className="h-3 bg-gray-300 rounded mb-3"></div>
          <div className="h-8 bg-gray-300 rounded"></div>
        </div>
      </div>
    )
  }

  // Show Pro member status if user is already Pro
  if (profile?.pro === 'yes') {
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

  return (
    <>
      <div className="px-4 py-3 mb-4">
        <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 rounded-xl p-4 text-white shadow-lg">
          <div className="flex items-center mb-2">
            <Sparkles className="h-5 w-5 mr-2 text-yellow-300" />
            <span className="text-sm font-semibold">Upgrade to Pro</span>
          </div>
          
          <p className="text-xs text-blue-100 mb-3 leading-relaxed">
            Unlock advanced analytics, custom charts, CLV analysis, and line movement tracking
          </p>
          
          <div className="mb-3">
            <div className="text-lg font-bold">$20/month</div>
            <div className="text-xs text-blue-200">Cancel anytime</div>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="w-full bg-white text-purple-600 py-2.5 px-4 rounded-lg font-semibold text-sm hover:bg-blue-50 transition-all duration-200 shadow-md hover:shadow-lg"
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
