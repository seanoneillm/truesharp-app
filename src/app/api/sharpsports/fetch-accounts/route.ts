import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create a simple SharpSports client following the SDK pattern
class SharpSportsClient {
  private apiKey: string = ''
  private baseUrl: string = 'https://api.sharpsports.io/v1'

  auth(token: string) {
    this.apiKey = token
  }

  async bettoraccountsByBettor({ id }: { id: string }) {
    const response = await fetch(`${this.baseUrl}/bettors/${id}/accounts`, {
      headers: {
        'Authorization': this.apiKey,
        'Content-Type': 'application/json'
      }
    })

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

// POST /api/sharpsports/fetch-accounts - Fetch bettor accounts from SharpSports API
export async function POST(request: NextRequest) {
  try {
    const { bettorId, profileId } = await request.json()

    if (!bettorId) {
      return NextResponse.json(
        { success: false, error: 'Bettor ID is required' },
        { status: 400 }
      )
    }

    console.log(`🔄 Fetching accounts for bettor: ${bettorId}`)

    const apiKey = process.env.SHARPSPORTS_API_KEY
    if (!apiKey) {
      console.error('SharpSports API key not configured')
      return NextResponse.json({ error: 'SharpSports API key not configured' }, { status: 500 })
    }

    // Auth with SharpSports SDK
    sharpsports.auth(`Token ${apiKey}`)

    // Fetch bettor accounts using SDK pattern
    const { data: accounts } = await sharpsports.bettoraccountsByBettor({ id: bettorId })
    console.log(`📊 Found ${accounts?.length || 0} accounts for bettor ${bettorId}`)

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No accounts found for this bettor',
        accounts: []
      })
    }

    // Save/update each account in our database
    const savedAccounts = []
    
    for (const account of accounts) {
      try {
        const accountData = {
          bettor_id: bettorId,
          sharpsports_account_id: account.id,
          book_id: account.book?.id,
          book_name: account.book?.name,
          book_abbr: account.book?.abbr,
          region_name: account.bookRegion?.name,
          region_abbr: account.bookRegion?.abbr,
          verified: account.verified,
          access: account.access,
          paused: account.paused,
          balance: account.balance,
          latest_refresh_time: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        const { data: savedAccount, error: saveError } = await supabase
          .from('bettor_accounts')
          .upsert(accountData, { 
            onConflict: 'sharpsports_account_id',
            ignoreDuplicates: false 
          })
          .select()
          .single()

        if (saveError) {
          console.error(`❌ Error saving account ${account.id}:`, saveError)
          continue
        }

        savedAccounts.push({
          ...savedAccount,
          original: account // Include original data for reference
        })

        console.log(`✅ Saved account: ${account.book?.name} (${account.id})`)
      } catch (accountError) {
        console.error(`❌ Error processing account ${account.id}:`, accountError)
        continue
      }
    }

    // Update the profile's bettor_id if profileId is provided
    if (profileId) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ sharpsports_bettor_id: bettorId })
        .eq('id', profileId)

      if (profileError) {
        console.error('❌ Error updating profile bettor_id:', profileError)
      } else {
        console.log(`✅ Updated profile ${profileId} with bettor_id: ${bettorId}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully fetched and saved ${savedAccounts.length} accounts`,
      accounts: savedAccounts,
      totalFetched: accounts.length,
      totalSaved: savedAccounts.length
    })

  } catch (error) {
    console.error('❌ Error fetching bettor accounts:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error
      },
      { status: 500 }
    )
  }
}