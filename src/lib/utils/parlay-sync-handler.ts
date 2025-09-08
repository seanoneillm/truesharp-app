/**
 * Parlay-aware bet processing for SharpSports sync
 * This handles the correct profit calculation during the sync process
 */

export interface ProcessedBet {
  external_bet_id: string
  user_id: string
  sport: string
  league: string
  bet_type: string
  bet_description: string
  odds: number
  stake: number
  potential_payout: number
  status: string
  profit: number | null
  placed_at: string
  settled_at: string | null
  game_date: string
  home_team: string | null
  away_team: string | null
  side: string | null
  line_value: number | null
  sportsbook: string
  bet_source: string
  parlay_id: string | null
  is_parlay: boolean
  updated_at: string
}

/**
 * Process a collection of bet slips and handle parlay profit calculations correctly
 */
export async function processBetsWithParlayLogic(
  betSlips: any[],
  userId: string,
  supabase: any
): Promise<{
  processed: number
  updated: number
  errors: string[]
}> {
  const stats = { processed: 0, updated: 0, errors: [] as string[] }

  // Group bet slips by parlay vs single bets
  const singleBets: any[] = []
  const parlayGroups = new Map<string, { slips: any[]; uuid: string }>()

  for (const betSlip of betSlips) {
    console.log(`🔍 BetSlip ${betSlip.id}: type=${betSlip.type}, bets=${betSlip.bets?.length || 0}`)

    // Check if this is actually a multi-bet parlay (more than 1 bet)
    const betCount = betSlip.bets?.length || 0

    if (betSlip.type === 'parlay' && betSlip.id && betCount > 1) {
      // True parlay with multiple legs - group them
      if (!parlayGroups.has(betSlip.id)) {
        parlayGroups.set(betSlip.id, {
          slips: [],
          uuid: crypto.randomUUID(), // Generate proper UUID for database
        })
      }
      parlayGroups.get(betSlip.id)!.slips.push(betSlip)
    } else {
      // Single bet (including "parlay" type with only 1 bet)
      if (betSlip.type === 'parlay' && betCount <= 1) {
        console.log(`🔧 Converting single-bet "parlay" ${betSlip.id} to single bet`)
      }
      singleBets.push(betSlip)
    }
  }

  console.log(`📊 Processing: ${singleBets.length} single bets, ${parlayGroups.size} parlays`)

  // Process single bets (existing logic)
  for (const betSlip of singleBets) {
    try {
      const bets = await processSingleBetSlip(betSlip, userId, supabase)
      stats.processed += bets.length
    } catch (error) {
      stats.errors.push(`Single bet ${betSlip.id}: ${error}`)
    }
  }

  // Process parlays with correct profit logic
  for (const [slipId, parlayGroup] of parlayGroups) {
    try {
      const bets = await processParlayBetSlips(
        parlayGroup.slips,
        userId,
        parlayGroup.uuid,
        supabase
      )
      stats.processed += bets.length
    } catch (error) {
      stats.errors.push(`Parlay ${slipId}: ${error}`)
    }
  }

  return stats
}

/**
 * Process a single bet slip (non-parlay)
 */
async function processSingleBetSlip(
  betSlip: any,
  userId: string,
  supabase: any
): Promise<ProcessedBet[]> {
  const processedBets: ProcessedBet[] = []

  if (!betSlip.bets || betSlip.bets.length === 0) {
    return processedBets
  }

  for (const bet of betSlip.bets) {
    const stake = (parseFloat(betSlip.atRisk) || 0) / 100 // Convert cents to dollars
    const toWin = (parseFloat(betSlip.toWin) || 0) / 100 // Convert cents to dollars
    const potentialPayout = toWin + stake

    // Calculate profit for single bet
    const profit = calculateSingleBetProfit(betSlip.status, betSlip.outcome, stake, toWin)

    const processedBet: ProcessedBet = {
      external_bet_id: bet.id || betSlip.id,
      user_id: userId,
      sport: bet.event?.sport || 'Unknown',
      league: bet.event?.league || 'Unknown',
      bet_type: mapProposition(bet.proposition),
      bet_description: bet.bookDescription || 'N/A',
      odds: parseInt(bet.oddsAmerican) || 0,
      stake: stake,
      potential_payout: potentialPayout,
      status: mapStatus(betSlip.status, betSlip.outcome),
      profit: profit,
      placed_at: betSlip.timePlaced || new Date().toISOString(),
      settled_at: betSlip.dateClosed || null,
      game_date: bet.event?.startTime || new Date().toISOString(),
      home_team: bet.event?.contestantHome?.fullName || null,
      away_team: bet.event?.contestantAway?.fullName || null,
      side: mapSide(bet.position),
      line_value: bet.line ? parseFloat(bet.line) : null,
      sportsbook: betSlip.book?.name || 'Unknown',
      bet_source: 'sharpsports',
      parlay_id: null, // Single bet
      is_parlay: false,
      updated_at: new Date().toISOString(),
    }

    processedBets.push(processedBet)

    // Save to database
    await saveBetToDatabase(processedBet, supabase)
  }

  return processedBets
}

