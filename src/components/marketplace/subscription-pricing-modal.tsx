'use client'

import { useState } from 'react'
import { X, Check, Crown, Calendar } from 'lucide-react'

interface SubscriptionPricingModalProps {
  isOpen: boolean
  onClose: () => void
  onSubscribe: (frequency: 'weekly' | 'monthly' | 'yearly', price: number) => void
  strategy: {
    strategy_name: string
    username: string
    pricing_weekly: number
    pricing_monthly: number
    pricing_yearly: number
  }
  isLoading: boolean
}

export function SubscriptionPricingModal({
  isOpen,
  onClose,
  onSubscribe,
  strategy,
  isLoading,
}: SubscriptionPricingModalProps) {
  const pricingOptions = [
    {
      frequency: 'weekly' as const,
      price: strategy.pricing_weekly,
      label: 'Weekly',
      description: 'Billed every week',
      popular: false,
    },
    {
      frequency: 'monthly' as const,
      price: strategy.pricing_monthly,
      label: 'Monthly',
      description: 'Billed every month',
      popular: true,
    },
    {
      frequency: 'yearly' as const,
      price: strategy.pricing_yearly,
      label: 'Yearly',
      description: 'Billed annually',
      savings: Math.round(
        ((strategy.pricing_monthly * 12 - strategy.pricing_yearly) /
          (strategy.pricing_monthly * 12)) *
          100
      ),
      popular: false,
    },
  ].filter(option => option.price > 0)

  // Set default selected frequency to the first available option, preferring monthly if available
  const defaultFrequency = pricingOptions.find(opt => opt.frequency === 'monthly')?.frequency || pricingOptions[0]?.frequency || 'monthly'
  const [selectedFrequency, setSelectedFrequency] = useState<'weekly' | 'monthly' | 'yearly'>(
    defaultFrequency
  )

  if (!isOpen) return null

  const handleSubscribe = () => {
    const selectedOption = pricingOptions.find(option => option.frequency === selectedFrequency)
    if (selectedOption) {
      onSubscribe(selectedFrequency, selectedOption.price)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="border-b border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Subscribe to Strategy</h2>
              <p className="mt-1 text-sm text-slate-600">
                {strategy.strategy_name} by @{strategy.username}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 transition-colors hover:text-slate-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Pricing Options */}
        <div className="space-y-4 p-6">
          {pricingOptions.map(option => (
            <div
              key={option.frequency}
              className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all ${
                selectedFrequency === option.frequency
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
              onClick={() => setSelectedFrequency(option.frequency)}
            >
              {option.popular && (
                <div className="absolute -top-2 left-4">
                  <span className="flex items-center rounded-full bg-blue-500 px-2 py-1 text-xs font-bold text-white">
                    <Crown className="mr-1 h-3 w-3" />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                      selectedFrequency === option.frequency
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-slate-300'
                    }`}
                  >
                    {selectedFrequency === option.frequency && (
                      <Check className="h-3 w-3 text-white" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-slate-900">{option.label}</h3>
                      {option.savings && (
                        <span className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                          Save {option.savings}%
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600">{option.description}</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-900">${option.price}</div>
                  <div className="text-sm text-slate-500">
                    per{' '}
                    {option.frequency === 'yearly'
                      ? 'year'
                      : option.frequency === 'monthly'
                        ? 'month'
                        : 'week'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-slate-50 p-6">
          <div className="mb-4 flex items-center justify-between text-sm text-slate-600">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Cancel anytime</span>
            </div>
            <div>
              <span>Currency: USD</span>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-slate-700 transition-colors hover:bg-slate-50"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubscribe}
              disabled={isLoading}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : 'Subscribe Now'}
            </button>
          </div>

          <p className="mt-3 text-center text-xs text-slate-500">
            By subscribing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  )
}
