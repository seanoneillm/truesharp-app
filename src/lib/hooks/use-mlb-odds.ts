'use client'

import { useState, useEffect } from 'react'
import { MLBGameOdds, processMLBOdds, DatabaseOdd } from '@/lib/games/mlb-odds-processor'

interface UseMLBOddsProps {
  gameId: string
  enabled?: boolean
}

interface UseMLBOddsReturn {
  gameOdds: MLBGameOdds | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useMLBOdds({ gameId, enabled = true }: UseMLBOddsProps): UseMLBOddsReturn {
  const [gameOdds, setGameOdds] = useState<MLBGameOdds | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchOdds = async () => {
    if (!enabled || !gameId) return

    setIsLoading(true)
    setError(null)

    try {
      // Use batch API for better performance
      const response = await fetch('/api/games/odds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gameIds: [gameId] }),
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch odds: ${response.statusText}`)
      }

      const oddsData: DatabaseOdd[] = await response.json()

      // Process the odds using our MLB processor
      const processedOdds = processMLBOdds(oddsData)

      // Find the odds for this specific game
      const gameSpecificOdds = processedOdds.find(odds => odds.gameId === gameId)

      setGameOdds(gameSpecificOdds || null)
    } catch (err) {
      console.error('Error fetching MLB odds:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch odds')
      setGameOdds(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (enabled && gameId) {
      fetchOdds()
    }
  }, [gameId, enabled])

  return {
    gameOdds,
    isLoading,
    error,
    refetch: fetchOdds,
  }
}

// Alternative hook for fetching multiple games' odds at once
interface UseMLBGameOddsProps {
  gameIds: string[]
  enabled?: boolean
}

interface UseMLBGameOddsReturn {
  gameOddsMap: Map<string, MLBGameOdds>
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useMLBGameOdds({
  gameIds,
  enabled = true,
}: UseMLBGameOddsProps): UseMLBGameOddsReturn {
  const [gameOddsMap, setGameOddsMap] = useState<Map<string, MLBGameOdds>>(new Map())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAllOdds = async () => {
    if (!enabled || gameIds.length === 0) return

    setIsLoading(true)
    setError(null)

    try {
      // Fetch odds for all games in a single request
      const response = await fetch('/api/games/odds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gameIds }),
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch odds: ${response.statusText}`)
      }

      const oddsData: DatabaseOdd[] = await response.json()

      // Process all odds
      const processedOdds = processMLBOdds(oddsData)

      // Create map of game ID to odds
      const oddsMap = new Map<string, MLBGameOdds>()
      processedOdds.forEach(gameOdds => {
        oddsMap.set(gameOdds.gameId, gameOdds)
      })

      setGameOddsMap(oddsMap)
    } catch (err) {
      console.error('Error fetching MLB game odds:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch odds')
      setGameOddsMap(new Map())
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (enabled && gameIds.length > 0) {
      fetchAllOdds()
    }
  }, [JSON.stringify(gameIds), enabled])

  return {
    gameOddsMap,
    isLoading,
    error,
    refetch: fetchAllOdds,
  }
}

// Hook for real-time odds updates (if needed)
export function useMLBOddsSubscription(gameId: string) {
  const [gameOdds, setGameOdds] = useState<MLBGameOdds | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // This could be implemented with WebSockets or Server-Sent Events
    // for real-time odds updates
    console.log(`Subscribing to odds updates for game ${gameId}`)

    // Placeholder for real-time subscription logic
    setIsConnected(true)

    return () => {
      console.log(`Unsubscribing from odds updates for game ${gameId}`)
      setIsConnected(false)
    }
  }, [gameId])

  return {
    gameOdds,
    isConnected,
  }
}
