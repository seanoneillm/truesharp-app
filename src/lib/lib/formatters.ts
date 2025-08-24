// Data formatting utilities
// src/lib/formatters.ts

/**
 * Format currency with proper symbols and decimals
 */
export function formatCurrency(
  amount: number, 
  currency: string = 'USD',
  showCents: boolean = true
): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0,
  })
  
  return formatter.format(amount)
}

/**
 * Format percentage with proper sign and decimals
 */
export function formatPercentage(
  value: number, 
  decimals: number = 1,
  showSign: boolean = true
): string {
  const sign = showSign && value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(decimals)}%`
}

/**
 * Format ROI with color coding context
 */
export function formatROI(
  value: number, 
  decimals: number = 1
): {
  formatted: string
  colorClass: string
  isPositive: boolean
} {
  const formatted = formatPercentage(value, decimals)
  const isPositive = value >= 0
  const colorClass = isPositive ? 'text-green-600' : 'text-red-600'
  
  return { formatted, colorClass, isPositive }
}

/**
 * Format American odds with proper sign
 */
export function formatOdds(odds: number): string {
  if (odds >= 0) {
    return `+${odds}`
  }
  return odds.toString()
}

/**
 * Format odds with implied probability
 */
export function formatOddsWithProbability(odds: number): {
  odds: string
  probability: string
  impliedProb: number
} {
  const formattedOdds = formatOdds(odds)
  const impliedProb = odds > 0 
    ? 100 / (odds + 100) 
    : Math.abs(odds) / (Math.abs(odds) + 100)
  const probability = `${(impliedProb * 100).toFixed(1)}%`
  
  return { odds: formattedOdds, probability, impliedProb }
}

/**
 * Format large numbers with appropriate suffixes
 */
export function formatNumber(
  num: number, 
  decimals: number = 1
): string {
  if (Math.abs(num) >= 1e9) {
    return `${(num / 1e9).toFixed(decimals)}B`
  }
  if (Math.abs(num) >= 1e6) {
    return `${(num / 1e6).toFixed(decimals)}M`
  }
  if (Math.abs(num) >= 1e3) {
    return `${(num / 1e3).toFixed(decimals)}K`
  }
  return num.toFixed(decimals)
}

/**
 * Format time ago (relative time)
 */
export function formatTimeAgo(date: Date | string): string {
  const now = new Date()
  const targetDate = typeof date === 'string' ? new Date(date) : date
  const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w ago`
  
  return targetDate.toLocaleDateString()
}

/**
 * Format date for display
 */
export function formatDate(
  date: Date | string, 
  options: Intl.DateTimeFormatOptions = {}
): string {
  const targetDate = typeof date === 'string' ? new Date(date) : date
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  }
  
  return targetDate.toLocaleDateString('en-US', defaultOptions)
}

/**
 * Format date and time
 */
export function formatDateTime(
  date: Date | string,
  includeSeconds: boolean = false
): string {
  const targetDate = typeof date === 'string' ? new Date(date) : date
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    ...(includeSeconds && { second: '2-digit' })
  }
  
  return targetDate.toLocaleDateString('en-US', options)
}

/**
 * Format time only
 */
export function formatTime(
  date: Date | string,
  includeSeconds: boolean = false
): string {
  const targetDate = typeof date === 'string' ? new Date(date) : date
  
  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    ...(includeSeconds && { second: '2-digit' })
  }
  
  return targetDate.toLocaleTimeString('en-US', options)
}

/**
 * Format win/loss record
 */
export function formatRecord(wins: number, losses: number, pushes: number = 0): string {
  if (pushes > 0) {
    return `${wins}-${losses}-${pushes}`
  }
  return `${wins}-${losses}`
}

/**
 * Format units with proper sign and precision
 */
export function formatUnits(units: number, decimals: number = 1): string {
  const sign = units >= 0 ? '+' : ''
  return `${sign}${units.toFixed(decimals)}u`
}

/**
 * Format streak information
 */
export function formatStreak(
  streakType: 'win' | 'loss', 
  count: number
): {
  text: string
  shortText: string
  colorClass: string
} {
  const isWinStreak = streakType === 'win'
  const text = `${count} ${streakType} streak`
  const shortText = `${count}${isWinStreak ? 'W' : 'L'}`
  const colorClass = isWinStreak ? 'text-green-600' : 'text-red-600'
  
  return { text, shortText, colorClass }
}

/**
 * Format bet description for display
 */
export function formatBetDescription(
  betType: string,
  description: string,
  teams?: { home: string; away: string }
): string {
  switch (betType.toLowerCase()) {
    case 'spread':
      return description.includes('vs') ? description : 
        teams ? `${teams.away} ${description} vs ${teams.home}` : description
    
    case 'total':
    case 'over/under':
      return description.startsWith('Over') || description.startsWith('Under') ? 
        description : `${description} Total`
    
    case 'moneyline':
      return description.includes('ML') ? description : `${description} ML`
    
    case 'prop':
      return description
    
    default:
      return description
  }
}

