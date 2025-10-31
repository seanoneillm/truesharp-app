'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  // AreaChart, 
  // Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { TrendingUp, PieChart as PieChartIcon, BarChart3, DollarSign } from 'lucide-react';

interface BusinessChartsProps {
  data: {
    expensesByCategory: {
      development: number;
      operations: number;
      marketing: number;
      general: number;
    };
    totalRevenue: { gross: number; net: number };
    totalExpenses: number;
    netProfit: number;
    monthlyRecurring: number;
    yearlyRecurring: number;
    oneTimeExpenses: number;
  };
  timeSeriesData?: Array<{
    date: string;
    revenue: number;
    expenses: number;
    profit: number;
  }>;
}

export function BusinessCharts({ data, timeSeriesData }: BusinessChartsProps) {
  // Prepare category data for pie chart
  const categoryData = Object.entries(data.expensesByCategory).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    percentage: data.totalExpenses > 0 ? (value / data.totalExpenses * 100).toFixed(1) : '0'
  })).filter(item => item.value > 0);

  // Colors for charts
  const categoryColors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'];
  
  // Prepare financial overview data
  const financialOverviewData = [
    { name: 'Revenue', value: data.totalRevenue.net, color: '#10b981' },
    { name: 'Expenses', value: data.totalExpenses, color: '#ef4444' },
    { name: 'Profit', value: data.netProfit, color: data.netProfit >= 0 ? '#10b981' : '#ef4444' }
  ];

  // Prepare expense type breakdown
  const expenseTypeData = [
    { name: 'Monthly Recurring', value: data.monthlyRecurring, color: '#3b82f6' },
    { name: 'Yearly Recurring', value: data.yearlyRecurring / 12, color: '#8b5cf6' }, // Convert to monthly
    { name: 'One-time', value: data.oneTimeExpenses, color: '#f59e0b' }
  ].filter(item => item.value > 0);

  // Generate sample time series data if not provided
  const defaultTimeSeriesData = timeSeriesData || [
    { date: '30d ago', revenue: data.totalRevenue.net * 0.7, expenses: data.totalExpenses * 0.6, profit: data.netProfit * 0.8 },
    { date: '25d ago', revenue: data.totalRevenue.net * 0.8, expenses: data.totalExpenses * 0.7, profit: data.netProfit * 0.85 },
    { date: '20d ago', revenue: data.totalRevenue.net * 0.85, expenses: data.totalExpenses * 0.8, profit: data.netProfit * 0.9 },
    { date: '15d ago', revenue: data.totalRevenue.net * 0.9, expenses: data.totalExpenses * 0.85, profit: data.netProfit * 0.95 },
    { date: '10d ago', revenue: data.totalRevenue.net * 0.95, expenses: data.totalExpenses * 0.9, profit: data.netProfit * 0.98 },
    { date: '5d ago', revenue: data.totalRevenue.net * 0.98, expenses: data.totalExpenses * 0.95, profit: data.netProfit * 0.99 },
    { date: 'Today', revenue: data.totalRevenue.net, expenses: data.totalExpenses, profit: data.netProfit }
  ];

  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (Math.abs(value) >= 1000) {
      return `$${(value / 1000).toFixed(0)}k`;
    }
    return `$${value.toFixed(0)}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Revenue vs Expenses Trend */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Revenue vs Expenses Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={defaultTimeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={formatCurrency} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#10b981" 
                strokeWidth={3}
                name="Revenue"
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="expenses" 
                stroke="#ef4444" 
                strokeWidth={3}
                name="Expenses"
                dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="profit" 
                stroke="#3b82f6" 
                strokeWidth={3}
                name="Profit"
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Financial Overview Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-green-600" />
            Financial Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={financialOverviewData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={formatCurrency} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={80} />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), '']}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {financialOverviewData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Expense Categories Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5 text-purple-600" />
            Expenses by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name} (${percentage}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((_entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={categoryColors[index % categoryColors.length]} 
                  />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Amount']}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Expense Type Breakdown */}
      {expenseTypeData.length > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-orange-600" />
              Expense Type Breakdown (Monthly View)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={expenseTypeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={formatCurrency} />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Amount']}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {expenseTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 text-xs text-muted-foreground">
              * Yearly recurring expenses are converted to monthly values for comparison
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}