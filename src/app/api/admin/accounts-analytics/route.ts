import { createServiceRoleClient } from '@/lib/supabase'
import { createServerSupabaseClient } from '@/lib/auth/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'

interface AccountsAnalytics {
  // User Overview
  totalUsers: number
  usersWithStripeCustomers: number
  usersWithStripeConnect: number
  usersWithSharpSports: number
  
  // Percentage breakdowns
  stripeCustomerPercentage: number
  stripeConnectPercentage: number
  sharpSportsPercentage: number
  
  // Account overlap analysis
  stripeCustomerAndConnect: number
  stripeAndSharpSports: number
  connectAndSharpSports: number
  allThreeAccounts: number
  
  // Sportsbook linking analytics
  totalBettorAccounts: number
  uniqueBettors: number
  avgAccountsPerBettor: number
  
  // Sportsbook distribution
  sportsbookDistribution: Array<{
    bookName: string
    bookAbbr: string
    totalAccounts: number
    verifiedAccounts: number
    accessibleAccounts: number
    pausedAccounts: number
    averageBalance: number
  }>
  
  // Linking activity over time
  accountLinkingOverTime: Array<{
    date: string
    dateLabel: string
    dailyLinks: number
    cumulativeLinks: number
  }>
  
  // Account connectivity trends
  connectivityTrends: Array<{
    date: string
    dateLabel: string
    stripeCustomers: number
    stripeConnect: number
    sharpSports: number
  }>
  
  // Recent activity
  recentLinkingActivity: Array<{
    date: string
    bettorId: string
    bookName: string
    bookAbbr: string
    verified: boolean
    balance: number
  }>
  
  // Account health metrics
  accountHealth: {
    verifiedAccountsPercentage: number
    accessibleAccountsPercentage: number
    pausedAccountsPercentage: number
    accountsWithBalance: number
    totalBalance: number
    averageBalance: number
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check admin access
    const userClient = await createServerSupabaseClient(request)
    const { data: { user }, error: userError } = await userClient.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized - No user session' }, { status: 401 })
    }

    const adminUserIds = [
      '0e16e4f5-f206-4e62-8282-4188ff8af48a',
      '28991397-dae7-42e8-a822-0dffc6ff49b7', 
      'dfd44121-8e88-4c83-ad95-9fb8a4224908'
    ]
    
    if (!adminUserIds.includes(user.id)) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    console.log(`🔑 Admin user ${user.id} accessing accounts analytics`)
    
    const supabase = await createServiceRoleClient()
    
