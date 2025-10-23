import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-05-28.basil',
});

interface RecentPayment {
  id: string;
  customer: string;
  product: string;
  amount: number;
  date: string;
  status: string;
  currency: string;
}

interface ActiveSubscription {
  id: string;
  customer: string;
  product: string;
  status: string;
  startDate: string;
  nextBillingDate: string;
  amount: number;
  currency: string;
}

interface ProductSummary {
  id: string;
  name: string;
  price: number;
  currency: string;
  activeUsers: number;
  totalRevenue: number;
}

interface PayoutSummary {
  id: string;
  date: string;
  amount: number;
  status: string;
  currency: string;
  arrivalDate: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    switch (table) {
      case 'payments':
        return NextResponse.json(await getRecentPayments(limit, offset));
      case 'subscriptions':
        return NextResponse.json(await getActiveSubscriptions(limit, offset));
      case 'products':
        return NextResponse.json(await getProductSummaries());
      case 'payouts':
        return NextResponse.json(await getPayouts(limit, offset));
      default:
        return NextResponse.json(
          { error: 'Invalid table parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error fetching table data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch table data' },
      { status: 500 }
    );
  }
}

async function getRecentPayments(limit: number, offset: number): Promise<{
  data: RecentPayment[];
  hasMore: boolean;
  total: number;
}> {
  // Get charges with pagination
  const startingAfterId = offset > 0 ? await getStartingAfterId('charges', offset) : undefined;
  const chargeParams = { limit, ...(startingAfterId ? { starting_after: startingAfterId } : {}) };
  const charges = await stripe.charges.list(chargeParams);

  const payments: RecentPayment[] = [];

  for (const charge of charges.data) {
    let customerName = 'Unknown Customer';
    let productName = 'Unknown Product';

    // Get customer info
    if (charge.customer) {
      try {
        const customer = await stripe.customers.retrieve(charge.customer as string);
        if (!customer.deleted) {
          customerName = customer.name || customer.email || `Customer ${charge.customer}`;
        }
      } catch (error) {
        console.warn(`Failed to fetch customer ${charge.customer}:`, error);
      }
    }

    // Get product info from payment intent or invoice
    if (charge.payment_intent) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(charge.payment_intent as string);
        if ((paymentIntent as any).invoice) {
          const invoice = await stripe.invoices.retrieve((paymentIntent as any).invoice as string);
          if (invoice.lines.data.length > 0) {
            const lineItem = invoice.lines.data[0];
            if ((lineItem as any)?.price?.product) {
              const product = await stripe.products.retrieve((lineItem as any).price.product as string);
              productName = product.name;
            }
          }
        }
      } catch (error) {
        console.warn(`Failed to fetch product info for charge ${charge.id}:`, error);
      }
    }

    payments.push({
      id: charge.id,
      customer: customerName,
      product: productName,
      amount: charge.amount / 100,
      date: new Date(charge.created * 1000).toISOString(),
      status: charge.status,
      currency: charge.currency.toUpperCase(),
    });
  }

  return {
    data: payments,
    hasMore: charges.has_more,
    total: await getTotalCount('charges'),
  };
}

async function getActiveSubscriptions(limit: number, offset: number): Promise<{
  data: ActiveSubscription[];
  hasMore: boolean;
  total: number;
}> {
  const startingAfterId = offset > 0 ? await getStartingAfterId('subscriptions', offset) : undefined;
  const subParams = { 
    status: 'active' as const, 
    limit, 
    ...(startingAfterId ? { starting_after: startingAfterId } : {}) 
  };
  const subscriptions = await stripe.subscriptions.list(subParams);

  const activeSubscriptions: ActiveSubscription[] = [];

  for (const subscription of subscriptions.data) {
    let customerName = 'Unknown Customer';
    let productName = 'Unknown Product';
    let amount = 0;
    let currency = 'usd';

    // Get customer info
    if (subscription.customer) {
      try {
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        if (!customer.deleted) {
          customerName = customer.name || customer.email || `Customer ${subscription.customer}`;
        }
      } catch (error) {
        console.warn(`Failed to fetch customer ${subscription.customer}:`, error);
      }
    }

    // Get product and pricing info
    if (subscription.items.data.length > 0) {
      const item = subscription.items.data[0];
      amount = item?.price.unit_amount || 0;
      currency = item?.price.currency || 'usd';

      if (item?.price.product) {
        try {
          const product = await stripe.products.retrieve(item.price.product as string);
          productName = product.name;
        } catch (error) {
          console.warn(`Failed to fetch product ${item.price.product}:`, error);
        }
      }
    }

    activeSubscriptions.push({
      id: subscription.id,
      customer: customerName,
      product: productName,
      status: subscription.status,
      startDate: new Date(subscription.created * 1000).toISOString(),
      nextBillingDate: new Date((subscription as any).current_period_end * 1000).toISOString(),
      amount: amount / 100,
      currency: currency.toUpperCase(),
    });
  }

  return {
    data: activeSubscriptions,
    hasMore: subscriptions.has_more,
    total: await getTotalCount('active_subscriptions'),
  };
}

