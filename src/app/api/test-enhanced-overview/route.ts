import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Test the enhanced overview API endpoint
    const baseUrl = new URL(request.url).origin
    const overviewUrl = new URL('/api/admin/overview-enhanced', baseUrl)
    
    console.log('🧪 Testing enhanced overview API endpoint...')
    
    const response = await fetch(overviewUrl.toString())
    const data = await response.json()
    
    if (response.ok && data.success) {
      return NextResponse.json({
        status: 'success',
        message: 'Enhanced overview API is working correctly',
        sampleData: {
          totalUsers: data.data.totalUsers,
          totalSellers: data.data.totalSellers,
          sellerConversionRate: data.data.sellerConversionRate,
          hasGrowthData: data.data.userGrowthData?.length > 0
        },
        apiResponse: data
      })
    } else {
      return NextResponse.json({
        status: 'error',
        message: 'Enhanced overview API returned an error',
        error: data.error || 'Unknown error'
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Test failed with exception',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}