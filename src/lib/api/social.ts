import { authenticatedRequest, paginatedRequest, supabaseDirect } from './client'

// Define fallback types for FeedFilters and PostForm
interface FeedFilters {
  feedType?: 'following' | 'hot' | 'live' | 'you'
  sport?: string
  contentType?: string[]
}
interface PostForm {
  content: string
  postType?: string
  pickId?: string
  imageUrl?: string
  hashtags?: string[]
  isPublic?: boolean
}

// Get social feed with filtering
export async function getSocialFeed(filters: FeedFilters = {}, options = { page: 1, limit: 20 }) {
  return authenticatedRequest(async userId => {
    let query = supabaseDirect.from('posts').select(`
        *,
        author:profiles(
          id,
          username,
          display_name,
          avatar_url,
          is_verified
        ),
        pick:picks(
          id,
          title,
          sport,
          odds,
          confidence,
          status,
          result
        ),
        _count:post_likes(count),
        user_liked:post_likes!inner(user_id)
      `)

    // Apply feed type filter
    switch (filters.feedType) {
      case 'following': {
        // Only show posts from users the current user follows
        const { data: following } = await supabaseDirect
          .from('follows')
          .select('following_id')
          .eq('follower_id', userId)
        const followingIds = following?.map(f => f.following_id) || []
        if (followingIds.length === 0) {
          return { data: [], error: null }
        }
        query = query.in('author_id', followingIds)
        break
      }
      case 'hot':
        // Show trending posts based on engagement
        query = query.order('engagement_score', { ascending: false })
        break
      case 'live': {
        // Show posts about games starting soon
        const fourHoursFromNow = new Date()
        fourHoursFromNow.setHours(fourHoursFromNow.getHours() + 4)
        query = query
          .not('pick_id', 'is', null)
          .lte('pick.game_time', fourHoursFromNow.toISOString())
          .gte('pick.game_time', new Date().toISOString())
        break
      }
      default:
        // For You feed - mix of following and recommended content
        break
    }

    // Apply sport filter
    if (filters.sport) {
      query = query.eq('pick.sport', filters.sport)
    }

    // Apply content type filter
    if (filters.contentType?.length) {
      query = query.in('post_type', filters.contentType)
    }

    // Default ordering
    if (filters.feedType !== 'hot') {
      query = query.order('created_at', { ascending: false })
    }

    const paginated = await paginatedRequest(query as any, options)
    return { data: paginated.data ?? null, error: paginated.error ?? null }
  })
}

// Create a new post
export async function createPost(postData: PostForm) {
  return authenticatedRequest(async userId => {
    const post = {
      author_id: userId,
      content: postData.content,
      post_type: postData.postType || 'text',
      pick_id: postData.pickId || null,
      image_url: postData.imageUrl || null,
      hashtags: postData.hashtags || [],
      is_public: postData.isPublic !== false, // Default to public
    }

    return await supabaseDirect
      .from('posts')
      .insert(post)
      .select(
        `
        *,
        author:profiles(
          id,
          username,
          display_name,
          avatar_url,
          is_verified
        ),
        pick:picks(
          id,
          title,
          sport,
          odds,
          confidence,
          status,
          result
        )
      `
      )
      .single()
  })
}

// Get post by ID
export async function getPostById(postId: string) {
  return authenticatedRequest(async () => {
    return await supabaseDirect
      .from('posts')
      .select(
        `
        *,
        author:profiles(
          id,
          username,
          display_name,
          avatar_url,
          is_verified
        ),
        pick:picks(
          id,
          title,
          sport,
          odds,
          confidence,
          status,
          result
        ),
        _count:post_likes(count)
      `
      )
      .eq('id', postId)
      .single()
  })
}

// Like/unlike a post
export async function togglePostLike(postId: string) {
  return authenticatedRequest(async userId => {
    // Check if user already liked the post
    const { data: existingLike } = await supabaseDirect
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single()

    if (existingLike) {
      // Unlike the post
      const { error } = await supabaseDirect
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId)

      if (!error) {
        // Decrement like count
        await supabaseDirect.rpc('decrement_post_likes', { post_id: postId })
      }

      return { data: { liked: false }, error }
    } else {
      // Like the post
      const { error } = await supabaseDirect
        .from('post_likes')
        .insert({
          post_id: postId,
          user_id: userId,
        })
        .select()
        .single()

      if (!error) {
        // Increment like count
        await supabaseDirect.rpc('increment_post_likes', { post_id: postId })
      }

      return { data: { liked: true }, error }
    }
  })
}

