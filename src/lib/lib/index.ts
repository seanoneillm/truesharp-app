// Data Foundation - Complete Index
// src/lib/index.ts

// Core utilities
export * from './constants'
export * from './mock-data'
export * from './types'
export * from './utils'

// Specialized utilities
export * from './analytics/calculations'
export * from './formatters'
export * from './validations'

// Custom hooks
export * from './hooks'

// Re-export commonly used functions for convenience
export {
  calculateROI,
  cn,
  formatCurrency,
  formatOdds,
  formatPercentage,
  isValidEmail,
  isValidUsername,
  timeAgo,
} from './utils'

export { calculateKellyCriterion } from './analytics/calculations'

export {
  formatBetStatus,
  formatConfidence,
  formatRecord,
  formatSport,
  formatStreak,
} from './formatters'

export { validateForm, validateOdds, validateStake } from './validations'
export type { ValidationResult } from './validations'

// Type guards and utility functions
// (Add more exports here as needed)
