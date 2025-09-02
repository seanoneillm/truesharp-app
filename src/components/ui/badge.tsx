import * as React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline'
  size?: 'sm' | 'default' | 'lg'
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseClasses =
      'inline-flex items-center rounded-full border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'

    const variants = {
      default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
      secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
      destructive:
        'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
      success: 'border-transparent bg-green-500 text-white hover:bg-green-600',
      warning: 'border-transparent bg-yellow-500 text-white hover:bg-yellow-600',
      outline: 'text-foreground border-border',
    }

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      default: 'px-2.5 py-0.5 text-xs',
      lg: 'px-3 py-1 text-sm',
    }

    return (
      <div
        ref={ref}
        className={cn(baseClasses, variants[variant], sizes[size], className)}
        {...props}
      />
    )
  }
)
Badge.displayName = 'Badge'

// Sports-specific badges
export const SportBadge: React.FC<{ sport: string; className?: string }> = ({
  sport,
  className,
}) => {
  const sportColors = {
    NFL: 'bg-green-500 text-white',
    NBA: 'bg-orange-500 text-white',
    MLB: 'bg-blue-500 text-white',
    NHL: 'bg-purple-500 text-white',
    Soccer: 'bg-green-600 text-white',
    Tennis: 'bg-yellow-500 text-white',
    Golf: 'bg-green-400 text-white',
    MMA: 'bg-red-500 text-white',
  }

  return (
    <Badge
      className={cn(
        sportColors[sport as keyof typeof sportColors] || 'bg-gray-500 text-white',
        className
      )}
    >
      {sport}
    </Badge>
  )
}

// Status-specific badges
export const StatusBadge: React.FC<{
  status: 'won' | 'lost' | 'pending' | 'void' | 'cancelled'
  className?: string
}> = ({ status, className }) => {
  const statusConfig = {
    won: { variant: 'success' as const, label: 'Won' },
    lost: { variant: 'destructive' as const, label: 'Lost' },
    pending: { variant: 'warning' as const, label: 'Pending' },
    void: { variant: 'secondary' as const, label: 'Void' },
    cancelled: { variant: 'outline' as const, label: 'Cancelled' },
  }

  const config = statusConfig[status]

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  )
}

// Verification badge
export const VerificationBadge: React.FC<{
  verified: boolean
  className?: string
}> = ({ verified, className }) => {
  if (!verified) return null

  return (
    <Badge variant="success" className={cn('flex items-center gap-1', className)}>
      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
      Verified
    </Badge>
  )
}

export { Badge }
