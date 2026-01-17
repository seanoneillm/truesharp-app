import { createServiceRoleClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

// GET - Get creator info for referral welcome popup
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')

    if (!user_id) {
      return NextResponse.json({
        success: false,
        error: 'Missing user_id parameter'
      }, { status: 400 })
    }

    const supabase = await createServiceRoleClient()

    // Get the user's profile to check if they have a referral code and haven't seen welcome
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('referred_by_code, has_seen_referral_welcome')
      .eq('id', user_id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({
        success: false,
        error: 'User profile not found'
      }, { status: 404 })
    }

    // If no referral code or already seen welcome, return early
    if (!userProfile.referred_by_code || userProfile.has_seen_referral_welcome) {
      return NextResponse.json({
        success: true,
        show_welcome: false
      })
    }

    // Get the creator info from the creator_codes table
    const { data: codeData, error: codeError } = await supabase
      .from('creator_codes')
      .select('creator_user_id')
      .ilike('code', userProfile.referred_by_code)
      .single()

    if (codeError || !codeData) {
      return NextResponse.json({
        success: true,
        show_welcome: false
      })
    }

    // Get the creator's profile info
    const { data: creatorProfile, error: creatorError } = await supabase
      .from('profiles')
      .select('username, display_name, profile_picture_url')
      .eq('id', codeData.creator_user_id)
      .single()

    if (creatorError || !creatorProfile) {
      return NextResponse.json({
        success: true,
        show_welcome: false
      })
    }

    return NextResponse.json({
      success: true,
      show_welcome: true,
      creator: {
        username: creatorProfile.display_name || creatorProfile.username || 'Creator',
        profile_picture_url: creatorProfile.profile_picture_url
      }
    })

  } catch (error) {
    console.error('❌ Welcome Info API Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// POST - Mark welcome as seen
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id } = body

    if (!user_id) {
      return NextResponse.json({
        success: false,
        error: 'Missing user_id'
      }, { status: 400 })
    }

    const supabase = await createServiceRoleClient()

    const { error } = await supabase
      .from('profiles')
      .update({ has_seen_referral_welcome: true })
      .eq('id', user_id)

    if (error) {
      console.error('❌ Error marking welcome as seen:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to update profile'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Welcome marked as seen'
    })

  } catch (error) {
    console.error('❌ Mark Welcome Seen API Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
