import { ApiError } from './client'

// Error types enum
export enum ErrorTypes {
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT = 'RATE_LIMIT',
  SERVER_ERROR = 'SERVER_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SUBSCRIPTION_REQUIRED = 'SUBSCRIPTION_REQUIRED',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
}

// Error message mapping
export const ErrorMessages = {
  [ErrorTypes.AUTHENTICATION]: 'Please log in to continue',
  [ErrorTypes.AUTHORIZATION]: "You don't have permission to perform this action",
  [ErrorTypes.VALIDATION]: 'Please check your input and try again',
  [ErrorTypes.NOT_FOUND]: 'The requested resource was not found',
  [ErrorTypes.RATE_LIMIT]: 'Too many requests. Please try again later',
  [ErrorTypes.SERVER_ERROR]: 'Something went wrong on our end. Please try again',
  [ErrorTypes.NETWORK_ERROR]: 'Network error. Please check your connection',
  [ErrorTypes.SUBSCRIPTION_REQUIRED]: 'This feature requires an active subscription',
  [ErrorTypes.INSUFFICIENT_FUNDS]: 'Insufficient funds for this transaction',
  [ErrorTypes.DUPLICATE_ENTRY]: 'This entry already exists',
}

// Enhanced API Error class
export class EnhancedApiError extends ApiError {
  public type: ErrorTypes
  public userMessage: string
  public originalError?: any

  constructor(
    type: ErrorTypes,
    message: string,
    userMessage?: string,
    status?: number,
    code?: string,
    originalError?: any
  ) {
    super(message, status, code)
    this.type = type
    this.userMessage = userMessage || ErrorMessages[type] || message
    this.originalError = originalError
  }
}

// Error classification helper
export function classifyError(error: any): EnhancedApiError {
  // Network errors
  if (!navigator.onLine) {
    return new EnhancedApiError(
      ErrorTypes.NETWORK_ERROR,
      'Network connection lost',
      'Please check your internet connection'
    )
  }

  // Supabase specific errors
  if (error?.code) {
    switch (error.code) {
      case 'PGRST116': // Row not found
        return new EnhancedApiError(
          ErrorTypes.NOT_FOUND,
          error.message,
          'The requested item was not found'
        )

      case 'PGRST301': // JWT expired
      case '401':
        return new EnhancedApiError(
          ErrorTypes.AUTHENTICATION,
          error.message,
          'Your session has expired. Please log in again'
        )

      case '403':
        return new EnhancedApiError(
          ErrorTypes.AUTHORIZATION,
          error.message,
          "You don't have permission to perform this action"
        )

      case '409':
        return new EnhancedApiError(
          ErrorTypes.DUPLICATE_ENTRY,
          error.message,
          'This item already exists'
        )

      case '429':
        return new EnhancedApiError(
          ErrorTypes.RATE_LIMIT,
          error.message,
          'Too many requests. Please wait a moment and try again'
        )

      case '23505': // Unique constraint violation
        return new EnhancedApiError(
          ErrorTypes.DUPLICATE_ENTRY,
          error.message,
          'This item already exists'
        )

      case '23503': // Foreign key violation
        return new EnhancedApiError(
          ErrorTypes.VALIDATION,
          error.message,
          'Invalid reference. Please check your input'
        )

      case '23514': // Check constraint violation
        return new EnhancedApiError(
          ErrorTypes.VALIDATION,
          error.message,
          'The provided data is invalid'
        )
    }
  }

  // HTTP status codes
  if (error?.status) {
    switch (error.status) {
      case 400:
        return new EnhancedApiError(
          ErrorTypes.VALIDATION,
          error.message || 'Bad request',
          'Please check your input and try again'
        )

      case 401:
        return new EnhancedApiError(
          ErrorTypes.AUTHENTICATION,
          error.message || 'Unauthorized',
          'Please log in to continue'
        )

      case 403:
        return new EnhancedApiError(
          ErrorTypes.AUTHORIZATION,
          error.message || 'Forbidden',
          "You don't have permission to perform this action"
        )

      case 404:
        return new EnhancedApiError(
          ErrorTypes.NOT_FOUND,
          error.message || 'Not found',
          'The requested item was not found'
        )

      case 429:
        return new EnhancedApiError(
          ErrorTypes.RATE_LIMIT,
          error.message || 'Too many requests',
          'Too many requests. Please try again later'
        )

      case 500:
      case 502:
      case 503:
      case 504:
        return new EnhancedApiError(
          ErrorTypes.SERVER_ERROR,
          error.message || 'Server error',
          'Something went wrong on our end. Please try again'
        )
    }
  }

  // Custom business logic errors
  if (error?.message) {
    if (error.message.includes('subscription required')) {
      return new EnhancedApiError(
        ErrorTypes.SUBSCRIPTION_REQUIRED,
        error.message,
        'This feature requires an active subscription'
      )
    }

    if (error.message.includes('insufficient funds')) {
      return new EnhancedApiError(
        ErrorTypes.INSUFFICIENT_FUNDS,
        error.message,
        'Insufficient funds for this transaction'
      )
    }

    if (error.message.includes('already exists')) {
      return new EnhancedApiError(
        ErrorTypes.DUPLICATE_ENTRY,
        error.message,
        'This item already exists'
      )
    }
  }

  // Default to server error
  return new EnhancedApiError(
    ErrorTypes.SERVER_ERROR,
    error?.message || 'Unknown error occurred',
    'Something went wrong. Please try again'
  )
}

