// Constants for TrueSharp Sports Betting Platform
// App Configuration
export const APP_CONFIG = {
  name: 'TrueSharp',
  description: 'The only verified sports betting platform',
  version: '1.0.0',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://truesharp.com',
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
    timeout: 30000,
  },
  support: {
    email: 'support@truesharp.com',
    phone: '+1 (555) 123-4567',
  },
}

// Sports & Leagues
export const SPORTS = {
  NFL: {
    name: 'NFL',
    displayName: 'Football',
    color: 'bg-green-500',
    icon: '🏈',
    season: 'fall-winter',
  },
  NBA: {
    name: 'NBA',
    displayName: 'Basketball',
    color: 'bg-orange-500',
    icon: '🏀',
    season: 'winter-spring',
  },
  MLB: {
    name: 'MLB',
    displayName: 'Baseball',
    color: 'bg-blue-500',
    icon: '⚾',
    season: 'spring-fall',
  },
  NHL: {
    name: 'NHL',
    displayName: 'Hockey',
    color: 'bg-purple-500',
    icon: '🏒',
    season: 'fall-spring',
  },
  SOCCER: {
    name: 'SOCCER',
    displayName: 'Soccer',
    color: 'bg-green-600',
    icon: '⚽',
    season: 'year-round',
  },
  TENNIS: {
    name: 'TENNIS',
    displayName: 'Tennis',
    color: 'bg-yellow-500',
    icon: '🎾',
    season: 'year-round',
  },
  GOLF: {
    name: 'GOLF',
    displayName: 'Golf',
    color: 'bg-green-400',
    icon: '⛳',
    season: 'year-round',
  },
  MMA: {
    name: 'MMA',
    displayName: 'MMA/UFC',
    color: 'bg-red-500',
    icon: '🥊',
    season: 'year-round',
  },
} as const

// Bet Types
export const BET_TYPES = {
  SPREAD: 'spread',
  MONEYLINE: 'moneyline',
  TOTAL: 'total',
  PROP: 'prop',
  FUTURES: 'futures',
  LIVE: 'live',
  PARLAY: 'parlay',
} as const

// Subscription Tiers
export const SUBSCRIPTION_TIERS = {
  FREE: {
    name: 'free',
    displayName: 'Free',
    price: 0,
    features: [
      'Basic bet tracking',
      'Simple analytics',
      'Public picks access',
      'Mobile app',
    ],
  },
  BRONZE: {
    name: 'bronze',
    displayName: 'Bronze',
    priceRange: [10, 25],
    features: [
      'All free features',
      'Bronze tier picks',
      'Basic analysis',
      'Email notifications',
    ],
  },
  SILVER: {
    name: 'silver',
    displayName: 'Silver',
    priceRange: [25, 50],
    features: [
      'All bronze features',
      'Silver tier picks',
      'Detailed analysis',
      'SMS notifications',
      'Early access',
    ],
  },
  PREMIUM: {
    name: 'premium',
    displayName: 'Premium',
    priceRange: [50, 150],
    features: [
      'All silver features',
      'Premium tier picks',
      'Personal analysis',
      'Direct chat access',
      'Custom recommendations',
      'Priority support',
    ],
  },
} as const

// TrueSharp Pro Features
export const PRO_FEATURES = {
  price: {
    monthly: 19.99,
    yearly: 199.99,
    discount: 17, // percentage saved with yearly
  },
  features: [
    'Unlimited custom filters',
    'Advanced analytics engine',
    'Line movement data',
    'Closing line value tracking',
    'Custom report generation',
    'Data export (CSV, PDF)',
    'Performance benchmarking',
    'Predictive insights',
    'API access',
    'Premium support',
  ],
  limits: {
    free: {
      filters: 3,
      dateRange: 90, // days
      exports: 0,
      charts: 2,
    },
    pro: {
      filters: -1, // unlimited
      dateRange: -1, // unlimited
      exports: -1, // unlimited
      charts: -1, // unlimited
    },
  },
}

// Sportsbooks
export const SPORTSBOOKS = {
  DRAFTKINGS: {
    id: 'draftkings',
    name: 'DraftKings',
    displayName: 'DraftKings',
    logo: '/logos/draftkings.png',
    color: '#53d337',
    website: 'https://sportsbook.draftkings.com',
    available: true,
    priority: 1,
  },
  FANDUEL: {
    id: 'fanduel',
    name: 'FanDuel',
    displayName: 'FanDuel',
    logo: '/logos/fanduel.png',
    color: '#1e3a8a',
    website: 'https://sportsbook.fanduel.com',
    available: true,
    priority: 2,
  },
  BETMGM: {
    id: 'betmgm',
    name: 'BetMGM',
    displayName: 'BetMGM',
    logo: '/logos/betmgm.png',
    color: '#b8860b',
    website: 'https://sports.betmgm.com',
    available: true,
    priority: 3,
  },
  CAESARS: {
    id: 'caesars',
    name: 'Caesars',
    displayName: 'Caesars Sportsbook',
    logo: '/logos/caesars.png',
    color: '#d4af37',
    website: 'https://sportsbook.caesars.com',
    available: true,
    priority: 4,
  },
  ESPN_BET: {
    id: 'espn_bet',
    name: 'ESPN BET',
    displayName: 'ESPN BET',
    logo: '/logos/espn-bet.png',
    color: '#d22630',
    website: 'https://espnbet.com',
    available: true,
    priority: 5,
  },
} as const

// User Roles & Permissions
export const USER_ROLES = {
  USER: 'user',
  SELLER: 'seller',
  VERIFIED_SELLER: 'verified_seller',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
} as const

