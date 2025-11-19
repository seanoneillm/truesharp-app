'use client'

import BetSlip from '@/components/bet-slip/BetSlip'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import ComplianceDisclaimerModal from '@/components/games/compliance-disclaimer-modal'
import ConferenceFilter, { ConferenceFilterType } from '@/components/games/conference-filter'
import DateSelector from '@/components/games/date-selector'
import EnhancedGamesList from '@/components/games/enhanced-games-list'
import HowToUseModal from '@/components/games/how-to-use-modal'
import LeagueTabs, { LeagueType } from '@/components/games/league-tabs'
import { BetSlipProvider } from '@/contexts/BetSlipContext'
import { AuthProvider } from '@/lib/auth/AuthProvider'
import { useBetSlipToast } from '@/lib/hooks/use-bet-slip-toast'
import { useComplianceDisclaimer } from '@/lib/hooks/use-compliance-disclaimer'
import { gamesDataService } from '@/lib/services/games-data'
import { Game } from '@/lib/types/games'
import { filterGamesByConference } from '@/lib/utils/college-conference-filter'
import { convertDatabaseGamesToGames } from '@/lib/utils/database-to-game-converter'
import { deduplicateGames, isCollegeSport } from '@/lib/utils/game-deduplication'
import { useAuth } from '@/lib/hooks/use-auth'
import MaintenanceOverlay from '@/components/maintenance/MaintenanceOverlay'
import { Calendar, Clock, HelpCircle } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

const ADMIN_USER_IDS = [
  '28991397-dae7-42e8-a822-0dffc6ff49b7',
  '0e16e4f5-f206-4e62-8282-4188ff8af48a',
  'dfd44121-8e88-4c83-ad95-9fb8a4224908',
]

