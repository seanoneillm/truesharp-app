export interface Subscription {
  id: string
  subscriber_id: string
  strategy_id: string
  seller_id: string
  stripe_subscription_id?: string
  status: 'active' | 'cancelled' | 'past_due' | 'canceled'
  frequency: 'weekly' | 'monthly' | 'yearly'
  price: number
  price_cents: number
  tier: string
  current_period_start: string
  current_period_end: string
  cancelled_at?: string
  cancel_at_period_end?: boolean
  created_at: string
  updated_at: string
  seller?: {
    id: string
    username: string
    display_name?: string
    profile_picture_url?: string
    is_verified_seller: boolean
  }
  strategy?: {
    id: string
    name: string
    description?: string
    performance_roi?: number
    performance_win_rate?: number
    performance_total_bets: number
  }
}

export interface SubscriptionStats {
  totalSpent: number
  totalProfit: number
  netProfit: number
  roi: string
  activeSubs: number
  totalPicks: number
  followedPicks: number
  winRate: string
}

export interface MonthlySummary {
  totalMonthlyCost: number
  subscribedBetsCount: number
  returnOnInvestment: number
  profitVsCost: number
  performanceIndicator: 'positive' | 'negative' | 'neutral'
  currentMonth: {
    year: number
    month: number
    name: string
  }
}

export interface SubscriptionCard {
  subscription: Subscription
  performance: SubscriptionPerformance
  billing: SubscriptionBilling
  picks: SubscriptionPicks
}

export interface SubscriptionPerformance {
  roi: number
  winRate: number
  totalBets: number
  copiedBets: number
  originalBets: number
  profit: number
  subscriptionCost: number
  netValue: number
  last30DaysPerformance: {
    bets: number
    wins: number
    profit: number
  }
  allTimePerformance: {
    bets: number
    wins: number
    profit: number
  }
}

export interface SubscriptionBilling {
  nextPaymentDate: string
  nextPaymentAmount: number
  billingFrequency: 'weekly' | 'monthly' | 'yearly'
  paymentMethod?: {
    type: string
    last4: string
    brand: string
  }
  upcomingCharges: {
    date: string
    amount: number
  }[]
}

export interface SubscriptionPicks {
  recent: SubscriptionPick[]
  pending: SubscriptionPick[]
  totalAvailable: number
  lastUpdated: string
}

export interface SubscriptionPick {
  id: string
  bet_id: string
  strategy_id: string
  seller_id: string
  posted_at: string
  pick_status: 'active' | 'settled' | 'void'
  subscriber_access: boolean
  bet: {
    id: string
    sport: string
    league?: string
    home_team: string
    away_team: string
    bet_type: string
    bet_description: string
    line_value?: number
    odds: number
    stake: number
    potential_payout: number
    status: 'pending' | 'won' | 'lost' | 'void'
    profit?: number
    game_date?: string
    placed_at: string
    settled_at?: string
    confidence?: number
  }
  copyBetStatus?: {
    isCopyBet: boolean
    copied: boolean
    copiedAt?: string
    userBetId?: string
  }
}

export interface BillingHistory {
  transactions: BillingTransaction[]
  totalPages: number
  currentPage: number
}

export interface BillingTransaction {
  id: string
  date: string
  description: string
  amount: number
  status: 'paid' | 'pending' | 'failed' | 'refunded'
  invoice?: string
  subscription_id: string
  strategy_name?: string
  seller_username?: string
}

export interface CopyBetDetection {
  originalBet: SubscriptionPick
  userBet?: {
    id: string
    sport: string
    bet_type: string
    line_value?: number
    odds: number
    placed_at: string
    stake: number
  }
  matchingCriteria: {
    sportMatch: boolean
    betTypeMatch: boolean
    lineVariance: number
    oddsVariance: number
    timeVariance: number
    isValidCopy: boolean
  }
  confidence: 'high' | 'medium' | 'low'
  tolerance: {
    lineVariance: number // ±0.5 points
    oddsVariance: number // ±10 odds
    timeWindow: number // minutes after original
  }
}

