import { FilterOptions } from '@/components/analytics/filter-system'

export interface StrategyValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export function validateStrategyFilters(filters: FilterOptions): StrategyValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Rule 1: Bet status filter must be set to "all"
  if (filters.statuses && !filters.statuses.includes('All') && filters.statuses.length > 0) {
    errors.push('Bet status must be set to "All" to ensure fair strategy representation')
  }

  // Rule 2: Odds/spread/total/stake ranges must be cleared
  if (filters.oddsRange && (filters.oddsRange.min !== undefined || filters.oddsRange.max !== undefined)) {
    if (filters.oddsRange.min !== 0 || filters.oddsRange.max !== 0) {
      errors.push('Odds ranges must be cleared for strategy creation')
    }
  }

  if (filters.stakeRange && (filters.stakeRange.min !== undefined || filters.stakeRange.max !== undefined)) {
    if (filters.stakeRange.min !== 0 || filters.stakeRange.max !== 0) {
      errors.push('Stake ranges must be cleared for strategy creation')
    }
  }

  if (filters.spreadRange && (filters.spreadRange.min !== undefined || filters.spreadRange.max !== undefined)) {
    if (filters.spreadRange.min !== 0 || filters.spreadRange.max !== 0) {
      errors.push('Spread ranges must be cleared for strategy creation')
    }
  }

  if (filters.totalRange && (filters.totalRange.min !== undefined || filters.totalRange.max !== undefined)) {
    if (filters.totalRange.min !== 0 || filters.totalRange.max !== 0) {
      errors.push('Total ranges must be cleared for strategy creation')
    }
  }

  // Rule 3: Leagues filter: "All" OR exactly 1 specific league only (not both)
  const leagues = filters.leagues || []
  const hasAllLeagues = leagues.includes('All')
  const specificLeagues = leagues.filter(l => l !== 'All')

  if (!hasAllLeagues && specificLeagues.length !== 1) {
    errors.push('Strategy must either include all leagues or exactly one specific league')
  }
  
  if (hasAllLeagues && specificLeagues.length > 0) {
    errors.push('Strategy cannot have both "All" and specific leagues selected')
  }

  // Rule 4: Bet types filter: "All" OR exactly 1 specific bet type only (not multiple)
  const betTypes = filters.betTypes || []
  const hasAllBetTypes = betTypes.includes('All')
  const specificBetTypes = betTypes.filter(bt => bt !== 'All')

  if (!hasAllBetTypes && specificBetTypes.length !== 1) {
    errors.push('Strategy must either include all bet types or exactly one specific bet type')
  }
  
  if (hasAllBetTypes && specificBetTypes.length > 0) {
    errors.push('Strategy cannot have both "All" and specific bet types selected')
  }

  // Warnings for better strategy performance
  if (filters.betTypes && !filters.betTypes.includes('All') && filters.betTypes.length > 3) {
    warnings.push('Including many bet types may dilute strategy focus')
  }

  if (filters.sportsbooks && filters.sportsbooks.length > 5) {
    warnings.push('Including many sportsbooks may reduce strategy consistency')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

export function getFilterValidationMessage(filters: FilterOptions): string {
  const validation = validateStrategyFilters(filters)
  
  if (validation.isValid) {
    return 'Filters are valid for strategy creation'
  }

  return validation.errors.join('. ')
}

export function canCreateStrategy(filters: FilterOptions): boolean {
  return validateStrategyFilters(filters).isValid
}

export function getRequiredFilterChanges(filters: FilterOptions): Partial<FilterOptions> {
  const changes: Partial<FilterOptions> = {}

  // Fix status filter
  if (filters.statuses && !filters.statuses.includes('All') && filters.statuses.length > 0) {
    changes.statuses = ['All']
  }

  // Clear ranges by setting them to empty/default values
  if (filters.oddsRange && (filters.oddsRange.min !== 0 || filters.oddsRange.max !== 0)) {
    changes.oddsRange = { min: 0, max: 0 }
  }

  if (filters.stakeRange && (filters.stakeRange.min !== 0 || filters.stakeRange.max !== 0)) {
    changes.stakeRange = { min: 0, max: 0 }
  }

  if (filters.spreadRange && (filters.spreadRange.min !== 0 || filters.spreadRange.max !== 0)) {
    changes.spreadRange = { min: 0, max: 0 }
  }

  if (filters.totalRange && (filters.totalRange.min !== 0 || filters.totalRange.max !== 0)) {
    changes.totalRange = { min: 0, max: 0 }
  }

  // Fix leagues filter - require either "All" or exactly one specific league
  const leagues = filters.leagues || []
  const hasAllLeagues = leagues.includes('All')
  const specificLeagues = leagues.filter(l => l !== 'All')

  if (!hasAllLeagues && specificLeagues.length !== 1) {
    if (specificLeagues.length === 0) {
      // Default to "All" if no specific leagues
      changes.leagues = ['All']
    } else {
      // Keep only the first specific league
      changes.leagues = [specificLeagues[0]!]
    }
  } else if (hasAllLeagues && specificLeagues.length > 0) {
    // If both "All" and specific leagues are selected, default to "All" only
    changes.leagues = ['All']
  }

  // Fix bet types filter - require either "All" or exactly one specific bet type
  const betTypes = filters.betTypes || []
  const hasAllBetTypes = betTypes.includes('All')
  const specificBetTypes = betTypes.filter(bt => bt !== 'All')

  if (!hasAllBetTypes && specificBetTypes.length !== 1) {
    if (specificBetTypes.length === 0) {
      // Default to "All" if no specific bet types
      changes.betTypes = ['All']
    } else {
      // Keep only the first specific bet type
      changes.betTypes = [specificBetTypes[0]!]
    }
  } else if (hasAllBetTypes && specificBetTypes.length > 0) {
    // If both "All" and specific bet types are selected, default to "All" only
    changes.betTypes = ['All']
  }

  return changes
}