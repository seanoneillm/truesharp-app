import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-05-28.basil',
});

interface ChartDataPoint {
  date: string;
  grossRevenue: number;
  netRevenue: number;
  subscriptions: number;
  refunds: number;
}

interface ProductRevenue {
  productName: string;
  revenue: number;
  subscriptions: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const interval = searchParams.get('interval') || 'daily'; // daily, weekly, monthly
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch all necessary data
    const [charges, subscriptions, refunds, products, balanceTransactions] = await Promise.all([
      getAllPages(
        (params) => stripe.charges.list({
          created: { gte: Math.floor(startDate.getTime() / 1000) },
          limit: 100,
          ...params
        })
      ),
      getAllPages(
        (params) => stripe.subscriptions.list({
          created: { gte: Math.floor(startDate.getTime() / 1000) },
          limit: 100,
          ...params
        })
      ),
      getAllPages(
        (params) => stripe.refunds.list({
          created: { gte: Math.floor(startDate.getTime() / 1000) },
          limit: 100,
          ...params
        })
      ),
      getAllPages(
        (params) => stripe.products.list({
          active: true,
          limit: 100,
          ...params
        })
      ),
      getAllPages(
        (params) => stripe.balanceTransactions.list({
          created: { gte: Math.floor(startDate.getTime() / 1000) },
          type: 'charge',
          limit: 100,
          ...params
        })
      )
    ]);

    // Process revenue over time
    const revenueOverTime = processRevenueOverTime(
      charges, 
      balanceTransactions,
      subscriptions, 
      refunds, 
      startDate, 
      interval
    );

    // Process product revenue breakdown
    const productRevenue = await processProductRevenue(charges, subscriptions, products);

    // Process subscription growth
    const subscriptionGrowth = processSubscriptionGrowth(subscriptions, startDate, interval);

    return NextResponse.json({
      revenueOverTime,
      productRevenue,
      subscriptionGrowth,
      refundsAndFees: processRefundsAndFees(refunds, balanceTransactions, startDate, interval)
    });
  } catch (error) {
    console.error('Error fetching chart data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chart data' },
      { status: 500 }
    );
  }
}

function processRevenueOverTime(
  charges: Stripe.Charge[],
  balanceTransactions: Stripe.BalanceTransaction[],
  subscriptions: Stripe.Subscription[],
  refunds: Stripe.Refund[],
  startDate: Date,
  interval: string
): ChartDataPoint[] {
  const dataMap = new Map<string, ChartDataPoint>();
  
  // Initialize all dates
  const current = new Date(startDate);
  const end = new Date();
  
  while (current <= end) {
    const dateKey = getDateKey(current, interval);
    if (!dataMap.has(dateKey)) {
      dataMap.set(dateKey, {
        date: dateKey,
        grossRevenue: 0,
        netRevenue: 0,
        subscriptions: 0,
        refunds: 0
      });
    }
    
    if (interval === 'daily') current.setDate(current.getDate() + 1);
    else if (interval === 'weekly') current.setDate(current.getDate() + 7);
    else current.setMonth(current.getMonth() + 1);
  }

  // Process charges for gross revenue
  charges.forEach(charge => {
    if (charge.status === 'succeeded') {
      const dateKey = getDateKey(new Date(charge.created * 1000), interval);
      const data = dataMap.get(dateKey);
      if (data) {
        data.grossRevenue += charge.amount / 100;
      }
    }
  });

  // Process balance transactions for net revenue
  balanceTransactions.forEach(tx => {
    const dateKey = getDateKey(new Date(tx.created * 1000), interval);
    const data = dataMap.get(dateKey);
    if (data) {
      data.netRevenue += tx.net / 100;
    }
  });

  // Process subscriptions
  subscriptions.forEach(sub => {
    const dateKey = getDateKey(new Date(sub.created * 1000), interval);
    const data = dataMap.get(dateKey);
    if (data) {
      data.subscriptions += 1;
    }
  });

  // Process refunds
  refunds.forEach(refund => {
    const dateKey = getDateKey(new Date(refund.created * 1000), interval);
    const data = dataMap.get(dateKey);
    if (data) {
      data.refunds += refund.amount / 100;
    }
  });

  return Array.from(dataMap.values()).sort((a, b) => a.date.localeCompare(b.date));
}

