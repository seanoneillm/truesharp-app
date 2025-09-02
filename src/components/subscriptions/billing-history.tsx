'use client'

import React, { useState } from 'react'
import {
  Download,
  Calendar,
  CreditCard,
  Check,
  X,
  RefreshCw,
  Filter,
  ChevronDown,
  FileText,
  DollarSign,
  AlertTriangle,
  ExternalLink,
  Receipt,
} from 'lucide-react'
import { BillingHistoryProps, BillingTransaction } from '@/types/subscriptions'

export function BillingHistory({
  transactions,
  isLoading = false,
  onLoadMore,
  hasMore = false,
}: BillingHistoryProps) {
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'paid' | 'pending' | 'failed' | 'refunded'
  >('all')
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'status'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showFilters, setShowFilters] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  const filteredTransactions =
    transactions
      ?.filter(transaction => {
        if (statusFilter !== 'all' && transaction.status !== statusFilter) {
          return false
        }
        return true
      })
      ?.sort((a, b) => {
        let aValue: any, bValue: any

        switch (sortBy) {
          case 'amount':
            aValue = a.amount
            bValue = b.amount
            break
          case 'status':
            aValue = a.status
            bValue = b.status
            break
          case 'date':
          default:
            aValue = new Date(a.date)
            bValue = new Date(b.date)
            break
        }

        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1
        } else {
          return aValue < bValue ? 1 : -1
        }
      }) || []

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <Check className="h-4 w-4 text-green-500" />
      case 'pending':
        return <RefreshCw className="h-4 w-4 text-yellow-500" />
      case 'failed':
        return <X className="h-4 w-4 text-red-500" />
      case 'refunded':
        return <RefreshCw className="h-4 w-4 text-blue-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-50 text-green-800 border-green-200'
      case 'pending':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200'
      case 'failed':
        return 'bg-red-50 text-red-800 border-red-200'
      case 'refunded':
        return 'bg-blue-50 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const handleDownloadInvoice = async (transactionId: string, invoice: string) => {
    // This would integrate with the billing API to download the invoice
    console.log('Downloading invoice:', transactionId, invoice)
    // Implementation would go here
  }

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore || !onLoadMore) return

    setLoadingMore(true)
    try {
      await onLoadMore()
    } catch (error) {
      console.error('Failed to load more transactions:', error)
    } finally {
      setLoadingMore(false)
    }
  }

  const totalSpent = transactions?.reduce((sum, t) => sum + t.amount, 0) || 0
  const successfulPayments = transactions?.filter(t => t.status === 'paid').length || 0

  if (isLoading && (!transactions || transactions.length === 0)) {
    return <BillingHistoryLoading />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Billing History</h3>
          <p className="text-gray-600">
            {transactions?.length || 0} transactions • {formatCurrency(totalSpent)} total spent
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              showFilters
                ? 'border-blue-200 bg-blue-50 text-blue-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </button>

          <button
            onClick={() => handleDownloadInvoice('all', 'all_invoices.zip')}
            className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Download className="mr-2 h-4 w-4" />
            Download All
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalSpent)}</p>
            </div>
            <div className="rounded-lg bg-blue-50 p-2">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Successful Payments</p>
              <p className="text-2xl font-bold text-gray-900">{successfulPayments}</p>
            </div>
            <div className="rounded-lg bg-green-50 p-2">
              <Check className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(
                  transactions
                    ?.filter(t => {
                      const transactionDate = new Date(t.date)
                      const now = new Date()
                      return (
                        transactionDate.getMonth() === now.getMonth() &&
                        transactionDate.getFullYear() === now.getFullYear()
                      )
                    })
                    .reduce((sum, t) => sum + t.amount, 0) || 0
                )}
              </p>
            </div>
            <div className="rounded-lg bg-purple-50 p-2">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Status</label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Sort By</label>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as typeof sortBy)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              >
                <option value="date">Date</option>
                <option value="amount">Amount</option>
                <option value="status">Status</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Order</label>
              <select
                value={sortOrder}
                onChange={e => setSortOrder(e.target.value as typeof sortOrder)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <Receipt className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-gray-900">No transactions found</h3>
          <p className="text-gray-600">
            {statusFilter !== 'all'
              ? 'Try adjusting your filters to see more transactions'
              : 'Your billing history will appear here'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {/* Desktop Table */}
          <div className="hidden md:block">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Invoice
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredTransactions.map(transaction => (
                  <TransactionRow
                    key={transaction.id}
                    transaction={transaction}
                    onDownloadInvoice={handleDownloadInvoice}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="space-y-4 p-4 md:hidden">
            {filteredTransactions.map(transaction => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                onDownloadInvoice={handleDownloadInvoice}
              />
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="flex w-full items-center justify-center space-x-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingMore ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    <span>Load More</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface TransactionRowProps {
  transaction: BillingTransaction
  onDownloadInvoice: (transactionId: string, invoice: string) => void
}

function TransactionRow({ transaction, onDownloadInvoice }: TransactionRowProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <Check className="h-4 w-4 text-green-500" />
      case 'pending':
        return <RefreshCw className="h-4 w-4 text-yellow-500" />
      case 'failed':
        return <X className="h-4 w-4 text-red-500" />
      case 'refunded':
        return <RefreshCw className="h-4 w-4 text-blue-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-50 text-green-800 border-green-200'
      case 'pending':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200'
      case 'failed':
        return 'bg-red-50 text-red-800 border-red-200'
      case 'refunded':
        return 'bg-blue-50 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <tr className="hover:bg-gray-50">
      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
        {new Date(transaction.date).toLocaleDateString()}
      </td>
      <td className="px-6 py-4 text-sm text-gray-900">
        <div>
          <p className="font-medium">{transaction.description}</p>
          {transaction.strategy_name && (
            <p className="text-gray-500">
              @{transaction.seller_username} - {transaction.strategy_name}
            </p>
          )}
        </div>
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">
        {formatCurrency(transaction.amount)}
      </td>
      <td className="whitespace-nowrap px-6 py-4">
        <div
          className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium ${getStatusColor(transaction.status)}`}
        >
          {getStatusIcon(transaction.status)}
          <span className="ml-1 capitalize">{transaction.status}</span>
        </div>
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm">
        {transaction.invoice ? (
          <button
            onClick={() => onDownloadInvoice(transaction.id, transaction.invoice!)}
            className="inline-flex items-center text-blue-600 hover:text-blue-500"
          >
            <Download className="mr-1 h-4 w-4" />
            {transaction.invoice}
          </button>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>
    </tr>
  )
}

interface TransactionCardProps {
  transaction: BillingTransaction
  onDownloadInvoice: (transactionId: string, invoice: string) => void
}

function TransactionCard({ transaction, onDownloadInvoice }: TransactionCardProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <Check className="h-4 w-4 text-green-500" />
      case 'pending':
        return <RefreshCw className="h-4 w-4 text-yellow-500" />
      case 'failed':
        return <X className="h-4 w-4 text-red-500" />
      case 'refunded':
        return <RefreshCw className="h-4 w-4 text-blue-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-50 text-green-800 border-green-200'
      case 'pending':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200'
      case 'failed':
        return 'bg-red-50 text-red-800 border-red-200'
      case 'refunded':
        return 'bg-blue-50 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className="font-medium text-gray-900">{transaction.description}</p>
          {transaction.strategy_name && (
            <p className="text-sm text-gray-500">
              @{transaction.seller_username} - {transaction.strategy_name}
            </p>
          )}
        </div>
        <div
          className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium ${getStatusColor(transaction.status)}`}
        >
          {getStatusIcon(transaction.status)}
          <span className="ml-1 capitalize">{transaction.status}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <p className="text-sm text-gray-500">Amount</p>
            <p className="font-semibold text-gray-900">{formatCurrency(transaction.amount)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Date</p>
            <p className="font-medium text-gray-900">
              {new Date(transaction.date).toLocaleDateString()}
            </p>
          </div>
        </div>

        {transaction.invoice && (
          <button
            onClick={() => onDownloadInvoice(transaction.id, transaction.invoice!)}
            className="inline-flex items-center rounded-lg border border-blue-200 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 hover:text-blue-500"
          >
            <Download className="mr-1 h-4 w-4" />
            Download
          </button>
        )}
      </div>
    </div>
  )
}

function BillingHistoryLoading() {
  return (
    <div className="space-y-6">
      {/* Header Loading */}
      <div className="flex items-center justify-between">
        <div>
          <div className="mb-2 h-6 w-40 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-56 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="flex space-x-3">
          <div className="h-9 w-20 animate-pulse rounded bg-gray-200" />
          <div className="h-9 w-28 animate-pulse rounded bg-gray-200" />
        </div>
      </div>

      {/* Summary Cards Loading */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="mb-2 h-4 w-20 animate-pulse rounded bg-gray-200" />
                <div className="h-8 w-16 animate-pulse rounded bg-gray-200" />
              </div>
              <div className="h-10 w-10 animate-pulse rounded-lg bg-gray-200" />
            </div>
          </div>
        ))}
      </div>

      {/* Table Loading */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="space-y-3 p-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="flex space-x-4">
                <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
              </div>
              <div className="flex space-x-4">
                <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
