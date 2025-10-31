import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  // Shield, 
  CreditCard, 
  Star, 
  Target,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

interface HealthIndicator {
  name: string
  value: number
  target?: number
  status: 'excellent' | 'good' | 'warning' | 'poor'
  description: string
}

interface BusinessHealthPanelProps {
  metrics: {
    sellerConversionRate: number
    proConversionRate: number
    stripeIntegrationRate: number
  }
}

export function BusinessHealthPanel({ metrics }: BusinessHealthPanelProps) {
  
  const getHealthStatus = (value: number, targets: number[]): HealthIndicator['status'] => {
    if (value >= (targets[0] ?? 0)) return 'excellent'
    if (value >= (targets[1] ?? 0)) return 'good' 
    if (value >= (targets[2] ?? 0)) return 'warning'
    return 'poor'
  }

  const indicators: HealthIndicator[] = [
    {
      name: 'Seller Conversion',
      value: metrics.sellerConversionRate,
      target: 15,
      status: getHealthStatus(metrics.sellerConversionRate, [15, 10, 5]),
      description: 'Users becoming sellers'
    },
    {
      name: 'Pro Upgrade Rate',
      value: metrics.proConversionRate,
      target: 25,
      status: getHealthStatus(metrics.proConversionRate, [25, 15, 8]),
      description: 'Users upgrading to Pro'
    },
    {
      name: 'Payment Integration',
      value: metrics.stripeIntegrationRate,
      target: 70,
      status: getHealthStatus(metrics.stripeIntegrationRate, [70, 50, 30]),
      description: 'Users with payment setup'
    }
  ]

  const getStatusColor = (status: HealthIndicator['status']) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200'
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'poor': return 'text-red-600 bg-red-50 border-red-200'
    }
  }

  const getStatusIcon = (status: HealthIndicator['status']) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="h-3 w-3" />
      case 'good': return <CheckCircle className="h-3 w-3" />
      case 'warning': return <AlertTriangle className="h-3 w-3" />
      case 'poor': return <AlertTriangle className="h-3 w-3" />
    }
  }


  const getIndicatorIcon = (index: number) => {
    const icons = [Target, Star, CreditCard]
    const Icon = icons[index]
    return Icon ? <Icon className="h-4 w-4" /> : null
  }

  // Calculate overall health score
  const overallHealth = indicators.reduce((sum, indicator) => {
    switch (indicator.status) {
      case 'excellent': return sum + 4
      case 'good': return sum + 3
      case 'warning': return sum + 2
      case 'poor': return sum + 1
      default: return sum
    }
  }, 0) / (indicators.length * 4) * 100

  const getOverallHealthStatus = () => {
    if (overallHealth >= 80) return 'excellent'
    if (overallHealth >= 65) return 'good'
    if (overallHealth >= 50) return 'warning'
    return 'poor'
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Business Health</CardTitle>
          <Badge 
            variant="outline" 
            className={`flex items-center gap-1 ${getStatusColor(getOverallHealthStatus())}`}
          >
            {getStatusIcon(getOverallHealthStatus())}
            <span className="capitalize">{getOverallHealthStatus()}</span>
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Progress 
              value={overallHealth} 
              className="h-2"
            />
          </div>
          <span className="text-sm font-medium text-gray-600">
            {Math.round(overallHealth)}%
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-4">
          {indicators.map((indicator, index) => (
            <div key={indicator.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="text-gray-500">
                    {getIndicatorIcon(index)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {indicator.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {indicator.description}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getStatusColor(indicator.status)}`}
                  >
                    {indicator.value.toFixed(1)}%
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-1">
                <Progress 
                  value={Math.min(indicator.value, 100)} 
                  className="h-1.5"
                />
                {indicator.target && (
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Current: {indicator.value.toFixed(1)}%</span>
                    <span>Target: {indicator.target}%</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}