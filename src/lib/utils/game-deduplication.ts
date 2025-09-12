import { Game } from '@/lib/types/games'

/**
 * Remove duplicate games based on unique identifiers
 */
export function deduplicateGames(games: Game[]): Game[] {
  const uniqueGames = new Map<string, Game>()
  
  for (const game of games) {
    // Create unique key using teams and start time (normalized)
    const normalizedHomeTeam = game.home_team.toLowerCase().trim()
    const normalizedAwayTeam = game.away_team.toLowerCase().trim()
    const gameTime = new Date(game.commence_time).getTime()
    
    // Ensure consistent ordering of teams for the key
    const [team1, team2] = normalizedHomeTeam < normalizedAwayTeam 
      ? [normalizedHomeTeam, normalizedAwayTeam]
      : [normalizedAwayTeam, normalizedHomeTeam]
    
    const uniqueKey = `${team1}-vs-${team2}-${gameTime}`
    
    // If we already have this game, keep the one with more bookmakers (better data)
    if (uniqueGames.has(uniqueKey)) {
      const existingGame = uniqueGames.get(uniqueKey)!
      if (game.bookmakers.length > existingGame.bookmakers.length) {
        uniqueGames.set(uniqueKey, game)
      }
    } else {
      uniqueGames.set(uniqueKey, game)
    }
  }
  
  return Array.from(uniqueGames.values()).sort((a, b) => 
    new Date(a.commence_time).getTime() - new Date(b.commence_time).getTime()
  )
}

/**
 * Check if a sport is a college sport that needs deduplication
 */
export function isCollegeSport(sportKey: string): boolean {
  return sportKey === 'americanfootball_ncaaf' || sportKey === 'basketball_ncaab'
}