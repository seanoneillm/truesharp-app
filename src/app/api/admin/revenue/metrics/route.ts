import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-05-28.basil',
});

interface RevenueMetrics {
  totalRevenue: { gross: number; net: number };
  mrr: number;
  activeSubscriptions: number;
  refundRate: number;
  totalCustomers: number;
  totalPayouts: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Parallel requests for better performance
    const [
      charges,
      subscriptions,
      customers,
      refunds,
      payouts,
      balanceTransactions
    ] = await Promise.all([
      // Charges for revenue calculation
      getAllPages(
        (params) => stripe.charges.list({
          created: { gte: Math.floor(startDate.getTime() / 1000) },
          limit: 100,
          ...params
        })
      ),
      
      // Active subscriptions for MRR
      getAllPages(
        (params) => stripe.subscriptions.list({
          status: 'active',
          limit: 100,
          ...params
        })
      ),
      
      // Total customers
      stripe.customers.list({ limit: 1 }),
      
      // Refunds for refund rate
      getAllPages(
        (params) => stripe.refunds.list({
          created: { gte: Math.floor(startDate.getTime() / 1000) },
          limit: 100,
          ...params
        })
      ),
      
      // Payouts
      getAllPages(
        (params) => stripe.payouts.list({
          created: { gte: Math.floor(startDate.getTime() / 1000) },
          limit: 100,
          ...params
        })
      ),
      
      // Balance transactions for net revenue
      getAllPages(
        (params) => stripe.balanceTransactions.list({
          created: { gte: Math.floor(startDate.getTime() / 1000) },
          limit: 100,
          ...params
        })
      )
    ]);

    // Calculate metrics
    const grossRevenue = charges
      .filter(charge => charge.status === 'succeeded')
      .reduce((sum, charge) => sum + charge.amount, 0) / 100;

    const netRevenue = balanceTransactions
      .filter(tx => tx.type === 'charge')
      .reduce((sum, tx) => sum + tx.net, 0) / 100;

    const refundAmount = refunds.reduce((sum, refund) => sum + refund.amount, 0) / 100;
    const refundRate = grossRevenue > 0 ? (refundAmount / grossRevenue) * 100 : 0;

    // Calculate MRR from active subscriptions
    const mrr = subscriptions.reduce((sum, sub) => {
      const monthlyAmount = sub.items.data.reduce((itemSum, item) => {
        const price = item.price;
        if (price.recurring?.interval === 'month') {
          return itemSum + (price.unit_amount || 0);
        } else if (price.recurring?.interval === 'year') {
          return itemSum + (price.unit_amount || 0) / 12;
        }
        return itemSum;
      }, 0);
      return sum + monthlyAmount;
    }, 0) / 100;

    const totalPayouts = payouts.reduce((sum, payout) => sum + payout.amount, 0) / 100;

    const metrics: RevenueMetrics = {
      totalRevenue: { gross: grossRevenue, net: netRevenue },
      mrr,
      activeSubscriptions: subscriptions.length,
      refundRate,
      totalCustomers: customers.has_more ? await getTotalCount('customers') : customers.data.length,
      totalPayouts
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching revenue metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revenue metrics' },
      { status: 500 }
    );
  }
}

// Helper function to get all pages of data
async function getAllPages<T>(
  listFunction: (params?: { starting_after?: string }) => Promise<Stripe.ApiList<T>>
): Promise<T[]> {
  const allItems: T[] = [];
  let hasMore = true;
  let startingAfter: string | undefined;

  while (hasMore) {
    const response = await listFunction(startingAfter ? { starting_after: startingAfter } : {});
    allItems.push(...response.data);
    hasMore = response.has_more;
    if (hasMore && response.data.length > 0) {
      startingAfter = (response.data[response.data.length - 1] as any)?.id;
    }
  }

  return allItems;
}

// Helper function to get total count
async function getTotalCount(resource: 'customers' | 'subscriptions'): Promise<number> {
  let count = 0;
  let hasMore = true;
  let startingAfter: string | undefined;

  while (hasMore) {
    const listParams = { limit: 100, ...(startingAfter ? { starting_after: startingAfter } : {}) };
    const response = resource === 'customers' 
      ? await stripe.customers.list(listParams)
      : await stripe.subscriptions.list(listParams);
    
    count += response.data.length;
    hasMore = response.has_more;
    if (hasMore && response.data.length > 0) {
      startingAfter = (response.data[response.data.length - 1] as any)?.id;
    }
  }

  return count;
}