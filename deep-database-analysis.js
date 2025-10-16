#!/usr/bin/env node

/**
 * Deep analysis of the database structure and data
 * to understand the exact schema and find the root issues
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function analyzeDatabase() {
  console.log('🔬 DEEP DATABASE ANALYSIS')
  console.log('=' .repeat(50))
  
  try {
    // 1. Check exact bets table structure
    console.log('\n📊 BETS TABLE ANALYSIS:')
    const { data: sampleBets, error: betsError } = await supabase
      .from('bets')
      .select('*')
      .limit(3)
    
    if (betsError) {
      console.error('❌ Error:', betsError)
    } else if (sampleBets && sampleBets.length > 0) {
      console.log('📋 Sample bet columns:')
      console.log(Object.keys(sampleBets[0]).join(', '))
      console.log('\n📋 Sample bet record:')
      console.log(JSON.stringify(sampleBets[0], null, 2))
    }
    
    // 2. Check exact odds table structure
    console.log('\n📊 ODDS TABLE ANALYSIS:')
    const { data: sampleOdds, error: oddsError } = await supabase
      .from('odds')
      .select('*')
      .limit(3)
    
    if (oddsError) {
      console.error('❌ Error:', oddsError)
    } else if (sampleOdds && sampleOdds.length > 0) {
      console.log('📋 Sample odds columns:')
      console.log(Object.keys(sampleOdds[0]).join(', '))
      console.log('\n📋 Sample odds record:')
      console.log(JSON.stringify(sampleOdds[0], null, 2))
    }
    
    // 3. Check games table
    console.log('\n📊 GAMES TABLE ANALYSIS:')
    const { data: sampleGames, error: gamesError } = await supabase
      .from('games')
      .select('*')
      .limit(3)
    
    if (gamesError) {
      console.error('❌ Error:', gamesError)
    } else if (sampleGames && sampleGames.length > 0) {
      console.log('📋 Sample games columns:')
      console.log(Object.keys(sampleGames[0]).join(', '))
      console.log('\n📋 Sample games record:')
      console.log(JSON.stringify(sampleGames[0], null, 2))
    }
    
    // 4. Check for any open_odds table
    console.log('\n📊 CHECKING FOR OPEN_ODDS TABLE:')
    const { data: openOdds, error: openOddsError } = await supabase
      .from('open_odds')
      .select('*')
      .limit(3)
    
    if (openOddsError) {
      console.log('❌ open_odds table error (may not exist):', openOddsError.message)
    } else if (openOdds) {
      console.log('✅ open_odds table exists')
      if (openOdds.length > 0) {
        console.log('📋 Sample open_odds columns:')
        console.log(Object.keys(openOdds[0]).join(', '))
      }
    }
    
    // 5. Check specific data relationships
    console.log('\n🔗 CHECKING DATA RELATIONSHIPS:')
    
    // Find bets with any game_id
    const { data: betsWithGameId, error: betsWithGameIdError } = await supabase
      .from('bets')
      .select('id, game_id, oddid, status')
      .not('game_id', 'is', null)
      .limit(5)
    
    if (!betsWithGameIdError && betsWithGameId && betsWithGameId.length > 0) {
      console.log(`✅ Found ${betsWithGameId.length} bets with game_id`)
      
      for (const bet of betsWithGameId) {
        // Check if corresponding game exists
        const { data: game, error: gameError } = await supabase
          .from('games')
          .select('id, status, home_score, away_score')
          .eq('id', bet.game_id)
          .maybeSingle()
        
        if (!gameError && game) {
          console.log(`  📍 Bet ${bet.id.substring(0, 8)} -> Game ${game.id}: status=${game.status}, scores=${game.home_score}-${game.away_score}`)
          
          // Check if corresponding odds exist
          if (bet.oddid) {
            const { data: odds, error: oddsMatchError } = await supabase
              .from('odds')
              .select('id, score, marketname')
              .eq('eventid', bet.game_id)
              .eq('oddid', bet.oddid)
              .limit(1)
            
            if (!oddsMatchError && odds && odds.length > 0) {
              console.log(`    🎯 Found matching odds: market=${odds[0].marketname}, score=${odds[0].score}`)
            } else {
              console.log(`    ❌ No matching odds found for oddid: ${bet.oddid}`)
            }
          }
        } else {
          console.log(`  ❌ Bet ${bet.id.substring(0, 8)} -> No game found for game_id: ${bet.game_id}`)
        }
      }
    } else {
      console.log('❌ No bets with game_id found')
    }
    
    // 6. Count summary
    console.log('\n📈 DATABASE COUNTS:')
    
    const promises = [
      supabase.from('bets').select('id', { count: 'exact', head: true }),
      supabase.from('odds').select('id', { count: 'exact', head: true }),
      supabase.from('games').select('id', { count: 'exact', head: true }),
      supabase.from('bets').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('odds').select('id', { count: 'exact', head: true }).not('score', 'is', null),
      supabase.from('games').select('id', { count: 'exact', head: true }).or('status.eq.F,status.eq.final,status.eq.completed')
    ]
    
    const [betsCount, oddsCount, gamesCount, pendingBetsCount, oddsWithScoresCount, completedGamesCount] = await Promise.all(promises)
    
    console.log(`📊 Total bets: ${betsCount.count}`)
    console.log(`📊 Total odds: ${oddsCount.count}`)
    console.log(`📊 Total games: ${gamesCount.count}`)
    console.log(`📊 Pending bets: ${pendingBetsCount.count}`)
    console.log(`📊 Odds with scores: ${oddsWithScoresCount.count}`)
    console.log(`📊 Completed games: ${completedGamesCount.count}`)
    
  } catch (error) {
    console.error('❌ Analysis failed:', error)
  }
}

analyzeDatabase().then(() => {
  console.log('\n✅ Deep analysis complete')
}).catch(error => {
  console.error('❌ Analysis error:', error)
})