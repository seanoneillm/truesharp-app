'use client'

import { AnalyticsHeader } from '@/components/analytics/analytics-header'
import { AnalyticsTab as AnalyticsTabComponent } from '@/components/analytics/analytics-tab'
import { BetsTab } from '@/components/analytics/bets-tab'
import { FilterOptions, FilterSystem } from '@/components/analytics/filter-system'
import { OverviewTab } from '@/components/analytics/overview-tab'
import { ProUpgradePrompt } from '@/components/analytics/pro-upgrade-prompt'
import { StrategiesTab } from '@/components/analytics/strategies-tab'
import { AnalyticsTab, TabNavigation } from '@/components/analytics/tab-navigation'
import ProtectedRoute from '@/components/auth/protected-route'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useAnalytics, type Bet } from '@/lib/hooks/use-analytics'
import { useAuth } from '@/lib/hooks/use-auth'
import { RefreshCw, Link, X, BarChart3 } from 'lucide-react'
import React, { useCallback, useEffect, useState } from 'react'
import MaintenanceOverlay from '@/components/maintenance/MaintenanceOverlay'

const ADMIN_USER_IDS = [
  '28991397-dae7-42e8-a822-0dffc6ff49b7',
  '0e16e4f5-f206-4e62-8282-4188ff8af48a',
  'dfd44121-8e88-4c83-ad95-9fb8a4224908',
]


function calculateTrends(monthlyData: { roi: number }[]): {
  trend: 'up' | 'down' | 'flat'
  percentage: number
} {
  if (monthlyData.length < 2) return { trend: 'flat', percentage: 0 }

  const recent = monthlyData.slice(-3)
  if (recent.length < 2) return { trend: 'flat', percentage: 0 }

  const first = recent[0]?.roi || 0
  const last = recent[recent.length - 1]?.roi || 0
  const change = last - first

  if (Math.abs(change) < 1) return { trend: 'flat', percentage: 0 }
  return {
    trend: change > 0 ? 'up' : 'down',
    percentage: Math.abs(change),
  }
}

// Using interfaces from the analytics hook

interface UserProfile {
  username: string
  isPro: boolean
}

// Utility function to determine pro status from various formats
function determineProStatus(profile: any): boolean {
  if (!profile) return false

  // Check various possible pro status fields and formats
  const proFields = [
    profile.pro,
    profile.is_pro,
    profile.isPro,
    profile.is_premium,
    profile.premium,
  ]

  for (const field of proFields) {
    if (field === 'yes' || field === true || field === 1 || field === '1') {
      return true
    }
  }

  return false
}

// Using Bet interface from the analytics hook

interface Strategy {
  id: string
  name: string
  description: string
  filters: FilterOptions
  filter_config?: FilterOptions // Keep for backward compatibility 
  monetized: boolean
  pricing_weekly?: number
  pricing_monthly?: number
  pricing_yearly?: number
  subscriber_count: number
  performance_roi: number
  performance_win_rate: number
  performance_total_bets: number
  created_at: string
  updated_at: string
  // Additional leaderboard fields
  winning_bets: number
  losing_bets: number
  push_bets: number
  primary_sport?: string
  bet_type?: string
  verification_status?: string
  is_verified_seller?: boolean
  overall_rank?: number
  sport_rank?: number
  is_eligible?: boolean
  minimum_bets_met?: boolean
}

