import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

export interface Post {
  id: string
  user_id: string
  content: string
  image_url: string | null
  created_at: string
  updated_at: string
  profiles: {
    id: string
    username: string | null
    profile_picture_url: string | null
    is_verified_seller: boolean | null
  }
}

interface UsePostsOptions {
  filter?: 'public' | 'subscriptions'
  limit?: number
  autoRefresh?: boolean
}

export function usePosts(options: UsePostsOptions = {}) {
  const { filter = 'public', limit = 20, autoRefresh = false } = options

  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)

  const fetchPosts = async (pageNum: number = 1, reset: boolean = true) => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: limit.toString(),
        filter,
      })

      const response = await fetch(`/api/feed?${params}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch posts')
      }

      if (reset) {
        setPosts(result.data)
      } else {
        setPosts(prev => [...prev, ...result.data])
      }

      setHasMore(result.data.length === limit)
      setPage(pageNum)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchPosts(page + 1, false)
    }
  }

  const refresh = () => {
    fetchPosts(1, true)
  }

  const createPost = async (content: string, imageFile?: File) => {
    try {
      const supabase = createClient()

      // Check if user is authenticated
      const {
        data: { session },
        error: authError,
      } = await supabase.auth.getSession()
      if (authError || !session) {
        throw new Error('You must be logged in to create a post')
      }

      let imageUrl: string | null = null

      // Upload image if provided
      if (imageFile) {
        const formData = new FormData()
        formData.append('file', imageFile)

        const uploadResponse = await fetch('/api/upload/image', {
          method: 'POST',
          body: formData,
        })

        const uploadResult = await uploadResponse.json()

        if (!uploadResponse.ok) {
          throw new Error(uploadResult.error || 'Failed to upload image')
        }

        imageUrl = uploadResult.data.url
      }

      // Create the post directly using Supabase client
      const { data: post, error } = await supabase
        .from('posts')
        .insert({
          user_id: session.user.id,
          content: content.trim(),
          image_url: imageUrl,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select(
          `
          *,
          profiles!inner(
            id,
            username,
            profile_picture_url,
            is_verified_seller
          )
        `
        )
        .single()

      if (error) {
        throw new Error(error.message || 'Failed to create post')
      }

      // Add new post to the beginning of the list
      setPosts(prev => [post, ...prev])

      return post
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create post')
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [filter])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(refresh, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  return {
    posts,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    createPost,
  }
}
