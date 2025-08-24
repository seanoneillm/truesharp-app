import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SpinnerProps {
  size?: 'sm' | 'default' | 'lg' | 'xl'
  className?: string
  color?: 'primary' | 'white' | 'gray'
}

const Spinner: React.FC<SpinnerProps> = ({ 
  size = 'default', 
  className,
  color = 'primary'
}) => {
  const sizes = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  }

  const colors = {
    primary: 'text-primary',
    white: 'text-white',
    gray: 'text-gray-500',
  }

  return (
    <svg
      className={cn(
        'animate-spin',
        sizes[size],
        colors[color],
        className
      )}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

// Loading overlay component
export const LoadingOverlay: React.FC<{
  isLoading: boolean
  children: React.ReactNode
  className?: string
}> = ({ isLoading, children, className }) => {
  return (
    <div className={cn('relative', className)}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center space-y-2">
            <Spinner size="lg" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      )}
    </div>
  )
}

// Inline loading component
export const InlineLoading: React.FC<{
  text?: string
  size?: SpinnerProps['size']
  className?: string
}> = ({ text = 'Loading...', size = 'default', className }) => {
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <Spinner size={size} />
      <span className="text-sm text-muted-foreground">{text}</span>
    </div>
  )
}

// Page loading component
export const PageLoading: React.FC<{
  text?: string
}> = ({ text = 'Loading page...' }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <Spinner size="xl" />
      <div className="text-center">
        <h3 className="text-lg font-medium">{text}</h3>
        <p className="text-sm text-muted-foreground mt-2">Please wait while we load your content</p>
      </div>
    </div>
  )
}

export { Spinner }