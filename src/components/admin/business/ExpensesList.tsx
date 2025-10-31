'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Calendar,
  DollarSign,
  Building,
  Tag,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

interface ExpensesListProps {
  expenses: Expense[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
  onEdit: (expense: Expense) => void;
  onDelete: (expenseId: string) => void;
  onPageChange: (page: number) => void;
  onFiltersChange: (filters: ExpenseFilters) => void;
  isLoading?: boolean;
}

export interface ExpenseFilters {
  category: string;
  isRecurring: string;
  startDate: string;
  endDate: string;
  search: string;
}

export function ExpensesList({ 
  expenses, 
  pagination, 
  onEdit, 
  onDelete, 
  onPageChange, 
  onFiltersChange,
  isLoading 
}: ExpensesListProps) {
  const [filters, setFilters] = useState<ExpenseFilters>({
    category: 'all',
    isRecurring: 'all',
    startDate: '',
    endDate: '',
    search: '',
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      development: 'bg-blue-100 text-blue-800',
      operations: 'bg-green-100 text-green-800',
      marketing: 'bg-purple-100 text-purple-800',
      general: 'bg-gray-100 text-gray-800',
    };
    return colors[category as keyof typeof colors] || colors.general;
  };

  const updateFilter = (key: keyof ExpenseFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      category: 'all',
      isRecurring: 'all',
      startDate: '',
      endDate: '',
      search: '',
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const generatePageNumbers = () => {
    const pages = [];
    const { page, totalPages } = pagination;
    
    // Always show first page
    if (totalPages > 0) pages.push(1);
    
    // Add ellipsis if needed
    if (page > 3) pages.push('...');
    
    // Add pages around current page
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      if (!pages.includes(i)) pages.push(i);
    }
    
    // Add ellipsis if needed
    if (page < totalPages - 2) pages.push('...');
    
    // Always show last page if more than 1 page
    if (totalPages > 1 && !pages.includes(totalPages)) pages.push(totalPages);
    
    return pages;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Expense Management
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {pagination.totalCount} total expenses
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search expenses..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <Select value={filters.category} onValueChange={(value) => updateFilter('category', value)}>
              <SelectTrigger className="w-[180px]">
                <Tag className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="development">Development</SelectItem>
                <SelectItem value="operations">Operations</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>

            {/* Recurring Filter */}
            <Select value={filters.isRecurring} onValueChange={(value) => updateFilter('isRecurring', value)}>
              <SelectTrigger className="w-[160px]">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="true">Recurring</SelectItem>
                <SelectItem value="false">One-time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="date"
                placeholder="Start date"
                value={filters.startDate}
                onChange={(e) => updateFilter('startDate', e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Input
                type="date"
                placeholder="End date"
                value={filters.endDate}
                onChange={(e) => updateFilter('endDate', e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={clearFilters}>
              <Filter className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Added By</TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Loading skeleton
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(8)].map((_, j) => (
                      <TableCell key={j}>
                        <div className="animate-pulse h-4 bg-gray-200 rounded"></div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <DollarSign className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">No expenses found</p>
                      <p className="text-sm text-muted-foreground">
                        Try adjusting your filters or add a new expense
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                expenses.map((expense) => (
                  <TableRow key={expense.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div>
                        <div className="font-medium">{expense.description}</div>
                        {expense.subcategory && (
                          <div className="text-sm text-muted-foreground">{expense.subcategory}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(expense.amount)}
                    </TableCell>
                    <TableCell>{formatDate(expense.expense_date)}</TableCell>
                    <TableCell>
                      <Badge className={getCategoryColor(expense.category)}>
                        {expense.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {expense.is_recurring ? (
                          <Badge variant="secondary">
                            <Calendar className="mr-1 h-3 w-3" />
                            {expense.recurring_interval}
                          </Badge>
                        ) : (
                          <Badge variant="outline">One-time</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {expense.vendor && (
                          <>
                            <Building className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{expense.vendor}</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {expense.entered_by_name}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(expense)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => onDelete(expense.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Archive
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{' '}
              {pagination.totalCount} expenses
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {generatePageNumbers().map((pageNum, index) => (
                  <React.Fragment key={index}>
                    {pageNum === '...' ? (
                      <span className="px-2 py-1 text-sm text-muted-foreground">...</span>
                    ) : (
                      <Button
                        variant={pageNum === pagination.page ? "default" : "outline"}
                        size="sm"
                        onClick={() => onPageChange(pageNum as number)}
                        className="w-8 h-8"
                      >
                        {pageNum}
                      </Button>
                    )}
                  </React.Fragment>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}