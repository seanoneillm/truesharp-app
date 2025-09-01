'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Crown, 
  Zap, 
  TrendingUp, 
  BarChart3, 
  Target, 
  Activity,
  PieChart,
  LineChart,
  Settings,
  Lock,
  CheckCircle,
  ArrowRight
} from "lucide-react"

interface ProUpgradePromptProps {
  variant?: 'card' | 'banner' | 'modal'
  context?: 'analytics' | 'filters' | 'charts' | 'general'
  onUpgrade?: () => void
  className?: string
}

const FEATURES_BY_CONTEXT = {
  analytics: [
    { icon: BarChart3, title: 'Advanced analytics', description: 'Professional-grade performance tracking' },
    { icon: LineChart, title: 'Custom analytics chart creation', description: 'Build personalized chart views' },
    { icon: TrendingUp, title: 'CLV analysis', description: 'Track your edge against closing lines' },
    { icon: Activity, title: 'Line movement analysis on all bets', description: 'See how lines moved for every bet' }
  ],
  filters: [
    { icon: BarChart3, title: 'Advanced analytics', description: 'Professional-grade performance tracking' },
    { icon: LineChart, title: 'Custom analytics chart creation', description: 'Build personalized chart views' },
    { icon: TrendingUp, title: 'CLV analysis', description: 'Track your edge against closing lines' },
    { icon: Activity, title: 'Line movement analysis on all bets', description: 'See how lines moved for every bet' }
  ],
  charts: [
    { icon: BarChart3, title: 'Advanced analytics', description: 'Professional-grade performance tracking' },
    { icon: LineChart, title: 'Custom analytics chart creation', description: 'Build personalized chart views' },
    { icon: TrendingUp, title: 'CLV analysis', description: 'Track your edge against closing lines' },
    { icon: Activity, title: 'Line movement analysis on all bets', description: 'See how lines moved for every bet' }
  ],
  general: [
    { icon: BarChart3, title: 'Advanced analytics', description: 'Professional-grade performance tracking' },
    { icon: LineChart, title: 'Custom analytics chart creation', description: 'Build personalized chart views' },
    { icon: TrendingUp, title: 'CLV analysis', description: 'Track your edge against closing lines' },
    { icon: Activity, title: 'Line movement analysis on all bets', description: 'See how lines moved for every bet' }
  ]
}

export function ProUpgradePrompt({ 
  variant = 'card', 
  context = 'general', 
  onUpgrade,
  className = ''
}: ProUpgradePromptProps) {
  const features = FEATURES_BY_CONTEXT[context]
  
  const handleUpgrade = () => {
    // TODO: Implement Stripe checkout
    onUpgrade?.()
  }

  if (variant === 'banner') {
    return (
      <div className={`bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg p-6 text-white ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1">Unlock Pro Analytics</h3>
              <p className="text-blue-100">
                Get advanced insights and unlimited access for just $20/month
              </p>
            </div>
          </div>
          <Button 
            onClick={handleUpgrade}
            className="bg-white text-blue-600 hover:bg-blue-50 font-semibold"
          >
            Upgrade Now
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    )
  }

  if (variant === 'modal') {
    return (
      <div className={`max-w-2xl mx-auto ${className}`}>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-4">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Upgrade to TrueSharp Pro</h2>
          <p className="text-gray-600">
            Unlock professional-grade analytics and advanced features
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div key={index} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium mb-1">{feature.title}</h4>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="text-center">
          <div className="inline-flex items-center space-x-2 mb-4">
            <span className="text-3xl font-bold text-gray-900">$20</span>
            <span className="text-gray-600">/month</span>
          </div>
          <p className="text-sm text-gray-500 mb-6">Cancel anytime</p>
          <Button onClick={handleUpgrade} size="lg" className="w-full md:w-auto">
            <Crown className="w-4 h-4 mr-2" />
            Upgrade to Pro
          </Button>
        </div>
      </div>
    )
  }

  // Default card variant
  return (
    <Card className={`relative overflow-hidden ${className}`}>
      <div className="absolute top-0 right-0 p-4">
        <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0">
          <Crown className="w-3 h-3 mr-1" />
          Pro
        </Badge>
      </div>
      
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg">
            <Lock className="w-5 h-5 text-blue-600" />
          </div>
          <CardTitle className="text-lg">Pro Feature</CardTitle>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <p className="text-gray-600">
            This feature is available with TrueSharp Pro. Upgrade to unlock advanced analytics and insights.
          </p>
          
          <div className="space-y-2">
            {features.slice(0, 3).map((feature, index) => {
              const Icon = feature.icon
              return (
                <div key={index} className="flex items-center space-x-3 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">{feature.title}</span>
                </div>
              )
            })}
          </div>
          
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-2xl font-bold text-gray-900">$20</span>
                <span className="text-gray-600 ml-1">/month</span>
              </div>
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                Cancel anytime
              </Badge>
            </div>
            
            <Button onClick={handleUpgrade} className="w-full">
              <Crown className="w-4 h-4 mr-2" />
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