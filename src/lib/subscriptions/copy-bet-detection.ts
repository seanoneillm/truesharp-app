import { SubscriptionPick, CopyBetDetection } from '@/types/subscriptions'

export interface CopyBetMatch {
  originalBet: SubscriptionPick
  userBet: {
    id: string
    sport: string
    bet_type: string
    line_value?: number
    odds: number
    placed_at: string
    stake: number
    home_team?: string
    away_team?: string
  }
  isMatch: boolean
  confidence: 'high' | 'medium' | 'low'
  matchingCriteria: {
    sportMatch: boolean
    betTypeMatch: boolean
    lineVariance: number
    oddsVariance: number
    timeVariance: number
    isValidCopy: boolean
  }
}

export const COPY_BET_TOLERANCE = {
  lineVariance: 0.5, // ±0.5 points for spreads/totals
  oddsVariance: 10, // ±10 American odds
  timeWindow: 24 * 60, // 24 hours in minutes
  minTimeDifference: 1, // At least 1 minute after original
}

export function detectCopyBet(
  originalPick: SubscriptionPick,
  userBet: {
    id: string
    sport: string
    bet_type: string
    line_value?: number
    odds: number
    placed_at: string
    stake: number
    home_team?: string
    away_team?: string
  }
): CopyBetMatch {
  const originalBetData = originalPick.bet

  // Check sport match
  const sportMatch = originalBetData.sport.toLowerCase() === userBet.sport.toLowerCase()

  // Check bet type match
  const betTypeMatch = originalBetData.bet_type.toLowerCase() === userBet.bet_type.toLowerCase()

  // Check team match (if available)
  let teamMatch = true
  if (
    originalBetData.home_team &&
    originalBetData.away_team &&
    userBet.home_team &&
    userBet.away_team
  ) {
    teamMatch =
      (originalBetData.home_team.toLowerCase() === userBet.home_team.toLowerCase() &&
        originalBetData.away_team.toLowerCase() === userBet.away_team.toLowerCase()) ||
      (originalBetData.home_team.toLowerCase() === userBet.away_team.toLowerCase() &&
        originalBetData.away_team.toLowerCase() === userBet.home_team.toLowerCase())
  }

  // Calculate line variance
  let lineVariance = 0
  if (originalBetData.line_value && userBet.line_value) {
    lineVariance = Math.abs(originalBetData.line_value - userBet.line_value)
  }

  // Calculate odds variance
  const oddsVariance = Math.abs(originalBetData.odds - userBet.odds)

  // Calculate time variance (in minutes)
  const originalTime = new Date(originalPick.posted_at).getTime()
  const userTime = new Date(userBet.placed_at).getTime()
  const timeVariance = Math.abs(userTime - originalTime) / (1000 * 60)

  // Check if user bet was placed after original
  const placedAfterOriginal =
    userTime > originalTime + COPY_BET_TOLERANCE.minTimeDifference * 60 * 1000

  // Determine if it's a valid copy based on tolerances
  const isValidCopy =
    sportMatch &&
    betTypeMatch &&
    teamMatch &&
    lineVariance <= COPY_BET_TOLERANCE.lineVariance &&
    oddsVariance <= COPY_BET_TOLERANCE.oddsVariance &&
    timeVariance <= COPY_BET_TOLERANCE.timeWindow &&
    placedAfterOriginal

  // Determine confidence level
  let confidence: 'high' | 'medium' | 'low' = 'low'

  if (isValidCopy) {
    // High confidence: exact match on all criteria
    if (lineVariance === 0 && oddsVariance === 0 && timeVariance < 60) {
      confidence = 'high'
    }
    // Medium confidence: close match with minor variations
    else if (lineVariance <= 0.5 && oddsVariance <= 5 && timeVariance < 180) {
      confidence = 'medium'
    }
    // Low confidence: within tolerances but with variations
    else {
      confidence = 'low'
    }
  }

  return {
    originalBet: originalPick,
    userBet,
    isMatch: isValidCopy,
    confidence,
    matchingCriteria: {
      sportMatch,
      betTypeMatch,
      lineVariance,
      oddsVariance,
      timeVariance,
      isValidCopy,
    },
  }
}

