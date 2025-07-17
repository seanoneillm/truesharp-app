// src/components/feed/feed-container.tsx
import { Spinner } from '@/components/ui/spinner'
import { mockData } from '@/lib/mock-data'
import { Pick, User } from '@/lib/types'
import { useEffect, useState } from 'react'
import { PostCard } from './post-card'

interface FeedContainerProps {
  activeFilter: string
}

// Define a union type for all possible post shapes
type PickPost = {
  id: string
  type: 'pick'
  author: User
  content: string
  pick: Pick
  timestamp: Date
  engagement: { views: number; likes: number; comments: number; shares: number }
  isFollowing: boolean
  isLiked: boolean
  isBookmarked: boolean
}

type TextPost = {
  id: string
  type: 'text'
  author: User
  content: string
  timestamp: Date
  engagement: { views: number; likes: number; comments: number; shares: number }
  isFollowing: boolean
  isLiked: boolean
  isBookmarked: boolean
}

type CelebrationPost = {
  id: string
  type: 'celebration'
  author: User
  content: string
  timestamp: Date
  engagement: { views: number; likes: number; comments: number; shares: number }
  isFollowing: boolean
  isLiked: boolean
  isBookmarked: boolean
}

type Post = PickPost | TextPost | CelebrationPost

const fallbackUser: User = {
  id: '',
  username: '',
  displayName: '',
  avatar: '',
  isVerified: false,
  email: '',
  sellerEnabled: false,
  verificationStatus: 'unverified',
  totalFollowers: 0,
  totalFollowing: 0,
  joinDate: new Date(),
  bio: '',
  location: '',
  website: '',
  createdAt: new Date(),
  updatedAt: new Date(),
}

// Mock posts data - extending picks with social features
const mockPosts: Post[] = [
  ...mockData.picks
    .map((pick) => {
      const author = mockData.users.find(u => u.id === pick.userId)
      if (!author) return null
      return {
        id: pick.id,
        type: 'pick' as const,
        author,
        content: pick.analysis || pick.description,
        pick: pick,
        timestamp: new Date(pick.postedAt),
        engagement: pick.engagement,
        isFollowing: Math.random() > 0.5,
        isLiked: Math.random() > 0.7,
        isBookmarked: Math.random() > 0.8
      }
    })
    .filter((x): x is PickPost => x !== null),
  {
    id: 'post-1',
    type: 'text' as const,
    author: mockData.users[0] || fallbackUser,
    content: "Just hit a 7-game winning streak! 🔥 The key is patience and waiting for the right spots. Never chase losses and always stick to your unit size. Who else is having a hot week?",
    timestamp: new Date('2024-12-21T15:30:00'),
    engagement: { views: 1240, likes: 89, comments: 24, shares: 12 },
    isFollowing: true,
    isLiked: false,
    isBookmarked: true
  },
  {
    id: 'post-2', 
    type: 'celebration' as const,
    author: mockData.users[1] || fallbackUser,
    content: "🎉 HUGE WIN! That under 8.5 just hit in the 9th inning. Sometimes it's better to be lucky than good! Thanks to everyone who tailed.",
    timestamp: new Date('2024-12-21T14:15:00'),
    engagement: { views: 2150, likes: 156, comments: 43, shares: 28 },
    isFollowing: false,
    isLiked: true,
    isBookmarked: false
  }
]

export function FeedContainer({ activeFilter }: FeedContainerProps) {
  const [posts] = useState(mockPosts)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore] = useState(true)

  // Filter posts based on active filter
  const filteredPosts = posts.filter(post => {
    switch (activeFilter) {
      case 'following':
        return post.isFollowing
      case 'live':
        // Show picks for games starting within 4 hours
        if (post.type === 'pick') {
          const gameTime = new Date(post.pick!.gameTime)
          const now = new Date()
          const hoursUntilGame = (gameTime.getTime() - now.getTime()) / (1000 * 60 * 60)
          return hoursUntilGame > 0 && hoursUntilGame <= 4
        }
        return false
      case 'hot':
        // Show posts with high engagement
        return post.engagement.likes > 50 || post.engagement.views > 1000
      default:
        return true // 'forYou' shows all posts
    }
  })

  // Sort posts by timestamp (newest first)
  const sortedPosts = filteredPosts.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  const loadMorePosts = async () => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
    // In real app, would load more posts from API
  }

  useEffect(() => {
    // Reset to top when filter changes
    window.scrollTo(0, 0)
  }, [activeFilter])

  if (sortedPosts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
          <p className="text-gray-500">
            {activeFilter === 'following' 
              ? "Follow some bettors to see their posts here."
              : activeFilter === 'live'
              ? "No live games starting soon."
              : "Be the first to post something!"
            }
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filter Description */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          {activeFilter === 'forYou' && "Showing personalized content based on your interests and activity"}
          {activeFilter === 'following' && "Showing posts from people you follow"}
          {activeFilter === 'live' && "Showing picks for games starting within the next 4 hours"}
          {activeFilter === 'hot' && "Showing trending posts with high engagement"}
        </p>
      </div>

      {/* Posts */}
      <div className="space-y-6">
        {sortedPosts.map((post) => (
          <PostCard 
            key={post.id} 
            post={post}
          />
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="text-center pt-6">
          <button
            onClick={loadMorePosts}
            disabled={isLoading}
            className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Spinner className="h-4 w-4 mr-2" />
                Loading...
              </>
            ) : (
              'Load More Posts'
            )}
          </button>
        </div>
      )}
    </div>
  )
}
