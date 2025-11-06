// src/app/marketplace/[username]/page.tsx
'use client'

// import { StrategyCard } from '@/components/marketplace/strategy-card'
import { SubscriptionPricingModal } from '@/components/marketplace/subscription-pricing-modal'
import { useAuth } from '@/lib/hooks/use-auth'
import { useSubscribe } from '@/lib/hooks/use-subscribe'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Copy, CheckCircle, Store, ArrowLeft, Loader2 } from 'lucide-react'
import { TrueSharpShield } from '@/components/ui/truesharp-shield'
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
    strategy_description?: string
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
  const handleSubscribeClick = (strategyId: string) => {
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
        profile_picture_url: sellerProfile?.profile_img || null,
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
        created_at: strategy.created_at,
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
        price,
      })

      if (result.success && result.subscription) {
        // Update local subscriptions state
        setSubscriptions(prev => ({
          ...prev,
          [selectedStrategy.strategy_id]: result.subscription,
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
        const profileResponse = await fetch(
          `/api/seller-profile?username=${encodeURIComponent(username)}`
        )
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
        const subscriptionPromises = sellerProfile.strategies.map(async strategy => {
          const result = await checkSubscription(strategy.strategy_id)
          return {
            strategyId: strategy.strategy_id,
            subscription: result.subscription,
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
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-4 sm:py-6 max-w-5xl">
          <div className="space-y-4 sm:space-y-6">
            <div className="animate-pulse">
              {/* Back button and branding skeleton */}
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="h-10 w-32 rounded-lg bg-gray-200"></div>
                <div className="h-8 w-24 rounded-full bg-gray-200"></div>
              </div>
              
              {/* Profile header skeleton */}
              <div className="rounded-xl bg-white border border-gray-200 overflow-hidden mb-4 sm:mb-6">
                <div className="h-24 sm:h-32 bg-gray-200"></div>
                <div className="p-4 sm:p-6">
                  <div className="flex items-start space-x-4">
                    <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl bg-gray-200"></div>
                    <div className="flex-1">
                      <div className="h-6 w-48 rounded bg-gray-200 mb-2"></div>
                      <div className="flex space-x-2 mb-3">
                        <div className="h-6 w-20 rounded-full bg-gray-200"></div>
                        <div className="h-6 w-16 rounded-full bg-gray-200"></div>
                      </div>
                      <div className="h-16 rounded-lg bg-gray-100"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Strategies section skeleton */}
              <div className="rounded-xl bg-white border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-200 p-4 sm:p-6">
                  <div className="flex items-center space-x-3">
                    <div className="h-9 w-9 rounded-lg bg-gray-200"></div>
                    <div>
                      <div className="h-5 w-32 rounded bg-gray-200 mb-1"></div>
                      <div className="h-4 w-24 rounded bg-gray-200"></div>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 sm:p-6 space-y-4">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 border-b border-gray-200 p-4">
                        <div className="h-6 w-2/3 rounded bg-gray-200 mb-2"></div>
                        <div className="flex space-x-2">
                          <div className="h-5 w-16 rounded-full bg-gray-200"></div>
                          <div className="h-5 w-12 rounded-full bg-gray-200"></div>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          {[...Array(3)].map((_, j) => (
                            <div key={j} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                              <div className="h-5 w-12 rounded bg-gray-200 mb-1 mx-auto"></div>
                              <div className="h-3 w-8 rounded bg-gray-200 mx-auto"></div>
                            </div>
                          ))}
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 mb-4 border border-gray-200">
                          <div className="h-4 w-20 rounded bg-gray-200 mb-2"></div>
                          <div className="flex gap-2">
                            {[...Array(3)].map((_, k) => (
                              <div key={k} className="flex-1 bg-white rounded p-2 border border-gray-200">
                                <div className="h-4 w-12 rounded bg-gray-200 mb-1 mx-auto"></div>
                                <div className="h-3 w-8 rounded bg-gray-200 mx-auto"></div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex justify-center">
                          <div className="h-10 w-32 rounded-lg bg-gray-200"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !sellerProfile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center bg-white rounded-xl p-8 sm:p-12 shadow-lg border border-gray-200 max-w-md">
              <div className="bg-gray-100 rounded-xl p-6 mb-6">
                <Store className="mx-auto mb-4 h-16 w-16 text-gray-400" />
              </div>
              <h1 className="mb-4 text-2xl sm:text-3xl font-bold text-gray-900">Seller not found</h1>
              <p className="mb-6 text-gray-600 leading-relaxed">
                {error || "The seller you're looking for doesn't exist or may have been removed."}
              </p>
              <Link href="/marketplace">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Marketplace
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3 max-w-6xl">
        <div className="space-y-2 sm:space-y-3">
          {/* Back Button and Branding */}
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <Link href="/marketplace">
              <Button variant="outline" className="bg-white/90 backdrop-blur-sm hover:bg-white border-blue-200 text-blue-700 hover:text-blue-900 shadow-sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Back to Marketplace</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </Link>
            <div className="flex items-center space-x-2 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 border border-blue-200 shadow-sm">
              <TrueSharpShield className="h-4 w-4 text-blue-600" />
              <span className="font-semibold text-sm text-blue-700 hidden sm:inline">TrueSharp</span>
            </div>
          </div>

          {/* Profile Header */}
          <div className="overflow-hidden rounded-2xl border border-blue-200/60 bg-white/95 backdrop-blur-sm shadow-xl">
            <div className="relative">
              {/* Banner */}
              <div
                className={cn(
                  'h-28 sm:h-40 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 relative overflow-hidden',
                  sellerProfile.banner_img && 'bg-none'
                )}
              >
                {/* Animated background pattern */}
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-white/30 to-transparent rotate-12 transform" />
                  <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-white/20 to-transparent -rotate-12 transform" />
                </div>

                {sellerProfile.banner_img ? (
                  <>
                    <img
                      src={sellerProfile.banner_img}
                      alt="Profile banner"
                      className="h-28 sm:h-40 w-full object-cover"
                      onError={e => {
                        console.log('Banner image failed to load:', sellerProfile.banner_img)
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  </>
                ) : null}
                
              </div>

              {/* Profile Content */}
              <div className="p-3 sm:p-5">
                <div className="flex flex-col sm:flex-row items-start space-y-3 sm:space-y-0 sm:space-x-4">
                  {/* Profile Image */}
                  <div className="relative flex-shrink-0 mx-auto sm:mx-0">
                    {sellerProfile.profile_img || sellerProfile.profile_picture_url ? (
                      <img
                        src={sellerProfile.profile_img || sellerProfile.profile_picture_url || ''}
                        alt={sellerProfile.username}
                        className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl border-4 border-white object-cover shadow-xl ring-4 ring-blue-100/50"
                        onError={e => {
                          console.log(
                            'Profile image failed to load:',
                            sellerProfile.profile_img || sellerProfile.profile_picture_url
                          )
                          e.currentTarget.style.display = 'none'
                          const fallback = document.createElement('div')
                          fallback.className =
                            'h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl sm:text-2xl border-4 border-white shadow-xl ring-4 ring-blue-100/50'
                          fallback.textContent = sellerProfile.username.charAt(0).toUpperCase()
                          e.currentTarget.parentNode?.appendChild(fallback)
                        }}
                      />
                    ) : (
                      <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br from-blue-500 to-indigo-600 text-xl sm:text-2xl font-bold text-white shadow-xl ring-4 ring-blue-100/50">
                        {sellerProfile.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {sellerProfile.is_verified_seller && (
                      <div className="absolute -bottom-1 -right-1">
                        <div className="rounded-full bg-emerald-500 p-1.5 shadow-lg ring-2 ring-white">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Profile Info */}
                  <div className="flex-1 min-w-0 text-center sm:text-left">
                    <div className="flex flex-col space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                        <div>
                          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                            @{sellerProfile.username}
                          </h1>
                          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                            {sellerProfile.is_verified_seller && (
                              <div className="flex items-center rounded-full bg-emerald-100 border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-800 shadow-sm">
                                <CheckCircle className="mr-1.5 h-4 w-4" />
                                Verified Seller
                              </div>
                            )}
                            <div className="flex items-center rounded-full bg-blue-100 border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-800 shadow-sm">
                              <Store className="mr-1.5 h-4 w-4" />
                              <span className="font-semibold">{sellerProfile.strategies.length}</span>
                              <span className="ml-1">{sellerProfile.strategies.length === 1 ? 'strategy' : 'strategies'}</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          onClick={copyProfileLink}
                          size="sm"
                          className={cn(
                            "bg-white/90 backdrop-blur-sm hover:bg-white border-blue-200 text-blue-700 hover:text-blue-900 shadow-sm transition-all duration-200",
                            copySuccess && 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          )}
                        >
                          {copySuccess ? (
                            <>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              <span className="hidden sm:inline">Copied!</span>
                              <span className="sm:hidden">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="mr-2 h-4 w-4" />
                              <span className="hidden sm:inline">Share Profile</span>
                              <span className="sm:hidden">Share</span>
                            </>
                          )}
                        </Button>
                      </div>
                      
                      {/* Bio */}
                      {sellerProfile.bio && sellerProfile.bio.trim() ? (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 rounded-xl p-3 border border-blue-200/50 shadow-sm">
                          <p className="text-gray-700 text-sm leading-relaxed">
                            {sellerProfile.bio}
                          </p>
                        </div>
                      ) : (
                        <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-200/50">
                          <p className="text-blue-400 italic text-sm text-center">
                            This seller hasn't added a bio yet.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Strategies Section */}
          <div className="rounded-2xl border border-blue-200/60 bg-white/95 backdrop-blur-sm shadow-xl overflow-hidden">
            {/* Section Header */}
            <div className="bg-gradient-to-r from-blue-100 to-indigo-100 border-b border-blue-200/50 p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-2.5 shadow-lg border border-blue-300">
                    <TrueSharpShield className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                      Premium Strategies
                    </h2>
                    <p className="text-blue-600 text-sm font-medium">
                      {sellerProfile.strategies.length} professional {sellerProfile.strategies.length === 1 ? 'strategy' : 'strategies'} by @{sellerProfile.username}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Strategies Content */}
            <div className="p-3 sm:p-4">
              {sellerProfile.strategies.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200/50 shadow-sm">
                    <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full p-4 w-20 h-20 mx-auto mb-4">
                      <Store className="mx-auto h-12 w-12 text-blue-600" />
                    </div>
                    <div className="mb-2 text-lg font-bold text-gray-800">No strategies available yet</div>
                    <div className="text-blue-600 max-w-md mx-auto text-sm leading-relaxed">
                      This seller is working on creating professional betting strategies. Check back soon for exciting opportunities!
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {sellerProfile.strategies.map((strategy, _index) => {
                    const isSubscribed = isSubscribedToStrategy(strategy.strategy_id)
                    const subscription = getSubscriptionToStrategy(strategy.strategy_id)
                    
                    return (
                      <div key={strategy.strategy_id} className="group bg-white border border-blue-200/40 rounded-2xl hover:shadow-xl hover:border-blue-400/60 transition-all duration-300 overflow-hidden">
                        {/* Strategy Card Header */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 border-b border-blue-200/50 p-4">
                          <div className="flex flex-col lg:flex-row lg:items-center space-y-3 lg:space-y-0 lg:space-x-4">
                            {/* Profile Photo */}
                            <div className="flex-shrink-0 mx-auto lg:mx-0">
                              {sellerProfile.profile_img || sellerProfile.profile_picture_url ? (
                                <img
                                  src={sellerProfile.profile_img || sellerProfile.profile_picture_url || ''}
                                  alt={sellerProfile.username}
                                  className="h-12 w-12 rounded-xl border-2 border-blue-200 object-cover shadow-lg ring-2 ring-blue-100"
                                  onError={e => {
                                    e.currentTarget.style.display = 'none'
                                    const fallback = document.createElement('div')
                                    fallback.className = 'h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-base border-2 border-blue-200 shadow-lg ring-2 ring-blue-100'
                                    fallback.textContent = sellerProfile.username.charAt(0).toUpperCase()
                                    e.currentTarget.parentNode?.appendChild(fallback)
                                  }}
                                />
                              ) : (
                                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-base border-2 border-blue-200 shadow-lg ring-2 ring-blue-100">
                                  {sellerProfile.username.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1 text-center lg:text-left">
                              <div className="space-y-2">
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-1 lg:space-y-0">
                                  <div>
                                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
                                      {strategy.strategy_name}
                                    </h3>
                                    <div className="flex items-center justify-center lg:justify-start space-x-2 flex-wrap">
                                      {strategy.is_verified_seller && (
                                        <div className="flex items-center rounded-full bg-emerald-100 border border-emerald-200 px-2 py-1 text-xs font-semibold text-emerald-800 shadow-sm">
                                          <CheckCircle className="mr-1 h-3 w-3" />
                                          Verified
                                        </div>
                                      )}
                                      <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 border border-blue-200 text-blue-800 font-medium text-xs shadow-sm">
                                        {strategy.strategy_type}
                                      </span>
                                      <span className="inline-flex items-center px-2 py-1 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-800 font-medium text-xs shadow-sm">
                                        {strategy.primary_sport}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Strategy Description */}
                                {strategy.strategy_description && strategy.strategy_description.trim() ? (
                                  <div className="bg-white/80 rounded-lg p-2.5 border border-blue-200/50">
                                    <p className="text-gray-700 text-sm leading-relaxed">
                                      {strategy.strategy_description}
                                    </p>
                                  </div>
                                ) : (
                                  <div className="bg-blue-50/50 rounded-lg p-2.5 border border-blue-200/50">
                                    <p className="text-blue-500 italic text-sm">
                                      Professional betting strategy with proven performance metrics.
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Strategy Card Body */}
                        <div className="p-4">
                          {/* Stats Grid */}
                          <div className="grid grid-cols-3 gap-3 mb-4">
                            <div className="text-center bg-gradient-to-br from-blue-50 to-white rounded-xl p-3 border border-blue-200/50 shadow-sm hover:shadow-md transition-shadow">
                              <div className={`text-xl font-bold mb-1 ${
                                strategy.roi_percentage >= 0 ? 'text-emerald-600' : 'text-red-500'
                              }`}>
                                {strategy.roi_percentage >= 0 ? '+' : ''}
                                {strategy.roi_percentage.toFixed(1)}%
                              </div>
                              <div className="text-xs text-blue-600 font-semibold uppercase tracking-wider">ROI</div>
                            </div>
                            <div className="text-center bg-gradient-to-br from-blue-50 to-white rounded-xl p-3 border border-blue-200/50 shadow-sm hover:shadow-md transition-shadow">
                              <div className="text-xl font-bold text-blue-600 mb-1">
                                {(strategy.win_rate * 100).toFixed(1)}%
                              </div>
                              <div className="text-xs text-blue-600 font-semibold uppercase tracking-wider">Win Rate</div>
                            </div>
                            <div className="text-center bg-gradient-to-br from-blue-50 to-white rounded-xl p-3 border border-blue-200/50 shadow-sm hover:shadow-md transition-shadow">
                              <div className="text-xl font-bold text-indigo-600 mb-1">
                                {strategy.total_bets}
                              </div>
                              <div className="text-xs text-blue-600 font-semibold uppercase tracking-wider">Total Bets</div>
                            </div>
                          </div>
                          
                          {/* Pricing Section */}
                          <div className="bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl p-3 mb-4 border border-blue-300/50 shadow-sm">
                            <h4 className="text-sm font-bold text-blue-800 mb-2 text-center">Subscription Plans</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              {strategy.subscription_price_weekly > 0 && (
                                <div className="bg-white rounded-lg p-2.5 border border-blue-200/50 text-center hover:shadow-md transition-shadow">
                                  <div className="text-base font-bold text-gray-900">${strategy.subscription_price_weekly}</div>
                                  <div className="text-xs text-blue-600 font-medium">per week</div>
                                </div>
                              )}
                              {strategy.subscription_price_monthly > 0 && (
                                <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg p-2.5 border-2 border-gray-300 text-center shadow-lg transform hover:scale-105 transition-transform">
                                  <div className="text-base font-bold text-gray-900">${strategy.subscription_price_monthly}</div>
                                  <div className="text-xs font-medium text-gray-600">per month</div>
                                  <div className="text-xs font-bold bg-blue-600 text-white rounded-full px-1.5 py-0.5 mt-0.5">Popular</div>
                                </div>
                              )}
                              {strategy.subscription_price_yearly > 0 && (
                                <div className="bg-white rounded-lg p-2.5 border border-blue-200/50 text-center hover:shadow-md transition-shadow">
                                  <div className="text-base font-bold text-gray-900">${strategy.subscription_price_yearly}</div>
                                  <div className="text-xs text-blue-600 font-medium">per year</div>
                                  <div className="text-xs text-emerald-600 font-bold">Best Value</div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Subscribe Button */}
                          <div className="flex justify-center">
                            {isSubscribed && subscription ? (
                              <div className="text-center bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-xl px-4 py-3 w-full max-w-sm shadow-lg">
                                <div className="flex items-center justify-center space-x-2 text-emerald-700 font-bold text-sm">
                                  <CheckCircle className="h-4 w-4" />
                                  <span>Active Subscription</span>
                                </div>
                                <div className="text-xs text-emerald-600 font-medium capitalize mt-0.5">
                                  {subscription.frequency} plan - Premium Access
                                </div>
                              </div>
                            ) : (
                              <Button
                                onClick={() => handleSubscribeClick(strategy.strategy_id)}
                                disabled={subscriptionLoading}
                                className="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 text-white w-full max-w-sm px-6 py-3 text-sm font-bold rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-200 border border-blue-400 ring-2 ring-blue-200/50 hover:ring-blue-300/70"
                              >
                                {subscriptionLoading ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                  </>
                                ) : (
                                  "Subscribe Now"
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
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
      </div>
    </div>
  )
}