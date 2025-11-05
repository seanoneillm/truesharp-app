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
    const yearParam = searchParams.get('year');
    const monthParam = searchParams.get('month');
    
    // Calculate date ranges based on year and month parameters
    let startDate: Date;
    let endDate: Date;
    let prevStartDate: Date;
    let prevEndDate: Date;
    
    if (yearParam && yearParam !== 'all-time') {
      const year = parseInt(yearParam);
      
      if (monthParam && monthParam !== 'all') {
        // Specific month and year
        const month = parseInt(monthParam) - 1; // JavaScript months are 0-indexed
        startDate = new Date(year, month, 1);
        endDate = new Date(year, month + 1, 0); // Last day of the month
        
        // Previous month for comparison
        const prevMonth = month - 1;
        const prevYear = prevMonth < 0 ? year - 1 : year;
        const adjustedPrevMonth = prevMonth < 0 ? 11 : prevMonth;
        prevStartDate = new Date(prevYear, adjustedPrevMonth, 1);
        prevEndDate = new Date(prevYear, adjustedPrevMonth + 1, 0);
      } else {
        // Entire year
        startDate = new Date(year, 0, 1);
        endDate = new Date(year, 11, 31);
        
        // Previous year for comparison
        prevStartDate = new Date(year - 1, 0, 1);
        prevEndDate = new Date(year - 1, 11, 31);
      }
    } else {
      // All time - use a very early start date
      startDate = new Date('2020-01-01');
      endDate = new Date();
      
      // For all-time comparison, use the same period from last year
      prevStartDate = new Date(startDate);
      prevStartDate.setFullYear(prevStartDate.getFullYear() - 1);
      prevEndDate = new Date(endDate);
      prevEndDate.setFullYear(prevEndDate.getFullYear() - 1);
    }
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    const prevStartDateStr = prevStartDate.toISOString().split('T')[0];
    const prevEndDateStr = prevEndDate.toISOString().split('T')[0];

    // First get expense data
    const [
      expensesResponse,
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
      
      
      // Recurring expenses
      supabase
        .from('business_expenses')
        .select('*')
        .eq('status', 'active')
        .eq('is_recurring', true),
      
      // Upcoming expenses (next 30 days) - more sophisticated calculation
      supabase
        .from('business_expenses')
        .select('id, description, amount, next_due_date, category, recurring_interval, expense_date')
        .eq('status', 'active')
        .eq('is_recurring', true)
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
        const { default: Stripe } = await import('stripe');
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
          apiVersion: '2025-05-28.basil',
        });

        const dateForTimestamp = new Date(startDateStr);
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

        charges.data.forEach((charge) => {
          if (charge.status === 'succeeded') {
            grossRevenue += charge.amount / 100; // Convert from cents
            netRevenue += (charge.amount - (charge.application_fee_amount || 0)) / 100;
          }
        });

        // Calculate MRR
        let mrr = 0;
        subscriptions.data.forEach((sub) => {
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

    // Note: expenses and prevExpenses variables removed as they're now part of allExpenses
    const recurringExpenses = recurringExpensesResponse.data || [];
    // Process upcoming expenses to calculate actual next due dates
    const rawUpcomingExpenses = upcomingExpensesResponse.data || [];
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const upcomingExpenses = rawUpcomingExpenses
      .map(expense => {
        // Calculate the actual next due date based on the recurring interval
        let nextDueDate = expense.next_due_date ? new Date(expense.next_due_date) : new Date(expense.expense_date);
        
        // If next_due_date is in the past, calculate the next actual due date
        while (nextDueDate < now) {
          if (expense.recurring_interval === 'monthly') {
            nextDueDate.setMonth(nextDueDate.getMonth() + 1);
          } else if (expense.recurring_interval === 'quarterly') {
            nextDueDate.setMonth(nextDueDate.getMonth() + 3);
          } else if (expense.recurring_interval === 'yearly') {
            nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
          }
        }
        
        return {
          ...expense,
          next_due_date: nextDueDate.toISOString().split('T')[0]
        };
      })
      .filter(expense => {
        const dueDate = new Date(expense.next_due_date);
        return dueDate >= now && dueDate <= thirtyDaysFromNow;
      })
      .sort((a, b) => new Date(a.next_due_date).getTime() - new Date(b.next_due_date).getTime());

    // Helper function to calculate how many days between two dates
    const daysBetween = (date1: Date, date2: Date): number => {
      const timeDiff = Math.abs(date2.getTime() - date1.getTime());
      return Math.ceil(timeDiff / (1000 * 3600 * 24));
    };

    // Helper function to check if a specific recurring payment occurs within a period
    const doesRecurringPaymentOccurInPeriod = (expense: { expense_date: string; recurring_interval?: string; recurring_end_date?: string }, periodStart: Date, periodEnd: Date): boolean => {
      const expenseStartDate = new Date(expense.expense_date);
      const recurringEndDate = expense.recurring_end_date ? new Date(expense.recurring_end_date) : new Date('2099-12-31');
      
      // If expense hasn't started yet or ended before the period, no payment occurs
      if (expenseStartDate > periodEnd || recurringEndDate < periodStart) {
        return false;
      }
      
      const startDay = expenseStartDate.getDate();
      const startMonth = expenseStartDate.getMonth();
      
      if (expense.recurring_interval === 'monthly') {
        // Start from the expense start date and check each month
        let currentPaymentDate = new Date(expenseStartDate);
        
        while (currentPaymentDate <= recurringEndDate) {
          // Check if this payment date falls within our period
          if (currentPaymentDate >= periodStart && currentPaymentDate <= periodEnd) {
            return true;
          }
          
          // Move to next month, keeping the same day
          const nextMonth = currentPaymentDate.getMonth() + 1;
          const nextYear = nextMonth > 11 ? currentPaymentDate.getFullYear() + 1 : currentPaymentDate.getFullYear();
          const adjustedMonth = nextMonth > 11 ? 0 : nextMonth;
          
          // Handle cases where the day doesn't exist in the next month (e.g., Jan 31 -> Feb 28)
          const daysInNextMonth = new Date(nextYear, adjustedMonth + 1, 0).getDate();
          const dayToUse = Math.min(currentPaymentDate.getDate(), daysInNextMonth);
          
          currentPaymentDate = new Date(nextYear, adjustedMonth, dayToUse);
        }
      } else if (expense.recurring_interval === 'quarterly') {
        // Check if the quarterly payment falls within the period
        let currentPaymentDate = new Date(expenseStartDate);
        
        while (currentPaymentDate <= recurringEndDate) {
          if (currentPaymentDate >= periodStart && currentPaymentDate <= periodEnd) {
            return true;
          }
          // Move to next quarter
          currentPaymentDate.setMonth(currentPaymentDate.getMonth() + 3);
        }
      } else if (expense.recurring_interval === 'yearly') {
        // Check if the yearly payment falls within the period
        // Start from the expense start date and check each year
        let currentPaymentDate = new Date(expenseStartDate);
        
        while (currentPaymentDate <= recurringEndDate) {
          // Check if this payment date falls within our period
          if (currentPaymentDate >= periodStart && currentPaymentDate <= periodEnd) {
            return true;
          }
          
          // Move to next year, keeping the same month and day
          currentPaymentDate = new Date(currentPaymentDate.getFullYear() + 1, currentPaymentDate.getMonth(), currentPaymentDate.getDate());
        }
      }
      
      return false;
    };

    // Helper function to calculate expense amount for a specific period
    const calculateExpenseForPeriod = (expense: { amount: string; is_recurring: boolean; expense_date: string; recurring_end_date?: string; recurring_interval?: string }, periodStart: Date, periodEnd: Date): number => {
      const baseAmount = parseFloat(expense.amount);
      
      if (!expense.is_recurring) {
        // One-time expense - only count if it occurred exactly in the period
        const expenseDate = new Date(expense.expense_date);
        return (expenseDate >= periodStart && expenseDate <= periodEnd) ? baseAmount : 0;
      }
      
      // Recurring expense - check if a payment occurs in this period
      return doesRecurringPaymentOccurInPeriod(expense, periodStart, periodEnd) ? baseAmount : 0;
    };


    // Calculate total expenses with proper recurring calculations  
    const currentPeriodStart = new Date(startDateStr!);
    const currentPeriodEnd = new Date(endDateStr!);
    const prevPeriodStart = new Date(prevStartDateStr!);
    const prevPeriodEnd = new Date(prevEndDateStr!);
    
    // For business analysis, calculate expenses that occurred in the selected period
    const allActiveExpenses = await supabase
      .from('business_expenses')
      .select('*')
      .eq('status', 'active');
    
    const allExpenses = allActiveExpenses.data || [];
    
    const totalExpenses = allExpenses.reduce((sum, expense) => {
      return sum + calculateExpenseForPeriod(expense, currentPeriodStart, currentPeriodEnd);
    }, 0);
    
    const prevTotalExpenses = allExpenses.reduce((sum, expense) => {
      return sum + calculateExpenseForPeriod(expense, prevStartDate, prevEndDate);
    }, 0);

    // Calculate expenses by category with proper recurring calculations
    const expensesByCategory = {
      development: 0,
      operations: 0,
      marketing: 0,
      general: 0,
    };

    allExpenses.forEach((expense) => {
      if (expense.category in expensesByCategory) {
        const actualAmount = calculateExpenseForPeriod(expense, currentPeriodStart, currentPeriodEnd);
        expensesByCategory[expense.category as keyof typeof expensesByCategory] += actualAmount;
      }
    });

    // Calculate recurring vs one-time expenses
    let monthlyRecurring = 0;
    let yearlyRecurring = 0;
    
    recurringExpenses.forEach((expense) => {
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
    const recurringExpensesTotal = allExpenses
      .filter(e => e.is_recurring)
      .reduce((sum, expense) => sum + calculateExpenseForPeriod(expense, currentPeriodStart, currentPeriodEnd), 0);
    
    const oneTimeExpenses = allExpenses
      .filter(e => !e.is_recurring)
      .reduce((sum, expense) => sum + calculateExpenseForPeriod(expense, currentPeriodStart, currentPeriodEnd), 0);

    // Financial calculations
    const totalRevenue = revenueData.totalRevenue || { gross: 0, net: 0 };
    const netProfit = totalRevenue.net - totalExpenses;
    const profitMargin = totalRevenue.net > 0 ? (netProfit / totalRevenue.net) * 100 : 0;
    
    // Debug logging
    console.log('Business Metrics Debug:', {
      totalExpenses,
      recurringExpensesTotal,
      oneTimeExpenses,
      totalRevenue,
      netProfit,
      revenueDataReceived: !!revenueData.totalRevenue,
      allExpensesCount: allExpenses.length,
      upcomingExpensesCount: upcomingExpenses.length
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
    
    // Calculate the number of days in the selected period for burn rate calculation
    const periodDays = Math.ceil((currentPeriodEnd.getTime() - currentPeriodStart.getTime()) / (1000 * 60 * 60 * 24));
    const monthlyBurnRate = monthlyRecurring + (oneTimeExpenses / (periodDays / 30));
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