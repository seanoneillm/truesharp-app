// src/app/marketplace/[username]/page.tsx
"use client"

import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { StrategyCard } from '@/components/marketplace/strategy-card'
import { SubscriptionPricingModal } from '@/components/marketplace/subscription-pricing-modal'
import { useAuth } from '@/lib/hooks/use-auth'
import { useSubscribe } from '@/lib/hooks/use-subscribe'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ArrowLeft, Share2, Copy, CheckCircle, Store } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface SellerProfile {
  id: string
  username: string
  profile_picture_url: string | null
  is_verified_seller: boolean
  bio: string | null
  profile_img: string | null
  banner_img: string | null
  created_at: string
  strategies: Array<{
    id: string
    strategy_id: string
    user_id: string
    strategy_name: string
    username: string
    is_verified_seller: boolean
    total_bets: number
    winning_bets: number
    losing_bets: number
    roi_percentage: number
    win_rate: number
    overall_rank: number | null
    primary_sport: string
    strategy_type: string
    is_monetized: boolean
    subscription_price_weekly: number
    subscription_price_monthly: number
    subscription_price_yearly: number
    created_at: string
    updated_at: string
  }>
}

interface StrategyData {
  id: string
  strategy_id: string
  user_id: string
  strategy_name: string
  strategy_description: string
  username: string
  display_name: string
  profile_picture_url: string | null
  total_bets: number
  roi_percentage: number
  win_rate: number
  primary_sport: string
  strategy_type: string
  price: number
  pricing_weekly: number
  pricing_monthly: number
  pricing_yearly: number
  subscriber_count: number
  is_verified: boolean
  verification_status: string
  rank: number | null
  leaderboard_score?: number
  last_bet_date: string | null
  last_updated: string
  created_at: string
  start_date?: string
}


interface SellerProfilePageProps {
  params: Promise<{
    username: string
  }>
}

