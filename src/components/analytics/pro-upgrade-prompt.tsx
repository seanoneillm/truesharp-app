'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Crown,
  TrendingUp,
  BarChart3,
  Activity,
  LineChart,
  Lock,
  CheckCircle,
  ArrowRight,
} from 'lucide-react'

interface ProUpgradePromptProps {
  variant?: 'card' | 'banner' | 'modal'
  context?: 'analytics' | 'filters' | 'charts' | 'general'
  onUpgrade?: () => void
  className?: string
}

const FEATURES_BY_CONTEXT = {
  analytics: [
    {
      icon: BarChart3,
      title: 'Advanced analytics',
      description: 'Professional-grade performance tracking',
    },
    {
      icon: LineChart,
      title: 'Custom analytics chart creation',
      description: 'Build personalized chart views',
    },
    {
      icon: TrendingUp,
      title: 'CLV analysis',
      description: 'Track your edge against closing lines',
    },
    {
      icon: Activity,
      title: 'Line movement analysis on all bets',
      description: 'See how lines moved for every bet',
    },
  ],
  filters: [
    {
      icon: BarChart3,
      title: 'Advanced analytics',
      description: 'Professional-grade performance tracking',
    },
    {
      icon: LineChart,
      title: 'Custom analytics chart creation',
      description: 'Build personalized chart views',
    },
    {
      icon: TrendingUp,
      title: 'CLV analysis',
      description: 'Track your edge against closing lines',
    },
    {
      icon: Activity,
      title: 'Line movement analysis on all bets',
      description: 'See how lines moved for every bet',
    },
  ],
  charts: [
    {
      icon: BarChart3,
      title: 'Advanced analytics',
      description: 'Professional-grade performance tracking',
    },
    {
      icon: LineChart,
      title: 'Custom analytics chart creation',
      description: 'Build personalized chart views',
    },
    {
      icon: TrendingUp,
      title: 'CLV analysis',
      description: 'Track your edge against closing lines',
    },
    {
      icon: Activity,
      title: 'Line movement analysis on all bets',
      description: 'See how lines moved for every bet',
    },
  ],
  general: [
    {
      icon: BarChart3,
      title: 'Advanced analytics',
      description: 'Professional-grade performance tracking',
    },
    {
      icon: LineChart,
      title: 'Custom analytics chart creation',
      description: 'Build personalized chart views',
    },
    {
      icon: TrendingUp,
      title: 'CLV analysis',
      description: 'Track your edge against closing lines',
    },
    {
      icon: Activity,
      title: 'Line movement analysis on all bets',
      description: 'See how lines moved for every bet',
    },
  ],
}

export function ProUpgradePrompt({
  variant = 'card',
  context = 'general',
  onUpgrade,
  className = '',
}: ProUpgradePromptProps) {
  const features = FEATURES_BY_CONTEXT[context]

  const handleUpgrade = () => {
    // TODO: Implement Stripe checkout
    onUpgrade?.()
  }

  if (variant === 'banner') {
    return (
      <div
        className={`rounded-lg bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white ${className}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="rounded-lg bg-white/20 p-3">
              <Crown className="h-6 w-6" />
            </div>
            <div>
              <h3 className="mb-1 text-lg font-semibold">Unlock Pro Analytics</h3>
              <p className="text-blue-100">
                Get advanced insights and unlimited access for just $20/month
              </p>
            </div>
          </div>
          <Button
            onClick={handleUpgrade}
            className="bg-white font-semibold text-blue-600 hover:bg-blue-50"
          >
            Upgrade Now
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  if (variant === 'modal') {
    return (
      <div className={`mx-auto max-w-2xl ${className}`}>
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600">
            <Crown className="h-8 w-8 text-white" />
          </div>
          <h2 className="mb-2 text-2xl font-bold">Upgrade to TrueSharp Pro</h2>
          <p className="text-gray-600">Unlock professional-grade analytics and advanced features</p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div key={index} className="flex items-start space-x-3 rounded-lg bg-gray-50 p-4">
                <div className="rounded-lg bg-blue-100 p-2">
                  <Icon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="mb-1 font-medium">{feature.title}</h4>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="text-center">
          <div className="mb-4 inline-flex items-center space-x-2">
            <span className="text-3xl font-bold text-gray-900">$20</span>
            <span className="text-gray-600">/month</span>
          </div>
          <p className="mb-6 text-sm text-gray-500">Cancel anytime</p>
          <Button onClick={handleUpgrade} size="lg" className="w-full md:w-auto">
            <Crown className="mr-2 h-4 w-4" />
            Upgrade to Pro
          </Button>
        </div>
      </div>
    )
  }

  // Default card variant
  return (
    <Card className={`relative overflow-hidden ${className}`}>
      <div className="absolute right-0 top-0 p-4">
        <Badge className="border-0 bg-gradient-to-r from-amber-400 to-orange-500 text-white">
          <Crown className="mr-1 h-3 w-3" />
          Pro
        </Badge>
      </div>

      <CardHeader className="pb-4">
        <div className="mb-2 flex items-center space-x-3">
          <div className="rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 p-2">
            <Lock className="h-5 w-5 text-blue-600" />
          </div>
          <CardTitle className="text-lg">Pro Feature</CardTitle>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <p className="text-gray-600">
            This feature is available with TrueSharp Pro. Upgrade to unlock advanced analytics and
            insights.
          </p>

          <div className="space-y-2">
            {features.slice(0, 3).map((feature, index) => {
              return (
                <div key={index} className="flex items-center space-x-3 text-sm">
                  <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-500" />
                  <span className="text-gray-700">{feature.title}</span>
                </div>
              )
            })}
          </div>

          <div className="border-t pt-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <span className="text-2xl font-bold text-gray-900">$20</span>
                <span className="ml-1 text-gray-600">/month</span>
              </div>
              <Badge variant="outline" className="border-blue-600 text-blue-600">
                Cancel anytime
              </Badge>
            </div>

            <Button onClick={handleUpgrade} className="w-full">
              <Crown className="mr-2 h-4 w-4" />
              Upgrade to Pro
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Specific context components for easy use
export const AnalyticsUpgradePrompt = (props: Omit<ProUpgradePromptProps, 'context'>) => (
  <ProUpgradePrompt {...props} context="analytics" />
)

export const FiltersUpgradePrompt = (props: Omit<ProUpgradePromptProps, 'context'>) => (
  <ProUpgradePrompt {...props} context="filters" />
)

export const ChartsUpgradePrompt = (props: Omit<ProUpgradePromptProps, 'context'>) => (
  <ProUpgradePrompt {...props} context="charts" />
)

export const GeneralUpgradePrompt = (props: Omit<ProUpgradePromptProps, 'context'>) => (
  <ProUpgradePrompt {...props} context="general" />
)