async function getProductSummaries(): Promise<{
  data: ProductSummary[];
  hasMore: boolean;
  total: number;
}> {
  // Get all active products
  const products = await getAllPages(
    (params) => stripe.products.list({
      active: true,
      limit: 100,
      ...params
    })
  );

  const productSummaries: ProductSummary[] = [];

  for (const product of products) {
    // Get prices for this product
    const prices = await stripe.prices.list({
      product: product.id,
      active: true,
    });

    let activeUsers = 0;
    let totalRevenue = 0;
    const defaultPrice = prices.data[0]?.unit_amount || 0;
    const currency = prices.data[0]?.currency || 'usd';

    // Count active subscriptions for this product
    for (const price of prices.data) {
      const subscriptions = await getAllPages(
        (params) => stripe.subscriptions.list({
          price: price.id,
          status: 'active',
          limit: 100,
          ...params
        })
      );
      activeUsers += subscriptions.length;

      // Calculate revenue from subscriptions
      subscriptions.forEach(() => {
        const amount = price.unit_amount || 0;
        if (price.recurring?.interval === 'month') {
          totalRevenue += amount / 100;
        } else if (price.recurring?.interval === 'year') {
          totalRevenue += (amount / 100) / 12; // Convert to monthly
        }
      });
    }

    // Add one-time purchases (if any charges reference this product)
    try {
      const charges = await getAllPages(
        (params) => stripe.charges.list({
          limit: 100,
          ...params
        })
      );

      charges.forEach(charge => {
        if (charge.metadata?.product_id === product.id && charge.status === 'succeeded') {
          totalRevenue += charge.amount / 100;
        }
      });
    } catch (error) {
      console.warn(`Failed to fetch charges for product ${product.id}:`, error);
    }

    productSummaries.push({
      id: product.id,
      name: product.name,
      price: defaultPrice / 100,
      currency: currency.toUpperCase(),
      activeUsers,
      totalRevenue,
    });
  }

  return {
    data: productSummaries.sort((a, b) => b.totalRevenue - a.totalRevenue),
    hasMore: false,
    total: productSummaries.length,
  };
}

async function getPayouts(limit: number, offset: number): Promise<{
  data: PayoutSummary[];
  hasMore: boolean;
  total: number;
}> {
  const startingAfterId = offset > 0 ? await getStartingAfterId('payouts', offset) : undefined;
  const payoutParams = { limit, ...(startingAfterId ? { starting_after: startingAfterId } : {}) };
  const payouts = await stripe.payouts.list(payoutParams);

  const payoutSummaries: PayoutSummary[] = payouts.data.map(payout => ({
    id: payout.id,
    date: new Date(payout.created * 1000).toISOString(),
    amount: payout.amount / 100,
    status: payout.status,
    currency: payout.currency.toUpperCase(),
    arrivalDate: new Date(payout.arrival_date * 1000).toISOString(),
  }));

  return {
    data: payoutSummaries,
    hasMore: payouts.has_more,
    total: await getTotalCount('payouts'),
  };
}

// Helper functions
async function getStartingAfterId(resource: string, offset: number): Promise<string | undefined> {
  // This is a simplified approach - in production you might want to cache IDs for pagination
  let count = 0;
  let startingAfter: string | undefined;

  while (count < offset) {
    const listParams = { limit: 100, ...(startingAfter ? { starting_after: startingAfter } : {}) };
    let response;
    switch (resource) {
      case 'charges':
        response = await stripe.charges.list(listParams);
        break;
      case 'subscriptions':
        response = await stripe.subscriptions.list(listParams);
        break;
      case 'payouts':
        response = await stripe.payouts.list(listParams);
        break;
      default:
        return undefined;
    }

    count += response.data.length;
    if (response.has_more && response.data.length > 0) {
      startingAfter = response.data[response.data.length - 1]?.id;
    } else {
      break;
    }
  }

  return startingAfter;
}

async function getTotalCount(resource: string): Promise<number> {
  // Note: Stripe doesn't provide direct count endpoints, so this is an approximation
  let count = 0;
  let hasMore = true;
  let startingAfter: string | undefined;

  while (hasMore && count < 10000) { // Limit to prevent infinite loops
    const listParams = { limit: 100, ...(startingAfter ? { starting_after: startingAfter } : {}) };
    let response;
    switch (resource) {
      case 'charges':
        response = await stripe.charges.list(listParams);
        break;
      case 'active_subscriptions':
        response = await stripe.subscriptions.list({ 
          status: 'active' as const, 
          ...listParams
        });
        break;
      case 'payouts':
        response = await stripe.payouts.list(listParams);
        break;
      default:
        return 0;
    }

    count += response.data.length;
    hasMore = response.has_more;
    if (hasMore && response.data.length > 0) {
      startingAfter = (response.data[response.data.length - 1] as any)?.id;
    }
  }

  return count;
}

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