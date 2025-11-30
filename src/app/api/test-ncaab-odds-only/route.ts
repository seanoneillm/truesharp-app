import { NextRequest, NextResponse } from 'next/server'

const SPORTSGAMEODDS_API_BASE = 'https://api.sportsgameodds.com/v2'
const API_KEY = process.env.NEXT_PUBLIC_ODDS_API_KEY

export async function POST(request: NextRequest) {
  try {
    console.log('\n🧪 ========== TESTING NCAAB SEPARATE ODDS FETCH ==========')
    
    if (!API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    // Test with a few specific event IDs from games without inline odds
    const testEventIds = [
      'L6JMLClf7i9Vbce8WY43', // American University Eagles vs Central Pennsylvania Knights
      '3DSm4CoJ4O07xt1xx5s5', // Massachusetts Minutemen vs Central Connecticut State Blue Devils
      '1aHATNqkhjUOMjDWmq8B', // Georgia Bulldogs vs Florida A&M Rattlers
    ]

    const results = []

    for (const eventId of testEventIds) {
      console.log(`\n🎯 Testing separate odds fetch for event: ${eventId}`)
      
      try {
        const oddsUrl = `${SPORTSGAMEODDS_API_BASE}/events/${eventId}/odds`
        console.log(`🔗 Odds URL: ${oddsUrl}`)
        
        const response = await fetch(oddsUrl, {
          headers: {
            'X-API-Key': API_KEY!,
            'Content-Type': 'application/json',
          },
        })

        console.log(`📡 Response status: ${response.status}`)
        console.log(`📡 Response headers:`, Object.fromEntries(response.headers.entries()))

        if (!response.ok) {
          const errorText = await response.text()
          console.log(`❌ Error response body:`, errorText)
          
          results.push({
            eventId,
            success: false,
            status: response.status,
            statusText: response.statusText,
            error: errorText,
            url: oddsUrl
          })
          continue
        }

        const oddsData = await response.json()
        console.log(`✅ Success! Odds data structure:`)
        console.log(`  - Response success: ${oddsData?.success}`)
        console.log(`  - Data type: ${typeof oddsData?.data}`)
        console.log(`  - Data is object: ${typeof oddsData?.data === 'object'}`)
        console.log(`  - Data keys: ${oddsData?.data ? Object.keys(oddsData.data).length : 0}`)
        
        if (oddsData?.data && Object.keys(oddsData.data).length > 0) {
          console.log(`📋 Sample odds entries:`)
          const entries = Object.entries(oddsData.data).slice(0, 2)
          entries.forEach(([oddId, oddData], index) => {
            console.log(`  ${index + 1}. OddID: ${oddId}`)
            console.log(`     BetType: ${(oddData as any)?.betTypeID}`)
            console.log(`     Market: ${(oddData as any)?.marketName}`)
            console.log(`     Side: ${(oddData as any)?.sideID}`)
            console.log(`     BookOdds: ${(oddData as any)?.bookOdds}`)
            console.log(`     ByBookmaker keys: ${(oddData as any)?.byBookmaker ? Object.keys((oddData as any).byBookmaker).length : 0}`)
          })
        }

        results.push({
          eventId,
          success: true,
          status: response.status,
          oddsCount: oddsData?.data ? Object.keys(oddsData.data).length : 0,
          hasOddsData: !!(oddsData?.data && Object.keys(oddsData.data).length > 0),
          responseStructure: {
            success: oddsData?.success,
            dataType: typeof oddsData?.data,
            dataKeys: oddsData?.data ? Object.keys(oddsData.data).length : 0
          }
        })

      } catch (error) {
        console.error(`💥 Exception for event ${eventId}:`, error)
        results.push({
          eventId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          exception: true
        })
      }
    }

    console.log('\n📊 ========== SEPARATE ODDS FETCH SUMMARY ==========')
    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length
    const withOdds = results.filter(r => r.success && r.hasOddsData).length
    const withoutOdds = results.filter(r => r.success && !r.hasOddsData).length

    console.log(`✅ Successful requests: ${successful}/${results.length}`)
    console.log(`❌ Failed requests: ${failed}/${results.length}`)
    console.log(`📈 Requests with odds data: ${withOdds}/${successful}`)
    console.log(`📉 Requests without odds data: ${withoutOdds}/${successful}`)

    if (failed > 0) {
      console.log(`\n❌ Failed requests details:`)
      results.filter(r => !r.success).forEach(result => {
        console.log(`  Event ${result.eventId}: ${result.status || 'Exception'} - ${result.error}`)
      })
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalTests: results.length,
        successful,
        failed,
        withOdds,
        withoutOdds
      },
      results,
      testCompleted: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Test error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}