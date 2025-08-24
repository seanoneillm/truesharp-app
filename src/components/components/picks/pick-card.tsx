// src/components/picks/pick-card.tsx
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Pick, Seller, User } from '@/lib/types'
import { cn, formatDate, timeAgo } from '@/lib/utils'
import { CheckCircle, Clock, Crown, Eye, Heart, Lock, MessageCircle, Share2, Star } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

interface PickCardProps {
  pick: Pick & { 
    author: User
    seller?: Seller
  }
}

export function PickCard({ pick }: PickCardProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(pick.engagement.likes)
  const [showFullAnalysis, setShowFullAnalysis] = useState(false)

  const handleLike = () => {
    setIsLiked(!isLiked)
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1)
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'premium': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'silver': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'bronze': return 'bg-amber-100 text-amber-800 border-amber-200'
      default: return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'won': return 'bg-green-100 text-green-800'
      case 'lost': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const isLocked = pick.tier !== 'free' && !pick.seller // User not subscribed to this tier
  const gameTime = new Date(pick.gameTime)
  const now = new Date()
  const isLive = gameTime > now && (gameTime.getTime() - now.getTime()) / (1000 * 60 * 60) <= 4

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Link href={`/marketplace/${pick.author.username}`}>
            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium cursor-pointer hover:bg-blue-600 transition-colors">
              {pick.author.avatar}
            </div>
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <Link href={`/marketplace/${pick.author.username}`}>
                <span className="font-medium text-gray-900 hover:text-blue-600 cursor-pointer">
                  @{pick.author.username}
                </span>
              </Link>
              {pick.author.isVerified && (
                <CheckCircle className="h-4 w-4 text-blue-500" />
              )}
              {pick.author.sellerEnabled && (
                <Crown className="h-4 w-4 text-yellow-500" />
              )}
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>{timeAgo(pick.postedAt)}</span>
              {isLive && (
                <>
                  <span>•</span>
                  <div className="flex items-center text-red-500">
                    <Clock className="h-3 w-3 mr-1" />
                    <span className="font-medium">Live</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Pick Status */}
        <div className="flex items-center space-x-2">
          {pick.status !== 'pending' && (
            <Badge className={getStatusColor(pick.status)}>
              {pick.status}
            </Badge>
          )}
          <Badge className={getTierColor(pick.tier)}>
            {isLocked && <Lock className="h-3 w-3 mr-1" />}
            {pick.tier}
          </Badge>
        </div>
      </div>

      {/* Pick Content */}
      <div className="mb-4">
        {/* Sport and Game Info */}
        <div className="flex items-center space-x-2 mb-3">
          <Badge variant="secondary">{pick.sport}</Badge>
          <span className="text-sm text-gray-500">
            {formatDate(gameTime, { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            })}
          </span>
        </div>

        {/* Pick Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {pick.title}
        </h3>

        {/* Pick Details */}
        <div className="flex items-center space-x-4 mb-3 text-sm text-gray-600">
          <div className="flex items-center">
            <span>Confidence:</span>
            <div className="ml-2 flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-4 w-4",
                    i < pick.confidence 
                      ? "text-yellow-400 fill-current" 
                      : "text-gray-300"
                  )}
                />
              ))}
            </div>
          </div>
          <span>Odds: {pick.odds}</span>
        </div>

        {/* Analysis */}
        {pick.analysis && (
          <div className="mb-4">
            {isLocked ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                <Lock className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-3">
                  Subscribe to view detailed analysis
                </p>
                <Link href={`/marketplace/${pick.author.username}`}>
                  <Button size="sm">
                    View Subscription Options
                  </Button>
                </Link>
              </div>
            ) : (
              <div>
                <p className="text-gray-700 text-sm">
                  {showFullAnalysis || pick.analysis.length <= 150
                    ? pick.analysis
                    : `${pick.analysis.substring(0, 150)}...`
                  }
                </p>
                {pick.analysis.length > 150 && (
                  <button
                    onClick={() => setShowFullAnalysis(!showFullAnalysis)}
                    className="text-blue-600 hover:text-blue-500 text-sm mt-1"
                  >
                    {showFullAnalysis ? 'Show less' : 'Read more'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Result */}
        {pick.result && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Result:</span>
              <span className={cn(
                "font-bold",
                pick.status === 'won' ? 'text-green-600' :
                pick.status === 'lost' ? 'text-red-600' :
                'text-gray-600'
              )}>
                {pick.result}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Engagement Stats */}
      <div className="flex items-center justify-between border-t border-gray-100 pt-4">
        <div className="flex items-center space-x-6 text-sm text-gray-500">
          <div className="flex items-center">
            <Eye className="h-4 w-4 mr-1" />
            {pick.engagement.views.toLocaleString()}
          </div>
          <div className="flex items-center">
            <Heart className="h-4 w-4 mr-1" />
            {likeCount}
          </div>
          <div className="flex items-center">
            <MessageCircle className="h-4 w-4 mr-1" />
            {pick.engagement.comments}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={cn(
              "hover:bg-red-50 hover:text-red-600",
              isLiked && "text-red-600 bg-red-50"
            )}
          >
            <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
          </Button>
          <Button variant="ghost" size="sm" className="hover:bg-blue-50 hover:text-blue-600">
            <MessageCircle className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="hover:bg-green-50 hover:text-green-600">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
