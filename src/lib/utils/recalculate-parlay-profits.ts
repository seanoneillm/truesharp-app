/**
 * Database utility to recalculate parlay profits for existing data
 */

import { createClient } from '@supabase/supabase-js'
import { calculateBetProfits, type BetData } from './parlay-profit-calculator'

/**
 * Recalculate profits for all bets in the database
 * This should be run as a one-time migration to fix existing parlay profits
 */
export async function recalculateAllParlayProfits(supabaseUrl: string, supabaseKey: string) {
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  console.log('🔄 Starting parlay profit recalculation...')
  
  try {
    // Fetch all bets from the database
    const { data: allBets, error: fetchError } = await supabase
      .from('bets')
      .select('*')
      .order('placed_at', { ascending: false })
    
    if (fetchError) {
      throw new Error(`Failed to fetch bets: ${fetchError.message}`)
    }
    
    if (!allBets || allBets.length === 0) {
      console.log('ℹ️ No bets found in database')
      return { success: true, updated: 0, errors: [] }
    }
    
    console.log(`📊 Found ${allBets.length} bets to process`)
    
    // Convert to BetData format
    const betsData: BetData[] = allBets.map(bet => ({
      id: bet.id,
      parlay_id: bet.parlay_id,
      is_parlay: bet.is_parlay || false,
      status: bet.status,
      outcome: bet.outcome,
      stake: parseFloat(bet.stake) || 0,
      potential_payout: parseFloat(bet.potential_payout) || 0,
      odds: parseInt(bet.odds) || 0,
      profit: bet.profit
    }))
    
    // Calculate new profits
    console.log('🧮 Calculating new profits...')
    const newProfits = calculateBetProfits(betsData)
    
    // Identify bets that need updating
    const betsToUpdate = betsData.filter(bet => {
      const currentProfit = bet.profit
      const newProfit = newProfits[bet.id]
      
      // Update if profit changed (accounting for null vs 0 differences)
      if (currentProfit === null && newProfit === null) return false
      if (currentProfit === newProfit) return false
      
      return true
    })
    
    console.log(`📝 ${betsToUpdate.length} bets need profit updates`)
    
    if (betsToUpdate.length === 0) {
      console.log('✅ All profits are already correct!')
      return { success: true, updated: 0, errors: [] }
    }
    
    // Group updates by parlay for logging
    const parlayUpdates = new Map<string, number>()
    const singleBetUpdates: string[] = []
    
    for (const bet of betsToUpdate) {
      if (bet.parlay_id) {
        parlayUpdates.set(bet.parlay_id, (parlayUpdates.get(bet.parlay_id) || 0) + 1)
      } else {
        singleBetUpdates.push(bet.id)
      }
    }
    
    console.log(`📈 Updates needed:`)
    console.log(`  - ${singleBetUpdates.length} single bets`)
    console.log(`  - ${parlayUpdates.size} parlays (${betsToUpdate.length - singleBetUpdates.length} total legs)`)
    
    // Perform updates in batches
    const BATCH_SIZE = 50
    const errors: string[] = []
    let updated = 0
    
    for (let i = 0; i < betsToUpdate.length; i += BATCH_SIZE) {
      const batch = betsToUpdate.slice(i, i + BATCH_SIZE)
      console.log(`📤 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(betsToUpdate.length / BATCH_SIZE)}...`)
      
      for (const bet of batch) {
        const newProfit = newProfits[bet.id]
        
        try {
          const { error } = await supabase
            .from('bets')
            .update({ 
              profit: newProfit,
              updated_at: new Date().toISOString()
            })
            .eq('id', bet.id)
          
          if (error) {
            errors.push(`Bet ${bet.id}: ${error.message}`)
          } else {
            updated++
          }
        } catch (err) {
          errors.push(`Bet ${bet.id}: ${err}`)
        }
      }
      
      // Small delay between batches to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    console.log(`✅ Parlay profit recalculation completed!`)
    console.log(`  - ${updated} bets updated successfully`)
    console.log(`  - ${errors.length} errors encountered`)
    
    if (errors.length > 0) {
      console.log('❌ Errors:')
      errors.forEach(error => console.log(`  - ${error}`))
    }
    
    return {
      success: errors.length === 0,
      updated,
      errors,
      summary: {
        totalBets: allBets.length,
        needingUpdate: betsToUpdate.length,
        singleBets: singleBetUpdates.length,
        parlays: parlayUpdates.size
      }
    }
    
  } catch (error) {
    console.error('💥 Fatal error during parlay profit recalculation:', error)
    return {
      success: false,
      updated: 0,
      errors: [error instanceof Error ? error.message : String(error)]
    }
  }
}

/**
 * Recalculate profits for a specific user's bets
 */
export async function recalculateUserParlayProfits(
  supabaseUrl: string, 
  supabaseKey: string, 
  userId: string
) {
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  console.log(`🔄 Recalculating parlay profits for user: ${userId}`)
  
  try {
    // Fetch user's bets
    const { data: userBets, error: fetchError } = await supabase
      .from('bets')
      .select('*')
      .eq('user_id', userId)
      .order('placed_at', { ascending: false })
    
    if (fetchError) {
      throw new Error(`Failed to fetch user bets: ${fetchError.message}`)
    }
    
    if (!userBets || userBets.length === 0) {
      console.log(`ℹ️ No bets found for user ${userId}`)
      return { success: true, updated: 0, errors: [] }
    }
    
    // Use the same logic as the full recalculation
    const betsData: BetData[] = userBets.map(bet => ({
      id: bet.id,
      parlay_id: bet.parlay_id,
      is_parlay: bet.is_parlay || false,
      status: bet.status,
      outcome: bet.outcome,
      stake: parseFloat(bet.stake) || 0,
      potential_payout: parseFloat(bet.potential_payout) || 0,
      odds: parseInt(bet.odds) || 0,
      profit: bet.profit
    }))
    
    const newProfits = calculateBetProfits(betsData)
    
    let updated = 0
    const errors: string[] = []
    
    for (const bet of betsData) {
      const newProfit = newProfits[bet.id]
      
      if (newProfit !== bet.profit) {
        try {
          const { error } = await supabase
            .from('bets')
            .update({ 
              profit: newProfit,
              updated_at: new Date().toISOString()
            })
            .eq('id', bet.id)
          
          if (error) {
            errors.push(`Bet ${bet.id}: ${error.message}`)
          } else {
            updated++
          }
        } catch (err) {
          errors.push(`Bet ${bet.id}: ${err}`)
        }
      }
    }
    
    console.log(`✅ User ${userId}: ${updated} bets updated, ${errors.length} errors`)
    
    return { success: errors.length === 0, updated, errors }
    
  } catch (error) {
    console.error(`💥 Error recalculating profits for user ${userId}:`, error)
    return {
      success: false,
      updated: 0,
      errors: [error instanceof Error ? error.message : String(error)]
    }
  }
}

/**
 * Validate parlay profit calculations by checking sample parlays
 */
export async function validateParlayProfits(supabaseUrl: string, supabaseKey: string) {
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  console.log('🔍 Validating parlay profit calculations...')
  
  try {
    // Get sample of parlays to validate
    const { data: parlayBets, error } = await supabase
      .from('bets')
      .select('*')
      .not('parlay_id', 'is', null)
      .eq('is_parlay', true)
      .limit(20)
    
    if (error) {
      throw new Error(`Failed to fetch sample parlays: ${error.message}`)
    }
    
    if (!parlayBets || parlayBets.length === 0) {
      console.log('ℹ️ No parlays found for validation')
      return { success: true, issues: [] }
    }
    
    const issues: string[] = []
    
    // Group by parlay_id
    const parlayGroups = new Map<string, any[]>()
    for (const bet of parlayBets) {
      if (!parlayGroups.has(bet.parlay_id)) {
        parlayGroups.set(bet.parlay_id, [])
      }
      parlayGroups.get(bet.parlay_id)!.push(bet)
    }
    
    console.log(`📊 Validating ${parlayGroups.size} sample parlays...`)
    
    for (const [parlayId, legs] of parlayGroups) {
      const betsData: BetData[] = legs.map(bet => ({
        id: bet.id,
        parlay_id: bet.parlay_id,
        is_parlay: bet.is_parlay,
        status: bet.status,
        outcome: bet.outcome,
        stake: parseFloat(bet.stake) || 0,
        potential_payout: parseFloat(bet.potential_payout) || 0,
        odds: parseInt(bet.odds) || 0,
        profit: bet.profit
      }))
      
      const expectedProfits = calculateBetProfits(betsData)
      
      for (const bet of betsData) {
        const expectedProfit = expectedProfits[bet.id]
        const actualProfit = bet.profit
        
        if (expectedProfit !== actualProfit) {
          issues.push(`Parlay ${parlayId}, Bet ${bet.id}: Expected profit ${expectedProfit}, got ${actualProfit}`)
        }
      }
    }
    
    if (issues.length === 0) {
      console.log('✅ All sample parlays have correct profit calculations!')
    } else {
      console.log(`❌ Found ${issues.length} profit calculation issues`)
      issues.forEach(issue => console.log(`  - ${issue}`))
    }
    
    return { success: issues.length === 0, issues }
    
  } catch (error) {
    console.error('💥 Error validating parlay profits:', error)
    return {
      success: false,
      issues: [error instanceof Error ? error.message : String(error)]
    }
  }
}