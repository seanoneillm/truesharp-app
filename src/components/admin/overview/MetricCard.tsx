import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  LucideIcon 
} from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: {
    value: number
    label: string
    direction: 'up' | 'down' | 'neutral'
  }
  icon?: LucideIcon
  iconColor?: string
  status?: 'success' | 'warning' | 'danger' | 'neutral'
  onClick?: () => void
}

export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  iconColor = 'text-blue-600',
  status = 'neutral',
  onClick
}: MetricCardProps) {
  const getTrendIcon = () => {
    switch (trend?.direction) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-600" />
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-600" />
      default:
        return <Minus className="h-3 w-3 text-gray-400" />
    }
  }

  const getTrendColor = () => {
    switch (trend?.direction) {
      case 'up':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'down':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'border-l-green-500'
      case 'warning':
        return 'border-l-yellow-500'
      case 'danger':
        return 'border-l-red-500'
      default:
        return 'border-l-blue-500'
    }
  }

  return (
    <Card 
      className={`transition-all duration-200 hover:shadow-md border-l-4 ${getStatusColor()} ${
        onClick ? 'cursor-pointer hover:scale-[1.02]' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {Icon && (
                <div className={`flex-shrink-0 ${iconColor}`}>
                  <Icon className="h-4 w-4" />
                </div>
              )}
              <p className="text-sm font-medium text-gray-600 truncate">{title}</p>
            </div>
            
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-gray-900">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </p>
              
              {trend && (
                <Badge 
                  variant="outline" 
                  className={`text-xs px-2 py-0.5 flex items-center gap-1 ${getTrendColor()}`}
                >
                  {getTrendIcon()}
                  <span>{trend.value > 0 ? '+' : ''}{trend.value}%</span>
                </Badge>
              )}
            </div>
            
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
            
            {trend?.label && (
              <p className="text-xs text-gray-400 mt-1">{trend.label}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}