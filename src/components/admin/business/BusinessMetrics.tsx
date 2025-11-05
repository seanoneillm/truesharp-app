'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  Users, 
  Calendar,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { UpcomingPaymentsAlert } from './UpcomingPaymentsAlert';

interface BusinessMetricsProps {
  data: {
    totalRevenue: { gross: number; net: number };
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
    mrr: number;
    expensesByCategory: {
      development: number;
      operations: number;
      marketing: number;
      general: number;
    };
    monthlyRecurring: number;
    yearlyRecurring: number;
    oneTimeExpenses: number;
    customerAcquisitionCost: number;
    lifetimeValueToCAC: number;
    monthlyBurnRate: number;
    runway: number;
    revenueGrowthRate: number;
    expenseGrowthRate: number;
    profitGrowthRate: number;
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
  };
  isLoading?: boolean;
}

export function BusinessMetrics({ data, isLoading }: BusinessMetricsProps) {
  const formatCurrency = (amount: number, compact = false) => {
    if (compact && Math.abs(amount) >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (compact && Math.abs(amount) >= 1000) {
      return `$${(amount / 1000).toFixed(0)}k`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) return <ArrowUpRight className="h-4 w-4 text-green-600" />;
    if (value < 0) return <ArrowDownRight className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getTrendColor = (value: number, inverse = false) => {
    const isPositive = inverse ? value < 0 : value > 0;
    if (isPositive) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-400';
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(12)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="animate-pulse">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
                  <div className="h-4 w-24 bg-gray-200 rounded"></div>
                </div>
                <div className="h-6 w-16 bg-gray-200 rounded"></div>
                <div className="h-3 w-20 bg-gray-200 rounded"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Financial Overview */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Financial Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data.totalRevenue.net)}</div>
              <p className="text-xs text-muted-foreground">
                Net (Gross: {formatCurrency(data.totalRevenue.gross, true)})
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data.totalExpenses)}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {getTrendIcon(data.expenseGrowthRate)}
                <span className={`ml-1 ${getTrendColor(data.expenseGrowthRate, true)}`}>
                  {formatPercentage(data.expenseGrowthRate)} vs last period
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
              <Target className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${data.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(data.netProfit)}
              </div>
              <p className="text-xs text-muted-foreground">
                Margin: {data.profitMargin.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(data.mrr)}</div>
              <p className="text-xs text-muted-foreground">
                From active subscriptions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Burn Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data.monthlyBurnRate)}</div>
              <p className="text-xs text-muted-foreground">
                Runway: {data.runway > 0 ? `${data.runway.toFixed(1)} months` : 'N/A'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Expense Breakdown */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Expense Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(data.expensesByCategory).map(([category, amount]) => {
            const percentage = data.totalExpenses > 0 ? (amount / data.totalExpenses) * 100 : 0;
            const icons = {
              development: '💻',
              operations: '⚙️',
              marketing: '📢',
              general: '📋'
            };
            
            return (
              <Card key={category}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium capitalize">
                    {icons[category as keyof typeof icons]} {category}
                  </CardTitle>
                  <PieChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(amount)}</div>
                  <p className="text-xs text-muted-foreground">
                    {percentage.toFixed(1)}% of total expenses
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Business Ratios */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Business Ratios & KPIs</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Customer Acquisition Cost</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data.customerAcquisitionCost)}</div>
              <p className="text-xs text-muted-foreground">
                CAC (Marketing / New Customers)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">LTV:CAC Ratio</CardTitle>
              <Target className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.lifetimeValueToCAC > 0 ? data.lifetimeValueToCAC.toFixed(1) : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                Target: 3.0+ (Good: 3-5)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Revenue per Customer</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data.avgRevenuePerCustomer)}</div>
              <p className="text-xs text-muted-foreground">
                Total customers: {data.totalCustomers.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.activeSubscriptions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Monthly recurring revenue base
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recurring vs One-time */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Expense Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Recurring</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data.monthlyRecurring)}</div>
              <p className="text-xs text-muted-foreground">
                Fixed monthly expenses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Yearly Recurring</CardTitle>
              <Calendar className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data.yearlyRecurring)}</div>
              <p className="text-xs text-muted-foreground">
                Annual subscriptions/contracts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">One-time Expenses</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data.oneTimeExpenses)}</div>
              <p className="text-xs text-muted-foreground">
                Non-recurring expenses
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Upcoming Payments Alert */}
      {data.upcomingExpenses.length > 0 && (
        <div>
          <UpcomingPaymentsAlert upcomingExpenses={data.upcomingExpenses} />
        </div>
      )}
    </div>
  );
}