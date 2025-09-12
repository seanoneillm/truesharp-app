import { Game } from '@/lib/types/games'
import { ConferenceFilterType } from '@/components/games/conference-filter'
import { deduplicateGames } from './game-deduplication'
import collegeTeams from '@/lib/data/college-conferences.json'

interface CollegeTeam {
  team: string
  footballConference: string | null
  basketballConference: string
  division: 'FBS' | 'FCS'
}

const teams = collegeTeams as CollegeTeam[]

/**
 * Get team conference and division information
 */
function getTeamInfo(teamName: string, sport: 'NCAAF' | 'NCAAB'): {
  conference: string | null
  division?: 'FBS' | 'FCS'
} {
  const normalizedInputName = teamName.toLowerCase().trim()
  
  // Try exact match first
  let team = teams.find(t => t.team.toLowerCase() === normalizedInputName)
  
  if (!team) {
    // Try common variations and abbreviations
    const variations = getTeamVariations(normalizedInputName)
    
    team = teams.find(t => {
      const normalizedTeamName = t.team.toLowerCase()
      return variations.some(variation => 
        normalizedTeamName === variation ||
        normalizedTeamName.includes(variation) ||
        variation.includes(normalizedTeamName)
      )
    })
  }
  
  if (!team) {
    // Try fuzzy matching as last resort
    team = teams.find(t => {
      const teamWords = t.team.toLowerCase().split(/[\s&(),-]+/).filter(w => w.length > 2)
      const nameWords = normalizedInputName.split(/[\s&(),-]+/).filter(w => w.length > 2)
      
      // Need at least 60% word overlap for a match
      const matches = teamWords.filter(tw => 
        nameWords.some(nw => tw.includes(nw) || nw.includes(tw) || levenshteinDistance(tw, nw) <= 1)
      )
      
      return matches.length >= Math.min(teamWords.length, nameWords.length) * 0.6
    })
  }
  
  if (!team) {
    console.warn(`No conference match found for team: "${teamName}"`)
    return { conference: null }
  }
  
  const conference = sport === 'NCAAF' ? team.footballConference : team.basketballConference
  
  return {
    conference,
    division: team.division
  }
}

/**
 * Generate common variations of team names
 */
function getTeamVariations(teamName: string): string[] {
  const variations = [teamName]
  
  // Common abbreviations and variations
  const replacements: Record<string, string[]> = {
    'university': ['u', 'univ'],
    'state': ['st'],
    'college': ['coll'],
    'north carolina': ['nc', 'unc'],
    'south carolina': ['sc', 'usc'],
    'texas a&m': ['texas am', 'tamu'],
    'miami': ['miami fl', 'miami (fl)'],
    'southern california': ['usc'],
    'california': ['cal'],
    'central florida': ['ucf'],
    'connecticut': ['uconn'],
    'massachusetts': ['umass'],
    'louisiana state': ['lsu'],
    'oklahoma state': ['osu'],
    'ohio state': ['osu'],
    'texas christian': ['tcu'],
    'southern methodist': ['smu'],
    'brigham young': ['byu'],
    'florida atlantic': ['fau'],
    'florida international': ['fiu'],
    'texas el paso': ['utep'],
    'texas san antonio': ['utsa'],
  }
  
  // Add variations
  for (const [full, abbrevs] of Object.entries(replacements)) {
    if (teamName.includes(full)) {
      abbrevs.forEach(abbrev => {
        variations.push(teamName.replace(full, abbrev))
      })
    }
    abbrevs.forEach(abbrev => {
      if (teamName.includes(abbrev)) {
        variations.push(teamName.replace(abbrev, full))
      }
    })
  }
  
  return variations
}

/**
 * Simple Levenshtein distance calculation
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = []
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= str1.length; j++) {
    if (matrix[0]) {
      matrix[0][j] = j
    }
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (!matrix[i]) matrix[i] = []
      
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i]![j] = matrix[i - 1]?.[j - 1] ?? 0
      } else {
        matrix[i]![j] = Math.min(
          (matrix[i - 1]?.[j - 1] ?? 0) + 1,
          (matrix[i]?.[j - 1] ?? 0) + 1,
          (matrix[i - 1]?.[j] ?? 0) + 1
        )
      }
    }
  }
  
  return matrix[str2.length]?.[str1.length] ?? 0
}

/**
 * Check if a team matches the selected filter
 */
function teamMatchesFilter(
  teamName: string,
  filter: ConferenceFilterType,
  sport: 'NCAAF' | 'NCAAB'
): boolean {
  if (filter === 'All Games') {
    return true
  }
  
  const teamInfo = getTeamInfo(teamName, sport)
  
  if (sport === 'NCAAF') {
    if (filter === 'All FBS') {
      return teamInfo.division === 'FBS'
    }
    
    if (filter === 'All FCS') {
      return teamInfo.division === 'FCS'
    }
  }
  
  return teamInfo.conference === filter
}


/**
 * Filter games based on conference selection
 */
export function filterGamesByConference(
  games: Game[],
  filter: ConferenceFilterType,
  sport: 'NCAAF' | 'NCAAB'
): Game[] {
  // First deduplicate the games
  const deduplicatedGames = deduplicateGames(games)
  
  if (filter === 'All Games') {
    return deduplicatedGames
  }
  
  return deduplicatedGames.filter(game => {
    const homeTeamMatches = teamMatchesFilter(game.home_team, filter, sport)
    const awayTeamMatches = teamMatchesFilter(game.away_team, filter, sport)
    
    // Show game if at least one team matches the filter
    return homeTeamMatches || awayTeamMatches
  })
}

/**
 * Get unique conferences from games for dynamic filtering
 */
export function getConferencesFromGames(
  games: Game[],
  sport: 'NCAAF' | 'NCAAB'
): ConferenceFilterType[] {
  const conferences = new Set<string>()
  const hasFBS = new Set<boolean>()
  const hasFCS = new Set<boolean>()
  
  games.forEach(game => {
    const homeInfo = getTeamInfo(game.home_team, sport)
    const awayInfo = getTeamInfo(game.away_team, sport)
    
    if (homeInfo.conference) {
      conferences.add(homeInfo.conference)
    }
    if (awayInfo.conference) {
      conferences.add(awayInfo.conference)
    }
    
    if (sport === 'NCAAF') {
      if (homeInfo.division === 'FBS') hasFBS.add(true)
      if (homeInfo.division === 'FCS') hasFCS.add(true)
      if (awayInfo.division === 'FBS') hasFBS.add(true)
      if (awayInfo.division === 'FCS') hasFCS.add(true)
    }
  })
  
  const filters: ConferenceFilterType[] = ['All Games']
  
  if (sport === 'NCAAF') {
    if (hasFBS.size > 0) filters.push('All FBS')
    if (hasFCS.size > 0) filters.push('All FCS')
  }
  
  // Add conferences in alphabetical order
  const sortedConferences = Array.from(conferences).sort() as ConferenceFilterType[]
  filters.push(...sortedConferences)
  
  return filters
}

/**
 * Get team conference for display purposes
 */
export function getTeamConference(teamName: string, sport: 'NCAAF' | 'NCAAB'): string {
  const teamInfo = getTeamInfo(teamName, sport)
  return teamInfo.conference || 'Unknown'
}

/**
 * Check if team is FBS or FCS (for NCAAF only)
 */
export function getTeamDivision(teamName: string): 'FBS' | 'FCS' | 'Unknown' {
  const team = teams.find(t => t.team.toLowerCase() === teamName.toLowerCase())
  return team?.division || 'Unknown'
}