import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'

const ADMIN_USER_IDS = [
  '28991397-dae7-42e8-a822-0dffc6ff49b7',
  '0e16e4f5-f206-4e62-8282-4188ff8af48a',
  'dfd44121-8e88-4c83-ad95-9fb8a4224908',
]

export async function POST(request: NextRequest) {
  try {
    console.log('🎯 Admin Settle TrueSharp Bet API: Processing bet settlement')
    
    const body = await request.json()
    const { betId, status, profit } = body
    
    // Validate input
    if (!betId) {
      return NextResponse.json(
        { success: false, error: 'Bet ID is required' },
        { status: 400 }
      )
    }
    
    if (!['won', 'lost', 'push'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status. Must be: won, lost, or push' },
        { status: 400 }
      )
    }
    
    if (typeof profit !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Profit must be a number' },
        { status: 400 }
      )
    }
    
    const supabase = await createServiceRoleClient()
    
    // First, verify the bet exists and is a TrueSharp bet in pending status
    const { data: existingBet, error: fetchError } = await supabase
      .from('bets')
      .select('id, sportsbook, status, stake, potential_payout, bet_description')
      .eq('id', betId)
      .single()
    
    if (fetchError) {
      console.error('❌ Error fetching bet:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Bet not found' },
        { status: 404 }
      )
    }
    
    if (existingBet.sportsbook !== 'TrueSharp') {
      return NextResponse.json(
        { success: false, error: 'This bet is not a TrueSharp bet' },
        { status: 400 }
      )
    }
    
    if (existingBet.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'This bet has already been settled' },
        { status: 400 }
      )
    }
    
    // Update the bet with settlement information
    const { data: updatedBet, error: updateError } = await supabase
      .from('bets')
      .update({
        status: status,
        profit: profit,
        settled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', betId)
      .select()
      .single()
    
    if (updateError) {
      console.error('❌ Error updating bet:', updateError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to settle bet',
          details: updateError.message 
        },
        { status: 500 }
      )
    }
    
    console.log(`✅ Successfully settled TrueSharp bet ${betId} as ${status} with profit ${profit}`)
    
    return NextResponse.json({
      success: true,
      message: `Bet settled as ${status} with profit $${profit.toFixed(2)}`,
      data: updatedBet
    })

  } catch (error) {
    console.error('❌ Unexpected error in settle TrueSharp bet API:', error)
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