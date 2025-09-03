import { useUserProfile } from '@/lib/hooks/use-user-profile'
import { CheckCircle, TrendingUp, X } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

interface UserProfile {
  username?: string
  displayName?: string
}

interface WelcomeBannerProps {
  isNewUser?: boolean
  hasBets?: boolean
  hasConnectedSportsbooks?: boolean
  dismissible?: boolean
}

export default function WelcomeBanner({
  isNewUser = false,
  hasConnectedSportsbooks = true,
  dismissible = true,
}: WelcomeBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  const { profile, loading } = useUserProfile()

  // Extract user info from profile with fallbacks
  const userProfile = profile as UserProfile | null
  const username = userProfile?.username || 'User'
  const displayName = userProfile?.displayName || userProfile?.username || 'User'

  if (dismissed) return null

  // Different content based on user state
  if (isNewUser || !hasConnectedSportsbooks) {
    return (
      <div className="relative mb-8 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
        {dismissible && (
          <button
            onClick={() => setDismissed(true)}
            className="absolute right-4 top-4 text-blue-100 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        <div className="flex items-start">
          <div className="flex-shrink-0">
            <TrendingUp className="h-8 w-8 text-blue-200" />
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-lg font-semibold">Welcome to TrueSharp, {username}!</h3>
            <p className="mt-1 text-blue-100">
              Let&apos;s get you started with tracking your betting performance. Connect your first
              sportsbook to begin.
            </p>

            {/* Next Steps */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center text-sm text-blue-100">
                <CheckCircle className="mr-2 h-4 w-4 text-green-300" />
                Account created and verified
              </div>
              <div className="flex items-center text-sm text-blue-100">
                <div className="mr-2 h-4 w-4 rounded border border-blue-300" />
                Connect your first sportsbook
              </div>
              <div className="flex items-center text-sm text-blue-100">
                <div className="mr-2 h-4 w-4 rounded border border-blue-300" />
                Start tracking your bets automatically
              </div>
            </div>

            <div className="mt-6">
              <Link
                href="/settings/sportsbooks"
                className="inline-flex items-center rounded-md border border-blue-300 px-4 py-2 text-sm font-medium text-blue-100 transition-colors hover:bg-blue-600 hover:text-white"
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
      <h1 className="mb-2 text-xl font-semibold">
        Welcome back, {loading ? 'User' : displayName || username}!
      </h1>
      <p className="mt-1 text-sm text-gray-600">
        Here&apos;s what&apos;s happening with your betting performance today.
      </p>
    </div>
  )
}
