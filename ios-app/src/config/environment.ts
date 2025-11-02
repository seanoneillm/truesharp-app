import Constants from 'expo-constants'

// Environment configuration for TrueSharp iOS app
export interface EnvironmentConfig {
  API_BASE_URL: string
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  SHARP_SPORTS_UI_URL: string
  GAMBLING_HELP_URL: string
  isDevelopment: boolean
}

// Get environment variables from Expo config
const getEnvironmentVariable = (key: string, defaultValue: string): string => {
  return Constants.expoConfig?.extra?.[key] || process.env[key] || defaultValue
}

// SharpSports public key from environment
const SHARPSPORTS_PUBLIC_KEY = getEnvironmentVariable(
  'EXPO_PUBLIC_SHARPSPORTS_PUBLIC_KEY',
  '999909cc32774485b69b2e6c02139e4fe2f5dcaf' // Fallback to the key from .env.local
)

// Environment configuration
export const Environment: EnvironmentConfig = {
  // API Base URL - defaults to production, can be overridden in development
  API_BASE_URL: getEnvironmentVariable(
    'EXPO_PUBLIC_API_BASE_URL',
    'https://truesharp.io'
  ),

  // Supabase configuration
  SUPABASE_URL: getEnvironmentVariable(
    'EXPO_PUBLIC_SUPABASE_URL',
    'https://trsogafrxpptszxydycn.supabase.co'
  ),

  SUPABASE_ANON_KEY: getEnvironmentVariable(
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyc29nYWZyeHBwdHN6eHlkeWNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MjQ0OTQsImV4cCI6MjA2NjMwMDQ5NH0.STgM-_-9tTwI-Tr-gajQnfsA9cEZplw7W5uPWmn-SwA'
  ),

  // External service URLs
  SHARP_SPORTS_UI_URL: getEnvironmentVariable(
    'EXPO_PUBLIC_SHARP_SPORTS_UI_URL',
    'https://ui.sharpsports.io'
  ),

  GAMBLING_HELP_URL: getEnvironmentVariable(
    'EXPO_PUBLIC_GAMBLING_HELP_URL',
    'https://www.ncpgambling.org'
  ),

  isDevelopment: __DEV__,
}

// Export SharpSports public key for use in components
export { SHARPSPORTS_PUBLIC_KEY }

// API endpoint builders
export const API_ENDPOINTS = {
  strategies: `${Environment.API_BASE_URL}/api/strategies`,
  stripeConnect: `${Environment.API_BASE_URL}/api/stripe/connect`,
  stripeConnectLogin: `${Environment.API_BASE_URL}/api/stripe/connect/login`,
  webhooks: `${Environment.API_BASE_URL}/api/webhooks/stripe`,
  billingPortal: `${Environment.API_BASE_URL}/api/billing-portal`,
  accountLink: `${Environment.API_BASE_URL}/api/account-link`,
  betSubmission: `${Environment.API_BASE_URL}/api/bets/submit`,
  deleteStrategy: (strategyId: string) =>
    `${Environment.API_BASE_URL}/api/strategies/delete/${strategyId}`,
} as const

// Development URLs (for reference and .env files)
export const DEVELOPMENT_URLS = {
  localhost: 'http://localhost:3000',
  networkIP: 'http://172.20.10.6:3000', // Update this to your network IP when needed
} as const
