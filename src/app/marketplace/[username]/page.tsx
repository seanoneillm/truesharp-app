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
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
            <div className="relative">
              {/* Banner */}
              <div
                className={cn(
                  'h-20 sm:h-28 bg-gradient-to-r from-gray-100 to-gray-200 relative overflow-hidden',
                  sellerProfile.banner_img && 'bg-none'
                )}
              >
                {sellerProfile.banner_img ? (
                  <>
                    <img
                      src={sellerProfile.banner_img}
                      alt="Profile banner"
                      className="h-20 sm:h-28 w-full object-cover"
                      onError={e => {
                        console.log('Banner image failed to load:', sellerProfile.banner_img)
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                  </>
                ) : null}
              </div>

              {/* Profile Content */}
              <div className="px-4 pb-3 -mt-10 sm:-mt-12">
                <div className="flex flex-col sm:flex-row sm:items-end space-y-2 sm:space-y-0 sm:space-x-4">
                  {/* Profile Image */}
                  <div className="relative flex-shrink-0 mx-auto sm:mx-0">
                    {sellerProfile.profile_img || sellerProfile.profile_picture_url ? (
                      <img
                        src={sellerProfile.profile_img || sellerProfile.profile_picture_url || ''}
                        alt={sellerProfile.username}
                        className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl border-4 border-white object-cover shadow-lg"
                        onError={e => {
                          console.log(
                            'Profile image failed to load:',
                            sellerProfile.profile_img || sellerProfile.profile_picture_url
                          )
                          e.currentTarget.style.display = 'none'
                          const fallback = document.createElement('div')
                          fallback.className =
                            'h-16 w-16 sm:h-20 sm:w-20 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg sm:text-xl border-4 border-white shadow-lg'
                          fallback.textContent = sellerProfile.username.charAt(0).toUpperCase()
                          e.currentTarget.parentNode?.appendChild(fallback)
                        }}
                      />
                    ) : (
                      <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-xl border-4 border-white bg-gradient-to-br from-blue-500 to-indigo-600 text-lg sm:text-xl font-bold text-white shadow-lg">
                        {sellerProfile.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {sellerProfile.is_verified_seller && (
                      <div className="absolute -bottom-1 -right-1">
                        <div className="rounded-full bg-emerald-500 p-1 shadow-md ring-2 ring-white">
                          <CheckCircle className="h-3 w-3 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Profile Info */}
                  <div className="flex-1 min-w-0 text-center sm:text-left">
                    <div className="space-y-1">
                      {/* Header with username */}
                      <div>
                        <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                          @{sellerProfile.username}
                        </h1>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-0.5">
                          {sellerProfile.is_verified_seller && (
                            <span className="text-xs font-medium text-emerald-700">
                              <CheckCircle className="inline mr-1 h-3 w-3" />
                              Verified
                            </span>
                          )}
                          <span className="text-xs font-medium text-gray-700">
                            <Store className="inline mr-1 h-3 w-3" />
                            <span className="font-semibold">{sellerProfile.strategies.length}</span>
                            <span className="ml-1">{sellerProfile.strategies.length === 1 ? 'strategy' : 'strategies'}</span>
                          </span>
                        </div>
                      </div>
                      
                      {/* Bio */}
                      {sellerProfile.bio && sellerProfile.bio.trim() ? (
                        <div className="mt-1.5">
                          <p className="text-gray-700 text-sm leading-relaxed">
                            {sellerProfile.bio}
                          </p>
                        </div>
                      ) : (
                        <div className="mt-1.5">
                          <p className="text-gray-500 italic text-xs">
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
                      <div key={strategy.strategy_id} className="group bg-white border-2 border-gray-200 rounded-xl hover:shadow-lg hover:border-gray-300 transition-all duration-200 overflow-hidden">
                        {/* Strategy Card Header */}
                        <div className="p-4">
                          <div className="flex items-center space-x-3 mb-3">
                            {/* Profile Photo */}
                            <div className="flex-shrink-0">
                              {sellerProfile.profile_img || sellerProfile.profile_picture_url ? (
                                <img
                                  src={sellerProfile.profile_img || sellerProfile.profile_picture_url || ''}
                                  alt={sellerProfile.username}
                                  className="h-8 w-8 rounded-lg object-cover"
                                  onError={e => {
                                    e.currentTarget.style.display = 'none'
                                    const fallback = document.createElement('div')
                                    fallback.className = 'h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs'
                                    fallback.textContent = sellerProfile.username.charAt(0).toUpperCase()
                                    e.currentTarget.parentNode?.appendChild(fallback)
                                  }}
                                />
                              ) : (
                                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                                  {sellerProfile.username.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-gray-900">
                                {strategy.strategy_name}
                              </h3>
                              <div className="flex items-center space-x-2 text-xs text-gray-600 mt-0.5">
                                {strategy.is_verified_seller && (
                                  <span className="text-emerald-700">
                                    <CheckCircle className="inline mr-1 h-3 w-3" />
                                    Verified
                                  </span>
                                )}
                                <span>{strategy.strategy_type}</span>
                                <span>•</span>
                                <span>{strategy.primary_sport}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Strategy Description */}
                          {strategy.strategy_description && strategy.strategy_description.trim() ? (
                            <div className="mb-4">
                              <p className="text-gray-700 text-sm leading-relaxed">
                                {strategy.strategy_description}
                              </p>
                            </div>
                          ) : (
                            <div className="mb-4">
                              <p className="text-gray-500 italic text-sm">
                                Professional betting strategy with proven performance metrics.
                              </p>
                            </div>
                          )}

                          {/* Stats Grid */}
                          <div className="grid grid-cols-3 gap-4 mb-4 py-3 border-t border-b border-gray-200">
                            <div className="text-center">
                              <div className={`text-xl font-bold ${
                                strategy.roi_percentage >= 0 ? 'text-emerald-600' : 'text-red-500'
                              }`}>
                                {strategy.roi_percentage >= 0 ? '+' : ''}
                                {strategy.roi_percentage.toFixed(1)}%
                              </div>
                              <div className="text-xs text-gray-600 font-medium uppercase tracking-wider">ROI</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xl font-bold text-gray-900">
                                {(strategy.win_rate * 100).toFixed(1)}%
                              </div>
                              <div className="text-xs text-gray-600 font-medium uppercase tracking-wider">Win Rate</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xl font-bold text-gray-900">
                                {strategy.total_bets}
                              </div>
                              <div className="text-xs text-gray-600 font-medium uppercase tracking-wider">Total Bets</div>
                            </div>
                          </div>
                          
                          {/* Pricing Section */}
                          <div className="mb-4">
                            <h4 className="text-sm font-bold text-gray-800 mb-2">Subscription Plans</h4>
                            {(() => {
                              const availablePlans = []
                              if (strategy.subscription_price_weekly > 0) {
                                availablePlans.push({
                                  price: strategy.subscription_price_weekly,
                                  label: 'weekly',
                                  badge: null
                                })
                              }
                              if (strategy.subscription_price_monthly > 0) {
                                availablePlans.push({
                                  price: strategy.subscription_price_monthly,
                                  label: 'monthly',
                                  badge: 'Popular'
                                })
                              }
                              if (strategy.subscription_price_yearly > 0) {
                                availablePlans.push({
                                  price: strategy.subscription_price_yearly,
                                  label: 'yearly',
                                  badge: 'Best Value'
                                })
                              }
                              
                              const gridCols = availablePlans.length === 1 ? 'grid-cols-1' : 
                                               availablePlans.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
                              
                              return (
                                <div className={`grid ${gridCols} gap-1`}>
                                  {availablePlans.map((plan, index) => (
                                    <div 
                                      key={plan.label} 
                                      className={`text-center py-1 ${
                                        availablePlans.length === 3 && index === 1 ? 'border-l border-r border-gray-200' : ''
                                      }`}
                                    >
                                      <div className="text-sm font-bold text-gray-900">${plan.price}</div>
                                      <div className="text-xs text-gray-600">{plan.label}</div>
                                      {plan.badge && (
                                        <div className={`text-xs font-bold ${
                                          plan.badge === 'Popular' ? 'text-blue-600' : 'text-emerald-600'
                                        }`}>
                                          {plan.badge}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )
                            })()}
                          </div>
                          
                          {/* Subscribe Button */}
                          <div className="flex justify-center">
                            {isSubscribed && subscription ? (
                              <div className="text-center w-full">
                                <div className="text-emerald-700 font-bold text-sm">
                                  <CheckCircle className="inline mr-2 h-4 w-4" />
                                  Active Subscription
                                </div>
                                <div className="text-xs text-emerald-600 font-medium capitalize">
                                  {subscription.frequency} plan
                                </div>
                              </div>
                            ) : (
                              <Button
                                onClick={() => handleSubscribeClick(strategy.strategy_id)}
                                disabled={subscriptionLoading}
                                className="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 text-white w-full px-6 py-3 text-sm font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
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