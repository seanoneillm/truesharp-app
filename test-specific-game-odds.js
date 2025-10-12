const { createClient } = require('@supabase/supabase-js');

// Test script to check specific game odds mismatch
async function testSpecificGameOdds() {
  try {
    // You'll need to add your Supabase credentials here
    const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const gameId = '0iwwmOIZXUGCfxVQmPBn';
    
    console.log(`🎯 Testing game ID: ${gameId}\n`);
    
    // 1. Check if game exists
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single();
    
    if (gameError) {
      console.error('❌ Game lookup error:', gameError);
      return;
    }
    
    console.log('🏈 Game found:', {
      id: game.id,
      home_team: game.home_team,
      away_team: game.away_team,
      league: game.league,
      game_time: game.game_time
    });
    console.log('');
    
    // 2. Check if odds exist with this exact eventid
    const { data: exactOdds, error: exactError } = await supabase
      .from('odds')
      .select('id, eventid, oddid')
      .eq('eventid', gameId)
      .limit(5);
    
    console.log(`📊 Exact eventid match (${gameId}):`, exactOdds?.length || 0, 'odds');
    if (exactOdds && exactOdds.length > 0) {
      console.log('   Sample:', exactOdds[0]);
    }
    console.log('');
    
    // 3. Check for similar eventids (in case of data corruption)
    const { data: similarOdds, error: similarError } = await supabase
      .from('odds')
      .select('eventid')
      .ilike('eventid', `%${gameId.slice(-8)}%`) // Match last 8 characters
      .limit(10);
    
    console.log(`🔍 Similar eventids (last 8 chars):`, similarOdds?.length || 0);
    if (similarOdds && similarOdds.length > 0) {
      const uniqueEventIds = [...new Set(similarOdds.map(o => o.eventid))];
      console.log('   Found eventids:', uniqueEventIds.slice(0, 5));
    }
    console.log('');
    
    // 4. Check what eventids exist for today's games
    const today = new Date();
    const startTime = new Date(today.toDateString());
    const endTime = new Date(startTime.getTime() + 24 * 60 * 60 * 1000);
    
    const { data: todayGames, error: todayError } = await supabase
      .from('games')
      .select('id, home_team, away_team')
      .gte('game_time', startTime.toISOString())
      .lt('game_time', endTime.toISOString())
      .limit(5);
    
    console.log('🏈 Today\'s sample games:');
    for (const g of todayGames || []) {
      const { data: odds } = await supabase
        .from('odds')
        .select('id', { count: 'exact' })
        .eq('eventid', g.id)
        .limit(1);
      
      console.log(`   ${g.home_team} vs ${g.away_team} (${g.id}): ${odds?.length || 0} odds`);
    }
    
  } catch (error) {
    console.error('❌ Test script error:', error);
  }
}

// Run if called directly
if (require.main === module) {
  testSpecificGameOdds();
}

module.exports = { testSpecificGameOdds };