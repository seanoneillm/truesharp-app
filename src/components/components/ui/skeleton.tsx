import * as React from 'react'
import { cn } from '@/lib/utils'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'animate-pulse rounded-md bg-muted',
          className
        )}
        {...props}
      />
    )
  }
)
Skeleton.displayName = 'Skeleton'

// Preset skeleton components for common use cases
export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('space-y-3 p-6 border rounded-lg', className)}>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-20 w-full" />
      <div className="flex space-x-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  )
}

export const SkeletonTable: React.FC<{ 
  rows?: number
  columns?: number
  className?: string 
}> = ({ rows = 5, columns = 4, className }) => {
  return (
    <div className={cn('space-y-2', className)}>
      {/* Header */}
      <div className="flex space-x-4 p-4 border-b">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4 p-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export const SkeletonChart: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-end space-x-2 h-40">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton 
            key={i} 
            className="flex-1 rounded-sm" 
            style={{ height: `${Math.random() * 80 + 20}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-8" />
        ))}
      </div>
    </div>
  )
}

export const SkeletonAvatar: React.FC<{ 
  size?: 'sm' | 'default' | 'lg'
  className?: string 
}> = ({ size = 'default', className }) => {
  const sizes = {
    sm: 'h-8 w-8',
    default: 'h-10 w-10',
    lg: 'h-12 w-12',
  }

  return (
    <Skeleton 
      className={cn(
        'rounded-full',
        sizes[size],
        className
      )} 
    />
  )
}

export const SkeletonText: React.FC<{ 
  lines?: number
  className?: string 
}> = ({ lines = 3, className }) => {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          className={cn(
            'h-4',
            i === lines - 1 ? 'w-3/4' : 'w-full'
          )} 
        />
      ))}
    </div>
  )
}

// Dashboard-specific skeleton
export const SkeletonStats: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4', className)}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="p-6 border rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-6 rounded" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  )
}

// Marketplace-specific skeleton
export const SkeletonSellerCard: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('p-6 border rounded-lg space-y-4', className)}>
      <div className="flex items-center space-x-3">
        <SkeletonAvatar />
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center space-y-1">
          <Skeleton className="h-6 w-12 mx-auto" />
          <Skeleton className="h-3 w-8 mx-auto" />
        </div>
        <div className="text-center space-y-1">
          <Skeleton className="h-6 w-12 mx-auto" />
          <Skeleton className="h-3 w-8 mx-auto" />
        </div>
        <div className="text-center space-y-1">
          <Skeleton className="h-6 w-12 mx-auto" />
          <Skeleton className="h-3 w-8 mx-auto" />
        </div>
      </div>
      <SkeletonText lines={2} />
      <div className="flex space-x-2">
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 flex-1" />
      </div>
    </div>
  )
}

export { Skeleton }