/**
 * Process parlay bet slips with correct profit logic
 */
async function processParlayBetSlips(
  parlaySlips: any[],
  userId: string,
  parlayId: string,
  supabase: any
): Promise<ProcessedBet[]> {
  const processedBets: ProcessedBet[] = []

  if (parlaySlips.length === 0) {
    return processedBets
  }

  // Get the main parlay slip (usually the first one has the stake/payout info)
  const mainSlip =
    parlaySlips.find(
      slip => (parseFloat(slip.atRisk) || 0) > 0 && (parseFloat(slip.toWin) || 0) > 0
    ) || parlaySlips[0]

  const totalStake = (parseFloat(mainSlip.atRisk) || 0) / 100 // Convert cents to dollars
  const totalToWin = (parseFloat(mainSlip.toWin) || 0) / 100 // Convert cents to dollars
  const totalPayout = totalToWin + totalStake

  // Determine parlay outcome by checking all legs
  const parlayOutcome = determineParlayOutcome(parlaySlips)
  const parlayStatus = mapParlayStatus(parlayOutcome)

  // Calculate parlay profit based on overall outcome
  let parlayProfit: number | null = null
  if (parlayOutcome === 'win') {
    parlayProfit = totalToWin
  } else if (parlayOutcome === 'loss') {
    parlayProfit = -totalStake
  } else if (parlayOutcome === 'push') {
    parlayProfit = 0
  } else {
    parlayProfit = null // pending
  }

  console.log(
    `🎯 Parlay ${parlayId}: ${parlaySlips.length} legs, outcome: ${parlayOutcome}, profit: ${parlayProfit}`
  )

  // Process each leg, but only first leg gets the profit
  for (let i = 0; i < parlaySlips.length; i++) {
    const betSlip = parlaySlips[i]

    if (!betSlip.bets || betSlip.bets.length === 0) continue

    for (const bet of betSlip.bets) {
      const processedBet: ProcessedBet = {
        external_bet_id: `${parlayId}-${bet.id}`,
        user_id: userId,
        sport: bet.event?.sport || 'Unknown',
        league: bet.event?.league || 'Unknown',
        bet_type: mapProposition(bet.proposition),
        bet_description: bet.bookDescription || 'N/A',
        odds: parseInt(bet.oddsAmerican) || 0,
        stake: i === 0 ? totalStake : 0, // Only first leg has stake
        potential_payout: i === 0 ? totalPayout : 0, // Only first leg has payout
        status: parlayStatus,
        profit: i === 0 ? parlayProfit : 0, // Only first leg has profit/loss
        placed_at: betSlip.timePlaced || new Date().toISOString(),
        settled_at: betSlip.dateClosed || null,
        game_date: bet.event?.startTime || new Date().toISOString(),
        home_team: bet.event?.contestantHome?.fullName || null,
        away_team: bet.event?.contestantAway?.fullName || null,
        side: mapSide(bet.position),
        line_value: bet.line ? parseFloat(bet.line) : null,
        sportsbook: betSlip.book?.name || 'Unknown',
        bet_source: 'sharpsports',
        parlay_id: parlayId,
        is_parlay: true,
        updated_at: new Date().toISOString(),
      }

      processedBets.push(processedBet)

      // Save to database
      await saveBetToDatabase(processedBet, supabase)
    }
  }

  return processedBets
}

/**
 * Determine the overall outcome of a parlay
 */
function determineParlayOutcome(parlaySlips: any[]): 'win' | 'loss' | 'push' | 'pending' {
  let hasWin = false
  let hasLoss = false
  let hasPush = false
  let hasPending = false

  for (const slip of parlaySlips) {
    const status = slip.status?.toLowerCase()
    const outcome = slip.outcome?.toLowerCase()

    // Determine this leg's outcome
    let legOutcome: string
    if (status === 'completed') {
      if (outcome === 'win' || outcome === 'won') legOutcome = 'win'
      else if (outcome === 'loss' || outcome === 'lost' || outcome === 'lose') legOutcome = 'loss'
      else if (outcome === 'push' || outcome === 'void') legOutcome = 'push'
      else legOutcome = 'pending'
    } else if (status === 'won' || status === 'win') {
      legOutcome = 'win'
    } else if (status === 'lost' || status === 'lose' || status === 'loss') {
      legOutcome = 'loss'
    } else if (status === 'void' || status === 'push' || status === 'cancelled') {
      legOutcome = 'push'
    } else {
      legOutcome = 'pending'
    }

    // Track outcomes
    if (legOutcome === 'win') hasWin = true
    else if (legOutcome === 'loss') hasLoss = true
    else if (legOutcome === 'push') hasPush = true
    else hasPending = true
  }

  // Determine parlay result
  if (hasLoss) return 'loss' // Any loss = parlay loss
  if (hasPending) return 'pending' // Any pending = parlay pending
  if (hasPush && !hasLoss) return 'push' // Push if any leg pushes but none lost
  if (hasWin && !hasLoss && !hasPending && !hasPush) return 'win' // All legs won

  return 'pending' // Default to pending
}