/**
 * Format confidence level
 */
export function formatConfidence(
  level: number,
  max: number = 5
): {
  stars: string
  text: string
  percentage: number
} {
  const percentage = (level / max) * 100
  const stars = '★'.repeat(level) + '☆'.repeat(max - level)
  
  let text = 'Low'
  if (percentage >= 80) text = 'Very High'
  else if (percentage >= 60) text = 'High'
  else if (percentage >= 40) text = 'Medium'
  
  return { stars, text, percentage }
}

/**
 * Format subscription tier
 */
export function formatTier(tier: string): {
  name: string
  displayName: string
  colorClass: string
  badgeClass: string
} {
  const tierConfig = {
    free: {
      name: 'free',
      displayName: 'Free',
      colorClass: 'text-gray-600',
      badgeClass: 'bg-gray-100 text-gray-800'
    },
    bronze: {
      name: 'bronze',
      displayName: 'Bronze',
      colorClass: 'text-amber-600',
      badgeClass: 'bg-amber-100 text-amber-800'
    },
    silver: {
      name: 'silver',
      displayName: 'Silver',
      colorClass: 'text-gray-600',
      badgeClass: 'bg-gray-100 text-gray-800'
    },
    premium: {
      name: 'premium',
      displayName: 'Premium',
      colorClass: 'text-purple-600',
      badgeClass: 'bg-purple-100 text-purple-800'
    }
  }
  
  return tierConfig[tier as keyof typeof tierConfig] || tierConfig.free
}

/**
 * Format bet status with appropriate styling
 */
export function formatBetStatus(status: string): {
  text: string
  colorClass: string
  badgeClass: string
  icon: string
} {
  const statusConfig = {
    pending: {
      text: 'Pending',
      colorClass: 'text-yellow-600',
      badgeClass: 'bg-yellow-100 text-yellow-800',
      icon: '⏳'
    },
    won: {
      text: 'Won',
      colorClass: 'text-green-600',
      badgeClass: 'bg-green-100 text-green-800',
      icon: '✅'
    },
    lost: {
      text: 'Lost',
      colorClass: 'text-red-600',
      badgeClass: 'bg-red-100 text-red-800',
      icon: '❌'
    },
    void: {
      text: 'Void',
      colorClass: 'text-gray-600',
      badgeClass: 'bg-gray-100 text-gray-800',
      icon: '⚪'
    },
    cancelled: {
      text: 'Cancelled',
      colorClass: 'text-gray-600',
      badgeClass: 'bg-gray-100 text-gray-800',
      icon: '🚫'
    }
  }
  
  return statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
}

/**
 * Format sport name with emoji
 */
export function formatSport(sport: string): {
  name: string
  emoji: string
  colorClass: string
} {
  const sportConfig = {
    NFL: { name: 'NFL', emoji: '🏈', colorClass: 'text-green-600' },
    NBA: { name: 'NBA', emoji: '🏀', colorClass: 'text-orange-600' },
    MLB: { name: 'MLB', emoji: '⚾', colorClass: 'text-blue-600' },
    NHL: { name: 'NHL', emoji: '🏒', colorClass: 'text-purple-600' },
    SOCCER: { name: 'Soccer', emoji: '⚽', colorClass: 'text-green-600' },
    TENNIS: { name: 'Tennis', emoji: '🎾', colorClass: 'text-yellow-600' },
    GOLF: { name: 'Golf', emoji: '⛳', colorClass: 'text-green-600' },
    MMA: { name: 'MMA', emoji: '🥊', colorClass: 'text-red-600' }
  }
  
  return sportConfig[sport as keyof typeof sportConfig] || 
    { name: sport, emoji: '🏆', colorClass: 'text-gray-600' }
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * Format phone number
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  
  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  }
  
  return phone
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

/**
 * Format username (ensure @ prefix)
 */
export function formatUsername(username: string): string {
  return username.startsWith('@') ? username : `@${username}`
}

/**
 * Format team names for display
 */
export function formatTeamMatchup(
  homeTeam: string, 
  awayTeam: string, 
  format: 'short' | 'full' = 'short'
): string {
  if (format === 'short') {
    // Extract abbreviations if available, otherwise use first 3 letters
    const home = homeTeam.length > 3 ? homeTeam.slice(0, 3).toUpperCase() : homeTeam
    const away = awayTeam.length > 3 ? awayTeam.slice(0, 3).toUpperCase() : awayTeam
    return `${away} @ ${home}`
  }
  
  return `${awayTeam} @ ${homeTeam}`
}
