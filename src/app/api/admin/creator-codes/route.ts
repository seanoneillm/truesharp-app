import { createServiceRoleClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

// GET - Fetch all creator codes with signup counts
export async function GET() {
  try {
    const supabase = await createServiceRoleClient()

    console.log('🎯 Fetching creator codes with signup counts...')

    // Get all creator codes with creator info
    const { data: codes, error: codesError } = await supabase
      .from('creator_codes')
      .select(`
        id,
        code,
        is_active,
        created_at,
        creator_user_id,
        profiles!creator_codes_creator_user_id_fkey (
          username,
          email
        )
      `)
      .order('created_at', { ascending: false })

    if (codesError) {
      console.error('❌ Error fetching creator codes:', codesError)
      return NextResponse.json({ error: codesError.message }, { status: 500 })
    }

    // Get signup counts for each code
    const { data: signupCounts, error: countsError } = await supabase
      .from('profiles')
      .select('referred_by_code')
      .not('referred_by_code', 'is', null)

    if (countsError) {
      console.error('❌ Error fetching signup counts:', countsError)
      return NextResponse.json({ error: countsError.message }, { status: 500 })
    }

    // Count signups per code (case-insensitive)
    const countMap: Record<string, number> = {}
    signupCounts?.forEach((profile: { referred_by_code: string }) => {
      const codeLower = profile.referred_by_code.toLowerCase()
      countMap[codeLower] = (countMap[codeLower] || 0) + 1
    })

    // Enrich codes with signup counts
    const enrichedCodes = (codes || []).map((codeEntry: any) => ({
      id: codeEntry.id,
      code: codeEntry.code,
      is_active: codeEntry.is_active,
      created_at: codeEntry.created_at,
      creator_user_id: codeEntry.creator_user_id,
      creator_username: codeEntry.profiles?.username || 'Unknown',
      creator_email: codeEntry.profiles?.email || 'No email',
      signup_count: countMap[codeEntry.code.toLowerCase()] || 0
    }))

    console.log(`✅ Fetched ${enrichedCodes.length} creator codes`)

    return NextResponse.json({
      success: true,
      data: enrichedCodes
    })

  } catch (error) {
    console.error('❌ Creator Codes API Error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// POST - Create a new creator code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { creator_user_id, code } = body

    if (!creator_user_id || !code) {
      return NextResponse.json({
        error: 'Missing required fields: creator_user_id and code'
      }, { status: 400 })
    }

    // Validate code format (alphanumeric, 3-20 chars)
    const codeRegex = /^[a-zA-Z0-9_-]{3,20}$/
    if (!codeRegex.test(code)) {
      return NextResponse.json({
        error: 'Invalid code format. Use 3-20 alphanumeric characters, underscores, or hyphens.'
      }, { status: 400 })
    }

    const supabase = await createServiceRoleClient()

    console.log(`🎯 Creating creator code: ${code} for user: ${creator_user_id}`)

    // Check if code already exists (case-insensitive)
    const { data: existingCode } = await supabase
      .from('creator_codes')
      .select('id')
      .ilike('code', code)
      .single()

    if (existingCode) {
      return NextResponse.json({
        error: 'This code already exists'
      }, { status: 400 })
    }

    // Verify the creator user exists
    const { data: creator } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('id', creator_user_id)
      .single()

    if (!creator) {
      return NextResponse.json({
        error: 'Creator user not found'
      }, { status: 400 })
    }

    // Create the code
    const { data: newCode, error: insertError } = await supabase
      .from('creator_codes')
      .insert({
        creator_user_id,
        code: code.toUpperCase() // Store codes in uppercase
      })
      .select()
      .single()

    if (insertError) {
      console.error('❌ Error creating creator code:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    console.log(`✅ Created creator code: ${newCode.code}`)

    return NextResponse.json({
      success: true,
      data: newCode,
      message: `Creator code ${newCode.code} created successfully`
    })

  } catch (error) {
    console.error('❌ Creator Codes POST Error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
