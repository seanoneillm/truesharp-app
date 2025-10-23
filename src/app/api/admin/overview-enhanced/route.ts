import { createServiceRoleClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

interface BusinessMetrics {
  // Core user metrics
  totalUsers: number
  totalSellers: number
  verifiedSellers: number
  proUsers: number
  usersWithStripeAccounts: number
  usersWithConnectAccounts: number
  usersWithPushTokens: number
  
  // Growth metrics
  newUsersToday: number
  newUsersThisWeek: number
  newUsersThisMonth: number
  newSellersThisMonth: number
  
  // Engagement metrics
  publicProfileUsers: number
  notificationsEnabledUsers: number
  sharpsportsConnectedUsers: number
  
  // Business health indicators
  sellerConversionRate: number
  verificationRate: number
  proConversionRate: number
  stripeIntegrationRate: number
  
  // Time series data for charts
  userGrowthData: Array<{date: string, count: number, cumulative: number}>
  sellerGrowthData: Array<{date: string, count: number, cumulative: number}>
  proUserGrowthData: Array<{date: string, count: number, cumulative: number}>
  verificationGrowthData: Array<{date: string, count: number, cumulative: number}>
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || '30d'
    
    const supabase = await createServiceRoleClient()
    
    // Calculate date ranges
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    let startDate: Date
    switch (timeframe) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case 'ytd':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    console.log(`🔍 Admin Overview - Fetching data for timeframe: ${timeframe}`)
    console.log(`📅 Date range: ${startDate.toISOString()} to ${now.toISOString()}`)

    // Get all profiles data in one query for efficiency
    const { data: allProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true })

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError)
      return NextResponse.json({ error: profilesError.message }, { status: 500 })
    }

    const profiles = allProfiles || []
    console.log(`📊 Processing ${profiles.length} total profiles`)

    // Calculate core metrics
    const totalUsers = profiles.length
    const totalSellers = profiles.filter(p => p.is_seller === true).length
    const verifiedSellers = profiles.filter(p => p.is_verified_seller === true).length
    const proUsers = profiles.filter(p => p.pro === 'yes').length
    const usersWithStripeAccounts = profiles.filter(p => p.stripe_customer_id !== null).length
    const usersWithConnectAccounts = profiles.filter(p => p.stripe_connect_account_id !== null).length
    const usersWithPushTokens = profiles.filter(p => p.expo_push_token !== null).length
    const publicProfileUsers = profiles.filter(p => p.public_profile === true).length
    const notificationsEnabledUsers = profiles.filter(p => p.notifications_enabled === true).length
    const sharpsportsConnectedUsers = profiles.filter(p => p.sharpsports_bettor_id !== null).length

    // Calculate growth metrics
    const newUsersToday = profiles.filter(p => 
      new Date(p.created_at || '') >= today
    ).length

    const newUsersThisWeek = profiles.filter(p => 
      new Date(p.created_at || '') >= thisWeek
    ).length

    const newUsersThisMonth = profiles.filter(p => 
      new Date(p.created_at || '') >= thisMonth
    ).length

    const newSellersThisMonth = profiles.filter(p => 
      p.is_seller === true && new Date(p.created_at || '') >= thisMonth
    ).length

    // Calculate business health indicators
    const sellerConversionRate = totalUsers > 0 ? (totalSellers / totalUsers) * 100 : 0
    const verificationRate = totalSellers > 0 ? (verifiedSellers / totalSellers) * 100 : 0
    const proConversionRate = totalUsers > 0 ? (proUsers / totalUsers) * 100 : 0
    const stripeIntegrationRate = totalUsers > 0 ? (usersWithStripeAccounts / totalUsers) * 100 : 0

    // Generate time series data for charts
    const generateTimeSeriesData = (
      filterFn: (profile: any) => boolean,
      days: number = 30
    ) => {
      const data: Array<{date: string, count: number, cumulative: number}> = []
      let cumulative = 0

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const dateStr = date.toISOString().split('T')[0]
        const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000)

        const dayProfiles = profiles.filter(p => {
          const createdAt = new Date(p.created_at || '')
          return createdAt >= date && createdAt < nextDate && filterFn(p)
        })

        cumulative += dayProfiles.length

        data.push({
          date: dateStr || '',
          count: dayProfiles.length,
          cumulative
        })
      }

      return data
    }

    const daysForChart = timeframe === '7d' ? 7 : timeframe === '90d' ? 90 : 30

    const userGrowthData = generateTimeSeriesData(() => true, daysForChart)
    const sellerGrowthData = generateTimeSeriesData(p => p.is_seller === true, daysForChart)
    const proUserGrowthData = generateTimeSeriesData(p => p.pro === 'yes', daysForChart)
    const verificationGrowthData = generateTimeSeriesData(p => p.is_verified_seller === true, daysForChart)

    const metrics: BusinessMetrics = {
      // Core metrics
      totalUsers,
      totalSellers,
      verifiedSellers,
      proUsers,
      usersWithStripeAccounts,
      usersWithConnectAccounts,
      usersWithPushTokens,
      
      // Growth metrics
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      newSellersThisMonth,
      
      // Engagement metrics
      publicProfileUsers,
      notificationsEnabledUsers,
      sharpsportsConnectedUsers,
      
      // Business health indicators
      sellerConversionRate: Math.round(sellerConversionRate * 100) / 100,
      verificationRate: Math.round(verificationRate * 100) / 100,
      proConversionRate: Math.round(proConversionRate * 100) / 100,
      stripeIntegrationRate: Math.round(stripeIntegrationRate * 100) / 100,
      
      // Time series data
      userGrowthData,
      sellerGrowthData,
      proUserGrowthData,
      verificationGrowthData
    }

    console.log(`✅ Overview metrics calculated successfully`)
    console.log(`📈 Key metrics: ${totalUsers} users, ${totalSellers} sellers, ${verifiedSellers} verified`)

    return NextResponse.json({ 
      success: true, 
      data: metrics,
      metadata: {
        timeframe,
        generatedAt: now.toISOString(),
        totalProfiles: profiles.length
      }
    })

  } catch (error) {
    console.error('❌ Admin Overview API Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}