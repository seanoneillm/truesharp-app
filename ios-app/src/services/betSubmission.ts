/**
 * Bet submission service for iOS app
 * Integrates with the existing web API endpoint for bet placement
 */

import { API_ENDPOINTS } from '../config/environment'
import { supabase } from '../lib/supabase'

export interface BetSubmissionBet {
  id: string
  gameId: string
  sport: string
  homeTeam: string
  awayTeam: string
  gameTime: string
  marketType: string
  selection: string
  odds: number
  line?: number
  sportsbook: string
  description: string
}

export interface BetSubmissionRequest {
  bets: BetSubmissionBet[]
  stake: number
  userId?: string
}

export interface BetSubmissionResult {
  success: boolean
  error?: string
  betId?: string
  parlayId?: string
  message?: string
}

/**
 * Submit bet(s) to the server using the existing web API endpoint
 */
export const submitBet = async (
  bets: BetSubmissionBet[],
  stake: number
): Promise<BetSubmissionResult> => {
  try {
    // Get current user session with explicit refresh attempt
    let {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    // If no session or error, try to refresh
    if (sessionError || !session?.user) {
      const {
        data: { session: refreshedSession },
        error: refreshError,
      } = await supabase.auth.refreshSession()

      if (refreshError || !refreshedSession?.user) {
        console.error(
          '❌ Authentication error after refresh:',
          refreshError?.message || sessionError?.message || 'No session'
        )
        return {
          success: false,
          error: 'Please log in to place bets',
        }
      }

      session = refreshedSession
    } else {
    }

    // Validate stake
    if (stake < 1 || stake > 10000) {
      return {
        success: false,
        error: 'Stake must be between $1 and $10,000',
      }
    }

    // Validate bets
    if (!bets || bets.length === 0) {
      return {
        success: false,
        error: 'No bets to submit',
      }
    }

    if (bets.length > 10) {
      return {
        success: false,
        error: 'Maximum 10 legs allowed',
      }
    }

    // Prepare request payload (matches web app format)
    const requestPayload: BetSubmissionRequest = {
      bets,
      stake,
      userId: session.user.id, // Include for fallback authentication
    }

    // Use the existing web API endpoint - configured via environment
    const apiUrl = API_ENDPOINTS.betSubmission

    // Make the API request with proper headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // Add authorization header if we have a valid access token
    if (session.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestPayload),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      console.error('❌ API error response:', errorData)

      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
      }
    }

    const result = await response.json()

    return {
      success: true,
      betId: result.betId,
      parlayId: result.parlayId,
      message: result.message || 'Bet placed successfully!',
    }
  } catch (error) {
    console.error('❌ Error in iOS bet submission:', error)

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Network error. Please check your connection and try again.',
    }
  }
}

/**
 * Validate bet data before submission
 */
export const validateBetSubmission = (
  bets: BetSubmissionBet[],
  stake: number
): { isValid: boolean; error?: string } => {
  // Check stake range
  if (stake < 1) {
    return { isValid: false, error: 'Minimum stake is $1' }
  }

  if (stake > 10000) {
    return { isValid: false, error: 'Maximum stake is $10,000' }
  }

  // Check bet count
  if (bets.length === 0) {
    return { isValid: false, error: 'No bets to submit' }
  }

  if (bets.length > 10) {
    return { isValid: false, error: 'Maximum 10 legs allowed' }
  }

  // Check for same game (no same-game parlays)
  const gameIds = bets.map(bet => bet.gameId)
  const uniqueGameIds = new Set(gameIds)
  if (gameIds.length !== uniqueGameIds.size) {
    return { isValid: false, error: 'Cannot add multiple bets from the same game' }
  }

  // Validate each bet
  for (let i = 0; i < bets.length; i++) {
    const bet = bets[i]

    // Check required string fields (allow empty strings but not null/undefined)
    if (!bet.id) {
      return { isValid: false, error: 'Bet ID is missing' }
    }
    if (!bet.gameId) {
      return { isValid: false, error: 'Game ID is missing' }
    }
    if (!bet.sport) {
      return { isValid: false, error: 'Sport is missing' }
    }
    if (!bet.homeTeam) {
      return { isValid: false, error: 'Home team is missing' }
    }
    if (!bet.awayTeam) {
      return { isValid: false, error: 'Away team is missing' }
    }
    if (!bet.gameTime) {
      return { isValid: false, error: 'Game time is missing' }
    }
    if (!bet.marketType) {
      return { isValid: false, error: 'Market type is missing' }
    }
    if (!bet.selection) {
      return { isValid: false, error: 'Selection is missing' }
    }
    if (typeof bet.odds !== 'number' || isNaN(bet.odds)) {
      return { isValid: false, error: 'Odds must be a valid number' }
    }
    if (!bet.sportsbook) {
      return { isValid: false, error: 'Sportsbook is missing' }
    }

    // Check if game has started
    const gameTime = new Date(bet.gameTime)
    const now = new Date()
    const bufferTime = 10 * 60 * 1000 // 10 minutes buffer

    if (now.getTime() >= gameTime.getTime() + bufferTime) {
      return { isValid: false, error: 'Cannot bet on live or finished games' }
    }
  }

  return { isValid: true }
}
