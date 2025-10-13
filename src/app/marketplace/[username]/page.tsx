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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-100">
        <div className="container mx-auto px-4 py-4 sm:py-8 max-w-6xl">
          <div className="space-y-6 sm:space-y-8">
            <div className="animate-pulse">
              {/* Back button and branding skeleton */}
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <div className="h-10 w-32 rounded-lg bg-white/60"></div>
                <div className="h-10 w-24 rounded-full bg-white/60"></div>
              </div>
              
              {/* Enhanced header skeleton */}
              <div className="rounded-2xl bg-white/80 backdrop-blur-sm shadow-xl overflow-hidden mb-6 sm:mb-8">
                <div className="h-40 sm:h-56 bg-gradient-to-br from-blue-200 to-purple-200"></div>
                <div className="p-6">
                  <div className="bg-slate-100 rounded-xl p-4 mb-6">
                    <div className="h-4 w-3/4 rounded bg-slate-200 mb-2"></div>
                    <div className="h-3 w-1/2 rounded bg-slate-200"></div>
                  </div>
                  <div className="flex justify-end">
                    <div className="h-8 w-24 rounded-lg bg-slate-200"></div>
                  </div>
                </div>
              </div>
              
              {/* Enhanced strategies section skeleton */}
              <div className="rounded-2xl bg-white/80 backdrop-blur-sm shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-slate-800 to-blue-800 p-6 sm:p-8">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-xl bg-white/20"></div>
                    <div>
                      <div className="h-6 w-32 rounded bg-white/30 mb-2"></div>
                      <div className="h-4 w-24 rounded bg-white/20"></div>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 sm:p-8 space-y-6">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50 overflow-hidden border border-slate-200/60">
                      <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-4 sm:p-6 border-b border-slate-200/50">
                        <div className="h-7 w-2/3 rounded bg-slate-200 mb-3"></div>
                        <div className="flex space-x-2">
                          <div className="h-6 w-20 rounded-full bg-slate-200"></div>
                          <div className="h-6 w-16 rounded-full bg-slate-200"></div>
                        </div>
                      </div>
                      <div className="p-4 sm:p-6">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                          {[...Array(4)].map((_, j) => (
                            <div key={j} className="bg-white rounded-xl p-4 border border-slate-200/50">
                              <div className="h-6 w-12 rounded bg-slate-200 mb-2 mx-auto"></div>
                              <div className="h-3 w-8 rounded bg-slate-200 mx-auto"></div>
                            </div>
                          ))}
                        </div>
                        <div className="bg-slate-50 rounded-xl p-4 mb-6">
                          <div className="h-4 w-32 rounded bg-slate-200 mb-3"></div>
                          <div className="flex gap-3">
                            {[...Array(3)].map((_, k) => (
                              <div key={k} className="flex-1 bg-white rounded-lg p-3 border border-slate-200/50">
                                <div className="h-5 w-16 rounded bg-slate-200 mb-1 mx-auto"></div>
                                <div className="h-3 w-12 rounded bg-slate-200 mx-auto"></div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex justify-center">
                          <div className="h-12 w-40 rounded-xl bg-slate-200"></div>
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center bg-white/95 backdrop-blur-md rounded-2xl p-8 sm:p-12 shadow-2xl border border-white/60 max-w-md">
              <div className="bg-gradient-to-br from-slate-100 to-blue-100 rounded-2xl p-6 mb-6">
                <Store className="mx-auto mb-4 h-16 w-16 text-slate-400" />
              </div>
              <h1 className="mb-4 text-2xl sm:text-3xl font-bold text-slate-900">Seller not found</h1>
              <p className="mb-6 text-slate-600 leading-relaxed">
                {error || "The seller you're looking for doesn't exist or may have been removed."}
              </p>
              <Link href="/marketplace">
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-100">
      <div className="container mx-auto px-4 py-4 sm:py-8 max-w-6xl">
        <div className="space-y-6 sm:space-y-8">
          {/* Back Button and Branding */}
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <Link href="/marketplace">
              <Button variant="outline" className="bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg border-white/20 text-slate-700 hover:text-slate-900 transition-all">
                <ArrowLeft className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Back to Marketplace</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </Link>
            <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-full px-3 py-2 shadow-lg border border-white/30">
              <TrueSharpShield className="h-5 w-5" />
              <span className="font-bold text-sm text-slate-700 hidden sm:inline tracking-tight">TrueSharp</span>
            </div>
          </div>

          {/* Profile Header */}
          <div className="overflow-hidden rounded-2xl border border-white/60 bg-white/95 backdrop-blur-md shadow-2xl">
            <div className="relative">
              {/* Banner */}
              <div
                className={cn(
                  'h-40 sm:h-56 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 relative overflow-hidden',
                  sellerProfile.banner_img && 'bg-none'
                )}
              >
                {/* Decorative Pattern Overlay */}
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12"></div>
                  <div className="absolute top-4 right-4 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
                  <div className="absolute bottom-4 left-4 w-24 h-24 bg-white/5 rounded-full blur-lg"></div>
                </div>

                {sellerProfile.banner_img ? (
                  <>
                    <img
                      src={sellerProfile.banner_img}
                      alt="Profile banner"
                      className="h-40 sm:h-56 w-full object-cover"
                      onError={e => {
                        console.log('Banner image failed to load:', sellerProfile.banner_img)
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                    {/* Enhanced overlay for better text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                  </>
                ) : null}
                
                {/* Profile Content - Improved Mobile Layout */}
                <div className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-end">
                  <div className="flex flex-col space-y-4">
                    {/* Profile Image and Basic Info */}
                    <div className="flex items-end space-x-4">
                      {/* Profile Image */}
                      <div className="relative flex-shrink-0">
                        {sellerProfile.profile_img || sellerProfile.profile_picture_url ? (
                          <img
                            src={sellerProfile.profile_img || sellerProfile.profile_picture_url || ''}
                            alt={sellerProfile.username}
                            className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl border-4 border-white object-cover shadow-2xl ring-4 ring-white/20"
                            onError={e => {
                              console.log(
                                'Profile image failed to load:',
                                sellerProfile.profile_img || sellerProfile.profile_picture_url
                              )
                              e.currentTarget.style.display = 'none'
                              // Show fallback
                              const fallback = document.createElement('div')
                              fallback.className =
                                'h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl sm:text-2xl border-4 border-white shadow-2xl ring-4 ring-white/20'
                              fallback.textContent = sellerProfile.username.charAt(0).toUpperCase()
                              e.currentTarget.parentNode?.appendChild(fallback)
                            }}
                          />
                        ) : (
                          <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br from-blue-500 to-purple-600 text-xl sm:text-2xl font-bold text-white shadow-2xl ring-4 ring-white/20">
                            {sellerProfile.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {sellerProfile.is_verified_seller && (
                          <div className="absolute -bottom-2 -right-2">
                            <div className="rounded-full bg-emerald-500 p-1.5 shadow-lg ring-2 ring-white">
                              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Username and Stats - Improved spacing */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="space-y-1">
                          <h1 className="text-xl sm:text-2xl font-bold text-white truncate drop-shadow-lg">
                            @{sellerProfile.username}
                          </h1>
                          <div className="flex flex-wrap items-center gap-2">
                            {sellerProfile.is_verified_seller && (
                              <div className="flex items-center rounded-full bg-emerald-500/90 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-white shadow-lg">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Verified Seller
                              </div>
                            )}
                            <div className="flex items-center rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-xs text-white shadow-lg">
                              <Store className="mr-1 h-3 w-3" />
                              <span className="font-medium">{sellerProfile.strategies.length}</span>
                              <span className="ml-1">strategies</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio and Action Section - Enhanced */}
              <div className="p-6">
                {/* Bio with better typography */}
                <div className="mb-6">
                  {sellerProfile.bio && sellerProfile.bio.trim() ? (
                    <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-4 border border-slate-200/50">
                      <p className="text-slate-700 text-sm leading-relaxed font-medium">
                        {sellerProfile.bio}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/50">
                      <p className="text-slate-400 italic text-sm text-center">
                        No bio available
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Action Button - Enhanced */}
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={copyProfileLink}
                    size="sm"
                    className={cn(
                      "bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg border-slate-200 text-slate-700 hover:text-slate-900 transition-all hover:shadow-xl",
                      copySuccess && 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    )}
                  >
                    {copySuccess ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">Link Copied!</span>
                        <span className="sm:hidden">✓ Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">Copy Profile Link</span>
                        <span className="sm:hidden">Share</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Strategies Section */}
          <div className="rounded-2xl border border-white/60 bg-white/95 backdrop-blur-md shadow-2xl overflow-hidden">
            {/* Section Header with Gradient */}
            <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2">
                    <TrueSharpShield className="h-6 w-6 text-white" variant="light" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white">
                      Strategies
                    </h2>
                    <p className="text-blue-100 text-sm">
                      {sellerProfile.strategies.length} available strategies
                    </p>
                  </div>
                </div>
                <div className="hidden sm:block">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
                    <p className="text-blue-100 text-sm">
                      By @{sellerProfile.username}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Strategies Content */}
            <div className="p-6 sm:p-8">
              {sellerProfile.strategies.length === 0 ? (
                <div className="py-16 sm:py-20 text-center">
                  <div className="bg-gradient-to-br from-slate-100 to-blue-50 rounded-2xl p-8 sm:p-12 border border-slate-200/50">
                    <Store className="mx-auto mb-6 h-16 w-16 sm:h-20 sm:w-20 text-slate-400" />
                    <div className="mb-4 text-xl sm:text-2xl font-bold text-slate-700">No strategies available</div>
                    <div className="text-slate-500 max-w-md mx-auto text-sm sm:text-base leading-relaxed">
                      This seller hasn't created any public strategies yet. Check back later for exciting new betting strategies!
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {sellerProfile.strategies.map((strategy, _index) => {
                    const isSubscribed = isSubscribedToStrategy(strategy.strategy_id)
                    const subscription = getSubscriptionToStrategy(strategy.strategy_id)
                    
                    return (
                      <div key={strategy.strategy_id} className="group bg-gradient-to-br from-white to-slate-50/50 border border-slate-200/60 rounded-2xl overflow-hidden hover:shadow-2xl hover:border-blue-200/60 transition-all duration-300 hover:-translate-y-1">
                        {/* Strategy Card Header */}
                        <div className="bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-6 border-b border-slate-200/50">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                            <div className="flex-1">
                              <div className="flex flex-col space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 flex-shrink-0">
                                    {strategy.strategy_name}
                                  </h3>
                                  <div className="flex items-center space-x-2 flex-wrap">
                                    {strategy.is_verified_seller && (
                                      <div className="flex items-center rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-800 shadow-sm">
                                        <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                                        Verified
                                      </div>
                                    )}
                                    {strategy.overall_rank && (
                                      <div className="rounded-full bg-gradient-to-r from-yellow-100 to-orange-100 px-3 py-1.5 text-xs font-semibold text-yellow-800 shadow-sm">
                                        🏆 Rank #{strategy.overall_rank}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-4 text-sm">
                                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-medium capitalize">
                                    {strategy.strategy_type}
                                  </span>
                                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 text-purple-800 font-medium">
                                    {strategy.primary_sport}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Strategy Card Body */}
                        <div className="p-4 sm:p-6">
                          {/* Enhanced Stats Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                            <div className="text-center bg-gradient-to-br from-white to-slate-50 rounded-xl p-4 border border-slate-200/50 shadow-sm hover:shadow-md transition-shadow">
                              <div className={`text-xl sm:text-2xl font-bold mb-1 ${
                                strategy.roi_percentage >= 0 ? 'text-emerald-600' : 'text-red-500'
                              }`}>
                                {strategy.roi_percentage >= 0 ? '+' : ''}
                                {strategy.roi_percentage.toFixed(1)}%
                              </div>
                              <div className="text-xs sm:text-sm text-slate-500 font-medium uppercase tracking-wide">ROI</div>
                            </div>
                            <div className="text-center bg-gradient-to-br from-white to-blue-50 rounded-xl p-4 border border-slate-200/50 shadow-sm hover:shadow-md transition-shadow">
                              <div className="text-xl sm:text-2xl font-bold text-blue-600 mb-1">
                                {(strategy.win_rate * 100).toFixed(1)}%
                              </div>
                              <div className="text-xs sm:text-sm text-slate-500 font-medium uppercase tracking-wide">Win Rate</div>
                            </div>
                            <div className="text-center bg-gradient-to-br from-white to-purple-50 rounded-xl p-4 border border-slate-200/50 shadow-sm hover:shadow-md transition-shadow">
                              <div className="text-xl sm:text-2xl font-bold text-purple-600 mb-1">
                                {strategy.total_bets}
                              </div>
                              <div className="text-xs sm:text-sm text-slate-500 font-medium uppercase tracking-wide">Total Bets</div>
                            </div>
                            <div className="text-center bg-gradient-to-br from-white to-orange-50 rounded-xl p-4 border border-slate-200/50 shadow-sm hover:shadow-md transition-shadow">
                              <div className="text-xl sm:text-2xl font-bold text-orange-600 mb-1">
                                {Math.round((strategy.winning_bets / strategy.total_bets) * 100) || 0}%
                              </div>
                              <div className="text-xs sm:text-sm text-slate-500 font-medium uppercase tracking-wide">Success</div>
                            </div>
                          </div>
                          
                          {/* Enhanced Pricing Section */}
                          <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-4 mb-6 border border-slate-200/50">
                            <h4 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Subscription Options</h4>
                            <div className="flex flex-col sm:flex-row gap-3">
                              {strategy.subscription_price_weekly > 0 && (
                                <div className="flex-1 bg-white rounded-lg p-3 border border-slate-200/50 text-center">
                                  <div className="text-lg font-bold text-emerald-600">${strategy.subscription_price_weekly}</div>
                                  <div className="text-xs text-slate-500 font-medium">per week</div>
                                </div>
                              )}
                              {strategy.subscription_price_monthly > 0 && (
                                <div className="flex-1 bg-white rounded-lg p-3 border border-blue-200/50 text-center ring-2 ring-blue-200/50">
                                  <div className="text-lg font-bold text-blue-600">${strategy.subscription_price_monthly}</div>
                                  <div className="text-xs text-slate-500 font-medium">per month</div>
                                  <div className="text-xs text-blue-600 font-semibold mt-1">Popular</div>
                                </div>
                              )}
                              {strategy.subscription_price_yearly > 0 && (
                                <div className="flex-1 bg-white rounded-lg p-3 border border-slate-200/50 text-center">
                                  <div className="text-lg font-bold text-purple-600">${strategy.subscription_price_yearly}</div>
                                  <div className="text-xs text-slate-500 font-medium">per year</div>
                                  <div className="text-xs text-purple-600 font-semibold mt-1">Best Value</div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Subscribe Button */}
                          <div className="flex justify-center">
                            {isSubscribed && subscription ? (
                              <div className="text-center bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl px-6 py-4 shadow-sm">
                                <div className="flex items-center justify-center space-x-2 text-emerald-700 font-semibold mb-1">
                                  <CheckCircle className="h-5 w-5" />
                                  <span>Active Subscription</span>
                                </div>
                                <div className="text-xs text-emerald-600 capitalize">
                                  {subscription.frequency} plan
                                </div>
                              </div>
                            ) : (
                              <Button
                                onClick={() => handleSubscribeClick(strategy.strategy_id)}
                                disabled={subscriptionLoading}
                                size="lg"
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto px-8 py-3 text-base font-semibold rounded-xl"
                              >
                                {subscriptionLoading ? (
                                  <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    Subscribe Now
                                    <span className="ml-2">→</span>
                                  </>
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