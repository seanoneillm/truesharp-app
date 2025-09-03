// src/components/feed/post-card.tsx
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Pick, User } from '@/lib/types'
import { cn, timeAgo } from '@/lib/utils'
import {
  Bookmark,
  CheckCircle,
  Clock,
  Crown,
  Eye,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Share2,
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

interface PostProps {
  id: string
  type: 'pick' | 'text' | 'celebration'
  author: User
  content: string
  pick?: Pick
  timestamp: Date
  engagement: {
    views: number
    likes: number
    comments: number
    shares: number
  }
  isFollowing: boolean
  isLiked: boolean
  isBookmarked: boolean
}

interface PostCardProps {
  post: PostProps
}

export function PostCard({ post }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked)
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked)
  const [likeCount, setLikeCount] = useState(post.engagement.likes)

  const handleLike = () => {
    setIsLiked(!isLiked)
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1)
  }

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked)
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'premium':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'silver':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'bronze':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'won':
        return 'bg-green-100 text-green-800'
      case 'lost':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card className="p-6 transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <Link href={`/profile/${post.author.username}`}>
            <div className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-blue-500 font-medium text-white transition-colors hover:bg-blue-600">
              {post.author.avatar}
            </div>
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <Link href={`/profile/${post.author.username}`}>
                <span className="cursor-pointer font-medium text-gray-900 hover:text-blue-600">
                  @{post.author.username}
                </span>
              </Link>
              {post.author.isVerified && <CheckCircle className="h-4 w-4 text-blue-500" />}
              {post.author.sellerEnabled && <Crown className="h-4 w-4 text-yellow-500" />}
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>{post.author.display_name}</span>
              <span>•</span>
              <span>{timeAgo(post.timestamp)}</span>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="mb-4">
        {/* Post Type Badge */}
        {post.type !== 'text' && (
          <div className="mb-3">
            <Badge
              variant="outline"
              className={cn(
                post.type === 'pick'
                  ? 'border-blue-200 text-blue-800'
                  : post.type === 'celebration'
                    ? 'border-green-200 text-green-800'
                    : 'border-gray-200 text-gray-800'
              )}
            >
              {post.type === 'pick' ? '🎯 Pick' : post.type === 'celebration' ? '🎉 Win' : 'Post'}
            </Badge>
          </div>
        )}

        {/* Text Content */}
        <p className="mb-4 whitespace-pre-wrap text-gray-900">{post.content}</p>

        {/* Pick Details */}
        {post.pick && (
          <div className="rounded-lg border bg-gray-50 p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-2 flex items-center space-x-2">
                  <Badge variant="secondary">{post.pick.sport}</Badge>
                  <Badge className={getTierColor(post.pick.tier)}>{post.pick.tier}</Badge>
                  {post.pick.status !== 'pending' && (
                    <Badge className={getStatusColor(post.pick.status)}>{post.pick.status}</Badge>
                  )}
                </div>
                <h4 className="mb-1 font-medium text-gray-900">{post.pick.title}</h4>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Confidence: {post.pick.confidence}/5</span>
                  <span>Odds: {post.pick.odds}</span>
                  {post.pick.status === 'pending' && (
                    <div className="flex items-center">
                      <Clock className="mr-1 h-3 w-3" />
                      <span>Live</span>
                    </div>
                  )}
                </div>
              </div>
              {post.pick.result && (
                <div className="text-right">
                  <span
                    className={cn(
                      'text-lg font-bold',
                      post.pick.status === 'won'
                        ? 'text-green-600'
                        : post.pick.status === 'lost'
                          ? 'text-red-600'
                          : 'text-gray-600'
                    )}
                  >
                    {post.pick.result}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Engagement Stats */}
      <div className="mb-4 flex items-center space-x-6 text-sm text-gray-500">
        <div className="flex items-center">
          <Eye className="mr-1 h-4 w-4" />
          {post.engagement.views.toLocaleString()}
        </div>
        <div className="flex items-center">
          <Heart className="mr-1 h-4 w-4" />
          {likeCount}
        </div>
        <div className="flex items-center">
          <MessageCircle className="mr-1 h-4 w-4" />
          {post.engagement.comments}
        </div>
        <div className="flex items-center">
          <Share2 className="mr-1 h-4 w-4" />
          {post.engagement.shares}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between border-t border-gray-100 pt-4">
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={cn(
              'hover:bg-red-50 hover:text-red-600',
              isLiked && 'bg-red-50 text-red-600'
            )}
          >
            <Heart className={cn('mr-2 h-4 w-4', isLiked && 'fill-current')} />
            Like
          </Button>
          <Button variant="ghost" size="sm" className="hover:bg-blue-50 hover:text-blue-600">
            <MessageCircle className="mr-2 h-4 w-4" />
            Comment
          </Button>
          <Button variant="ghost" size="sm" className="hover:bg-green-50 hover:text-green-600">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBookmark}
          className={cn(
            'hover:bg-yellow-50 hover:text-yellow-600',
            isBookmarked && 'bg-yellow-50 text-yellow-600'
          )}
        >
          <Bookmark className={cn('h-4 w-4', isBookmarked && 'fill-current')} />
        </Button>
      </div>
    </Card>
  )
}
