import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Import your existing OddsFetcher
import { OddsFetcher } from './odds-fetcher/main.js';

async function insertGames(normalizedGames) {
  if (!normalizedGames || normalizedGames.length === 0) {
    console.log('⚠️ No games to insert');
    return 0;
  }

  console.log(`📥 Preparing to insert ${normalizedGames.length} games...`);
  
  const games = normalizedGames.map(game => ({
    id: game.id,
    hometeam: game.homeTeam,
    awayteam: game.awayTeam,
    league: game.league,
    gametime: game.gameTime,
    status: game.status,
    score: game.score,
    season: game.season,
    week: game.week,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));

  try {
    const { data, error } = await supabase
      .from('games')
      .upsert(games, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('❌ Error inserting games:', error);
      return 0;
    }

    console.log(`✅ ${data.length} games inserted/updated`);
    return data.length;
  } catch (err) {
    console.error('❌ Failed to insert games:', err);
    return 0;
  }
}

async function insertOdds(normalizedOdds) {
  if (!normalizedOdds || normalizedOdds.length === 0) {
    console.log('⚠️ No odds to insert');
    return { inserted: 0, updated: 0 };
  }

  console.log(`📥 Preparing to insert ${normalizedOdds.length} odds...`);
  
  let insertedCount = 0;
  let updatedCount = 0;
  let batchSize = 100; // Process in batches to avoid overwhelming the database

  for (let i = 0; i < normalizedOdds.length; i += batchSize) {
    const batch = normalizedOdds.slice(i, i + batchSize);
    console.log(`🔄 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(normalizedOdds.length/batchSize)} (${batch.length} odds)`);

    for (const odd of batch) {
      try {
        // Check if oddID already exists
        const { data: existingOdds, error: checkError } = await supabase
          .from('odds')
          .select('id, oddid')
          .eq('oddid', odd.oddId)
          .order('created_at', { ascending: true });

        if (checkError) {
          console.error(`❌ Error checking existing odds for ${odd.oddId}:`, checkError);
          continue;
        }

        const oddData = {
          eventid: odd.eventId,
          sportsbook: odd.sportsbook || 'unknown',
          marketname: odd.marketName || 'unknown',
          statid: odd.statId || null,
          bettypeid: odd.betTypeId || null,
          closebookodds: odd.closeBookOdds || null,
          bookodds: odd.bookOdds || null,
          odds_type: 'current',
          leagueid: odd.leagueId,
          hometeam: odd.homeTeam,
          awayteam: odd.awayTeam,
          oddid: odd.oddId,
          playerid: odd.playerId || null,
          periodid: odd.periodId || null,
          sideid: odd.sideId || null,
          fanduelodds: odd.fanduelOdds || null,
          fanduellink: odd.fanduelLink || null,
          espnbetodds: odd.espnbetOdds || null,
          espnbetlink: odd.espnbetLink || null,
          ceasarsodds: odd.ceasarsOdds || null,
          ceasarslink: odd.ceasarsLink || null,
          mgmodds: odd.mgmOdds || null,
          mgmlink: odd.mgmLink || null,
          fanaticsodds: odd.fanaticsOdds || null,
          fanaticslink: odd.fanaticsLink || null,
          draftkingsodds: odd.draftkingsOdds || null,
          draftkingslink: odd.draftkingsLink || null,
          score: odd.score || null,
          fetched_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        };

        if (existingOdds && existingOdds.length >= 2) {
          // Update the second (most recent) entry
          const { error: updateError } = await supabase
            .from('odds')
            .update({
              ...oddData,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingOdds[1].id);

          if (updateError) {
            console.error(`❌ Error updating odd ${odd.oddId}:`, updateError);
          } else {
            updatedCount++;
          }
        } else {
          // Insert new odd
          const { error: insertError } = await supabase
            .from('odds')
            .insert(oddData);

          if (insertError) {
            console.error(`❌ Error inserting odd ${odd.oddId}:`, insertError);
            // Log the first few errors to debug data format issues
            if (insertedCount < 5) {
              console.error('Sample odd data:', JSON.stringify(oddData, null, 2));
            }
          } else {
            insertedCount++;
          }
        }
      } catch (err) {
        console.error(`❌ Failed to process odd ${odd.oddId}:`, err);
      }
    }
  }

  console.log(`✅ ${insertedCount} odds inserted`);
  console.log(`✅ ${updatedCount} odds updated`);
  
  return { inserted: insertedCount, updated: updatedCount };
}

async function main() {
  console.log('🚀 Starting MLB odds fetch and database insert test...\n');
  
  try {
    // Test Supabase connection
    console.log('🔧 Testing Supabase connection...');
    const { data, error } = await supabase.from('games').select('count').limit(1);
    if (error) {
      console.error('❌ Supabase connection failed:', error);
      return;
    }
    console.log('✅ Supabase connected successfully\n');
    
    // Initialize the OddsFetcher with database insert enabled
    const fetcher = new OddsFetcher({
      testMode: false, // Enable actual database operations
      leagues: ['MLB'],
      dateRange: {
        start: '2025-08-14',
        end: '2025-08-15'
      }
    });
    
    console.log('📡 Fetching odds using your existing fetcher...');
    
    // Use your existing fetch and normalize logic
    await fetcher.fetchOdds();
    
    // Get the normalized data from the fetcher
    const normalizedGames = fetcher.getNormalizedGames();
    const normalizedOdds = fetcher.getNormalizedOdds();
    
    console.log(`\n📊 Data Retrieved:`);
    console.log(`🎮 Games: ${normalizedGames.length}`);
    console.log(`📊 Odds: ${normalizedOdds.length}`);
    
    if (normalizedGames.length === 0) {
      console.log('❌ No games found to insert');
      return;
    }
    
    // Insert games first (odds have foreign key dependency)
    console.log('\n📥 Inserting games into database...');
    const gamesInserted = await insertGames(normalizedGames);
    
    // Insert odds
    console.log('\n📥 Inserting odds into database...');
    const oddsResult = await insertOdds(normalizedOdds);
    
    // Summary
    console.log('\n✨ Database Insert Summary:');
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📊 Games processed: ${normalizedGames.length}`);
    console.log(`🏟️  Games inserted/updated: ${gamesInserted}`);
    console.log(`🎯 Odds inserted: ${oddsResult.inserted}`);
    console.log(`🔄 Odds updated: ${oddsResult.updated}`);
    console.log(`📈 Total odds processed: ${oddsResult.inserted + oddsResult.updated}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    
    // Sample data verification
    if (gamesInserted > 0) {
      console.log('\n🔍 Verifying database inserts...');
      const { data: sampleGames } = await supabase
        .from('games')
        .select('id, hometeam, awayteam, league')
        .limit(3);
      
      const { data: sampleOdds } = await supabase
        .from('odds')
        .select('oddid, marketname, sportsbook, bookodds')
        .limit(5);
      
      console.log('\n✅ Sample games in database:');
      sampleGames?.forEach((game, i) => {
        console.log(`  ${i+1}. ${game.awayteam} @ ${game.hometeam} (${game.league})`);
      });
      
      console.log('\n✅ Sample odds in database:');
      sampleOdds?.forEach((odd, i) => {
        console.log(`  ${i+1}. ${odd.marketname} - ${odd.sportsbook}: ${odd.bookodds}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Process failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
main();
