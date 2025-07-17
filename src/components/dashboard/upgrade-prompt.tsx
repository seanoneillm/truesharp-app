// src/components/dashboard/upgrade-prompt.tsx
import Link from 'next/link'
import { Crown, ArrowUpRight, Zap, X } from 'lucide-react'
import { useState } from 'react'

interface UpgradePromptProps {
  variant?: 'banner' | 'card' | 'inline'
  dismissible?: boolean
  features?: string[]
  price?: string
  callToAction?: string
}

const defaultFeatures = [
  'Unlimited custom filters',
  'Advanced analytics engine',
  'Data export capabilities',
  'Performance benchmarking'
]

export default function UpgradePrompt({ 
  variant = 'card',
  dismissible = true,
  features = defaultFeatures,
  price = '$19.99/month',
  callToAction = 'Upgrade to Pro'
}: UpgradePromptProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  if (variant === 'banner') {
    return (
      <div className="relative bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 mb-8 text-white">
        {dismissible && (
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-4 right-4 text-purple-100 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center mb-2">
              <Crown className="h-6 w-6 text-yellow-300 mr-2" />
              <h3 className="text-xl font-bold">Unlock Advanced Analytics</h3>
            </div>
            <p className="text-purple-100 mb-4">
              Get unlimited filtering, custom date ranges, and professional-grade analytics tools.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {features.slice(0, 4).map((feature, index) => (
                <div key={index} className="flex items-center">
                  <Zap className="h-4 w-4 text-yellow-300 mr-2" />
                  <span className="text-sm text-purple-100">{feature}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">{price}</div>
            <Link
              href="/upgrade"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-purple-600 bg-white hover:bg-purple-50 transition-colors"
            >
              {callToAction}
              <ArrowUpRight className="h-5 w-5 ml-2" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'card') {
    return (
      <div className="bg-white border-2 border-purple-200 rounded-lg p-6 mb-8">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center mb-3">
              <Crown className="h-6 w-6 text-purple-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">TrueSharp Pro</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Unlock advanced analytics and take your betting to the next level.
            </p>
            <div className="space-y-2">
              {features.slice(0, 3).map((feature, index) => (
                <div key={index} className="flex items-center text-sm text-gray-600">
                  <Zap className="h-4 w-4 text-purple-600 mr-2" />
                  {feature}
                </div>
              ))}
            </div>
          </div>
          <div className="ml-6 text-center">
            <div className="text-2xl font-bold text-gray-900 mb-1">{price}</div>
            <Link
              href="/upgrade"
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 transition-colors"
            >
              {callToAction}
            </Link>
            {dismissible && (
              <button
                onClick={() => setDismissed(true)}
                className="block w-full text-xs text-gray-500 hover:text-gray-700 mt-2"
              >
                Maybe later
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Inline variant
  return (
    <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Crown className="h-5 w-5 text-purple-600 mr-2" />
          <div>
            <p className="text-sm font-medium text-purple-900">
              Want more advanced analytics?
            </p>
            <p className="text-xs text-purple-700">
              Upgrade to Pro for unlimited filtering and insights.
            </p>
          </div>
        </div>
        <Link
          href="/upgrade"
          className="inline-flex items-center px-3 py-1 bg-purple-600 text-white text-xs font-medium rounded hover:bg-purple-700"
        >
          Upgrade
        </Link>
      </div>
    </div>
  )
}
