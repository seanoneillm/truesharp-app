'use client'

import { useState } from 'react'
import {
  X,
  Crown,
  Users,
  TrendingUp,
  Shield,
  Calendar,
  DollarSign,
  CheckCircle
} from 'lucide-react'

interface StrategyData {
  id: string
  strategy_id: string
  strategy_name: string
  strategy_description: string
  username: string
  display_name: string
  profile_picture_url: string | null
  total_bets: number
  roi_percentage: number
  win_rate: number
  primary_sport: string
  strategy_type: string
  price: number
  pricing_weekly: number
  pricing_monthly: number
  pricing_yearly: number
  subscriber_count: number
  is_verified: boolean
  verification_status: string
  rank: number | null
  last_bet_date: string | null
  last_updated: string
  created_at: string
}

interface SubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  strategy: StrategyData
}

type BillingFrequency = 'weekly' | 'monthly' | 'yearly'

export function SubscriptionModal({ isOpen, onClose, strategy }: SubscriptionModalProps) {
  const [selectedFrequency, setSelectedFrequency] = useState<BillingFrequency>('monthly')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const pricingOptions = [
    {
      frequency: 'weekly' as const,
      price: strategy.pricing_weekly,
      label: 'Weekly',
      period: 'week',
      savings: null,
      popular: false
    },
    {
      frequency: 'monthly' as const,
      price: strategy.pricing_monthly,
      label: 'Monthly',
      period: 'month',
      savings: null,
      popular: true
    },
    {
      frequency: 'yearly' as const,
      price: strategy.pricing_yearly,
      label: 'Yearly',
      period: 'year',
      savings: Math.round(((strategy.pricing_monthly * 12) - strategy.pricing_yearly) / (strategy.pricing_monthly * 12) * 100),
      popular: false
    }
  ]

  const selectedOption = pricingOptions.find(option => option.frequency === selectedFrequency)

  const handleSubscribe = async () => {
    setLoading(true)
    try {
      // Here you would integrate with Stripe or your payment processor
      // For now, we'll simulate the subscription process
      console.log('Subscribing to strategy:', strategy.strategy_id, 'with frequency:', selectedFrequency)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Close modal on success
      onClose()
    } catch (error) {
      console.error('Subscription error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {strategy.profile_picture_url ? (
                <img
                  src={strategy.profile_picture_url}
                  alt={strategy.username}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                  {strategy.username.charAt(0).toUpperCase()}
                </div>
              )}
              
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl font-bold text-slate-900">@{strategy.username}</h2>
                  {strategy.is_verified && (
                    <Shield className="w-5 h-5 text-blue-500" />
                  )}
                </div>
                <p className="text-slate-600">{strategy.primary_sport} Specialist</p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>
        
        {/* Strategy Info */}
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {strategy.strategy_name}
          </h3>
          <p className="text-slate-600 mb-4">
            {strategy.strategy_description}
          </p>
          
          {/* Performance Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <div className={`text-2xl font-bold mb-1 ${
                strategy.roi_percentage >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {strategy.roi_percentage >= 0 ? '+' : ''}{strategy.roi_percentage.toFixed(1)}%
              </div>
              <div className="text-sm text-slate-600">ROI</div>
            </div>
            
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-slate-900 mb-1">
                {strategy.win_rate.toFixed(1)}%
              </div>
              <div className="text-sm text-slate-600">Win Rate</div>
            </div>
            
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-slate-900 mb-1">
                {strategy.total_bets}
              </div>
              <div className="text-sm text-slate-600">Total Bets</div>
            </div>
          </div>
        </div>
        
        {/* Pricing Options */}
        <div className="p-6 border-b border-slate-100">
          <h4 className="text-lg font-semibold text-slate-900 mb-4">Choose Your Plan</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {pricingOptions.map((option) => (
              <div
                key={option.frequency}
                className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all ${
                  selectedFrequency === option.frequency
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                } ${option.popular ? 'ring-2 ring-blue-200' : ''}`}
                onClick={() => setSelectedFrequency(option.frequency)}
              >
                {option.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                      Most Popular
                    </div>
                  </div>
                )}
                
                {option.savings && (
                  <div className="absolute -top-2 -right-2">
                    <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      Save {option.savings}%
                    </div>
                  </div>
                )}
                
                <div className="text-center">
                  <div className="text-lg font-semibold text-slate-900">
                    {option.label}
                  </div>
                  <div className="text-3xl font-bold text-slate-900 mt-2">
                    ${option.price}
                  </div>
                  <div className="text-sm text-slate-600">
                    per {option.period}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* What's Included */}
        <div className="p-6 border-b border-slate-100">
          <h4 className="text-lg font-semibold text-slate-900 mb-4">What's Included</h4>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-slate-700">Access to all strategy picks</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-slate-700">Real-time notifications</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-slate-700">Performance analytics</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-slate-700">Cancel anytime</span>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-6">
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Processing...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <Crown className="w-5 h-5" />
                <span>
                  Subscribe for ${selectedOption?.price}/{selectedOption?.period === 'year' ? 'year' : selectedOption?.period === 'month' ? 'month' : 'week'}
                </span>
              </div>
            )}
          </button>
          
          <p className="text-xs text-slate-500 text-center mt-3">
            Secure payment processed by Stripe. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  )
}

export default SubscriptionModal