import { NextRequest, NextResponse } from 'next/server'

// Combined endpoint that runs all 3 SharpSports functions in order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    console.log(`🔄 Starting combined SharpSports refresh for user ${userId}`)

    const results = {
      step1: null,
      step2: null,
      step3: null,
      success: false,
      errors: [] as string[],
    }

    // Step 1: Fetch All Bettors
    try {
      console.log('📊 Step 1: Fetching all bettors...')
      const bettorsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/sharpsports/fetch-bettors`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      const bettorsResult = await bettorsResponse.json()
      results.step1 = bettorsResult

      if (!bettorsResult.success) {
        results.errors.push('Step 1 failed: ' + bettorsResult.error)
      } else {
        console.log('✅ Step 1 completed:', bettorsResult.message)
      }
    } catch (error) {
      console.error('❌ Step 1 error:', error)
      results.errors.push(
        'Step 1 error: ' + (error instanceof Error ? error.message : 'Unknown error')
      )
    }

    // Step 2: Match Bettor Profiles
    try {
      console.log('👥 Step 2: Matching bettor profiles...')
      const profilesResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/sharpsports/fetch-bettor-profiles`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      const profilesResult = await profilesResponse.json()
      results.step2 = profilesResult

      if (!profilesResult.success) {
        results.errors.push('Step 2 failed: ' + profilesResult.error)
      } else {
        console.log('✅ Step 2 completed:', profilesResult.message)
      }
    } catch (error) {
      console.error('❌ Step 2 error:', error)
      results.errors.push(
        'Step 2 error: ' + (error instanceof Error ? error.message : 'Unknown error')
      )
    }

    // Step 3: Refresh User Bets
    try {
      console.log('🎯 Step 3: Refreshing user bets...')
      const betsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/sharpsports/refresh-user-bets`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: userId,
          }),
        }
      )

      const betsResult = await betsResponse.json()
      results.step3 = betsResult

      if (!betsResult.success) {
        results.errors.push('Step 3 failed: ' + betsResult.error)
      } else {
        console.log('✅ Step 3 completed:', betsResult.message)
      }
    } catch (error) {
      console.error('❌ Step 3 error:', error)
      results.errors.push(
        'Step 3 error: ' + (error instanceof Error ? error.message : 'Unknown error')
      )
    }

    // Determine overall success
    results.success = results.errors.length === 0

    const message = results.success
      ? `✅ All steps completed successfully for user ${userId}`
      : `⚠️ Completed with ${results.errors.length} errors for user ${userId}`

    console.log(message)

    return NextResponse.json({
      success: results.success,
      message,
      results,
      errors: results.errors.length > 0 ? results.errors : undefined,
    })
  } catch (error) {
    console.error('❌ Error in combined refresh:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error,
      },
      { status: 500 }
    )
  }
}