/**
 * Map parlay outcome to database status
 */
function mapParlayStatus(outcome: 'win' | 'loss' | 'push' | 'pending'): string {
  switch (outcome) {
    case 'win':
      return 'won'
    case 'loss':
      return 'lost'
    case 'push':
      return 'void'
    case 'pending':
      return 'pending'
    default:
      return 'pending'
  }
}

/**
 * Calculate profit for a single bet
 */
function calculateSingleBetProfit(
  status: string,
  outcome: string,
  stake: number,
  toWin: number
): number | null {
  const statusLower = status?.toLowerCase()
  const outcomeLower = outcome?.toLowerCase()

  if (statusLower === 'completed') {
    if (outcomeLower === 'win' || outcomeLower === 'won') return toWin
    if (outcomeLower === 'loss' || outcomeLower === 'lost' || outcomeLower === 'lose') return -stake
    if (outcomeLower === 'push' || outcomeLower === 'void') return 0
    if (outcomeLower === 'cashout') return toWin
    return null
  }

  switch (statusLower) {
    case 'won':
    case 'win':
      return toWin
    case 'lost':
    case 'lose':
    case 'loss':
      return -stake
    case 'void':
    case 'cancelled':
    case 'push':
      return 0
    default:
      return null
  }
}

/**
 * Save a processed bet to the database
 */
async function saveBetToDatabase(bet: ProcessedBet, supabase: any): Promise<void> {
  try {
    // Check if bet exists
    const { data: existingBet } = await supabase
      .from('bets')
      .select('id, external_bet_id, status, profit')
      .eq('external_bet_id', bet.external_bet_id)
      .single()

    if (existingBet) {
      // Update if status or profit changed
      if (existingBet.status !== bet.status || existingBet.profit !== bet.profit) {
        const { error } = await supabase
          .from('bets')
          .update({
            status: bet.status,
            profit: bet.profit,
            settled_at: bet.settled_at,
            updated_at: bet.updated_at,
          })
          .eq('external_bet_id', bet.external_bet_id)

        if (error) {
          console.error(`❌ Error updating bet ${bet.external_bet_id}:`, error)
        } else {
          console.log(`✅ Updated bet: ${bet.external_bet_id} (profit: ${bet.profit})`)
        }
      }
    } else {
      // Insert new bet
      const { error } = await supabase.from('bets').insert(bet)

      if (error) {
        console.error(`❌ Error inserting bet ${bet.external_bet_id}:`, error)
      } else {
        console.log(`✅ Inserted bet: ${bet.external_bet_id} (profit: ${bet.profit})`)
      }
    }
  } catch (error) {
    console.error(`❌ Error saving bet ${bet.external_bet_id}:`, error)
    throw error
  }
}

// Helper functions (these should match the existing ones in your codebase)
function mapProposition(proposition: string): string {
  switch (proposition?.toLowerCase()) {
    case 'spread':
      return 'spread'
    case 'total':
      return 'total'
    case 'moneyline':
      return 'moneyline'
    default:
      return 'player_prop'
  }
}

function mapStatus(status: string, outcome?: string): string {
  const statusLower = status?.toLowerCase()
  const outcomeLower = outcome?.toLowerCase()

  if (statusLower === 'completed') {
    if (outcomeLower === 'win' || outcomeLower === 'won') return 'won'
    if (outcomeLower === 'loss' || outcomeLower === 'lost' || outcomeLower === 'lose') return 'lost'
    if (outcomeLower === 'push' || outcomeLower === 'void') return 'void'
    if (outcomeLower === 'cashout') return 'won'
    return 'pending'
  }

  switch (statusLower) {
    case 'won':
    case 'win':
      return 'won'
    case 'lost':
    case 'lose':
    case 'loss':
      return 'lost'
    case 'void':
    case 'cancelled':
    case 'push':
      return 'void'
    default:
      return 'pending'
  }
}

function mapSide(position: string): string | null {
  if (!position) return null
  const pos = position.toLowerCase()
  if (pos.includes('over')) return 'over'
  if (pos.includes('under')) return 'under'
  if (pos.includes('home')) return 'home'
  if (pos.includes('away')) return 'away'
  return null
}
