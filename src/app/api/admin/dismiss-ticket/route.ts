import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'

const ADMIN_USER_IDS = [
  '28991397-dae7-42e8-a822-0dffc6ff49b7',
  '0e16e4f5-f206-4e62-8282-4188ff8af48a',
  'dfd44121-8e88-4c83-ad95-9fb8a4224908',
]

export async function POST(request: NextRequest) {
  try {
    console.log('🎯 Admin Dismiss Ticket API: Processing ticket dismissal')
    
    const body = await request.json()
    const { ticketId } = body
    
    // Validate input
    if (!ticketId) {
      return NextResponse.json(
        { success: false, error: 'Ticket ID is required' },
        { status: 400 }
      )
    }
    
    const supabase = await createServiceRoleClient()
    
    // First, verify the ticket exists and is in open/in_review status
    const { data: existingTicket, error: fetchError } = await supabase
      .from('bet_tickets')
      .select('id, status, bet_id, reason')
      .eq('id', ticketId)
      .single()
    
    if (fetchError) {
      console.error('❌ Error fetching ticket:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Ticket not found' },
        { status: 404 }
      )
    }
    
    if (!['open', 'in_review'].includes(existingTicket.status)) {
      return NextResponse.json(
        { success: false, error: 'This ticket has already been resolved' },
        { status: 400 }
      )
    }
    
    // Update the ticket to closed status
    const { data: updatedTicket, error: updateError } = await supabase
      .from('bet_tickets')
      .update({
        status: 'closed',
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        admin_notes: 'Ticket dismissed by admin - no action needed'
      })
      .eq('id', ticketId)
      .select()
      .single()
    
    if (updateError) {
      console.error('❌ Error updating ticket:', updateError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to dismiss ticket',
          details: updateError.message 
        },
        { status: 500 }
      )
    }
    
    console.log(`✅ Successfully dismissed ticket ${ticketId} for bet ${existingTicket.bet_id}`)
    
    return NextResponse.json({
      success: true,
      message: `Ticket dismissed successfully`,
      data: updatedTicket
    })

  } catch (error) {
    console.error('❌ Unexpected error in dismiss ticket API:', error)
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