'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Calendar } from '@/components/ui/calendar';
// import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
// import { useAuth } from '@/lib/hooks/use-auth';

export interface ExpenseFormData {
  id?: string;
  description: string;
  amount: string;
  expense_date: Date;
  category: 'development' | 'operations' | 'marketing' | 'general';
  subcategory: string;
  is_recurring: boolean;
  recurring_interval?: 'monthly' | 'quarterly' | 'yearly';
  next_due_date?: Date;
  recurring_end_date?: Date;
  vendor: string;
  receipt_url: string;
  tax_deductible: boolean;
  notes: string;
}

interface ExpenseFormProps {
  initialData?: Partial<ExpenseFormData>;
  onSubmit: (data: ExpenseFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ExpenseForm({ initialData, onSubmit, onCancel, isLoading }: ExpenseFormProps) {
  // const { user } = useAuth();
  const [formData, setFormData] = useState<ExpenseFormData>({
    description: '',
    amount: '',
    expense_date: new Date(),
    category: 'general',
    subcategory: '',
    is_recurring: false,
    vendor: '',
    receipt_url: '',
    tax_deductible: true,
    notes: '',
    ...initialData,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expenseDateText, setExpenseDateText] = useState('');
  const [endDateText, setEndDateText] = useState('');

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.expense_date) {
      newErrors.expense_date = 'Expense date is required';
    }

    if (formData.is_recurring && !formData.recurring_interval) {
      newErrors.recurring_interval = 'Recurring interval is required for recurring expenses';
    }

    // Next due date is now calculated automatically, so no validation needed

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateNextDueDate = (expenseDate: Date, interval: string): Date => {
    const nextDate = new Date(expenseDate);
    if (interval === 'monthly') {
      nextDate.setMonth(nextDate.getMonth() + 1);
    } else if (interval === 'quarterly') {
      nextDate.setMonth(nextDate.getMonth() + 3);
    } else if (interval === 'yearly') {
      nextDate.setFullYear(nextDate.getFullYear() + 1);
    }
    return nextDate;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // Calculate next due date if recurring
      const submissionData = { ...formData };
      if (formData.is_recurring && formData.recurring_interval && formData.expense_date) {
        submissionData.next_due_date = calculateNextDueDate(formData.expense_date, formData.recurring_interval);
      }
      
      await onSubmit(submissionData);
    } catch (error) {
      console.error('Error submitting expense:', error);
    }
  };

  const updateField = (field: keyof ExpenseFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          {initialData?.id ? 'Edit Expense' : 'Add New Expense'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="e.g., Server hosting costs, Marketing ad spend"
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          {/* Amount and Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => updateField('amount', e.target.value)}
                placeholder="0.00"
                className={errors.amount ? 'border-red-500' : ''}
              />
              {errors.amount && (
                <p className="text-sm text-red-500">{errors.amount}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Expense Date *</Label>
              <Input
                type="text"
                placeholder="MM/DD/YYYY"
                value={expenseDateText}
                onChange={(e) => {
                  const value = e.target.value;
                  setExpenseDateText(value);
                  
                  // Try to parse the date when user types
                  if (value.length >= 8) {
                    const date = new Date(value);
                    if (!isNaN(date.getTime())) {
                      updateField('expense_date', date);
                    }
                  }
                }}
                className={cn(
                  'w-full',
                  errors.expense_date && 'border-red-500'
                )}
              />
              <p className="text-xs text-gray-500">Format: MM/DD/YYYY (e.g., 12/25/2024)</p>
              {errors.expense_date && (
                <p className="text-sm text-red-500">{errors.expense_date}</p>
              )}
            </div>
          </div>

          {/* Category and Subcategory */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => updateField('category', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="operations">Operations</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subcategory">Subcategory</Label>
              <Input
                id="subcategory"
                value={formData.subcategory}
                onChange={(e) => updateField('subcategory', e.target.value)}
                placeholder="e.g., Cloud hosting, Google Ads"
              />
            </div>
          </div>

          {/* Vendor */}
          <div className="space-y-2">
            <Label htmlFor="vendor">Vendor/Company</Label>
            <Input
              id="vendor"
              value={formData.vendor}
              onChange={(e) => updateField('vendor', e.target.value)}
              placeholder="e.g., AWS, Google, Stripe"
            />
          </div>

          {/* Recurring Expense Toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="is_recurring"
              checked={formData.is_recurring}
              onCheckedChange={(checked) => updateField('is_recurring', checked)}
            />
            <Label htmlFor="is_recurring">This is a recurring expense</Label>
          </div>

          {/* Recurring Options */}
          {formData.is_recurring && (
            <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Recurring Interval *</Label>
                  <Select
                    value={formData.recurring_interval || ''}
                    onValueChange={(value) => updateField('recurring_interval', value)}
                  >
                    <SelectTrigger className={errors.recurring_interval ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select interval" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.recurring_interval && (
                    <p className="text-sm text-red-500">{errors.recurring_interval}</p>
                  )}
                </div>

                {/* Show calculated next due date */}
                {formData.recurring_interval && formData.expense_date && (
                  <div className="space-y-2">
                    <Label>Next Due Date (Calculated)</Label>
                    <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <CalendarIcon className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">
                        {(() => {
                          const nextDate = new Date(formData.expense_date);
                          if (formData.recurring_interval === 'monthly') {
                            nextDate.setMonth(nextDate.getMonth() + 1);
                          } else if (formData.recurring_interval === 'quarterly') {
                            nextDate.setMonth(nextDate.getMonth() + 3);
                          } else if (formData.recurring_interval === 'yearly') {
                            nextDate.setFullYear(nextDate.getFullYear() + 1);
                          }
                          return format(nextDate, 'PPP');
                        })()}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Recurring End Date (Optional)</Label>
                <Input
                  type="text"
                  placeholder="MM/DD/YYYY"
                  value={endDateText}
                  onChange={(e) => {
                    const value = e.target.value;
                    setEndDateText(value);
                    
                    if (value === '') {
                      updateField('recurring_end_date', undefined);
                    } else if (value.length >= 8) {
                      // Try to parse the date
                      const date = new Date(value);
                      if (!isNaN(date.getTime())) {
                        updateField('recurring_end_date', date);
                      }
                    }
                  }}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">Format: MM/DD/YYYY (leave empty for no end date)</p>
              </div>
            </div>
          )}

          {/* Receipt URL */}
          <div className="space-y-2">
            <Label htmlFor="receipt_url">Receipt/Invoice URL</Label>
            <Input
              id="receipt_url"
              type="url"
              value={formData.receipt_url}
              onChange={(e) => updateField('receipt_url', e.target.value)}
              placeholder="https://..."
            />
          </div>

          {/* Tax Deductible */}
          <div className="flex items-center space-x-2">
            <Switch
              id="tax_deductible"
              checked={formData.tax_deductible}
              onCheckedChange={(checked) => updateField('tax_deductible', checked)}
            />
            <Label htmlFor="tax_deductible">Tax deductible</Label>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Additional notes about this expense..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isLoading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
              {isLoading ? 'Saving...' : (initialData?.id ? 'Update Expense' : 'Add Expense')}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}