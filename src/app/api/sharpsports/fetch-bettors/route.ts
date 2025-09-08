import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create a simple SharpSports client following the SDK pattern
class SharpSportsClient {
  private apiKey: string = ''
  private baseUrl: string = 'https://api.sharpsports.io/v1'

  auth(token: string) {
    this.apiKey = token
  }

  async bettorList() {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
    
    const response = await fetch(`${this.baseUrl}/bettors`, {
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

  async bettoraccountsList() {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
    
    const response = await fetch(`${this.baseUrl}/bettorAccounts`, {
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

// POST /api/sharpsports/fetch-bettors - Fetch bettors and their accounts, then save to database
export async function POST(_request: NextRequest) {
  try {
    console.log('🔄 Fetching bettors and their accounts from SharpSports')

    const apiKey = process.env.SHARPSPORTS_API_KEY
    if (!apiKey) {
      console.error('SharpSports API key not configured')
      return NextResponse.json({ error: 'SharpSports API key not configured' }, { status: 500 })
    }

    // Auth with SharpSports SDK
    sharpsports.auth(`Token ${apiKey}`)

    // Fetch bettors using SDK pattern
    const { data: bettors } = await sharpsports.bettorList()
    console.log(`📊 Found ${bettors?.length || 0} bettors`)

    if (!bettors || bettors.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No bettors found',
        bettors: [],
        accounts: [],
      })
    }

    const stats = {
      totalBettors: bettors.length,
      bettorsWithAccounts: 0,
      bettorsWithoutAccounts: 0,
      totalAccounts: 0,
      accountsSaved: 0,
      accountsSkipped: 0,
      errors: 0,
    }

    const processedAccounts = []
    const errors = []

    // Fetch all bettor accounts at once using the working method
    console.log('🔄 Fetching all bettor accounts from SharpSports')
    let allAccounts = []
    try {
      const { data } = await sharpsports.bettoraccountsList()
      allAccounts = data || []
      console.log(`📊 Found ${allAccounts.length} total accounts across all bettors`)
      stats.totalAccounts = allAccounts.length
    } catch (accountsError) {
      console.error('❌ Error fetching bettor accounts:', accountsError)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch bettor accounts',
          details: accountsError instanceof Error ? accountsError.message : 'Unknown error',
        },
        { status: 500 }
      )
    }

    if (!allAccounts || allAccounts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No bettor accounts found',
        bettors: bettors.map((bettor: any) => ({
          id: bettor.id,
          email: bettor.email,
          created: bettor.created,
        })),
        stats: {
          ...stats,
          bettorsWithoutAccounts: stats.totalBettors,
        },
      })
    }

    // Count bettors with and without accounts
    const bettorIdsWithAccounts = new Set(allAccounts.map((account: any) => account.bettor))
    stats.bettorsWithAccounts = bettorIdsWithAccounts.size
    stats.bettorsWithoutAccounts = stats.totalBettors - stats.bettorsWithAccounts

    // Process each account
    for (const account of allAccounts) {
      try {
        const accountData = {
          bettor_id: account.bettor, // Use the bettor field from the account
          sharpsports_account_id: account.id,
          book_id: account.book?.id || 'unknown',
          book_name: account.book?.name || 'Unknown',
          book_abbr: account.book?.abbr,
          region_name: account.bookRegion?.name,
          region_abbr: account.bookRegion?.abbr,
          verified: account.verified,
          access: account.access,
          paused: account.paused,
          balance: account.balance,
          latest_refresh_time: new Date().toISOString(),
          created_at: new Date().toISOString(),
        }

        // Check if account already exists
        const { data: existingAccount } = await supabase
          .from('bettor_accounts')
          .select('id, sharpsports_account_id')
          .eq('sharpsports_account_id', account.id)
          .single()

        if (existingAccount) {
          // Update existing account
          const { error: updateError } = await supabase
            .from('bettor_accounts')
            .update({
              balance: accountData.balance,
              verified: accountData.verified,
              access: accountData.access,
              paused: accountData.paused,
              latest_refresh_time: accountData.latest_refresh_time,
            })
            .eq('sharpsports_account_id', account.id)

          if (updateError) {
            console.error(`❌ Error updating account ${account.id}:`, updateError)
            stats.errors++
            errors.push(`Update account ${account.id}: ${updateError.message}`)
          } else {
            console.log(`✅ Updated account: ${account.book?.name} (${account.id})`)
            stats.accountsSkipped++
          }
        } else {
          // Insert new account
          const { data: savedAccount, error: saveError } = await supabase
            .from('bettor_accounts')
            .insert(accountData)
            .select()
            .single()

          if (saveError) {
            console.error(`❌ Error saving account ${account.id}:`, saveError)
            stats.errors++
            errors.push(`Save account ${account.id}: ${saveError.message}`)
          } else {
            console.log(`✅ Saved new account: ${account.book?.name} (${account.id})`)
            processedAccounts.push(savedAccount)
            stats.accountsSaved++
          }
        }
      } catch (accountError) {
        console.error(`❌ Error processing account ${account.id}:`, accountError)
        stats.errors++
        errors.push(
          `Process account ${account.id}: ${accountError instanceof Error ? accountError.message : 'Unknown error'}`
        )
      }
    }

    const message = `Processed ${stats.totalBettors} bettors (${stats.bettorsWithAccounts} with accounts, ${stats.bettorsWithoutAccounts} without): ${stats.totalAccounts} total accounts, ${stats.accountsSaved} new, ${stats.accountsSkipped} updated, ${stats.errors} errors`
    console.log(`✅ ${message}`)

    return NextResponse.json({
      success: true,
      message,
      bettors: bettors.map((bettor: any) => ({
        id: bettor.id,
        email: bettor.email,
        created: bettor.created,
      })),
      stats,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('❌ Error fetching bettors and accounts:', error)

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
