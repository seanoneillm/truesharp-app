'use client'

import ProtectedRoute from '@/components/auth/protected-route'
import AnalyticsPreview from '@/components/dashboard/analytics-preview'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import MarketplacePreview from '@/components/dashboard/marketplace-preview'
import ProPrompt from '@/components/dashboard/pro-prompt'
import SellerPreview from '@/components/dashboard/seller-preview'
import SubscriptionsPreview from '@/components/dashboard/subscriptions-preview'
import TodaysBets from '@/components/dashboard/todays-bets'
import WelcomeSection from '@/components/dashboard/welcome-section'
import { createBrowserClient } from '@/lib/auth/supabase'
import { useAuth } from '@/lib/hooks/use-auth'
import { useEffect, useState } from 'react'

interface Profile {
  id: string
  username?: string
  email?: string
  pro?: string
  is_seller?: boolean
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // Debug logging
  useEffect(() => {
    console.log('🏠 Dashboard - Current user:', user?.id || 'No user', 'Email:', user?.email || 'No email')
  }, [user])

  useEffect(() => {
    async function fetchProfile() {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const supabase = createBrowserClient()
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Error fetching profile:', error)
        } else {
          setProfile(data)
        }
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user])

  // Show loading state
  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="animate-pulse">
                <div className="h-32 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl mb-8"></div>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="h-64 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl"></div>
                    <div className="h-64 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl"></div>
                  </div>
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="h-64 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl"></div>
                    <div className="h-64 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl"></div>
                    <div className="h-64 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            
            {/* Welcome Section */}
            <div className="mb-8">
              <WelcomeSection profile={profile} />
            </div>

            {/* Main Dashboard Grid - Better Organization */}
            <div className="space-y-6">
              
              {/* Top Row - Two Column Grid */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <TodaysBets />
                <AnalyticsPreview />
              </div>

              {/* Middle Row - Three Column Grid */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <SellerPreview profile={profile} />
                <SubscriptionsPreview />
                <MarketplacePreview />
              </div>

              {/* Bottom Row - Full Width Pro Prompt */}
              {(!profile?.pro || profile?.pro !== 'active') && (
                <div className="w-full">
                  <ProPrompt />
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}