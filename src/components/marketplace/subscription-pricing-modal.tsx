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
  isLoading 
}: SubscriptionPricingModalProps) {
  const [selectedFrequency, setSelectedFrequency] = useState<'weekly' | 'monthly' | 'yearly'>('monthly')

  if (!isOpen) return null

  const pricingOptions = [
    {
      frequency: 'weekly' as const,
      price: strategy.pricing_weekly,
      label: 'Weekly',
      description: 'Billed every week',
      popular: false
    },
    {
      frequency: 'monthly' as const,
      price: strategy.pricing_monthly,
      label: 'Monthly',
      description: 'Billed every month',
      popular: true
    },
    {
      frequency: 'yearly' as const,
      price: strategy.pricing_yearly,
      label: 'Yearly',
      description: 'Billed annually',
      savings: Math.round(((strategy.pricing_monthly * 12 - strategy.pricing_yearly) / (strategy.pricing_monthly * 12)) * 100),
      popular: false
    }
  ]

  const handleSubscribe = () => {
    const selectedOption = pricingOptions.find(option => option.frequency === selectedFrequency)
    if (selectedOption) {
      onSubscribe(selectedFrequency, selectedOption.price)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Subscribe to Strategy</h2>
              <p className="text-slate-600 text-sm mt-1">
                {strategy.strategy_name} by @{strategy.username}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Pricing Options */}
        <div className="p-6 space-y-4">
          {pricingOptions.map((option) => (
            <div
              key={option.frequency}
              className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                selectedFrequency === option.frequency
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
              onClick={() => setSelectedFrequency(option.frequency)}
            >
              {option.popular && (
                <div className="absolute -top-2 left-4">
                  <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center">
                    <Crown className="w-3 h-3 mr-1" />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedFrequency === option.frequency
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-slate-300'
                  }`}>
                    {selectedFrequency === option.frequency && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-slate-900">{option.label}</h3>
                      {option.savings && (
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                          Save {option.savings}%
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 text-sm">{option.description}</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-900">
                    ${option.price}
                  </div>
                  <div className="text-slate-500 text-sm">
                    per {option.frequency === 'yearly' ? 'year' : option.frequency === 'monthly' ? 'month' : 'week'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between text-sm text-slate-600 mb-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Cancel anytime</span>
            </div>
            <div>
              <span>Currency: USD</span>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubscribe}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : 'Subscribe Now'}
            </button>
          </div>

          <p className="text-xs text-slate-500 mt-3 text-center">
            By subscribing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  )
}