export interface SubscriptionManagement {
  canCancel: boolean
  canModify: boolean
  canPause: boolean
  cancellationEffectiveDate?: string
  modificationOptions: {
    changeTier: boolean
    changeFrequency: boolean
    pauseSubscription: boolean
  }
  refundEligible: boolean
  refundAmount?: number
}

export interface PerformanceAnalysis {
  individual: {
    subscriptionId: string
    roi: number
    winRate: number
    subscriptionValue: number
    copiedVsOriginalPerformance: {
      copied: {
        bets: number
        winRate: number
        profit: number
      }
      original: {
        bets: number
        winRate: number
        profit: number
      }
    }
  }
  aggregate: {
    allSubscriptions: {
      totalCost: number
      totalProfit: number
      overallROI: number
      bestPerformer: string
      worstPerformer: string
    }
    monthlyAnalysis: {
      month: string
      subscriptionsCost: number
      betsPlaced: number
      profit: number
      roi: number
    }[]
  }
}

export interface SubscriptionFilters {
  status: 'all' | 'active' | 'cancelled' | 'expired'
  timeframe: '7d' | '30d' | '90d' | 'all'
  sport?: string
  seller?: string
  tier?: string
  sortBy: 'performance' | 'cost' | 'date' | 'name'
  sortOrder: 'asc' | 'desc'
}

export interface SubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  subscription?: Subscription
  type: 'cancel' | 'modify' | 'billing' | 'performance'
}

// API Response Types
export interface SubscriptionsResponse {
  subscriptions: Subscription[]
  stats: SubscriptionStats
  summary: MonthlySummary
  billing: BillingHistory
  total: number
  page: number
  hasMore: boolean
}

export interface SubscriptionActionResponse {
  success: boolean
  message: string
  data?: any
  error?: string
}

// Hook return types
export interface UseSubscriptionsReturn {
  subscriptions: Subscription[] | null
  isLoading: boolean
  error: string | null
  stats: SubscriptionStats | null
  summary: MonthlySummary | null
  refreshSubscriptions: () => Promise<void>
  cancelSubscription: (subscriptionId: string) => Promise<SubscriptionActionResponse>
  modifySubscription: (subscriptionId: string, changes: any) => Promise<SubscriptionActionResponse>
  getBillingHistory: (page?: number) => Promise<BillingHistory>
  getSubscriptionPicks: (subscriptionId: string) => Promise<SubscriptionPicks>
  copyBet: (pickId: string) => Promise<SubscriptionActionResponse>
}

// Component Props Types
export interface MonthlySummaryProps {
  summary: MonthlySummary
  isLoading?: boolean
}

export interface ActiveSubscriptionsProps {
  subscriptions: Subscription[]
  isLoading?: boolean
  onCancel: (subscriptionId: string) => void
  onModify: (subscriptionId: string) => void
}

export interface SubscriptionCardProps {
  subscription: Subscription
  onCancel: (subscriptionId: string) => void
  onModify?: (subscriptionId: string) => void
  isLoading?: boolean
  showPerformance?: boolean
}

export interface PickFeedProps {
  subscriptionId: string
  picks: SubscriptionPick[]
  isLoading?: boolean
  onCopyBet: (pickId: string) => void
  showCopyButton?: boolean
}

export interface CopyBetButtonProps {
  pick: SubscriptionPick
  onCopy: (pickId: string) => void
  disabled?: boolean
  isLoading?: boolean
}

export interface PerformanceTrackingProps {
  subscription: Subscription
  performance: PerformanceAnalysis['individual']
  timeframe: '7d' | '30d' | '90d' | 'all'
  onTimeframeChange: (timeframe: string) => void
}

export interface BillingHistoryProps {
  transactions: BillingTransaction[]
  isLoading?: boolean
  onLoadMore?: () => void
  hasMore?: boolean
}