export default function SellerProfilePage({ params }: SellerProfilePageProps) {
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copySuccess, setCopySuccess] = useState(false)
  
  // Subscription modal state
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false)
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyData | null>(null)

  // Authentication
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()

  // Strategy subscription management
  const { subscribe, checkSubscription, isLoading: subscriptionLoading } = useSubscribe()
  const [subscriptions, setSubscriptions] = useState<Record<string, any>>({})

  // Check subscription for a strategy
  const isSubscribedToStrategy = (strategyId: string) => {
    return !!subscriptions[strategyId]
  }

  const getSubscriptionToStrategy = (strategyId: string) => {
    return subscriptions[strategyId] || null
  }

  // Handle subscription modal
  const handleSubscribeClick = (strategyId: string, sellerId: string) => {
    // Check if user is authenticated before allowing subscription
    if (!isAuthenticated || !user) {
      // Redirect to login page
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname))
      return
    }

    const strategy = sellerProfile?.strategies.find(s => s.strategy_id === strategyId)
    if (strategy) {
      // Convert to StrategyData format
      const strategyData: StrategyData = {
        id: strategy.id,
        strategy_id: strategy.strategy_id,
        user_id: strategy.user_id,
        strategy_name: strategy.strategy_name,
        strategy_description: '', // Not provided by API
        username: strategy.username,
        display_name: strategy.username,
        profile_picture_url: sellerProfile.profile_img,
        total_bets: strategy.total_bets,
        roi_percentage: strategy.roi_percentage,
        win_rate: strategy.win_rate,
        primary_sport: strategy.primary_sport,
        strategy_type: strategy.strategy_type,
        price: strategy.subscription_price_monthly || 0,
        pricing_weekly: strategy.subscription_price_weekly || 0,
        pricing_monthly: strategy.subscription_price_monthly || 0,
        pricing_yearly: strategy.subscription_price_yearly || 0,
        subscriber_count: 0, // Not provided by API
        is_verified: strategy.is_verified_seller,
        verification_status: strategy.is_verified_seller ? 'verified' : 'unverified',
        rank: strategy.overall_rank,
        last_bet_date: null,
        last_updated: strategy.updated_at,
        created_at: strategy.created_at
      }
      setSelectedStrategy(strategyData)
      setSubscriptionModalOpen(true)
    }
  }

  // Handle subscription purchase
  const handleSubscribe = async (frequency: 'weekly' | 'monthly' | 'yearly', price: number) => {
    if (!selectedStrategy || !user) return

    try {
      const result = await subscribe({
        strategyId: selectedStrategy.strategy_id,
        sellerId: selectedStrategy.user_id,
        frequency,
        price
      })

      if (result.success && result.subscription) {
        // Update local subscriptions state
        setSubscriptions(prev => ({
          ...prev,
          [selectedStrategy.strategy_id]: result.subscription
        }))
        
        // Close modal
        setSubscriptionModalOpen(false)
        setSelectedStrategy(null)
        
        // Show success message
        console.log('Successfully subscribed to strategy!')
      } else {
        console.error('Subscription failed:', result.error)
      }
    } catch (error) {
      console.error('Subscription error:', error)
    }
  }

  const handleCloseSubscriptionModal = () => {
    setSubscriptionModalOpen(false)
    setSelectedStrategy(null)
  }

  // Copy profile link to clipboard
  const copyProfileLink = async () => {
    try {
      const url = `${window.location.origin}/marketplace/${sellerProfile?.username}`
      await navigator.clipboard.writeText(url)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (error) {
      console.error('Failed to copy link:', error)
    }
  }

  useEffect(() => {
    const fetchSellerProfile = async () => {
      try {
        setLoading(true)
        
        // Await params to get username
        const resolvedParams = await params
        const username = resolvedParams.username
        
        // Fetch seller profile with strategies using new API
        const profileResponse = await fetch(`/api/seller-profile?username=${encodeURIComponent(username)}`)
        const profileData = await profileResponse.json()
        
        console.log('Profile API response:', profileData)
        
        if (profileData.error) {
          setError(profileData.error)
          return
        }
        
        console.log('Setting seller profile data:', profileData.data)
        setSellerProfile(profileData.data)
        
      } catch (err) {
        console.error('Error fetching seller profile:', err)
        setError('Failed to load seller profile')
      } finally {
        setLoading(false)
      }
    }

    fetchSellerProfile()
  }, [params])

  // Load user's existing subscriptions
  useEffect(() => {
    const loadSubscriptions = async () => {
      if (!isAuthenticated || !user || !sellerProfile?.strategies.length) return

      try {
        const subscriptionPromises = sellerProfile.strategies.map(async (strategy) => {
          const result = await checkSubscription(strategy.strategy_id)
          return {
            strategyId: strategy.strategy_id,
            subscription: result.subscription
          }
        })

        const results = await Promise.all(subscriptionPromises)
        const subscriptionMap: Record<string, any> = {}
        
        results.forEach(({ strategyId, subscription }) => {
          if (subscription) {
            subscriptionMap[strategyId] = subscription
          }
        })

        setSubscriptions(subscriptionMap)
      } catch (error) {
        console.error('Error loading subscriptions:', error)
      }
    }

    loadSubscriptions()
  }, [sellerProfile, isAuthenticated, user, checkSubscription])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            {/* Header skeleton */}
            <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
            {/* Content skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !sellerProfile) {
    return (
      <DashboardLayout>
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="text-center">
            <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Seller not found</h1>
            <p className="text-gray-600 mb-4">{error || "The seller you're looking for doesn't exist."}</p>
            <Link href="/marketplace">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Marketplace
              </Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Calculate stats from strategies
  const stats = sellerProfile.strategies.reduce(
    (acc, strategy) => {
      acc.totalBets += strategy.total_bets
      acc.totalROI += strategy.roi_percentage
      acc.totalWinRate += strategy.win_rate
      return acc
    },
    { totalBets: 0, totalROI: 0, totalWinRate: 0 }
  )

  const avgROI = sellerProfile.strategies.length > 0 ? stats.totalROI / sellerProfile.strategies.length : 0
  const avgWinRate = sellerProfile.strategies.length > 0 ? stats.totalWinRate / sellerProfile.strategies.length : 0

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/marketplace">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Marketplace
            </Button>
          </Link>
        </div>

        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="relative">
            {/* Banner */}
            <div className={cn(
              "h-32 bg-gradient-to-r from-blue-600 to-blue-700",
              sellerProfile.banner_img && "bg-none"
            )}>
              {sellerProfile.banner_img ? (
                <img
                  src={sellerProfile.banner_img}
                  alt="Profile banner"
                  className="w-full h-32 object-cover"
                  onError={(e) => {
                    console.log('Banner image failed to load:', sellerProfile.banner_img)
                    e.currentTarget.style.display = 'none'
                  }}
                />
              ) : (
                <div className="absolute top-2 left-2 text-white text-xs opacity-50">
                  No banner image
                </div>
              )}
            </div>
            
            <div className="relative px-6 pb-6">
              {/* Profile Info */}
              <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-6 -mt-16">
                <div className="relative">
                  {(sellerProfile.profile_img || sellerProfile.profile_picture_url) ? (
                    <img
                      src={sellerProfile.profile_img || sellerProfile.profile_picture_url || ''}
                      alt={sellerProfile.username}
                      className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-lg"
                      onError={(e) => {
                        console.log('Profile image failed to load:', sellerProfile.profile_img || sellerProfile.profile_picture_url)
                        e.currentTarget.style.display = 'none'
                        // Show fallback
                        const fallback = document.createElement('div')
                        fallback.className = 'h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl border-4 border-white shadow-lg'
                        fallback.textContent = sellerProfile.username.charAt(0).toUpperCase()
                        e.currentTarget.parentNode?.appendChild(fallback)
                      }}
                    />
                  ) : (
                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl border-4 border-white shadow-lg">
                      {sellerProfile.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {sellerProfile.is_verified_seller && (
                    <div className="absolute -bottom-2 -right-2">
                      <div className="bg-blue-500 rounded-full p-1">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 sm:mt-0 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center space-x-3">
                        <h1 className="text-2xl font-bold text-gray-900">@{sellerProfile.username}</h1>
                        {sellerProfile.is_verified_seller && (
                          <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium flex items-center">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Verified
                          </div>
                        )}
                      </div>
                      
                      {/* Bio */}
                      {sellerProfile.bio && sellerProfile.bio.trim() && (
                        <p className="text-gray-600 mt-2 max-w-2xl whitespace-pre-wrap">{sellerProfile.bio}</p>
                      )}
                      {/* Debug bio info */}
                      {(!sellerProfile.bio || !sellerProfile.bio.trim()) && (
                        <p className="text-gray-400 mt-2 max-w-2xl italic text-sm">No bio available</p>
                      )}
                      
                      {/* Quick Stats */}
                      <div className="flex items-center space-x-6 mt-3 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Store className="h-4 w-4 mr-1" />
                          {sellerProfile.strategies.length} {sellerProfile.strategies.length === 1 ? 'strategy' : 'strategies'}
                        </div>
                        <div className="text-sm text-gray-500">
                          Joined {formatDate(sellerProfile.created_at)}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                      <Button 
                        variant="outline" 
                        onClick={copyProfileLink}
                        className={cn(
                          copySuccess && "bg-green-50 text-green-700 border-green-200"
                        )}
                      >
                        {copySuccess ? (
                          <><CheckCircle className="h-4 w-4 mr-2" />Copied!</>
                        ) : (
                          <><Copy className="h-4 w-4 mr-2" />Copy Link</>
                        )}
                      </Button>
                      <Button variant="outline">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Overview */}
              {sellerProfile.strategies.length > 0 && (
                <div className="mt-6">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <div className={`text-2xl font-bold mb-1 ${
                        avgROI >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {avgROI >= 0 ? '+' : ''}{avgROI.toFixed(1)}%
                      </div>
                      <div className="text-sm text-slate-600">Average ROI</div>
                    </div>
                    
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <div className="text-2xl font-bold text-slate-900 mb-1">
                        {avgWinRate.toFixed(1)}%
                      </div>
                      <div className="text-sm text-slate-600">Win Rate</div>
                    </div>
                    
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <div className="text-2xl font-bold text-slate-900 mb-1">
                        {stats.totalBets.toLocaleString()}
                      </div>
                      <div className="text-sm text-slate-600">Total Bets</div>
                    </div>
                    
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 mb-1">
                        {sellerProfile.strategies.length}
                      </div>
                      <div className="text-sm text-slate-600">Strategies</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Strategies Grid */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              Strategies ({sellerProfile.strategies.length})
            </h2>
          </div>

          {sellerProfile.strategies.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-600 font-medium mb-2">No strategies available</div>
              <div className="text-gray-500 text-sm">This seller hasn't created any public strategies yet</div>
            </div>
          ) : (
            <div className="space-y-4">
              {sellerProfile.strategies.map((strategy, index) => {
                const strategyData: StrategyData = {
                  id: strategy.id,
                  strategy_id: strategy.strategy_id,
                  user_id: strategy.user_id,
                  strategy_name: strategy.strategy_name,
                  strategy_description: '', // Not provided
                  username: strategy.username,
                  display_name: strategy.username,
                  profile_picture_url: sellerProfile.profile_img,
                  total_bets: strategy.total_bets,
                  roi_percentage: strategy.roi_percentage,
                  win_rate: strategy.win_rate,
                  primary_sport: strategy.primary_sport,
                  strategy_type: strategy.strategy_type,
                  price: strategy.subscription_price_monthly || 0,
                  pricing_weekly: strategy.subscription_price_weekly || 0,
                  pricing_monthly: strategy.subscription_price_monthly || 0,
                  pricing_yearly: strategy.subscription_price_yearly || 0,
                  subscriber_count: 0, // Not provided
                  is_verified: strategy.is_verified_seller,
                  verification_status: strategy.is_verified_seller ? 'verified' : 'unverified',
                  rank: strategy.overall_rank,
                  last_bet_date: null,
                  last_updated: strategy.updated_at,
                  created_at: strategy.created_at
                }
                
                return (
                  <StrategyCard
                    key={strategy.strategy_id}
                    strategy={strategyData}
                    index={index}
                    isSubscribed={isSubscribedToStrategy(strategy.strategy_id)}
                    subscription={getSubscriptionToStrategy(strategy.strategy_id)}
                    onSubscribe={handleSubscribeClick}
                    isLoading={subscriptionLoading}
                  />
                )
              })}
            </div>
          )}
        </div>

        
        {/* Subscription Modal */}
        {selectedStrategy && (
          <SubscriptionPricingModal
            isOpen={subscriptionModalOpen}
            onClose={handleCloseSubscriptionModal}
            onSubscribe={handleSubscribe}
            strategy={selectedStrategy}
            isLoading={subscriptionLoading}
          />
        )}
      </div>
    </DashboardLayout>
  )
}
