// src/app/marketplace/[username]/page.tsx
"use client"

import { PerformanceDisplay } from '@/components/marketplace/performance-display'
import { SubscriptionTiers } from '@/components/marketplace/subscription-tiers'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { mockData } from '@/lib/mock-data'
import { cn, formatDate } from '@/lib/utils'
import { ArrowLeft, Calendar, CheckCircle, Crown, ExternalLink, Flag, MapPin, MessageSquare, Share2, Shield, Star, TrendingUp, UserPlus, Users } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

interface SellerProfilePageProps {
  params: {
    username: string
  }
}

export default function SellerProfilePage({ params }: SellerProfilePageProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [isFollowing, setIsFollowing] = useState(false)

  // Find seller by username
  const seller = mockData.sellers.find(s => {
    const user = mockData.users.find(u => u.id === s.userId)
    return user?.username === params.username
  })

  const user = seller ? mockData.users.find(u => u.id === seller.userId) : null

  if (!seller || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Seller not found</h1>
          <p className="text-gray-600 mb-4">The seller you're looking for doesn't exist.</p>
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

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'elite': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'pro': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'rising': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'elite': return Crown
      case 'pro': return Shield
      case 'rising': return TrendingUp
      default: return Star
    }
  }

  const TierIcon = getTierIcon(seller.tier)

  // Get user's picks
  const userPicks = mockData.picks.filter(pick => pick.userId === user.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                  <div className="h-32 w-32 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-4xl border-4 border-white shadow-lg">
                    {user.avatar}
                  </div>
                  {user.isVerified && (
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
                        <h1 className="text-2xl font-bold text-gray-900">@{user.username}</h1>
                        <Badge className={cn(getTierColor(seller.tier))}>
                          <TierIcon className="h-4 w-4 mr-1" />
                          {seller.tier.charAt(0).toUpperCase() + seller.tier.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-lg text-gray-600 mt-1">{user.displayName}</p>
                      
                      {/* Quick Stats */}
                      <div className="flex items-center space-x-6 mt-3 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {seller.stats.subscribers.toLocaleString()} subscribers
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Joined {formatDate(user.joinDate, { month: 'long', year: 'numeric' })}
                        </div>
                        {user.location && (
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {user.location}
                          </div>
                        )}
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
              {user.bio && (
                <div className="mt-6">
                  <p className="text-gray-700 max-w-3xl">{user.bio}</p>
                </div>
              )}

              {/* Specialization & Badges */}
              <div className="mt-6 space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Specializes in</h3>
                  <div className="flex flex-wrap gap-2">
                    {seller.specialization.map((sport) => (
                      <Badge key={sport} variant="secondary">
                        {sport}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Verification Badges</h3>
                  <div className="flex flex-wrap gap-2">
                    {seller.verificationBadges.map((badge) => (
                      <Badge key={badge} variant="outline" className="text-xs">
                        {badge}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* External Links */}
              {user.website && (
                <div className="mt-4">
                  <a 
                    href={user.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:text-blue-500"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    {user.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="picks">Recent Picks</TabsTrigger>
            <TabsTrigger value="subscribe">Subscribe</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <PerformanceDisplay seller={seller} />
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <PerformanceDisplay seller={seller} detailed />
          </TabsContent>

          <TabsContent value="picks" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Picks</h3>
              <div className="space-y-4">
                {userPicks.slice(0, 5).map((pick) => (
                  <div key={pick.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant="secondary">{pick.sport}</Badge>
                          <Badge className={cn(
                            pick.tier === 'premium' ? 'bg-purple-100 text-purple-800' :
                            pick.tier === 'silver' ? 'bg-gray-100 text-gray-800' :
                            'bg-amber-100 text-amber-800'
                          )}>
                            {pick.tier}
                          </Badge>
                        </div>
                        <h4 className="font-medium text-gray-900">{pick.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{pick.analysis}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>Confidence: {pick.confidence}/5</span>
                          <span>Odds: {pick.odds}</span>
                          <span>{formatDate(pick.postedAt)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={cn(
                          pick.status === 'won' ? 'bg-green-100 text-green-800' :
                          pick.status === 'lost' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        )}>
                          {pick.status}
                        </Badge>
                        {pick.result && (
                          <p className={cn(
                            "text-sm font-medium mt-1",
                            pick.status === 'won' ? 'text-green-600' :
                            pick.status === 'lost' ? 'text-red-600' :
                            'text-gray-500'
                          )}>
                            {pick.result}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="subscribe" className="space-y-6">
            <SubscriptionTiers seller={seller} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
