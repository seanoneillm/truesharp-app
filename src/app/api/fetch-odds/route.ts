import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { sport, date } = await request.json();
    
    console.log('🔄 Manual odds fetch requested for:', { sport, date });
    
    // Fetch odds for current date through next week (7 days)
    const baseDate = new Date(date || new Date().toISOString().split('T')[0]);
    const promises = [];
    
    // Define all sports to fetch (or use specific sport if provided)
    const sportsToFetch = sport && sport !== 'ALL' ? [sport] : ['MLB', 'NBA', 'NFL', 'MLS', 'NHL', 'NCAAF', 'NCAAB', 'UCL'];
    
    for (let i = 0; i < 7; i++) {
      const fetchDate = new Date(baseDate);
      fetchDate.setDate(baseDate.getDate() + i);
      const dateStr = fetchDate.toISOString().split('T')[0];
      
      // Create promises for each sport
      for (const sportKey of sportsToFetch) {
        const apiUrl = new URL('/api/games/sportsgameodds', request.url);
        apiUrl.searchParams.set('sport', sportKey);
        apiUrl.searchParams.set('date', dateStr);
        apiUrl.searchParams.set('forceRefresh', 'true');
        
        promises.push(
          fetch(apiUrl.toString())
            .then(res => res.json())
            .then(data => ({
              date: dateStr,
              sport: sportKey,
              gameCount: data.games?.length || 0,
              success: !data.error
            }))
            .catch(error => ({
              date: dateStr,
              sport: sportKey,
              gameCount: 0,
              success: false,
              error: error.message
            }))
        );
      }
    }
    
    const results = await Promise.all(promises);
    const totalGames = results.reduce((sum, result) => sum + result.gameCount, 0);
    const successfulRequests = results.filter(r => r.success).length;
    
    // Group results by sport for better reporting
    const sportResults = results.reduce((acc, result) => {
      if (!acc[result.sport]) {
        acc[result.sport] = { games: 0, successfulDays: 0, totalDays: 0 };
      }
      const sportData = acc[result.sport];
      if (sportData) {
        sportData.games += result.gameCount;
        sportData.totalDays += 1;
        if (result.success) {
          sportData.successfulDays += 1;
        }
      }
      return acc;
    }, {} as Record<string, { games: number, successfulDays: number, totalDays: number }>);
    
    console.log('✅ Manual odds fetch completed:', {
      sports: sportsToFetch,
      baseDate: baseDate.toISOString().split('T')[0],
      totalGames,
      successfulRequests,
      totalRequests: promises.length,
      sportResults
    });
    
    return NextResponse.json({
      success: successfulRequests > 0,
      sports: sportsToFetch,
      baseDate: baseDate.toISOString().split('T')[0],
      totalGames,
      successfulRequests,
      totalRequests: promises.length,
      daysProcessed: 7,
      sportResults,
      results,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error during manual odds fetch:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch odds',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}