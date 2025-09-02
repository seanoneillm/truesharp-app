'use client'

import { gamesDataService } from '@/lib/services/games-data'
import { createClient } from '@/lib/supabase'
import { convertDatabaseGamesToGames } from '@/lib/utils/database-to-game-converter'
import React, { useEffect, useState } from 'react'

interface DebugInfo {
  rawGames: unknown[]
  rawOdds: unknown[]
  gamesWithOdds: unknown[]
  convertedGames: unknown[]
  individualGame: unknown
  summary: {
    totalRawGames: number
    totalRawOdds: number
    totalGamesWithOdds: number
    totalConvertedGames: number
    firstGameBookmakers: number
    firstGameFirstBookmakerMarkets: number
  }
}

export default function DebugOddsPage(): React.ReactElement {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const addLog = (message: string) => {
    console.log(message)
  }

  useEffect(() => {
    const debug = async () => {
      try {
        setIsLoading(true)
        const supabase = createClient()
        const dateStr = '2025-08-20'

        addLog('🔍 Starting debug analysis...')

        // 1. Test direct database connection
        addLog('📡 Testing direct database connection...')
        const { data: gamesRaw, error: gamesError } = await supabase
          .from('games')
          .select('*')
          .eq('league', 'MLB')
          .gte('game_time', `${dateStr}T00:00:00.000Z`)
          .lt('game_time', `${dateStr}T23:59:59.999Z`)
          .limit(3)

        if (gamesError) {
          throw new Error(`Games query failed: ${gamesError.message}`)
        }

        addLog(`📊 Raw games from database: ${gamesRaw?.length || 0} games`)

        // 2. Test odds fetching
        const gameIds = (gamesRaw || []).map(g => (g as any).id)
        addLog(`🔍 Fetching odds for ${gameIds.length} game IDs`)
        const { data: oddsRaw, error: oddsError } = await supabase
          .from('odds')
          .select('*')
          .in('eventid', gameIds)
          .limit(20)

        if (oddsError) {
          throw new Error(`Odds query failed: ${oddsError.message}`)
        }

        addLog(`📊 Raw odds from database: ${oddsRaw?.length || 0} odds`)

        // 3. Test games service
        addLog('🔧 Testing games service...')
        const gamesWithOdds = await gamesDataService.getGamesForLeagueAndDate('MLB', dateStr)
        addLog(`📊 Games with odds from service: ${gamesWithOdds?.length || 0} games`)

        // 4. Test conversion
        addLog('🔄 Testing game conversion...')
        const convertedGames = convertDatabaseGamesToGames(gamesWithOdds)
        addLog(`📊 Converted games: ${convertedGames?.length || 0} games`)

        if (convertedGames.length > 0) {
          addLog(`📊 First game bookmakers: ${convertedGames[0]?.bookmakers?.length || 0}`)
          if (convertedGames[0]?.bookmakers?.length && convertedGames[0].bookmakers.length > 0) {
            addLog(
              `📊 First bookmaker markets: ${convertedGames[0]?.bookmakers?.[0]?.markets?.length || 0}`
            )
          }
        }

        // 5. Test individual game fetch
        const firstGameId = gamesRaw?.[0]?.id as string
        let individualGame = null
        if (firstGameId) {
          addLog(`🎯 Testing individual game fetch for ${firstGameId}`)
          individualGame = await gamesDataService.getMLBGameWithOdds(firstGameId)
          addLog(`📊 Individual game odds count: ${(individualGame as any)?.odds?.length || 0}`)
        }

        setDebugInfo({
          rawGames: gamesRaw || [],
          rawOdds: oddsRaw || [],
          gamesWithOdds: gamesWithOdds || [],
          convertedGames: convertedGames || [],
          individualGame,
          summary: {
            totalRawGames: gamesRaw?.length || 0,
            totalRawOdds: oddsRaw?.length || 0,
            totalGamesWithOdds: gamesWithOdds?.length || 0,
            totalConvertedGames: convertedGames?.length || 0,
            firstGameBookmakers: convertedGames?.[0]?.bookmakers?.length || 0,
            firstGameFirstBookmakerMarkets:
              convertedGames?.[0]?.bookmakers?.[0]?.markets?.length || 0,
          },
        })
      } catch (error: unknown) {
        console.error('❌ Debug error:', error)
        setError(error instanceof Error ? error.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    debug()
  }, [])

  if (isLoading) {
    return (
      <div className="p-8">
        <h1 className="mb-4 text-2xl font-bold">Debug: Loading...</h1>
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="mb-4 text-2xl font-bold text-red-600">Debug Error</h1>
        <div className="rounded border border-red-200 bg-red-50 p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    )
  }

  if (!debugInfo) {
    return (
      <div className="p-8">
        <h1 className="mb-4 text-2xl font-bold">Debug: No Data</h1>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl p-8">
      <h1 className="mb-6 text-3xl font-bold">Odds Debug Analysis</h1>

      {/* Summary */}
      <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-6">
        <h2 className="mb-4 text-xl font-semibold">Summary</h2>
        <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
          <div>
            <strong>Raw Games:</strong> {debugInfo.summary.totalRawGames}
          </div>
          <div>
            <strong>Raw Odds:</strong> {debugInfo.summary.totalRawOdds}
          </div>
          <div>
            <strong>Games with Odds:</strong> {debugInfo.summary.totalGamesWithOdds}
          </div>
          <div>
            <strong>Converted Games:</strong> {debugInfo.summary.totalConvertedGames}
          </div>
          <div>
            <strong>First Game Bookmakers:</strong> {debugInfo.summary.firstGameBookmakers}
          </div>
          <div>
            <strong>First Bookmaker Markets:</strong>{' '}
            {debugInfo.summary.firstGameFirstBookmakerMarkets}
          </div>
        </div>
      </div>

      {/* Raw Games */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-6">
        <h2 className="mb-4 text-xl font-semibold">Raw Games from Database</h2>
        <pre className="max-h-64 overflow-auto rounded border bg-white p-4 text-xs">
          {JSON.stringify((debugInfo.rawGames as unknown[]).slice(0, 2), null, 2)}
        </pre>
      </div>

      {/* Raw Odds */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-6">
        <h2 className="mb-4 text-xl font-semibold">Raw Odds from Database (First 10)</h2>
        <pre className="max-h-64 overflow-auto rounded border bg-white p-4 text-xs">
          {debugInfo.rawOdds ? JSON.stringify((debugInfo.rawOdds as unknown[]).slice(0, 10), null, 2) : 'No data'}
        </pre>
      </div>

      {/* Games with Odds */}
      <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-6">
        <h2 className="mb-4 text-xl font-semibold">Games with Odds (Service Output)</h2>
        <pre className="max-h-64 overflow-auto rounded border bg-white p-4 text-xs">
          {JSON.stringify((debugInfo.gamesWithOdds as unknown[]).slice(0, 1), null, 2)}
        </pre>
      </div>

      {/* Converted Games */}
      <div className="mb-6 rounded-lg border border-purple-200 bg-purple-50 p-6">
        <h2 className="mb-4 text-xl font-semibold">Converted Games (Component Format)</h2>
        <pre className="max-h-64 overflow-auto rounded border bg-white p-4 text-xs">
          {JSON.stringify((debugInfo.convertedGames as unknown[]).slice(0, 1), null, 2)}
        </pre>
      </div>

      {/* Individual Game Detail */}
      {debugInfo.individualGame && (
        <div className="mb-6 rounded-lg border border-orange-200 bg-orange-50 p-6">
          <h2 className="mb-4 text-xl font-semibold">Individual Game Detail</h2>
          <pre className="max-h-64 overflow-auto rounded border bg-white p-4 text-xs">
            {JSON.stringify(debugInfo.individualGame, null, 2)}
          </pre>
        </div>
      )}
    </div>
  ) as React.ReactElement
}
