'use client'

import { createClient } from '@/lib/supabase'
import { useEffect, useMemo, useState } from 'react'
import { useBetSlip, BetSlipBet } from '@/contexts/BetSlipContext'
import { useBetSlipToast } from '@/lib/hooks/use-bet-slip-toast'

// Utility function to format odds
const formatOdds = (odds: number): string => {
  if (odds > 0) {
    return `+${odds}`
  }
  return odds.toString()
}

// Types
interface Game {
  id: string
  home_team: string
  away_team: string
  commence_time: string
  sport_key: string
}

interface DatabaseOdds {
  id: string
  oddid?: string
  line?: string
  sportsbook?: string
  fanduelodds?: number
  draftkingsodds?: number
  espnbetodds?: number
  ceasarsodds?: number
  mgmodds?: number
  fanaticsodds?: number
  bookodds?: number
}

interface BetSelection {
  gameId: string
  sport: string
  homeTeam: string
  awayTeam: string
  gameTime: string
  marketType: string
  selection: string
  odds: number
  line?: number | undefined
  sportsbook: string
  description: string
}

interface UniversalGameCardProps {
  game: Game
  league: string
  onOddsClick?: (bet: BetSelection) => void
  selectedBets?: BetSelection[]
}

interface TabStructure {
  [category: string]:
    | string[]
    | {
        [subcategory: string]: string[]
      }
}

// Tab structure definitions based on SportGameOdds API Market Hierarchy
const LEAGUE_TAB_STRUCTURE: Record<string, TabStructure> = {
  MLB: {
    'Main Lines': ['Moneyline', 'Run Line', 'Total Runs'],
    'Player Props': {
      Hitters: [
        'Hits Over/Under',
        'Home Runs Over/Under',
        'RBIs Over/Under',
        'Runs Scored Over/Under',
        'Total Bases Over/Under',
        'Singles Over/Under',
        'Doubles Over/Under',
        'Triples Over/Under',
        'Stolen Bases Over/Under',
        'Strikeouts Over/Under',
        'Walks Over/Under',
        'Hits + Runs + RBIs Over/Under',
      ],
      Pitchers: [
        'Strikeouts Over/Under',
        'Hits Allowed Over/Under',
        'Earned Runs Allowed Over/Under',
        'Walks Allowed Over/Under',
        'Home Runs Allowed Over/Under',
        'Pitches Thrown Over/Under',
        'Outs Recorded Over/Under',
      ],
    },
    'Team Props': {
      All: [
        'Team Total Runs Over/Under',
        'Team Home Runs Over/Under',
        'Team Strikeouts Over/Under',
        'Team Hits Over/Under',
      ],
    },
    'Game Props': {
      All: [
        'Total Home Runs Over/Under',
        'Total Strikeouts Over/Under',
        'Total Hits Over/Under',
        'Runs Even/Odd',
        'Home Runs Even/Odd',
      ],
    },
  },
  NFL: {
    'Main Lines': ['Point Spread', 'Total Points', 'Moneyline'],
    'Player Props': {
      Quarterback: [
        'Passing Yards Over/Under',
        'Passing Touchdowns Over/Under',
        'Interceptions Over/Under',
        'Completions Over/Under',
        'Passing Attempts Over/Under',
        'Longest Completion Over/Under',
        'Rushing Yards Over/Under',
        'Rushing Touchdowns Over/Under',
        'Passing + Rushing Yards Over/Under',
        'Passer Rating Over/Under',
      ],
      'Running Back': [
        'Rushing Yards Over/Under',
        'Rushing Touchdowns Over/Under',
        'Rushing Attempts Over/Under',
        'Receptions Over/Under',
        'Receiving Yards Over/Under',
        'Receiving Touchdowns Over/Under',
        'Longest Rush Over/Under',
        'Rushing + Receiving Yards Over/Under',
      ],
      'Wide Receiver': [
        'Receiving Yards Over/Under',
        'Receptions Over/Under',
        'Receiving Touchdowns Over/Under',
        'Longest Reception Over/Under',
        'Rushing Yards Over/Under',
        'Rushing Touchdowns Over/Under',
      ],
      'Kicker/Defense': [
        'Kicking Points Over/Under',
        'Field Goals Made Over/Under',
        'Extra Points Made Over/Under',
        'Longest Field Goal Over/Under',
        'Sacks Over/Under',
        'Interceptions Over/Under',
        'Fumble Recoveries Over/Under',
        'Defensive Touchdowns Over/Under',
        'Tackles Over/Under',
      ],
      'Any Player': ['Turnovers Over/Under'],
    },
    'Team Props': {
      All: [
        'Team Total Points Over/Under',
        'Team Total Touchdowns Over/Under',
        'Team Total Field Goals Over/Under',
        'Team to Score First',
        'Team to Score Last',
        'Team Total Turnovers Over/Under',
        'Team Total Sacks Over/Under',
        'Team Total Tackles Over/Under',
      ],
    },
    'Game Props': {
      All: [
        'Total Touchdowns Over/Under',
        'Total Field Goals Over/Under',
        'Total Turnovers Over/Under',
        'Total Sacks Over/Under',
        'First Score Type',
        'Last Score Type',
        'Points Scored Even/Odd',
        'Longest Touchdown Over/Under',
        'First Quarter Points Over/Under',
        'First Half Points Over/Under',
        'Second Half Points Over/Under',
        'Times Tied Over/Under',
      ],
    },
  },
  NCAAF: {
    'Main Lines': ['Point Spread', 'Total Points', 'Moneyline'],
    'Player Props': {
      Quarterback: [
        'Passing Yards Over/Under',
        'Passing Touchdowns Over/Under',
        'Interceptions Over/Under',
        'Completions Over/Under',
        'Rushing Yards Over/Under',
        'Rushing Touchdowns Over/Under',
      ],
      'Running Back': [
        'Rushing Yards Over/Under',
        'Rushing Touchdowns Over/Under',
        'Rushing Attempts Over/Under',
        'Receptions Over/Under',
        'Receiving Yards Over/Under',
      ],
      'Wide Receiver': [
        'Receiving Yards Over/Under',
        'Receptions Over/Under',
        'Receiving Touchdowns Over/Under',
        'Rushing Yards Over/Under',
      ],
      'Kicker/Defense': [
        'Kicking Points Over/Under',
        'Field Goals Made Over/Under',
        'Sacks Over/Under',
        'Interceptions Over/Under',
      ],
    },
    'Team Props': {
      All: [
        'Team Total Points Over/Under',
        'Team Total Touchdowns Over/Under',
        'Team Total Field Goals Over/Under',
        'Team to Score First',
        'Team Total Turnovers Over/Under',
      ],
    },
    'Game Props': {
      All: [
        'Total Touchdowns Over/Under',
        'Total Field Goals Over/Under',
        'Total Turnovers Over/Under',
        'First Score Type',
        'Points Scored Even/Odd',
        'First Quarter Points Over/Under',
        'First Half Points Over/Under',
      ],
    },
  },
  NBA: {
    'Main Lines': ['Point Spread', 'Total Points', 'Moneyline'],
    'Player Props': {
      Scoring: [
        'Points Over/Under',
        'Field Goals Made Over/Under',
        'Field Goal Attempts Over/Under',
        'Three-Pointers Made Over/Under',
        'Three-Point Attempts Over/Under',
        'Free Throws Made Over/Under',
        'Free Throw Attempts Over/Under',
      ],
      Rebounding: [
        'Total Rebounds Over/Under',
        'Offensive Rebounds Over/Under',
        'Defensive Rebounds Over/Under',
      ],
      Playmaking: [
        'Assists Over/Under',
        'Turnovers Over/Under',
        'Steals Over/Under',
        'Blocks Over/Under',
      ],
      'Combo Props': [
        'Points + Rebounds Over/Under',
        'Points + Assists Over/Under',
        'Rebounds + Assists Over/Under',
        'Points + Rebounds + Assists Over/Under',
        'Blocks + Steals Over/Under',
      ],
    },
    'Team Props': {
      All: [
        'Team Total Points Over/Under',
        'Team Total Rebounds Over/Under',
        'Team Total Assists Over/Under',
        'Team Total Three-Pointers Over/Under',
        'Team Total Turnovers Over/Under',
        'Team to Score First',
        'Team Highest Scoring Quarter',
      ],
    },
    'Game Props': {
      All: [
        'Total Rebounds Over/Under',
        'Total Assists Over/Under',
        'Total Three-Pointers Over/Under',
        'Total Turnovers Over/Under',
        'Total Steals Over/Under',
        'Total Blocks Over/Under',
        'Highest Scoring Quarter',
        'Lowest Scoring Quarter',
        'First Quarter Points Over/Under',
        'First Half Points Over/Under',
        'Second Half Points Over/Under',
      ],
    },
  },
  NCAAB: {
    'Main Lines': ['Point Spread', 'Total Points', 'Moneyline'],
    'Player Props': {
      Scoring: [
        'Points Over/Under',
        'Field Goals Made Over/Under',
        'Three-Pointers Made Over/Under',
        'Free Throws Made Over/Under',
      ],
      Rebounding: [
        'Total Rebounds Over/Under',
        'Offensive Rebounds Over/Under',
        'Defensive Rebounds Over/Under',
      ],
      Playmaking: [
        'Assists Over/Under',
        'Turnovers Over/Under',
        'Steals Over/Under',
        'Blocks Over/Under',
      ],
      'Combo Props': ['Points + Rebounds Over/Under', 'Points + Assists Over/Under'],
    },
    'Team Props': {
      All: [
        'Team Total Points Over/Under',
        'Team Total Rebounds Over/Under',
        'Team Total Assists Over/Under',
        'Team Total Three-Pointers Over/Under',
        'Team to Score First',
      ],
    },
    'Game Props': {
      All: [
        'Total Rebounds Over/Under',
        'Total Assists Over/Under',
        'Total Three-Pointers Over/Under',
        'First Half Points Over/Under',
        'Second Half Points Over/Under',
      ],
    },
  },
  NHL: {
    'Main Lines': ['Moneyline', 'Puck Line', 'Total Goals'],
    'Player Props': {
      Skaters: [
        'Goals Over/Under',
        'Assists Over/Under',
        'Points Over/Under',
        'Shots on Goal Over/Under',
        'Hits Over/Under',
        'Blocked Shots Over/Under',
        'Penalty Minutes Over/Under',
        'Power Play Points Over/Under',
        'Time on Ice Over/Under',
        'Faceoff Wins Over/Under',
      ],
      Goalies: ['Saves Over/Under', 'Goals Against Over/Under', 'Save Percentage Over/Under'],
    },
    'Team Props': {
      All: [
        'Team Total Goals Over/Under',
        'Team Total Shots Over/Under',
        'Team Total Hits Over/Under',
        'Team Total Penalty Minutes Over/Under',
        'Team to Score First',
        'Team to Score Last',
        'Team Power Play Goals Over/Under',
        'Team Short-Handed Goals Over/Under',
      ],
    },
    'Game Props': {
      All: [
        'Total Shots on Goal Over/Under',
        'Total Hits Over/Under',
        'Total Penalty Minutes Over/Under',
        'Total Power Plays Over/Under',
        'Goals Scored Even/Odd',
        'First Goal Time Over/Under',
        'First Period Goals Over/Under',
        'Second Period Goals Over/Under',
        'Third Period Goals Over/Under',
      ],
    },
  },
  'Champions League': {
    'Main Lines': ['Moneyline (1X2)', 'Asian Handicap', 'Total Goals'],
    'Player Props': {
      Forwards: [
        'Goals Over/Under',
        'Shots on Target Over/Under',
        'Shots Over/Under',
        'Assists Over/Under',
        'Fouls Committed Over/Under',
        'Cards Received Over/Under',
      ],
      Midfielders: [
        'Passes Completed Over/Under',
        'Pass Completion % Over/Under',
        'Tackles Over/Under',
        'Assists Over/Under',
        'Shots Over/Under',
        'Fouls Committed Over/Under',
        'Cards Received Over/Under',
      ],
      Defenders: [
        'Tackles Over/Under',
        'Clearances Over/Under',
        'Blocks Over/Under',
        'Interceptions Over/Under',
        'Fouls Committed Over/Under',
        'Cards Received Over/Under',
      ],
      Goalkeepers: ['Saves Over/Under', 'Goals Conceded Over/Under', 'Punches/Catches Over/Under'],
    },
    'Team Props': {
      All: [
        'Team Total Goals Over/Under',
        'Team Total Shots Over/Under',
        'Team Total Shots on Target Over/Under',
        'Team Total Corners Over/Under',
        'Team Total Cards Over/Under',
        'Team to Score First',
        'Team to Score Last',
        'Team Total Fouls Over/Under',
        'Team Total Offsides Over/Under',
      ],
    },
    'Game Props': {
      All: [
        'Total Shots Over/Under',
        'Total Shots on Target Over/Under',
        'Total Corners Over/Under',
        'Total Cards Over/Under',
        'Total Fouls Over/Under',
        'Total Offsides Over/Under',
        'Goals Scored Even/Odd',
        'First Goal Time Over/Under',
        'First Half Goals Over/Under',
        'Second Half Goals Over/Under',
      ],
    },
  },
  MLS: {
    'Main Lines': ['Moneyline (1X2)', 'Asian Handicap', 'Total Goals'],
    'Player Props': {
      Forwards: ['Goals Over/Under', 'Shots on Target Over/Under', 'Assists Over/Under'],
      Midfielders: [
        'Passes Completed Over/Under',
        'Tackles Over/Under',
        'Assists Over/Under',
        'Shots Over/Under',
      ],
      Defenders: [
        'Tackles Over/Under',
        'Clearances Over/Under',
        'Blocks Over/Under',
        'Interceptions Over/Under',
      ],
      Goalkeepers: ['Saves Over/Under', 'Goals Conceded Over/Under'],
    },
    'Team Props': {
      All: [
        'Team Total Goals Over/Under',
        'Team Total Shots Over/Under',
        'Team Total Corners Over/Under',
        'Team Total Cards Over/Under',
        'Team to Score First',
      ],
    },
    'Game Props': {
      All: [
        'Total Shots Over/Under',
        'Total Corners Over/Under',
        'Total Cards Over/Under',
        'Goals Scored Even/Odd',
        'First Half Goals Over/Under',
        'Second Half Goals Over/Under',
      ],
    },
  },
}