async function processProductRevenue(
  charges: Stripe.Charge[],
  subscriptions: Stripe.Subscription[],
  products: Stripe.Product[]
): Promise<ProductRevenue[]> {
  const productMap = new Map<string, { revenue: number; subscriptions: number; name: string }>();

  // Initialize products
  products.forEach(product => {
    productMap.set(product.id, {
      revenue: 0,
      subscriptions: 0,
      name: product.name
    });
  });

  // Process subscription revenue
  for (const subscription of subscriptions) {
    for (const item of subscription.items.data) {
      if (item.price.product && typeof item.price.product === 'string') {
        const productData = productMap.get(item.price.product);
        if (productData) {
          productData.subscriptions += 1;
          // Calculate revenue based on subscription amount
          const amount = item.price.unit_amount || 0;
          productData.revenue += amount / 100;
        }
      }
    }
  }

  // Process one-time payment revenue
  for (const charge of charges) {
    if (charge.status === 'succeeded' && charge.metadata?.product_id) {
      const productData = productMap.get(charge.metadata.product_id);
      if (productData) {
        productData.revenue += charge.amount / 100;
      }
    }
  }

  return Array.from(productMap.values())
    .filter(item => item.revenue > 0 || item.subscriptions > 0)
    .map(item => ({
      productName: item.name,
      revenue: item.revenue,
      subscriptions: item.subscriptions
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

function processSubscriptionGrowth(
  subscriptions: Stripe.Subscription[],
  startDate: Date,
  interval: string
): Array<{ date: string; activeSubscriptions: number }> {
  const dataMap = new Map<string, number>();
  
  // Initialize dates
  const current = new Date(startDate);
  const end = new Date();
  
  while (current <= end) {
    const dateKey = getDateKey(current, interval);
    dataMap.set(dateKey, 0);
    
    if (interval === 'daily') current.setDate(current.getDate() + 1);
    else if (interval === 'weekly') current.setDate(current.getDate() + 7);
    else current.setMonth(current.getMonth() + 1);
  }

  // Count active subscriptions at each point
  subscriptions.forEach(sub => {
    const createDate = new Date(sub.created * 1000);
    const cancelDate = sub.canceled_at ? new Date(sub.canceled_at * 1000) : null;
    
    for (const [dateKey, count] of dataMap.entries()) {
      const date = new Date(dateKey);
      if (date >= createDate && (!cancelDate || date < cancelDate)) {
        dataMap.set(dateKey, count + 1);
      }
    }
  });

  return Array.from(dataMap.entries())
    .map(([date, activeSubscriptions]) => ({ date, activeSubscriptions }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function processRefundsAndFees(
  refunds: Stripe.Refund[],
  balanceTransactions: Stripe.BalanceTransaction[],
  startDate: Date,
  interval: string
): Array<{ date: string; refunds: number; fees: number }> {
  const dataMap = new Map<string, { refunds: number; fees: number }>();
  
  // Initialize dates
  const current = new Date(startDate);
  const end = new Date();
  
  while (current <= end) {
    const dateKey = getDateKey(current, interval);
    dataMap.set(dateKey, { refunds: 0, fees: 0 });
    
    if (interval === 'daily') current.setDate(current.getDate() + 1);
    else if (interval === 'weekly') current.setDate(current.getDate() + 7);
    else current.setMonth(current.getMonth() + 1);
  }

  // Process refunds
  refunds.forEach(refund => {
    const dateKey = getDateKey(new Date(refund.created * 1000), interval);
    const data = dataMap.get(dateKey);
    if (data) {
      data.refunds += refund.amount / 100;
    }
  });

  // Process fees
  balanceTransactions.forEach(tx => {
    const dateKey = getDateKey(new Date(tx.created * 1000), interval);
    const data = dataMap.get(dateKey);
    if (data) {
      data.fees += tx.fee / 100;
    }
  });

  return Array.from(dataMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function getDateKey(date: Date, interval: string): string {
  if (interval === 'daily') {
    return date.toISOString().split('T')[0]!;
  } else if (interval === 'weekly') {
    const week = getWeekNumber(date);
    return `${date.getFullYear()}-W${week.toString().padStart(2, '0')}`;
  } else {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  }
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
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