    // Fetch all profiles data
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id,
        username,
        created_at,
        stripe_customer_id,
        stripe_connect_account_id,
        sharpsports_bettor_id,
        is_seller,
        is_verified_seller
      `)
    
    if (profilesError) {
      throw new Error(`Error fetching profiles: ${profilesError.message}`)
    }

    // Fetch all bettor accounts data
    const { data: bettorAccounts, error: bettorError } = await supabase
      .from('bettor_accounts')
      .select(`
        id,
        bettor_id,
        book_name,
        book_abbr,
        verified,
        access,
        paused,
        balance,
        created_at
      `)
      .order('created_at', { ascending: true })
    
    if (bettorError) {
      throw new Error(`Error fetching bettor accounts: ${bettorError.message}`)
    }

    const allProfiles = profiles || []
    const allBettorAccounts = bettorAccounts || []

    console.log(`📊 Processing ${allProfiles.length} profiles and ${allBettorAccounts.length} bettor accounts`)

    // Calculate basic user metrics
    const totalUsers = allProfiles.length
    const usersWithStripeCustomers = allProfiles.filter(p => p.stripe_customer_id).length
    const usersWithStripeConnect = allProfiles.filter(p => p.stripe_connect_account_id).length
    const usersWithSharpSports = allProfiles.filter(p => p.sharpsports_bettor_id).length

    // Calculate percentages
    const stripeCustomerPercentage = totalUsers > 0 ? (usersWithStripeCustomers / totalUsers) * 100 : 0
    const stripeConnectPercentage = totalUsers > 0 ? (usersWithStripeConnect / totalUsers) * 100 : 0
    const sharpSportsPercentage = totalUsers > 0 ? (usersWithSharpSports / totalUsers) * 100 : 0

    // Calculate account overlaps
    const stripeCustomerAndConnect = allProfiles.filter(p => 
      p.stripe_customer_id && p.stripe_connect_account_id
    ).length
    
    const stripeAndSharpSports = allProfiles.filter(p => 
      p.stripe_customer_id && p.sharpsports_bettor_id
    ).length
    
    const connectAndSharpSports = allProfiles.filter(p => 
      p.stripe_connect_account_id && p.sharpsports_bettor_id
    ).length
    
    const allThreeAccounts = allProfiles.filter(p => 
      p.stripe_customer_id && p.stripe_connect_account_id && p.sharpsports_bettor_id
    ).length

    // Sportsbook analytics
    const totalBettorAccounts = allBettorAccounts.length
    const uniqueBettors = new Set(allBettorAccounts.map(ba => ba.bettor_id)).size
    const avgAccountsPerBettor = uniqueBettors > 0 ? totalBettorAccounts / uniqueBettors : 0

    // Sportsbook distribution
    const sportsbookGroups = allBettorAccounts.reduce((acc, account) => {
      const key = account.book_name || 'Unknown'
      if (!acc[key]) {
        acc[key] = {
          bookName: account.book_name || 'Unknown',
          bookAbbr: account.book_abbr || '',
          accounts: [],
          totalAccounts: 0,
          verifiedAccounts: 0,
          accessibleAccounts: 0,
          pausedAccounts: 0,
          totalBalance: 0
        }
      }
      
      acc[key].accounts.push(account)
      acc[key].totalAccounts += 1
      
      if (account.verified) acc[key].verifiedAccounts += 1
      if (account.access) acc[key].accessibleAccounts += 1
      if (account.paused) acc[key].pausedAccounts += 1
      if (account.balance) acc[key].totalBalance += Number(account.balance)
      
      return acc
    }, {} as Record<string, any>)

    const sportsbookDistribution = Object.values(sportsbookGroups).map((group: any) => ({
      bookName: group.bookName,
      bookAbbr: group.bookAbbr,
      totalAccounts: group.totalAccounts,
      verifiedAccounts: group.verifiedAccounts,
      accessibleAccounts: group.accessibleAccounts,
      pausedAccounts: group.pausedAccounts,
      averageBalance: group.totalAccounts > 0 ? group.totalBalance / group.totalAccounts : 0
    })).sort((a, b) => b.totalAccounts - a.totalAccounts)

    // Account linking over time (last 30 days)
    const now = new Date()
    const accountLinkingOverTime = []
    let cumulativeLinks = 0

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000)

      const dailyLinks = allBettorAccounts.filter(ba => {
        const createdAt = new Date(ba.created_at || '')
        return createdAt >= date && createdAt < nextDate
      }).length

      cumulativeLinks += dailyLinks

      accountLinkingOverTime.push({
        date: dateStr || '',
        dateLabel: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        dailyLinks,
        cumulativeLinks
      })
    }

    // Connectivity trends over time (last 30 days)
    const connectivityTrends = []
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]

      // Count cumulative accounts up to this date
      const profilesUpToDate = allProfiles.filter(p => {
        const createdAt = new Date(p.created_at || '')
        return createdAt <= date
      })

      const stripeCustomers = profilesUpToDate.filter(p => p.stripe_customer_id).length
      const stripeConnect = profilesUpToDate.filter(p => p.stripe_connect_account_id).length
      const sharpSports = profilesUpToDate.filter(p => p.sharpsports_bettor_id).length

      connectivityTrends.push({
        date: dateStr || '',
        dateLabel: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        stripeCustomers,
        stripeConnect,
        sharpSports
      })
    }

    // Recent linking activity (last 20 links)
    const recentLinkingActivity = allBettorAccounts
      .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
      .slice(0, 20)
      .map(ba => ({
        date: ba.created_at || '',
        bettorId: ba.bettor_id || '',
        bookName: ba.book_name || '',
        bookAbbr: ba.book_abbr || '',
        verified: ba.verified || false,
        balance: Number(ba.balance) || 0
      }))

    // Account health metrics
    const verifiedAccounts = allBettorAccounts.filter(ba => ba.verified).length
    const accessibleAccounts = allBettorAccounts.filter(ba => ba.access).length
    const pausedAccounts = allBettorAccounts.filter(ba => ba.paused).length
    const accountsWithBalance = allBettorAccounts.filter(ba => ba.balance && Number(ba.balance) > 0).length
    const totalBalance = allBettorAccounts.reduce((sum, ba) => sum + (Number(ba.balance) || 0), 0)

    const accountHealth = {
      verifiedAccountsPercentage: totalBettorAccounts > 0 ? (verifiedAccounts / totalBettorAccounts) * 100 : 0,
      accessibleAccountsPercentage: totalBettorAccounts > 0 ? (accessibleAccounts / totalBettorAccounts) * 100 : 0,
      pausedAccountsPercentage: totalBettorAccounts > 0 ? (pausedAccounts / totalBettorAccounts) * 100 : 0,
      accountsWithBalance,
      totalBalance: Math.round(totalBalance * 100) / 100,
      averageBalance: totalBettorAccounts > 0 ? Math.round((totalBalance / totalBettorAccounts) * 100) / 100 : 0
    }

    const analytics: AccountsAnalytics = {
      // User Overview
      totalUsers,
      usersWithStripeCustomers,
      usersWithStripeConnect,
      usersWithSharpSports,
      
      // Percentage breakdowns
      stripeCustomerPercentage: Math.round(stripeCustomerPercentage * 100) / 100,
      stripeConnectPercentage: Math.round(stripeConnectPercentage * 100) / 100,
      sharpSportsPercentage: Math.round(sharpSportsPercentage * 100) / 100,
      
      // Account overlap analysis
      stripeCustomerAndConnect,
      stripeAndSharpSports,
      connectAndSharpSports,
      allThreeAccounts,
      
      // Sportsbook linking analytics
      totalBettorAccounts,
      uniqueBettors,
      avgAccountsPerBettor: Math.round(avgAccountsPerBettor * 100) / 100,
      
      // Sportsbook distribution
      sportsbookDistribution,
      
      // Linking activity over time
      accountLinkingOverTime,
      
      // Account connectivity trends
      connectivityTrends,
      
      // Recent activity
      recentLinkingActivity,
      
      // Account health metrics
      accountHealth
    }

    console.log(`✅ Accounts analytics calculated for admin ${user.id}`)
    console.log(`📈 Key metrics: ${totalUsers} users, ${totalBettorAccounts} bettor accounts`)

    return NextResponse.json({ 
      success: true, 
      data: analytics,
      metadata: {
        generatedAt: now.toISOString(),
        totalUsersProcessed: allProfiles.length,
        totalBettorAccountsProcessed: allBettorAccounts.length,
        adminUserId: user.id
      }
    })

  } catch (error) {
    console.error('❌ Accounts Analytics API Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}