export default function UniversalGameCard({
  game,
  league,
  onOddsClick = () => {},
  selectedBets = [],
}: UniversalGameCardProps) {
  const [odds, setOdds] = useState<DatabaseOdds[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Tab state
  const [activeCategory, setActiveCategory] = useState<string>('Main Lines')
  const [activeSubcategory, setActiveSubcategory] = useState<string>('All')
  const [activeMarket, setActiveMarket] = useState<string>('')

  // Bet slip integration
  const { addBet } = useBetSlip()
  const { showToast } = useBetSlipToast()

  // Get tab structure for current league
  const tabStructure = LEAGUE_TAB_STRUCTURE[league] || LEAGUE_TAB_STRUCTURE.MLB

  // Extract selection label from SportGameOdds API oddid patterns
  const getSelectionLabel = (oddid: string): string => {
    // ============ MAIN LINES ============
    if (oddid.includes('points-home-game-ml-home') || oddid.includes('-ml-home'))
      return game.home_team
    if (oddid.includes('points-away-game-ml-away') || oddid.includes('-ml-away'))
      return game.away_team
    if (oddid.includes('points-all-game-ml-draw') || oddid.includes('-ml-draw')) return 'Draw'
    if (
      oddid.includes('points-home-game-sp-home') ||
      oddid.includes('points-home-game-rl-home') ||
      oddid.includes('-sp-home') ||
      oddid.includes('-rl-home')
    ) {
      return `${game.home_team}`
    }
    if (
      oddid.includes('points-away-game-sp-away') ||
      oddid.includes('points-away-game-rl-away') ||
      oddid.includes('-sp-away') ||
      oddid.includes('-rl-away')
    ) {
      return `${game.away_team}`
    }
    if (oddid.includes('points-all-game-ou-over') || oddid.includes('-ou-over')) return `Over`
    if (oddid.includes('points-all-game-ou-under') || oddid.includes('-ou-under')) return `Under`

    // ============ TEAM PROPS ============
    if (oddid.includes('points-home-game-ou-over')) return `${game.home_team} Over`
    if (oddid.includes('points-home-game-ou-under')) return `${game.home_team} Under`
    if (oddid.includes('points-away-game-ou-over')) return `${game.away_team} Over`
    if (oddid.includes('points-away-game-ou-under')) return `${game.away_team} Under`

    // Team Yes/No props - REMOVED (filtered out completely)

    // Default fallback
    return 'Bet'
  }

  // Handle adding bet to slip
  const handleBetClick = (odd: DatabaseOdds) => {
    const gameStartTime = new Date(game.commence_time)
    const now = new Date()

    // Add 10-minute buffer after game starts before disabling bets
    // This accounts for timezone differences and gives some leeway
    const bufferTime = 10 * 60 * 1000 // 10 minutes in milliseconds
    const isGameStarted = now.getTime() >= gameStartTime.getTime() + bufferTime

    // Debug logging for timing issues
    console.log(`🎮 Game timing check:`, {
      gameTime: gameStartTime.toLocaleString(),
      currentTime: now.toLocaleString(),
      minutesUntilStart: Math.round((gameStartTime.getTime() - now.getTime()) / (1000 * 60)),
      isGameStarted,
      gameId: game.id,
    })

    if (isGameStarted) {
      showToast('Cannot bet on live or finished games', 'error')
      return
    }

    const oddsValue =
      odd.fanduelodds ||
      odd.draftkingsodds ||
      odd.espnbetodds ||
      odd.ceasarsodds ||
      odd.mgmodds ||
      odd.fanaticsodds ||
      odd.bookodds ||
      0

    const bet: BetSlipBet = {
      id: `${game.id}-${odd.id}`,
      gameId: game.id,
      sport: game.sport_key,
      homeTeam: game.home_team,
      awayTeam: game.away_team,
      gameTime: game.commence_time,
      marketType: odd.oddid || 'unknown',
      selection: getSelectionLabel(odd.oddid || ''),
      odds: oddsValue,
      ...(odd.line && { line: parseFloat(odd.line) }),
      sportsbook: 'TrueSharp',
      description: `${getSelectionLabel(odd.oddid || '')} ${formatOdds(oddsValue)}`,
    }

    const result = addBet(bet)
    if (result.success) {
      showToast('Bet added to slip!', 'success')
    } else {
      showToast(result.error || 'Failed to add bet', 'error')
    }

    // Still call the original onClick handler for any additional functionality
    onOddsClick({
      gameId: game.id,
      sport: game.sport_key,
      homeTeam: game.home_team,
      awayTeam: game.away_team,
      gameTime: game.commence_time,
      marketType: 'moneyline',
      selection: getSelectionLabel(odd.oddid || ''),
      odds: oddsValue,
      line: odd.line ? parseFloat(odd.line) : undefined,
      sportsbook: 'TrueSharp',
      description: `${getSelectionLabel(odd.oddid || '')} ${formatOdds(oddsValue)}`,
    })
  }

  useEffect(() => {
    const fetchOdds = async () => {
      try {
        setIsLoading(true)
        setError(null)

        console.log('🎯 Fetching odds for game:', {
          gameId: game.id,
          homeTeam: game.home_team,
          awayTeam: game.away_team,
          sport: game.sport_key,
        })

        const supabase = createClient()

        const { data, error: oddsError } = await supabase
          .from('odds')
          .select('*')
          .eq('eventid', game.id)
          .order('created_at', { ascending: false }) // Remove limit, order by newest first

        if (oddsError) {
          throw new Error(`Failed to fetch odds: ${oddsError.message}`)
        }

        console.log('🎯 Odds fetched:', {
          gameId: game.id,
          oddsCount: data?.length || 0,
          oddidSamples:
            data?.slice(0, 10).map(odd => ({
              id: odd.id,
              oddid: odd.oddid,
              sportsbook: odd.sportsbook,
              line: odd.line,
              fanduelodds: odd.fanduelodds,
              draftkingsodds: odd.draftkingsodds,
            })) || [],
        })

        setOdds(data || [])
      } catch (err) {
        console.error('Error fetching odds:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    if (game.id) {
      fetchOdds()
    }
  }, [game.id, game.away_team, game.home_team, game.sport_key])

  // Categorize odds based on SportGameOdds API patterns
  const categorizeOdds = () => {
    const categorized: { [category: string]: { [subcategory: string]: DatabaseOdds[] } } = {}
    const uncategorized: DatabaseOdds[] = []

    console.log('🔥 Starting categorization for', odds.length, 'odds')

    odds.forEach((odd, index) => {
      if (!odd.oddid) {
        console.log(`⚠️ Skipping odd at index ${index} - no oddid`)
        return
      }

      // FILTER OUT YES/NO PROPS COMPLETELY
      if (odd.oddid.includes('-yn-')) {
        console.log(`⚠️ Filtering out yes/no prop: ${odd.oddid}`)
        return
      }

      try {
        let category = 'Main Lines'
        let subcategory = 'All'

        const oddid = odd.oddid.toLowerCase()

        // Log each odds being categorized for debugging
        if (index < 10) {
          // Log first 10 for debugging
          console.log(`🎯 Categorizing odd ${index + 1}: ${odd.oddid}`)
        }

        // ============ MAIN LINES (All Sports) ============
        // Money Line - exact patterns from games-page.md
        if (
          oddid.includes('points-home-game-ml-home') ||
          oddid.includes('points-away-game-ml-away') ||
          oddid.includes('points-all-game-ml-draw')
        ) {
          category = 'Main Lines'
          subcategory = 'All'
          console.log(`✅ Main Line (Moneyline): ${odd.oddid}`)
        }
        // Spread/Run Line/Puck Line - exact patterns from games-page.md
        else if (
          oddid.includes('points-home-game-sp-home') ||
          oddid.includes('points-away-game-sp-away')
        ) {
          category = 'Main Lines'
          subcategory = 'All'
          console.log(`✅ Main Line (Spread): ${odd.oddid}`)
        }
        // Totals/Over-Under (game level only) - exact patterns from games-page.md
        else if (
          (oddid.includes('points-all-game-ou-over') ||
            oddid.includes('points-all-game-ou-under')) &&
          !oddid.match(/\d{4,}/)
        ) {
          category = 'Main Lines'
          subcategory = 'All'
          console.log(`✅ Main Line (Total): ${odd.oddid}`)
        }

        // ============ PLAYER PROPS ============
        // Player props have player names in format: batting_something-FIRSTNAME_LASTNAME_1_LEAGUE-game-
        // Examples: batting_triples-MATT_MCLAIN_1_MLB-game-ou-under, fantasyScore-NOELVI_MARTE_1_MLB-game-ou-under
        else if (
          oddid.match(/-[A-Z_]+_1_[A-Z]+-game-/) ||
          (oddid.includes('-') && oddid.includes('_1_') && oddid.includes('-game-'))
        ) {
          category = 'Player Props'
          console.log(`🏃 Player Prop detected: ${odd.oddid}`)

          // Baseball specific
          if (league === 'MLB') {
            if (oddid.includes('batting_')) {
              subcategory = 'Hitters'
              console.log(`⚾ MLB Hitter prop: ${odd.oddid}`)
            } else if (oddid.includes('pitching_')) {
              subcategory = 'Pitchers'
              console.log(`⚾ MLB Pitcher prop: ${odd.oddid}`)
            } else if (oddid.includes('fantasyscore')) {
              subcategory = 'Hitters' // Fantasy score typically goes under hitters
              console.log(`⚾ MLB Fantasy score prop: ${odd.oddid}`)
            } else {
              subcategory = 'Hitters' // Default to hitters for most MLB props
              console.log(`⚾ MLB Generic player prop (defaulting to Hitters): ${odd.oddid}`)
            }
          }
          // Football specific
          else if (league === 'NFL' || league === 'NCAAF') {
            if (
              oddid.includes('passing_') ||
              oddid.includes('quarterback') ||
              oddid.includes('qb')
            ) {
              subcategory = 'Quarterback'
              console.log(`🏈 NFL QB prop: ${odd.oddid}`)
            } else if (oddid.includes('rushing_') && !oddid.includes('passing')) {
              subcategory = 'Running Back'
              console.log(`🏈 NFL RB prop: ${odd.oddid}`)
            } else if (oddid.includes('receiving_') || oddid.includes('reception')) {
              subcategory = 'Wide Receiver'
              console.log(`🏈 NFL WR prop: ${odd.oddid}`)
            } else if (
              oddid.includes('kicking_') ||
              oddid.includes('fieldgoals_') ||
              oddid.includes('defense_')
            ) {
              subcategory = 'Kicker/Defense'
              console.log(`🏈 NFL K/DEF prop: ${odd.oddid}`)
            } else {
              subcategory = 'Any Player'
              console.log(`🏈 NFL Generic player prop: ${odd.oddid}`)
            }
          }
          // Basketball specific
          else if (league === 'NBA' || league === 'NCAAB') {
            if (
              oddid.includes('points-') ||
              oddid.includes('fieldgoals_') ||
              oddid.includes('threepointers_') ||
              oddid.includes('freethrows_')
            ) {
              subcategory = 'Scoring'
              console.log(`🏀 NBA Scoring prop: ${odd.oddid}`)
            } else if (oddid.includes('rebounds')) {
              subcategory = 'Rebounding'
              console.log(`🏀 NBA Rebounding prop: ${odd.oddid}`)
            } else if (
              oddid.includes('assists-') ||
              oddid.includes('steals-') ||
              oddid.includes('blocks-') ||
              oddid.includes('turnovers-')
            ) {
              subcategory = 'Playmaking'
              console.log(`🏀 NBA Playmaking prop: ${odd.oddid}`)
            } else if (
              oddid.includes('+') ||
              oddid.includes('double') ||
              oddid.includes('combo') ||
              oddid.includes('fantasy')
            ) {
              subcategory = 'Combo Props'
              console.log(`🏀 NBA Combo prop: ${odd.oddid}`)
            } else {
              subcategory = 'All Players'
              console.log(`🏀 NBA Generic player prop: ${odd.oddid}`)
            }
          }
          // Hockey specific
          else if (league === 'NHL') {
            if (
              oddid.includes('saves-') ||
              oddid.includes('goalsagainst') ||
              oddid.includes('shutout') ||
              oddid.includes('win-')
            ) {
              subcategory = 'Goalies'
              console.log(`🏒 NHL Goalie prop: ${odd.oddid}`)
            } else {
              subcategory = 'Skaters'
              console.log(`🏒 NHL Skater prop: ${odd.oddid}`)
            }
          }
          // Soccer specific
          else if (league === 'Champions League' || league === 'MLS') {
            if (oddid.includes('goals-') || oddid.includes('shots') || oddid.includes('score')) {
              subcategory = 'Forwards'
              console.log(`⚽ Soccer Forward prop: ${odd.oddid}`)
            } else if (
              oddid.includes('passes') ||
              oddid.includes('assists-') ||
              oddid.includes('mid')
            ) {
              subcategory = 'Midfielders'
              console.log(`⚽ Soccer Midfielder prop: ${odd.oddid}`)
            } else if (
              oddid.includes('tackles-') ||
              oddid.includes('clearances') ||
              oddid.includes('blocks-') ||
              oddid.includes('interceptions')
            ) {
              subcategory = 'Defenders'
              console.log(`⚽ Soccer Defender prop: ${odd.oddid}`)
            } else if (
              oddid.includes('saves-') ||
              oddid.includes('goalsconceded') ||
              oddid.includes('cleansheet')
            ) {
              subcategory = 'Goalkeepers'
              console.log(`⚽ Soccer Goalkeeper prop: ${odd.oddid}`)
            } else {
              subcategory = 'All Players'
              console.log(`⚽ Soccer Generic player prop: ${odd.oddid}`)
            }
          } else {
            subcategory = 'All Players'
            console.log(`🎯 Generic player prop: ${odd.oddid}`)
          }
        }

        // ============ TEAM PROPS ============
        // Team props based on games-page.md patterns
        else if (
          (oddid.includes('points-home-game-ou-') ||
            oddid.includes('points-away-game-ou-') ||
            oddid.includes('batting_homeruns-home-game-') ||
            oddid.includes('batting_homeruns-away-game-') ||
            oddid.includes('touchdowns-home-game-') ||
            oddid.includes('touchdowns-away-game-') ||
            oddid.includes('corners-home-game-') ||
            oddid.includes('corners-away-game-') ||
            oddid.includes('shots-home-game-') ||
            oddid.includes('shots-away-game-') ||
            oddid.includes('firsttoscore-home-game-') ||
            oddid.includes('firsttoscore-away-game-') ||
            oddid.includes('lasttoscore-home-game-') ||
            oddid.includes('lasttoscore-away-game-')) &&
          !oddid.match(/\d{4,}/)
        ) {
          category = 'Team Props'
          subcategory = 'All'
        }

        // ============ GAME PROPS ============
        // Game props based on games-page.md patterns
        else if (
          (oddid.includes('batting_homeruns-all-game-') ||
            oddid.includes('touchdowns-all-game-') ||
            oddid.includes('corners-all-game-') ||
            oddid.includes('shots-all-game-') ||
            oddid.includes('overtime-all-game-') ||
            oddid.includes('extratime-all-game-') ||
            oddid.includes('penaltyshootout-all-game-') ||
            oddid.includes('bothteamstoscore-all-game-') ||
            oddid.includes('firstscore-all-game-') ||
            oddid.includes('lastscore-all-game-') ||
            oddid.includes('points-all-game-eo-') ||
            oddid.includes('firstgoaltime-all-game-') ||
            oddid.includes('longesttouchdown-all-game-') ||
            oddid.includes('timestied-all-game-') ||
            // Period/Inning specific props
            oddid.includes('points-all-1q-') ||
            oddid.includes('points-all-1h-') ||
            oddid.includes('points-all-2h-') ||
            oddid.includes('points-all-1p-') ||
            oddid.includes('points-all-2p-') ||
            oddid.includes('points-all-3p-') ||
            oddid.includes('points-all-1i-') ||
            oddid.includes('points-all-1ix') ||
            oddid.includes('points-away-1i-') ||
            oddid.includes('points-home-1i-') ||
            oddid.includes('points-away-1ix') ||
            oddid.includes('points-home-1ix') ||
            oddid.includes('points-away-1h-') ||
            oddid.includes('points-home-1h-')) &&
          !oddid.match(/-[A-Z_]+_1_[A-Z]+-game-/)
        ) {
          category = 'Game Props'
          subcategory = 'All'
          console.log(`🎯 Game/Period Prop: ${odd.oddid}`)
        }

        // ============ FALLBACK ============
        else {
          // Default to Main Lines if we can't categorize
          category = 'Main Lines'
          subcategory = 'All'
          console.log(`❓ Uncategorized, defaulting to Main Lines: ${odd.oddid}`)
          uncategorized.push(odd)
        }

        // Initialize category and subcategory if they don't exist
        if (!categorized[category]) {
          categorized[category] = {}
        }
        if (!categorized[category]![subcategory]) {
          categorized[category]![subcategory] = []
        }

        categorized[category]![subcategory]!.push(odd)
      } catch (error) {
        console.warn('❌ Failed to categorize oddid:', odd.oddid, error)
        // Fallback to Main Lines
        if (!categorized['Main Lines']) categorized['Main Lines'] = {}
        if (!categorized['Main Lines']['All']) categorized['Main Lines']['All'] = []
        categorized['Main Lines']['All'].push(odd)
        uncategorized.push(odd)
      }
    })

    // Log categorization summary
    console.log('📊 Categorization Summary:', {
      totalOdds: odds.length,
      categorized: Object.keys(categorized).reduce(
        (acc, cat) => {
          acc[cat] = Object.keys(categorized[cat] || {}).reduce(
            (subAcc, subCat) => {
              subAcc[subCat] = categorized[cat]?.[subCat]?.length || 0
              return subAcc
            },
            {} as { [key: string]: number }
          )
          return acc
        },
        {} as { [key: string]: { [key: string]: number } }
      ),
      uncategorizedCount: uncategorized.length,
      uncategorizedSamples: uncategorized.slice(0, 5).map(o => o.oddid),
    })

    return categorized
  }

  const categorizedOdds = categorizeOdds()

  // Get current filtered odds based on active category and subcategory
  const currentOdds = useMemo(() => {
    const categoryData = categorizedOdds[activeCategory]
    if (!categoryData) return []

    // For Main Lines (direct array), return all odds
    if (activeCategory === 'Main Lines') {
      return categoryData['All'] || []
    }

    // For other categories, use subcategory
    return categoryData[activeSubcategory] || []
  }, [categorizedOdds, activeCategory, activeSubcategory])

  // Get available markets for current subcategory
  const availableMarkets = useMemo(() => {
    const categoryData = tabStructure?.[activeCategory]
    if (!categoryData) return []

    // If it's an array (Main Lines), return the array
    if (Array.isArray(categoryData)) {
      return categoryData
    }

    // If it's an object (other categories), get the subcategory
    return categoryData[activeSubcategory] || []
  }, [tabStructure, activeCategory, activeSubcategory])

  // Filter odds by active market if one is selected
  const displayOdds = useMemo(() => {
    // For Main Lines, don't filter by market - show all odds
    if (activeCategory === 'Main Lines' || !activeMarket) return currentOdds

    return currentOdds.filter(odd => {
      if (!odd.oddid) return false

      const lowerMarket = activeMarket.toLowerCase()
      const lowerOddid = odd.oddid.toLowerCase()

      // ============ MAIN LINES MATCHING ============
      if (
        lowerMarket.includes('moneyline') &&
        (lowerOddid.includes('-ml-') ||
          lowerOddid.includes('points-home-game-ml-') ||
          lowerOddid.includes('points-away-game-ml-'))
      )
        return true
      if (lowerMarket.includes('spread') || lowerMarket.includes('line')) {
        if (
          lowerOddid.includes('-sp-') ||
          lowerOddid.includes('-rl-') ||
          lowerOddid.includes('points-home-game-sp-') ||
          lowerOddid.includes('points-away-game-sp-')
        )
          return true
      }
      if (lowerMarket.includes('total') || lowerMarket.includes('over/under')) {
        if (lowerOddid.includes('-ou-') && lowerOddid.includes('points-all-game-ou-')) return true
      }

      // ============ BASEBALL SPECIFIC MATCHING ============
      if (league === 'MLB') {
        // Hitter props - updated for new format
        if (lowerMarket.includes('hits') && lowerOddid.includes('batting_hits')) return true
        if (
          lowerMarket.includes('home runs') &&
          (lowerOddid.includes('batting_homeruns') || lowerOddid.includes('batting_homerun'))
        )
          return true
        if (lowerMarket.includes('rbis') && lowerOddid.includes('batting_rbi')) return true
        if (lowerMarket.includes('runs scored') && lowerOddid.includes('batting_runs')) return true
        if (lowerMarket.includes('total bases') && lowerOddid.includes('batting_totalbases'))
          return true
        if (lowerMarket.includes('singles') && lowerOddid.includes('batting_singles')) return true
        if (lowerMarket.includes('doubles') && lowerOddid.includes('batting_doubles')) return true
        if (lowerMarket.includes('triples') && lowerOddid.includes('batting_triples')) return true
        if (lowerMarket.includes('stolen bases') && lowerOddid.includes('batting_stolenbases'))
          return true
        if (
          lowerMarket.includes('walks') &&
          (lowerOddid.includes('batting_walks') || lowerOddid.includes('batting_basesonballs'))
        )
          return true

        // Pitcher props
        if (lowerMarket.includes('strikeouts') && lowerOddid.includes('pitching_strikeouts'))
          return true
        if (lowerMarket.includes('hits allowed') && lowerOddid.includes('pitching_hits'))
          return true
        if (lowerMarket.includes('earned runs') && lowerOddid.includes('pitching_earnedruns'))
          return true
        if (lowerMarket.includes('walks allowed') && lowerOddid.includes('pitching_walks'))
          return true
        if (lowerMarket.includes('home runs allowed') && lowerOddid.includes('pitching_homeruns'))
          return true
        if (lowerMarket.includes('pitches thrown') && lowerOddid.includes('pitching_pitches'))
          return true
        if (lowerMarket.includes('outs recorded') && lowerOddid.includes('pitching_outs'))
          return true
      }

      // ============ FOOTBALL SPECIFIC MATCHING ============
      if (league === 'NFL' || league === 'NCAAF') {
        // QB props
        if (lowerMarket.includes('passing yards') && lowerOddid.includes('passing_yards'))
          return true
        if (lowerMarket.includes('passing touchdowns') && lowerOddid.includes('passing_touchdowns'))
          return true
        if (lowerMarket.includes('interceptions') && lowerOddid.includes('passing_interceptions'))
          return true
        if (lowerMarket.includes('completions') && lowerOddid.includes('passing_completions'))
          return true
        if (lowerMarket.includes('passing attempts') && lowerOddid.includes('passing_attempts'))
          return true
        if (lowerMarket.includes('passer rating') && lowerOddid.includes('passing_passerrating'))
          return true

        // RB props
        if (lowerMarket.includes('rushing yards') && lowerOddid.includes('rushing_yards'))
          return true
        if (lowerMarket.includes('rushing touchdowns') && lowerOddid.includes('rushing_touchdowns'))
          return true
        if (lowerMarket.includes('rushing attempts') && lowerOddid.includes('rushing_attempts'))
          return true
        if (
          lowerMarket.includes('rushing + receiving') &&
          lowerOddid.includes('rushing+receiving_yards')
        )
          return true

        // WR props
        if (lowerMarket.includes('receiving yards') && lowerOddid.includes('receiving_yards'))
          return true
        if (lowerMarket.includes('receptions') && lowerOddid.includes('receiving_receptions'))
          return true
        if (
          lowerMarket.includes('receiving touchdowns') &&
          lowerOddid.includes('receiving_touchdowns')
        )
          return true

        // Kicker/Defense props
        if (lowerMarket.includes('kicking points') && lowerOddid.includes('kicking_totalpoints'))
          return true
        if (lowerMarket.includes('field goals') && lowerOddid.includes('fieldgoals_made'))
          return true
        if (lowerMarket.includes('sacks') && lowerOddid.includes('defense_sacks')) return true
        if (lowerMarket.includes('tackles') && lowerOddid.includes('defense_tackles')) return true

        // Any player props
        if (lowerMarket.includes('fantasy score') && lowerOddid.includes('fantasyscore'))
          return true
        if (lowerMarket.includes('turnovers') && lowerOddid.includes('turnovers')) return true
      }

      // ============ BASKETBALL SPECIFIC MATCHING ============
      if (league === 'NBA' || league === 'NCAAB') {
        // Scoring props - updated for new player name format
        if (
          lowerMarket.includes('points') &&
          lowerOddid.includes('points-') &&
          lowerOddid.match(/-[A-Z_]+_1_[A-Z]+-game-/)
        )
          return true
        if (lowerMarket.includes('field goals') && lowerOddid.includes('fieldgoals_')) return true
        if (lowerMarket.includes('three-pointers') && lowerOddid.includes('threepointers_'))
          return true
        if (lowerMarket.includes('free throws') && lowerOddid.includes('freethrows_')) return true

        // Rebounding props
        if (
          lowerMarket.includes('rebounds') &&
          lowerOddid.includes('rebounds') &&
          lowerOddid.match(/-[A-Z_]+_1_[A-Z]+-game-/)
        )
          return true
        if (lowerMarket.includes('offensive rebounds') && lowerOddid.includes('rebounds_offensive'))
          return true
        if (lowerMarket.includes('defensive rebounds') && lowerOddid.includes('rebounds_defensive'))
          return true

        // Playmaking props
        if (
          lowerMarket.includes('assists') &&
          lowerOddid.includes('assists-') &&
          lowerOddid.match(/-[A-Z_]+_1_[A-Z]+-game-/)
        )
          return true
        if (
          lowerMarket.includes('steals') &&
          lowerOddid.includes('steals-') &&
          lowerOddid.match(/-[A-Z_]+_1_[A-Z]+-game-/)
        )
          return true
        if (
          lowerMarket.includes('blocks') &&
          lowerOddid.includes('blocks-') &&
          lowerOddid.match(/-[A-Z_]+_1_[A-Z]+-game-/)
        )
          return true

        // Combo props
        if (lowerMarket.includes('+') && lowerOddid.includes('+')) return true
        if (lowerMarket.includes('double') && lowerOddid.includes('double')) return true
      }

      // ============ HOCKEY SPECIFIC MATCHING ============
      if (league === 'NHL') {
        // Skater props - updated for new player name format
        if (
          lowerMarket.includes('goals') &&
          lowerOddid.includes('goals-') &&
          lowerOddid.match(/-[A-Z_]+_1_[A-Z]+-game-/)
        )
          return true
        if (
          lowerMarket.includes('assists') &&
          lowerOddid.includes('assists-') &&
          lowerOddid.match(/-[A-Z_]+_1_[A-Z]+-game-/)
        )
          return true
        if (
          lowerMarket.includes('points') &&
          lowerOddid.includes('points-') &&
          lowerOddid.match(/-[A-Z_]+_1_[A-Z]+-game-/)
        )
          return true
        if (lowerMarket.includes('shots on goal') && lowerOddid.includes('shots_ongoal'))
          return true
        if (
          lowerMarket.includes('hits') &&
          lowerOddid.includes('hits-') &&
          lowerOddid.match(/-[A-Z_]+_1_[A-Z]+-game-/)
        )
          return true
        if (lowerMarket.includes('penalty minutes') && lowerOddid.includes('penaltyminutes'))
          return true
        if (lowerMarket.includes('faceoff wins') && lowerOddid.includes('faceoffwins')) return true

        // Goalie props
        if (
          lowerMarket.includes('saves') &&
          lowerOddid.includes('saves-') &&
          lowerOddid.match(/-[A-Z_]+_1_[A-Z]+-game-/)
        )
          return true
        if (lowerMarket.includes('goals against') && lowerOddid.includes('goalsagainst'))
          return true
        if (lowerMarket.includes('save percentage') && lowerOddid.includes('savepercentage'))
          return true
      }

      // ============ SOCCER SPECIFIC MATCHING ============
      if (league === 'Champions League' || league === 'MLS') {
        // Forward props - updated for new player name format
        if (
          lowerMarket.includes('goals') &&
          lowerOddid.includes('goals-') &&
          lowerOddid.match(/-[A-Z_]+_1_[A-Z]+-game-/)
        )
          return true
        if (
          lowerMarket.includes('shots') &&
          lowerOddid.includes('shots-') &&
          lowerOddid.match(/-[A-Z_]+_1_[A-Z]+-game-/)
        )
          return true
        if (
          lowerMarket.includes('assists') &&
          lowerOddid.includes('assists-') &&
          lowerOddid.match(/-[A-Z_]+_1_[A-Z]+-game-/)
        )
          return true

        // Midfielder props
        if (lowerMarket.includes('passes') && lowerOddid.includes('passes')) return true
        if (
          lowerMarket.includes('tackles') &&
          lowerOddid.includes('tackles-') &&
          lowerOddid.match(/-[A-Z_]+_1_[A-Z]+-game-/)
        )
          return true

        // Defender props
        if (lowerMarket.includes('clearances') && lowerOddid.includes('clearances')) return true
        if (lowerMarket.includes('interceptions') && lowerOddid.includes('interceptions'))
          return true

        // Goalkeeper props
        if (
          lowerMarket.includes('saves') &&
          lowerOddid.includes('saves-') &&
          lowerOddid.match(/-[A-Z_]+_1_[A-Z]+-game-/)
        )
          return true
        if (lowerMarket.includes('clean sheet') && lowerOddid.includes('cleansheet')) return true
      }

      // ============ TEAM PROPS MATCHING ============
      if (
        lowerMarket.includes('team total') &&
        (lowerOddid.includes('-home-game-') || lowerOddid.includes('-away-game-'))
      )
        return true
      if (
        lowerMarket.includes('team to score') &&
        (lowerOddid.includes('firsttoscore') || lowerOddid.includes('lasttoscore'))
      )
        return true

      // ============ GAME PROPS MATCHING ============
      if (lowerMarket.includes('even/odd') && lowerOddid.includes('-eo-')) return true
      // Removed yes/no prop matching - these props are filtered out
      if (lowerMarket.includes('overtime') && lowerOddid.includes('overtime')) return true
      if (lowerMarket.includes('first quarter') && lowerOddid.includes('-1q-')) return true
      if (lowerMarket.includes('first half') && lowerOddid.includes('-1h-')) return true
      if (lowerMarket.includes('second half') && lowerOddid.includes('-2h-')) return true
      if (lowerMarket.includes('first period') && lowerOddid.includes('-1p-')) return true
      if (lowerMarket.includes('second period') && lowerOddid.includes('-2p-')) return true
      if (lowerMarket.includes('third period') && lowerOddid.includes('-3p-')) return true

      return false
    })
  }, [currentOdds, activeMarket, activeCategory, league])

  // Set initial market when subcategory changes
  useEffect(() => {
    // Don't set market for Main Lines - show all odds together
    if (activeCategory === 'Main Lines') {
      setActiveMarket('')
      return
    }

    if (
      availableMarkets.length > 0 &&
      (!activeMarket || !availableMarkets.includes(activeMarket))
    ) {
      setActiveMarket(availableMarkets[0] || '')
    }
  }, [activeCategory, activeSubcategory, availableMarkets, activeMarket])

  const renderMainLinesDisplay = () => {
    // More aggressive deduplication - create unique oddid maps
    const uniqueOdds = new Map()

    // First pass: collect all odds and keep only the first occurrence of each oddid
    displayOdds.forEach(odd => {
      if (odd.oddid && !uniqueOdds.has(odd.oddid)) {
        uniqueOdds.set(odd.oddid, odd)
      }
    })

    const uniqueOddsArray = Array.from(uniqueOdds.values())

    // Group main lines by type using exact games-page.md patterns
    const moneylineOdds = uniqueOddsArray.filter(odd => {
      if (!odd.oddid) return false
      return (
        odd.oddid === 'points-home-game-ml-home' ||
        odd.oddid === 'points-away-game-ml-away' ||
        odd.oddid === 'points-all-game-ml-draw'
      )
    })

    const spreadOdds = uniqueOddsArray.filter(odd => {
      if (!odd.oddid) return false
      return odd.oddid === 'points-home-game-sp-home' || odd.oddid === 'points-away-game-sp-away'
    })

    const totalOdds = uniqueOddsArray.filter(odd => {
      if (!odd.oddid) return false
      return odd.oddid === 'points-all-game-ou-over' || odd.oddid === 'points-all-game-ou-under'
    })

    const gameStartTime = new Date(game.commence_time)
    const now = new Date()

    // Add 10-minute buffer after game starts before disabling bets
    const bufferTime = 10 * 60 * 1000 // 10 minutes in milliseconds
    const isGameStarted = now.getTime() >= gameStartTime.getTime() + bufferTime

    return (
      <div className="space-y-4">
        {/* Moneyline */}
        {moneylineOdds.length > 0 && (
          <div className="rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-3">
            <h4 className="mb-2 flex items-center text-sm font-bold text-blue-800">💰 Moneyline</h4>
            <div className="grid grid-cols-2 gap-2">
              {moneylineOdds.map(odd => {
                const oddsValue =
                  odd.fanduelodds ||
                  odd.draftkingsodds ||
                  odd.espnbetodds ||
                  odd.ceasarsodds ||
                  odd.mgmodds ||
                  odd.fanaticsodds ||
                  odd.bookodds ||
                  0
                const isSelected = selectedBets.some(
                  bet => bet.gameId === game.id && bet.sportsbook === odd.sportsbook
                )

                const team = odd.oddid?.includes('-home')
                  ? game.home_team
                  : odd.oddid?.includes('-away')
                    ? game.away_team
                    : 'Draw'

                return (
                  <button
                    key={odd.id}
                    onClick={() => handleBetClick(odd)}
                    disabled={isGameStarted}
                    className={`rounded-lg border border-slate-200 px-3 py-2 font-semibold shadow-sm transition-all ${
                      isSelected
                        ? 'bg-gradient-to-b from-blue-600 to-blue-700 text-white shadow-md'
                        : isGameStarted
                          ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                          : 'to-purple-25 cursor-pointer bg-gradient-to-b from-white text-slate-800 hover:from-purple-100 hover:to-purple-200 hover:shadow-md'
                    } `}
                  >
                    <div className="text-center">
                      <div className="text-sm font-bold text-purple-700">{team}</div>
                      <div className="font-mono text-lg font-bold">{formatOdds(oddsValue)}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Spread */}
        {spreadOdds.length > 0 && (
          <div className="rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-3">
            <h4 className="mb-2 flex items-center text-sm font-bold text-blue-800">
              📊 {league === 'MLB' ? 'Run Line' : league === 'NHL' ? 'Puck Line' : 'Point Spread'}
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {spreadOdds.map(odd => {
                const oddsValue =
                  odd.fanduelodds ||
                  odd.draftkingsodds ||
                  odd.espnbetodds ||
                  odd.ceasarsodds ||
                  odd.mgmodds ||
                  odd.fanaticsodds ||
                  odd.bookodds ||
                  0
                const isSelected = selectedBets.some(
                  bet => bet.gameId === game.id && bet.sportsbook === odd.sportsbook
                )

                const team = odd.oddid?.includes('-home') ? game.home_team : game.away_team
                const line = odd.line ? parseFloat(odd.line) : 0
                const displayLine = line > 0 ? `+${line}` : line.toString()

                return (
                  <button
                    key={odd.id}
                    onClick={() => handleBetClick(odd)}
                    disabled={isGameStarted}
                    className={`rounded-lg border border-slate-200 px-3 py-2 font-semibold shadow-sm transition-all ${
                      isSelected
                        ? 'bg-gradient-to-b from-blue-600 to-blue-700 text-white shadow-md'
                        : isGameStarted
                          ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                          : 'to-purple-25 cursor-pointer bg-gradient-to-b from-white text-slate-800 hover:from-purple-100 hover:to-purple-200 hover:shadow-md'
                    } `}
                  >
                    <div className="text-center">
                      <div className="text-sm font-bold text-purple-700">{team}</div>
                      <div className="text-xs font-bold text-purple-600">{displayLine}</div>
                      <div className="font-mono text-lg font-bold">{formatOdds(oddsValue)}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Total */}
        {totalOdds.length > 0 && (
          <div className="rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-3">
            <h4 className="mb-2 flex items-center text-sm font-bold text-blue-800">
              🎯 Total {league === 'MLB' ? 'Runs' : league === 'NHL' ? 'Goals' : 'Points'}
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {totalOdds.map(odd => {
                const oddsValue =
                  odd.fanduelodds ||
                  odd.draftkingsodds ||
                  odd.espnbetodds ||
                  odd.ceasarsodds ||
                  odd.mgmodds ||
                  odd.fanaticsodds ||
                  odd.bookodds ||
                  0
                const isSelected = selectedBets.some(
                  bet => bet.gameId === game.id && bet.sportsbook === odd.sportsbook
                )

                const isOver = odd.oddid?.includes('-ou-over')
                const line = odd.line || ''

                return (
                  <button
                    key={odd.id}
                    onClick={() => handleBetClick(odd)}
                    disabled={isGameStarted}
                    className={`rounded-lg border border-slate-200 px-3 py-2 font-semibold shadow-sm transition-all ${
                      isSelected
                        ? 'bg-gradient-to-b from-blue-600 to-blue-700 text-white shadow-md'
                        : isGameStarted
                          ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                          : 'to-purple-25 cursor-pointer bg-gradient-to-b from-white text-slate-800 hover:from-purple-100 hover:to-purple-200 hover:shadow-md'
                    } `}
                  >
                    <div className="text-center">
                      <div className="text-sm font-bold text-purple-700">
                        {isOver ? 'Over' : 'Under'}
                      </div>
                      <div className="text-xs font-bold text-purple-600">{line}</div>
                      <div className="font-mono text-lg font-bold">{formatOdds(oddsValue)}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Helper function to get prop display name (enhanced parsing based on games-page.md)
  const getPropDisplayName = (oddid: string): string => {
    const lowerOddid = oddid.toLowerCase()

    // ============ BASEBALL PROPS (games-page.md patterns) ============
    // Hitter props
    if (lowerOddid.includes('batting_hits')) return 'Hits'
    if (lowerOddid.includes('batting_homeruns') || lowerOddid.includes('batting_homerun'))
      return 'Home Runs'
    if (lowerOddid.includes('batting_rbi')) return 'RBIs'
    if (lowerOddid.includes('batting_runs')) return 'Runs'
    if (lowerOddid.includes('batting_totalbases')) return 'Total Bases'
    if (lowerOddid.includes('batting_singles')) return 'Singles'
    if (lowerOddid.includes('batting_doubles')) return 'Doubles'
    if (lowerOddid.includes('batting_triples')) return 'Triples'
    if (lowerOddid.includes('batting_stolenbases')) return 'Stolen Bases'
    if (lowerOddid.includes('batting_strikeouts')) return 'Strikeouts (Batter)'
    if (lowerOddid.includes('batting_basesonballs') || lowerOddid.includes('batting_walks'))
      return 'Walks'
    if (lowerOddid.includes('batting_hits+runs+rbi')) return 'Hits+Runs+RBIs'
    if (lowerOddid.includes('batting_firsthomerun')) return 'First Home Run'

    // ============ GENERAL PLAYER PROPS ============
    if (lowerOddid.includes('fantasyscore')) return 'Fantasy Score'

    // Pitcher props
    if (lowerOddid.includes('pitching_strikeouts')) return 'Strikeouts (Pitcher)'
    if (lowerOddid.includes('pitching_hits')) return 'Hits Allowed'
    if (lowerOddid.includes('pitching_earnedruns')) return 'Earned Runs'
    if (lowerOddid.includes('pitching_basesonballs') || lowerOddid.includes('pitching_walks'))
      return 'Walks Allowed'
    if (lowerOddid.includes('pitching_homerunsallowed')) return 'HRs Allowed'
    if (lowerOddid.includes('pitching_pitchesthrown') || lowerOddid.includes('pitching_pitches'))
      return 'Pitches Thrown'
    if (lowerOddid.includes('pitching_outs')) return 'Outs Recorded'
    if (lowerOddid.includes('pitching_win')) return 'Win'

    // ============ FOOTBALL PROPS (games-page.md patterns) ============
    // QB props
    if (lowerOddid.includes('passing_yards')) return 'Passing Yards'
    if (lowerOddid.includes('passing_touchdowns')) return 'Passing TDs'
    if (lowerOddid.includes('passing_completions')) return 'Completions'
    if (lowerOddid.includes('passing_attempts')) return 'Pass Attempts'
    if (lowerOddid.includes('passing_longestcompletion')) return 'Longest Completion'
    if (lowerOddid.includes('passing_passerrating')) return 'Passer Rating'
    if (lowerOddid.includes('passing+rushing_yards')) return 'Pass+Rush Yards'
    if (lowerOddid.includes('defense_interceptions')) return 'Interceptions'

    // RB/WR props
    if (lowerOddid.includes('rushing_yards')) return 'Rushing Yards'
    if (lowerOddid.includes('rushing_touchdowns')) return 'Rushing TDs'
    if (lowerOddid.includes('rushing_attempts')) return 'Rush Attempts'
    if (lowerOddid.includes('rushing_longestrush')) return 'Longest Rush'
    if (lowerOddid.includes('rushing+receiving_yards')) return 'Rush+Rec Yards'
    if (lowerOddid.includes('receiving_yards')) return 'Receiving Yards'
    if (lowerOddid.includes('receiving_receptions')) return 'Receptions'
    if (lowerOddid.includes('receiving_touchdowns')) return 'Receiving TDs'
    if (lowerOddid.includes('receiving_longestreception')) return 'Longest Reception'

    // Kicker/Defense props
    if (lowerOddid.includes('kicking_totalpoints')) return 'Kicking Points'
    if (lowerOddid.includes('fieldgoals_made')) return 'Field Goals Made'
    if (lowerOddid.includes('fieldgoals_longestmade')) return 'Longest FG'
    if (lowerOddid.includes('extrapoints_kicksmade')) return 'Extra Points'
    if (lowerOddid.includes('defense_sacks')) return 'Sacks'
    if (lowerOddid.includes('defense_tackles')) return 'Tackles'
    if (lowerOddid.includes('defense_fumblerecoveries')) return 'Fumble Recoveries'
    if (lowerOddid.includes('defense_touchdowns')) return 'Defensive TDs'

    // ============ BASKETBALL PROPS (games-page.md patterns) ============
    if (lowerOddid.includes('points-') && lowerOddid.match(/\d{4,}/)) return 'Points'
    if (lowerOddid.includes('fieldgoals_made')) return 'Field Goals Made'
    if (lowerOddid.includes('fieldgoals_attempts')) return 'Field Goal Attempts'
    if (lowerOddid.includes('threepointers_made')) return 'Three-Pointers Made'
    if (lowerOddid.includes('threepointers_attempts')) return 'Three-Point Attempts'
    if (lowerOddid.includes('freethrows_made')) return 'Free Throws Made'
    if (lowerOddid.includes('freethrows_attempts')) return 'Free Throw Attempts'
    if (lowerOddid.includes('rebounds_offensive')) return 'Offensive Rebounds'
    if (lowerOddid.includes('rebounds_defensive')) return 'Defensive Rebounds'
    if (
      lowerOddid.includes('rebounds') &&
      !lowerOddid.includes('offensive') &&
      !lowerOddid.includes('defensive')
    )
      return 'Total Rebounds'
    if (lowerOddid.includes('assists-')) return 'Assists'
    if (lowerOddid.includes('steals-')) return 'Steals'
    if (lowerOddid.includes('blocks-')) return 'Blocks'
    if (lowerOddid.includes('turnovers-')) return 'Turnovers'
    if (lowerOddid.includes('points+rebounds')) return 'Points+Rebounds'
    if (lowerOddid.includes('points+assists')) return 'Points+Assists'
    if (lowerOddid.includes('rebounds+assists')) return 'Rebounds+Assists'
    if (lowerOddid.includes('points+rebounds+assists')) return 'Points+Rebounds+Assists'
    if (lowerOddid.includes('doubledouble')) return 'Double-Double'
    if (lowerOddid.includes('tripledouble')) return 'Triple-Double'
    if (lowerOddid.includes('firstbasket')) return 'First Basket'
    if (lowerOddid.includes('blocks+steals')) return 'Blocks+Steals'

    // ============ HOCKEY PROPS (games-page.md patterns) ============
    if (lowerOddid.includes('goals-') && lowerOddid.match(/\d{4,}/)) return 'Goals'
    if (lowerOddid.includes('assists-') && lowerOddid.match(/\d{4,}/)) return 'Assists'
    if (lowerOddid.includes('shots_ongoal')) return 'Shots on Goal'
    if (lowerOddid.includes('hits-')) return 'Hits'
    if (lowerOddid.includes('blockedshots')) return 'Blocked Shots'
    if (lowerOddid.includes('penaltyminutes')) return 'Penalty Minutes'
    if (lowerOddid.includes('powerplaypoints')) return 'Power Play Points'
    if (lowerOddid.includes('timeonice')) return 'Time on Ice'
    if (lowerOddid.includes('faceoffwins')) return 'Faceoff Wins'
    if (lowerOddid.includes('firstgoal')) return 'First Goal'
    if (lowerOddid.includes('saves-')) return 'Saves'
    if (lowerOddid.includes('goalsagainst')) return 'Goals Against'
    if (lowerOddid.includes('savepercentage')) return 'Save Percentage'
    if (lowerOddid.includes('shutout')) return 'Shutout'
    if (lowerOddid.includes('win-') && lowerOddid.match(/\d{4,}/)) return 'Win'

    // ============ SOCCER PROPS (games-page.md patterns) ============
    if (lowerOddid.includes('goals-') && lowerOddid.match(/\d{4,}/)) return 'Goals'
    if (lowerOddid.includes('shots_ontarget')) return 'Shots on Target'
    if (lowerOddid.includes('shots-') && !lowerOddid.includes('ontarget')) return 'Shots'
    if (lowerOddid.includes('assists-') && lowerOddid.match(/\d{4,}/)) return 'Assists'
    if (lowerOddid.includes('fouls-')) return 'Fouls'
    if (lowerOddid.includes('cards-')) return 'Cards'
    if (lowerOddid.includes('passescompleted')) return 'Passes Completed'
    if (lowerOddid.includes('passcompletionpercentage')) return 'Pass Completion %'
    if (lowerOddid.includes('tackles-') && lowerOddid.match(/\d{4,}/)) return 'Tackles'
    if (lowerOddid.includes('clearances')) return 'Clearances'
    if (lowerOddid.includes('blocks-') && lowerOddid.match(/\d{4,}/)) return 'Blocks'
    if (lowerOddid.includes('interceptions') && lowerOddid.match(/\d{4,}/)) return 'Interceptions'
    if (lowerOddid.includes('saves-') && lowerOddid.match(/\d{4,}/)) return 'Saves'
    if (lowerOddid.includes('goalsconceded')) return 'Goals Conceded'
    if (lowerOddid.includes('cleansheet')) return 'Clean Sheet'
    if (lowerOddid.includes('punchescatches')) return 'Punches/Catches'

    // ============ TEAM PROPS ============
    if (lowerOddid.includes('touchdowns') && !lowerOddid.match(/\d{4,}/)) return 'Team Touchdowns'
    if (lowerOddid.includes('corners') && !lowerOddid.match(/\d{4,}/)) return 'Team Corners'
    if (lowerOddid.includes('firsttoscore')) return 'First to Score'
    if (lowerOddid.includes('lasttoscore')) return 'Last to Score'

    // ============ GAME PROPS ============
    if (lowerOddid.includes('overtime') && lowerOddid.includes('-all-game-')) return 'Overtime'
    if (lowerOddid.includes('extratime') && lowerOddid.includes('-all-game-')) return 'Extra Time'
    if (lowerOddid.includes('penaltyshootout')) return 'Penalty Shootout'
    if (lowerOddid.includes('bothteamstoscore')) return 'Both Teams to Score'
    if (lowerOddid.includes('firstscore') && lowerOddid.includes('-all-game-'))
      return 'First Score Type'
    if (lowerOddid.includes('lastscore') && lowerOddid.includes('-all-game-'))
      return 'Last Score Type'
    if (lowerOddid.includes('firstgoaltime')) return 'First Goal Time'
    if (lowerOddid.includes('longesttouchdown')) return 'Longest Touchdown'
    if (lowerOddid.includes('timestied')) return 'Times Tied'

    // ============ PERIOD/QUARTER/HALF PROPS ============
    if (lowerOddid.includes('-1q-')) return 'First Quarter'
    if (lowerOddid.includes('-2q-')) return 'Second Quarter'
    if (lowerOddid.includes('-3q-')) return 'Third Quarter'
    if (lowerOddid.includes('-4q-')) return 'Fourth Quarter'
    if (lowerOddid.includes('-1h-')) return 'First Half'
    if (lowerOddid.includes('-2h-')) return 'Second Half'
    if (lowerOddid.includes('-1p-')) return 'First Period'
    if (lowerOddid.includes('-2p-')) return 'Second Period'
    if (lowerOddid.includes('-3p-')) return 'Third Period'
    if (lowerOddid.includes('-1i-')) return 'First Inning'

    // ============ SPECIAL PROPS ============
    if (lowerOddid.includes('fantasyscore')) return 'Fantasy Score'
    if (lowerOddid.includes('anytimetouchdown')) return 'Anytime TD'
    if (lowerOddid.includes('anytimegoal')) return 'Anytime Goal'

    // ============ FALLBACK for team totals ============
    if (lowerOddid.includes('points-home-game-ou') || lowerOddid.includes('points-away-game-ou')) {
      return lowerOddid.includes('-home-') ? `${game.home_team} Total` : `${game.away_team} Total`
    }

    return 'Prop'
  }

  // Helper function to extract player name from oddid (improved parsing)
  const getPlayerName = (oddid: string): string => {
    // New format: batting_stolenBases-FIRST_LAST_1_MLB-game-ou-over
    // Try multiple patterns to extract player name

    // Pattern 1: Most common - batting_something-FIRST_LAST_1_LEAGUE-game (no trailing dash)
    let nameMatch = oddid.match(/-([A-Z_]+)_1_[A-Z]+-game$/)
    if (nameMatch && nameMatch[1]) {
      // Convert TYLER_FREEMAN to Tyler Freeman
      const playerName = nameMatch[1]
        .split('_')
        .map(part => part.charAt(0) + part.slice(1).toLowerCase())
        .join(' ')
      return playerName
    }

    // Pattern 1b: With trailing dash - batting_something-FIRST_LAST_1_LEAGUE-game-
    nameMatch = oddid.match(/-([A-Z_]+)_1_[A-Z]+-game-/)
    if (nameMatch && nameMatch[1]) {
      const playerName = nameMatch[1]
        .split('_')
        .map(part => part.charAt(0) + part.slice(1).toLowerCase())
        .join(' ')
      return playerName
    }

    // Pattern 2: Alternative format - something-FIRST_LAST_1_LEAGUE-something
    nameMatch = oddid.match(/-([A-Z][A-Z_]*[A-Z])_1_[A-Z]+-/)
    if (nameMatch && nameMatch[1]) {
      const playerName = nameMatch[1]
        .split('_')
        .map(part => part.charAt(0) + part.slice(1).toLowerCase())
        .join(' ')
      return playerName
    }

    // Fallback to old logic for backwards compatibility
    const playerId = oddid.match(/\d{4,}/)?.[0]
    if (playerId) {
      // Extract potential player name from oddid patterns
      // Look for common patterns before the player ID
      const beforeId = oddid.split(playerId)[0]

      // Try to extract player name from common patterns
      if (beforeId && beforeId.includes('_')) {
        const parts = beforeId.split('_')
        if (parts.length > 1) {
          const potential = parts[parts.length - 1]
          if (potential && potential.length > 2 && !potential.includes('-')) {
            return potential.charAt(0).toUpperCase() + potential.slice(1)
          }
        }
      }

      // Look for name patterns in the oddid
      const legacyNameMatch = oddid.match(/([a-zA-Z]{2,})\d{4,}/)
      if (legacyNameMatch && legacyNameMatch[1] && legacyNameMatch[1].length > 2) {
        return legacyNameMatch[1].charAt(0).toUpperCase() + legacyNameMatch[1].slice(1)
      }

      // If we can't extract a name, show a more descriptive placeholder
      if (oddid.includes('batting_') || oddid.includes('pitching_')) {
        return oddid.includes('batting_')
          ? `Batter #${playerId.slice(-3)}`
          : `Pitcher #${playerId.slice(-3)}`
      } else if (
        oddid.includes('passing_') ||
        oddid.includes('rushing_') ||
        oddid.includes('receiving_')
      ) {
        if (oddid.includes('passing_')) return `QB #${playerId.slice(-3)}`
        if (oddid.includes('rushing_')) return `RB #${playerId.slice(-3)}`
        if (oddid.includes('receiving_')) return `WR #${playerId.slice(-3)}`
      } else if (
        oddid.includes('goals-') ||
        oddid.includes('assists-') ||
        oddid.includes('saves-')
      ) {
        return oddid.includes('saves-')
          ? `Goalie #${playerId.slice(-3)}`
          : `Player #${playerId.slice(-3)}`
      }

      return `Player #${playerId.slice(-3)}`
    }

    return 'Player'
  }

  // Helper function to get team name for team props (improved parsing)
  const getTeamFromOddid = (oddid: string): string => {
    if (oddid.includes('-home-game-')) {
      return game.home_team
    }
    if (oddid.includes('-away-game-')) {
      return game.away_team
    }

    // Handle other team identification patterns
    if (oddid.includes('home') && !oddid.includes('away')) {
      return game.home_team
    }
    if (oddid.includes('away') && !oddid.includes('home')) {
      return game.away_team
    }

    return 'Team'
  }

  // Function to render props in grouped over/under format
  const renderPropsDisplay = () => {
    console.log(`🎨 Rendering props display with ${displayOdds.length} odds`)

    // Enhanced deduplication by oddid with multiple passes
    const uniqueOdds = new Map()
    displayOdds.forEach(odd => {
      if (odd.oddid && !odd.oddid.includes('-yn-') && !uniqueOdds.has(odd.oddid)) {
        uniqueOdds.set(odd.oddid, odd)
      }
    })

    const deduplicatedOdds = Array.from(uniqueOdds.values())
    console.log(`🎨 Deduplicated to ${deduplicatedOdds.length} unique odds`)

    // Group props by their base identifier (removing over/under suffix only)
    const groupedProps: {
      [key: string]: { over?: DatabaseOdds; under?: DatabaseOdds; base: string; line?: string }
    } = {}

    deduplicatedOdds.forEach((odd, index) => {
      if (!odd.oddid) return

      // Extract base prop identifier (only handle over/under, not yes/no)
      const baseId = odd.oddid.replace(/-ou-(over|under)$/, '')

      // Only handle over/under props (yes/no props are filtered out earlier)
      const isOver = odd.oddid.includes('-ou-over')
      const isUnder = odd.oddid.includes('-ou-under')

      if (index < 5) {
        // Debug first few props
        console.log(
          `🎯 Processing prop ${index + 1}: ${odd.oddid} -> base: ${baseId}, isOver: ${isOver}, isUnder: ${isUnder}`
        )
      }

      // Only process if it's an over/under prop
      if (isOver || isUnder) {
        if (!groupedProps[baseId]) {
          groupedProps[baseId] = { base: baseId, line: odd.line || '' }
        }
        if (isOver) {
          groupedProps[baseId]!.over = odd
        } else if (isUnder) {
          groupedProps[baseId]!.under = odd
        }
      } else {
        console.log(`⚠️ Skipping non-over/under prop: ${odd.oddid}`)
      }
    })

    const gameStartTime = new Date(game.commence_time)
    const now = new Date()

    // Add 10-minute buffer after game starts before disabling bets
    const bufferTime = 10 * 60 * 1000 // 10 minutes in milliseconds
    const isGameStarted = now.getTime() >= gameStartTime.getTime() + bufferTime

    // Convert to compact list format with scroll
    return (
      <div className="space-y-1">
        {Object.entries(groupedProps).length === 0 ? (
          <div className="py-4 text-center text-slate-500">
            <p>No over/under props available for this selection</p>
            <p className="mt-1 text-xs">Total display odds: {displayOdds.length}</p>
          </div>
        ) : (
          <div className="max-h-96 space-y-1 overflow-y-auto pr-1">
            <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
              <span>{Object.keys(groupedProps).length} props available</span>
              {Object.keys(groupedProps).length > 10 && <span>Scroll for more ↓</span>}
            </div>

            {Object.entries(groupedProps).map(([key, group]) => {
              const propName = getPropDisplayName(group.base)
              const isPlayerProp =
                group.base.match(/-[A-Z_]+_1_[A-Z]+-game$/) || group.base.match(/\d{4,}/)
              const isTeamProp =
                group.base.includes('-home-game') || group.base.includes('-away-game')

              let displayName = propName
              let playerOrTeam = ''

              if (isPlayerProp) {
                playerOrTeam = getPlayerName(group.base)
                displayName = propName
              } else if (isTeamProp) {
                playerOrTeam = getTeamFromOddid(group.base)
                displayName = propName
              }

              const overOdds = group.over
                ? group.over.fanduelodds ||
                  group.over.draftkingsodds ||
                  group.over.espnbetodds ||
                  group.over.ceasarsodds ||
                  group.over.mgmodds ||
                  group.over.fanaticsodds ||
                  group.over.bookodds ||
                  0
                : null
              const underOdds = group.under
                ? group.under.fanduelodds ||
                  group.under.draftkingsodds ||
                  group.under.espnbetodds ||
                  group.under.ceasarsodds ||
                  group.under.mgmodds ||
                  group.under.fanaticsodds ||
                  group.under.bookodds ||
                  0
                : null

              return (
                <div
                  key={key}
                  className="to-slate-25 hover:to-indigo-25 flex items-center justify-between rounded-lg border border-slate-200 bg-gradient-to-r from-slate-50 px-3 py-2 transition-all hover:border-blue-300 hover:from-blue-50 hover:shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-slate-900">
                      {playerOrTeam ? (
                        <span className="font-bold text-blue-700">{playerOrTeam}</span>
                      ) : (
                        <span className="font-semibold text-slate-700">{displayName}</span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center space-x-2 text-xs text-slate-500">
                      {playerOrTeam && <span>{displayName}</span>}
                      {group.line && (
                        <>
                          {playerOrTeam && <span>•</span>}
                          <span>
                            Line: <span className="font-mono">{group.line}</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="ml-4 flex items-center space-x-2">
                    {/* Over Button */}
                    {group.over && overOdds && (
                      <button
                        onClick={() => handleBetClick(group.over!)}
                        disabled={isGameStarted}
                        className={`min-w-[60px] rounded-md border px-2 py-1.5 text-xs font-bold transition-all ${
                          selectedBets.some(
                            bet =>
                              bet.gameId === game.id && bet.sportsbook === group.over!.sportsbook
                          )
                            ? 'border-blue-600 bg-gradient-to-b from-blue-600 to-blue-700 text-white shadow-md'
                            : isGameStarted
                              ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
                              : 'cursor-pointer border-green-300 bg-gradient-to-b from-white to-green-50 text-slate-700 hover:border-green-400 hover:from-green-50 hover:to-green-100 hover:shadow-md'
                        } `}
                      >
                        <div className="text-center">
                          <div className="mb-0.5 text-xs font-medium text-green-600">O</div>
                          <div className="font-mono text-xs font-bold">{formatOdds(overOdds)}</div>
                        </div>
                      </button>
                    )}

                    {/* Under Button */}
                    {group.under && underOdds && (
                      <button
                        onClick={() => handleBetClick(group.under!)}
                        disabled={isGameStarted}
                        className={`min-w-[60px] rounded-md border px-2 py-1.5 text-xs font-bold transition-all ${
                          selectedBets.some(
                            bet =>
                              bet.gameId === game.id && bet.sportsbook === group.under!.sportsbook
                          )
                            ? 'border-blue-600 bg-gradient-to-b from-blue-600 to-blue-700 text-white shadow-md'
                            : isGameStarted
                              ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
                              : 'cursor-pointer border-red-300 bg-gradient-to-b from-white to-red-50 text-slate-700 hover:border-red-400 hover:from-red-50 hover:to-red-100 hover:shadow-md'
                        } `}
                      >
                        <div className="text-center">
                          <div className="mb-0.5 text-xs font-medium text-red-600">U</div>
                          <div className="font-mono text-xs font-bold">{formatOdds(underOdds)}</div>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-sm">
      {/* Game Header */}
      <div className="border-b border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-semibold text-slate-800">
              <span className="text-blue-700">{game.away_team}</span> @{' '}
              <span className="text-indigo-700">{game.home_team}</span>
            </span>
            <span className="rounded-full border border-blue-200 bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
              {league}
            </span>
          </div>
          <div className="text-xs text-slate-500">
            {new Date(game.commence_time).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Category Tabs */}
        <div className="mb-4 flex space-x-1 rounded-lg border border-slate-200 bg-gradient-to-r from-slate-100 to-slate-50 p-1">
          {Object.keys(tabStructure || {}).map(category => (
            <button
              key={category}
              onClick={() => {
                setActiveCategory(category)
                const categoryData = tabStructure?.[category]

                // If it's an array (Main Lines), no subcategory needed
                if (Array.isArray(categoryData)) {
                  setActiveSubcategory('')
                } else {
                  // If it's an object, set first subcategory
                  const firstSubcategory = Object.keys(categoryData || {})[0]
                  if (firstSubcategory) setActiveSubcategory(firstSubcategory)
                }
              }}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                activeCategory === category
                  ? 'border border-blue-200 bg-gradient-to-b from-white to-blue-50 text-blue-700 shadow-md'
                  : 'text-slate-600 hover:bg-white/60 hover:text-slate-900 hover:shadow-sm'
              } `}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Subcategory Tabs */}
        {!Array.isArray(tabStructure?.[activeCategory]) &&
          Object.keys(tabStructure?.[activeCategory] || {}).length > 1 && (
            <div className="mb-4 flex space-x-1 border-b border-slate-200">
              {Object.keys(tabStructure?.[activeCategory] || {}).map(subcategory => (
                <button
                  key={subcategory}
                  onClick={() => setActiveSubcategory(subcategory)}
                  className={`border-b-2 px-4 py-2 text-sm font-medium transition-all ${
                    activeSubcategory === subcategory
                      ? 'border-blue-600 bg-blue-50/50 text-blue-700'
                      : 'border-transparent text-slate-600 hover:border-blue-300 hover:bg-slate-50 hover:text-slate-900'
                  } `}
                >
                  {subcategory}
                </button>
              ))}
            </div>
          )}

        {/* Market Tabs */}
        {activeCategory !== 'Main Lines' && availableMarkets.length > 1 && (
          <div className="mb-4 flex flex-wrap gap-1">
            {availableMarkets.map((market: string) => (
              <button
                key={market}
                onClick={() => setActiveMarket(market)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  activeMarket === market
                    ? 'border border-blue-300 bg-blue-100 text-blue-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                } `}
              >
                {market}
              </button>
            ))}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="text-slate-600">Loading odds...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">Error: {error}</p>
          </div>
        )}

        {/* No Odds State */}
        {!isLoading && !error && odds.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-slate-500">No odds available for this game</p>
          </div>
        )}

        {/* Odds Display */}
        {!isLoading && !error && displayOdds.length > 0 && (
          <div className="space-y-4">
            {/* Main Lines - Professional Sportsbook Style */}
            {activeCategory === 'Main Lines'
              ? renderMainLinesDisplay()
              : /* Other Categories - Grouped Props Display */
                renderPropsDisplay()}
          </div>
        )}

        {/* No Odds in Category */}
        {!isLoading && !error && odds.length > 0 && displayOdds.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-slate-500">
              No odds available for {activeCategory} - {activeSubcategory}
              {activeMarket ? ` - ${activeMarket}` : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
