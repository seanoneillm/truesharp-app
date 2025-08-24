"use client"

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
  Receipt
} from 'lucide-react'
import { BillingHistoryProps, BillingTransaction } from '@/types/subscriptions'

export function BillingHistory({ 
  transactions, 
  isLoading = false, 
  onLoadMore,
  hasMore = false 
}: BillingHistoryProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'failed' | 'refunded'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'status'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showFilters, setShowFilters] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  const filteredTransactions = transactions
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
      minimumFractionDigits: 2
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
            className={`inline-flex items-center px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
              showFilters 
                ? 'bg-blue-50 border-blue-200 text-blue-700' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>
          
          <button
            onClick={() => handleDownloadInvoice('all', 'all_invoices.zip')}
            className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Download All
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalSpent)}</p>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Successful Payments</p>
              <p className="text-2xl font-bold text-gray-900">{successfulPayments}</p>
            </div>
            <div className="p-2 bg-green-50 rounded-lg">
              <Check className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(
                  transactions?.filter(t => {
                    const transactionDate = new Date(t.date)
                    const now = new Date()
                    return transactionDate.getMonth() === now.getMonth() && 
                           transactionDate.getFullYear() === now.getFullYear()
                  }).reduce((sum, t) => sum + t.amount, 0) || 0
                )}
              </p>
            </div>
            <div className="p-2 bg-purple-50 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="date">Date</option>
                <option value="amount">Amount</option>
                <option value="status">Status</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Receipt className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
          <p className="text-gray-600">
            {statusFilter !== 'all' 
              ? 'Try adjusting your filters to see more transactions'
              : 'Your billing history will appear here'
            }
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
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
          <div className="md:hidden space-y-4 p-4">
            {filteredTransactions.map((transaction) => (
              <TransactionCard 
                key={transaction.id} 
                transaction={transaction}
                onDownloadInvoice={handleDownloadInvoice}
              />
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="w-full flex items-center justify-center space-x-2 py-2 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
      minimumFractionDigits: 2
    }).format(amount)
  }

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {new Date(transaction.date).toLocaleDateString()}
      </td>
      <td className="px-6 py-4 text-sm text-gray-900">
        <div>
          <p className="font-medium">{transaction.description}</p>
          {transaction.strategy_name && (
            <p className="text-gray-500">@{transaction.seller_username} - {transaction.strategy_name}</p>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
        {formatCurrency(transaction.amount)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(transaction.status)}`}>
          {getStatusIcon(transaction.status)}
          <span className="ml-1 capitalize">{transaction.status}</span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        {transaction.invoice ? (
          <button
            onClick={() => onDownloadInvoice(transaction.id, transaction.invoice!)}
            className="inline-flex items-center text-blue-600 hover:text-blue-500"
          >
            <Download className="h-4 w-4 mr-1" />
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
      minimumFractionDigits: 2
    }).format(amount)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-medium text-gray-900">{transaction.description}</p>
          {transaction.strategy_name && (
            <p className="text-sm text-gray-500">@{transaction.seller_username} - {transaction.strategy_name}</p>
          )}
        </div>
        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(transaction.status)}`}>
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
            <p className="font-medium text-gray-900">{new Date(transaction.date).toLocaleDateString()}</p>
          </div>
        </div>
        
        {transaction.invoice && (
          <button
            onClick={() => onDownloadInvoice(transaction.id, transaction.invoice!)}
            className="inline-flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-500 border border-blue-200 rounded-lg hover:bg-blue-50"
          >
            <Download className="h-4 w-4 mr-1" />
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
          <div className="h-6 bg-gray-200 rounded w-40 mb-2 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-56 animate-pulse" />
        </div>
        <div className="flex space-x-3">
          <div className="h-9 bg-gray-200 rounded w-20 animate-pulse" />
          <div className="h-9 bg-gray-200 rounded w-28 animate-pulse" />
        </div>
      </div>

      {/* Summary Cards Loading */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-4 bg-gray-200 rounded w-20 mb-2 animate-pulse" />
                <div className="h-8 bg-gray-200 rounded w-16 animate-pulse" />
              </div>
              <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* Table Loading */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="flex space-x-4">
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
              </div>
              <div className="flex space-x-4">
                <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}