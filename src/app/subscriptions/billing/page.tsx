'use client'

import React, { useState, useEffect } from 'react'
import {
  CreditCard,
  Download,
  Calendar,
  DollarSign,
  Settings,
  ArrowLeft,
  ExternalLink,
  Shield,
  AlertTriangle,
  Check,
  RefreshCw,
  Clock,
  Receipt,
  FileText,
  Wallet,
  Bell,
} from 'lucide-react'
import { BillingHistory } from '@/components/subscriptions/billing-history'
import Link from 'next/link'

// Shield SVG Component
const TrueSharpShield = ({ className = 'h-6 w-6', variant = 'default' }) => (
  <svg className={className} viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id={`shieldGradient-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={variant === 'light' ? '#3b82f6' : '#1e40af'} />
        <stop offset="100%" stopColor={variant === 'light' ? '#1e40af' : '#1e3a8a'} />
      </linearGradient>
    </defs>
    <path
      d="M50 5 L80 20 L80 50 Q80 85 50 110 Q20 85 20 50 L20 20 Z"
      fill={`url(#shieldGradient-${variant})`}
      stroke={variant === 'light' ? '#60a5fa' : '#3b82f6'}
      strokeWidth="2"
    />
    <path
      d="M35 45 L45 55 L65 35"
      stroke="white"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
)

export default function BillingManagementPage() {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'payment-methods' | 'history' | 'settings'
  >('overview')
  const [isLoading, setIsLoading] = useState(true)
  const [billingData, setBillingData] = useState({
    paymentMethods: [],
    upcomingCharges: [],
    billingHistory: [],
    preferences: {},
  })

  // Mock data - replace with actual API calls
  useEffect(() => {
    const loadBillingData = async () => {
      setIsLoading(true)
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      setBillingData({
        paymentMethods: [
          {
            id: '1',
            type: 'card',
            brand: 'visa',
            last4: '4242',
            exp_month: 12,
            exp_year: 2027,
            is_default: true,
          },
        ],
        upcomingCharges: [
          {
            id: '1',
            strategy_name: 'NFL Favorites',
            seller_username: 'profootball_expert',
            amount: 29.99,
            next_billing_date: '2024-02-15',
            frequency: 'monthly',
          },
          {
            id: '2',
            strategy_name: 'NBA Props Master',
            seller_username: 'basketball_analytics',
            amount: 49.99,
            next_billing_date: '2024-02-18',
            frequency: 'monthly',
          },
        ],
        billingHistory: [],
        preferences: {
          email_receipts: true,
          billing_notifications: true,
          auto_pay: true,
        },
      })
      setIsLoading(false)
    }

    loadBillingData()
  }, [])

  const handleManagePaymentMethod = () => {
    // Open Stripe Customer Portal
    window.open('https://billing.stripe.com/session/live_...', '_blank')
  }

  const handleDownloadReceipts = () => {
    // Download all receipts
    console.log('Downloading all receipts...')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  if (isLoading) {
    return <BillingManagementLoading />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 p-8 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="mb-2 flex items-center space-x-3">
                  <Link
                    href="/subscriptions"
                    className="rounded-lg bg-white/20 p-2 transition-colors hover:bg-white/30"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Link>
                  <TrueSharpShield className="h-8 w-8" variant="light" />
                  <h1 className="text-3xl font-bold">Billing Management</h1>
                </div>
                <p className="text-blue-100">Manage your payment methods and billing preferences</p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleDownloadReceipts}
                  className="inline-flex items-center rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Receipts
                </button>
                <button
                  onClick={handleManagePaymentMethod}
                  className="inline-flex items-center rounded-xl bg-white/20 px-4 py-2 font-medium text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/30"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Stripe Portal
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex w-fit space-x-2 rounded-2xl border border-slate-200/50 bg-white/70 p-2 shadow-lg backdrop-blur-sm">
            {[
              { key: 'overview', label: 'Overview', icon: DollarSign },
              { key: 'payment-methods', label: 'Payment Methods', icon: CreditCard },
              { key: 'history', label: 'History', icon: Receipt },
              { key: 'settings', label: 'Settings', icon: Settings },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`flex items-center rounded-xl px-6 py-3 text-sm font-medium transition-all duration-200 ${
                  activeTab === key
                    ? 'scale-105 bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className="mr-2 h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Current Month Summary */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Current Month Summary</h3>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="text-center">
                  <div className="mx-auto mb-3 w-fit rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-3 shadow-lg">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(
                      billingData.upcomingCharges.reduce((sum, charge) => sum + charge.amount, 0)
                    )}
                  </p>
                  <p className="text-sm text-gray-600">Monthly Total</p>
                </div>

                <div className="text-center">
                  <div className="mx-auto mb-3 w-fit rounded-xl bg-gradient-to-br from-green-500 to-green-600 p-3 shadow-lg">
                    <Check className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {billingData.upcomingCharges.length}
                  </p>
                  <p className="text-sm text-gray-600">Active Subscriptions</p>
                </div>

                <div className="text-center">
                  <div className="mx-auto mb-3 w-fit rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 p-3 shadow-lg">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {billingData.upcomingCharges.length > 0
                      ? new Date(
                          Math.min(
                            ...billingData.upcomingCharges.map(c =>
                              new Date(c.next_billing_date).getTime()
                            )
                          )
                        ).toLocaleDateString()
                      : 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">Next Charge</p>
                </div>
              </div>
            </div>

            {/* Payment Method Overview */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Payment Method</h3>
                <button
                  onClick={handleManagePaymentMethod}
                  className="inline-flex items-center rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Manage
                </button>
              </div>

              {billingData.paymentMethods.length > 0 ? (
                <div className="flex items-center space-x-4 rounded-lg border border-gray-200 p-4">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <CreditCard className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      •••• •••• •••• {billingData.paymentMethods[0].last4}
                    </p>
                    <p className="text-sm text-gray-500">
                      Expires {billingData.paymentMethods[0].exp_month}/
                      {billingData.paymentMethods[0].exp_year}
                    </p>
                  </div>
                  {billingData.paymentMethods[0].is_default && (
                    <span className="inline-flex items-center rounded-full border border-green-200 bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                      <Check className="mr-1 h-3 w-3" />
                      Default
                    </span>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <CreditCard className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                  <p className="mb-4 text-gray-600">No payment methods on file</p>
                  <button
                    onClick={handleManagePaymentMethod}
                    className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                  >
                    Add Payment Method
                  </button>
                </div>
              )}
            </div>

            {/* Upcoming Charges */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Upcoming Charges</h3>

              {billingData.upcomingCharges.length > 0 ? (
                <div className="space-y-4">
                  {billingData.upcomingCharges.map(charge => (
                    <div
                      key={charge.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="rounded-lg bg-blue-50 p-2">
                          <Wallet className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            @{charge.seller_username} - {charge.strategy_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            Next billing: {new Date(charge.next_billing_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(charge.amount)}
                        </p>
                        <p className="text-sm capitalize text-gray-500">{charge.frequency}</p>
                      </div>
                    </div>
                  ))}

                  <div className="mt-6 border-t border-gray-200 pt-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900">Total Monthly</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(
                          billingData.upcomingCharges.reduce(
                            (sum, charge) => sum + charge.amount,
                            0
                          )
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Clock className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                  <p className="text-gray-600">No upcoming charges</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'payment-methods' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Payment Methods</h3>
                <button
                  onClick={handleManagePaymentMethod}
                  className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Add New Method
                </button>
              </div>

              {billingData.paymentMethods.length > 0 ? (
                <div className="space-y-4">
                  {billingData.paymentMethods.map(method => (
                    <div
                      key={method.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 p-6"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="rounded-lg bg-gray-50 p-3">
                          <CreditCard className="h-6 w-6 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">•••• •••• •••• {method.last4}</p>
                          <p className="text-sm text-gray-500">
                            {method.brand?.toUpperCase()} • Expires {method.exp_month}/
                            {method.exp_year}
                          </p>
                        </div>
                        {method.is_default && (
                          <span className="inline-flex items-center rounded-full border border-green-200 bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                            <Check className="mr-1 h-3 w-3" />
                            Default
                          </span>
                        )}
                      </div>
                      <button
                        onClick={handleManagePaymentMethod}
                        className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Manage
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <CreditCard className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                  <h4 className="mb-2 text-lg font-medium text-gray-900">No payment methods</h4>
                  <p className="mb-6 text-gray-600">
                    Add a payment method to manage your subscriptions
                  </p>
                  <button
                    onClick={handleManagePaymentMethod}
                    className="inline-flex items-center rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Add Payment Method
                  </button>
                </div>
              )}

              {/* Security Notice */}
              <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-start space-x-3">
                  <Shield className="mt-0.5 h-5 w-5 text-blue-600" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Secure Payment Processing</p>
                    <p>
                      All payment information is securely processed by Stripe. TrueSharp never
                      stores your complete card details on our servers.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <BillingHistory
            transactions={[]} // Pass actual billing history data
            isLoading={false}
            hasMore={false}
          />
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-6 text-lg font-semibold text-gray-900">Billing Preferences</h3>

              <div className="space-y-6">
                {/* Email Receipts */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Email Receipts</h4>
                    <p className="text-sm text-gray-600">Receive email receipts for all payments</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      defaultChecked={billingData.preferences.email_receipts}
                    />
                    <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300"></div>
                  </label>
                </div>

                {/* Billing Notifications */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Billing Notifications</h4>
                    <p className="text-sm text-gray-600">Get notified before upcoming charges</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      defaultChecked={billingData.preferences.billing_notifications}
                    />
                    <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300"></div>
                  </label>
                </div>

                {/* Auto Pay */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Automatic Payments</h4>
                    <p className="text-sm text-gray-600">Automatically pay subscription charges</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      defaultChecked={billingData.preferences.auto_pay}
                    />
                    <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Customer Portal Access */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Customer Portal</h3>
              <p className="mb-4 text-gray-600">
                Access your Stripe customer portal to manage payment methods, view detailed billing
                history, and update billing information.
              </p>
              <button
                onClick={handleManagePaymentMethod}
                className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Customer Portal
              </button>
            </div>

            {/* Support */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Need Help?</h3>
              <p className="mb-4 text-gray-600">
                If you have questions about billing or need assistance with payment issues, our
                support team is here to help.
              </p>
              <div className="flex items-center space-x-4">
                <Link
                  href="/help"
                  className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Help Center
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  <Bell className="mr-2 h-4 w-4" />
                  Contact Support
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function BillingManagementLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header Loading */}
        <div className="mb-8">
          <div className="rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 p-8 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="mb-2 flex items-center space-x-3">
                  <div className="h-8 w-8 animate-pulse rounded bg-white/20" />
                  <div className="h-8 w-8 animate-pulse rounded bg-white/20" />
                  <div className="h-8 w-56 animate-pulse rounded bg-white/20" />
                </div>
                <div className="h-5 w-80 animate-pulse rounded bg-white/20" />
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-10 w-32 animate-pulse rounded-xl bg-white/20" />
                <div className="h-10 w-28 animate-pulse rounded-xl bg-white/20" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Loading */}
        <div className="mb-8">
          <div className="flex w-fit space-x-2 rounded-2xl border border-slate-200/50 bg-white/70 p-2 shadow-lg backdrop-blur-sm">
            {[...Array(4)].map((_, index) => (
              <div
                key={index}
                className={`h-12 rounded-xl ${
                  index === 0 ? 'w-32 bg-blue-200' : 'w-36 bg-gray-200'
                } animate-pulse`}
              />
            ))}
          </div>
        </div>

        {/* Content Loading */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 h-6 w-48 animate-pulse rounded bg-gray-200" />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="text-center">
                  <div className="mx-auto mb-3 h-12 w-12 animate-pulse rounded-xl bg-gray-200" />
                  <div className="mx-auto mb-2 h-8 w-20 animate-pulse rounded bg-gray-200" />
                  <div className="mx-auto h-4 w-24 animate-pulse rounded bg-gray-200" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