export function batchDetectCopyBets(
  subscriptionPicks: SubscriptionPick[],
  userBets: Array<{
    id: string
    sport: string
    bet_type: string
    line_value?: number
    odds: number
    placed_at: string
    stake: number
    home_team?: string
    away_team?: string
  }>
): CopyBetMatch[] {
  const matches: CopyBetMatch[] = []

  // For each user bet, check against all subscription picks
  for (const userBet of userBets) {
    for (const pick of subscriptionPicks) {
      const match = detectCopyBet(pick, userBet)
      if (match.isMatch) {
        matches.push(match)
      }
    }
  }

  // Remove duplicates and prioritize higher confidence matches
  const uniqueMatches = matches.reduce((acc, match) => {
    const existingMatch = acc.find(m => m.userBet.id === match.userBet.id)

    if (!existingMatch) {
      acc.push(match)
    } else if (
      getConfidenceScore(match.confidence) > getConfidenceScore(existingMatch.confidence)
    ) {
      const index = acc.findIndex(m => m.userBet.id === match.userBet.id)
      acc[index] = match
    }

    return acc
  }, [] as CopyBetMatch[])

  return uniqueMatches.sort((a, b) => {
    // Sort by confidence first, then by time variance (closer matches first)
    if (a.confidence !== b.confidence) {
      return getConfidenceScore(b.confidence) - getConfidenceScore(a.confidence)
    }
    return a.matchingCriteria.timeVariance - b.matchingCriteria.timeVariance
  })
}

function getConfidenceScore(confidence: 'high' | 'medium' | 'low'): number {
  switch (confidence) {
    case 'high':
      return 3
    case 'medium':
      return 2
    case 'low':
      return 1
    default:
      return 0
  }
}

export function flagCopyBet(
  betId: string,
  originalPickId: string,
  confidence: 'high' | 'medium' | 'low'
): Promise<{ success: boolean; message: string }> {
  // This would typically make an API call to flag the bet as a copy
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        success: true,
        message: `Bet ${betId} flagged as copy of pick ${originalPickId} with ${confidence} confidence`,
      })
    }, 500)
  })
}

export function analyzeCopyBetPerformance(
  userBets: Array<{
    id: string
    is_copy_bet: boolean
    status: string
    profit?: number
    stake: number
    source_strategy_id?: string
  }>
): {
  copied: {
    totalBets: number
    wonBets: number
    winRate: number
    totalProfit: number
    roi: number
  }
  original: {
    totalBets: number
    wonBets: number
    winRate: number
    totalProfit: number
    roi: number
  }
  comparison: {
    winRateDifference: number
    roiDifference: number
    profitDifference: number
  }
} {
  const copiedBets = userBets.filter(bet => bet.is_copy_bet)
  const originalBets = userBets.filter(bet => !bet.is_copy_bet)

  const analyzeBets = (bets: typeof userBets) => {
    const totalBets = bets.length
    const settledBets = bets.filter(bet => ['won', 'lost'].includes(bet.status))
    const wonBets = bets.filter(bet => bet.status === 'won').length
    const winRate = settledBets.length > 0 ? (wonBets / settledBets.length) * 100 : 0
    const totalProfit = bets.reduce((sum, bet) => sum + (bet.profit || -bet.stake), 0)
    const totalStake = bets.reduce((sum, bet) => sum + bet.stake, 0)
    const roi = totalStake > 0 ? (totalProfit / totalStake) * 100 : 0

    return {
      totalBets,
      wonBets,
      winRate,
      totalProfit,
      roi,
    }
  }

  const copiedAnalysis = analyzeBets(copiedBets)
  const originalAnalysis = analyzeBets(originalBets)

  return {
    copied: copiedAnalysis,
    original: originalAnalysis,
    comparison: {
      winRateDifference: copiedAnalysis.winRate - originalAnalysis.winRate,
      roiDifference: copiedAnalysis.roi - originalAnalysis.roi,
      profitDifference: copiedAnalysis.totalProfit - originalAnalysis.totalProfit,
    },
  }
}

export function shouldExcludeFromMonetization(bet: {
  is_copy_bet: boolean
  source_strategy_id?: string
}): boolean {
  // Copy bets should be excluded from seller's monetization performance
  // This ensures sellers can't game the system by subscribing to others and copying
  return bet.is_copy_bet && !!bet.source_strategy_id
}
