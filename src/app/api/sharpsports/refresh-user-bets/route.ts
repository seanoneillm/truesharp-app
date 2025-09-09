import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { processBetsWithParlayLogic } from '@/lib/utils/parlay-sync-handler'

// Create a simple SharpSports client following the SDK pattern
class SharpSportsClient {
  private apiKey: string = ''
  private baseUrl: string = 'https://api.sharpsports.io/v1'

  auth(token: string) {
    this.apiKey = token
  }

  async betsByBettor({ id }: { id: string }) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 120000) // 2 minute timeout
    
    const response = await fetch(`${this.baseUrl}/bettors/${id}/betSlips?includeIncomplete=true`, {
      headers: {
        Authorization: this.apiKey,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${await response.text()}`)
    }

    const data = await response.json()
    return { data }
  }
}

const sharpsports = new SharpSportsClient()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)


// POST /api/sharpsports/refresh-user-bets - Refresh bets for a specific user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    console.log(`🔄 Refreshing bets for user ${userId}`)

    const apiKey = process.env.SHARPSPORTS_API_KEY
    if (!apiKey) {
      console.error('SharpSports API key not configured')
      return NextResponse.json({ error: 'SharpSports API key not configured' }, { status: 500 })
    }

    // Get user's SharpSports bettor ID from their profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('sharpsports_bettor_id, username')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      console.error(`❌ Profile not found for user ${userId}:`, profileError)
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    if (!profile.sharpsports_bettor_id) {
      console.error(`❌ User ${userId} has no SharpSports bettor ID`)
      return NextResponse.json(
        {
          error: 'User has no SharpSports bettor ID. Run "Match Bettor Profiles" first.',
        },
        { status: 400 }
      )
    }

    // Auth with SharpSports SDK
    sharpsports.auth(`Token ${apiKey}`)

    // Fetch bet slips for this bettor
    const { data: betSlips } = await sharpsports.betsByBettor({
      id: profile.sharpsports_bettor_id,
    })

    console.log(
      `📊 Found ${betSlips?.length || 0} bet slips for bettor ${profile.sharpsports_bettor_id}`
    )

    if (!betSlips || betSlips.length === 0) {
      return NextResponse.json({
        success: true,
        message: `No bets found for user ${profile.username}`,
        stats: {
          totalBetSlips: 0,
          totalBets: 0,
          newBets: 0,
          updatedBets: 0,
          skippedBets: 0,
          errors: 0,
        },
      })
    }

    // Use new parlay-aware processing
    console.log(`📊 Processing ${betSlips.length} bet slips with parlay-aware logic`)
    const syncResult = await processBetsWithParlayLogic(betSlips, userId, supabase)
    
    const stats = {
      totalBetSlips: betSlips.length,
      totalBets: syncResult.processed,
      newBets: syncResult.processed, // All processed bets are considered "new" in this context
      updatedBets: syncResult.updated,
      skippedBets: 0,
      errors: syncResult.errors.length,
    }

    const errors = syncResult.errors

    const message = `Refreshed bets for ${profile.username}: ${stats.totalBetSlips} bet slips, ${stats.totalBets} total bets processed, ${stats.newBets} new, ${stats.updatedBets} updated, ${stats.errors} errors`
    console.log(`✅ ${message}`)

    return NextResponse.json({
      success: true,
      message,
      stats,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('❌ Error refreshing user bets:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error,
      },
      { status: 500 }
    )
  }
}
