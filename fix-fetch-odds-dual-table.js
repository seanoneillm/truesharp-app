// COMPREHENSIVE FIX for fetch-odds-dual-table route
// This fixes the major double-filtering issue causing missing player props

// The core issue: Manual duplicate checking conflicts with database triggers
// Solution: Remove manual filtering and let triggers handle ALL duplicate logic

// REPLACE the saveOddsDataWithDualTables function with this fixed version:

async function saveOddsDataWithDualTables(gameId, odds) {
  try {
    const oddsRecords = []

    // Check if game has started
    const { data: gameData } = await supabase
      .from('games')
      .select('status, game_time')
      .eq('id', gameId)
      .single()
    
    const gameHasStarted = gameData?.status === 'started' || 
                          gameData?.status === 'live' || 
                          gameData?.status === 'final' ||
                          (gameData?.game_time && await checkGameHasStarted(gameData.game_time))

    if (gameHasStarted) {
      console.log(`⏭️ Skipping game ${gameId} - already started`)
      return
    }

    // Process all odds from API
    const oddsArray = Object.values(odds)
    
    // Track processed odds to avoid app-level duplicates (not database duplicates)
    const processedMainLines = new Set()
    const processedAltLines = new Set()
    
    for (const odd of oddsArray) {
      const oddId = odd.oddID
      if (!oddId) continue

      // FIXED: Simplified main line processing
      const mainLineKey = `${gameId}:${oddId}`
      if (!processedMainLines.has(mainLineKey)) {
        console.log(`📍 Processing main line for oddId: ${oddId}`)
        await processOddRecord(odd, oddId, gameId, oddsRecords)
        processedMainLines.add(mainLineKey)
      }

      // Process alternate lines from sportsbooks
      const byBookmaker = odd.byBookmaker || {}
      
      for (const [sportsbookName, sportsbookData] of Object.entries(byBookmaker)) {
        const sportsbook = sportsbookData
        const altLines = sportsbook.altLines || []
        
        if (altLines.length > 0) {
          console.log(`🔄 Found ${altLines.length} alternate lines for ${oddId} from ${sportsbookName}`)
          
          for (const altLine of altLines) {
            const lineValue = altLine.spread || altLine.overUnder || `alt-${Date.now()}`
            const altLineKey = `${gameId}:${oddId}:${lineValue}`
            
            if (!processedAltLines.has(altLineKey)) {
              const altOdd = {
                marketName: odd.marketName,
                betTypeID: odd.betTypeID,
                sideID: odd.sideID,
                oddID: odd.oddID,
                bookOdds: altLine.odds,
                bookSpread: altLine.spread,
                bookOverUnder: altLine.overUnder,
                fairSpread: altLine.spread,
                fairOverUnder: altLine.overUnder,
                byBookmaker: { [sportsbookName]: sportsbook }
              }
              
              await processOddRecord(altOdd, oddId, gameId, oddsRecords)
              processedAltLines.add(altLineKey)
            }
          }
        }
      }
    }

    if (oddsRecords.length > 0) {
      console.log(`🔍 Attempting to insert ${oddsRecords.length} total records for game ${gameId}`)
      
      // Add timestamps to all records
      const recordsWithTimestamp = oddsRecords.map(record => ({
        ...record,
        updated_at: new Date().toISOString(),
      }))

      // Log sample records for debugging
      console.log(`📋 Sample records:`)
      recordsWithTimestamp.slice(0, 3).forEach((record, i) => {
        console.log(`  ${i + 1}. eventid: ${record.eventid}, oddid: ${record.oddid}, line: ${record.line}, marketname: ${record.marketname}`)
      })

      // CRITICAL FIX: Remove all manual duplicate checking
      // Let database triggers handle ALL duplicate logic
      
      // Insert into open_odds (triggers will handle duplicates)
      const { error: openOddsError, data: insertedOpenOdds } = await supabase
        .from('open_odds')
        .insert(recordsWithTimestamp)
        .select('id')

      let openOddsInserted = 0
      if (!openOddsError) {
        openOddsInserted = insertedOpenOdds?.length || 0
        console.log(`✅ Open odds: ${openOddsInserted} records processed by triggers`)
      } else if (!openOddsError.message?.includes('duplicate')) {
        console.error('❌ Error inserting into open_odds:', openOddsError)
      } else {
        console.log('ℹ️ Open odds: Some duplicates handled by triggers (expected)')
      }

      // Insert into odds table (triggers will handle duplicates)  
      if (!gameHasStarted) {
        const { error: oddsError, data: insertedOdds } = await supabase
          .from('odds')
          .insert(recordsWithTimestamp)
          .select('id')

        let oddsInserted = 0
        if (!oddsError) {
          oddsInserted = insertedOdds?.length || 0
          console.log(`✅ Current odds: ${oddsInserted} records processed by triggers`)
        } else if (!oddsError.message?.includes('duplicate')) {
          console.error('❌ Error inserting into odds:', oddsError)
        } else {
          console.log('ℹ️ Current odds: Some duplicates handled by triggers (expected)')
        }
      }

      console.log(`✅ Completed processing ${oddsRecords.length} odds records for game ${gameId}`)
      
      // ENHANCED LOGGING: Count different types of odds
      const mainLines = recordsWithTimestamp.filter(r => !r.line || r.line === null).length
      const altLines = recordsWithTimestamp.filter(r => r.line && r.line !== null && r.line !== '').length
      const playerProps = recordsWithTimestamp.filter(r => 
        r.marketname && (
          r.marketname.includes('player') || 
          r.marketname.includes('prop') ||
          r.bettypeid?.includes('player') ||
          r.bettypeid?.includes('prop')
        )
      ).length
      
      console.log(`📊 Odds breakdown - Main lines: ${mainLines}, Alt lines: ${altLines}, Player props: ${playerProps}`)
      
    } else {
      console.log(`⚠️ No odds records generated for game ${gameId}`)
    }
  } catch (error) {
    console.error('❌ Error in saveOddsDataWithDualTables:', error)
    throw error // Re-throw to help with debugging
  }
}

// Additional helper to normalize line values consistently
function normalizeLineValue(line) {
  if (line === null || line === undefined || line === 'null' || line === '') {
    return null
  }
  return String(line)
}

// USAGE INSTRUCTIONS:
// 1. Replace the saveOddsDataWithDualTables function in fetch-odds-dual-table/route.ts with the above
// 2. Add the normalizeLineValue helper function
// 3. Update processOddRecord to use normalizeLineValue for line values
// 4. Apply the database trigger fixes
// 5. Test the fetch operation