'use client'

import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { StrategyCard } from '@/components/marketplace/strategy-card'
import { SubscriptionPricingModal } from '@/components/marketplace/subscription-pricing-modal'
import { useAuth } from '@/lib/hooks/use-auth'
import { useSubscribe } from '@/lib/hooks/use-subscribe'
import { Search, Store } from 'lucide-react'
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
  const [selectedSport, setSelectedSport] = useState('all')
  const [sortBy, setSortBy] = useState('leaderboard')

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

        if (selectedSport !== 'all') {
          params.append('sport', selectedSport)
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
  }, [sortBy, selectedSport])

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

          {/* Leaderboard Quick Stats */}
          <div className="hidden items-center space-x-8 lg:flex">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">{strategies.length}</div>
              <div className="text-sm text-slate-600">Active Strategies</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                +
                {strategies.length > 0
                  ? (
                      strategies.reduce((sum, s) => sum + s.roi_percentage, 0) / strategies.length
                    ).toFixed(1)
                  : '0'}
                %
              </div>
              <div className="text-sm text-slate-600">Average ROI</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {strategies.length > 0
                  ? (
                      strategies.reduce((sum, s) => sum + s.win_rate, 0) / strategies.length
                    ).toFixed(1)
                  : '0'}
                %
              </div>
              <div className="text-sm text-slate-600">Average Win Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {strategies.filter(s => s.rank && s.rank <= 10).length}
              </div>
              <div className="text-sm text-slate-600">Top 10 Strategies</div>
            </div>
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
            value={selectedSport}
            onChange={e => setSelectedSport(e.target.value)}
            className="min-w-[140px] rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Sports</option>
            <option value="NBA">NBA</option>
            <option value="NFL">NFL</option>
            <option value="MLB">MLB</option>
            <option value="NHL">NHL</option>
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
      </div>
    </DashboardLayout>
  )
}
