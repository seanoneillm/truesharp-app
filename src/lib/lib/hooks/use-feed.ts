// FILE: src/lib/hooks/use-feed.ts
// Social feed data hook for posts and activities

import {
  authenticatedRequest,
  paginatedRequest,
  PaginatedResponse,
  supabaseDirect,
} from '@/lib/api/client'
import { PaginationParams } from '@/lib/types'
import { useCallback, useEffect, useState } from 'react'

interface FeedPost {
  id: string
  user_id: string
  content: string
  post_type: 'text' | 'pick' | 'celebration' | 'analysis'
  pick_id?: string
  metadata?: any
  created_at: string
  user: {
    username: string
    display_name: string
    avatar_url: string | null
    is_verified: boolean
  }
  pick?: {
    title: string
    sport: string
    confidence: number
    tier: string
    status: string
  } | null
  engagement: {
    likes: number
    comments: number
    shares: number
    is_liked: boolean
  }
}

interface FeedFilters {
  filter: 'all' | 'following' | 'hot' | 'live' | 'sport'
  sport?: string
  userId?: string
}

interface UseFeedReturn {
  posts: PaginatedResponse<FeedPost>
  isLoading: boolean
  error: string | null
  createPost: (
    content: string,
    postType?: 'text' | 'celebration',
    metadata?: any
  ) => Promise<boolean>
  deletePost: (postId: string) => Promise<boolean>
  likePost: (postId: string) => Promise<boolean>
  unlikePost: (postId: string) => Promise<boolean>
  sharePost: (postId: string) => Promise<boolean>
  setFilters: (filters: FeedFilters) => void
  setPagination: (pagination: PaginationParams) => void
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
}

