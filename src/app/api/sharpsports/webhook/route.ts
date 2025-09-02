import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/sharpsports/webhook - Handle SharpSports webhooks
export async function POST(request: NextRequest) {
  try {
    console.log('🔔 SharpSports Webhook - Received webhook')

    const body = await request.json()
    console.log(
      'SharpSports Webhook - Event:',
      body.event,
      'Data keys:',
      Object.keys(body.data || {})
    )

    // Validate webhook has required data
    if (!body.event || !body.data) {
      console.log('SharpSports Webhook - Invalid webhook format')
      return NextResponse.json({ error: 'Invalid webhook format' }, { status: 400 })
    }

    // Use service role client for webhook operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const { event, data } = body

    switch (event) {
      case 'refreshResponse.created':
        await handleRefreshResponseCreated(supabase, data)
        break

      case 'bettorAccount.verified':
        await handleBettorAccountVerified(supabase, data)
        break

      default:
        console.log(`SharpSports Webhook - Unhandled event type: ${event}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('SharpSports Webhook - Error:', error)
    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

async function handleRefreshResponseCreated(supabase: any, data: any) {
  console.log('📥 SharpSports Webhook - Processing refresh response:', data.id)

  try {
    const { bettorAccountId, status } = data

    if (status === 'success') {
      console.log(`✅ SharpSports Webhook - Refresh completed for account: ${bettorAccountId}`)

      // Find the bettor account to get user_id
      const { data: account, error: accountError } = await supabase
        .from('bettor_account')
        .select('user_id, bettor_id')
        .eq('sharpsports_account_id', bettorAccountId)
        .single()

      if (accountError || !account) {
        console.error('SharpSports Webhook - Account not found:', bettorAccountId, accountError)
        return
      }

      // Fetch and sync betSlips for this bettor
      await syncBetSlips(supabase, account.bettor_id, account.user_id)
    } else {
      console.log(
        `❌ SharpSports Webhook - Refresh failed for account: ${bettorAccountId}, status: ${status}`
      )
    }
  } catch (error) {
    console.error('SharpSports Webhook - Error handling refresh response:', error)
  }
}

async function handleBettorAccountVerified(supabase: any, data: any) {
  console.log('✅ SharpSports Webhook - Processing account verification:', data.id)

  try {
    // Update the bettor account verification status
    const { error: updateError } = await supabase
      .from('bettor_account')
      .update({
        verified: true,
        access: data.access || true,
        updated_at: new Date().toISOString(),
      })
      .eq('sharpsports_account_id', data.id)

    if (updateError) {
      console.error('SharpSports Webhook - Error updating account:', updateError)
    } else {
      console.log('✅ SharpSports Webhook - Account verified and updated:', data.id)
    }
  } catch (error) {
    console.error('SharpSports Webhook - Error handling account verification:', error)
  }
}

async function syncBetSlips(supabase: any, bettorId: string, userId: string) {
  console.log(`🔄 SharpSports Webhook - Syncing betSlips for bettor: ${bettorId}`)

  try {
    const apiKey = process.env.SHARPSPORTS_API_KEY
    if (!apiKey) {
      console.error('SharpSports Webhook - API key not configured')
      return
    }

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
      console.error(`SharpSports Webhook - Failed to fetch betSlips: ${response.status}`)
      return
    }

    const betSlips = await response.json()
    console.log(`📊 SharpSports Webhook - Fetched ${betSlips.length} betSlips`)

    // Process each betSlip
    for (const betSlip of betSlips) {
      await processBetSlip(supabase, betSlip, userId)
    }

    console.log(`✅ SharpSports Webhook - Completed syncing betSlips for bettor: ${bettorId}`)
  } catch (error) {
    console.error('SharpSports Webhook - Error syncing betSlips:', error)
  }
}

async function processBetSlip(supabase: any, betSlip: any, userId: string) {
  try {
    const { bets, book } = betSlip
    console.log('Processing book:', book)

    if (!bets || bets.length === 0) {
      console.log('SharpSports Webhook - BetSlip has no bets, skipping')
      return
    }

    // Generate parlay_id for multi-bet slips (parlays)
    const parlayId = bets.length > 1 ? crypto.randomUUID() : null

    console.log(
      `🎯 SharpSports Webhook - Processing ${bets.length} bet(s) from betSlip ${betSlip.id}`
    )

    for (const bet of bets) {
      await processBet(supabase, bet, betSlip, userId, parlayId)
    }
  } catch (error) {
    console.error('SharpSports Webhook - Error processing betSlip:', error)
  }
}

async function processBet(
  supabase: any,
  bet: any,
  betSlip: any,
  userId: string,
  parlayId: string | null
) {
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

    console.log(`💾 SharpSports Webhook - Upserting bet with external_bet_id: ${external_bet_id}`)

    // Upsert bet (insert or update based on external_bet_id)
    const { error: upsertError } = await supabase.from('bets').upsert(mappedBet, {
      onConflict: 'external_bet_id',
      ignoreDuplicates: false,
    })

    if (upsertError) {
      console.error('SharpSports Webhook - Error upserting bet:', upsertError)
    } else {
      console.log(`✅ SharpSports Webhook - Successfully upserted bet: ${external_bet_id}`)
    }
  } catch (error) {
    console.error('SharpSports Webhook - Error processing bet:', error)
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
