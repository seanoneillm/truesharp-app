import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create a simple SharpSports client following the SDK pattern
class SharpSportsClient {
  private apiKey: string = ''
  private baseUrl: string = 'https://api.sharpsports.io/v1'

  auth(token: string) {
    this.apiKey = token
  }

  async betsByBettor({ id }: { id: string }) {
    const response = await fetch(`${this.baseUrl}/bettors/${id}/betSlips`, {
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

// POST /api/sharpsports/refresh-bets - Refresh bets for a bettor from SharpSports API
export async function POST(request: NextRequest) {
  try {
    const { bettorId, profileId } = await request.json()

    if (!bettorId || !profileId) {
      return NextResponse.json(
        { success: false, error: 'Bettor ID and Profile ID are required' },
        { status: 400 }
      )
    }

    console.log(`🔄 Refreshing bets for bettor: ${bettorId}`)

    const apiKey = process.env.SHARPSPORTS_API_KEY
    if (!apiKey) {
      console.error('SharpSports API key not configured')
      return NextResponse.json({ error: 'SharpSports API key not configured' }, { status: 500 })
    }

    // Auth with SharpSports SDK
    sharpsports.auth(`Token ${apiKey}`)

    // Fetch betSlips using SDK pattern
    const { data: betSlips } = await sharpsports.betsByBettor({ id: bettorId })
    console.log(`📊 Found ${betSlips?.length || 0} betSlips for bettor ${bettorId}`)

    if (!betSlips || betSlips.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No bets found for this bettor',
        stats: { total: 0, saved: 0, skipped: 0, errors: 0 }
      })
    }

    const stats = {
      total: 0,
      saved: 0,
      skipped: 0,
      errors: 0
    }
    
    const processedBets = []
    const errors = []

    // Process each betSlip (following your existing pattern)
    for (const betSlip of betSlips) {
      const { bets } = betSlip
      
      if (!bets || bets.length === 0) {
        continue
      }

      // Generate parlay_id for multi-bet slips
      const parlayId = bets.length > 1 ? crypto.randomUUID() : null
      stats.total += bets.length

      for (const bet of bets) {
        try {
          // Create external_bet_id (same logic as sync function)
          const external_bet_id = parlayId 
            ? `${betSlip.id}-${bet.id}` 
            : bet.id || betSlip.id

          // Map bet data (using your existing helper functions)
          const mappedBet = {
            user_id: profileId,
            external_bet_id: external_bet_id,
            sport: bet.event?.sport || 'Unknown',
            league: bet.event?.league || 'Unknown',
            bet_type: mapProposition(bet.proposition),
            bet_description: bet.bookDescription || 'N/A',
            odds: parseInt(bet.oddsAmerican) || 0,
            stake: parseFloat(bet.atRisk) || 0,
            potential_payout: parseFloat(bet.atRisk) + parseFloat(bet.toWin) || 0,
            status: mapStatus(bet.status),
            placed_at: bet.timePlaced || new Date().toISOString(),
            settled_at: bet.dateClosed || null,
            game_date: bet.event?.startTime || new Date().toISOString(),
            home_team: bet.event?.contestantHome?.fullName || null,
            away_team: bet.event?.contestantAway?.fullName || null,
            side: mapSide(bet.position),
            line_value: bet.line ? parseFloat(bet.line) : null,
            sportsbook: betSlip.book?.name || 'Unknown',
            bet_source: 'sharpsports',
            profit: calculateProfit(bet.status, bet.atRisk, bet.toWin),
            parlay_id: parlayId,
            is_parlay: parlayId !== null,
            updated_at: new Date().toISOString()
          }

          // Check if bet already exists
          const { data: existingBet } = await supabase
            .from('bets')
            .select('id, external_bet_id, status, profit')
            .eq('external_bet_id', external_bet_id)
            .single()

          if (existingBet) {
            // Update if status or profit changed
            if (existingBet.status !== mappedBet.status || 
                existingBet.profit !== mappedBet.profit) {
              
              const { error: updateError } = await supabase
                .from('bets')
                .update({
                  status: mappedBet.status,
                  profit: mappedBet.profit,
                  settled_at: mappedBet.settled_at,
                  updated_at: mappedBet.updated_at
                })
                .eq('external_bet_id', external_bet_id)

              if (updateError) {
                console.error(`❌ Error updating bet ${external_bet_id}:`, updateError)
                stats.errors++
              } else {
                console.log(`✅ Updated bet: ${external_bet_id}`)
                stats.saved++
              }
            } else {
              stats.skipped++
            }
          } else {
            // Insert new bet
            const { data: newBet, error: insertError } = await supabase
              .from('bets')
              .upsert(mappedBet, { 
                onConflict: 'external_bet_id',
                ignoreDuplicates: false 
              })
              .select()
              .single()

            if (insertError) {
              console.error(`❌ Error inserting bet ${external_bet_id}:`, insertError)
              stats.errors++
            } else {
              console.log(`✅ Inserted bet: ${external_bet_id}`)
              processedBets.push(newBet)
              stats.saved++
            }
          }

        } catch (betError) {
          console.error(`❌ Error processing bet:`, betError)
          stats.errors++
        }
      }
    }

    console.log(`✅ Bet refresh completed for bettor ${bettorId}:`, stats)

    return NextResponse.json({
      success: true,
      message: `Processed ${stats.total} bets: ${stats.saved} saved/updated, ${stats.skipped} skipped, ${stats.errors} errors`,
      stats,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('❌ Error refreshing bets:', error)
    
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

// Helper functions (same as in your sync route)
function mapProposition(proposition: string): string {
  switch (proposition?.toLowerCase()) {
    case 'spread': return 'spread'
    case 'total': return 'total'
    case 'moneyline': return 'moneyline'
    default: return 'player_prop'
  }
}

function mapStatus(status: string): string {
  switch (status?.toLowerCase()) {
    case 'pending': return 'pending'
    case 'won': return 'won'
    case 'lost': return 'lost'
    case 'cancelled': return 'cancelled'
    case 'void': return 'void'
    default: return 'pending'
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