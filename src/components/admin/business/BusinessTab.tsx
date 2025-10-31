'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  RefreshCw, 
  CalendarIcon, 
  Building2,
  // Download,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';
import { BusinessMetrics } from './BusinessMetrics';
import { ExpenseForm, ExpenseFormData } from './ExpenseForm';
import { ExpensesList, ExpenseFilters } from './ExpensesList';
import { BusinessCharts } from './BusinessCharts';

interface BusinessData {
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
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  expense_date: string;
  category: string;
  subcategory?: string;
  is_recurring: boolean;
  recurring_interval?: string;
  next_due_date?: string;
  vendor?: string;
  tax_deductible: boolean;
  notes?: string;
  entered_by_name: string;
  created_at: string;
}

interface ExpensesResponse {
  expenses: Expense[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

export function BusinessTab() {
  const { user } = useAuth();
  const [businessData, setBusinessData] = useState<BusinessData | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    totalCount: 0,
    totalPages: 0,
  });
  
  const [loading, setLoading] = useState(true);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Filters and date range
  const [dateRange, setDateRange] = useState('30');
  const [filters, setFilters] = useState<ExpenseFilters>({
    category: 'all',
    isRecurring: 'all',
    startDate: '',
    endDate: '',
    search: '',
  });

  // Fetch business metrics
  const fetchBusinessData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/admin/business/metrics?days=${dateRange}`);
      if (!response.ok) {
        throw new Error('Failed to fetch business data');
      }
      
      const data = await response.json();
      setBusinessData(data);
    } catch (err) {
      console.error('Error fetching business data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  // Fetch expenses
  const fetchExpenses = useCallback(async (page = 1) => {
    try {
      setExpensesLoading(true);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '' && value !== 'all')
        ),
      });
      
      const response = await fetch(`/api/admin/business/expenses?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch expenses');
      }
      
      const data: ExpensesResponse = await response.json();
      setExpenses(data.expenses);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Error fetching expenses:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch expenses');
    } finally {
      setExpensesLoading(false);
    }
  }, [filters, pagination.limit]);

  // Create or update expense
  const handleExpenseSubmit = async (formData: ExpenseFormData) => {
    if (!user) return;

    try {
      const expenseData = {
        ...formData,
        amount: parseFloat(formData.amount),
        expense_date: formData.expense_date.toISOString().split('T')[0],
        next_due_date: formData.next_due_date?.toISOString().split('T')[0],
        recurring_end_date: formData.recurring_end_date?.toISOString().split('T')[0],
        entered_by_user_id: user.id,
        entered_by_name: (user as any).user_metadata?.full_name || user.email || 'Unknown',
        created_by: user.id,
        updated_by: user.id,
      };

      const url = editingExpense 
        ? '/api/admin/business/expenses'
        : '/api/admin/business/expenses';
      
      const method = editingExpense ? 'PUT' : 'POST';
      
      const body = editingExpense 
        ? { ...expenseData, id: editingExpense.id }
        : expenseData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${editingExpense ? 'update' : 'create'} expense`);
      }

      // Refresh data
      await Promise.all([
        fetchBusinessData(),
        fetchExpenses(pagination.page)
      ]);
      
      // Close form
      setShowExpenseForm(false);
      setEditingExpense(null);
    } catch (err) {
      console.error('Error saving expense:', err);
      throw err; // Re-throw to be handled by the form
    }
  };

  // Delete expense
  const handleExpenseDelete = async (expenseId: string) => {
    if (!user || !confirm('Are you sure you want to archive this expense?')) return;

    try {
      const response = await fetch(
        `/api/admin/business/expenses?id=${expenseId}&updated_by=${user.id}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Failed to archive expense');
      }

      // Refresh data
      await Promise.all([
        fetchBusinessData(),
        fetchExpenses(pagination.page)
      ]);
    } catch (err) {
      console.error('Error archiving expense:', err);
      setError(err instanceof Error ? err.message : 'Failed to archive expense');
    }
  };

  // Handle edit expense
  const handleExpenseEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setShowExpenseForm(true);
  };

  // Handle filters change
  const handleFiltersChange = (newFilters: ExpenseFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  // Handle date range change
  const handleDateRangeChange = (value: string) => {
    setDateRange(value);
  };

  // Load data on mount and when dependencies change
  useEffect(() => {
    fetchBusinessData();
  }, [fetchBusinessData]);

  useEffect(() => {
    fetchExpenses(pagination.page);
  }, [fetchExpenses, pagination.page]);

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center text-red-600">
          <AlertCircle className="mr-2 h-5 w-5" />
          <div>
            <div className="font-medium">Error loading business data</div>
            <div className="text-sm">{error}</div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setError(null);
              fetchBusinessData();
              fetchExpenses(1);
            }}
            className="ml-4"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6 text-blue-600" />
            Business Management
          </h2>
          <p className="text-muted-foreground">
            Track expenses, analyze profitability, and monitor key business metrics
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Select value={dateRange} onValueChange={handleDateRangeChange}>
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

          <Button 
            variant="outline" 
            onClick={() => {
              fetchBusinessData();
              fetchExpenses(pagination.page);
            }}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button 
            onClick={() => setShowExpenseForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Expense Form Modal */}
      {showExpenseForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="max-h-[90vh] overflow-y-auto">
            <ExpenseForm
              initialData={editingExpense ? ({
                id: editingExpense.id,
                description: editingExpense.description,
                amount: editingExpense.amount.toString(),
                expense_date: new Date(editingExpense.expense_date),
                category: editingExpense.category as any,
                subcategory: editingExpense.subcategory || '',
                is_recurring: editingExpense.is_recurring,
                recurring_interval: editingExpense.recurring_interval as any,
                next_due_date: editingExpense.next_due_date ? new Date(editingExpense.next_due_date) : undefined,
                vendor: editingExpense.vendor || '',
                receipt_url: '',
                tax_deductible: editingExpense.tax_deductible,
                notes: editingExpense.notes || '',
              } as Partial<ExpenseFormData>) : {}}
              onSubmit={handleExpenseSubmit}
              onCancel={() => {
                setShowExpenseForm(false);
                setEditingExpense(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {businessData ? (
            <BusinessMetrics data={businessData} isLoading={loading} />
          ) : (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
              <p>Loading business metrics...</p>
            </div>
          )}
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-6">
          <ExpensesList
            expenses={expenses}
            pagination={pagination}
            onEdit={handleExpenseEdit}
            onDelete={handleExpenseDelete}
            onPageChange={handlePageChange}
            onFiltersChange={handleFiltersChange}
            isLoading={expensesLoading}
          />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          {businessData ? (
            <BusinessCharts data={businessData} />
          ) : (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
              <p>Loading analytics...</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}