function GamesPageContent() {
  console.log('🚀 GAMES PAGE RENDERING!!!')
  const { user } = useAuth()
  
  // Check if user is admin
  const isAdmin = user?.id && ADMIN_USER_IDS.includes(user.id)
  
  // Show maintenance overlay for non-admin users
  if (user && !isAdmin) {
    return <MaintenanceOverlay pageName="Games" />
  }

  const [games, setGames] = useState<Record<string, Game[]>>({})
  const [activeLeague, setActiveLeague] = useState<LeagueType>('MLB')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [, setIsFetching] = useState(false)
  const [, setRetryCount] = useState(0)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  
  // Conference filter state
  const [conferenceFilters, setConferenceFilters] = useState<Record<string, ConferenceFilterType>>({
    'americanfootball_ncaaf': 'All Games',
    'basketball_ncaab': 'All Games',
  })

  // Toast notifications for bet slip actions
  const { ToastContainer } = useBetSlipToast()

  // Compliance disclaimer logic
  const { shouldShowDisclaimer, dismissDisclaimer, isClient } = useComplianceDisclaimer()

  // How to Use modal state
  const [showHowToUse, setShowHowToUse] = useState(false)

  // Initialize date safely after hydration
  useEffect(() => {
    // Set to today's date on mount
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Normalize to start of day
    console.log('🎯 Setting initial date to today:', today.toISOString().split('T')[0])
    setSelectedDate(today)
  }, [])

  const loadGamesForDate = useCallback(async (date: Date) => {
    setIsLoading(true)

    try {
      const dateStr = date.toISOString().split('T')[0]
      if (!dateStr) {
        throw new Error('Invalid date format')
      }

      console.log('🎯 Loading games for date:', dateStr)
      console.log('🎯 Date object:', date)

      // Fetch games for all supported leagues
      const allLeagues = ['MLB', 'NBA', 'WNBA', 'NFL', 'MLS', 'NHL', 'NCAAF', 'NCAAB']
      const gamesPromises = allLeagues.map(async league => {
        try {
          console.log(`🔍 Fetching ${league} games for ${dateStr}`)
          const leagueGames = await gamesDataService.getGamesForLeagueAndDate(league, dateStr)
          console.log(`📊 ${league} games result:`, leagueGames.length)
          return { league, games: leagueGames }
        } catch (error) {
          console.warn(`⚠️ Failed to load ${league} games:`, error)
          return { league, games: [] }
        }
      })

      const leagueResults = await Promise.all(gamesPromises)

      // Convert database games to frontend format and organize by sport
      const newGames: Record<string, Game[]> = {}
      let totalGames = 0

      for (const { league, games: leagueGames } of leagueResults) {
        if (leagueGames.length > 0) {
          const convertedGames = convertDatabaseGamesToGames(leagueGames)
          const sportKey = getSportKey(league as LeagueType)
          newGames[sportKey] = convertedGames
          totalGames += convertedGames.length
          console.log(`✅ Loaded ${convertedGames.length} ${league} games`)
        }
      }

      // Fill in empty arrays for leagues with no games
      const allSportKeys = [
        'baseball_mlb',
        'basketball_nba',
        'basketball_wnba',
        'americanfootball_nfl',
        'soccer_usa_mls',
        'icehockey_nhl',
        'americanfootball_ncaaf',
        'basketball_ncaab',
        'soccer_uefa_champs_league',
      ]

      for (const sportKey of allSportKeys) {
        if (!newGames[sportKey]) {
          newGames[sportKey] = []
        }
      }

      setGames(newGames)

      if (totalGames > 0) {
        console.log(`✅ Total games loaded: ${totalGames}`)
      } else {
        console.log('⚠️ No games found for this date across all leagues')
      }

      setLastUpdated(new Date())
    } catch (error) {
      console.error('❌ Error loading games:', error)
      // Reset to empty state
      const emptyGames: Record<string, Game[]> = {
        baseball_mlb: [],
        basketball_nba: [],
        basketball_wnba: [],
        americanfootball_nfl: [],
        soccer_usa_mls: [],
        icehockey_nhl: [],
        americanfootball_ncaaf: [],
        basketball_ncaab: [],
        soccer_uefa_champs_league: [],
      }
      setGames(emptyGames)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load today's games on initial mount
  useEffect(() => {
    const loadInitialGames = async () => {
      try {
        console.log('🚀 loadInitialGames triggered, selectedDate:', selectedDate)
        if (selectedDate) {
          console.log('🚀 About to call loadGamesForDate with:', selectedDate)
          await loadGamesForDate(selectedDate)
          console.log('🚀 loadGamesForDate completed')
        }
      } catch (error) {
        console.error('❌ Error in loadInitialGames:', error)
      }
    }

    // Only load if we have a selected date
    if (selectedDate) {
      console.log('🚀 selectedDate available, calling loadInitialGames')
      loadInitialGames()
    } else {
      console.log('🚀 selectedDate not available yet')
    }
  }, [selectedDate, loadGamesForDate])

  const handleDateChange = (date: Date) => {
    // Normalize the date to start of day for consistency
    const normalizedDate = new Date(date)
    normalizedDate.setHours(0, 0, 0, 0)

    setSelectedDate(normalizedDate)
    loadGamesForDate(normalizedDate)
  }

  // Retry mechanism with exponential backoff
  const handleManualFetchWithRetry = async (currentRetryCount = 0) => {
    const maxRetries = 2
    const baseDelay = 2000 // 2 seconds

    if (!selectedDate) return

    setIsFetching(true)
    setRetryCount(currentRetryCount)

    try {
      const response = await fetch('/api/fetch-odds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sport: 'ALL', // Fetch all sports
          date: selectedDate.toISOString().split('T')[0],
        }),
      })

      // Check if the request failed due to network/server issues
      if (!response.ok) {
        if (response.status === 429) {
          // Rate limited - offer retry option
          const shouldRetry =
            currentRetryCount < maxRetries &&
            confirm(
              `⏱️ Rate limited by the odds API. Would you like to automatically retry in ${Math.pow(2, currentRetryCount + 1)} seconds? (Attempt ${currentRetryCount + 1}/${maxRetries + 1})`
            )

          if (shouldRetry) {
            const delay = baseDelay * Math.pow(2, currentRetryCount) // Exponential backoff
            console.log(`⏳ Retrying in ${delay}ms...`)
            setTimeout(() => {
              handleManualFetchWithRetry(currentRetryCount + 1)
            }, delay)
            return
          } else {
            alert(
              '⏱️ Rate limited by the odds API. Please wait 5-10 minutes before trying again manually.'
            )
            console.warn('⚠️ Rate limited by odds API - user declined retry')
            return
          }
        } else if (response.status >= 500) {
          // Server error - offer retry for server errors
          if (currentRetryCount < maxRetries) {
            const shouldRetry = confirm(
              `🚨 Server error occurred. Would you like to retry? (Attempt ${currentRetryCount + 1}/${maxRetries + 1})`
            )
            if (shouldRetry) {
              setTimeout(() => {
                handleManualFetchWithRetry(currentRetryCount + 1)
              }, baseDelay)
              return
            }
          }
          alert('🚨 Server error occurred. Please try again later.')
          console.error('❌ Server error:', response.status, response.statusText)
          return
        } else {
          // Other HTTP error
          alert(`❌ Request failed: ${response.status} ${response.statusText}`)
          console.error('❌ HTTP error:', response.status, response.statusText)
          return
        }
      }

      const result = await response.json()

      if (result.success || (result.successfulRequests && result.successfulRequests > 0)) {
        console.log('✅ Manual odds fetch completed:', result)

        // Show detailed success message
        const successMsg =
          result.message ||
          `Successfully fetched ${result.totalGames || 0} games from ${result.successfulRequests || 0}/${result.totalRequests || 0} API requests`
        alert(`✅ ${successMsg}`)

        // Reset retry count on success
        setRetryCount(0)

        // Refresh the games data after fetching new odds
        await loadGamesForDate(selectedDate)
      } else {
        console.error('❌ Manual fetch failed:', result)
        if (result.message?.includes('rate limit')) {
          // Handle rate limiting in response
          const shouldRetry =
            currentRetryCount < maxRetries &&
            confirm(
              `⏱️ ${result.message} Would you like to automatically retry in ${Math.pow(2, currentRetryCount + 1)} seconds?`
            )

          if (shouldRetry) {
            const delay = baseDelay * Math.pow(2, currentRetryCount)
            setTimeout(() => {
              handleManualFetchWithRetry(currentRetryCount + 1)
            }, delay)
            return
          }
        }

        alert(`❌ ${result.message || result.error || 'Fetch failed'}`)
      }
    } catch (error) {
      console.error('❌ Error during manual fetch:', error)

      // Handle different types of errors with retry option
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        const shouldRetry =
          currentRetryCount < maxRetries &&
          confirm(
            `🌐 Network error: Unable to connect to the server. Would you like to retry? (Attempt ${currentRetryCount + 1}/${maxRetries + 1})`
          )

        if (shouldRetry) {
          setTimeout(() => {
            handleManualFetchWithRetry(currentRetryCount + 1)
          }, baseDelay)
          return
        }

        alert(
          '🌐 Network error: Unable to connect to the server. Please check your connection and try again.'
        )
      } else if (error instanceof Error) {
        alert(`❌ Error: ${error.message}`)
      } else {
        alert('❌ An unexpected error occurred. Please try again.')
      }
    } finally {
      if (currentRetryCount === 0) {
        setIsFetching(false)
        setRetryCount(0)
      }
    }
  }

  // Map league to sport key helper function
  const getSportKey = (league: LeagueType): string => {
    const sportKeyMap: Record<LeagueType, string> = {
      NFL: 'americanfootball_nfl',
      NBA: 'basketball_nba',
      WNBA: 'basketball_wnba',
      MLB: 'baseball_mlb',
      NHL: 'icehockey_nhl',
      NCAAF: 'americanfootball_ncaaf',
      NCAAB: 'basketball_ncaab',
      'Champions League': 'soccer_uefa_champs_league',
      MLS: 'soccer_usa_mls',
    }
    return sportKeyMap[league]
  }

  // Conference filter handler
  const handleConferenceFilterChange = (filter: ConferenceFilterType) => {
    const activeSportKey = getSportKey(activeLeague)
    setConferenceFilters(prev => ({
      ...prev,
      [activeSportKey]: filter,
    }))
  }

  // Get current sport games and apply deduplication and conference filter
  const activeSportKey = getSportKey(activeLeague)
  const rawGames = games[activeSportKey] || []
  
  // Apply deduplication and conference filter for college sports
  const currentGames = (activeLeague === 'NCAAF' || activeLeague === 'NCAAB') 
    ? filterGamesByConference(
        rawGames, 
        conferenceFilters[activeSportKey] || 'All Games',
        activeLeague
      )
    : isCollegeSport(activeSportKey)
    ? deduplicateGames(rawGames)
    : rawGames

  // Available leagues with games (dynamic based on data)
  const availableLeagues: LeagueType[] = [
    'MLB',
    'NFL',
    'NBA',
    'WNBA',
    'NHL',
    'NCAAF',
    'NCAAB',
    'Champions League',
    'MLS',
  ]

  const formatDateHeader = (date: Date): string => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)

    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)

    // Normalize the input date for comparison
    const normalizedDate = new Date(date)
    normalizedDate.setHours(0, 0, 0, 0)

    if (normalizedDate.getTime() === today.getTime()) {
      return "Today's Games"
    } else if (normalizedDate.getTime() === yesterday.getTime()) {
      return "Yesterday's Games"
    } else if (normalizedDate.getTime() === tomorrow.getTime()) {
      return "Tomorrow's Games"
    } else {
      return (
        date.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        }) + ' Games'
      )
    }
  }

  // Calculate game counts for tabs (with deduplication and conference filter applied for college sports)
  const gameCounts = Object.entries(games).reduce(
    (acc, [sport, sportGames]) => {
      if (sport === 'americanfootball_ncaaf' || sport === 'basketball_ncaab') {
        const filterType = sport === 'americanfootball_ncaaf' ? 'NCAAF' : 'NCAAB'
        const filteredGames = filterGamesByConference(
          sportGames, 
          conferenceFilters[sport] || 'All Games',
          filterType
        )
        acc[sport] = filteredGames.length
      } else if (isCollegeSport(sport)) {
        // Apply deduplication for other college sports if any
        acc[sport] = deduplicateGames(sportGames).length
      } else {
        acc[sport] = sportGames.length
      }
      return acc
    },
    {} as Record<string, number>
  )

  // Season detection helpers (including preseason and playoffs)
  const isInSeason = (league: LeagueType): boolean => {
    const now = new Date()
    const month = now.getMonth() + 1 // 1-12

    const seasonMap: Record<LeagueType, number[]> = {
      MLB: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11], // February-November (spring training + playoffs)
      NBA: [9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7], // September-July (preseason + playoffs)
      WNBA: [5, 6, 7, 8, 9, 10, 11], // May-November (preseason + playoffs)
      NFL: [7, 8, 9, 10, 11, 12, 1, 2, 3], // July-March (preseason + playoffs)
      NHL: [9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7], // September-July (preseason + playoffs)
      NCAAF: [7, 8, 9, 10, 11, 12, 1, 2], // July-February (preseason + bowl games/playoffs)
      NCAAB: [10, 11, 12, 1, 2, 3, 4, 5], // October-May (preseason + March Madness)
      MLS: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // Year-round (preseason + MLS Cup)
      'Champions League': [8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7], // August-July (qualifiers + final)
    }

    return seasonMap[league]?.includes(month) ?? false
  }

  const getSeasonMessage = (league: LeagueType, date: Date | null): string => {
    const inSeason = isInSeason(league)
    const dateStr = date ? formatDateHeader(date).toLowerCase() : 'this date'

    if (inSeason) {
      return `No ${league} games scheduled for ${dateStr}. Games may be scheduled for other dates.`
    }

    const seasonInfo: Record<LeagueType, string> = {
      NFL: 'NFL season runs July-March (preseason through playoffs)',
      NBA: 'NBA season runs September-July (preseason through playoffs)',
      WNBA: 'WNBA season runs May-November (preseason through playoffs)',
      NHL: 'NHL season runs September-July (preseason through playoffs)',
      NCAAF: 'College Football season runs July-February (preseason through bowl games)',
      NCAAB: 'College Basketball season runs October-May (preseason through March Madness)',
      MLB: 'MLB season runs February-November (spring training through World Series)',
      MLS: 'MLS season runs year-round (preseason through MLS Cup)',
      'Champions League': 'Champions League runs August-July (qualifiers through final)',
    }

    return `${league} is currently off-season. ${seasonInfo[league]}.`
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Clean Header */}
        <div className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 p-5 text-white">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="mb-1 text-2xl font-bold">
                {selectedDate ? formatDateHeader(selectedDate) : 'Loading...'}
              </h1>
              <p className="text-sm text-blue-100">Live odds and betting markets</p>
            </div>

            <div className="flex items-center space-x-3">
              {lastUpdated && (
                <div className="flex items-center space-x-1 text-sm text-blue-200">
                  <Clock className="h-4 w-4" />
                  <span>Updated {lastUpdated.toLocaleTimeString()}</span>
                </div>
              )}
              
              <button
                onClick={() => setShowHowToUse(true)}
                className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label="How to use the Games Page"
              >
                <HelpCircle className="h-4 w-4" />
                <span className="text-sm font-medium">How to Use</span>
              </button>
            </div>
          </div>
        </div>

        {/* Date Selection */}
        <DateSelector selectedDate={selectedDate} onDateChange={handleDateChange} />

        {/* League Tabs */}
        <LeagueTabs
          activeLeague={activeLeague}
          onLeagueChange={setActiveLeague}
          availableLeagues={availableLeagues}
          gameCounts={gameCounts}
          seasonStatus={availableLeagues.reduce(
            (acc, league) => {
              acc[league] = isInSeason(league)
              return acc
            },
            {} as Record<LeagueType, boolean>
          )}
        />

        {/* Conference Filter for College Sports */}
        {(activeLeague === 'NCAAF' || activeLeague === 'NCAAB') && (
          <div className="rounded-lg border border-slate-200/50 bg-white px-4 py-3 shadow-sm">
            <ConferenceFilter
              sport={activeLeague}
              selectedFilter={conferenceFilters[activeSportKey] || 'All Games'}
              onFilterChange={handleConferenceFilterChange}
            />
          </div>
        )}

        {/* Games List */}
        <EnhancedGamesList
          games={currentGames}
          sport={activeSportKey}
          isLoading={isLoading}
          marketFilter="all"
          sortBy="time"
        />

        {/* Empty State */}
        {!isLoading && currentGames.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
            <div className="flex flex-col items-center space-y-4">
              <Calendar className="h-16 w-16 text-slate-300" />
              <div>
                <h3 className="mb-1 text-lg font-semibold text-slate-900">
                  No {activeLeague} Games Available
                </h3>
                <p className="mb-4 text-slate-600">
                  {getSeasonMessage(activeLeague, selectedDate)}
                </p>
                <div className="flex flex-col justify-center gap-2 sm:flex-row">
                  {!isInSeason(activeLeague) && (
                    <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-600">
                      💡 Try MLB or MLS for current games
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bet Slip */}
        <BetSlip />

        {/* Toast Notifications */}
        <ToastContainer />

        {/* Modals */}
        {isClient && (
          <>
            <ComplianceDisclaimerModal
              isOpen={shouldShowDisclaimer}
              onClose={dismissDisclaimer}
            />
            <HowToUseModal
              isOpen={showHowToUse}
              onClose={() => setShowHowToUse(false)}
            />
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

export default function GamesPage() {
  return (
    <AuthProvider>
      <BetSlipProvider>
        <GamesPageContent />
      </BetSlipProvider>
    </AuthProvider>
  )
}
