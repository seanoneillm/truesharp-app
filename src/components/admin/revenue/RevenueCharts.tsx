'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { RefreshCw } from 'lucide-react';

interface ChartData {
  revenueOverTime: Array<{
    date: string;
    grossRevenue: number;
    netRevenue: number;
    subscriptions: number;
    refunds: number;
  }>;
  productRevenue: Array<{
    productName: string;
    revenue: number;
    subscriptions: number;
  }>;
  subscriptionGrowth: Array<{
    date: string;
    activeSubscriptions: number;
  }>;
  refundsAndFees: Array<{
    date: string;
    refunds: number;
    fees: number;
  }>;
}

interface Filters {
  dateRange: string;
  viewType: 'gross' | 'net';
  interval: 'daily' | 'weekly' | 'monthly';
}

interface RevenueChartsProps {
  filters: Filters;
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export function RevenueCharts({ filters }: RevenueChartsProps) {
  const [data, setData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChartData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `/api/admin/revenue/charts?days=${filters.dateRange}&interval=${filters.interval}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch chart data');
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChartData();
  }, [filters]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (filters.interval === 'weekly') {
      return dateString; // Keep week format
    } else if (filters.interval === 'monthly') {
      const [year, month] = dateString.split('-');
      return new Date(parseInt(year!), parseInt(month!) - 1).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });
    } else {
      return new Date(dateString).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="text-red-600 text-center">
            <div className="text-sm font-medium">Error loading charts: {error}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Revenue Over Time */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Revenue Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={data.revenueOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                tick={{ fontSize: 12 }}
              />
              <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value: number, name: string) => [formatCurrency(value), name]}
                labelFormatter={(label: string) => formatDate(label)}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey={filters.viewType === 'gross' ? 'grossRevenue' : 'netRevenue'} 
                stackId="1" 
                stroke="#3b82f6" 
                fill="#3b82f6" 
                fillOpacity={0.6}
                name={`${filters.viewType === 'gross' ? 'Gross' : 'Net'} Revenue`}
              />
              <Area 
                type="monotone" 
                dataKey="refunds" 
                stackId="2" 
                stroke="#ef4444" 
                fill="#ef4444" 
                fillOpacity={0.6}
                name="Refunds"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Product Revenue Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Product Revenue Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.productRevenue.slice(0, 8)} // Top 8 products
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="revenue"
              >
                {data.productRevenue.slice(0, 8).map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Subscription Growth */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Growth</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.subscriptionGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                labelFormatter={(label: string) => formatDate(label)}
                formatter={(value: number) => [value.toLocaleString(), 'Active Subscriptions']}
              />
              <Line 
                type="monotone" 
                dataKey="activeSubscriptions" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Product Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Products by Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.productRevenue.slice(0, 5).map((product, index) => (
              <div key={product.productName} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <div>
                    <div className="font-medium text-sm">{product.productName}</div>
                    <div className="text-xs text-gray-500">
                      {product.subscriptions} subscription{product.subscriptions !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm">{formatCurrency(product.revenue)}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Refunds and Fees Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Refunds & Fees Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.refundsAndFees}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                tick={{ fontSize: 12 }}
              />
              <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value: number, name: string) => [formatCurrency(value), name]}
                labelFormatter={(label: string) => formatDate(label)}
              />
              <Legend />
              <Bar dataKey="refunds" fill="#ef4444" name="Refunds" />
              <Bar dataKey="fees" fill="#f59e0b" name="Fees" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}