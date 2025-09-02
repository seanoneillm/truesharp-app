'use client'

import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'

interface SimpleGame {
  id: string
  home_team: string
  away_team: string
  game_time: string
}

interface SimpleOdd {
  id: string
  oddid: string | null
  sportsbook: string
  bookodds: number | null
}

export default function SimpleGamesTest() {
  const [games, setGames] = useState<SimpleGame[]>([])
  const [selectedGame, setSelectedGame] = useState<SimpleGame | null>(null)
  const [odds, setOdds] = useState<SimpleOdd[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchGamesAndOdds = async () => {
      try {
        setLoading(true)

        const supabase = createClient()
        const dateStr = '2025-08-20'

        // Fetch games
        const { data: gamesData, error: gamesError } = await supabase
          .from('games')
          .select('id, home_team, away_team, game_time')
          .eq('league', 'MLB')
          .gte('game_time', `${dateStr}T00:00:00.000Z`)
          .lt('game_time', `${dateStr}T23:59:59.999Z`)
          .order('game_time', { ascending: true })
          .limit(5)

        if (gamesError) {
          setError('Error fetching games: ' + gamesError.message)
          return
        }

        if (gamesData && gamesData.length > 0) {
          setGames(gamesData)
          const firstGame = gamesData[0]
          if (firstGame) {
            setSelectedGame(firstGame)

            // Fetch odds for first game
            const { data: oddsData, error: oddsError } = await supabase
              .from('odds')
              .select('id, oddid, sportsbook, bookodds')
              .eq('eventid', firstGame.id)
              .limit(10)

            if (oddsError) {
              setError('Error fetching odds: ' + oddsError.message)
            } else {
              setOdds(oddsData || [])
            }
          }
        } else {
          setError('No games found for ' + dateStr)
        }
      } catch (err) {
        setError('Exception: ' + (err instanceof Error ? err.message : 'Unknown error'))
      } finally {
        setLoading(false)
      }
    }

    fetchGamesAndOdds()
  }, [])

  const handleGameSelect = async (game: SimpleGame) => {
    setSelectedGame(game)
    setOdds([])

    try {
      const supabase = createClient()
      const { data: oddsData, error } = await supabase
        .from('odds')
        .select('id, oddid, sportsbook, bookodds')
        .eq('eventid', game.id)
        .limit(10)

      if (error) {
        setError('Error fetching odds: ' + error.message)
      } else {
        setOdds(oddsData || [])
      }
    } catch (err) {
      setError('Exception fetching odds: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-lg bg-white p-8 text-center shadow">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-4">Loading games and odds...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
            <strong>Error:</strong> {error}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 text-3xl font-bold">Simple Games & Odds Test - August 20, 2025</h1>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Games List */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">MLB Games ({games.length})</h2>
            <div className="space-y-2">
              {games.map(game => (
                <button
                  key={game.id}
                  onClick={() => handleGameSelect(game)}
                  className={`w-full rounded border p-3 text-left transition-colors ${
                    selectedGame?.id === game.id
                      ? 'border-blue-300 bg-blue-100'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">
                    {game.away_team} @ {game.home_team}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(game.game_time).toLocaleString()}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Odds Display */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">
              Odds for{' '}
              {selectedGame
                ? `${selectedGame.away_team} @ ${selectedGame.home_team}`
                : 'Select a game'}
            </h2>

            {odds.length > 0 ? (
              <div className="p-4">
                <h2 className="mb-4 text-lg font-bold">
                  Odds for {selectedGame?.away_team} @ {selectedGame?.home_team}
                </h2>
                {odds.length > 0 ? (
                  <div className="space-y-2">
                    {odds.map(odd => (
                      <div key={odd.id} className="rounded border p-2">
                        <p>
                          <strong>Sportsbook:</strong> {odd.sportsbook}
                        </p>
                        <p>
                          <strong>Odd ID:</strong> {odd.oddid}
                        </p>
                        <p>
                          <strong>Book Odds:</strong> {odd.bookodds}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No odds found for this game</p>
                )}
              </div>
            ) : selectedGame ? (
              <p className="text-gray-600">No odds found for this game</p>
            ) : (
              <p className="text-gray-600">Select a game to see odds</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
