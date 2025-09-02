'use client'

import { gamesDataService } from '@/lib/services/games-data'
import { createClient } from '@/lib/supabase'
import { convertDatabaseGamesToGames } from '@/lib/utils/database-to-game-converter'
import { useEffect, useState } from 'react'

export default function OddsTestPage() {
  const [result, setResult] = useState<string>('Loading...')
  const [games, setGames] = useState<any[]>([])

  useEffect(() => {
    const test = async () => {
      try {
        const supabase = createClient()
        const dateStr = '2025-08-20'

        // Step 1: Direct database query
        const { data: gamesData, error: gamesError } = await supabase
          .from('games')
          .select('*')
          .eq('league', 'MLB')
          .gte('game_time', `${dateStr}T00:00:00.000Z`)
          .lt('game_time', `${dateStr}T23:59:59.999Z`)
          .limit(3)

        if (gamesError) throw gamesError

        setResult(`Found ${gamesData?.length || 0} games in database`)

        if (gamesData && gamesData.length > 0) {
          // Step 2: Get odds for first game
          const firstGame = gamesData[0]
          const { data: oddsData, error: oddsError } = await supabase
            .from('odds')
            .select('*')
            .eq('eventid', firstGame.id)
            .limit(20)

          if (oddsError) throw oddsError

          setResult(
            prev => prev + `\nFirst game: ${firstGame.away_team_name} @ ${firstGame.home_team_name}`
          )
          setResult(prev => prev + `\nOdds for first game: ${oddsData?.length || 0}`)

          // Step 3: Test service layer
          const serviceGames = await gamesDataService.getGamesForLeagueAndDate('MLB', dateStr)
          setResult(prev => prev + `\nService returned: ${serviceGames.length} games`)

          // Step 4: Test conversion
          const convertedGames = convertDatabaseGamesToGames(serviceGames)
          setResult(prev => prev + `\nConverted: ${convertedGames.length} games`)

          if (convertedGames.length > 0) {
            const firstConverted = convertedGames[0]
            if (firstConverted) {
              setResult(
                prev =>
                  prev + `\nFirst converted game bookmakers: ${firstConverted.bookmakers.length}`
              )

              if (firstConverted.bookmakers.length > 0) {
                const firstBookmaker = firstConverted.bookmakers[0]
                if (firstBookmaker) {
                  setResult(prev => prev + `\nFirst bookmaker: ${firstBookmaker.title}`)
                  setResult(
                    prev => prev + `\nFirst bookmaker markets: ${firstBookmaker.markets.length}`
                  )

                  if (firstBookmaker.markets.length > 0) {
                    firstBookmaker.markets.forEach((market, i) => {
                      setResult(
                        prev =>
                          prev + `\nMarket ${i}: ${market.key} (${market.outcomes.length} outcomes)`
                      )
                    })
                  }
                }
              }
            }
          }

          setGames(convertedGames)
        }
      } catch (error: unknown) {
        setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    test()
  }, [])

  return (
    <div className="p-8">
      <h1 className="mb-4 text-2xl font-bold">Odds Flow Test</h1>

      <div className="mb-6 rounded bg-gray-100 p-4">
        <h2 className="mb-2 font-semibold">Debug Output:</h2>
        <pre className="whitespace-pre-wrap text-sm">{result}</pre>
      </div>

      {games.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Converted Games Preview:</h2>
          {games.map((game, i) => (
            <div key={i} className="rounded border p-4">
              <h3 className="font-semibold">
                {game.away_team} @ {game.home_team}
              </h3>
              <p className="text-sm text-gray-600">Bookmakers: {game.bookmakers.length}</p>

              {game.bookmakers.slice(0, 1).map((bookmaker: any, j: number) => (
                <div key={j} className="ml-4 mt-2">
                  <h4 className="font-medium">{bookmaker.title}</h4>
                  <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-3">
                    {bookmaker.markets.slice(0, 6).map((market: any, k: number) => (
                      <div key={k} className="rounded bg-gray-50 p-2 text-sm">
                        <div className="font-medium">{market.key}</div>
                        {market.outcomes.map((outcome: any, l: number) => (
                          <div key={l} className="flex justify-between">
                            <span>{outcome.name}</span>
                            <span className="font-mono">
                              {outcome.price
                                ? outcome.price > 2
                                  ? `+${Math.round((outcome.price - 1) * 100)}`
                                  : `-${Math.round(100 / (outcome.price - 1))}`
                                : '--'}
                              {outcome.point && ` (${outcome.point})`}
                            </span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
