import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-05-28.basil',
})

export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  connectClientId: process.env.STRIPE_CONNECT_CLIENT_ID!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  marketplaceFeePercentage: parseInt(process.env.MARKETPLACE_FEE_PERCENTAGE || '15'),
  // TrueSharp Pro Product Configuration
  truesharpPro: {
    productId: 'prod_T0QifcIPF83rbh',
    monthlyPriceId: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID!,
    yearlyPriceId: process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID!,
  },
}