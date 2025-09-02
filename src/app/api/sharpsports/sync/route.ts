import { createServerSupabaseClient } from '@/lib/auth/supabaseServer'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/sharpsports/sync - Manually sync betSlips for testing
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 SharpSports Sync - Starting manual sync')

    const supabase = await createServerSupabaseClient(request)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    let effectiveUserId = user?.id
    let querySupabase = supabase

    // Handle service role fallback for authentication
    if (authError || !user) {
      const body = await request.json().catch(() => ({}))
      const userId = body.userId

      if (userId) {
        console.log(
          'SharpSports Sync - Using service role with userId:',
          userId.substring(0, 8) + '...'
        )

        const serviceSupabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
            },
          }
        )

        effectiveUserId = userId
        querySupabase = serviceSupabase
      } else {
        console.log('SharpSports Sync - No authentication available')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // Get all linked bettor accounts for this user
    const { data: accounts, error: accountsError } = await querySupabase
      .from('bettor_account')
      .select('*')
      .eq('user_id', effectiveUserId)
      .eq('verified', true)

    if (accountsError) {
      console.error('SharpSports Sync - Error fetching accounts:', accountsError)
      return NextResponse.json({ error: accountsError.message }, { status: 500 })
    }

    if (!accounts || accounts.length === 0) {
      console.log('SharpSports Sync - No linked accounts found')
      return NextResponse.json({
        message: 'No linked sportsbook accounts found',
        synced: 0,
      })
    }

    console.log(`SharpSports Sync - Found ${accounts.length} accounts to sync`)

    const apiKey = process.env.SHARPSPORTS_API_KEY
    if (!apiKey) {
      console.error('SharpSports Sync - API key not configured')
      return NextResponse.json({ error: 'SharpSports API key not configured' }, { status: 500 })
    }

    let totalBetsProcessed = 0
    const syncResults = []

    // Sync each account
    for (const account of accounts) {
      try {
        console.log(`SharpSports Sync - Syncing account ${account.sharpsports_account_id}`)

        const betsProcessed = await syncBetSlipsForAccount(
          querySupabase,
          account.bettor_id,
          effectiveUserId!
        )
        totalBetsProcessed += betsProcessed

        syncResults.push({
          accountId: account.sharpsports_account_id,
          bookName: account.book_name,
          betsProcessed,
          status: 'success',
        })
      } catch (error) {
        console.error(
          `❌ SharpSports Sync - Account ${account.sharpsports_account_id} sync error:`,
          error
        )

        syncResults.push({
          accountId: account.sharpsports_account_id,
          bookName: account.book_name,
          betsProcessed: 0,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    console.log(`🎉 SharpSports Sync - Completed: ${totalBetsProcessed} total bets processed`)

    return NextResponse.json({
      message: `Successfully synced ${accounts.length} accounts`,
      totalBetsProcessed,
      accounts: accounts.length,
      results: syncResults,
    })
  } catch (error) {
    console.error('SharpSports Sync - Unexpected error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

async function syncBetSlipsForAccount(
  supabase: any,
  bettorId: string,
  userId: string
): Promise<number> {
  console.log(`🔄 SharpSports Sync - Syncing betSlips for bettor: ${bettorId}`)

  try {
    const apiKey = process.env.SHARPSPORTS_API_KEY!

    // Use sandbox API for development
    const apiBaseUrl =
      process.env.NODE_ENV === 'production'
        ? 'https://api.sharpsports.io'
        : 'https://sandbox-api.sharpsports.io'

    // Fetch betSlips from SharpSports API
    const response = await fetch(`${apiBaseUrl}/v1/bettors/${bettorId}/betSlips`, {
      headers: {
        Authorization: `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error(`SharpSports Sync - Failed to fetch betSlips: ${response.status}`)
      const errorText = await response.text()
      console.error(`SharpSports Sync - Error details: ${errorText}`)
      throw new Error(`API request failed: ${response.status}`)
    }

    const betSlips = await response.json()
    console.log(`📊 SharpSports Sync - Fetched ${betSlips.length} betSlips`)

    let totalBetsProcessed = 0

    // Process each betSlip
    for (const betSlip of betSlips) {
      const betsInSlip = await processBetSlip(supabase, betSlip, userId)
      totalBetsProcessed += betsInSlip
    }

    console.log(
      `✅ SharpSports Sync - Completed syncing betSlips for bettor: ${bettorId}, processed ${totalBetsProcessed} bets`
    )
    return totalBetsProcessed
  } catch (error) {
    console.error('SharpSports Sync - Error syncing betSlips:', error)
    throw error
  }
}

async function processBetSlip(supabase: any, betSlip: any, userId: string): Promise<number> {
  try {
    const { bets } = betSlip

    if (!bets || bets.length === 0) {
      console.log('SharpSports Sync - BetSlip has no bets, skipping')
      return 0
    }

    // Generate parlay_id for multi-bet slips (parlays)
    const parlayId = bets.length > 1 ? crypto.randomUUID() : null

    console.log(`🎯 SharpSports Sync - Processing ${bets.length} bet(s) from betSlip ${betSlip.id}`)

    let betsProcessed = 0
    for (const bet of bets) {
      const success = await processBet(supabase, bet, betSlip, userId, parlayId)
      if (success) betsProcessed++
    }

    return betsProcessed
  } catch (error) {
    console.error('SharpSports Sync - Error processing betSlip:', error)
    return 0
  }
}

async function processBet(
  supabase: any,
  bet: any,
  betSlip: any,
  userId: string,
  parlayId: string | null
): Promise<boolean> {
  try {
    const {
      event,
      proposition,
      bookDescription,
      oddsAmerican,
      atRisk,
      toWin,
      status,
      timePlaced,
      dateClosed,
      position,
      line,
    } = bet
    const { book } = betSlip

    // Create external_bet_id (stable identifier for upserts)
    const external_bet_id = parlayId
      ? `${betSlip.id}-${bet.id}` // For parlay legs: betSlipId-betId
      : bet.id || betSlip.id // For single bets: use bet.id or fallback to betSlip.id

    // Map SharpSports data to our bets table structure
    const mappedBet = {
      user_id: userId,
      external_bet_id: external_bet_id,
      sport: event?.sport || 'Unknown',
      league: event?.league || 'Unknown',
      bet_type: mapProposition(proposition),
      bet_description: bookDescription || 'N/A',
      odds: parseInt(oddsAmerican) || 0,
      stake: parseFloat(atRisk) || 0,
      potential_payout: parseFloat(atRisk) + parseFloat(toWin) || 0,
      status: mapStatus(status),
      placed_at: timePlaced || new Date().toISOString(),
      settled_at: dateClosed || null,
      game_date: event?.startTime || new Date().toISOString(),
      home_team: event?.contestantHome?.fullName || null,
      away_team: event?.contestantAway?.fullName || null,
      side: mapSide(position),
      line_value: line ? parseFloat(line) : null,
      sportsbook: book?.name || 'Unknown',
      bet_source: 'sharpsports',
      profit: calculateProfit(status, atRisk, toWin),
      parlay_id: parlayId,
      is_parlay: parlayId !== null,
      updated_at: new Date().toISOString(),
    }

    console.log(`💾 SharpSports Sync - Upserting bet with external_bet_id: ${external_bet_id}`)

    // Upsert bet (insert or update based on external_bet_id)
    const { error: upsertError } = await supabase.from('bets').upsert(mappedBet, {
      onConflict: 'external_bet_id',
      ignoreDuplicates: false,
    })

    if (upsertError) {
      console.error('SharpSports Sync - Error upserting bet:', upsertError)
      return false
    } else {
      console.log(`✅ SharpSports Sync - Successfully upserted bet: ${external_bet_id}`)
      return true
    }
  } catch (error) {
    console.error('SharpSports Sync - Error processing bet:', error)
    return false
  }
}

// Helper functions to map SharpSports data to our format
function mapProposition(proposition: string): string {
  switch (proposition?.toLowerCase()) {
    case 'spread':
      return 'spread'
    case 'total':
      return 'total'
    case 'moneyline':
      return 'moneyline'
    default:
      return 'player_prop'
  }
}

function mapStatus(status: string): string {
  switch (status?.toLowerCase()) {
    case 'pending':
      return 'pending'
    case 'won':
      return 'won'
    case 'lost':
      return 'lost'
    case 'cancelled':
      return 'cancelled'
    case 'void':
      return 'void'
    default:
      return 'pending'
  }
}

function mapSide(position: string): string | null {
  if (!position) return null

  const pos = position.toLowerCase()
  if (pos.includes('over')) return 'over'
  if (pos.includes('under')) return 'under'
  if (pos.includes('home')) return 'home'
  if (pos.includes('away')) return 'away'

  return null
}

function calculateProfit(status: string, atRisk: string, toWin: string): number | null {
  const stake = parseFloat(atRisk) || 0
  const winAmount = parseFloat(toWin) || 0

  switch (status?.toLowerCase()) {
    case 'won':
      return winAmount
    case 'lost':
      return -stake
    case 'void':
    case 'cancelled':
      return 0
    default:
      return null // Pending bets have no profit yet
  }
}
