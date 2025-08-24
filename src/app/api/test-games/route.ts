import { gamesDataService } from '@/lib/services/games-data';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const testDate = searchParams.get('date') || '2024-08-14';
    
    console.log('🔍 API: Testing database connection...');
    console.log('📅 API: Using date:', testDate);
    
    // Test connection
    const connectionOk = await gamesDataService.testConnection();
    console.log('🔗 API: Connection test result:', connectionOk);
    
    if (!connectionOk) {
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        data: null
      });
    }
    
    console.log('🎯 API: Fetching MLB games for', testDate);
    const mlbGames = await gamesDataService.getMLBGamesForDate(testDate);
    console.log('🎯 API: Found', mlbGames.length, 'MLB games');
    
    if (mlbGames.length > 0) {
      console.log('📊 API: Sample game:', mlbGames[0]);
    }
    
    // Get data summary
    const summary = await gamesDataService.getDataSummary();
    console.log('📊 API: Database summary:', summary);
    
    return NextResponse.json({
      success: true,
      data: {
        connectionOk,
        testDate,
        mlbGamesCount: mlbGames.length,
        sampleGame: mlbGames[0] || null,
        summary
      }
    });
    
  } catch (error) {
    console.error('❌ API: Error testing games:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    });
  }
}
