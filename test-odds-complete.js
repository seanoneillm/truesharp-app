import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Mock data for testing when API is not available
const mockEventData = [
  {
    id: 'test-game-1',
    homeTeam: 'Lakers',
    awayTeam: 'Warriors',
    league: 'NBA',
    gameTime: new Date().toISOString(),
    status: 'scheduled',
    score: null,
    season: '2024',
    week: null,
    odds: [
      {
        oddID: 'test-odd-1',
        sportsbook: 'FanDuel',
        marketName: 'Moneyline',
        bookOdds: -110,
        fanduelOdds: -110
      },
      {
        oddID: 'test-odd-2',
        sportsbook: 'DraftKings',
        marketName: 'Point Spread',
        bookOdds: -105,
        draftkingsOdds: -105
      }
    ]
  },
  {
    id: 'test-game-2',
    homeTeam: 'Chiefs',
    awayTeam: 'Bills',
    league: 'NFL',
    gameTime: new Date().toISOString(),
    status: 'scheduled',
    score: null,
    season: '2024',
    week: '15',
    odds: [
      {
        oddID: 'test-odd-3',
        sportsbook: 'MGM',
        marketName: 'Total Points',
        bookOdds: 105,
        mgmOdds: 105
      }
    ]
  }
];

// Fetch and normalize odds from API or use mock data
async function fetchAndNormalizeOdds() {
  const apiKey = process.env.SPORTSGAMEODDS_API_KEY;
  
  // If no API key, use mock data for testing
  if (!apiKey || apiKey === 'your_api_key_here') {
    console.log('🧪 No API key found, using mock data for testing...');
    return mockEventData;
  }
  
  const url = `https://api.sportsgameodds.com/events?api_key=${apiKey}&page=1&limit=20`;
  
  try {
    console.log('🔄 Fetching odds from API...');
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`✅ Fetched ${data.events?.length || 0} events`);
    
    // Normalize the data structure (adjust based on your actual API response)
    const normalizedEvents = data.events?.map(event => ({
      id: event.id || event.eventId,
      homeTeam: event.homeTeam || event.home_team,
      awayTeam: event.awayTeam || event.away_team,
      league: event.league || event.sport,
      gameTime: event.gameTime || event.start_time,
      status: event.status || 'scheduled',
      score: event.score || null,
      season: event.season || null,
      week: event.week || null,
      odds: event.odds || []
    })) || [];
    
    console.log('✅ Events normalized');
    return normalizedEvents;
    
  } catch (error) {
    console.error('❌ Error fetching odds:', error);
    console.log('🧪 Falling back to mock data...');
    return mockEventData;
  }
}

async function insertGames(eventData) {
  if (!eventData || eventData.length === 0) {
    console.log('⚠️ No events to insert');
    return 0;
  }

  const games = eventData.map(event => ({
    id: event.id,
    hometeam: event.homeTeam,
    awayteam: event.awayTeam,
    league: event.league,
    gametime: event.gameTime,
    status: event.status,
    score: event.score,
    season: event.season,
    week: event.week,
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

async function insertOdds(eventData) {
  let insertedCount = 0;
  let updatedCount = 0;

  for (const event of eventData) {
    if (!event.odds || event.odds.length === 0) {
      console.log(`⚠️ No odds for event ${event.id}`);
      continue;
    }

    console.log(`🔄 Processing ${event.odds.length} odds for event ${event.id}`);

    for (const odd of event.odds) {
      try {
        // Check if oddID already exists
        const { data: existingOdds, error: checkError } = await supabase
          .from('odds')
          .select('id, oddid')
          .eq('oddid', odd.oddID || odd.id)
          .order('created_at', { ascending: true });

        if (checkError) {
          console.error(`❌ Error checking existing odds for ${odd.oddID}:`, checkError);
          continue;
        }

        const oddData = {
          eventid: event.id,
          sportsbook: odd.sportsbook || 'unknown',
          marketname: odd.marketName || odd.market_name || 'unknown',
          statid: odd.statId || null,
          bettypeid: odd.betTypeId || null,
          closebookodds: odd.closeBookOdds || null,
          bookodds: odd.bookOdds || null,
          odds_type: 'current',
          leagueid: event.league,
          hometeam: event.homeTeam,
          awayteam: event.awayTeam,
          oddid: odd.oddID || odd.id,
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
          score: event.score,
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
            console.error(`❌ Error updating odd ${odd.oddID}:`, updateError);
          } else {
            updatedCount++;
          }
        } else {
          // Insert new odd
          const { error: insertError } = await supabase
            .from('odds')
            .insert(oddData);

          if (insertError) {
            console.error(`❌ Error inserting odd ${odd.oddID}:`, insertError);
            console.error('Odd data:', oddData);
          } else {
            insertedCount++;
          }
        }
      } catch (err) {
        console.error(`❌ Failed to process odd ${odd.oddID || odd.id}:`, err);
      }
    }
  }

  console.log(`✅ ${insertedCount} odds inserted`);
  console.log(`✅ ${updatedCount} odds updated`);
  
  return { inserted: insertedCount, updated: updatedCount };
}

async function main() {
  try {
    console.log('🚀 Starting complete odds fetch and insert test...\n');
    
    // Test Supabase connection
    console.log('🔧 Testing Supabase connection...');
    const { data, error } = await supabase.from('games').select('count').limit(1);
    if (error) {
      console.error('❌ Supabase connection failed:', error);
      return;
    }
    console.log('✅ Supabase connected successfully\n');
    
    // Fetch and normalize odds
    const eventData = await fetchAndNormalizeOdds();
    
    if (!eventData || eventData.length === 0) {
      console.log('❌ No event data to insert');
      return;
    }

    console.log(`\n📊 Processing ${eventData.length} events`);
    
    // Log sample event structure
    if (eventData[0]) {
      console.log('\n📋 Sample event structure:');
      console.log(JSON.stringify(eventData[0], null, 2));
    }
    
    // Insert games
    console.log('\n📥 Inserting games...');
    const gamesInserted = await insertGames(eventData);
    
    // Insert odds
    console.log('\n📥 Inserting odds...');
    const oddsResult = await insertOdds(eventData);
    
    console.log('\n✨ Final Summary:');
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📊 Events processed: ${eventData.length}`);
    console.log(`🏟️  Games inserted/updated: ${gamesInserted}`);
    console.log(`🎯 Odds inserted: ${oddsResult.inserted}`);
    console.log(`🔄 Odds updated: ${oddsResult.updated}`);
    console.log(`📈 Total odds processed: ${oddsResult.inserted + oddsResult.updated}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    
  } catch (error) {
    console.error('❌ Main process failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the script
main();
