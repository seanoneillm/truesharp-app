'use client'

import { useAuth } from '@/lib/hooks/use-auth'
import { Calendar, Star, TrendingUp } from 'lucide-react'

interface Profile {
  id: string
  username?: string
  email?: string
  pro?: string
  is_seller?: boolean
}

interface WelcomeSectionProps {
  profile?: Profile | null
}

export default function WelcomeSection({ profile }: WelcomeSectionProps) {
  const { user } = useAuth()

  const getDisplayName = () => {
    if (!user) return 'Guest'

    // Use profile username if available, otherwise extract from email
    if (profile?.username) {
      return profile.username
    }

    if (user.email) {
      return user.email.split('@')[0]
    }

    return 'User'
  }

  const displayName = getDisplayName()
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 shadow-xl">
      <div className="px-8 py-8">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-200" />
              <span className="text-sm font-medium text-blue-100">{currentDate}</span>
            </div>

            <h1 className="mb-2 text-3xl font-bold text-white">Welcome back, {displayName}!</h1>

            <p className="mb-4 text-lg text-blue-100">
              Here&apos;s your betting performance overview and latest activity.
            </p>

            <div className="flex items-center space-x-4">
              {profile?.is_seller && (
                <div className="inline-flex items-center rounded-full bg-green-500/20 px-3 py-1 backdrop-blur-sm">
                  <Star className="mr-1 h-4 w-4 text-green-300" />
                  <span className="text-sm font-medium text-green-200">Seller Account</span>
                </div>
              )}

              {profile?.pro === 'active' && (
                <div className="inline-flex items-center rounded-full bg-yellow-500/20 px-3 py-1 backdrop-blur-sm">
                  <TrendingUp className="mr-1 h-4 w-4 text-yellow-300" />
                  <span className="text-sm font-medium text-yellow-200">Pro Member</span>
                </div>
              )}
            </div>
          </div>

          <div className="ml-8 flex-shrink-0">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-white/30 bg-white/20 backdrop-blur-sm">
                <span className="text-3xl font-bold text-white">
                  {displayName?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-green-400">
                <div className="h-2 w-2 rounded-full bg-white"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative bottom border */}
      <div className="h-2 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
    </div>
  )
}
