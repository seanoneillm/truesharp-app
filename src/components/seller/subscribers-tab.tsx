'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/hooks/use-auth'
import { createClient } from '@/lib/supabase'
import { Users, Mail, Calendar, DollarSign, TrendingUp, Star, Filter, Search, UserPlus, UserMinus, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Subscriber {
  id: string
  subscriber_id: string
  strategy_id: string
  strategy_name: string
  subscriber_email: string
  subscriber_username: string
  frequency: 'weekly' | 'monthly' | 'yearly'
  price: number
  status: 'active' | 'cancelled' | 'paused'
  created_at: string
  updated_at: string
}

interface SubscriberMetrics {
  totalSubscribers: number
  activeSubscribers: number
  monthlyRevenue: number
  averageRevenuePer: number
  churnRate: number
  newThisMonth: number
  cancelledThisMonth: number
  retentionRate: number
}

export function SubscribersTab() {
  const { user } = useAuth()
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [metrics, setMetrics] = useState<SubscriberMetrics>({
    totalSubscribers: 0,
    activeSubscribers: 0,
    monthlyRevenue: 0,
    averageRevenuePer: 0,
    churnRate: 0,
    newThisMonth: 0,
    cancelledThisMonth: 0,
    retentionRate: 0
  })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'cancelled'>('all')

  const loadSubscribersData = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      const supabase = createClient()

      // Get all subscriptions for this seller's strategies
      const { data: subscriptionsData, error: subscriptionsError } = await supabase
        .from('subscriptions')
        .select(`
          id,
          subscriber_id,
          strategy_id,
          frequency,
          price,
          status,
          created_at,
          updated_at,
          strategies!inner (
            name,
            user_id
          ),
          profiles!subscriptions_subscriber_id_fkey (
            username,
            email
          )
        `)
        .eq('strategies.user_id', user.id)
        .order('created_at', { ascending: false })

      if (subscriptionsError) {
        console.error('Error fetching subscriptions:', subscriptionsError)
        return
      }

      // Process subscriber data
      const processedSubscribers = (subscriptionsData || []).map(sub => ({
        id: sub.id,
        subscriber_id: sub.subscriber_id,
        strategy_id: sub.strategy_id,
        strategy_name: sub.strategies?.name || 'Unknown Strategy',
        subscriber_email: sub.profiles?.email || 'N/A',
        subscriber_username: sub.profiles?.username || 'Anonymous',
        frequency: sub.frequency,
        price: sub.price,
        status: sub.status,
        created_at: sub.created_at,
        updated_at: sub.updated_at
      }))

      setSubscribers(processedSubscribers)

      // Calculate metrics
      const activeSubscribers = processedSubscribers.filter(s => s.status === 'active')
      const totalRevenue = activeSubscribers.reduce((sum, sub) => {
        const monthlyPrice = sub.frequency === 'weekly' ? sub.price * 4.33 :
                          sub.frequency === 'yearly' ? sub.price / 12 :
                          sub.price
        return sum + (monthlyPrice * 0.82) // Apply platform fee
      }, 0)

      // Calculate new/cancelled this month
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const newThisMonth = processedSubscribers.filter(s => 
        new Date(s.created_at) >= startOfMonth && s.status === 'active'
      ).length
      const cancelledThisMonth = processedSubscribers.filter(s => 
        new Date(s.updated_at) >= startOfMonth && s.status === 'cancelled'
      ).length

      const churnRate = processedSubscribers.length > 0 ? 
        (cancelledThisMonth / (activeSubscribers.length + cancelledThisMonth)) * 100 : 0
      const retentionRate = 100 - churnRate

      setMetrics({
        totalSubscribers: processedSubscribers.length,
        activeSubscribers: activeSubscribers.length,
        monthlyRevenue: totalRevenue,
        averageRevenuePer: activeSubscribers.length > 0 ? totalRevenue / activeSubscribers.length : 0,
        churnRate,
        newThisMonth,
        cancelledThisMonth,
        retentionRate
      })

    } catch (error) {
      console.error('Error loading subscribers:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadSubscribersData()
  }, [loadSubscribersData])

  const filteredSubscribers = subscribers.filter(subscriber => {
    if (filter === 'all') return true
    return subscriber.status === filter
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Active Subscribers</p>
              <p className="text-3xl font-bold text-blue-900 mt-1">{metrics.activeSubscribers}</p>
              <p className="text-xs text-blue-600">+{metrics.newThisMonth} this month</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-xl">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Monthly Revenue</p>
              <p className="text-3xl font-bold text-green-900 mt-1">{formatCurrency(metrics.monthlyRevenue)}</p>
              <p className="text-xs text-green-600">{formatCurrency(metrics.averageRevenuePer)} per subscriber</p>
            </div>
            <div className="p-2 bg-green-100 rounded-xl">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">Retention Rate</p>
              <p className="text-3xl font-bold text-purple-900 mt-1">{metrics.retentionRate.toFixed(1)}%</p>
              <p className="text-xs text-purple-600">{metrics.churnRate.toFixed(1)}% churn rate</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-xl">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-700">Growth This Month</p>
              <p className="text-3xl font-bold text-orange-900 mt-1">+{metrics.newThisMonth - metrics.cancelledThisMonth}</p>
              <p className="text-xs text-orange-600">{metrics.newThisMonth} new, {metrics.cancelledThisMonth} cancelled</p>
            </div>
            <div className="p-2 bg-orange-100 rounded-xl">
              <UserPlus className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Subscribers ({filteredSubscribers.length})</h3>
          <div className="flex items-center space-x-2">
            {['all', 'active', 'cancelled'].map((status) => (
              <Button
                key={status}
                variant={filter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(status as typeof filter)}
                className="capitalize"
              >
                {status}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Subscribers List */}
      {filteredSubscribers.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filter === 'all' ? 'No subscribers yet' : `No ${filter} subscribers`}
          </h3>
          <p className="text-gray-600 mb-4">
            Monetize your strategies to start attracting subscribers
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSubscribers.map((subscriber) => (
            <Card key={subscriber.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {subscriber.subscriber_username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">@{subscriber.subscriber_username}</h4>
                    <p className="text-sm text-gray-600">{subscriber.subscriber_email}</p>
                    <p className="text-sm text-blue-600 font-medium">{subscriber.strategy_name}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(subscriber.price)}/{subscriber.frequency}
                    </p>
                    <p className="text-sm text-gray-600">
                      Since {formatDate(subscriber.created_at)}
                    </p>
                  </div>
                  <Badge className={`${getStatusColor(subscriber.status)} font-medium`}>
                    {subscriber.status}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}