// Get post comments
export async function getPostComments(postId: string, options = { page: 1, limit: 20 }) {
  return authenticatedRequest(async () => {
    const query = supabaseDirect
      .from('post_comments')
      .select(
        `
        *,
        author:profiles(
          id,
          username,
          display_name,
          avatar_url,
          is_verified
        ),
        _count:comment_likes(count)
      `
      )
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
    const paginated = await paginatedRequest(query as any, options)
    return { data: paginated.data ?? null, error: paginated.error ?? null }
  })
}

// Add comment to post
export async function addPostComment(postId: string, content: string) {
  return authenticatedRequest(async userId => {
    const comment = {
      post_id: postId,
      author_id: userId,
      content: content.trim(),
    }

    const { data, error } = await supabaseDirect
      .from('post_comments')
      .insert(comment)
      .select(
        `
        *,
        author:profiles(
          id,
          username,
          display_name,
          avatar_url,
          is_verified
        )
      `
      )
      .single()

    if (!error) {
      // Increment comment count on the post
      await supabaseDirect.rpc('increment_post_comments', { post_id: postId })
    }

    return { data, error }
  })
}

// Delete comment
export async function deleteComment(commentId: string) {
  return authenticatedRequest(async userId => {
    // Get the comment to check ownership and get post_id
    const { data: comment } = await supabaseDirect
      .from('post_comments')
      .select('post_id, author_id')
      .eq('id', commentId)
      .single()

    if (!comment || comment.author_id !== userId) {
      return { data: null, error: 'Unauthorized to delete this comment' }
    }

    const { data, error } = await supabaseDirect
      .from('post_comments')
      .delete()
      .eq('id', commentId)
      .eq('author_id', userId)

    if (!error) {
      // Decrement comment count
      await supabaseDirect.rpc('decrement_post_comments', { post_id: comment.post_id })
    }

    return { data, error }
  })
}

// Share/repost functionality
export async function sharePost(postId: string, content?: string) {
  return authenticatedRequest(async userId => {
    const sharePost = {
      author_id: userId,
      content: content || '',
      post_type: 'repost',
      shared_post_id: postId,
      is_public: true,
    }

    const { data, error } = await supabaseDirect
      .from('posts')
      .insert(sharePost)
      .select(
        `
        *,
        author:profiles(
          id,
          username,
          display_name,
          avatar_url,
          is_verified
        ),
        shared_post:posts!shared_post_id(
          *,
          author:profiles(
            id,
            username,
            display_name,
            avatar_url,
            is_verified
          )
        )
      `
      )
      .single()

    if (!error) {
      // Increment share count on original post
      await supabaseDirect.rpc('increment_post_shares', { post_id: postId })
    }

    return { data, error }
  })
}

// Get user's posts
export async function getUserPosts(userId: string, options = { page: 1, limit: 20 }) {
  return authenticatedRequest(async () => {
    const query = supabaseDirect
      .from('posts')
      .select(
        `
        *,
        author:profiles(
          id,
          username,
          display_name,
          avatar_url,
          is_verified
        ),
        pick:picks(
          id,
          title,
          sport,
          odds,
          confidence,
          status,
          result
        ),
        _count:post_likes(count)
      `
      )
      .eq('author_id', userId)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
    const paginated = await paginatedRequest(query as any, options)
    return { data: paginated.data ?? null, error: paginated.error ?? null }
  })
}

// Delete post
export async function deletePost(postId: string) {
  return authenticatedRequest(async userId => {
    return await supabaseDirect.from('posts').delete().eq('id', postId).eq('author_id', userId)
  })
}

// Edit post
export async function editPost(postId: string, updates: Partial<PostForm>) {
  return authenticatedRequest(async userId => {
    const allowedUpdates = {
      content: updates.content,
      hashtags: updates.hashtags,
      is_public: updates.isPublic,
    }

    // Remove undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(allowedUpdates).filter(([_, value]) => value !== undefined)
    )

    return await supabaseDirect
      .from('posts')
      .update(cleanUpdates)
      .eq('id', postId)
      .eq('author_id', userId)
      .select(
        `
        *,
        author:profiles(
          id,
          username,
          display_name,
          avatar_url,
          is_verified
        ),
        pick:picks(
          id,
          title,
          sport,
          odds,
          confidence,
          status,
          result
        )
      `
      )
      .single()
  })
}

