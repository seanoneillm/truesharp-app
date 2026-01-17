import { createServiceRoleClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

// POST - Validate a creator code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code } = body

    if (!code) {
      return NextResponse.json({
        valid: false,
        error: 'No code provided'
      }, { status: 400 })
    }

    const supabase = await createServiceRoleClient()

    console.log(`🔍 Validating creator code: ${code}`)

    // Check if code exists and is active (case-insensitive)
    const { data: creatorCode, error } = await supabase
      .from('creator_codes')
      .select('id, code, is_active, creator_user_id')
      .ilike('code', code)
      .single()

    if (error || !creatorCode) {
      console.log(`❌ Creator code not found: ${code}`)
      return NextResponse.json({
        valid: false,
        error: 'Invalid creator code'
      })
    }

    if (!creatorCode.is_active) {
      console.log(`❌ Creator code is inactive: ${code}`)
      return NextResponse.json({
        valid: false,
        error: 'This creator code is no longer active'
      })
    }

    // Fetch creator's profile info for the welcome popup
    const { data: creatorProfile } = await supabase
      .from('profiles')
      .select('username, display_name, profile_picture_url')
      .eq('id', creatorCode.creator_user_id)
      .single()

    console.log(`✅ Creator code valid: ${creatorCode.code}`)

    return NextResponse.json({
      valid: true,
      code: creatorCode.code, // Return the canonical (uppercase) version
      creator: {
        username: creatorProfile?.display_name || creatorProfile?.username || 'Creator',
        profile_picture_url: creatorProfile?.profile_picture_url || null
      }
    })

  } catch (error) {
    console.error('❌ Creator Code Validation Error:', error)
    return NextResponse.json({
      valid: false,
      error: 'Server error validating code'
    }, { status: 500 })
  }
}
