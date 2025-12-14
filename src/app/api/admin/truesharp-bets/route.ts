import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'

const ADMIN_USER_IDS = [
  '28991397-dae7-42e8-a822-0dffc6ff49b7',
  '0e16e4f5-f206-4e62-8282-4188ff8af48a',
  'dfd44121-8e88-4c83-ad95-9fb8a4224908',
]

export async function GET() {
  try {
    console.log('🎯 Admin TrueSharp Bets API: Fetching TrueSharp bets with scores and tickets')
    
    const supabase = await createServiceRoleClient()
    
    // Get all pending TrueSharp bets
    const { data: pendingBets, error: pendingError } = await supabase
      .from('bets')
      .select(`
        id,
        user_id,
        game_id,
        sport,
        league,
        bet_type,
        bet_description,
        odds,
        oddid,
        stake,
        potential_payout,
        status,
        placed_at,
        updated_at,
        home_team,
        away_team,
        player_name,
        line_value,
        side,
        profit,
        parlay_id,
        is_parlay
      `)
      .eq('sportsbook', 'TrueSharp')
      .eq('status', 'pending')
      .order('placed_at', { ascending: false })

    if (pendingError) {
      console.error('❌ Database error fetching pending bets:', pendingError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database error occurred',
          details: pendingError.message 
        },
        { status: 500 }
      )
    }

    // Get all TrueSharp bets that have tickets (regardless of bet status)
    const { data: ticketBets, error: ticketError } = await supabase
      .from('bet_tickets')
      .select(`
        id,
        bet_id,
        user_id,
        reason,
        custom_reason,
        description,
        status,
        admin_notes,
        resolved_at,
        resolved_by,
        created_at,
        updated_at,
        bets!inner (
          id,
          user_id,
          game_id,
          sport,
          league,
          bet_type,
          bet_description,
          odds,
          oddid,
          stake,
          potential_payout,
          status,
          placed_at,
          updated_at,
          home_team,
          away_team,
          player_name,
          line_value,
          side,
          profit,
          sportsbook,
          parlay_id,
          is_parlay
        )
      `)
      .eq('bets.sportsbook', 'TrueSharp')
      .in('status', ['open', 'in_review'])
      .order('created_at', { ascending: false })

    if (ticketError) {
      console.error('❌ Database error fetching ticket bets:', ticketError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database error occurred',
          details: ticketError.message 
        },
        { status: 500 }
      )
    }

    // Combine both datasets - prioritize ticket bets
    const allBets = new Map()
    
    // Add pending bets
    if (pendingBets) {
      pendingBets.forEach((bet: any) => {
        allBets.set(bet.id, { ...bet, ticket: null })
      })
    }

    // Add ticket bets (and update existing ones with ticket info)
    if (ticketBets) {
      ticketBets.forEach((ticket: any) => {
        if (ticket.bets) {
          const bet = ticket.bets
          const ticketInfo = {
            id: ticket.id,
            bet_id: ticket.bet_id,
            user_id: ticket.user_id,
            reason: ticket.reason,
            custom_reason: ticket.custom_reason,
            description: ticket.description,
            status: ticket.status,
            admin_notes: ticket.admin_notes,
            resolved_at: ticket.resolved_at,
            resolved_by: ticket.resolved_by,
            created_at: ticket.created_at,
            updated_at: ticket.updated_at
          }
          allBets.set(bet.id, { ...bet, ticket: ticketInfo })
        }
      })
    }

    const bets = Array.from(allBets.values())
    console.log(`✅ Found ${pendingBets?.length || 0} pending bets and ${ticketBets?.length || 0} ticket bets (${bets.length} total)`)

    // Now fetch scores and game data for each bet
    if (bets && bets.length > 0) {
      console.log('🔍 Fetching scores and game data...')
      
      // Enrich bets with scores from odds table and game data
      const betsWithData = await Promise.all(
        bets.map(async (bet: any) => {
          let score = undefined
          let game = null
          
          // Fetch game data if bet has game_id
          if (bet.game_id) {
            try {
              const { data: gameData, error: gameError } = await supabase
                .from('games')
                .select(`
                  id,
                  sport,
                  home_team,
                  away_team,
                  home_team_name,
                  away_team_name,
                  game_time,
                  status,
                  home_score,
                  away_score,
                  league
                `)
                .eq('id', bet.game_id)
                .limit(1)
                .single()

              if (!gameError && gameData) {
                game = gameData
              }
            } catch (gameErr) {
              console.log(`⚠️ No game found for bet ${bet.id} (game_id: ${bet.game_id})`)
            }
          }
          
          // Fetch score if bet has both oddid and game_id
          if (bet.oddid && bet.game_id) {
            try {
              const { data: oddsData, error: oddsError } = await supabase
                .from('odds')
                .select('score')
                .eq('oddid', bet.oddid)
                .eq('eventid', bet.game_id)
                .limit(1)
                .single()

              if (!oddsError && oddsData && oddsData.score !== null) {
                score = oddsData.score
              }
            } catch (oddsErr) {
              // Silently handle cases where no matching odds found
              console.log(`⚠️ No odds found for bet ${bet.id} (oddid: ${bet.oddid}, eventid: ${bet.game_id})`)
            }
          }

          return {
            ...bet,
            score, // Add score field to bet
            game   // Add game data to bet
          }
        })
      )

      console.log(`📊 Enriched ${betsWithData.length} bets with score and game data`)

      return NextResponse.json({
        success: true,
        data: betsWithData,
        count: betsWithData.length
      })
    }

    return NextResponse.json({
      success: true,
      data: bets || [],
      count: bets?.length || 0
    })

  } catch (error) {
    console.error('❌ Unexpected error in TrueSharp bets API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}