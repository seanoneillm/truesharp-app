import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  transformSharpSportsBet,
} from '@/lib/utils/sharpsports-helpers'

// Create a simple SharpSports client following the SDK pattern
class SharpSportsClient {
  private apiKey: string = ''
  private baseUrl: string = 'https://api.sharpsports.io/v1'

  auth(token: string) {
    this.apiKey = token
  }

  async betsByBettor({ id }: { id: string }) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
    
    const response = await fetch(`${this.baseUrl}/bettors/${id}/betSlips`, {
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

// Helper function to process individual bets from bet slips
function processBetsFromSlip(
  betSlip: any,
  profileId: string,
  isParlay: boolean,
  parlayId: string | null,
  _isFirstSlip: boolean
): any[] {
  const processedBets: any[] = []

  if (!betSlip.bets || betSlip.bets.length === 0) {
    return processedBets
  }

  for (let i = 0; i < betSlip.bets.length; i++) {
    const bet = betSlip.bets[i]
    try {
      // Create a combined bet object with slip-level and bet-level data
      const combinedBet = {
        // Create unique external_bet_id for each leg
        id: bet.id || `${betSlip.id}-${i}`,
        betSlip: {
          id: betSlip.id,
        },
        // Bet-level data
        event: bet.event,
        proposition: bet.proposition,
        bookDescription: bet.bookDescription,
        position: bet.position,
        line: bet.line,
        // For parlays: first leg gets slip odds, other legs get 0
        // For single bets: use individual bet odds or slip odds
        oddsAmerican: isParlay
          ? i === 0
            ? betSlip.oddsAmerican
            : 0
          : bet.oddsAmerican || betSlip.oddsAmerican,
        atRisk: isParlay ? (i === 0 ? betSlip.atRisk : 0) : betSlip.atRisk,
        toWin: isParlay ? (i === 0 ? betSlip.toWin : 0) : betSlip.toWin,
        status: bet.status || betSlip.status,
        timePlaced: betSlip.timePlaced,
        dateClosed: betSlip.dateClosed,
        book: betSlip.book,
      }

      const transformedBet = transformSharpSportsBet(combinedBet, profileId)

      // Add parlay information
      transformedBet.is_parlay = isParlay
      transformedBet.parlay_id = parlayId // Will be null for single bets

      processedBets.push(transformedBet)
    } catch (error) {
      console.error(`❌ Error processing bet ${bet.id}:`, error)
    }
  }

  return processedBets
}

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

    const stats = {
      totalBetSlips: betSlips.length,
      totalBets: 0,
      newBets: 0,
      updatedBets: 0,
      skippedBets: 0,
      errors: 0,
    }

    const errors: string[] = []
    const processedBets: any[] = []
    const parlayGroups = new Map() // Track parlay groups by parlay identifier

    // First pass: Group bet slips by parlay
    const parlaySlips = betSlips.filter((slip: any) => slip.type === 'parlay')
    const singleSlips = betSlips.filter((slip: any) => slip.type !== 'parlay')

    // For parlay slips, group them by parlayId or other shared identifier
    for (const parlaySlip of parlaySlips) {
      // Use parlayId if available, otherwise fall back to a combination of key fields
      const parlayKey =
        parlaySlip.parlayId ||
        parlaySlip.groupId ||
        `${parlaySlip.timePlaced}-${parlaySlip.atRisk}-${parlaySlip.toWin}` // fallback grouping

      if (!parlayGroups.has(parlayKey)) {
        parlayGroups.set(parlayKey, {
          id: crypto.randomUUID(),
          slips: [],
        })
      }
      parlayGroups.get(parlayKey).slips.push(parlaySlip)
    }

    // Process single bet slips
    for (const betSlip of singleSlips) {
      try {
        const isParlay = false
        const parlayId = null

        await processBetsFromSlips([betSlip], userId, isParlay, parlayId)
      } catch (slipError) {
        console.error(`❌ Error processing single bet slip ${betSlip.id}:`, slipError)
        stats.errors++
        errors.push(
          `Process slip ${betSlip.id}: ${slipError instanceof Error ? slipError.message : 'Unknown error'}`
        )
      }
    }

    // Process parlay groups
    for (const [parlayKey, parlayGroup] of parlayGroups) {
      try {
        console.log(
          `🎯 Processing parlay group ${parlayKey} with ${parlayGroup.slips.length} slips`
        )
        await processBetsFromSlips(parlayGroup.slips, userId, true, parlayGroup.id)
      } catch (parlayError) {
        console.error(`❌ Error processing parlay group ${parlayKey}:`, parlayError)
        stats.errors++
        errors.push(
          `Process parlay ${parlayKey}: ${parlayError instanceof Error ? parlayError.message : 'Unknown error'}`
        )
      }
    }

    // Helper function to process bets from multiple slips
    async function processBetsFromSlips(
      slips: any[],
      userId: string,
      isParlay: boolean,
      parlayId: string | null
    ) {
      for (const betSlip of slips) {
        const betsFromSlip = processBetsFromSlip(betSlip, userId, isParlay, parlayId, true)
        stats.totalBets += betsFromSlip.length

        // Save each bet to the database
        for (const transformedBet of betsFromSlip) {
          try {
            // Check if bet already exists
            const { data: existingBet } = await supabase
              .from('bets')
              .select('id, external_bet_id, status')
              .eq('external_bet_id', transformedBet.external_bet_id)
              .single()

            if (existingBet) {
              // Update existing bet (status might have changed)
              const { error: updateError } = await supabase
                .from('bets')
                .update({
                  status: transformedBet.status,
                  settled_at: transformedBet.settled_at,
                  profit: transformedBet.profit,
                  updated_at: new Date().toISOString(),
                })
                .eq('external_bet_id', transformedBet.external_bet_id)

              if (updateError) {
                console.error(
                  `❌ Error updating bet ${transformedBet.external_bet_id}:`,
                  updateError
                )
                stats.errors++
                errors.push(`Update bet ${transformedBet.external_bet_id}: ${updateError.message}`)
              } else {
                console.log(`✅ Updated bet ${transformedBet.external_bet_id}`)
                stats.updatedBets++
              }
            } else {
              // Insert new bet
              const { data: savedBet, error: saveError } = await supabase
                .from('bets')
                .insert({
                  user_id: userId,
                  external_bet_id: transformedBet.external_bet_id,
                  sport: transformedBet.sport,
                  league: transformedBet.league,
                  bet_type: transformedBet.bet_type,
                  bet_description: transformedBet.bet_description,
                  odds: transformedBet.odds,
                  stake: transformedBet.stake,
                  potential_payout: transformedBet.potential_payout,
                  status: transformedBet.status,
                  placed_at: transformedBet.placed_at,
                  settled_at: transformedBet.settled_at,
                  game_date: transformedBet.game_date,
                  home_team: transformedBet.home_team,
                  away_team: transformedBet.away_team,
                  side: transformedBet.side,
                  line_value: transformedBet.line_value,
                  sportsbook: transformedBet.sportsbook,
                  bet_source: transformedBet.bet_source,
                  profit: transformedBet.profit,
                  is_parlay: transformedBet.is_parlay,
                  parlay_id: transformedBet.parlay_id,
                  created_at: new Date().toISOString(),
                })
                .select()
                .single()

              if (saveError) {
                console.error(`❌ Error saving bet ${transformedBet.external_bet_id}:`, saveError)
                stats.errors++
                errors.push(`Save bet ${transformedBet.external_bet_id}: ${saveError.message}`)
              } else {
                console.log(`✅ Saved new bet ${transformedBet.external_bet_id}`)
                processedBets.push(savedBet)
                stats.newBets++
              }
            }
          } catch (betError) {
            console.error(`❌ Error processing individual bet:`, betError)
            stats.errors++
            errors.push(
              `Process bet: ${betError instanceof Error ? betError.message : 'Unknown error'}`
            )
          }
        }
      }
    }

    const message = `Refreshed bets for ${profile.username}: ${stats.totalBetSlips} bet slips, ${stats.totalBets} total bets processed, ${stats.newBets} new, ${stats.updatedBets} updated, ${stats.errors} errors`
    console.log(`✅ ${message}`)

    return NextResponse.json({
      success: true,
      message,
      stats,
      processedBets: processedBets.length > 0 ? processedBets : undefined,
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
