'use client'

import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { StrategyCard } from '@/components/marketplace/strategy-card'
import { SubscriptionPricingModal } from '@/components/marketplace/subscription-pricing-modal'
import { useAuth } from '@/lib/hooks/use-auth'
import { useSubscribe } from '@/lib/hooks/use-subscribe'
import { Search, Store, X, TrendingUp, Target, Activity, Users as UsersIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface StrategyData {
  id: string
  strategy_id: string
  user_id: string // Add user_id for seller identification
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
  leaderboard_score?: number // Composite algorithm score
  last_bet_date: string | null
  last_updated: string
  created_at: string
  start_date?: string // Start date for strategy filtering
}

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLeague, setSelectedLeague] = useState('all')
  const [sortBy, setSortBy] = useState('leaderboard')
  const [showAlgorithmModal, setShowAlgorithmModal] = useState(false)

  const [strategies, setStrategies] = useState<StrategyData[]>([])
  const [strategiesLoading, setStrategiesLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      router.push('/login?redirect=' + encodeURIComponent('/marketplace'))
      return
    }

    const strategy = strategies.find(s => s.strategy_id === strategyId)
    if (strategy) {
      setSelectedStrategy(strategy)
      setSubscriptionModalOpen(true)
    }
  }

  // Handle subscription purchase
  const handleSubscribe = async (frequency: 'weekly' | 'monthly' | 'yearly', price: number) => {
    if (!selectedStrategy || !user) return

    try {
      const result = await subscribe({
        strategyId: selectedStrategy.strategy_id,
        sellerId: selectedStrategy.user_id, // Use the actual user_id of the seller
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

        // Show success message (you might want to add a toast notification here)
        console.log('Successfully subscribed to strategy!')
      } else {
        console.error('Subscription failed:', result.error)
        // Handle error (show toast, etc.)
      }
    } catch (error) {
      console.error('Subscription error:', error)
    }
  }

  const handleCloseSubscriptionModal = () => {
    setSubscriptionModalOpen(false)
    setSelectedStrategy(null)
  }

  // Fetch strategies data
  useEffect(() => {
    const fetchStrategies = async () => {
      try {
        setStrategiesLoading(true)
        const params = new URLSearchParams({
          sort: sortBy,
          limit: '50',
        })

        if (selectedLeague !== 'all') {
          params.append('league', selectedLeague)
        }

        const response = await fetch(`/api/marketplace?${params.toString()}`)
        const data = await response.json()

        if (data.error) {
          setError(data.error)
        } else {
          setStrategies(data.data || [])
        }
      } catch (err) {
        setError('Failed to load strategies')
        console.error('Error fetching strategies:', err)
      } finally {
        setStrategiesLoading(false)
      }
    }

    fetchStrategies()
  }, [sortBy, selectedLeague])

  // Load user's existing subscriptions
  useEffect(() => {
    const loadSubscriptions = async () => {
      if (!isAuthenticated || !user || strategies.length === 0) return

      try {
        const subscriptionPromises = strategies.map(async strategy => {
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
  }, [strategies, isAuthenticated, user, checkSubscription])

  // Filter strategies based on search
  const filteredStrategies = strategies.filter(strategy => {
    const matchesSearch =
      !searchQuery ||
      strategy.strategy_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      strategy.strategy_description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      strategy.username.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesSearch
  })

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <Store className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Strategy Marketplace</h1>
                <p className="mt-1 text-lg text-slate-600">
                  Discover and subscribe to proven betting strategies
                </p>
              </div>
            </div>
          </div>

          {/* Marketplace Info */}
          <div className="hidden items-center space-x-8 lg:flex">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">{strategies.length}</div>
              <div className="text-sm text-slate-600">Active Strategies</div>
            </div>
            <button
              onClick={() => setShowAlgorithmModal(true)}
              className="text-center group cursor-pointer hover:bg-slate-50 p-3 rounded-lg transition-colors"
            >
              <div className="text-sm font-medium text-blue-600 group-hover:text-blue-700">
                How Rankings Work
              </div>
              <div className="text-xs text-slate-500">Learn about our algorithm</div>
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search strategies..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="block w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <select
            value={selectedLeague}
            onChange={e => setSelectedLeague(e.target.value)}
            className="min-w-[160px] rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Leagues</option>
            
            {/* American Sports */}
            <optgroup label="American Sports">
              <option value="NFL">NFL</option>
              <option value="NBA">NBA</option>
              <option value="MLB">MLB</option>
              <option value="NHL">NHL</option>
              <option value="NCAAF">NCAAF</option>
              <option value="NCAAB">NCAAB</option>
              <option value="WNBA">WNBA</option>
              <option value="CFL">CFL</option>
              <option value="XFL">XFL</option>
            </optgroup>
            
            {/* Soccer */}
            <optgroup label="Soccer">
              <option value="Premier League">Premier League</option>
              <option value="Champions League">Champions League</option>
              <option value="Europa League">Europa League</option>
              <option value="La Liga">La Liga</option>
              <option value="Serie A">Serie A</option>
              <option value="Bundesliga">Bundesliga</option>
              <option value="Ligue 1">Ligue 1</option>
              <option value="MLS">MLS</option>
            </optgroup>
            
            {/* Individual Sports */}
            <optgroup label="Individual Sports">
              <option value="ATP Tour">ATP Tour</option>
              <option value="WTA Tour">WTA Tour</option>
              <option value="PGA Tour">PGA Tour</option>
              <option value="UFC">UFC</option>
              <option value="Bellator">Bellator</option>
              <option value="Boxing">Boxing</option>
              <option value="Formula 1">Formula 1</option>
              <option value="NASCAR">NASCAR</option>
            </optgroup>
          </select>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="min-w-[160px] rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="leaderboard">Leaderboard Rank</option>
            <option value="roi">Highest ROI</option>
            <option value="winRate">Best Win Rate</option>
            <option value="totalBets">Most Active</option>
          </select>
        </div>

        {/* Top Performers Section */}
        {!strategiesLoading && !error && filteredStrategies.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 flex items-center text-xl font-bold text-slate-900">
              <span className="mr-3 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 px-3 py-1 text-sm font-bold text-white">
                TOP PERFORMERS
              </span>
              Elite Strategy Rankings
            </h2>
            <div className="space-y-4">
              {filteredStrategies
                .filter(s => s.rank && s.rank <= 3)
                .slice(0, 3)
                .map((strategy, index) => (
                  <StrategyCard
                    key={strategy.id}
                    strategy={strategy}
                    index={index}
                    isSubscribed={isSubscribedToStrategy(strategy.strategy_id)}
                    subscription={getSubscriptionToStrategy(strategy.strategy_id)}
                    onSubscribe={handleSubscribeClick}
                    isLoading={subscriptionLoading}
                  />
                ))}
            </div>
          </div>
        )}

        {/* Strategies List */}
        <div>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">
              All Strategies ({filteredStrategies.length})
            </h2>
            <div className="text-sm text-slate-600">
              Sorted by{' '}
              {sortBy === 'leaderboard'
                ? 'Leaderboard Ranking'
                : sortBy === 'roi'
                  ? 'ROI Performance'
                  : sortBy === 'winRate'
                    ? 'Win Rate'
                    : 'Activity'}
            </div>
          </div>

          {strategiesLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse rounded-lg border p-6">
                  <div className="flex items-center space-x-4">
                    <div className="h-8 w-8 rounded-full bg-slate-200"></div>
                    <div className="flex-1">
                      <div className="mb-2 h-4 w-1/4 rounded bg-slate-200"></div>
                      <div className="h-3 w-1/2 rounded bg-slate-200"></div>
                    </div>
                    <div className="h-8 w-20 rounded bg-slate-200"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
              <div className="mb-2 font-medium text-red-600">Failed to load strategies</div>
              <div className="text-sm text-red-500">{error}</div>
            </div>
          ) : filteredStrategies.length === 0 ? (
            <div className="rounded-lg border p-8 text-center">
              <Store className="mx-auto mb-4 h-12 w-12 text-slate-400" />
              <div className="mb-2 font-medium text-slate-600">No strategies available</div>
              <div className="text-sm text-slate-500">
                Check back later for new strategy listings
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredStrategies.map((strategy, index) => (
                <StrategyCard
                  key={strategy.id}
                  strategy={strategy}
                  index={index}
                  isSubscribed={isSubscribedToStrategy(strategy.strategy_id)}
                  subscription={getSubscriptionToStrategy(strategy.strategy_id)}
                  onSubscribe={handleSubscribeClick}
                  isLoading={subscriptionLoading}
                />
              ))}
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

        {/* Leaderboard Algorithm Modal */}
        {showAlgorithmModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              {/* Background overlay */}
              <div 
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                onClick={() => setShowAlgorithmModal(false)}
              ></div>

              {/* Modal panel */}
              <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                        <TrendingUp className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="ml-4 text-left">
                        <h3 className="text-lg font-medium leading-6 text-gray-900">
                          How Our Rankings Work
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Understanding the leaderboard algorithm
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowAlgorithmModal(false)}
                      className="rounded-md bg-white text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="mt-6 space-y-4">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      Our leaderboard ranking system evaluates strategies based on multiple performance factors 
                      to provide the most accurate representation of betting expertise.
                    </p>

                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <TrendingUp className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-gray-900">ROI Performance (40%)</h4>
                          <p className="text-sm text-gray-600">
                            Return on investment over the strategy's lifetime, with higher weight for consistent performance.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <Target className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-gray-900">Win Rate (25%)</h4>
                          <p className="text-sm text-gray-600">
                            Percentage of successful bets, balanced against total volume for reliability.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <Activity className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-gray-900">Volume & Consistency (20%)</h4>
                          <p className="text-sm text-gray-600">
                            Total number of bets and consistency of performance over time periods.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <UsersIcon className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-gray-900">Community Trust (15%)</h4>
                          <p className="text-sm text-gray-600">
                            Subscriber count, retention rate, and verification status contribute to overall ranking.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 rounded-lg bg-yellow-50 p-3">
                      <p className="text-sm text-yellow-800">
                        <strong>Note:</strong> Rankings are updated daily and require a minimum of 20 tracked bets 
                        to ensure statistical significance. Newer strategies may take time to establish their ranking.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => setShowAlgorithmModal(false)}
                  >
                    Got It
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