// Get trending hashtags
export async function getTrendingHashtags(limit = 10) {
  return authenticatedRequest(async () => {
    // This would typically be a database function that aggregates hashtag usage
    const { data: posts } = await supabaseDirect
      .from('posts')
      .select('hashtags')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
      .not('hashtags', 'is', null)

    if (!posts) {
      return { data: [], error: null }
    }

    // Count hashtag usage
    const hashtagCounts: Record<string, number> = {}

    posts.forEach(post => {
      if (post.hashtags && Array.isArray(post.hashtags)) {
        post.hashtags.forEach((hashtag: string) => {
          hashtagCounts[hashtag] = (hashtagCounts[hashtag] || 0) + 1
        })
      }
    })

    // Sort by usage and return top hashtags
    const trending = Object.entries(hashtagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([hashtag, count]) => ({ hashtag, count }))

    return { data: trending, error: null }
  })
}

// Search posts
export async function searchPosts(
  query: string,
  filters: FeedFilters = {},
  options = { page: 1, limit: 20 }
) {
  return authenticatedRequest(async () => {
    let searchQuery = supabaseDirect
      .from('posts')
      .select(
        `
        *,
        author:profiles(
          id,
          username,
          display_name,
          avatar_url,
          is_verified
        ),
        pick:picks(
          id,
          title,
          sport,
          odds,
          confidence,
          status,
          result
        ),
        _count:post_likes(count)
      `
      )
      .eq('is_public', true)
      .or(`content.ilike.%${query}%,hashtags.cs.{${query}}`)

    // Apply filters
    if (filters.sport) {
      searchQuery = searchQuery.eq('pick.sport', filters.sport)
    }

    if (filters.contentType?.length) {
      searchQuery = searchQuery.in('post_type', filters.contentType)
    }

    searchQuery = searchQuery.order('created_at', { ascending: false })

    const paginated = await paginatedRequest(searchQuery as any, options)
    return { data: paginated.data ?? null, error: paginated.error ?? null }
  })
}

// Report post
export async function reportPost(postId: string, reason: string, description?: string) {
  return authenticatedRequest(async userId => {
    return await supabaseDirect
      .from('post_reports')
      .insert({
        reporter_id: userId,
        post_id: postId,
        reason,
        description,
        status: 'pending',
      })
      .select()
      .single()
  })
}

// Get post engagement stats
export async function getPostEngagement(postId: string) {
  return authenticatedRequest(async () => {
    const [likesResult, commentsResult, sharesResult] = await Promise.all([
      supabaseDirect
        .from('post_likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId),

      supabaseDirect
        .from('post_comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId),

      supabaseDirect
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('shared_post_id', postId),
    ])

    return {
      data: {
        likes: likesResult.count || 0,
        comments: commentsResult.count || 0,
        shares: sharesResult.count || 0,
      },
      error: null,
    }
  })
}

// Get user's activity feed (notifications)
export async function getUserActivityFeed(options = { page: 1, limit: 20 }) {
  return authenticatedRequest(async userId => {
    const query = supabaseDirect
      .from('user_activities')
      .select(
        `
        *,
        actor:profiles!actor_id(
          id,
          username,
          display_name,
          avatar_url,
          is_verified
        ),
        post:posts(
          id,
          content,
          post_type
        )
      `
      )
      .eq('target_user_id', userId)
      .order('created_at', { ascending: false })
    const paginated = await paginatedRequest(query as any, options)
    return { data: paginated.data ?? null, error: paginated.error ?? null }
  })
}

// Mark activity as read
export async function markActivityAsRead(activityId: string) {
  return authenticatedRequest(async userId => {
    return await supabaseDirect
      .from('user_activities')
      .update({ is_read: true })
      .eq('id', activityId)
      .eq('target_user_id', userId)
  })
}

// Mark all activities as read
export async function markAllActivitiesAsRead() {
  return authenticatedRequest(async userId => {
    return await supabaseDirect
      .from('user_activities')
      .update({ is_read: true })
      .eq('target_user_id', userId)
      .eq('is_read', false)
  })
}
