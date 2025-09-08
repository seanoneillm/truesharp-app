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
}

const sharpsports = new SharpSportsClient()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/sharpsports/fetch-bettor-profiles - Fetch bettor profiles and match to user profiles
export async function POST(_request: NextRequest) {
  try {
    console.log('🔄 Fetching bettor profiles from SharpSports and matching to user profiles')

    const apiKey = process.env.SHARPSPORTS_API_KEY
    if (!apiKey) {
      console.error('SharpSports API key not configured')
      return NextResponse.json({ error: 'SharpSports API key not configured' }, { status: 500 })
    }

    // Auth with SharpSports SDK
    sharpsports.auth(`Token ${apiKey}`)

    // Fetch bettors using SDK pattern
    const { data: bettors } = await sharpsports.bettorList()
    console.log(`📊 Found ${bettors?.length || 0} bettor profiles from SharpSports`)

    if (!bettors || bettors.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No bettor profiles found',
        stats: {
          totalBettors: 0,
          matchedProfiles: 0,
          unmatchedBettors: 0,
          updatedProfiles: 0,
          errors: 0,
        },
      })
    }

    const stats = {
      totalBettors: bettors.length,
      matchedProfiles: 0,
      unmatchedBettors: 0,
      updatedProfiles: 0,
      errors: 0,
    }

    const errors = []
    const matchedProfiles = []

    // Process each bettor profile
    for (const bettor of bettors) {
      try {
        if (!bettor.internalId) {
          console.warn(`⚠️ Bettor ${bettor.id} has no internalId, skipping`)
          stats.unmatchedBettors++
          continue
        }

        // Find matching profile by internal ID (which matches our user ID)
        const { data: profile, error: fetchError } = await supabase
          .from('profiles')
          .select('id, username, sharpsports_bettor_id')
          .eq('id', bettor.internalId)
          .single()

        if (fetchError || !profile) {
          console.warn(
            `⚠️ No profile found for internal ID ${bettor.internalId} (bettor ${bettor.id})`
          )
          stats.unmatchedBettors++
          continue
        }

        stats.matchedProfiles++

        // Update profile with SharpSports bettor ID if not already set or different
        if (profile.sharpsports_bettor_id !== bettor.id) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              sharpsports_bettor_id: bettor.id,
            })
            .eq('id', bettor.internalId)

          if (updateError) {
            console.error(`❌ Error updating profile ${bettor.internalId}:`, updateError)
            stats.errors++
            errors.push(`Update profile ${bettor.internalId}: ${updateError.message}`)
          } else {
            console.log(
              `✅ Updated profile ${profile.username} (${bettor.internalId}) with bettor ID ${bettor.id}`
            )
            stats.updatedProfiles++
            matchedProfiles.push({
              profileId: bettor.internalId,
              username: profile.username,
              bettorId: bettor.id,
              metadata: bettor.metadata,
            })
          }
        } else {
          console.log(
            `ℹ️ Profile ${profile.username} (${bettor.internalId}) already has correct bettor ID ${bettor.id}`
          )
          matchedProfiles.push({
            profileId: bettor.internalId,
            username: profile.username,
            bettorId: bettor.id,
            metadata: bettor.metadata,
            alreadyMatched: true,
          })
        }
      } catch (bettorError) {
        console.error(`❌ Error processing bettor ${bettor.id}:`, bettorError)
        stats.errors++
        errors.push(
          `Process bettor ${bettor.id}: ${bettorError instanceof Error ? bettorError.message : 'Unknown error'}`
        )
      }
    }

    const message = `Processed ${stats.totalBettors} bettor profiles: ${stats.matchedProfiles} matched to user profiles, ${stats.updatedProfiles} profiles updated, ${stats.unmatchedBettors} unmatched, ${stats.errors} errors`
    console.log(`✅ ${message}`)

    return NextResponse.json({
      success: true,
      message,
      stats,
      matchedProfiles,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('❌ Error fetching bettor profiles:', error)

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
