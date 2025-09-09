import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { processBetsWithParlayLogic } from '@/lib/utils/parlay-sync-handler'

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
        .from('bettor_accounts')
        .select('bettor_id')
        .eq('sharpsports_account_id', bettorAccountId)
        .single()

      if (accountError || !account) {
        console.error('SharpSports Webhook - Account not found:', bettorAccountId, accountError)
        return
      }

      // Get the user_id from the bettor_id via profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('sharpsports_bettor_id', account.bettor_id)
        .single()

      if (profileError || !profile) {
        console.error('SharpSports Webhook - Profile not found for bettor:', account.bettor_id, profileError)
        return
      }

      // Fetch and sync betSlips for this bettor
      await syncBetSlips(supabase, account.bettor_id, profile.id)
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
      .from('bettor_accounts')
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

    // Fetch betSlips from SharpSports API (include all statuses to get pending bets)
    const response = await fetch(`${apiBaseUrl}/v1/bettors/${bettorId}/betSlips?includeIncomplete=true`, {
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

    // Use parlay-aware processing
    const syncResult = await processBetsWithParlayLogic(betSlips, userId, supabase)
    console.log(`✅ SharpSports Webhook - Processed ${syncResult.processed} bets (${syncResult.updated} updated, ${syncResult.errors.length} errors)`)

    if (syncResult.errors.length > 0) {
      console.error('SharpSports Webhook - Sync errors:', syncResult.errors)
    }
  } catch (error) {
    console.error('SharpSports Webhook - Error syncing betSlips:', error)
  }
}

