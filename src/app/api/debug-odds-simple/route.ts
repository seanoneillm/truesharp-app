import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const API_KEY = process.env.NEXT_PUBLIC_ODDS_API_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(_request: NextRequest) {
  try {
    console.log('🔧 SIMPLIFIED ODDS FETCH DEBUG STARTED')

    // Step 1: Check current database state
    const { data: oddsCount } = await supabase
      .from('odds')
      .select('*', { count: 'exact', head: true })

    const { data: openOddsCount } = await supabase
      .from('open_odds')
      .select('*', { count: 'exact', head: true })

    console.log(`Current odds table: ${oddsCount?.length || 0} rows`)
    console.log(`Current open_odds table: ${openOddsCount?.length || 0} rows`)

    // Step 2: Check triggers exist
    const { data: triggers } = await supabase.rpc('check_triggers_exist')
    console.log(`Triggers check:`, triggers)

    // Step 3: Quick API test
    if (!API_KEY) {
      throw new Error('API key missing')
    }

    const testUrl = `https://api.sportsgameodds.com/v2/events?leagueID=MLB&type=match&limit=3`

    const response = await fetch(testUrl, {
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const apiData = await response.json()
    const events = apiData?.data || []

    console.log(`API test: ${events.length} events returned`)

    // Step 4: Analyze first event
    if (events.length > 0) {
      const firstEvent = events[0]
      const odds = firstEvent.odds || {}
      const oddsCount = Object.keys(odds).length

      console.log(`Sample event: ${firstEvent.eventID}`)
      console.log(
        `Sample event teams: ${firstEvent.teams?.away?.name} @ ${firstEvent.teams?.home?.name}`
      )
      console.log(`Sample event odds count: ${oddsCount}`)

      // Count types of odds
      let mainLines = 0
      let playerProps = 0
      let totalSportsbooks = 0

      for (const odd of Object.values(odds)) {
        const oddObj = odd as any
        if (
          oddObj.marketName?.toLowerCase().includes('player') ||
          oddObj.marketName?.toLowerCase().includes('prop')
        ) {
          playerProps++
        } else {
          mainLines++
        }

        if (oddObj.byBookmaker) {
          totalSportsbooks += Object.keys(oddObj.byBookmaker).length
        }
      }

      console.log(`Odds breakdown:`)
      console.log(`  - Main lines: ${mainLines}`)
      console.log(`  - Player props: ${playerProps}`)
      console.log(`  - Total sportsbook entries: ${totalSportsbooks}`)

      // Step 5: Test single insert
      const testOdd = Object.values(odds)[0] as any
      if (testOdd) {
        const testRecord = {
          eventid: firstEvent.eventID,
          sportsbook: 'SportsGameOdds',
          marketname: (testOdd.marketName || 'test').substring(0, 50),
          bettypeid: (testOdd.betTypeID || 'test').substring(0, 50),
          oddid: Object.keys(odds)[0],
          bookodds: parseFloat(testOdd.bookOdds) || 100,
          line: testOdd.betTypeID === 'ml' ? null : '0',
          fetched_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        }

        console.log(`Test record:`, testRecord)

        // Try insert (this will help us see trigger behavior)
        try {
          const { data: insertResult, error: insertError } = await supabase
            .from('odds')
            .insert(testRecord)
            .select()

          if (insertError) {
            console.log(`❌ Insert error: ${insertError.message}`)
          } else {
            console.log(`✅ Insert successful:`, insertResult)

            // Clean up test record
            await supabase.from('odds').delete().eq('id', insertResult[0]?.id)
          }
        } catch (error) {
          console.log(`❌ Insert exception:`, error)
        }
      }
    }

    return NextResponse.json({
      success: true,
      currentOdds: oddsCount?.length || 0,
      currentOpenOdds: openOddsCount?.length || 0,
      apiEventsReturned: events.length,
      sampleEventOdds: events.length > 0 ? Object.keys(events[0]?.odds || {}).length : 0,
    })
  } catch (error) {
    console.error('❌ Debug error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
