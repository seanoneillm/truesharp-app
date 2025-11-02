import { Ionicons } from '@expo/vector-icons'
import React, { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { PanGestureHandlerGestureEvent } from 'react-native-gesture-handler'
import { SafeAreaView } from 'react-native-safe-area-context'
import TrueSharpShield from '../../components/common/TrueSharpShield'
import FloatingBetSlip from '../../components/games/FloatingBetSlip'
import UniversalGameCard from '../../components/games/UniversalGameCard'
import { BetSlipProvider } from '../../contexts/BetSlipContext'
import { supabase } from '../../lib/supabase'
import { globalStyles } from '../../styles/globalStyles'
import { theme } from '../../styles/theme'

const { width: screenWidth } = Dimensions.get('window')
const DATE_ITEM_WIDTH = 80
const DATE_VISIBLE_ITEMS = Math.floor(screenWidth / DATE_ITEM_WIDTH)

type LeagueType =
  | 'MLB'
  | 'NFL'
  | 'NBA'
  | 'WNBA'
  | 'NHL'
  | 'NCAAF'
  | 'NCAAB'
  | 'Champions League'
  | 'MLS'

const LEAGUES: { name: LeagueType; icon: string; color: string }[] = [
  { name: 'MLB', icon: '⚾', color: theme.colors.sports.mlb },
  { name: 'NFL', icon: '🏈', color: theme.colors.sports.nfl },
  { name: 'NBA', icon: '🏀', color: theme.colors.sports.nba },
  { name: 'WNBA', icon: '🏀', color: theme.colors.sports.ncaab },
  { name: 'NHL', icon: '🏒', color: theme.colors.sports.nhl },
  { name: 'NCAAF', icon: '🏈', color: theme.colors.sports.ncaaf },
  { name: 'NCAAB', icon: '🏀', color: theme.colors.sports.ncaab },
  { name: 'Champions League', icon: '⚽', color: theme.colors.sports.soccer },
  { name: 'MLS', icon: '⚽', color: theme.colors.sports.soccer },
]

interface Game {
  id: string
  home_team: string
  away_team: string
  home_team_name: string
  away_team_name: string
  game_time: string
  sport: string
  league?: string
  status?: string
}

export default function GamesScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedLeague, setSelectedLeague] = useState<LeagueType>('MLB')
  const [games, setGames] = useState<Game[]>([])
  const [isLoadingGames, setIsLoadingGames] = useState(true)
  const [gameCounts, setGameCounts] = useState<Record<string, number>>({})
  const [availableDates, setAvailableDates] = useState<Date[]>([])
  const [showBackToTodayArrow, setShowBackToTodayArrow] = useState(false)
  const [arrowDirection, setArrowDirection] = useState<'left' | 'right'>('left')
  const slideAnim = useRef(new Animated.Value(0)).current
  const fadeAnim = useRef(new Animated.Value(1)).current
  const bannerHeight = useRef(new Animated.Value(1)).current
  const lastScrollY = useRef(0)
  const dateScrollRef = useRef<ScrollView>(null)
  const snapTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Generate available dates (7 days back to 14 days forward)
  const generateAvailableDates = () => {
    const dates: Date[] = []
    // Use a properly constructed local date to avoid timezone issues
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Normalize to start of day

    for (let i = -7; i <= 14; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      dates.push(date)
    }

    return dates
  }

  // Initialize available dates
  useEffect(() => {
    const dates = generateAvailableDates()
    setAvailableDates(dates)

    // Find today's index and scroll to it
    const todayIndex = dates.findIndex(date => date.toDateString() === new Date().toDateString())

    if (todayIndex !== -1) {
      setTimeout(() => {
        // With the spacer view, the scroll calculation is simpler
        const scrollX = todayIndex * DATE_ITEM_WIDTH
        dateScrollRef.current?.scrollTo({
          x: Math.max(0, scrollX),
          animated: false,
        })
      }, 100)
    }

    // Cleanup timeout on unmount
    return () => {
      if (snapTimeoutRef.current) {
        clearTimeout(snapTimeoutRef.current)
      }
    }
  }, [])

  // Fetch games using exact same logic as web app
  useEffect(() => {
    const fetchGamesForLeagueAndDate = async (league: string, date: string) => {
      try {
        // Create proper timezone-aware date range for database query
        // The selected date represents the local date the user wants
        const year = parseInt(date.split('-')[0])
        const month = parseInt(date.split('-')[1]) - 1 // Month is 0-indexed
        const day = parseInt(date.split('-')[2])

        // Create local timezone dates (start and end of the selected day)
        const localStartDate = new Date(year, month, day, 0, 0, 0, 0) // Start of day in local timezone
        const localEndDate = new Date(year, month, day, 23, 59, 59, 999) // End of day in local timezone

        // These are automatically in UTC when converted to ISO strings for database query
        const startTime = localStartDate
        const endTime = localEndDate
        // Handle special case for Champions League which is stored in sport field as UEFA_CHAMPIONS_LEAGUE
        let query = supabase.from('games').select('*')

        if (league === 'Champions League') {
          query = query.eq('sport', 'UEFA_CHAMPIONS_LEAGUE')
        } else {
          query = query.eq('league', league.toUpperCase())
        }

        const { data: games, error: gamesError } = await query
          .gte('game_time', startTime.toISOString())
          .lt('game_time', endTime.toISOString())
          .order('game_time', { ascending: true })

        if (gamesError) {
          console.error(`❌ Error fetching ${league} games:`, gamesError)
          throw new Error(`Failed to fetch ${league} games: ${gamesError.message}`)
        }

        if (!games || games.length === 0) {
          return []
        }

        const gameIds = games.map(game => game.id)

        // Let each UniversalGameCard fetch its own odds individually
        // This avoids the batch query limit distribution problem
        return games
      } catch (error) {
        console.error(`❌ Failed to fetch ${league} games and odds:`, error)
        return []
      }
    }

    const fetchGameCounts = async (dateStr: string) => {
      try {
        // Create date range for the query
        const year = parseInt(dateStr.split('-')[0])
        const month = parseInt(dateStr.split('-')[1]) - 1
        const day = parseInt(dateStr.split('-')[2])
        const localStartDate = new Date(year, month, day, 0, 0, 0, 0)
        const localEndDate = new Date(year, month, day, 23, 59, 59, 999)

        // Single query to get all games for the date, then count by league
        const { data: allGames, error } = await supabase
          .from('games')
          .select('league, sport')
          .gte('game_time', localStartDate.toISOString())
          .lt('game_time', localEndDate.toISOString())

        if (error) {
          console.error('❌ Error fetching game counts:', error)
          // Set all counts to 0 on error
          const counts: Record<string, number> = {}
          LEAGUES.forEach(league => (counts[league.name] = 0))
          setGameCounts(counts)
          return
        }

        // Count games by league
        const counts: Record<string, number> = {}
        LEAGUES.forEach(league => (counts[league.name] = 0))

        if (allGames) {
          allGames.forEach(game => {
            // Handle Champions League special case
            if (game.sport === 'UEFA_CHAMPIONS_LEAGUE') {
              counts['Champions League'] = (counts['Champions League'] || 0) + 1
            } else if (game.league) {
              // Find matching league (case insensitive)
              const matchingLeague = LEAGUES.find(
                l => l.name.toUpperCase() === game.league?.toUpperCase()
              )
              if (matchingLeague) {
                counts[matchingLeague.name] = (counts[matchingLeague.name] || 0) + 1
              }
            }
          })
        }
        setGameCounts(counts)
      } catch (err) {
        console.error('❌ Failed to fetch game counts:', err)
        // Set all counts to 0 on error
        const counts: Record<string, number> = {}
        LEAGUES.forEach(league => (counts[league.name] = 0))
        setGameCounts(counts)
      }
    }

    const fetchGames = async () => {
      try {
        setIsLoadingGames(true)

        const dateStr = selectedDate.toISOString().split('T')[0]
        // Fetch game counts for all leagues first
        await fetchGameCounts(dateStr)

        // Small delay to ensure rate limiter has processed the counts query
        await new Promise(resolve => setTimeout(resolve, 100))

        // Fetch games for the selected league and date using exact web app logic
        const gamesData = await fetchGamesForLeagueAndDate(selectedLeague, dateStr)
        setGames(gamesData)
      } catch (err) {
        console.error('Error fetching games:', err)
        setGames([])
      } finally {
        setIsLoadingGames(false)
      }
    }

    fetchGames()
  }, [selectedDate, selectedLeague])

  // Games are already filtered by the exact web app logic in fetchGames
  // No additional filtering needed since we're fetching by league and date
  const filteredGames = games

  // Handle odds click
  const handleOddsClick = (bet: any) => {
    // Odds click functionality can be implemented here
  }

  // Format date display
  const formatDateDisplay = (date: Date): string => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const compareDate = new Date(date)
    compareDate.setHours(0, 0, 0, 0)

    const timeDiff = compareDate.getTime() - today.getTime()
    const dayDiff = Math.round(timeDiff / (1000 * 3600 * 24))

    if (dayDiff === 0) return 'Today'
    if (dayDiff === 1) return 'Tomorrow'
    if (dayDiff === -1) return 'Yesterday'

    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
  }

  const handleDateChange = (direction: 'prev' | 'next') => {
    const currentIndex = availableDates.findIndex(
      date => date.toDateString() === selectedDate.toDateString()
    )

    const newIndex =
      direction === 'next'
        ? Math.min(currentIndex + 1, availableDates.length - 1)
        : Math.max(currentIndex - 1, 0)

    if (newIndex !== currentIndex) {
      const newDate = availableDates[newIndex]

      // Animate the date change
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: direction === 'next' ? -10 : 10,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
        ]),
      ]).start()

      setSelectedDate(newDate)

      // Scroll to the new date
      const scrollX = newIndex * DATE_ITEM_WIDTH
      dateScrollRef.current?.scrollTo({
        x: Math.max(0, scrollX),
        animated: true,
      })
    }
  }

  // Snap back to today
  const snapToToday = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayIndex = availableDates.findIndex(date => date.getTime() === today.getTime())

    if (todayIndex !== -1) {
      const scrollX = todayIndex * DATE_ITEM_WIDTH
      dateScrollRef.current?.scrollTo({
        x: Math.max(0, scrollX),
        animated: true,
      })
      setSelectedDate(today)
      setShowBackToTodayArrow(false)
    }
  }

  // Handle date wheel scroll - track scroll direction and show arrows
  const handleDateScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x
    const currentIndex = Math.round(offsetX / DATE_ITEM_WIDTH)

    // Find today's index with proper timezone handling
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayIndex = availableDates.findIndex(date => date.getTime() === today.getTime())

    // Show arrow if not on today
    if (currentIndex !== todayIndex && todayIndex !== -1) {
      setShowBackToTodayArrow(true)
      // Show left arrow if we're in the future (need to go back left to today)
      // Show right arrow if we're in the past (need to go right forward to today)
      setArrowDirection(currentIndex > todayIndex ? 'left' : 'right')
    } else {
      setShowBackToTodayArrow(false)
    }
  }

  // Handle scroll end to snap to nearest date
  const handleDateScrollEnd = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x

    // Clear any existing timeout
    if (snapTimeoutRef.current) {
      clearTimeout(snapTimeoutRef.current)
    }

    // Use native snapping, just update selected date
    const index = Math.round(offsetX / DATE_ITEM_WIDTH)
    const clampedIndex = Math.max(0, Math.min(index, availableDates.length - 1))

    // Update the selected date immediately
    if (availableDates[clampedIndex]) {
      setSelectedDate(availableDates[clampedIndex])

      // Hide arrow if we're back on today
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayIndex = availableDates.findIndex(date => date.getTime() === today.getTime())
      if (clampedIndex === todayIndex) {
        setShowBackToTodayArrow(false)
      }
    }
  }

  const handleSwipeGesture = (event: PanGestureHandlerGestureEvent) => {
    const { translationX, velocityX } = event.nativeEvent

    if (Math.abs(translationX) > 50 || Math.abs(velocityX) > 500) {
      if (translationX > 0) {
        handleDateChange('prev')
      } else {
        handleDateChange('next')
      }
    }
  }

  const handleScroll = (event: any) => {
    const currentScrollY = event.nativeEvent.contentOffset.y
    const scrollDiff = currentScrollY - lastScrollY.current

    // Much less sensitive scroll detection
    if (Math.abs(scrollDiff) > 25) {
      if (scrollDiff > 25 && currentScrollY > 100) {
        // Scrolling down significantly - hide banner
        Animated.timing(bannerHeight, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }).start()
      } else if (scrollDiff < -25) {
        // Scrolling up significantly - show banner
        Animated.timing(bannerHeight, {
          toValue: 1,
          duration: 250,
          useNativeDriver: false,
        }).start()
      }
    }

    lastScrollY.current = currentScrollY
  }

  return (
    <BetSlipProvider>
      <SafeAreaView style={globalStyles.safeArea} edges={['bottom']}>
        <View style={styles.wrapper}>
          {/* Animated Header Banner */}
          <Animated.View
            style={[
              styles.headerBanner,
              {
                height: bannerHeight.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 60],
                }),
                opacity: bannerHeight,
              },
            ]}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <TrueSharpShield size={18} variant="default" />
                <Text style={styles.headerTitle}>Games and Odds</Text>
              </View>
            </View>
          </Animated.View>

          <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {/* Date Wheel Selector */}
            <View style={styles.dateWheelSection}>
              <ScrollView
                ref={dateScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.dateWheelScrollView}
                decelerationRate="normal"
                onScroll={handleDateScroll}
                onMomentumScrollEnd={handleDateScrollEnd}
                scrollEventThrottle={16}
                snapToInterval={DATE_ITEM_WIDTH}
                snapToAlignment="center"
              >
                <View style={{ width: screenWidth / 2 - DATE_ITEM_WIDTH / 2 }} />
                {availableDates.map((date, index) => {
                  const isSelected = date.getTime() === selectedDate.getTime()

                  // Normalize today for proper comparison
                  const today = new Date()
                  today.setHours(0, 0, 0, 0)
                  const isToday = date.getTime() === today.getTime()

                  const yesterday = new Date(today)
                  yesterday.setDate(today.getDate() - 1)
                  const isYesterday = date.getTime() === yesterday.getTime()

                  const tomorrow = new Date(today)
                  tomorrow.setDate(today.getDate() + 1)
                  const isTomorrow = date.getTime() === tomorrow.getTime()

                  const getDateLabel = () => {
                    if (isToday) return 'Today'
                    if (isYesterday) return 'Yest'
                    if (isTomorrow) return 'Tmrw'
                    return date.toLocaleDateString('en-US', { weekday: 'short' })
                  }

                  return (
                    <TouchableOpacity
                      key={date.toISOString()}
                      style={[
                        styles.dateWheelItem,
                        isSelected && styles.dateWheelItemSelected,
                        isToday && styles.dateWheelItemToday,
                      ]}
                      onPress={() => {
                        setSelectedDate(date)
                        const scrollX = index * DATE_ITEM_WIDTH
                        dateScrollRef.current?.scrollTo({
                          x: Math.max(0, scrollX),
                          animated: true,
                        })
                      }}
                    >
                      <Text
                        style={[
                          styles.dateWheelDay,
                          isSelected && styles.dateWheelDaySelected,
                          isToday && styles.dateWheelDayToday,
                        ]}
                      >
                        {getDateLabel()}
                      </Text>
                      <Text
                        style={[
                          styles.dateWheelDate,
                          isSelected && styles.dateWheelDateSelected,
                          isToday && styles.dateWheelDateToday,
                        ]}
                      >
                        {date.getDate()}
                      </Text>
                      <Text
                        style={[
                          styles.dateWheelMonth,
                          isSelected && styles.dateWheelMonthSelected,
                          isToday && styles.dateWheelMonthToday,
                        ]}
                      >
                        {date.toLocaleDateString('en-US', { month: 'short' })}
                      </Text>
                      {isToday && <View style={styles.todayIndicator} />}
                    </TouchableOpacity>
                  )
                })}
                <View style={{ width: screenWidth / 2 - DATE_ITEM_WIDTH / 2 }} />
              </ScrollView>

              {/* Back to Today Arrow */}
              {showBackToTodayArrow && (
                <TouchableOpacity
                  style={[
                    styles.backToTodayArrow,
                    arrowDirection === 'left'
                      ? styles.backToTodayArrowLeft
                      : styles.backToTodayArrowRight,
                  ]}
                  onPress={snapToToday}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={arrowDirection === 'left' ? 'chevron-back' : 'chevron-forward'}
                    size={20}
                    color={theme.colors.text.inverse}
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* League Tabs */}
            <View style={styles.leagueSection}>
              <Text style={styles.sectionTitle}>Leagues</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.leagueTabsContainer}
                style={styles.leagueTabsScrollView}
              >
                {LEAGUES.map((league, index) => (
                  <TouchableOpacity
                    key={league.name}
                    style={[
                      styles.leagueTab,
                      selectedLeague === league.name && styles.leagueTabActive,
                      {
                        backgroundColor:
                          selectedLeague === league.name ? league.color : theme.colors.surface,
                      },
                    ]}
                    onPress={() => setSelectedLeague(league.name)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.leagueIcon}>{league.icon}</Text>
                    <Text
                      style={[
                        styles.leagueTabText,
                        selectedLeague === league.name && styles.leagueTabTextActive,
                      ]}
                    >
                      {league.name}
                    </Text>
                    {/* Game count - show actual count for each league */}
                    <View
                      style={[
                        styles.gameCountBadge,
                        selectedLeague === league.name && styles.gameCountBadgeActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.gameCountText,
                          selectedLeague === league.name && styles.gameCountTextActive,
                        ]}
                      >
                        {gameCounts[league.name] || 0}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Game Cards */}
            <View style={styles.gamesSection}>
              {isLoadingGames ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text style={styles.loadingText}>Loading games...</Text>
                </View>
              ) : filteredGames.length > 0 ? (
                filteredGames.map(game => (
                  <UniversalGameCard
                    key={game.id}
                    game={game}
                    league={selectedLeague}
                    onOddsClick={handleOddsClick}
                  />
                ))
              ) : games.length > 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="calendar-outline" size={48} color={theme.colors.text.light} />
                  <Text style={styles.emptyStateTitle}>No {selectedLeague} Games</Text>
                  <Text style={styles.emptyStateSubtitle}>
                    No games scheduled for {formatDateDisplay(selectedDate).toLowerCase()}
                  </Text>
                  <Text style={styles.emptyStateHint}>
                    Try selecting a different date or league
                  </Text>
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="calendar-outline" size={48} color={theme.colors.text.light} />
                  <Text style={styles.emptyStateTitle}>No Games Available</Text>
                  <Text style={styles.emptyStateSubtitle}>No games found for this day</Text>
                  <Text style={styles.emptyStateHint}>
                    Check back later or try a different date
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Floating Bet Slip */}
          <FloatingBetSlip />
        </View>
      </SafeAreaView>
    </BetSlipProvider>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  // Header Banner
  headerBanner: {
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    ...theme.shadows.sm,
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    height: 60,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
  },

  // Date Wheel Section
  dateWheelSection: {
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingVertical: theme.spacing.xs,
    position: 'relative',
  },
  dateWheelScrollView: {},
  dateWheelItem: {
    width: DATE_ITEM_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: 2,
    borderRadius: theme.borderRadius.md,
    minHeight: 50,
    position: 'relative',
  },
  dateWheelItemSelected: {
    backgroundColor: theme.colors.primary,
    ...theme.shadows.md,
    transform: [{ scale: 1.02 }],
  },
  dateWheelItemToday: {
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.primary + '40',
  },
  dateWheelDay: {
    fontSize: 10,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    lineHeight: 12,
  },
  dateWheelDaySelected: {
    color: theme.colors.text.inverse,
  },
  dateWheelDayToday: {
    color: theme.colors.primary,
  },
  dateWheelDate: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginVertical: 0,
    lineHeight: 18,
  },
  dateWheelDateSelected: {
    color: theme.colors.text.inverse,
  },
  dateWheelDateToday: {
    color: theme.colors.primary,
  },
  dateWheelMonth: {
    fontSize: 9,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    lineHeight: 10,
    marginTop: 1,
  },
  dateWheelMonthSelected: {
    color: theme.colors.text.inverse,
  },
  dateWheelMonthToday: {
    color: theme.colors.primary,
  },
  todayIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.primary,
  },

  // Back to Today Arrow
  backToTodayArrow: {
    position: 'absolute',
    top: '50%',
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.md,
    transform: [{ translateY: -18 }],
  },
  backToTodayArrowLeft: {
    left: 12,
  },
  backToTodayArrowRight: {
    right: 12,
  },

  // League Section
  leagueSection: {
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingVertical: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  leagueTabsScrollView: {
    paddingHorizontal: theme.spacing.md,
  },
  leagueTabsContainer: {
    paddingRight: theme.spacing.md,
  },
  leagueTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minWidth: 100,
  },
  leagueTabActive: {
    borderColor: 'transparent',
    ...theme.shadows.sm,
  },
  leagueIcon: {
    fontSize: 16,
    marginRight: theme.spacing.xs,
  },
  leagueTabText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  leagueTabTextActive: {
    color: theme.colors.text.inverse,
  },
  gameCountBadge: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.xs,
  },
  gameCountBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  gameCountText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
  },
  gameCountTextActive: {
    color: theme.colors.text.inverse,
  },

  // Games Section
  gamesSection: {
    flex: 1,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing['2xl'],
  },
  loadingText: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing['3xl'],
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  emptyStateTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    lineHeight: 20,
  },
  emptyStateHint: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.light,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: theme.spacing.xs,
  },
  debugText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.light,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    fontStyle: 'italic',
  },
})
