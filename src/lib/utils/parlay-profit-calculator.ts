/**
 * Parlay-aware profit calculation utility
 * 
 * Handles profit calculation for both single bets and parlays:
 * - Single bets: Calculate profit per bet as usual
 * - Parlays: Calculate profit based on all-or-nothing logic
 */

export interface BetData {
  id: string
  parlay_id?: string | null
  is_parlay: boolean
  status: string
  outcome?: string
  stake: number
  potential_payout: number
  odds: number // American odds
  profit?: number | null
}

/**
 * Convert American odds to decimal odds
 */
function americanToDecimal(americanOdds: number): number {
  if (americanOdds > 0) {
    return (americanOdds / 100) + 1
  } else {
    return (100 / Math.abs(americanOdds)) + 1
  }
}

/**
 * Determine if a bet is settled and what the outcome is
 */
function getBetOutcome(bet: BetData): 'win' | 'loss' | 'void' | 'pending' {
  const statusLower = bet.status?.toLowerCase()
  const outcomeLower = bet.outcome?.toLowerCase()

  // Handle completed status with outcome
  if (statusLower === 'completed') {
    if (outcomeLower === 'win' || outcomeLower === 'won') return 'win'
    if (outcomeLower === 'loss' || outcomeLower === 'lost' || outcomeLower === 'lose') return 'loss'
    if (outcomeLower === 'push' || outcomeLower === 'void') return 'void'
    if (outcomeLower === 'cashout') return 'win' // Treat cashouts as wins
    return 'pending' // Unclear outcome
  }

  // Handle direct status
  switch (statusLower) {
    case 'won':
    case 'win':
      return 'win'
    case 'lost':
    case 'lose':
    case 'loss':
      return 'loss'
    case 'void':
    case 'cancelled':
    case 'canceled':
    case 'push':
      return 'void'
    case 'pending':
    default:
      return 'pending'
  }
}

/**
 * Calculate profit for a single bet (non-parlay)
 */
function calculateSingleBetProfit(bet: BetData): number | null {
  const outcome = getBetOutcome(bet)
  const stake = bet.stake || 0

  switch (outcome) {
    case 'win':
      return (bet.potential_payout || 0) - stake
    case 'loss':
      return -stake
    case 'void':
      return 0
    case 'pending':
    default:
      return null // Pending bets have no profit yet
  }
}

/**
 * Calculate profit for parlay legs
 * Returns an object mapping bet IDs to their profit values
 */
function calculateParlayProfits(parlayBets: BetData[]): Record<string, number | null> {
  const results: Record<string, number | null> = {}

  if (parlayBets.length === 0) return results

  // Check if any leg is still pending
  const hasPendingLegs = parlayBets.some(bet => getBetOutcome(bet) === 'pending')
  if (hasPendingLegs) {
    // If any leg is pending, all legs show null profit
    parlayBets.forEach(bet => {
      results[bet.id] = null
    })
    return results
  }

  // Check if any leg lost
  const hasLosingLegs = parlayBets.some(bet => getBetOutcome(bet) === 'loss')
  if (hasLosingLegs) {
    // If any leg lost, entire parlay loses
    // Only the first leg records the loss, others get 0 to avoid double counting
    parlayBets.forEach((bet, index) => {
      if (index === 0) {
        results[bet.id] = -(bet.stake || 0)
      } else {
        results[bet.id] = 0
      }
    })
    return results
  }

  // Check if any leg was voided
  const hasVoidedLegs = parlayBets.some(bet => getBetOutcome(bet) === 'void')
  if (hasVoidedLegs) {
    // If any leg was voided but none lost, treat as push (no profit/loss)
    parlayBets.forEach((bet, index) => {
      results[bet.id] = index === 0 ? 0 : 0
    })
    return results
  }

  // All legs won - calculate parlay profit
  const firstBet = parlayBets[0]
  if (!firstBet) return results
  const stake = firstBet.stake || 0

  // Calculate combined decimal odds
  let combinedDecimalOdds = 1
  for (const bet of parlayBets) {
    const decimalOdds = americanToDecimal(bet.odds || 0)
    combinedDecimalOdds *= decimalOdds
  }

  // Calculate parlay profit: (stake * combined_odds) - stake
  const totalPayout = stake * combinedDecimalOdds
  const parlayProfit = totalPayout - stake

  // Only the first leg records the parlay profit, others get 0 to avoid double counting
  parlayBets.forEach((bet, index) => {
    if (index === 0) {
      results[bet.id] = parlayProfit
    } else {
      results[bet.id] = 0
    }
  })

  return results
}

/**
 * Main function to calculate profits for a collection of bets
 * Handles both single bets and parlays correctly
 */
export function calculateBetProfits(bets: BetData[]): Record<string, number | null> {
  const results: Record<string, number | null> = {}

  // Group bets by parlay_id (null for single bets)
  const betGroups = new Map<string | null, BetData[]>()

  for (const bet of bets) {
    const key = bet.parlay_id || null
    if (!betGroups.has(key)) {
      betGroups.set(key, [])
    }
    betGroups.get(key)!.push(bet)
  }

  // Process each group
  for (const [parlayId, groupBets] of betGroups) {
    if (parlayId === null) {
      // Single bets - calculate profit individually
      for (const bet of groupBets) {
        results[bet.id] = calculateSingleBetProfit(bet)
      }
    } else {
      // Parlay bets - calculate profit using parlay logic
      const parlayResults = calculateParlayProfits(groupBets)
      Object.assign(results, parlayResults)
    }
  }

  return results
}

/**
 * Update bet records with correct profit calculations
 * This function can be used to recalculate profits for existing data
 */
export async function updateBetProfitsInDatabase(
  supabase: any,
  bets: BetData[]
): Promise<{ updated: number; errors: string[] }> {
  const profitResults = calculateBetProfits(bets)
  const errors: string[] = []
  let updated = 0

  for (const bet of bets) {
    const newProfit = profitResults[bet.id]
    
    // Only update if profit has changed
    if (newProfit !== bet.profit) {
      try {
        const { error } = await supabase
          .from('bets')
          .update({ profit: newProfit })
          .eq('id', bet.id)

        if (error) {
          errors.push(`Failed to update bet ${bet.id}: ${error.message}`)
        } else {
          updated++
        }
      } catch (err) {
        errors.push(`Error updating bet ${bet.id}: ${err}`)
      }
    }
  }

  return { updated, errors }
}

/**
 * Calculate profit for a single bet - legacy compatibility function
 * Use this to replace existing calculateProfit functions
 */
export function calculateProfitLegacy(
  status: string,
  atRisk: string | number,
  toWin: string | number,
  outcome?: string,
  parlayId?: string,
  odds?: number
): number | null {
  const stake = typeof atRisk === 'string' ? parseFloat(atRisk) : atRisk
  const winAmount = typeof toWin === 'string' ? parseFloat(toWin) : toWin

  // For single bets, use the original logic
  if (!parlayId) {
    const bet: BetData = {
      id: 'temp',
      status,
      outcome: outcome || 'pending',
      stake: stake || 0,
      potential_payout: (stake || 0) + (winAmount || 0),
      odds: odds || 0,
      is_parlay: false
    }
    return calculateSingleBetProfit(bet)
  }

  // For parlay legs, we need the full parlay context to calculate correctly
  // Return null to indicate this needs to be calculated with the full parlay function
  console.warn('Parlay profit calculation requires full parlay context. Use calculateBetProfits() instead.')
  return null
}