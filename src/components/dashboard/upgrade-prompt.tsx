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
  'Performance benchmarking',
]

export default function UpgradePrompt({
  variant = 'card',
  dismissible = true,
  features = defaultFeatures,
  price = '$19.99/month',
  callToAction = 'Upgrade to Pro',
}: UpgradePromptProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  if (variant === 'banner') {
    return (
      <div className="relative mb-8 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
        {dismissible && (
          <button
            onClick={() => setDismissed(true)}
            className="absolute right-4 top-4 text-purple-100 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        <div className="flex items-center justify-between">
          <div>
            <div className="mb-2 flex items-center">
              <Crown className="mr-2 h-6 w-6 text-yellow-300" />
              <h3 className="text-xl font-bold">Unlock Advanced Analytics</h3>
            </div>
            <p className="mb-4 text-purple-100">
              Get unlimited filtering, custom date ranges, and professional-grade analytics tools.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {features.slice(0, 4).map((feature, index) => (
                <div key={index} className="flex items-center">
                  <Zap className="mr-2 h-4 w-4 text-yellow-300" />
                  <span className="text-sm text-purple-100">{feature}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="text-center">
            <div className="mb-2 text-3xl font-bold">{price}</div>
            <Link
              href="/upgrade"
              className="inline-flex items-center rounded-md border border-transparent bg-white px-6 py-3 text-base font-medium text-purple-600 transition-colors hover:bg-purple-50"
            >
              {callToAction}
              <ArrowUpRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'card') {
    return (
      <div className="mb-8 rounded-lg border-2 border-purple-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-3 flex items-center">
              <Crown className="mr-2 h-6 w-6 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">TrueSharp Pro</h3>
            </div>
            <p className="mb-4 text-gray-600">
              Unlock advanced analytics and take your betting to the next level.
            </p>
            <div className="space-y-2">
              {features.slice(0, 3).map((feature, index) => (
                <div key={index} className="flex items-center text-sm text-gray-600">
                  <Zap className="mr-2 h-4 w-4 text-purple-600" />
                  {feature}
                </div>
              ))}
            </div>
          </div>
          <div className="ml-6 text-center">
            <div className="mb-1 text-2xl font-bold text-gray-900">{price}</div>
            <Link
              href="/upgrade"
              className="inline-flex items-center rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700"
            >
              {callToAction}
            </Link>
            {dismissible && (
              <button
                onClick={() => setDismissed(true)}
                className="mt-2 block w-full text-xs text-gray-500 hover:text-gray-700"
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
    <div className="rounded-md border border-purple-200 bg-purple-50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Crown className="mr-2 h-5 w-5 text-purple-600" />
          <div>
            <p className="text-sm font-medium text-purple-900">Want more advanced analytics?</p>
            <p className="text-xs text-purple-700">
              Upgrade to Pro for unlimited filtering and insights.
            </p>
          </div>
        </div>
        <Link
          href="/upgrade"
          className="inline-flex items-center rounded bg-purple-600 px-3 py-1 text-xs font-medium text-white hover:bg-purple-700"
        >
          Upgrade
        </Link>
      </div>
    </div>
  )
}
