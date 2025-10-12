#!/usr/bin/env node

// Quick test for MLB odds today with alternate lines check
const SPORTSGAMEODDS_API_BASE = 'https://api.sportsgameodds.com/v2'
const API_KEY = process.env.NEXT_PUBLIC_ODDS_API_KEY

async function testMLBOddsToday() {
  console.log('🔍 Testing MLB odds for today with alternate lines...')
  
  if (!API_KEY) {
    console.error('❌ NEXT_PUBLIC_ODDS_API_KEY not found in environment')
    return
  }

  try {
    // Get today's date only
    const today = new Date()
    const todayISO = today.toISOString().split('T')[0]
    const tomorrowISO = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const params = new URLSearchParams()
    params.append('leagueID', 'MLB')
    params.append('type', 'match')
    params.append('startsAfter', todayISO)
    params.append('startsBefore', tomorrowISO)
    params.append('limit', '1') // Only 1 game
    params.append('includeAltLines', 'true') // FIXED: Include alternate lines

    const apiUrl = `${SPORTSGAMEODDS_API_BASE}/events?${params.toString()}`
    console.log(`📡 API URL: ${apiUrl.replace(API_KEY, 'XXX')}`)

    const response = await fetch(apiUrl, {
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    if (!data.success || !data.data || data.data.length === 0) {
      console.log('⚠️ No MLB games found for today')
      return
    }

    const game = data.data[0]
    console.log(`\n🎮 Found game: ${game.teams?.away?.names?.long || game.teams?.away?.name} @ ${game.teams?.home?.names?.long || game.teams?.home?.name}`)
    console.log(`📅 Game time: ${game.status?.startsAt}`)
    
    if (!game.odds) {
      console.log('❌ No odds data found for this game')
      return
    }

    // Analyze odds for alternate lines
    const oddsArray = Object.values(game.odds)
    console.log(`\n📊 Total odds entries: ${oddsArray.length}`)

    // Group by oddID to find alternates
    const oddsByOddId = new Map()
    const alternateLines = new Map()
    
    for (const odd of oddsArray) {
      const oddId = odd.oddID
      if (oddId) {
        if (!oddsByOddId.has(oddId)) {
          oddsByOddId.set(oddId, [])
        }
        oddsByOddId.get(oddId).push(odd)
        
        // Track if this oddID has multiple entries (alternates)
        if (oddsByOddId.get(oddId).length > 1) {
          alternateLines.set(oddId, oddsByOddId.get(oddId))
        }
      }
    }

    console.log(`🔢 Unique oddIDs: ${oddsByOddId.size}`)
    console.log(`🔄 oddIDs with alternate lines: ${alternateLines.size}`)

    if (alternateLines.size > 0) {
      console.log('\n✅ ALTERNATE LINES FOUND:')
      let count = 0
      for (const [oddId, alts] of alternateLines) {
        if (count >= 5) break // Show first 5 examples
        console.log(`\n📋 ${oddId} (${alts[0].marketName}):`)
        for (const alt of alts) {
          const line = alt.bookSpread || alt.bookOverUnder || alt.fairSpread || alt.fairOverUnder || 'N/A'
          console.log(`  📈 Line: ${line}, Odds: ${alt.bookOdds || alt.fairOdds}`)
        }
        count++
      }
    } else {
      console.log('\n❌ No alternate lines found - this indicates an issue')
    }

    // Show sample of different market types
    console.log('\n📋 Sample odds by market type:')
    const marketTypes = new Set()
    for (const odd of oddsArray.slice(0, 10)) {
      const market = odd.marketName || 'Unknown'
      const betType = odd.betTypeID || 'Unknown'
      marketTypes.add(`${market} (${betType})`)
    }
    
    marketTypes.forEach(market => console.log(`  🎯 ${market}`))

    // Test alternate lines processing (new logic)
    console.log('\n🔧 Testing NEW alternate lines processing logic:')
    let totalAltLines = 0
    let oddsWithAlts = 0
    
    for (const odd of oddsArray.slice(0, 5)) { // Test first 5 odds
      const byBookmaker = odd.byBookmaker || {}
      let altLinesForThisOdd = 0
      
      for (const [sportsbookName, sportsbookData] of Object.entries(byBookmaker)) {
        const altLines = sportsbookData?.altLines || []
        if (altLines.length > 0) {
          altLinesForThisOdd += altLines.length
          console.log(`  📈 ${odd.oddID}: ${altLines.length} alt lines from ${sportsbookName}`)
        }
      }
      
      if (altLinesForThisOdd > 0) {
        oddsWithAlts++
        totalAltLines += altLinesForThisOdd
      }
    }
    
    console.log(`\n✅ SUMMARY: ${oddsWithAlts}/5 odds have alternate lines, ${totalAltLines} total alt lines found`)
    
    if (totalAltLines > 0) {
      console.log('🎉 Alternate lines processing should now work correctly!')
    } else {
      console.log('⚠️ No alternate lines found in this sample')
    }

  } catch (error) {
    console.error('❌ Error testing MLB odds:', error.message)
  }
}

testMLBOddsToday()