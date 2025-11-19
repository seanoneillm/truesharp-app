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
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/use-auth'
import MaintenanceOverlay from '@/components/maintenance/MaintenanceOverlay'
import { useEffect, useState } from 'react'

const ADMIN_USER_IDS = [
  '28991397-dae7-42e8-a822-0dffc6ff49b7',
  '0e16e4f5-f206-4e62-8282-4188ff8af48a',
  'dfd44121-8e88-4c83-ad95-9fb8a4224908',
]

interface Profile {
  id: string
  username?: string
  email?: string
  pro?: string
  is_seller?: boolean
  profile_picture_url?: string
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Check if user is admin
  const isAdmin = user?.id && ADMIN_USER_IDS.includes(user.id)

  // Debug logging
  useEffect(() => {
    console.log(
      '🏠 Dashboard - Current user:',
      user?.id || 'No user',
      'Email:',
      user?.email || 'No email'
    )
  }, [user])

  useEffect(() => {
    async function fetchProfile() {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const supabase = createClient()
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
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
              <div className="animate-pulse">
                <div className="mb-8 h-32 rounded-xl bg-gradient-to-r from-gray-200 to-gray-300"></div>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="h-64 rounded-xl bg-gradient-to-r from-gray-200 to-gray-300"></div>
                    <div className="h-64 rounded-xl bg-gradient-to-r from-gray-200 to-gray-300"></div>
                  </div>
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="h-64 rounded-xl bg-gradient-to-r from-gray-200 to-gray-300"></div>
                    <div className="h-64 rounded-xl bg-gradient-to-r from-gray-200 to-gray-300"></div>
                    <div className="h-64 rounded-xl bg-gradient-to-r from-gray-200 to-gray-300"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  // Show maintenance overlay for non-admin users
  if (user && !isAdmin) {
    return <MaintenanceOverlay pageName="Dashboard" />
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {/* Welcome Section */}
            <div className="mb-8">
              <WelcomeSection profile={profile} />
            </div>

            {/* Main Dashboard Grid - Responsive Organization */}
            <div className="space-y-6">
              {/* Top Row - Responsive Two Column Grid */}
              <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-2">
                <TodaysBets />
                <AnalyticsPreview />
              </div>

              {/* Middle Row - Responsive Three Column Grid */}
              <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
                <div className="md:col-span-2 xl:col-span-1">
                  <SellerPreview profile={profile} />
                </div>
                <SubscriptionsPreview />
                <MarketplacePreview />
              </div>

              {/* Bottom Row - Full Width Pro Prompt */}
              <div className="w-full">
                <ProPrompt />
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
