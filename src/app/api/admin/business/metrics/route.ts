import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase';
// import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
//   apiVersion: '2025-05-28.basil',
// });

interface BusinessMetrics {
  // Financial Overview
  totalRevenue: { gross: number; net: number };
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  mrr: number;
  
  // Expense Breakdown
  expensesByCategory: {
    development: number;
    operations: number;
    marketing: number;
    general: number;
  };
  
  // Recurring Analysis
  monthlyRecurring: number;
  yearlyRecurring: number;
  oneTimeExpenses: number;
  
  // Business Ratios
  customerAcquisitionCost: number;
  lifetimeValueToCAC: number;
  monthlyBurnRate: number;
  runway: number;
  
  // Growth Metrics
  revenueGrowthRate: number;
  expenseGrowthRate: number;
  profitGrowthRate: number;
  
  // Additional Metrics
  activeSubscriptions: number;
  totalCustomers: number;
  avgRevenuePerCustomer: number;
  upcomingExpenses: Array<{
    id: string;
    description: string;
    amount: number;
    next_due_date: string;
    category: string;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServiceRoleClient();
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];
    
    const endDate = new Date();
    const endDateStr = endDate.toISOString().split('T')[0];

    // Get previous period for growth calculations
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - days);
    const prevStartDateStr = prevStartDate.toISOString().split('T')[0];

    // First get expense data
    const [
      expensesResponse,
      prevExpensesResponse,
      recurringExpensesResponse,
      upcomingExpensesResponse
    ] = await Promise.all([
      // Current period expenses
      supabase
        .from('business_expenses')
        .select('*')
        .eq('status', 'active')
        .gte('expense_date', startDateStr)
        .lte('expense_date', endDateStr),
      
      // Previous period expenses for growth calculation
      supabase
        .from('business_expenses')
        .select('*')
        .eq('status', 'active')
        .gte('expense_date', prevStartDateStr)
        .lt('expense_date', startDateStr),
      
      // Recurring expenses
      supabase
        .from('business_expenses')
        .select('*')
        .eq('status', 'active')
        .eq('is_recurring', true),
      
      // Upcoming expenses (next 30 days)
      supabase
        .from('business_expenses')
        .select('id, description, amount, next_due_date, category')
        .eq('status', 'active')
        .eq('is_recurring', true)
        .gte('next_due_date', new Date().toISOString().split('T')[0])
        .lte('next_due_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('next_due_date', { ascending: true })
    ]);

    // Now get revenue data using the same logic as the revenue tab
    let revenueData = { totalRevenue: { gross: 0, net: 0 }, activeSubscriptions: 0, totalCustomers: 0, mrr: 0 };
    
    try {
      // Use the same Stripe logic as the revenue API but inline
      if (!process.env.STRIPE_SECRET_KEY) {
        console.warn('STRIPE_SECRET_KEY not set, using default revenue values');
      } else {
        // Import Stripe here to get real data
        const Stripe = require('stripe');
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
          apiVersion: '2025-05-28.basil',
        });

        const dateForTimestamp = startDateStr ? new Date(startDateStr) : new Date();
        dateForTimestamp.setDate(dateForTimestamp.getDate() - days);
        const startTimestamp = Math.floor(dateForTimestamp.getTime() / 1000);
        
        // Get charges for revenue calculation
        const charges = await stripe.charges.list({
          created: { gte: startTimestamp },
          limit: 100
        });

        // Get active subscriptions
        const subscriptions = await stripe.subscriptions.list({
          status: 'active',
          limit: 100
        });

        // Get customers
        const customers = await stripe.customers.list({
          limit: 100
        });

        // Calculate revenue
        let grossRevenue = 0;
        let netRevenue = 0;

        charges.data.forEach((charge: any) => {
          if (charge.status === 'succeeded') {
            grossRevenue += charge.amount / 100; // Convert from cents
            netRevenue += (charge.amount - (charge.application_fee_amount || 0)) / 100;
          }
        });

        // Calculate MRR
        let mrr = 0;
        subscriptions.data.forEach((sub: any) => {
          if (sub.items && sub.items.data.length > 0) {
            const price = sub.items.data[0].price;
            if (price && price.unit_amount) {
              const amount = price.unit_amount / 100;
              if (price.recurring?.interval === 'month') {
                mrr += amount;
              } else if (price.recurring?.interval === 'year') {
                mrr += amount / 12;
              }
            }
          }
        });

        revenueData = {
          totalRevenue: { gross: grossRevenue, net: netRevenue },
          activeSubscriptions: subscriptions.data.length,
          totalCustomers: customers.data.length,
          mrr
        };
      }
    } catch (error) {
      console.error('Error fetching Stripe data directly:', error);
      // Keep default values
    }

    if (expensesResponse.error) {
      console.error('Error fetching expenses:', expensesResponse.error);
      return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
    }

    const expenses = expensesResponse.data || [];
    const prevExpenses = prevExpensesResponse.data || [];
    const recurringExpenses = recurringExpensesResponse.data || [];
    const upcomingExpenses = upcomingExpensesResponse.data || [];

    // Helper function to calculate actual expense amount based on recurring frequency
    const calculateActualExpenseAmount = (expense: any, periodStartDate: Date, periodEndDate: Date): number => {
      const baseAmount = parseFloat(expense.amount);
      
      if (!expense.is_recurring) {
        // One-time expense - only count if within period
        const expenseDate = new Date(expense.expense_date);
        return (expenseDate >= periodStartDate && expenseDate <= periodEndDate) ? baseAmount : 0;
      }
      
      // Recurring expense - calculate how many payments occurred in the period
      const expenseStartDate = new Date(expense.expense_date);
      const recurringEndDate = expense.recurring_end_date ? new Date(expense.recurring_end_date) : periodEndDate;
      
      // Don't count if expense started after period end or ended before period start
      if (expenseStartDate > periodEndDate || recurringEndDate < periodStartDate) {
        return 0;
      }
      
      const effectiveStartDate = new Date(Math.max(expenseStartDate.getTime(), periodStartDate.getTime()));
      const effectiveEndDate = new Date(Math.min(recurringEndDate.getTime(), periodEndDate.getTime()));
      
      let paymentCount = 0;
      
      if (expense.recurring_interval === 'monthly') {
        // Calculate months between dates
        const months = (effectiveEndDate.getFullYear() - effectiveStartDate.getFullYear()) * 12 + 
                      (effectiveEndDate.getMonth() - effectiveStartDate.getMonth()) + 1;
        paymentCount = Math.max(0, months);
      } else if (expense.recurring_interval === 'quarterly') {
        // Calculate quarters between dates
        const months = (effectiveEndDate.getFullYear() - effectiveStartDate.getFullYear()) * 12 + 
                      (effectiveEndDate.getMonth() - effectiveStartDate.getMonth()) + 1;
        paymentCount = Math.max(0, Math.ceil(months / 3));
      } else if (expense.recurring_interval === 'yearly') {
        // Calculate years between dates
        const years = effectiveEndDate.getFullYear() - effectiveStartDate.getFullYear() + 1;
        paymentCount = Math.max(0, years);
      }
      
      return baseAmount * paymentCount;
    };

    // Calculate total expenses with proper recurring calculations  
    const currentPeriodStart = new Date(startDateStr!);
    const currentPeriodEnd = new Date(endDateStr!);
    const prevPeriodStart = new Date(prevStartDateStr!);
    const prevPeriodEnd = new Date(startDateStr!);
    
    const totalExpenses = expenses.reduce((sum, expense) => {
      return sum + calculateActualExpenseAmount(expense, currentPeriodStart, currentPeriodEnd);
    }, 0);
    
    const prevTotalExpenses = prevExpenses.reduce((sum, expense) => {
      return sum + calculateActualExpenseAmount(expense, prevPeriodStart, prevPeriodEnd);
    }, 0);

    // Calculate expenses by category with proper recurring calculations
    const expensesByCategory = {
      development: 0,
      operations: 0,
      marketing: 0,
      general: 0,
    };

    expenses.forEach(expense => {
      if (expense.category in expensesByCategory) {
        const actualAmount = calculateActualExpenseAmount(expense, currentPeriodStart, currentPeriodEnd);
        expensesByCategory[expense.category as keyof typeof expensesByCategory] += actualAmount;
      }
    });

    // Calculate recurring vs one-time expenses
    let monthlyRecurring = 0;
    let yearlyRecurring = 0;
    
    recurringExpenses.forEach(expense => {
      const amount = parseFloat(expense.amount);
      if (expense.recurring_interval === 'monthly') {
        monthlyRecurring += amount;
      } else if (expense.recurring_interval === 'quarterly') {
        monthlyRecurring += amount / 3;
      } else if (expense.recurring_interval === 'yearly') {
        yearlyRecurring += amount;
        monthlyRecurring += amount / 12;
      }
    });

    // Calculate one-time vs recurring expenses for the period
    const recurringExpensesTotal = expenses
      .filter(e => e.is_recurring)
      .reduce((sum, expense) => sum + calculateActualExpenseAmount(expense, currentPeriodStart, currentPeriodEnd), 0);
    
    const oneTimeExpenses = totalExpenses - recurringExpensesTotal;

    // Financial calculations
    const totalRevenue = revenueData.totalRevenue || { gross: 0, net: 0 };
    const netProfit = totalRevenue.net - totalExpenses;
    const profitMargin = totalRevenue.net > 0 ? (netProfit / totalRevenue.net) * 100 : 0;
    
    // Debug logging
    console.log('Business Metrics Debug:', {
      totalExpenses,
      totalRevenue,
      netProfit,
      revenueDataReceived: !!revenueData.totalRevenue,
      expensesCount: expenses.length
    });

    // Business ratios
    const marketingExpenses = expensesByCategory.marketing;
    const totalCustomers = revenueData.totalCustomers || 0;
    const activeSubscriptions = revenueData.activeSubscriptions || 0;
    
    // Estimate new customers (simplified - would need more sophisticated tracking)
    const estimatedNewCustomers = Math.max(1, Math.floor(totalCustomers * 0.1)); // Assume 10% are new
    const customerAcquisitionCost = estimatedNewCustomers > 0 ? marketingExpenses / estimatedNewCustomers : 0;
    
    // Estimate average LTV (simplified)
    const avgRevenuePerCustomer = totalCustomers > 0 ? totalRevenue.net / totalCustomers : 0;
    const estimatedLTV = avgRevenuePerCustomer * 12; // Assume 12 month retention
    const lifetimeValueToCAC = customerAcquisitionCost > 0 ? estimatedLTV / customerAcquisitionCost : 0;
    
    const monthlyBurnRate = monthlyRecurring + (oneTimeExpenses / (days / 30));
    const runway = monthlyBurnRate > 0 ? netProfit / monthlyBurnRate : 0;

    // Growth calculations
    const expenseGrowthRate = prevTotalExpenses > 0 ? ((totalExpenses - prevTotalExpenses) / prevTotalExpenses) * 100 : 0;
    
    // Simplified revenue growth (would need historical data for accurate calculation)
    const revenueGrowthRate = 0; // Placeholder - would need previous period revenue
    const profitGrowthRate = 0; // Placeholder - would need previous period profit

    const metrics: BusinessMetrics = {
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      mrr: revenueData.mrr,
      expensesByCategory,
      monthlyRecurring,
      yearlyRecurring,
      oneTimeExpenses,
      customerAcquisitionCost,
      lifetimeValueToCAC,
      monthlyBurnRate,
      runway,
      revenueGrowthRate,
      expenseGrowthRate,
      profitGrowthRate,
      activeSubscriptions,
      totalCustomers,
      avgRevenuePerCustomer,
      upcomingExpenses,
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching business metrics:', error);
    return NextResponse.json({ error: 'Failed to fetch business metrics' }, { status: 500 });
  }
}