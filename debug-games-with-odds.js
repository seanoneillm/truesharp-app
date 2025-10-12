const { createClient } = require('@supabase/supabase-js');

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugGamesWithOdds() {
  try {
    console.log('🎯 Checking which games have odds...\n');
    
    // Get today's games
    const today = new Date();
    const startTime = new Date(today.toDateString());
    const endTime = new Date(startTime.getTime() + 24 * 60 * 60 * 1000);
    
    const { data: games, error: gamesError } = await supabase
      .from('games')
      .select('id, home_team, away_team, league, game_time')
      .gte('game_time', startTime.toISOString())
      .lt('game_time', endTime.toISOString())
      .order('game_time', { ascending: true })
      .limit(10); // Just check first 10 games
    
    if (gamesError) {
      console.error('❌ Error fetching games:', gamesError);
      return;
    }
    
    console.log(`📊 Found ${games.length} games today\n`);
    
    // Check odds for each game
    for (const game of games) {
      console.log(`🏈 ${game.home_team} vs ${game.away_team} (${game.id})`);
      
      // Count all odds for this game
      const { data: allOdds, error: oddsError } = await supabase
        .from('odds')
        .select('id, oddid, line, score', { count: 'exact' })
        .eq('eventid', game.id)
        .limit(1000);
      
      if (oddsError) {
        console.error(`❌ Error fetching odds for ${game.id}:`, oddsError);
        continue;
      }
      
      console.log(`   📊 Total odds: ${allOdds?.length || 0}`);
      
      if (allOdds && allOdds.length > 0) {
        // Sample a few odds to see their structure
        const sampleOdds = allOdds.slice(0, 3);
        console.log(`   📋 Sample odds:`, sampleOdds.map(o => ({
          oddid: o.oddid,
          line: o.line,
          score: o.score,
          hasScore: o.score !== null
        })));
        
        // Count how many have score values
        const withScore = allOdds.filter(o => o.score !== null).length;
        console.log(`   🏆 Odds with score: ${withScore} / ${allOdds.length}`);
      }
      
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Debug script error:', error);
  }
}

debugGamesWithOdds();