export function useFeed(): UseFeedReturn {
  const [posts, setPosts] = useState<PaginatedResponse<FeedPost>>({
    data: [],
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    },
    success: true,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<FeedFilters>({
    filter: 'all',
  })
  const [pagination, setPaginationState] = useState<PaginationParams>({
    page: 1,
    limit: 20,
    sortBy: 'created_at',
    sortOrder: 'desc',
  })

  // Build query with filters
  const buildQuery = useCallback(async () => {
    // Note: This is a simplified implementation
    // In a real app, you'd have a posts table with proper relationships

    // For now, we'll use pick_posts as the feed source
    let query = supabaseDirect.from('pick_posts').select(
      `
        *,
        seller:profiles!seller_id (
          username,
          display_name,
          avatar_url,
          is_verified
        )
      `,
      { count: 'exact' }
    )

    // Apply filters based on feed type
    if (filters.filter === 'following') {
      // TODO: Filter by followed users (would need follows table)
      // For now, just return recent posts
    }

    if (filters.filter === 'hot') {
      // TODO: Filter by engagement metrics
      // For now, just return recent posts
    }

    if (filters.filter === 'live') {
      // Filter posts related to games starting soon
      const fourHoursFromNow = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
      // TODO: Add game_time field to pick_posts or join with bets table
    }

    if (filters.sport) {
      // TODO: Filter by sport (would need sport field in pick_posts)
    }

    if (filters.userId) {
      query = query.eq('seller_id', filters.userId)
    }

    return query
  }, [filters])

  // Fetch posts with pagination
  const fetchPosts = useCallback(
    async (page: number = 1, append: boolean = false) => {
      try {
        setIsLoading(true)
        setError(null)

        const query = await buildQuery()
        const paginationOptions = {
          ...pagination,
          page,
        }

        const result = await paginatedRequest<any>(query, paginationOptions)

        if (result.success) {
          // Transform pick_posts to feed posts
          const transformedData: FeedPost[] = result.data.map(pick => ({
            id: pick.id,
            user_id: pick.seller_id,
            content: pick.analysis || pick.title,
            post_type: 'pick' as const,
            pick_id: pick.id,
            metadata: {
              confidence: pick.confidence,
              tier: pick.tier,
            },
            created_at: pick.posted_at,
            user: pick.seller || {
              username: 'unknown',
              display_name: 'Unknown User',
              avatar_url: null,
              is_verified: false,
            },
            pick: {
              title: pick.title,
              sport: 'NFL', // TODO: Get from bet relation
              confidence: pick.confidence,
              tier: pick.tier,
              status: 'pending', // TODO: Get from bet relation
            },
            engagement: {
              likes: 0, // TODO: Implement likes system
              comments: 0, // TODO: Implement comments system
              shares: 0, // TODO: Implement shares system
              is_liked: false,
            },
          }))

          setPosts(prev => ({
            ...result,
            data: append ? [...prev.data, ...transformedData] : transformedData,
          }))
        } else {
          throw new Error(result.error || 'Failed to fetch posts')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch feed')
      } finally {
        setIsLoading(false)
      }
    },
    [buildQuery, pagination]
  )

  // Create post
  const createPost = useCallback(
    async (
      content: string,
      postType: 'text' | 'celebration' = 'text',
      metadata?: any
    ): Promise<boolean> => {
      // For now, we'll create posts as pick_posts with special handling
      // In a real implementation, you'd have a dedicated posts table

      type InsertedPickPost = {
        id: string
        seller_id: string
        posted_at: string
        seller?: {
          username: string
          display_name: string
          avatar_url: string | null
          is_verified: boolean
        }
      }

      const response = await authenticatedRequest(async currentUserId => {
        return await supabaseDirect
          .from('pick_posts')
          .insert({
            seller_id: currentUserId,
            title: content.substring(0, 100), // Truncate for title
            analysis: content,
            confidence: 3, // Default confidence for text posts
            tier: 'free', // Text posts are always free
            is_premium: false,
          })
          .select(
            `
          *,
          seller:profiles!seller_id (
            username,
            display_name,
            avatar_url,
            is_verified
          )
        `
          )
          .single<InsertedPickPost>()
      })

      if (response.success && response.data) {
        const newPost: FeedPost = {
          id: response.data.id,
          user_id: response.data.seller_id,
          content: content,
          post_type: postType,
          metadata,
          created_at: response.data.posted_at,
          user: response.data.seller || {
            username: 'unknown',
            display_name: 'Unknown User',
            avatar_url: null,
            is_verified: false,
          },
          pick: null,
          engagement: {
            likes: 0,
            comments: 0,
            shares: 0,
            is_liked: false,
          },
        }

        setPosts(prev => ({
          ...prev,
          data: [newPost, ...prev.data],
          pagination: {
            ...prev.pagination,
            total: prev.pagination.total + 1,
          },
        }))
        return true
      } else {
        setError(response.error || 'Failed to create post')
        return false
      }
    },
    []
  )

  // Delete post
  const deletePost = useCallback(async (postId: string): Promise<boolean> => {
    const response = await authenticatedRequest(async currentUserId => {
      return await supabaseDirect
        .from('pick_posts')
        .delete()
        .eq('id', postId)
        .eq('seller_id', currentUserId)
        .select()
        .single()
    })

    if (response.success) {
      setPosts(prev => ({
        ...prev,
        data: prev.data.filter(post => post.id !== postId),
        pagination: {
          ...prev.pagination,
          total: prev.pagination.total - 1,
        },
      }))
      return true
    } else {
      setError(response.error || 'Failed to delete post')
      return false
    }
  }, [])

  // Like post
  const likePost = useCallback(async (postId: string): Promise<boolean> => {
    // TODO: Implement likes table and functionality
    // For now, just update local state
    setPosts(prev => ({
      ...prev,
      data: prev.data.map(post =>
        post.id === postId
          ? {
              ...post,
              engagement: {
                ...post.engagement,
                likes: post.engagement.likes + 1,
                is_liked: true,
              },
            }
          : post
      ),
    }))
    return true
  }, [])

  // Unlike post
  const unlikePost = useCallback(async (postId: string): Promise<boolean> => {
    // TODO: Implement likes table and functionality
    // For now, just update local state
    setPosts(prev => ({
      ...prev,
      data: prev.data.map(post =>
        post.id === postId
          ? {
              ...post,
              engagement: {
                ...post.engagement,
                likes: Math.max(0, post.engagement.likes - 1),
                is_liked: false,
              },
            }
          : post
      ),
    }))
    return true
  }, [])

  // Share post
  const sharePost = useCallback(async (postId: string): Promise<boolean> => {
    // TODO: Implement shares functionality
    // For now, just update local state
    setPosts(prev => ({
      ...prev,
      data: prev.data.map(post =>
        post.id === postId
          ? {
              ...post,
              engagement: {
                ...post.engagement,
                shares: post.engagement.shares + 1,
              },
            }
          : post
      ),
    }))
    return true
  }, [])

  // Load more posts
  const loadMore = useCallback(async () => {
    if (posts.pagination.hasNext && !isLoading) {
      await fetchPosts(posts.pagination.page + 1, true)
    }
  }, [posts.pagination.hasNext, posts.pagination.page, isLoading, fetchPosts])

  // Refresh posts
  const refresh = useCallback(async () => {
    await fetchPosts(1, false)
  }, [fetchPosts])

  // Set filters
  const setFiltersWrapper = useCallback((newFilters: FeedFilters) => {
    setFilters(newFilters)
  }, [])

  // Set pagination
  const setPagination = useCallback((newPagination: PaginationParams) => {
    setPaginationState(prev => ({ ...prev, ...newPagination }))
  }, [])

  // Initial load and filter/pagination changes
  useEffect(() => {
    fetchPosts(pagination.page || 1, false)
  }, [filters, pagination])

  return {
    posts,
    isLoading,
    error,
    createPost,
    deletePost,
    likePost,
    unlikePost,
    sharePost,
    setFilters: setFiltersWrapper,
    setPagination,
    loadMore,
    refresh,
  }
}