export const PERMISSIONS = {
  CREATE_PICKS: 'create_picks',
  SELL_PICKS: 'sell_picks',
  MODERATE_CONTENT: 'moderate_content',
  MANAGE_USERS: 'manage_users',
  ACCESS_ANALYTICS: 'access_analytics',
  EXPORT_DATA: 'export_data',
} as const

// Seller Verification Levels
export const SELLER_TIERS = {
  STANDARD: {
    name: 'standard',
    displayName: 'Standard',
    requirements: {
      minPicks: 25,
      minDays: 30,
      minWinRate: 52,
    },
    badge: 'Standard Seller',
    color: 'bg-gray-100 text-gray-800',
    maxPrice: 50,
  },
  RISING: {
    name: 'rising',
    displayName: 'Rising Star',
    requirements: {
      minPicks: 50,
      minDays: 60,
      minWinRate: 58,
      minROI: 10,
    },
    badge: 'Rising Star',
    color: 'bg-green-100 text-green-800',
    maxPrice: 75,
  },
  PRO: {
    name: 'pro',
    displayName: 'Professional',
    requirements: {
      minPicks: 100,
      minDays: 90,
      minWinRate: 60,
      minROI: 15,
      minSubscribers: 50,
    },
    badge: 'Verified Pro',
    color: 'bg-blue-100 text-blue-800',
    maxPrice: 100,
  },
  ELITE: {
    name: 'elite',
    displayName: 'Elite',
    requirements: {
      minPicks: 200,
      minDays: 180,
      minWinRate: 65,
      minROI: 25,
      minSubscribers: 200,
    },
    badge: 'Elite Seller',
    color: 'bg-purple-100 text-purple-800',
    maxPrice: 200,
  },
} as const

// Platform Commission & Fees
export const PLATFORM_FEES = {
  commission: 0.15, // 15% commission on subscription revenue
  processing: 0.029, // 2.9% payment processing fee
  fixed: 0.30, // $0.30 fixed fee per transaction
  withdrawal: {
    bank: 0,
    paypal: 0.02,
    crypto: 0.01,
  },
}

// API Rate Limits
export const RATE_LIMITS = {
  general: {
    requests: 100,
    window: 900, // 15 minutes
  },
  auth: {
    requests: 5,
    window: 900, // 15 minutes
  },
  picks: {
    requests: 20,
    window: 300, // 5 minutes
  },
  subscriptions: {
    requests: 10,
    window: 300, // 5 minutes
  },
}

// Default Filter Options
export const DEFAULT_FILTERS = {
  timeframes: [
    { value: '7d', label: 'Last 7 days', free: true },
    { value: '30d', label: 'Last 30 days', free: true },
    { value: '90d', label: 'Last 3 months', free: false },
    { value: 'ytd', label: 'Year to date', free: false },
    { value: 'all', label: 'All time', free: false },
  ],
  sortOptions: [
    { value: 'roi', label: 'Highest ROI' },
    { value: 'winrate', label: 'Win Rate' },
    { value: 'subscribers', label: 'Most Subscribers' },
    { value: 'recent', label: 'Most Active' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rated' },
  ],
  priceRanges: [
    { value: 'all', label: 'All Prices' },
    { value: 'free', label: 'Free' },
    { value: 'low', label: '$1 - $25' },
    { value: 'mid', label: '$26 - $75' },
    { value: 'high', label: '$76+' },
  ],
}

// Error Messages
export const ERROR_MESSAGES = {
  auth: {
    invalidCredentials: 'Invalid email or password',
    emailExists: 'Email address already in use',
    usernameExists: 'Username already taken',
    weakPassword: 'Password must be at least 8 characters',
    emailRequired: 'Email address is required',
    passwordRequired: 'Password is required',
  },
  validation: {
    invalidEmail: 'Please enter a valid email address',
    invalidUsername: 'Username must be 3-20 characters, letters, numbers, and underscores only',
    passwordMismatch: 'Passwords do not match',
    termsRequired: 'You must accept the terms of service',
    ageRequired: 'You must be 18 or older to use TrueSharp',
  },
  network: {
    connectionError: 'Unable to connect to server',
    timeout: 'Request timed out, please try again',
    serverError: 'Server error occurred, please try again later',
  },
  subscription: {
    paymentFailed: 'Payment failed, please try a different payment method',
    alreadySubscribed: 'You are already subscribed to this seller',
    sellerNotFound: 'Seller not found',
  },
}

// Success Messages
export const SUCCESS_MESSAGES = {
  auth: {
    signupSuccess: 'Account created successfully! Please check your email to verify your account.',
    loginSuccess: 'Welcome back!',
    logoutSuccess: 'You have been logged out successfully',
    passwordChanged: 'Password updated successfully',
  },
  profile: {
    updated: 'Profile updated successfully',
    photoUploaded: 'Profile photo updated',
  },
  subscription: {
    subscribed: 'Successfully subscribed!',
    cancelled: 'Subscription cancelled',
    paymentUpdated: 'Payment method updated',
  },
  general: {
    saved: 'Changes saved successfully',
    copied: 'Copied to clipboard',
    exported: 'Data exported successfully',
  },
}

// Feature Flags
export const FEATURE_FLAGS = {
  enableSocialFeatures: true,
  enableLiveChat: false,
  enableCryptoPayments: false,
  enableAPIAccess: false,
  enableMobileApp: true,
  enableEmailNotifications: true,
  enableSMSNotifications: false,
  enablePushNotifications: true,
  enableDataExport: true,
  enableAdvancedAnalytics: true,
  enableMarketplaceSearch: true,
  enableSellerVerification: true,
}
