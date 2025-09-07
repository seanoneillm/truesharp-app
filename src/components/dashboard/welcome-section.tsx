'use client'

import { useAuth } from '@/lib/hooks/use-auth'
import { Calendar, Star, TrendingUp } from 'lucide-react'

interface Profile {
  id: string
  username?: string
  email?: string
  pro?: string
  is_seller?: boolean
  profile_picture_url?: string
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
      <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="flex-1 min-w-0">
            <div className="mb-2 flex items-center space-x-2">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-200 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-blue-100 truncate">{currentDate}</span>
            </div>

            <h1 className="mb-2 text-xl sm:text-2xl lg:text-3xl font-bold text-white truncate">
              Welcome back, {displayName}!
            </h1>

            <p className="mb-4 text-sm sm:text-base lg:text-lg text-blue-100">
              Here&apos;s your betting performance overview and latest activity.
            </p>

            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              {profile?.is_seller && (
                <div className="inline-flex items-center rounded-full bg-green-500/20 px-2 sm:px-3 py-1 backdrop-blur-sm">
                  <Star className="mr-1 h-3 w-3 sm:h-4 sm:w-4 text-green-300" />
                  <span className="text-xs sm:text-sm font-medium text-green-200">Seller Account</span>
                </div>
              )}

              {profile?.pro === 'active' && (
                <div className="inline-flex items-center rounded-full bg-yellow-500/20 px-2 sm:px-3 py-1 backdrop-blur-sm">
                  <TrendingUp className="mr-1 h-3 w-3 sm:h-4 sm:w-4 text-yellow-300" />
                  <span className="text-xs sm:text-sm font-medium text-yellow-200">Pro Member</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex-shrink-0 self-center sm:ml-6 lg:ml-8">
            <div className="relative">
              <div className="flex h-16 w-16 sm:h-18 sm:w-18 lg:h-20 lg:w-20 items-center justify-center rounded-full border-2 border-white/30 bg-white/20 backdrop-blur-sm overflow-hidden">
                {profile?.profile_picture_url ? (
                  <img
                    src={profile.profile_picture_url}
                    alt={`${displayName}'s profile`}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      // Fallback to initials if image fails to load
                      e.currentTarget.style.display = 'none'
                      e.currentTarget.nextElementSibling?.classList.remove('hidden')
                    }}
                  />
                ) : null}
                <span 
                  className={`text-2xl sm:text-2xl lg:text-3xl font-bold text-white ${profile?.profile_picture_url ? 'hidden' : ''}`}
                >
                  {displayName?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full border-2 border-white bg-green-400">
                <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-white"></div>
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
