import { createServerClientFromRequest } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

// GET - Get seller profile by username
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const rawUsername = searchParams.get('username')

    if (!rawUsername) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    // Decode the username to handle URL encoding issues
    const username = decodeURIComponent(rawUsername)

    console.log('Looking for seller profile with username:', username)

    const supabase = await createServerClientFromRequest(request)

    // First, let's check what profiles exist and their usernames
    const { data: allProfiles, error: debugError } = await supabase
      .from('profiles')
      .select('id, username, email')
      .limit(5)

    if (debugError) {
      console.error('Debug error:', debugError)
    }
    console.log('Available profiles:', allProfiles)

    // Get profile with seller_profiles data and strategies
    // Try both username and email fields since the username might be stored in email field
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(
        `
        id,
        username,
        email,
        bio,
        profile_picture_url,
        is_verified_seller,
        created_at,
        seller_profiles (
          bio,
          profile_img,
          banner_img,
          updated_at
        )
      `
      )
      .or(`username.eq.${username},email.eq.${username}`)
      .single()

    console.log('Profile query result:', { profile, profileError })

    if (profile?.seller_profiles) {
      console.log('Seller profiles data:', profile.seller_profiles)
    }

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
    }

    // Get strategies for this seller with descriptions from strategies table
    const { data: strategies, error: strategiesError } = await supabase
      .from('strategy_leaderboard')
      .select(
        `
        id,
        strategy_id,
        user_id,
        strategy_name,
        username,
        is_verified_seller,
        total_bets,
        winning_bets,
        losing_bets,
        roi_percentage,
        win_rate,
        overall_rank,
        primary_sport,
        strategy_type,
        is_monetized,
        subscription_price_weekly,
        subscription_price_monthly,
        subscription_price_yearly,
        created_at,
        updated_at,
        strategies!inner(description)
      `
      )
      .eq('user_id', profile.id)
      .eq('is_monetized', true)
      .order('overall_rank', { ascending: true, nullsFirst: false })

    if (strategiesError) {
      console.error('Error fetching strategies:', strategiesError)
      return NextResponse.json({ error: 'Error fetching strategies' }, { status: 500 })
    }

    // Merge profile with seller_profiles data
    // Priority: seller_profiles data overrides profiles data
    // Note: seller_profiles is an array, get the first element
    const sellerProfileData = Array.isArray(profile.seller_profiles) 
      ? profile.seller_profiles[0] 
      : profile.seller_profiles
    
    // Process strategies to include description from joined table
    const processedStrategies = (strategies || []).map(strategy => ({
      ...strategy,
      strategy_description: (strategy as any).strategies?.description || ''
    }))
    
    const sellerProfile = {
      ...profile,
      // Use seller_profiles bio if it exists, otherwise use profiles bio, otherwise empty string
      bio: sellerProfileData?.bio || profile.bio || '',
      // Use seller_profiles profile_img if it exists, otherwise use profiles profile_picture_url
      profile_img: sellerProfileData?.profile_img || profile.profile_picture_url || null,
      // Use seller_profiles banner_img (profiles table doesn't have this field)
      banner_img: sellerProfileData?.banner_img || null,
      strategies: processedStrategies,
    }

    console.log('Final seller profile data:', {
      bio: sellerProfile.bio,
      profiles_bio: profile.bio,
      seller_profiles_bio: sellerProfileData?.bio,
      profile_img: sellerProfile.profile_img,
      profile_picture_url: profile.profile_picture_url,
      seller_profiles_profile_img: sellerProfileData?.profile_img,
      banner_img: sellerProfile.banner_img,
      seller_profiles_banner_img: sellerProfileData?.banner_img,
      seller_profiles_count: profile.seller_profiles?.length || 0,
      has_seller_profile_record: !!sellerProfileData,
    })

    return NextResponse.json({
      success: true,
      data: sellerProfile,
    })
  } catch (error) {
    console.error('Error in GET /api/seller-profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Update seller profile (upsert)
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/seller-profile called')
    const supabase = await createServerClientFromRequest(request)

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    console.log('POST - Auth check:', { user: user?.id, authError })

    if (authError || !user) {
      console.error('POST - Authentication failed:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { bio, profile_img, banner_img } = body

    console.log('POST - Body received:', {
      bio: bio ? `${bio.substring(0, 50)}...` : null,
      profile_img: profile_img ? `${profile_img.substring(0, 50)}...` : null,
      banner_img: banner_img ? `${banner_img.substring(0, 50)}...` : null,
    })
    console.log('POST - Auth user ID:', user.id)

    // First, get the profiles record to ensure we have the right user_id
    const { data: profileRecord, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    console.log('POST - Profile lookup:', { profileRecord, profileError })

    if (profileError || !profileRecord) {
      console.error('POST - Profile not found for user:', user.id)
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Upsert seller profile using the correct user_id
    console.log('POST - About to upsert seller profile with user_id:', profileRecord.id)

    const { data, error } = await supabase
      .from('seller_profiles')
      .upsert(
        {
          user_id: profileRecord.id,
          bio: bio || null,
          profile_img: profile_img || null,
          banner_img: banner_img || null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      )
      .select()
      .single()

    if (error) {
      console.error('POST - Error upserting seller profile:', error)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    console.log('POST - Successfully upserted seller profile:', data)

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Error in POST /api/seller-profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
