import { createServiceRoleClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

// POST - Grant free 1-month Pro subscription for creator code referral
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, creator_code } = body

    if (!user_id || !creator_code) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: user_id and creator_code'
      }, { status: 400 })
    }

    const supabase = await createServiceRoleClient()

    console.log(`🎁 Granting free Pro month for user ${user_id} via creator code ${creator_code}`)

    // Verify the creator code exists and is active
    const { data: codeData, error: codeError } = await supabase
      .from('creator_codes')
      .select('id, code, creator_user_id')
      .ilike('code', creator_code)
      .eq('is_active', true)
      .single()

    if (codeError || !codeData) {
      console.error('❌ Creator code not found or inactive:', creator_code)
      return NextResponse.json({
        success: false,
        error: 'Invalid or inactive creator code'
      }, { status: 400 })
    }

    // Calculate subscription period (1 month from now)
    const now = new Date()
    const oneMonthLater = new Date(now)
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1)

    // Create the pro_subscription record
    const { error: subError } = await supabase
      .from('pro_subscriptions')
      .insert({
        user_id,
        status: 'active',
        plan: 'monthly',
        current_period_start: now.toISOString(),
        current_period_end: oneMonthLater.toISOString(),
        // No stripe_subscription_id - this is a referral gift
        // No apple fields - this is a referral gift
        receipt_validation_status: 'validated', // Mark as validated since it's a gift
      })

    if (subError) {
      console.error('❌ Error creating pro subscription:', subError)
      return NextResponse.json({
        success: false,
        error: 'Failed to create subscription'
      }, { status: 500 })
    }

    // Update the user's profile to pro = 'yes' and save the referral code
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        pro: 'yes',
        referred_by_code: codeData.code // Use canonical code from DB
      })
      .eq('id', user_id)

    if (profileError) {
      console.error('❌ Error updating profile:', profileError)
      return NextResponse.json({
        success: false,
        error: 'Failed to update profile'
      }, { status: 500 })
    }

    console.log(`✅ Granted free Pro month to user ${user_id} via code ${codeData.code}`)

    return NextResponse.json({
      success: true,
      message: 'Free Pro month granted successfully',
      expires_at: oneMonthLater.toISOString()
    })

  } catch (error) {
    console.error('❌ Grant Pro API Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
