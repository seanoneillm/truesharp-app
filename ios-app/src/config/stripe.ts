import { API_ENDPOINTS, Environment } from './environment'

export interface StripeConfig {
  publishableKey: string
  connectClientId: string
  webhookSecret: string
  webhookEndpoint: string
  marketplaceFeePercentage: number
  truesharpPro: {
    productId: string
    monthlyPriceId: string
    yearlyPriceId: string
  }
}

export const STRIPE_CONFIG: StripeConfig = {
  publishableKey:
    'pk_live_51RoZG9FUxltcCPEt0GKr2FKoRSXFvyI4cfgsJVtUldKf7tAY9KyAD8ltS3Kxiim0MepLK3S58PNWgJd2nJS7Fxrs00UpaWgbKx',
  connectClientId: 'ca_Sk3Of1WVUlLiYiUbgqEmTd1x3f353Tws',
  webhookSecret: 'whsec_Jq3wxcvOlK6OvuvwbXRjQkbSH6nEUqLe',
  webhookEndpoint: API_ENDPOINTS.webhooks,
  marketplaceFeePercentage: 15,
  truesharpPro: {
    productId: 'prod_T0QifcIPF83rbh', // From web app
    monthlyPriceId: 'price_1234', // You may need to provide these
    yearlyPriceId: 'price_5678', // You may need to provide these
  },
}

// API URLs - uses environment configuration
export const API_URLS = {
  strategies: API_ENDPOINTS.strategies,
  stripeConnect: API_ENDPOINTS.stripeConnect,
  webhooks: API_ENDPOINTS.webhooks,
}

// Environment configuration
export const APP_CONFIG = {
  baseUrl: Environment.API_BASE_URL,
  isDev: Environment.isDevelopment,
}
