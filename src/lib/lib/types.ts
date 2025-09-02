// Core User Types
export interface User {
  id: string
  username: string
  display_name: string
  email: string
  avatar?: string
  bio?: string
  location?: string
  website?: string
  isVerified: boolean
  sellerEnabled: boolean
  verificationStatus: 'unverified' | 'pending' | 'verified'
  totalFollowers: number
  totalFollowing: number
  joinDate: Date
  createdAt: Date
  updatedAt: Date
}

// Betting & Performance Types
export interface Bet {
  id: string
  userId: string
  externalBetId: string
  sportsbookId: string
  sport: string
  league: string
  betType: 'spread' | 'moneyline' | 'total' | 'prop'
  description: string
  odds: number
  stake: number
  potentialPayout: number
  actualPayout?: number
  status: 'pending' | 'won' | 'lost' | 'void' | 'cancelled'
  placedAt: Date
  settledAt?: Date
  gameDate: Date
  teams: {
    home: string
    away: string
  }
  isPublic: boolean
  createdAt: Date
}

export interface Pick {
  id: string
  userId: string
  betId?: string
  sport: string
  title: string
  description: string
  analysis?: string
  confidence: 1 | 2 | 3 | 4 | 5
  odds: string
  tier: 'free' | 'bronze' | 'silver' | 'premium'
  status: 'pending' | 'won' | 'lost' | 'void'
  result?: string
  postedAt: Date
  gameTime: Date
  isManual: boolean
  engagement: {
    views: number
    likes: number
    comments: number
    shares: number
  }
}

// Subscription & Marketplace Types
export interface Subscription {
  id: string
  subscriberId: string
  sellerId: string
  tier: 'bronze' | 'silver' | 'premium'
  price: number
  status: 'active' | 'cancelled' | 'expired' | 'paused'
  startedAt: Date
  expiresAt?: Date
  stripeSubscriptionId?: string
  createdAt: Date
}

export interface Seller {
  userId: string
  isActive: boolean
  tier: 'standard' | 'rising' | 'pro' | 'elite'
  specialization: string[]
  pricing: {
    bronze: number
    silver: number
    premium: number
  }
  stats: {
    totalPicks: number
    winRate: number
    roi: number
    subscribers: number
    rating: number
    totalRevenue: number
  }
  verificationBadges: string[]
  commissionRate: number
  payoutSettings: {
    method: 'bank' | 'paypal' | 'stripe'
    schedule: 'weekly' | 'biweekly' | 'monthly'
    email: string
  }
}

// Sportsbook Integration Types
export interface Sportsbook {
  id: string
  name: string
  displayName: string
  logo: string
  isActive: boolean
  apiEndpoint?: string
  authType: 'oauth' | 'credentials' | 'scraping'
  supportedMarkets: string[]
}

export interface SportsbookConnection {
  id: string
  userId: string
  sportsbookId: string
  status: 'connected' | 'disconnected' | 'error' | 'pending'
  lastSync?: Date
  totalBetsTracked: number
  connectionDate: Date
  error?: string
  credentialsEncrypted: string
}

// Analytics Types
export interface PerformanceMetrics {
  totalBets: number
  winRate: number
  roi: number
  profit: number
  avgBetSize: number
  variance: number
  sharpeRatio?: number
  closingLineValue?: number
  streaks: {
    current: { type: 'win' | 'loss'; count: number }
    longest: { type: 'win' | 'loss'; count: number }
  }
}

export interface FilterOptions {
  timeframe: {
    start?: Date
    end?: Date
    preset?: '7d' | '30d' | '90d' | 'ytd' | 'all'
  }
  sports: string[]
  betTypes: string[]
  teams: string[]
  sportsbooks: string[]
  stakes: {
    min?: number
    max?: number
  }
  odds: {
    min?: number
    max?: number
  }
}

// API Response Types
export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
  error?: string
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// UI State Types
export interface LoadingState {
  isLoading: boolean
  error?: string
  lastUpdated?: Date
}

export interface NotificationState {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  autoClose?: boolean
  duration?: number
}

// Form Types
export interface LoginForm {
  email: string
  password: string
  rememberMe: boolean
}

export interface SignupForm {
  email: string
  username: string
  password: string
  confirmPassword: string
  termsAccepted: boolean
  ageVerified: boolean
}

export interface PickForm {
  sport: string
  title: string
  description?: string
  analysis?: string
  confidence: 1 | 2 | 3 | 4 | 5
  odds: string
  tier: 'free' | 'bronze' | 'silver' | 'premium'
  gameTime: Date
}
export interface BetForm {
  sport: string
  league: string
  betType: 'spread' | 'moneyline' | 'total' | 'prop'
  description: string
  odds: number
  stake: number
  teams: {
    home: string
    away: string
  }
  gameDate: Date
  isPublic: boolean
}
