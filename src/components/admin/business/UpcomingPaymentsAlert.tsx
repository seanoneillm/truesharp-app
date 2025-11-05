'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, DollarSign } from 'lucide-react';

interface UpcomingExpense {
  id: string;
  description: string;
  amount: number;
  next_due_date: string;
  category: string;
}

interface UpcomingPaymentsAlertProps {
  upcomingExpenses: UpcomingExpense[];
}

export function UpcomingPaymentsAlert({ upcomingExpenses }: UpcomingPaymentsAlertProps) {
  if (!upcomingExpenses || upcomingExpenses.length === 0) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDaysUntilDue = (dueDateStr: string) => {
    const dueDate = new Date(dueDateStr);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays > 0) return `${diffDays} days`;
    return `${Math.abs(diffDays)} days overdue`;
  };

  const getStatusColor = (dueDateStr: string) => {
    const dueDate = new Date(dueDateStr);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return 'text-red-700';
    if (diffDays <= 3) return 'text-orange-700';
    if (diffDays <= 7) return 'text-amber-700';
    return 'text-slate-700';
  };

  const totalUpcomingAmount = upcomingExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2 text-slate-800">
          <Calendar className="h-5 w-5 text-blue-600" />
          Upcoming Payments
          <span className="ml-auto text-sm font-medium bg-slate-100 text-slate-700 px-2 py-1 rounded">
            {upcomingExpenses.length} payment{upcomingExpenses.length !== 1 ? 's' : ''}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Summary */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-slate-600" />
              <span className="font-medium text-slate-700">Total Due (Next 30 Days)</span>
            </div>
            <span className="font-semibold text-lg text-slate-900">
              {formatCurrency(totalUpcomingAmount)}
            </span>
          </div>

          {/* Individual Payments */}
          <div className="space-y-2">
            {upcomingExpenses.slice(0, 6).map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-slate-900 truncate">
                      {expense.description}
                    </span>
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-slate-100 text-slate-600 capitalize flex-shrink-0">
                      {expense.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <span>Due: {new Date(expense.next_due_date).toLocaleDateString()}</span>
                    <span>•</span>
                    <span className={getStatusColor(expense.next_due_date)}>
                      {formatDaysUntilDue(expense.next_due_date)}
                    </span>
                  </div>
                </div>
                <div className="text-right ml-3">
                  <div className="font-semibold text-slate-900">
                    {formatCurrency(expense.amount)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Show more indicator */}
          {upcomingExpenses.length > 6 && (
            <div className="text-center text-sm text-slate-500 pt-2 border-t border-slate-200">
              + {upcomingExpenses.length - 6} more payment{upcomingExpenses.length - 6 !== 1 ? 's' : ''} due in the next 30 days
            </div>
          )}

          {/* Quick actions note */}
          <div className="text-xs text-slate-500 text-center pt-2 border-t border-slate-200">
            Manage payments in the Expenses tab
          </div>
        </div>
      </CardContent>
    </Card>
  );
}