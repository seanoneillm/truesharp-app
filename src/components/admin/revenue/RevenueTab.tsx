'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, RefreshCw, TrendingUp, TrendingDown, DollarSign, Users, CreditCard } from 'lucide-react';
import { RevenueCharts } from './RevenueCharts';
import { RevenueTables } from './RevenueTables';

interface RevenueData {
  totalRevenue: { gross: number; net: number };
  mrr: number;
  activeSubscriptions: number;
  refundRate: number;
  totalCustomers: number;
  totalPayouts: number;
}

interface Filters {
  dateRange: string;
  viewType: 'gross' | 'net';
  interval: 'daily' | 'weekly' | 'monthly';
}

export function RevenueTab() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    dateRange: '30',
    viewType: 'gross',
    interval: 'daily'
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/admin/revenue/metrics?days=${filters.dateRange}`);
      if (!response.ok) {
        throw new Error('Failed to fetch revenue data');
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
    fetchData();
  }, [filters.dateRange]);

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2 text-lg">Loading revenue data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center text-red-600">
              <div className="text-sm font-medium">Error: {error}</div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchData}
                className="ml-4"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Revenue Analytics</h2>
          <p className="text-muted-foreground">
            Live data from Stripe - Track revenue, subscriptions, and business metrics
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Select 
            value={filters.dateRange} 
            onValueChange={(value) => handleFilterChange('dateRange', value)}
          >
            <SelectTrigger className="w-40">
              <CalendarIcon className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>

          <Select 
            value={filters.viewType} 
            onValueChange={(value) => handleFilterChange('viewType', value as 'gross' | 'net')}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gross">Gross</SelectItem>
              <SelectItem value="net">Net</SelectItem>
            </SelectContent>
          </Select>

          <Select 
            value={filters.interval} 
            onValueChange={(value) => handleFilterChange('interval', value as any)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(filters.viewType === 'gross' ? data.totalRevenue.gross : data.totalRevenue.net)}
              </div>
              <p className="text-xs text-muted-foreground">
                {filters.viewType === 'gross' ? 'Gross' : 'Net'} revenue
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data.mrr)}</div>
              <p className="text-xs text-muted-foreground">
                MRR from active subscriptions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.activeSubscriptions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Currently active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Refund Rate</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPercentage(data.refundRate)}</div>
              <p className="text-xs text-muted-foreground">
                Of total revenue
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalCustomers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                All time customers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data.totalPayouts)}</div>
              <p className="text-xs text-muted-foreground">
                Last {filters.dateRange} days
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Section */}
      <RevenueCharts filters={filters} />

      {/* Tables Section */}
      <RevenueTables />
    </div>
  );
}