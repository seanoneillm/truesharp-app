import { createBrowserClient } from '@/lib/auth/supabase'

export interface RevenueData {
  monthlyRevenue: number
  totalSubscribers: number
  monetizedStrategies: number
  allTimeEarnings: number
  revenueByStrategy: StrategyRevenue[]
}

export interface StrategyRevenue {
  strategyId: string
  strategyName: string
  monthlyRevenue: number
  subscriberCount: number
  pricing: {
    weekly?: number
    monthly?: number
    yearly?: number
  }
}

export interface SubscriptionData {
  id: string
  price: number
  frequency: 'weekly' | 'monthly' | 'yearly'
  status: string
  strategy_id: string
  created_at: string
}

export async function calculateSellerRevenue(userId: string): Promise<RevenueData> {
  const supabase = createBrowserClient()

  try {
    // Fetch user's strategies
    const { data: strategies, error: strategiesError } = await supabase
      .from('strategies')
      .select(
        `
        id,
        name,
        monetized,
        pricing_weekly,
        pricing_monthly,
        pricing_yearly,
        subscriber_count
      `
      )
      .eq('user_id', userId)

    if (strategiesError) {
      console.error('Error fetching strategies:', strategiesError)
      return getEmptyRevenueData()
    }

    const monetizedStrategies = strategies?.filter(s => s.monetized) || []

    // Fetch active subscriptions for this seller
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('seller_id', userId)
      .eq('status', 'active')

    if (subscriptionsError) {
      console.error('Error fetching subscriptions:', subscriptionsError)
      return getEmptyRevenueData()
    }

    // Calculate revenue by strategy
    const revenueByStrategy: StrategyRevenue[] = monetizedStrategies.map(strategy => {
      const strategySubscriptions =
        subscriptions?.filter(sub => sub.strategy_id === strategy.id) || []

      let monthlyRevenue = 0
      strategySubscriptions.forEach(sub => {
        switch (sub.frequency) {
          case 'weekly':
            monthlyRevenue += sub.price * 4.33 // 4.33 weeks per month
            break
          case 'monthly':
            monthlyRevenue += sub.price
            break
          case 'yearly':
            monthlyRevenue += sub.price / 12
            break
        }
      })

      return {
        strategyId: strategy.id,
        strategyName: strategy.name,
        monthlyRevenue,
        subscriberCount: strategySubscriptions.length,
        pricing: {
          weekly: strategy.pricing_weekly,
          monthly: strategy.pricing_monthly,
          yearly: strategy.pricing_yearly,
        },
      }
    })

    // Calculate totals
    const totalMonthlyRevenue = revenueByStrategy.reduce(
      (sum, strategy) => sum + strategy.monthlyRevenue,
      0
    )
    const totalSubscribers = subscriptions?.length || 0

    // Calculate all-time earnings (for now, we'll estimate based on subscription history)
    // In a real app, you'd want to track historical payments
    const { data: allSubscriptions, error: allSubsError } = await supabase
      .from('subscriptions')
      .select('price, frequency, created_at, status')
      .eq('seller_id', userId)

    let allTimeEarnings = 0
    if (!allSubsError && allSubscriptions) {
      // Rough estimate: assume average subscription duration and calculate
      allSubscriptions.forEach(sub => {
        // Estimate earnings based on how long subscription has been active
        const createdDate = new Date(sub.created_at)
        const now = new Date()
        const monthsActive = Math.max(
          1,
          (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
        )

        let monthlyPrice = sub.price
        if (sub.frequency === 'weekly') monthlyPrice *= 4.33
        if (sub.frequency === 'yearly') monthlyPrice /= 12

        allTimeEarnings += monthlyPrice * monthsActive
      })
    }

    // Apply TrueSharp fee (18% total: 15% platform + 3% Stripe)
    const netRevenue = totalMonthlyRevenue * 0.82
    const netAllTimeEarnings = allTimeEarnings * 0.82

    return {
      monthlyRevenue: netRevenue,
      totalSubscribers,
      monetizedStrategies: monetizedStrategies.length,
      allTimeEarnings: netAllTimeEarnings,
      revenueByStrategy: revenueByStrategy.map(strategy => ({
        ...strategy,
        monthlyRevenue: strategy.monthlyRevenue * 0.82, // Apply fees
      })),
    }
  } catch (error) {
    console.error('Error calculating seller revenue:', error)
    return getEmptyRevenueData()
  }
}

export function convertToMonthlyPrice(
  price: number,
  frequency: 'weekly' | 'monthly' | 'yearly'
): number {
  switch (frequency) {
    case 'weekly':
      return price * 4.33
    case 'monthly':
      return price
    case 'yearly':
      return price / 12
    default:
      return price
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function calculateProjectedRevenue(
  pricing: { weekly?: number; monthly?: number; yearly?: number },
  estimatedSubscribers: number = 1
): { weekly: number; monthly: number; yearly: number } {
  const fees = 0.82 // After 18% fees

  return {
    weekly: (pricing.weekly || 0) * estimatedSubscribers * fees,
    monthly: (pricing.monthly || 0) * estimatedSubscribers * fees,
    yearly: ((pricing.yearly || 0) / 12) * estimatedSubscribers * fees,
  }
}

function getEmptyRevenueData(): RevenueData {
  return {
    monthlyRevenue: 0,
    totalSubscribers: 0,
    monetizedStrategies: 0,
    allTimeEarnings: 0,
    revenueByStrategy: [],
  }
}
