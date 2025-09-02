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
  calculateWinRate,
  cn,
  formatCurrency,
  formatOdds,
  formatPercentage,
  timeAgo,
  validateEmail,
  validatePassword,
  validateUsername,
} from './utils'

export {
  americanToDecimal,
  calculateCLV,
  calculateKellyCriterion,
  calculatePayout,
  calculateProfit,
  oddsToImpliedProbability,
} from './analytics/calculations'

export {
  formatBetStatus,
  formatConfidence,
  formatRecord,
  formatSport,
  formatStreak,
} from './formatters'

export { validateForm, validateOdds, validateStake, ValidationResult } from './validations'

// Type guards and utility functions
// (Add more exports here as needed)
