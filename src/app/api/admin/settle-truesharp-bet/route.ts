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
    
    if (!['won', 'lost', 'void'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status. Must be: won, lost, or void' },
        { status: 400 }
      )
    }
    
    if (typeof profit !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Profit must be a number' },
        { status: 400 }
      )
    }
    
    // The original precision issue was caused by ROI calculations exceeding DECIMAL(5,2)
    // This has been fixed by updating user_performance_cache.roi to DECIMAL(8,2)
    console.log(`🔍 Profit to be stored: ${profit}`)
    
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
    
    // Allow re-settlement (changing from any status to any other status)
    // Remove the pending-only restriction
    
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
      console.error('❌ Full error details:', JSON.stringify(updateError, null, 2))
      console.error('❌ Attempted values:', { betId, status, profit })
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to settle bet - database constraint issue',
          details: updateError.message,
          dbError: updateError
        },
        { status: 500 }
      )
    }
    
    const wasAlreadySettled = existingBet.status !== 'pending'
    const actionType = wasAlreadySettled ? 'changed' : 'settled'
    
    console.log(`✅ Successfully ${actionType} TrueSharp bet ${betId} from ${existingBet.status} to ${status} with profit ${profit}`)
    
    return NextResponse.json({
      success: true,
      message: `Bet ${actionType} as ${status.toUpperCase()}. Profit: ${profit >= 0 ? '+' : ''}$${profit.toFixed(2)}${wasAlreadySettled ? ` (was ${existingBet.status})` : ''}`,
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