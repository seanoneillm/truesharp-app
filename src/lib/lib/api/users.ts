import { apiRequest, authenticatedRequest, supabase } from './client'

// User profile interface to match your types
interface UserProfile {
  id: string
  username: string
  display_name: string
  bio?: string
  avatar_url?: string
  location?: string
  website?: string
  is_verified: boolean
  seller_enabled: boolean
  verification_status: 'unverified' | 'pending' | 'verified'
  total_followers: number
  total_following: number
  created_at: string
  updated_at: string
}

// Get current user profile
export async function getCurrentUserProfile() {
  return authenticatedRequest(async (userId) => {
    return await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
  })
}

// Update user profile
export async function updateUserProfile(updates: Partial<UserProfile>) {
  return authenticatedRequest(async (userId) => {
    return await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
  })
}

// Get public user profile by username
export async function getUserProfileByUsername(username: string) {
  return apiRequest(async () => {
    return await supabase
      .from('profiles')
      .select(`
        id,
        username,
        display_name,
        bio,
        avatar_url,
        is_verified,
        seller_enabled,
        total_followers,
        total_following,
        created_at
      `)
      .eq('username', username)
      .single()
  })
}

// Get user profile by ID
export async function getUserProfileById(userId: string) {
  return apiRequest(async () => {
    return await supabase
      .from('profiles')
      .select(`
        id,
        username,
        display_name,
        bio,
        avatar_url,
        is_verified,
        seller_enabled,
        total_followers,
        total_following,
        created_at
      `)
      .eq('id', userId)
      .single()
  })
}

// Follow/unfollow user
export async function followUser(targetUserId: string) {
  return authenticatedRequest(async (userId) => {
    if (userId === targetUserId) {
      throw new Error('Cannot follow yourself')
    }

    // Check if already following
    const { data: existing } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', userId)
      .eq('following_id', targetUserId)
      .single()

    if (existing) {
      throw new Error('Already following this user')
    }

    // Create follow relationship
    const { data, error } = await supabase
      .from('follows')
      .insert({
        follower_id: userId,
        following_id: targetUserId
      })
      .select()
      .single()

    if (!error) {
      // Update follower counts
      await Promise.all([
        supabase.rpc('increment_follower_count', { user_id: targetUserId }),
        supabase.rpc('increment_following_count', { user_id: userId })
      ])
    }

    return { data, error }
  })
}

export async function unfollowUser(targetUserId: string) {
  return authenticatedRequest(async (userId) => {
    const { data, error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', userId)
      .eq('following_id', targetUserId)

    if (!error) {
      // Update follower counts
      await Promise.all([
        supabase.rpc('decrement_follower_count', { user_id: targetUserId }),
        supabase.rpc('decrement_following_count', { user_id: userId })
      ])
    }

    return { data, error }
  })
}

// Check if user is following another user
export async function isFollowing(targetUserId: string) {
  return authenticatedRequest(async (userId) => {
    const { data, error } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', userId)
      .eq('following_id', targetUserId)
      .single()

    return { data: !!data, error }
  })
}

// Get user's followers
export async function getUserFollowers(userId: string, options = { page: 1, limit: 20 }) {
  const { page = 1, limit = 20 } = options
  const from = (page - 1) * limit
  const to = from + limit - 1

  return apiRequest(async () => {
    return await supabase
      .from('follows')
      .select(`
        follower:profiles!follows_follower_id_fkey (
          id,
          username,
          display_name,
          avatar_url,
          is_verified
        )
      `)
      .eq('following_id', userId)
      .range(from, to)
      .order('created_at', { ascending: false })
  })
}

// Get users that user is following
export async function getUserFollowing(userId: string, options = { page: 1, limit: 20 }) {
  const { page = 1, limit = 20 } = options
  const from = (page - 1) * limit
  const to = from + limit - 1

  return apiRequest(async () => {
    return await supabase
      .from('follows')
      .select(`
        following:profiles!follows_following_id_fkey (
          id,
          username,
          display_name,
          avatar_url,
          is_verified
        )
      `)
      .eq('follower_id', userId)
      .range(from, to)
      .order('created_at', { ascending: false })
  })
}

// Search users
export async function searchUsers(query: string, options = { page: 1, limit: 20 }) {
  const { page = 1, limit = 20 } = options
  const from = (page - 1) * limit
  const to = from + limit - 1

  return apiRequest(async () => {
    return await supabase
      .from('profiles')
      .select(`
        id,
        username,
        display_name,
        bio,
        avatar_url,
        is_verified,
        seller_enabled,
        total_followers
      `)
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .range(from, to)
      .order('total_followers', { ascending: false })
  })
}

// Enable seller account
export async function enableSeller() {
  return authenticatedRequest(async (userId) => {
    return await supabase
      .from('profiles')
      .update({ seller_enabled: true })
      .eq('id', userId)
      .select()
      .single()
  })
}

// Get user stats
export async function getUserStats(userId: string) {
  return apiRequest(async () => {
    // This would typically call a database function that aggregates user statistics
    const [betsResult, picksResult, subscriptionsResult] = await Promise.all([
      supabase
        .from('bets')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),
      supabase
        .from('picks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),
      supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', userId)
        .eq('status', 'active')
    ])

    return {
      data: {
        total_bets: betsResult.count || 0,
        total_picks: picksResult.count || 0,
        active_subscribers: subscriptionsResult.count || 0
      },
      error: null
    }
  })
}

// Upload avatar
export async function uploadAvatar(file: File) {
  return authenticatedRequest(async (userId) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-avatar.${fileExt}`
    const filePath = `avatars/${fileName}`

    // Upload file to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      return { data: null, error: uploadError }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    // Update profile with new avatar URL
    const { data, error } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', userId)
      .select()
      .single()

    return { data, error }
  })
}