const defaultFilters: FilterOptions = {
  // Core database filters - now arrays for multi-select
  betTypes: ['All'],
  leagues: ['All'],
  statuses: ['All'],
  isParlays: ['All'],
  sides: ['All'],
  oddsTypes: ['All'],

  // Time and sportsbook filters
  timeRange: 'All time',
  sportsbooks: [],

  // Legacy filters (keep for backward compatibility)
  sports: [],
}

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth()
  
  // Check if user is admin
  const isAdmin = user?.id && ADMIN_USER_IDS.includes(user.id)
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview')
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMoreBets, setHasMoreBets] = useState(true) // Re-enable pagination
  const [loadingMoreBets, setLoadingMoreBets] = useState(false)
  const [additionalBets, setAdditionalBets] = useState<Bet[]>([]) // For paginated real bets
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [strategiesLoading, setStrategiesLoading] = useState(false)
  const [isRefreshingBets, setIsRefreshingBets] = useState(false)
  const [isLinkingSportsbooks, setIsLinkingSportsbooks] = useState(false)
  const [refreshResult, setRefreshResult] = useState<string | null>(null)
  const [showBankrollGuide, setShowBankrollGuide] = useState(false)

  // Local filter state to prevent resets
  const [localFilters, setLocalFilters] = useState<FilterOptions>(defaultFilters)

  // Use the analytics hook
  const {
    analyticsData,
    isLoading: analyticsLoading,
    error: analyticsError,
    filters,
    updateFilters,
  } = useAnalytics(user)

  // Function to check browser compatibility for extension
  const isBrowserSupported = () => {
    const userAgent = navigator.userAgent.toLowerCase()
    const isChrome = userAgent.includes('chrome') && !userAgent.includes('edg')
    const isEdge = userAgent.includes('edg')
    
    // Chrome and Edge are typically supported for SharpSports extension
    return isChrome || isEdge
  }

  // Load SharpSports extension script on page load
  useEffect(() => {
    const loadSharpSportsExtension = async () => {
      if (!user?.id) return

      // Check browser compatibility first
      if (!isBrowserSupported()) {
        console.log('⚠️ Browser may not support SharpSports extension - Chrome or Edge recommended')
        // Still attempt to load but don't show errors
      }

      try {
        console.log('🔗 Loading SharpSports extension script on page load')

        // Get extension auth token
        const authTokenResponse = await fetch('/api/sharpsports/extension-auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
          }),
        })

        let extensionAuthToken = null
        if (authTokenResponse.ok) {
          const authResult = await authTokenResponse.json()
          extensionAuthToken = authResult.extensionAuthToken
          console.log('🔑 Extension auth token for page load:', extensionAuthToken ? 'obtained' : 'not available')
        }

        // Get public key for extension script
        const configResponse = await fetch('/api/sharpsports/script-config')
        if (!configResponse.ok) {
          console.log('⚠️ Script config not available, status:', configResponse.status)
          return
        }
        const configResult = await configResponse.json()
        const publicKey = configResult.publicKey

        // Get bettor ID from user profile
        const profileResponse = await fetch(`/api/profile?userId=${user.id}`)
        if (!profileResponse.ok) {
          console.log('⚠️ Profile not available for extension script, status:', profileResponse.status)
          return
        }
        const profileResult = await profileResponse.json()
        const bettorId = profileResult.data?.sharpsports_bettor_id

        if (!bettorId) {
          console.log('⚠️ No SharpSports bettor ID found - extension script not loaded')
          return
        }

        // Remove any existing extension scripts
        const existingScripts = document.querySelectorAll('script[src*="extension-cdn.js"]')
        existingScripts.forEach(script => script.remove())

        // Create and inject the extension script
        const extensionScript = document.createElement('script')
        extensionScript.src = 'https://d1vhnbpkpweicq.cloudfront.net/extension-cdn.js'
        extensionScript.setAttribute('internalId', bettorId)
        extensionScript.setAttribute('publicKey', publicKey)
        
        if (extensionAuthToken) {
          extensionScript.setAttribute('extensionAuthToken', extensionAuthToken)
        }

        document.head.appendChild(extensionScript)
        console.log('✅ SharpSports extension script loaded on page load with:', {
          internalId: bettorId,
          publicKey: publicKey.substring(0, 10) + '...',
          hasAuthToken: !!extensionAuthToken
        })

      } catch (error) {
        console.log('⚠️ Failed to load extension script on page load:', error)
      }
    }

    loadSharpSportsExtension()
  }, [user?.id])  // Only reload when user changes

  // Function to handle extension update prompts
  const handleExtensionUpdateRequired = (downloadUrl: string) => {
    const userWantsUpdate = window.confirm(
      '🔄 Extension Update Required\n\n' +
      'Your SharpSports browser extension needs to be updated to continue syncing certain sportsbooks.\n\n' +
      'Click OK to download the latest version, or Cancel to continue with limited functionality.'
    )

    if (userWantsUpdate && downloadUrl) {
      window.open(downloadUrl, '_blank')
    }
  }

  // Combine bets and ensure uniqueness by ID to prevent duplicate keys
  const recentBets = React.useMemo(() => {
    const initialBets = analyticsData?.recentBets || []
    const allBets = [...initialBets, ...additionalBets]
    
    // Debug logging for duplicates
    const seenIds = new Set()
    const duplicateIds = new Set()
    allBets.forEach(bet => {
      if (seenIds.has(bet.id)) {
        duplicateIds.add(bet.id)
      } else {
        seenIds.add(bet.id)
      }
    })
    
    if (duplicateIds.size > 0) {
      console.warn('🚨 Found duplicate bet IDs:', Array.from(duplicateIds))
      console.log('Initial bets count:', initialBets.length, 'Additional bets count:', additionalBets.length)
    }
    
    // Remove duplicates by ID (keep first occurrence)
    const uniqueBets = allBets.filter((bet, index, arr) => 
      arr.findIndex(b => b.id === bet.id) === index
    )
    
    console.log(`📊 Combined bets: ${allBets.length} total, ${uniqueBets.length} unique`)
    
    return uniqueBets
  }, [analyticsData?.recentBets, additionalBets])

  // Improved user profile fetching with better error handling
  useEffect(() => {
    async function fetchProfile() {
      if (!user) {
        console.log('📊 Analytics - No user found, skipping profile fetch')
        return
      }

      console.log('📊 Analytics - Fetching profile for user:', user.email, 'ID:', user.id)

      // Set immediate fallback profile while fetching
      const immediateProfile = {
        username: user.name || user.email?.split('@')[0] || user.id.split('-')[0] || 'User',
        isPro: false,
      }
      setUserProfile(immediateProfile)

      try {
        const response = await fetch(`/api/profile?userId=${user.id}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        console.log('📊 Analytics - Profile API response status:', response.status)

        if (response.ok) {
          const result = await response.json()
          const profile = result.data
          console.log('📊 Analytics - Profile data received:', profile)

          if (profile) {
            const isPro = determineProStatus(profile)
            const enhancedProfile = {
              username:
                profile.username ||
                profile.display_name ||
                user.name ||
                user.email?.split('@')[0] ||
                user.id.substring(0, 8) ||
                'User',
              isPro: isPro,
            }
            console.log('📊 Analytics - Setting enhanced profile:', enhancedProfile)
            console.log('📊 Analytics - Pro status details:', {
              rawPro: profile.pro,
              type: typeof profile.pro,
              isPro: isPro,
              is_pro: profile.is_pro,
              allFields: { pro: profile.pro, is_pro: profile.is_pro, isPro: profile.isPro },
            })
            setUserProfile(enhancedProfile)
          } else {
            console.log('📊 Analytics - Profile data is null, keeping fallback')
          }
        } else {
          const errorText = await response.text()
          console.log('📊 Analytics - Profile fetch failed:', response.status, errorText)
          // Keep the immediate fallback profile we already set
        }
      } catch (error) {
        console.error('📊 Analytics - Profile fetch error:', error)
        // Keep the immediate fallback profile we already set
      }

      // Always fetch strategies if we have a user
      if (user.id) {
        fetchStrategies(user.id)
      }
    }

    fetchProfile()
  }, [user])

  const handleRefreshAllBets = async () => {
    if (!user?.id) {
      setRefreshResult('❌ User not authenticated')
      return
    }

    // Show professional warning popup
    const userConfirmed = window.confirm(
      'Bet Sync in Progress\n\n' +
        'This process will sync all your betting data and may take several minutes to complete.\n\n' +
        '⚠️ Please do not close this browser tab or navigate away until the sync is finished.\n\n' +
        'Click OK to continue or Cancel to abort.'
    )

    if (!userConfirmed) {
      return
    }

    setIsRefreshingBets(true)
    setRefreshResult(null)

    try {
      console.log('🔄 Starting combined SharpSports refresh for user', user.id)

      // Get extension auth token for refresh calls
      let extensionAuthToken = null
      let extensionVersion = null

      try {
        const authTokenResponse = await fetch('/api/sharpsports/extension-auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
          }),
        })

        if (authTokenResponse.ok) {
          const authResult = await authTokenResponse.json()
          extensionAuthToken = authResult.extensionAuthToken
        }

        // Get extension version from sessionStorage
        extensionVersion = sessionStorage.getItem('sharpSportsExtensionVersion')
        
        console.log('🔑 Extension data for refresh:', {
          hasAuthToken: !!extensionAuthToken,
          extensionVersion: extensionVersion || 'not found'
        })
      } catch (error) {
        console.log('⚠️ Could not get extension data for refresh, continuing without')
      }

      const refreshPayload: any = {
        userId: user.id,
      }

      // Add extension data to refresh calls (Step 4 of SDK implementation)
      if (extensionAuthToken) {
        refreshPayload.extensionAuthToken = extensionAuthToken
      }
      if (extensionVersion) {
        refreshPayload.extensionVersion = extensionVersion
      }

      const response = await fetch('/api/sharpsports/refresh-all-bets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(refreshPayload),
      })

      const result = await response.json()

      if (result.success) {
        console.log('✅ Combined refresh completed:', result.message)
        setRefreshResult('✅ All bets refreshed successfully')

        // Check for extension update requirements in any step
        let extensionUpdateRequired = false
        let extensionDownloadUrl = null

        if (result.results) {
          const { step1, step2, step3, step4 } = result.results
          
          // Check each step for extension update requirements
          const steps = [step1, step2, step3, step4]
          for (const step of steps) {
            if (step?.extensionUpdateRequired) {
              extensionUpdateRequired = true
              extensionDownloadUrl = step.extensionDownloadUrl
              break
            }
          }

          const details = []
          if (step1?.success) details.push(`✅ Fetched ${step1.stats?.totalBettors || 0} bettors`)
          if (step2?.success)
            details.push(`✅ Matched ${step2.stats?.matchedProfiles || 0} profiles`)
          if (step3?.success) details.push(`✅ Synced ${step3.stats?.newBets || 0} new bets`)

          if (details.length > 0) {
            setRefreshResult('✅ All bets refreshed successfully')
          }
        }

        // Handle extension update if required
        if (extensionUpdateRequired && extensionDownloadUrl) {
          handleExtensionUpdateRequired(extensionDownloadUrl)
        }

        // Clear result after 5 seconds
        setTimeout(() => setRefreshResult(null), 5000)
      } else {
        console.error('❌ Combined refresh failed:', result.error)
        setRefreshResult(`❌ ${result.error || 'Refresh failed'}`)
      }
    } catch (error) {
      console.error('❌ Error during combined refresh:', error)
      setRefreshResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsRefreshingBets(false)
    }
  }

  const handleLinkSportsbooks = async () => {
    if (!user?.id) return

    setIsLinkingSportsbooks(true)

    try {
      console.log('🔗 Implementing SharpSports Browser Extension SDK')

      // Step 1: Generate Extension Auth Token
      console.log('🔑 Getting extension auth token...')
      const authTokenResponse = await fetch('/api/sharpsports/extension-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      })

      let extensionAuthToken = null
      if (authTokenResponse.ok) {
        try {
          const authResult = await authTokenResponse.json()
          extensionAuthToken = authResult.extensionAuthToken
          console.log('✅ Extension auth token:', extensionAuthToken ? 'obtained' : 'not available')
        } catch (error) {
          console.log('⚠️ Extension auth token JSON parse error:', error)
        }
      } else {
        console.log('⚠️ Extension auth token not available, status:', authTokenResponse.status)
      }

      // Step 2: Add Extension Script Tag
      console.log('📜 Adding SharpSports extension script...')
      
      // Get public key for extension script
      const configResponse = await fetch('/api/sharpsports/script-config')
      if (!configResponse.ok) {
        throw new Error(`Script config failed: ${configResponse.status}`)
      }
      const configResult = await configResponse.json()
      const publicKey = configResult.publicKey

      // Get bettor ID from user profile
      const profileResponse = await fetch(`/api/profile?userId=${user.id}`)
      if (!profileResponse.ok) {
        throw new Error(`Profile fetch failed: ${profileResponse.status}`)
      }
      const profileResult = await profileResponse.json()
      const bettorId = profileResult.data?.sharpsports_bettor_id

      // Allow users without bettor ID to still access the sportsbook linking UI
      if (!bettorId) {
        console.log('⚠️ No SharpSports bettor ID found - user will be able to set up their account')
      }

      // Remove any existing extension scripts
      const existingScripts = document.querySelectorAll('script[src*="extension-cdn.js"]')
      existingScripts.forEach(script => script.remove())

      // Create and inject the extension script with proper attributes
      const extensionScript = document.createElement('script')
      extensionScript.src = 'https://d1vhnbpkpweicq.cloudfront.net/extension-cdn.js'
      
      // Only set bettor ID if available, otherwise script will handle initial setup
      if (bettorId) {
        extensionScript.setAttribute('internalId', bettorId)
      }
      extensionScript.setAttribute('publicKey', publicKey)
      
      if (extensionAuthToken) {
        extensionScript.setAttribute('extensionAuthToken', extensionAuthToken)
      }

      document.head.appendChild(extensionScript)
      console.log('✅ Extension script injected with:', {
        internalId: bettorId || 'not set (new user setup)',
        publicKey: publicKey.substring(0, 10) + '...',
        hasAuthToken: !!extensionAuthToken
      })

      // Step 3: Get extension version from sessionStorage
      const extensionVersion = sessionStorage.getItem('sharpSportsExtensionVersion')
      console.log('📱 Extension version from sessionStorage:', extensionVersion || 'not found')

      // Step 4: Generate context with extension data
      console.log('🔗 Generating SharpSports context for Booklink UI with extension data')

      const contextPayload: any = {
        userId: user.id,
        redirectUrl:
          window.location.hostname === 'localhost'
            ? 'https://ddb528ce02c4.ngrok-free.app/api/sharpsports/accounts'
            : `${window.location.origin}/api/sharpsports/accounts`,
      }

      // Add extension data to context call
      if (extensionAuthToken) {
        contextPayload.extensionAuthToken = extensionAuthToken
      }
      if (extensionVersion) {
        contextPayload.extensionVersion = extensionVersion
      }

      const response = await fetch('/api/sharpsports/context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contextPayload),
      })

      if (!response.ok) {
        throw new Error(`Failed to generate context: ${response.status}`)
      }

      const result = await response.json()
      const { contextId, fallback } = result
      console.log('✅ Generated SharpSports context ID:', contextId)

      let booklinkUrl
      if (fallback) {
        // Use direct Booklink URL pattern for fallback
        console.log('🔄 Using fallback Booklink URL approach')
        const redirectUrl = window.location.hostname === 'localhost'
          ? 'https://ddb528ce02c4.ngrok-free.app/api/sharpsports/accounts'
          : `${window.location.origin}/api/sharpsports/accounts`
        
        booklinkUrl = `https://booklink.sharpsports.io?userId=${user.id}&callback=${encodeURIComponent(`${redirectUrl}?userId=${user.id}`)}`
      } else {
        // Use standard context-based URL
        booklinkUrl = `https://ui.sharpsports.io/link/${contextId}`
      }

      console.log('📋 Opening Booklink UI:', booklinkUrl)

      const popup = window.open(
        booklinkUrl,
        'sharpsports-booklink',
        'width=700,height=800,scrollbars=yes,resizable=yes,location=yes'
      )

      if (!popup) {
        console.error('Popup blocked')
        return
      }

      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed)
          console.log('📝 Booklink popup closed')
        }
      }, 1000)
    } catch (error) {
      console.error('Error generating SharpSports context:', error)
    } finally {
      setIsLinkingSportsbooks(false)
    }
  }

  const fetchStrategies = async (userId?: string) => {
    console.log('🎯 fetchStrategies called with userId:', userId?.substring(0, 8) + '...')
    setStrategiesLoading(true)
    try {
      // Use provided userId or fallback to authenticated user
      const effectiveUserId = userId || user?.id
      const url = effectiveUserId ? `/api/strategies?userId=${effectiveUserId}` : '/api/strategies'
      console.log('Fetching strategies with URL:', url)

      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
      })
      if (response.ok) {
        const result = await response.json()
        console.log('✅ Strategies fetched successfully:', result.strategies?.length || 0)
        console.log('📋 Strategy data:', result.strategies)
        // Transform strategies to ensure filters property exists
        const transformedStrategies = (result.strategies || []).map((strategy: any) => ({
          ...strategy,
          filters: strategy.filters || strategy.filter_config || defaultFilters
        }))
        setStrategies(transformedStrategies)
      } else {
        console.error('Failed to fetch strategies:', response.status)
        setStrategies([])
      }
    } catch (error) {
      console.error('Error fetching strategies:', error)
      setStrategies([])
    } finally {
      setStrategiesLoading(false)
    }
  }

  const loadMoreBets = async () => {
    if (loadingMoreBets || !hasMoreBets || !user?.id) return

    setLoadingMoreBets(true)

    try {
      console.log('📊 Loading more bets - Page:', currentPage + 1)
      
      // Calculate offset for pagination
      const currentBetCount = recentBets.length
      const limit = 20 // Load 20 more bets at a time
      
      console.log(`📊 Current bet count: ${currentBetCount}, requesting ${limit} more bets`)

      // Create pagination request parameters
      const paginationParams = new URLSearchParams({
        userId: user.id,
        pageType: 'pagination',
        limit: limit.toString(),
        offset: currentBetCount.toString(),
        // Include current filters to maintain consistency
        ...Object.fromEntries(
          Object.entries(filters).map(([key, value]) => [
            key, 
            Array.isArray(value) ? value.join(',') : String(value)
          ])
        )
      })

      console.log('📊 Pagination params:', paginationParams.toString())

      const response = await fetch(`/api/analytics?${paginationParams}`, {
        credentials: 'include',
      })

      if (response.ok) {
        const result = await response.json()
        const newBets = result.data?.recentBets || []
        
        console.log(`📊 Loaded ${newBets.length} new bets from pagination`)
        
        if (newBets.length > 0) {
          // Append new bets to existing additional bets
          setAdditionalBets(prev => [...prev, ...newBets])
          setCurrentPage(prev => prev + 1)
          
          // If we got fewer bets than requested, we've reached the end
          if (newBets.length < limit) {
            console.log('📊 Reached end of bets (got fewer than requested)')
            setHasMoreBets(false)
          }
        } else {
          // No more bets to load
          console.log('📊 No more bets available')
          setHasMoreBets(false)
        }
      } else {
        console.error('Failed to load more bets:', response.status)
        const errorData = await response.text()
        console.error('Error details:', errorData)
        setHasMoreBets(false)
      }
    } catch (err) {
      console.error('Error loading more bets:', err)
      setHasMoreBets(false)
    } finally {
      setLoadingMoreBets(false)
    }
  }

  const handleFiltersChange = useCallback(
    (newFilters: FilterOptions) => {
      console.log('Filter change triggered:', newFilters)

      // Reset pagination when filters change
      setAdditionalBets([])
      setCurrentPage(1)
      setHasMoreBets(true)

      // Update local state immediately for UI responsiveness
      setLocalFilters(newFilters)

      // Convert FilterOptions to AnalyticsFilters format for the hook
      const sports: string[] = []
      const leagues: string[] = []
      const betTypes: string[] = []
      const results: string[] = []

      // Handle leagues filter - map to database league column
      if (newFilters.leagues && !newFilters.leagues.includes('All')) {
        leagues.push(...newFilters.leagues)
      }

      // Handle bet types filter - map to database bet_type column
      if (newFilters.betTypes && !newFilters.betTypes.includes('All')) {
        betTypes.push(...newFilters.betTypes)
      }

      // Handle statuses filter - map to database status column
      if (newFilters.statuses && !newFilters.statuses.includes('All')) {
        results.push(...newFilters.statuses)
      } else {
        results.push('won', 'lost', 'pending', 'void', 'cancelled')
      }

      // Include legacy filters for backward compatibility
      if (newFilters.sports) {
        sports.push(...newFilters.sports)
      }

      console.log('Updating analytics filters:', { sports, leagues, betTypes })

      // Directly update filters - debouncing is now handled in the hook
      updateFilters({
        sports: [...new Set(sports)], // Remove duplicates
        leagues: [...new Set(leagues)], // Remove duplicates
        betTypes: [...new Set(betTypes)], // Remove duplicates
        sportsbooks: newFilters.sportsbooks || [],
        results: [...new Set(results)], // Use calculated results
        timeframe:
          newFilters.timeRange === '7 days'
            ? '7d'
            : newFilters.timeRange === '30 days'
              ? '30d'
              : newFilters.timeRange === '3 months'
                ? '90d'
                : newFilters.timeRange === 'This Year'
                  ? 'ytd'
                  : 'all',
        dateRange: {
          start: newFilters.customStartDate || null,
          end: newFilters.customEndDate || null,
        },
        minOdds: newFilters.oddsRange?.min || null,
        maxOdds: newFilters.oddsRange?.max || null,
        minStake: newFilters.stakeRange?.min || null,
        maxStake: newFilters.stakeRange?.max || null,
        // New database-specific filters
        isParlay:
          newFilters.isParlays && !newFilters.isParlays.includes('All')
            ? newFilters.isParlays.includes('true')
            : null,
        side:
          newFilters.sides && !newFilters.sides.includes('All') ? newFilters.sides.join(',') : null,
        oddsType:
          newFilters.oddsTypes && !newFilters.oddsTypes.includes('All')
            ? newFilters.oddsTypes.join(',')
            : null,
      })
    },
    [updateFilters]
  )

  const handleClearFilters = useCallback(() => {
    console.log('Clearing all filters')

    // Reset local state immediately
    setLocalFilters(defaultFilters)

    // Update analytics filters directly - debouncing is handled in the hook
    updateFilters({
      sports: [],
      leagues: [],
      betTypes: [],
      sportsbooks: [],
      results: ['won', 'lost', 'pending', 'void', 'cancelled'],
      timeframe: 'all',
      dateRange: { start: null, end: null },
      minOdds: null,
      maxOdds: null,
      minStake: null,
      maxStake: null,
      isParlay: null,
      side: null,
      oddsType: null,
    })
  }, [updateFilters])


  const handleCreateStrategy = async (strategy: {
    name: string
    description: string
    filters: FilterOptions
    monetized: boolean
    pricing_weekly?: number
    pricing_monthly?: number
    pricing_yearly?: number
  }) => {
    try {
      // Include user ID for fallback authentication like in betslip
      // Ensure statuses is always set to ['All'] for strategy creation
      const filtersWithDefaults = {
        ...strategy.filters,
        statuses: strategy.filters.statuses || ['All'],
      }

      const requestBody = {
        name: strategy.name,
        description: strategy.description,
        filter_config: filtersWithDefaults, // Map filters to filter_config for API
        monetized: strategy.monetized,
        pricing_weekly: strategy.pricing_weekly,
        pricing_monthly: strategy.pricing_monthly,
        pricing_yearly: strategy.pricing_yearly,
        userId: user?.id, // Include user ID as fallback
      }

      const response = await fetch('/api/strategies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create strategy')
      }

      const result = await response.json()
      console.log('Strategy created successfully:', result)

      // Refresh strategies list
      fetchStrategies()
    } catch (error) {
      console.error('Error creating strategy:', error)
      throw error
    }
  }

  const handleUpdateStrategy = async (id: string, updates: Partial<Strategy>) => {
    try {
      const response = await fetch('/api/strategies', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...updates }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update strategy')
      }

      console.log('Strategy updated successfully')

      // Refresh strategies list
      fetchStrategies()
    } catch (error) {
      console.error('Error updating strategy:', error)
      throw error
    }
  }

  const handleDeleteStrategy = async (id: string) => {
    try {
      const response = await fetch(`/api/strategies?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete strategy')
      }

      console.log('Strategy deleted successfully')

      // Refresh strategies list
      fetchStrategies()
    } catch (error) {
      console.error('Error deleting strategy:', error)
      throw error
    }
  }

  // Show maintenance overlay for non-admin users
  if (user && !isAdmin) {
    return <MaintenanceOverlay pageName="Analytics" />
  }

  // Show loading state - improved to handle user recognition better
  if (authLoading || analyticsLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    )
  }

  // If no user is authenticated, show error
  if (!user) {
    return (
      <DashboardLayout>
        <div className="py-12 text-center">
          <p className="text-red-600">Please sign in to view your analytics</p>
          <button
            onClick={() => (window.location.href = '/auth/signin')}
            className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Sign In
          </button>
        </div>
      </DashboardLayout>
    )
  }

  // Show minimal loading if user profile is still loading
  if (!userProfile) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="mb-2 text-2xl font-bold">Loading your analytics...</h1>
                <p className="text-lg text-blue-100">Please wait while we fetch your data</p>
              </div>
            </div>
          </div>
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    )
  }

  if (analyticsError) {
    console.log('Showing error - error:', analyticsError)
    return (
      <DashboardLayout>
        <div className="py-12 text-center">
          <p className="text-red-600">Error loading analytics: {analyticsError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </DashboardLayout>
    )
  }

  console.log('Rendering main analytics content')
  console.log('Analytics data metrics:', analyticsData?.metrics)
  console.log('User profile:', userProfile)

  // Safety check for analytics data structure
  const metrics = analyticsData?.metrics || {
    totalBets: 0,
    winRate: 0,
    roi: 0,
    totalProfit: 0,
    avgStake: 0,
    biggestWin: 0,
    biggestLoss: 0,
    expectedValue: 0,
    avgClv: 0,
    straightBetsCount: 0,
    parlayBetsCount: 0,
    voidBetsCount: 0,
    streakType: 'none' as const,
    currentStreak: 0,
  }

  const dailyProfitData = analyticsData?.dailyProfitData || []
  const monthlyData = analyticsData?.monthlyData || []

  // Transform chart data for overview with enhanced calculations
  const chartData = dailyProfitData.map(item => ({
    date: item.date,
    profit: item.profit,
    cumulative: item.cumulativeProfit,
  }))

  // Enhanced monthly data for trends
  const enhancedMonthlyData =
    monthlyData.length > 0
      ? monthlyData
      : dailyProfitData.map(item => ({
          month: item.date,
          profit: item.profit,
          roi: metrics.avgStake > 0 ? (item.profit / metrics.avgStake) * 100 : 0,
          volume: metrics.avgStake,
          bets: item.bets,
          wins: item.profit > 0 ? 1 : 0,
        }))

  // Calculate current streak from analytics data - map 'none' to 'loss' for compatibility
  const currentStreak = {
    type:
      metrics.streakType === 'none' ? ('loss' as const) : (metrics.streakType as 'win' | 'loss'),
    count: metrics.streakType === 'none' ? 0 : metrics.currentStreak,
  }

  // Use enhanced analytics data directly
  const transformedAnalytics = {
    totalBets: metrics.totalBets,
    winRate: metrics.winRate,
    roi: metrics.roi,
    netProfit: metrics.totalProfit,
    averageStake: metrics.avgStake,
    largestWin: metrics.biggestWin,
    largestLoss: metrics.biggestLoss,
    currentStreak,
    expectedValue: metrics.expectedValue,
    avgClv: metrics.avgClv,
    straightBetsCount: metrics.straightBetsCount,
    parlayBetsCount: metrics.parlayBetsCount,
    voidBetsCount: metrics.voidBetsCount,
    sportBreakdown: analyticsData.sportBreakdown.map(sport => ({
      sport: sport.sport,
      count: sport.bets,
      profit: sport.profit,
      winRate: sport.winRate,
      roi: sport.roi,
    })),
    betTypeBreakdown: analyticsData.betTypeBreakdown,
    sideBreakdown: analyticsData.sideBreakdown,
    monthlyData: enhancedMonthlyData,
    trends: calculateTrends(enhancedMonthlyData),
    // Enhanced CLV and line movement data (Pro features)
    clvData: userProfile.isPro
      ? analyticsData.lineMovementData.map(item => ({
          date: item.date,
          clv: item.clv,
          profit: item.profit,
        }))
      : [],
    lineMovementData: userProfile.isPro
      ? analyticsData.lineMovementData.map(item => ({
          betId: `bet-${item.date}`,
          openingLine: item.odds,
          closingLine: item.lineValue,
          movement: 'sharp' as const,
          profit: item.profit,
        }))
      : [],
    // Enhanced analytics data from filtered chartData (actual profit, not potential)
    roiOverTime: chartData.map(item => ({
      day: item.date,
      net_profit: item.profit, // Use daily profit change, not cumulative
      roi_pct: item.cumulative > 0 ? (item.profit / (metrics.avgStake || 100)) * 100 : 0,
      bets: 1, // Default to 1 bet per day since ChartDataPoint doesn't include bet count
      total_stake: metrics.avgStake || 0,
    })) || [],
    leagueBreakdown: analyticsData.leagueBreakdown || [],
    winRateVsExpected: analyticsData.winRateVsExpected || [],
    monthlyPerformance: analyticsData.monthlyPerformance || [],
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Analytics Header */}
          <AnalyticsHeader
            username={userProfile.username}
            totalBets={metrics.totalBets}
            winRate={metrics.winRate}
            totalProfit={metrics.totalProfit}
            roi={metrics.roi}
            onShowBankrollGuide={() => setShowBankrollGuide(true)}
          />

          {/* Pro Upgrade Banner */}
          {(() => {
            console.log('📊 Analytics - Checking Pro banner display:', {
              userProfile: userProfile,
              isPro: userProfile.isPro,
              shouldShowBanner: !userProfile.isPro,
            })
            return (
              !userProfile.isPro && (
                <ProUpgradePrompt
                  variant="banner"
                  context="general"
                  onUpgrade={() => {
                    // TODO: Implement Stripe checkout
                    console.log('Upgrade to Pro clicked')
                  }}
                />
              )
            )
          })()}

          {/* Universal Filter System */}
          <FilterSystem
            isPro={userProfile.isPro}
            filters={localFilters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
          />

          {/* Tab Navigation */}
          <TabNavigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
            betCount={recentBets.length}
            strategyCount={strategies.length}
          />

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <OverviewTab
              recentBets={recentBets.map(bet => ({
                ...bet,
                odds: typeof bet.odds === 'number' ? bet.odds.toString() : bet.odds,
                status: bet.status === 'cancelled' ? 'void' as const : bet.status
              }))}
              chartData={chartData}
              selectedTimePeriod={
                filters.timeframe === '7d'
                  ? '7 days'
                  : filters.timeframe === '30d'
                    ? '30 days'
                    : filters.timeframe === '90d'
                      ? '3 months'
                      : filters.timeframe === 'ytd'
                        ? 'This Year'
                        : 'All time'
              }
              onTimePeriodChange={period => {
                const timeframe =
                  period === '7 days'
                    ? '7d'
                    : period === '30 days'
                      ? '30d'
                      : period === '3 months'
                        ? '90d'
                        : period === 'This Year'
                          ? 'ytd'
                          : 'all'
                updateFilters({ ...filters, timeframe })
              }}
              totalProfit={analyticsData?.metrics?.totalProfit || 0}
              isLoading={analyticsLoading}
              analyticsData={analyticsData}
            />
          )}

          {activeTab === 'bets' && (
            <BetsTab
              bets={recentBets.map(bet => ({
                ...bet,
                odds: bet.odds.toString(),
                status:
                  bet.status === 'cancelled'
                    ? ('void' as const)
                    : (bet.status as 'pending' | 'won' | 'lost' | 'void'),
              }))}
              totalBets={metrics.totalBets}
              isLoading={loadingMoreBets}
              hasMore={hasMoreBets}
              onLoadMore={loadMoreBets}
              onSort={(field, direction) => {
                // TODO: Implement sorting
                console.log('Sort:', field, direction)
              }}
            />
          )}

          {activeTab === 'analytics' &&
            (() => {
              console.log(
                '📊 Analytics - Rendering AnalyticsTabComponent with isPro:',
                userProfile.isPro
              )
              console.log('📊 Enhanced Analytics Data:', {
                roiOverTime: transformedAnalytics.roiOverTime,
                leagueBreakdown: transformedAnalytics.leagueBreakdown,
                winRateVsExpected: transformedAnalytics.winRateVsExpected,
                monthlyPerformance: transformedAnalytics.monthlyPerformance,
              })
              return (
                <AnalyticsTabComponent
                  data={transformedAnalytics as any}
                  isPro={userProfile.isPro}
                  isLoading={false}
                  user={user as any}
                />
              )
            })()}

          {activeTab === 'strategies' && (
            <StrategiesTab
              strategies={strategies}
              isLoading={strategiesLoading}
              currentFilters={localFilters}
              onCreateStrategy={handleCreateStrategy}
              onUpdateStrategy={handleUpdateStrategy}
              onDeleteStrategy={handleDeleteStrategy}
              onFiltersChange={handleFiltersChange}
            />
          )}

          {/* Floating Action Buttons */}
          <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
            {/* Refresh Result Toast */}
            {refreshResult && (
              <div
                className={`mb-3 max-w-sm rounded-lg p-3 text-sm shadow-lg ${
                  refreshResult.startsWith('✅')
                    ? 'border border-green-200 bg-green-50 text-green-800'
                    : 'border border-red-200 bg-red-50 text-red-800'
                }`}
              >
                {refreshResult}
              </div>
            )}

            {/* Browser Compatibility Note */}
            {!isBrowserSupported() && (
              <div className="mb-2 max-w-sm rounded-lg border border-yellow-200 bg-yellow-50 p-2 text-xs text-yellow-800">
                🌐 For best extension support, use Chrome or Edge
              </div>
            )}

            {/* Link Sportsbooks Button */}
            <Button
              onClick={handleLinkSportsbooks}
              disabled={isLinkingSportsbooks}
              size="lg"
              className="bg-blue-600 text-white shadow-lg hover:bg-blue-700"
            >
              {isLinkingSportsbooks ? (
                <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Link className="mr-2 h-5 w-5" />
              )}
              Manage Sportsbooks
            </Button>

            {/* Refresh Bets Button */}
            <Button
              onClick={handleRefreshAllBets}
              disabled={isRefreshingBets}
              size="lg"
              className="bg-green-600 text-white shadow-lg hover:bg-green-700"
            >
              {isRefreshingBets ? (
                <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-5 w-5" />
              )}
              Refresh Bets
            </Button>
          </div>
        </div>

        {/* Bankroll Guide Modal */}
        {showBankrollGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-4xl max-h-[90vh] rounded-2xl bg-white shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-green-50 to-emerald-50 p-6">
                <div className="flex items-center space-x-3">
                  <div className="rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 p-2">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">📊 Bankroll Basics & Finding Your Edge</h3>
                    <p className="text-sm text-green-700">Essential guide for responsible betting</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBankrollGuide(false)}
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/50 hover:text-slate-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="max-h-[70vh] overflow-y-auto p-8">
                <div className="prose max-w-none">
                  <div className="mb-8">
                    <h2 className="mb-4 flex items-center text-2xl font-bold text-slate-900">
                      What is a Bankroll?
                    </h2>
                    <p className="text-slate-700">
                      Your bankroll is the amount of money you've set aside strictly for sports betting. Think of it as your "betting budget." The most important rule is simple: <strong>never bet money you can't afford to lose</strong>. Your bankroll should be separate from bills, savings, or everyday spending.
                    </p>
                  </div>

                  <div className="mb-8">
                    <h2 className="mb-4 text-2xl font-bold text-slate-900">How Big Should Your Bankroll Be?</h2>
                    <p className="text-slate-700">
                      There's no universal number. Some bettors set aside $500, others $5,000. The key is comfort — you should be fine if it all disappeared tomorrow. Start small and grow your bankroll with consistent discipline.
                    </p>
                  </div>

                  <div className="mb-8">
                    <h2 className="mb-4 text-2xl font-bold text-slate-900">Units & Bet Sizing</h2>
                    <p className="text-slate-700">
                      To stay consistent, bettors use "units." One unit is usually 1–2% of your bankroll. For example, if your bankroll is $1,000, one unit might be $10–20. Betting in units makes your results easy to track, compare, and analyze — no matter the size of your bankroll.
                    </p>
                  </div>

                  <div className="mb-8">
                    <h2 className="mb-4 text-2xl font-bold text-slate-900">Why Small Bets Win Long-Term</h2>
                    <p className="text-slate-700">
                      It's tempting to chase a big win by betting more, but large swings wipe out bankrolls quickly. By sticking to flat betting (same unit size every time) or a small variation (1–3 units depending on confidence), you protect yourself from losing streaks.
                    </p>
                  </div>

                  <div className="mb-8">
                    <h2 className="mb-4 text-2xl font-bold text-slate-900">Analyzing Your Bet History</h2>
                    <p className="text-slate-700 mb-4">
                      Your analytics dashboard shows you more than just wins and losses. By looking deeper into your performance, you can identify:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-slate-700">
                      <li><strong>Your ROI (Return on Investment):</strong> How much you're earning per dollar risked.</li>
                      <li><strong>Best & Worst Sports/Markets:</strong> Maybe you crush NBA totals but struggle with MLB moneylines.</li>
                      <li><strong>Bet Types That Work:</strong> Some bettors thrive on spreads, others on props.</li>
                    </ul>
                  </div>

                  <div className="mb-8">
                    <h2 className="mb-4 text-2xl font-bold text-slate-900">Tracking Bets = Finding Your Edge</h2>
                    <p className="text-slate-700">
                      Tracking every wager is what separates disciplined bettors from casual gamblers. Over time, patterns emerge. Maybe you're profitable when betting underdogs but lose when you back heavy favorites. With data, you can double down on what works and cut out what doesn't.
                    </p>
                  </div>

                  <div className="rounded-xl bg-gradient-to-r from-green-100 to-emerald-100 p-6">
                    <p className="text-lg font-semibold text-green-900">
                      👉 <strong>Bottom line:</strong> Your bankroll is your foundation, your units are your safety net, and your data is your roadmap. Respect those three, and you give yourself the best chance to succeed while betting responsibly.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  )
}