// Retry configuration
export interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  retryableErrors: ErrorTypes[]
}

const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  retryableErrors: [ErrorTypes.NETWORK_ERROR, ErrorTypes.SERVER_ERROR, ErrorTypes.RATE_LIMIT],
}

// Exponential backoff delay calculation
function calculateDelay(attempt: number, baseDelay: number, maxDelay: number): number {
  const delay = baseDelay * Math.pow(2, attempt - 1)
  return Math.min(delay, maxDelay)
}

// Retry wrapper for API calls
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...defaultRetryConfig, ...config }
  let lastError: EnhancedApiError

  for (let attempt = 1; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      const classifiedError = classifyError(error)
      lastError = classifiedError

      // Don't retry if error is not retryable
      if (!finalConfig.retryableErrors.includes(classifiedError.type)) {
        throw classifiedError
      }

      // Don't retry on last attempt
      if (attempt === finalConfig.maxRetries) {
        throw classifiedError
      }

      // Calculate delay and wait
      const delay = calculateDelay(attempt, finalConfig.baseDelay, finalConfig.maxDelay)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  // This should never be reached, but TypeScript requires it
  throw lastError!
}

// Error boundary helper for React components
export function handleApiError(error: any, fallback?: string): string {
  const classifiedError = classifyError(error)
  return classifiedError.userMessage || fallback || 'Something went wrong'
}

// Validation error helper
export interface ValidationError {
  field: string
  message: string
  code?: string | undefined
}

export function createValidationError(
  field: string,
  message: string,
  code?: string
): ValidationError {
  return { field, message, code }
}

export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 1) {
    return errors[0]?.message ?? 'Unknown validation error'
  }

  return (
    'Please correct the following errors:\n' +
    errors.map(error => `• ${error.field}: ${error.message}`).join('\n')
  )
}

// Error reporting helper (for analytics/monitoring)
export function reportError(error: EnhancedApiError, context?: Record<string, any>) {
  // In a real app, this would send to error tracking service like Sentry
  console.error('API Error:', {
    type: error.type,
    message: error.message,
    userMessage: error.userMessage,
    status: error.status,
    code: error.code,
    context,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  })

  // Could also send to analytics service
  if (typeof window !== 'undefined' && (window as any).gtag) {
    ;(window as any).gtag('event', 'exception', {
      description: error.type,
      fatal: false,
    })
  }
}

// Common error handlers for specific scenarios
export const ErrorHandlers = {
  authentication: (error: any) => {
    const classifiedError = classifyError(error)
    if (classifiedError.type === ErrorTypes.AUTHENTICATION) {
      // Redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    return classifiedError
  },

  subscription: (error: any) => {
    const classifiedError = classifyError(error)
    if (classifiedError.type === ErrorTypes.SUBSCRIPTION_REQUIRED) {
      // Could trigger upgrade modal
      return new EnhancedApiError(
        ErrorTypes.SUBSCRIPTION_REQUIRED,
        classifiedError.message,
        'Upgrade to Pro to access this feature'
      )
    }
    return classifiedError
  },

  payment: (error: any) => {
    const classifiedError = classifyError(error)
    if (classifiedError.type === ErrorTypes.INSUFFICIENT_FUNDS) {
      return new EnhancedApiError(
        ErrorTypes.INSUFFICIENT_FUNDS,
        classifiedError.message,
        'Payment failed. Please check your payment method and try again'
      )
    }
    return classifiedError
  },
}
