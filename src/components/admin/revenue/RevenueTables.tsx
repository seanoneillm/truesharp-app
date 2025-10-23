'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  ExternalLink,
  Calendar,
  User,
  CreditCard,
  Package
} from 'lucide-react';

interface RecentPayment {
  id: string;
  customer: string;
  product: string;
  amount: number;
  date: string;
  status: string;
  currency: string;
}

interface ActiveSubscription {
  id: string;
  customer: string;
  product: string;
  status: string;
  startDate: string;
  nextBillingDate: string;
  amount: number;
  currency: string;
}

interface ProductSummary {
  id: string;
  name: string;
  price: number;
  currency: string;
  activeUsers: number;
  totalRevenue: number;
}

interface PayoutSummary {
  id: string;
  date: string;
  amount: number;
  status: string;
  currency: string;
  arrivalDate: string;
}

interface TableData<T> {
  data: T[];
  hasMore: boolean;
  total: number;
}

type TableType = 'payments' | 'subscriptions' | 'products' | 'payouts';

export function RevenueTables() {
  const [activeTab, setActiveTab] = useState<TableType>('payments');
  const [data, setData] = useState<{
    payments: TableData<RecentPayment>;
    subscriptions: TableData<ActiveSubscription>;
    products: TableData<ProductSummary>;
    payouts: TableData<PayoutSummary>;
  } | null>(null);
  const [loading, setLoading] = useState<Record<TableType, boolean>>({
    payments: false,
    subscriptions: false,
    products: false,
    payouts: false
  });
  const [currentPage, setCurrentPage] = useState<Record<TableType, number>>({
    payments: 0,
    subscriptions: 0,
    products: 0,
    payouts: 0
  });

  const limit = 25;

  const fetchTableData = async (table: TableType, page: number = 0) => {
    setLoading(prev => ({ ...prev, [table]: true }));
    
    try {
      const offset = page * limit;
      const response = await fetch(
        `/api/admin/revenue/tables?table=${table}&limit=${limit}&offset=${offset}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${table} data`);
      }
      
      const result = await response.json();
      
      setData(prev => prev ? ({
        ...prev,
        [table]: result
      }) : {
        payments: { data: [], hasMore: false, total: 0 },
        subscriptions: { data: [], hasMore: false, total: 0 },
        products: { data: [], hasMore: false, total: 0 },
        payouts: { data: [], hasMore: false, total: 0 },
        [table]: result
      });
    } catch (err) {
      console.error(`Error fetching ${table} data:`, err);
    } finally {
      setLoading(prev => ({ ...prev, [table]: false }));
    }
  };

  useEffect(() => {
    if (activeTab) {
      fetchTableData(activeTab, currentPage[activeTab]);
    }
  }, [activeTab]);

  const handlePageChange = (table: TableType, direction: 'next' | 'prev') => {
    const newPage = direction === 'next' 
      ? currentPage[table] + 1 
      : Math.max(0, currentPage[table] - 1);
    
    setCurrentPage(prev => ({ ...prev, [table]: newPage }));
    fetchTableData(table, newPage);
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      succeeded: 'default',
      active: 'default',
      paid: 'default',
      pending: 'secondary',
      failed: 'destructive',
      canceled: 'outline',
      incomplete: 'secondary'
    };

    return (
      <Badge variant={statusColors[status] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const renderTableHeader = (table: TableType) => {
    const titles = {
      payments: 'Recent Payments',
      subscriptions: 'Active Subscriptions',
      products: 'Products',
      payouts: 'Payouts'
    };

    const descriptions = {
      payments: 'Recent payment transactions from customers',
      subscriptions: 'Currently active subscription plans',
      products: 'Product performance and revenue summary',
      payouts: 'Stripe payouts to your bank account'
    };

    return (
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            {table === 'payments' && <CreditCard className="h-5 w-5" />}
            {table === 'subscriptions' && <User className="h-5 w-5" />}
            {table === 'products' && <Package className="h-5 w-5" />}
            {table === 'payouts' && <Calendar className="h-5 w-5" />}
            {titles[table]}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {descriptions[table]}
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => fetchTableData(table, currentPage[table])}
          disabled={loading[table]}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${loading[table] ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
    );
  };

  const renderPagination = (table: TableType) => {
    const tableData = data?.[table];
    if (!tableData) return null;

    const currentPageNum = currentPage[table];
    const hasNext = tableData.hasMore;
    const hasPrev = currentPageNum > 0;

    return (
      <div className="flex items-center justify-between px-4 py-3 border-t">
        <div className="text-sm text-muted-foreground">
          Showing {currentPageNum * limit + 1} to {Math.min((currentPageNum + 1) * limit, tableData.total)} of {tableData.total} results
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(table, 'prev')}
            disabled={!hasPrev || loading[table]}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(table, 'next')}
            disabled={!hasNext || loading[table]}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  const renderPaymentsTable = () => {
    const payments = data?.payments?.data || [];
    
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Transaction ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell className="font-mono text-xs">
                {payment.id.substring(0, 20)}...
                <ExternalLink className="h-3 w-3 ml-1 inline" />
              </TableCell>
              <TableCell>{payment.customer}</TableCell>
              <TableCell>{payment.product}</TableCell>
              <TableCell className="font-medium">
                {formatCurrency(payment.amount, payment.currency)}
              </TableCell>
              <TableCell>{formatDate(payment.date)}</TableCell>
              <TableCell>{getStatusBadge(payment.status)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  const renderSubscriptionsTable = () => {
    const subscriptions = data?.subscriptions?.data || [];
    
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Subscription ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>Next Billing</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subscriptions.map((subscription) => (
            <TableRow key={subscription.id}>
              <TableCell className="font-mono text-xs">
                {subscription.id.substring(0, 20)}...
                <ExternalLink className="h-3 w-3 ml-1 inline" />
              </TableCell>
              <TableCell>{subscription.customer}</TableCell>
              <TableCell>{subscription.product}</TableCell>
              <TableCell className="font-medium">
                {formatCurrency(subscription.amount, subscription.currency)}
              </TableCell>
              <TableCell>{formatDate(subscription.startDate)}</TableCell>
              <TableCell>{formatDate(subscription.nextBillingDate)}</TableCell>
              <TableCell>{getStatusBadge(subscription.status)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  const renderProductsTable = () => {
    const products = data?.products?.data || [];
    
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product Name</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Active Users</TableHead>
            <TableHead>Total Revenue</TableHead>
            <TableHead>Revenue per User</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell>{formatCurrency(product.price, product.currency)}</TableCell>
              <TableCell>{product.activeUsers.toLocaleString()}</TableCell>
              <TableCell className="font-medium">
                {formatCurrency(product.totalRevenue, product.currency)}
              </TableCell>
              <TableCell>
                {product.activeUsers > 0 
                  ? formatCurrency(product.totalRevenue / product.activeUsers, product.currency)
                  : '$0.00'
                }
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  const renderPayoutsTable = () => {
    const payouts = data?.payouts?.data || [];
    
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Payout ID</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Arrival Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payouts.map((payout) => (
            <TableRow key={payout.id}>
              <TableCell className="font-mono text-xs">
                {payout.id.substring(0, 20)}...
                <ExternalLink className="h-3 w-3 ml-1 inline" />
              </TableCell>
              <TableCell>{formatDate(payout.date)}</TableCell>
              <TableCell className="font-medium">
                {formatCurrency(payout.amount, payout.currency)}
              </TableCell>
              <TableCell>{getStatusBadge(payout.status)}</TableCell>
              <TableCell>{formatDate(payout.arrivalDate)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <Card>
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TableType)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="mt-0">
          {renderTableHeader('payments')}
          <CardContent className="p-0">
            {loading.payments ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
                <span className="ml-2">Loading payments...</span>
              </div>
            ) : (
              <>
                {renderPaymentsTable()}
                {renderPagination('payments')}
              </>
            )}
          </CardContent>
        </TabsContent>

        <TabsContent value="subscriptions" className="mt-0">
          {renderTableHeader('subscriptions')}
          <CardContent className="p-0">
            {loading.subscriptions ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
                <span className="ml-2">Loading subscriptions...</span>
              </div>
            ) : (
              <>
                {renderSubscriptionsTable()}
                {renderPagination('subscriptions')}
              </>
            )}
          </CardContent>
        </TabsContent>

        <TabsContent value="products" className="mt-0">
          {renderTableHeader('products')}
          <CardContent className="p-0">
            {loading.products ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
                <span className="ml-2">Loading products...</span>
              </div>
            ) : (
              <>
                {renderProductsTable()}
                {renderPagination('products')}
              </>
            )}
          </CardContent>
        </TabsContent>

        <TabsContent value="payouts" className="mt-0">
          {renderTableHeader('payouts')}
          <CardContent className="p-0">
            {loading.payouts ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
                <span className="ml-2">Loading payouts...</span>
              </div>
            ) : (
              <>
                {renderPayoutsTable()}
                {renderPagination('payouts')}
              </>
            )}
          </CardContent>
        </TabsContent>
      </Tabs>
    </Card>
  );
}