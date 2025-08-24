// src/components/dashboard/welcome-banner.tsx
import { useUserProfile } from '@/lib/hooks/use-user-profile'
import { CheckCircle, TrendingUp, X } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

interface WelcomeBannerProps {
  isNewUser?: boolean
  hasBets?: boolean
  hasConnectedSportsbooks?: boolean
  dismissible?: boolean
}

export default function WelcomeBanner({ 
  isNewUser = false,
  hasBets = true,
  hasConnectedSportsbooks = true,
  dismissible = true
}: WelcomeBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  const { username, displayName, loading } = useUserProfile()

  if (dismissed) return null

  // Different content based on user state
  if (isNewUser || !hasConnectedSportsbooks) {
    return (
      <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 mb-8 text-white">
        {dismissible && (
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-4 right-4 text-blue-100 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <TrendingUp className="h-8 w-8 text-blue-200" />
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-lg font-semibold">
              Welcome to TrueSharp, {username}!
            </h3>
            <p className="mt-1 text-blue-100">
              Let's get you started with tracking your betting performance. Connect your first sportsbook to begin.
            </p>
            
            {/* Next Steps */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center text-sm text-blue-100">
                <CheckCircle className="h-4 w-4 mr-2 text-green-300" />
                Account created and verified
              </div>
              <div className="flex items-center text-sm text-blue-100">
                <div className="h-4 w-4 mr-2 border border-blue-300 rounded" />
                Connect your first sportsbook
              </div>
              <div className="flex items-center text-sm text-blue-100">
                <div className="h-4 w-4 mr-2 border border-blue-300 rounded" />
                Start tracking your bets automatically
              </div>
            </div>
            
            <div className="mt-6">
              <Link
                href="/settings/sportsbooks"
                className="inline-flex items-center px-4 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-100 hover:bg-blue-600 hover:text-white transition-colors"
              >
                Connect Sportsbook
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Regular welcome for existing users
  return (
    <div className="mb-8">
                            <h1 className="text-xl font-semibold mb-2">Welcome back, {loading ? 'User' : displayName || username}!</h1>
      <p className="mt-1 text-sm text-gray-600">
        Here's what's happening with your betting performance today.
      </p>
    </div>
  )
}
