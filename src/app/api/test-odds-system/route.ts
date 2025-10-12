import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'analyze'
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    console.log(`🧪 Testing odds system - action: ${action}`)
    
    if (action === 'analyze') {
      return await analyzeOddsSystem(supabase)
    } else if (action === 'test-fetch') {
      return await testOddsFetch(supabase)
    } else if (action === 'fix-duplicates') {
      return await fixDuplicatesInPlace(supabase)
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    
  } catch (error) {
    console.error('❌ Error in test-odds-system:', error)
    return NextResponse.json(
      { error: 'Failed to test odds system', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

async function analyzeOddsSystem(supabase: any) {
  console.log('🔍 Analyzing current odds system state...')
  
  // Get recent games for analysis
  const { data: games } = await supabase
    .from('games')
    .select('id, home_team_name, away_team_name, league, game_time')
    .gte('game_time', new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()) // Last 2 days
    .limit(10)
  
  const analysis: any = {
    games: games?.length || 0,
    totalOdds: 0,
    totalOpenOdds: 0,
    duplicateIssues: [],
    sampleGame: null
  }
  
  if (games && games.length > 0) {
    // Analyze first game in detail
    const sampleGame = games[0]
    analysis.sampleGame = {
      id: sampleGame.id,
      teams: `${sampleGame.home_team_name} vs ${sampleGame.away_team_name}`,
      league: sampleGame.league
    }
    
    // Get odds for sample game
    const { data: sampleOdds } = await supabase
      .from('odds')
      .select('id, oddid, line, fetched_at, fanduelodds, draftkingsodds')
      .eq('eventid', sampleGame.id)
      .order('fetched_at', { ascending: false })
    
    const { data: sampleOpenOdds } = await supabase
      .from('open_odds')
      .select('id, oddid, line, fetched_at, fanduelodds, draftkingsodds')
      .eq('eventid', sampleGame.id)
      .order('fetched_at', { ascending: true })
    
    analysis.sampleGame.oddsCount = sampleOdds?.length || 0
    analysis.sampleGame.openOddsCount = sampleOpenOdds?.length || 0
    analysis.sampleGame.sampleOdds = sampleOdds?.slice(0, 5) || []
    
    // Check for duplicates in sample game
    if (sampleOdds) {
      const duplicateMap = new Map<string, number>()
      sampleOdds.forEach(odd => {
        const key = `${odd.oddid}|${odd.line || 'null'}`
        duplicateMap.set(key, (duplicateMap.get(key) || 0) + 1)
      })
      
      analysis.duplicateIssues = Array.from(duplicateMap.entries())
        .filter(([, count]) => count > 1)
        .map(([key, count]) => ({ key, count }))
    }
    
    // Get total counts
    const { count: oddsCount } = await supabase
      .from('odds')
      .select('*', { count: 'exact', head: true })
      .in('eventid', games.map(g => g.id))
    
    const { count: openOddsCount } = await supabase
      .from('open_odds')
      .select('*', { count: 'exact', head: true })
      .in('eventid', games.map(g => g.id))
    
    analysis.totalOdds = oddsCount || 0
    analysis.totalOpenOdds = openOddsCount || 0
  }
  
  // Test iOS deduplication logic
  const testOdds = [
    { id: '1', oddid: 'test-ml-home', line: null, fetched_at: '2025-10-01T01:00:00Z', fanduelodds: -200 },
    { id: '2', oddid: 'test-ml-home', line: null, fetched_at: '2025-10-01T02:00:00Z', fanduelodds: -210 },
    { id: '3', oddid: 'test-sp-home', line: '-6.5', fetched_at: '2025-10-01T01:00:00Z', fanduelodds: -110 },
    { id: '4', oddid: 'test-sp-home', line: '-7', fetched_at: '2025-10-01T01:00:00Z', fanduelodds: +105 }
  ]
  
  const deduplicatedTest = deduplicateOddsForDisplay(testOdds)
  
  return NextResponse.json({
    analysis,
    deduplicationTest: {
      original: testOdds.length,
      deduplicated: deduplicatedTest.length,
      removed: testOdds.length - deduplicatedTest.length,
      result: deduplicatedTest
    },
    recommendations: generateRecommendations(analysis)
  })
}

async function testOddsFetch(supabase: any) {
  console.log('🎯 Testing odds fetch process...')
  
  try {
    // Trigger a small odds fetch
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/games/sportsgameodds?sport=NFL&refresh=true`)
    const data = await response.json()
    
    return NextResponse.json({
      fetchTest: {
        success: response.ok,
        gamesReturned: data.games?.length || 0,
        sampleGame: data.games?.[0] ? {
          id: data.games[0].id,
          teams: `${data.games[0].home_team_name} vs ${data.games[0].away_team_name}`,
          marketsCount: Object.keys(data.games[0].markets || {}).length
        } : null
      }
    })
  } catch (error) {
    return NextResponse.json({
      fetchTest: {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    })
  }
}

async function fixDuplicatesInPlace(supabase: any) {
  console.log('🔧 Fixing duplicates in place...')
  
  // This would implement duplicate cleanup logic
  // For now, return a plan
  return NextResponse.json({
    duplicateCleanup: {
      implemented: false,
      plan: [
        'Identify duplicate (eventid, oddid, line) combinations',
        'Keep most recent fetched_at for odds table',
        'Keep earliest fetched_at for open_odds table',
        'Remove redundant entries'
      ],
      note: 'Manual cleanup can be implemented if needed'
    }
  })
}

// Helper function for deduplication (same as in universal-game-card.tsx)
function deduplicateOddsForDisplay(odds: any[]): any[] {
  const oddsMap = new Map<string, any>()
  
  odds.forEach(odd => {
    const key = `${odd.oddid || 'unknown'}|${odd.line || 'null'}`
    const existing = oddsMap.get(key)
    
    if (!existing) {
      oddsMap.set(key, odd)
    } else {
      const existingTime = existing.fetched_at || '0'
      const currentTime = odd.fetched_at || '0'
      
      if (currentTime > existingTime) {
        oddsMap.set(key, odd)
      }
    }
  })
  
  return Array.from(oddsMap.values())
}

function generateRecommendations(analysis: any) {
  const recommendations = []
  
  if (analysis.duplicateIssues.length > 0) {
    recommendations.push({
      priority: 'HIGH',
      issue: 'Duplicate odds detected',
      solution: 'iOS deduplication is now implemented in universal-game-card.tsx',
      details: `Found ${analysis.duplicateIssues.length} duplicate patterns`
    })
  }
  
  if (analysis.totalOdds === 0) {
    recommendations.push({
      priority: 'CRITICAL',
      issue: 'No odds data found',
      solution: 'Run odds fetch or check API connectivity',
      details: 'No odds in database for recent games'
    })
  }
  
  const retention = analysis.totalOpenOdds > 0 ? (analysis.totalOdds / analysis.totalOpenOdds) : 0
  if (retention < 0.8) {
    recommendations.push({
      priority: 'MEDIUM',
      issue: 'Low odds retention',
      solution: 'Check database triggers and insertion logic',
      details: `Only ${(retention * 100).toFixed(1)}% retention rate`
    })
  }
  
  return recommendations
}