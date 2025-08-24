// src/app/marketplace/[username]/page.tsx
"use client"

import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn, formatDate, formatCurrency } from '@/lib/utils'
import { ArrowLeft, Calendar, CheckCircle, Crown, Flag, MessageSquare, Share2, Shield, Star, TrendingUp, UserPlus, Users, Activity } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'

interface SellerProfile {
  id: string
  username: string
  profile_picture_url: string | null
  is_verified_seller: boolean
  bio: string | null
  created_at: string
  strategies: Array<{
    id: string
    name: string
    description: string
    performance_roi: number
    performance_win_rate: number
    performance_total_bets: number
    subscriber_count: number
    pricing_weekly: number
    pricing_monthly: number
    pricing_yearly: number
    created_at: string
  }>
}

interface RecentBet {
  id: string
  sport: string
  bet_type: string
  bet_description: string
  odds: number
  stake: number
  status: string
  profit: number | null
  placed_at: string
  game_date: string | null
}

interface SellerStats {
  totalStrategies: number
  totalSubscribers: number
  totalBets: number
  avgROI: number
  avgWinRate: number
  monthlyEarnings: number
}

interface SellerProfilePageProps {
  params: Promise<{
    username: string
  }>
}

export default function SellerProfilePage({ params }: SellerProfilePageProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [isFollowing, setIsFollowing] = useState(false)
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null)
  const [sellerStats, setSellerStats] = useState<SellerStats | null>(null)
  const [recentBets, setRecentBets] = useState<RecentBet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSellerProfile = async () => {
      try {
        setLoading(true)
        
        // Await params to get username
        const resolvedParams = await params
        const username = resolvedParams.username
        
        // Fetch seller profile with strategies
        const profileResponse = await fetch(`/api/marketplace/seller/${username}`)
        const profileData = await profileResponse.json()
        
        if (profileData.error) {
          setError(profileData.error)
          return
        }
        
        setSellerProfile(profileData.data)
        
        // Calculate aggregated stats
        if (profileData.data?.strategies) {
          const strategies = profileData.data.strategies
          const totalStrategies = strategies.length
          const totalSubscribers = strategies.reduce((sum: number, s: any) => sum + s.subscriber_count, 0)
          const totalBets = strategies.reduce((sum: number, s: any) => sum + s.performance_total_bets, 0)
          const avgROI = strategies.length > 0 ? strategies.reduce((sum: number, s: any) => sum + (s.performance_roi || 0), 0) / strategies.length : 0
          const avgWinRate = strategies.length > 0 ? strategies.reduce((sum: number, s: any) => sum + (s.performance_win_rate || 0), 0) / strategies.length : 0
          
          // Estimate monthly earnings (rough calculation)
          const monthlyEarnings = strategies.reduce((sum: number, s: any) => {
            return sum + (s.subscriber_count * (s.pricing_monthly || 0))
          }, 0)
          
          setSellerStats({
            totalStrategies,
            totalSubscribers,
            totalBets,
            avgROI,
            avgWinRate,
            monthlyEarnings
          })
        }
        
        // Fetch recent bets for this seller
        const betsResponse = await fetch(`/api/marketplace/seller/${username}/bets`)
        const betsData = await betsResponse.json()
        
        if (!betsData.error && betsData.data) {
          setRecentBets(betsData.data)
        }
        
      } catch (err) {
        console.error('Error fetching seller profile:', err)
        setError('Failed to load seller profile')
      } finally {
        setLoading(false)
      }
    }

    fetchSellerProfile()
  }, [params])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading seller profile...</p>
        </div>
      </div>
    )
  }

  if (error || !sellerProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
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
    )
  }

  const getTierBadge = (avgROI: number, totalBets: number, isVerified: boolean) => {
    if (isVerified && avgROI > 20 && totalBets > 500) {
      return { tier: 'elite', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Crown }
    }
    if (avgROI > 10 && totalBets > 200) {
      return { tier: 'pro', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Shield }
    }
    if (avgROI > 5 && totalBets > 50) {
      return { tier: 'rising', color: 'bg-green-100 text-green-800 border-green-200', icon: TrendingUp }
    }
    return { tier: 'starter', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: Star }
  }

  const formatDateString = (dateString: string) => {
    return formatDate(new Date(dateString), {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const tierInfo = sellerStats 
    ? getTierBadge(sellerStats.avgROI, sellerStats.totalBets, sellerProfile.is_verified_seller)
    : { tier: 'starter', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: Star }

  const TierIcon = tierInfo.icon

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
        <Card className="mb-8">
          <div className="relative">
            {/* Cover gradient */}
            <div className="h-32 bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-lg" />
            
            <div className="relative px-6 pb-6">
              {/* Profile Info */}
              <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-6 -mt-16">
                <div className="relative">
                  {sellerProfile.profile_picture_url ? (
                    <img
                      src={sellerProfile.profile_picture_url}
                      alt={sellerProfile.username}
                      className="h-32 w-32 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="h-32 w-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-4xl border-4 border-white shadow-lg">
                      {sellerProfile.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {sellerProfile.is_verified_seller && (
                    <div className="absolute -bottom-2 -right-2">
                      <div className="bg-blue-500 rounded-full p-1">
                        <CheckCircle className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 sm:mt-0 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center space-x-3">
                        <h1 className="text-2xl font-bold text-gray-900">@{sellerProfile.username}</h1>
                        <Badge className={cn(tierInfo.color)}>
                          <TierIcon className="h-4 w-4 mr-1" />
                          {tierInfo.tier.charAt(0).toUpperCase() + tierInfo.tier.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-lg text-gray-600 mt-1">{sellerProfile.username}</p>
                      
                      {/* Quick Stats */}
                      <div className="flex items-center space-x-6 mt-3 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {sellerStats?.totalSubscribers.toLocaleString() || 0} subscribers
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Joined {formatDateString(sellerProfile.created_at)}
                        </div>
                        <div className="flex items-center">
                          <Activity className="h-4 w-4 mr-1" />
                          {sellerStats?.totalStrategies || 0} strategies
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                      <Button 
                        variant="outline" 
                        onClick={() => setIsFollowing(!isFollowing)}
                        className={cn(
                          isFollowing && "bg-green-50 text-green-700 border-green-200"
                        )}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        {isFollowing ? 'Following' : 'Follow'}
                      </Button>
                      <Button variant="outline">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                      <Button variant="outline">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                      <Button variant="outline">
                        <Flag className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio */}
              {sellerProfile.bio && (
                <div className="mt-6">
                  <p className="text-gray-700 max-w-3xl">{sellerProfile.bio}</p>
                </div>
              )}

              {/* Performance Overview */}
              {sellerStats && (
                <div className="mt-6">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <div className={`text-2xl font-bold mb-1 ${
                        sellerStats.avgROI >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {sellerStats.avgROI >= 0 ? '+' : ''}{sellerStats.avgROI.toFixed(1)}%
                      </div>
                      <div className="text-sm text-slate-600">Average ROI</div>
                    </div>
                    
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <div className="text-2xl font-bold text-slate-900 mb-1">
                        {sellerStats.avgWinRate.toFixed(1)}%
                      </div>
                      <div className="text-sm text-slate-600">Win Rate</div>
                    </div>
                    
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <div className="text-2xl font-bold text-slate-900 mb-1">
                        {sellerStats.totalBets.toLocaleString()}
                      </div>
                      <div className="text-sm text-slate-600">Total Bets</div>
                    </div>
                    
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 mb-1">
                        {formatCurrency(sellerStats.monthlyEarnings)}
                      </div>
                      <div className="text-sm text-slate-600">Est. Monthly</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="strategies">Strategies</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="bets">Recent Bets</TabsTrigger>
            <TabsTrigger value="subscribe">Subscribe</TabsTrigger>
          </TabsList>

          <TabsContent value="strategies" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Active Strategies</h3>
              <div className="space-y-4">
                {sellerProfile.strategies.map((strategy) => (
                  <div key={strategy.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-2">{strategy.name}</h4>
                        <p className="text-sm text-gray-600 mb-3">{strategy.description}</p>
                        
                        <div className="grid grid-cols-3 gap-4 mb-3">
                          <div className="text-center">
                            <div className={`text-lg font-bold ${
                              (strategy.performance_roi || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {(strategy.performance_roi || 0) >= 0 ? '+' : ''}{(strategy.performance_roi || 0).toFixed(1)}%
                            </div>
                            <div className="text-xs text-slate-500">ROI</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-slate-900">
                              {(strategy.performance_win_rate || 0).toFixed(1)}%
                            </div>
                            <div className="text-xs text-slate-500">Win Rate</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-slate-900">
                              {strategy.performance_total_bets || 0}
                            </div>
                            <div className="text-xs text-slate-500">Total Bets</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{strategy.subscriber_count || 0} subscribers</span>
                          <span>Created {formatDateString(strategy.created_at)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600 mb-2">From</div>
                        <div className="text-lg font-bold text-blue-600">
                          ${strategy.pricing_weekly}/wk
                        </div>
                        <div className="text-sm text-gray-500">
                          ${strategy.pricing_monthly}/mo
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {sellerProfile.strategies.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No active strategies yet
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Overview</h3>
              {sellerStats && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <div className={`text-3xl font-bold mb-2 ${
                        sellerStats.avgROI >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {sellerStats.avgROI >= 0 ? '+' : ''}{sellerStats.avgROI.toFixed(1)}%
                      </div>
                      <div className="text-sm text-slate-600">Average ROI</div>
                    </div>
                    
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <div className="text-3xl font-bold text-slate-900 mb-2">
                        {sellerStats.avgWinRate.toFixed(1)}%
                      </div>
                      <div className="text-sm text-slate-600">Win Rate</div>
                    </div>
                    
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <div className="text-3xl font-bold text-slate-900 mb-2">
                        {sellerStats.totalBets.toLocaleString()}
                      </div>
                      <div className="text-sm text-slate-600">Total Bets</div>
                    </div>
                    
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        {sellerStats.totalSubscribers.toLocaleString()}
                      </div>
                      <div className="text-sm text-slate-600">Subscribers</div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="bets" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Bets</h3>
              <div className="space-y-4">
                {recentBets.map((bet) => (
                  <div key={bet.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant="secondary">{bet.sport}</Badge>
                          <Badge variant="outline">{bet.bet_type}</Badge>
                        </div>
                        <h4 className="font-medium text-gray-900">{bet.bet_description}</h4>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>Stake: {formatCurrency(bet.stake)}</span>
                          <span>Odds: {bet.odds > 0 ? '+' : ''}{bet.odds}</span>
                          <span>{formatDateString(bet.placed_at)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={cn(
                          bet.status === 'won' ? 'bg-green-100 text-green-800' :
                          bet.status === 'lost' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        )}>
                          {bet.status}
                        </Badge>
                        {bet.profit !== null && (
                          <p className={cn(
                            "text-sm font-medium mt-1",
                            bet.profit > 0 ? 'text-green-600' :
                            bet.profit < 0 ? 'text-red-600' :
                            'text-gray-500'
                          )}>
                            {bet.profit > 0 ? '+' : ''}{formatCurrency(bet.profit)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {recentBets.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No recent bets available
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="subscribe" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Subscribe to Strategies</h3>
              <div className="space-y-4">
                {sellerProfile.strategies.map((strategy) => (
                  <div key={strategy.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{strategy.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{strategy.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm">
                          <span className="text-green-600 font-medium">
                            {(strategy.performance_roi || 0).toFixed(1)}% ROI
                          </span>
                          <span className="text-blue-600">
                            {strategy.subscriber_count || 0} subscribers
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            ${strategy.pricing_weekly}/week
                          </Button>
                          <Button size="sm">
                            ${strategy.pricing_monthly}/month
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {sellerProfile.strategies.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No strategies available for subscription
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
