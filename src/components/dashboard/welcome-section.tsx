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
    day: 'numeric' 
  })

  return (
    <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl shadow-xl overflow-hidden">
      <div className="px-8 py-8">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Calendar className="h-5 w-5 text-blue-200" />
              <span className="text-blue-100 text-sm font-medium">{currentDate}</span>
            </div>
            
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome back, {displayName}!
            </h1>
            
            <p className="text-blue-100 text-lg mb-4">
              Here&apos;s your betting performance overview and latest activity.
            </p>
            
            <div className="flex items-center space-x-4">
              {profile?.is_seller && (
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-500/20 backdrop-blur-sm">
                  <Star className="h-4 w-4 text-green-300 mr-1" />
                  <span className="text-sm font-medium text-green-200">Seller Account</span>
                </div>
              )}
              
              {profile?.pro === 'active' && (
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-500/20 backdrop-blur-sm">
                  <TrendingUp className="h-4 w-4 text-yellow-300 mr-1" />
                  <span className="text-sm font-medium text-yellow-200">Pro Member</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex-shrink-0 ml-8">
            <div className="relative">
              <div className="h-20 w-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/30">
                <span className="text-3xl font-bold text-white">
                  {displayName?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-green-400 rounded-full border-2 border-white flex items-center justify-center">
                <div className="h-2 w-2 bg-white rounded-full"></div>
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
