import { NextRequest, NextResponse } from 'next/server'

// Combined endpoint that runs all 4 SharpSports functions in order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, extensionAuthToken, extensionVersion } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    console.log(`🔄 Starting combined SharpSports refresh for user ${userId}`)
    console.log('🔑 Extension data for refresh:', {
      hasAuthToken: !!extensionAuthToken,
      extensionVersion: extensionVersion || 'not provided'
    })
    
    // Get the base URL from the request
    const baseUrl = new URL(request.url).origin

    const results = {
      step1: null,
      step2: null,
      step3: null,
      step4: null,
      success: false,
      errors: [] as string[],
    }

    // Step 1: Fetch All Bettors
    try {
      console.log('📊 Step 1: Fetching all bettors...')
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 300000) // 5 minute timeout
      
      const bettorsResponse = await fetch(
        `${baseUrl}/api/sharpsports/fetch-bettors`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        }
      )
      
      clearTimeout(timeoutId)

      const bettorsResult = await bettorsResponse.json()
      results.step1 = bettorsResult

      if (!bettorsResult.success) {
        results.errors.push('Step 1 failed: ' + bettorsResult.error)
      } else {
        console.log('✅ Step 1 completed:', bettorsResult.message)
      }
    } catch (error) {
      console.error('❌ Step 1 error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      if (errorMessage.includes('aborted') || errorMessage.includes('timeout')) {
        results.errors.push('Step 1 timeout: SharpSports API call exceeded 5 minutes')
      } else {
        results.errors.push('Step 1 error: ' + errorMessage)
      }
    }

    // Step 2: Match Bettor Profiles
    try {
      console.log('👥 Step 2: Matching bettor profiles...')
      const controller2 = new AbortController()
      const timeoutId2 = setTimeout(() => controller2.abort(), 300000) // 5 minute timeout
      
      const profilesResponse = await fetch(
        `${baseUrl}/api/sharpsports/fetch-bettor-profiles`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller2.signal,
        }
      )
      
      clearTimeout(timeoutId2)

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

    // Step 3: Refresh Bettor Account Data with SharpSports
    try {
      console.log('🔄 Step 3: Refreshing bettor account data...')
      const controller3 = new AbortController()
      const timeoutId3 = setTimeout(() => controller3.abort(), 300000) // 5 minute timeout
      
      const refreshResponse = await fetch(
        `${baseUrl}/api/sharpsports/refresh-bettor-account`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller3.signal,
          body: JSON.stringify({
            userId: userId,
            extensionAuthToken,
            extensionVersion,
          }),
        }
      )
      
      clearTimeout(timeoutId3)

      const refreshResult = await refreshResponse.json()
      results.step3 = refreshResult

      if (!refreshResult.success) {
        results.errors.push('Step 3 failed: ' + refreshResult.error)
      } else {
        console.log('✅ Step 3 completed:', refreshResult.message)
      }
    } catch (error) {
      console.error('❌ Step 3 error:', error)
      results.errors.push(
        'Step 3 error: ' + (error instanceof Error ? error.message : 'Unknown error')
      )
    }

    // Step 4: Refresh User Bets
    try {
      console.log('🎯 Step 4: Refreshing user bets...')
      const controller4 = new AbortController()
      const timeoutId4 = setTimeout(() => controller4.abort(), 300000) // 5 minute timeout
      
      const betsResponse = await fetch(
        `${baseUrl}/api/sharpsports/refresh-user-bets`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller4.signal,
          body: JSON.stringify({
            userId: userId,
            extensionAuthToken,
            extensionVersion,
          }),
        }
      )
      
      clearTimeout(timeoutId4)

      const betsResult = await betsResponse.json()
      results.step4 = betsResult

      if (!betsResult.success) {
        results.errors.push('Step 4 failed: ' + betsResult.error)
      } else {
        console.log('✅ Step 4 completed:', betsResult.message)
      }
    } catch (error) {
      console.error('❌ Step 4 error:', error)
      results.errors.push(
        'Step 4 error: ' + (error instanceof Error ? error.message : 'Unknown error')
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
