import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/auth/supabaseServer'
import { checkParlayStatus } from '@/lib/services/betting'

// Configure CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders })
}

export async function GET(request: NextRequest, { params }: { params: { parlayId: string } }) {
  try {
    const { parlayId } = params

    if (!parlayId) {
      return NextResponse.json(
        { error: 'Parlay ID is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Get user from session for security
    const supabase = await createServerSupabaseClient(request)

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401, headers: corsHeaders }
      )
    }

    // Check parlay status
    const parlayStatus = await checkParlayStatus(supabase, parlayId)

    if (!parlayStatus) {
      return NextResponse.json({ error: 'Parlay not found' }, { status: 404, headers: corsHeaders })
    }

    return NextResponse.json(parlayStatus, { status: 200, headers: corsHeaders })
  } catch (error) {
    console.error('Error checking parlay status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
