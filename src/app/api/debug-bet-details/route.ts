import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // These are the bet_ids from your strategy_bets table
    const betIds = [
      'b9f52ff7-29af-4465-adb2-e00e6774747e',
      '2283d592-18ee-4b70-9850-8fb4bbc23b81', 
      '657cf1b0-5eb2-4149-af5e-aaea8b905a1d',
      '59fb2c22-2d33-4a40-8c77-2ec95c66307d'
    ];

    console.log('=== CHECKING SPECIFIC BET IDS ===');

    // Check what's in the bets table for these IDs
    const { data: betDetails, error: betDetailsError } = await supabase
      .from('bets')
      .select(`
        id,
        user_id,
        sport,
        league,
        bet_description,
        status,
        game_date,
        strategy_id,
        created_at,
        placed_at
      `)
      .in('id', betIds);

    console.log('Bet details for strategy_bets IDs:', { betDetails, betDetailsError, count: betDetails?.length });

    // Check if any of these bets exist at all
    const results = [];
    for (const betId of betIds) {
      const { data: singleBet, error } = await supabase
        .from('bets')
        .select('*')
        .eq('id', betId)
        .single();
      
      results.push({
        betId,
        exists: !!singleBet,
        data: singleBet,
        error: error?.message
      });
    }

    console.log('Individual bet checks:', results);

    return NextResponse.json({
      betIds,
      betDetails: { data: betDetails, count: betDetails?.length },
      individualChecks: results,
      summary: {
        totalBetIds: betIds.length,
        foundBets: betDetails?.length || 0,
        missingBets: betIds.length - (betDetails?.length || 0)
      }
    });

  } catch (error) {
    console.error('Debug bet details error:', error);
    return NextResponse.json(
      { error: 'Debug failed', details: error },
      { status: 500 }
    );
  }
}