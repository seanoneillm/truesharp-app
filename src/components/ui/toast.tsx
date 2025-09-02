import * as React from 'react'
import { cn } from '@/lib/utils'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'

export interface Toast {
  id: string
  title?: string
  description?: string
  action?: React.ReactNode
  variant?: 'default' | 'success' | 'destructive' | 'warning'
  duration?: number
}

interface ToastProps extends Omit<Toast, 'id'> {
  onClose: () => void
}

const Toast: React.FC<ToastProps> = ({
  title,
  description,
  action,
  variant = 'default',
  onClose,
}) => {
  const getIcon = () => {
    switch (variant) {
      case 'success':
        return <CheckCircle className="h-5 w-5" />
      case 'destructive':
        return <AlertCircle className="h-5 w-5" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />
      default:
        return <Info className="h-5 w-5" />
    }
  }

  const getVariantClasses = () => {
    switch (variant) {
      case 'success':
        return 'border-green-200 bg-green-50 text-green-900'
      case 'destructive':
        return 'border-red-200 bg-red-50 text-red-900'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 text-yellow-900'
      default:
        return 'border-blue-200 bg-blue-50 text-blue-900'
    }
  }

  const getIconColor = () => {
    switch (variant) {
      case 'success':
        return 'text-green-400'
      case 'destructive':
        return 'text-red-400'
      case 'warning':
        return 'text-yellow-400'
      default:
        return 'text-blue-400'
    }
  }

  return (
    <div
      className={cn(
        'pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg border shadow-lg',
        getVariantClasses()
      )}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className={cn('flex-shrink-0', getIconColor())}>{getIcon()}</div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            {title && <p className="text-sm font-medium">{title}</p>}
            {description && <p className={cn('text-sm', title ? 'mt-1' : '')}>{description}</p>}
            {action && <div className="mt-3">{action}</div>}
          </div>
          <div className="ml-4 flex flex-shrink-0">
            <button
              className="inline-flex rounded-md hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Toast Container
interface ToastContainerProps {
  toasts: Toast[]
  onRemoveToast: (id: string) => void
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemoveToast }) => {
  return (
    <div className="pointer-events-none fixed right-0 top-0 z-50 w-full max-w-sm space-y-4 p-4 sm:p-6">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={() => onRemoveToast(toast.id)} />
      ))}
    </div>
  )
}

// Individual Toast Item with auto-dismiss
interface ToastItemProps {
  toast: Toast
  onRemove: () => void
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = React.useState(false)

  // Auto-dismiss timer
  React.useEffect(() => {
    const duration = toast.duration ?? 5000

    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(onRemove, 300) // Wait for exit animation
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [toast.duration, onRemove])

  // Entry animation
  React.useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div
      className={cn(
        'transform transition-all duration-300 ease-in-out',
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      )}
    >
      <Toast
        title={toast.title}
        description={toast.description}
        action={toast.action}
        variant={toast.variant}
        onClose={() => {
          setIsVisible(false)
          setTimeout(onRemove, 300)
        }}
      />
    </div>
  )
}

// Toast Hook
interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  removeAllToasts: () => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const addToast = React.useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { ...toast, id }])
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const removeAllToasts = React.useCallback(() => {
    setToasts([])
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, removeAllToasts }}>
      {children}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// Convenience functions
export const toast = {
  success: (message: string, options?: Partial<Omit<Toast, 'id' | 'variant'>>) => {
    // This will be implemented with the hook in components
    console.log('Success toast:', message, options)
  },
  error: (message: string, options?: Partial<Omit<Toast, 'id' | 'variant'>>) => {
    console.log('Error toast:', message, options)
  },
  warning: (message: string, options?: Partial<Omit<Toast, 'id' | 'variant'>>) => {
    console.log('Warning toast:', message, options)
  },
  info: (message: string, options?: Partial<Omit<Toast, 'id' | 'variant'>>) => {
    console.log('Info toast:', message, options)
  },
}

export { Toast }
