'use client'

import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/lib/hooks/use-auth'
import { Clock, RefreshCw, Shield, User, AlertTriangle } from 'lucide-react'
import { useEffect, useState } from 'react'

const ADMIN_USER_ID = '28991397-dae7-42e8-a822-0dffc6ff49b7'

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth()
  const [isFetching, setIsFetching] = useState(false)
  const [isSettling, setIsSettling] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [fetchResult, setFetchResult] = useState<string | null>(null)
  const [settleResult, setSettleResult] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [debugResult, setDebugResult] = useState<string | null>(null)
  const [isDebugging, setIsDebugging] = useState(false)
  
  // SharpSports states
  const [isFetchingBettors, setIsFetchingBettors] = useState(false)
  const [isFetchingBettorProfiles, setIsFetchingBettorProfiles] = useState(false)
  const [isFetchingAccounts, setIsFetchingAccounts] = useState(false)
  const [isRefreshingBets, setIsRefreshingBets] = useState(false)
  const [isRefreshingUserBets, setIsRefreshingUserBets] = useState(false)
  const [bettorsResult, setBettorsResult] = useState<string | null>(null)
  const [bettorProfilesResult, setBettorProfilesResult] = useState<string | null>(null)
  const [accountsResult, setAccountsResult] = useState<string | null>(null)
  const [betsResult, setBetsResult] = useState<string | null>(null)
  const [userBetsResult, setUserBetsResult] = useState<string | null>(null)
  const [sharpSportsBettorId, setSharpSportsBettorId] = useState('')
  const [sharpSportsProfileId, setSharpSportsProfileId] = useState('')
  const [targetUserId, setTargetUserId] = useState('')

  // Initialize date safely after hydration
  useEffect(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    setSelectedDate(today)
  }, [])

  // Check if user is admin
  const isAdmin = user?.id === ADMIN_USER_ID
  
  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-slate-600">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="p-8 text-center max-w-md">
            <User className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Authentication Required</h2>
            <p className="text-slate-600">Please log in to access this page.</p>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="p-8 text-center max-w-md">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Access Denied</h2>
            <p className="text-slate-600 mb-4">You don't have permission to access this admin page.</p>
            <p className="text-sm text-slate-500">User ID: {user.id}</p>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  const handleFetchCurrentOdds = async () => {
    if (!selectedDate) return
    
    setIsFetching(true)
    setFetchResult(null)
    
    try {
      console.log('🔧 Admin: Starting odds fetch for all sports')
      
      const response = await fetch('/api/fetch-odds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sport: 'ALL', // Fetch all sports
          date: selectedDate.toISOString().split('T')[0]
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        console.log('✅ Admin: Odds fetch completed:', result)
        setFetchResult(`✅ Successfully fetched odds for all sports. Check console for details.`)
        setLastUpdated(new Date())
      } else {
        console.error('❌ Admin: Fetch failed:', result)
        setFetchResult(`❌ Fetch failed: ${result.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('❌ Admin: Error during fetch:', error)
      setFetchResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsFetching(false)
    }
  }

  const handleSettleBets = async () => {
    setIsSettling(true)
    setSettleResult(null)
    
    try {
      console.log('🏆 Admin: Starting bet settlement process')
      
      const response = await fetch('/api/settle-bets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      const result = await response.json()
      
      if (result.success) {
        console.log('✅ Admin: Bet settlement completed:', result)
        setSettleResult(`✅ ${result.message}`)
        setLastUpdated(new Date())
      } else {
        console.error('❌ Admin: Settlement failed:', result)
        setSettleResult(`❌ Settlement failed: ${result.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('❌ Admin: Error during settlement:', error)
      setSettleResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSettling(false)
    }
  }

  const handleDebugBetSettlement = async () => {
    setIsDebugging(true)
    setDebugResult(null)
    
    try {
      console.log('🔍 Admin: Starting bet settlement debug')
      
      const response = await fetch('/api/debug-bet-settlement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      const result = await response.json()
      
      if (result.success) {
        console.log('✅ Admin: Debug completed:', result)
        const summary = `Found ${result.pendingBetsCount} pending bets, ${result.gameOddsCount} odds for target game, ${result.gameBetsCount} bets for target game, ${result.teamBetsCount} team-matched bets. Check console for details.`
        setDebugResult(`✅ ${summary}`)
      } else {
        console.error('❌ Admin: Debug failed:', result)
        setDebugResult(`❌ Debug failed: ${result.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('❌ Admin: Error during debug:', error)
      setDebugResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsDebugging(false)
    }
  }

  const handleFetchBettors = async () => {
    setIsFetchingBettors(true)
    setBettorsResult(null)
    
    try {
      console.log('🔧 Admin: Fetching SharpSports bettors')
      
      const response = await fetch('/api/sharpsports/fetch-bettors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      const result = await response.json()
      
      if (result.success) {
        console.log('✅ Admin: Bettors fetch completed:', result)
        setBettorsResult(`✅ ${result.message}`)
        setLastUpdated(new Date())
      } else {
        console.error('❌ Admin: Fetch failed:', result)
        setBettorsResult(`❌ Fetch failed: ${result.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('❌ Admin: Error during bettors fetch:', error)
      setBettorsResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsFetchingBettors(false)
    }
  }

  const handleFetchBettorProfiles = async () => {
    setIsFetchingBettorProfiles(true)
    setBettorProfilesResult(null)
    
    try {
      console.log('🔧 Admin: Fetching SharpSports bettor profiles and matching to user profiles')
      
      const response = await fetch('/api/sharpsports/fetch-bettor-profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      const result = await response.json()
      
      if (result.success) {
        console.log('✅ Admin: Bettor profiles fetch completed:', result)
        setBettorProfilesResult(`✅ ${result.message}`)
        setLastUpdated(new Date())
      } else {
        console.error('❌ Admin: Fetch failed:', result)
        setBettorProfilesResult(`❌ Fetch failed: ${result.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('❌ Admin: Error during bettor profiles fetch:', error)
      setBettorProfilesResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsFetchingBettorProfiles(false)
    }
  }

  const handleFetchAccounts = async () => {
    if (!sharpSportsBettorId || !sharpSportsProfileId) {
      setAccountsResult('❌ Both Bettor ID and Profile ID are required')
      return
    }

    setIsFetchingAccounts(true)
    setAccountsResult(null)
    
    try {
      console.log('🔧 Admin: Fetching SharpSports accounts')
      
      const response = await fetch('/api/sharpsports/fetch-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bettorId: sharpSportsBettorId,
          profileId: sharpSportsProfileId
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        console.log('✅ Admin: Accounts fetch completed:', result)
        setAccountsResult(`✅ ${result.message}`)
        setLastUpdated(new Date())
      } else {
        console.error('❌ Admin: Fetch failed:', result)
        setAccountsResult(`❌ Fetch failed: ${result.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('❌ Admin: Error during accounts fetch:', error)
      setAccountsResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsFetchingAccounts(false)
    }
  }

  const handleRefreshBets = async () => {
    if (!sharpSportsBettorId || !sharpSportsProfileId) {
      setBetsResult('❌ Both Bettor ID and Profile ID are required')
      return
    }

    setIsRefreshingBets(true)
    setBetsResult(null)
    
    try {
      console.log('🔧 Admin: Refreshing SharpSports bets')
      
      const response = await fetch('/api/sharpsports/refresh-bets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bettorId: sharpSportsBettorId,
          profileId: sharpSportsProfileId
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        console.log('✅ Admin: Bets refresh completed:', result)
        setBetsResult(`✅ ${result.message}`)
        setLastUpdated(new Date())
      } else {
        console.error('❌ Admin: Refresh failed:', result)
        setBetsResult(`❌ Refresh failed: ${result.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('❌ Admin: Error during bets refresh:', error)
      setBetsResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsRefreshingBets(false)
    }
  }

  const handleRefreshUserBets = async () => {
    if (!targetUserId) {
      setUserBetsResult('❌ User ID is required')
      return
    }

    setIsRefreshingUserBets(true)
    setUserBetsResult(null)
    
    try {
      console.log('🔧 Admin: Refreshing bets for user', targetUserId)
      
      const response = await fetch('/api/sharpsports/refresh-user-bets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: targetUserId
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        console.log('✅ Admin: User bets refresh completed:', result)
        setUserBetsResult(`✅ ${result.message}`)
        setLastUpdated(new Date())
      } else {
        console.error('❌ Admin: User bets refresh failed:', result)
        setUserBetsResult(`❌ Refresh failed: ${result.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('❌ Admin: Error during user bets refresh:', error)
      setUserBetsResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsRefreshingUserBets(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-6 text-white">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">Admin Panel</h1>
              <p className="text-red-100 text-sm">System management and controls</p>
            </div>
          </div>
        </div>

        {/* Admin Info */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Admin Access Confirmed</h3>
              <p className="text-slate-600">Logged in as admin user</p>
              <p className="text-sm text-slate-500 font-mono">ID: {user.id}</p>
            </div>
            {lastUpdated && (
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <Clock className="w-4 h-4" />
                <span>Last action: {lastUpdated.toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Odds Management */}
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Odds Management</h3>
              <p className="text-slate-600 mb-4">
                Fetch current odds from the SportsGameOdds API for all supported sports.
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                onClick={handleFetchCurrentOdds}
                disabled={isFetching || !selectedDate}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                {isFetching ? 'Fetching Current Odds...' : 'Fetch Current Odds'}
              </Button>

              {selectedDate && (
                <div className="text-sm text-slate-600">
                  Target date: {selectedDate.toLocaleDateString()}
                </div>
              )}
            </div>

            {fetchResult && (
              <div className={`p-4 rounded-lg ${
                fetchResult.startsWith('✅') 
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                <p className="font-mono text-sm">{fetchResult}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Bet Settlement */}
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Bet Settlement</h3>
              <p className="text-slate-600 mb-4">
                Fetch completed game results for yesterday and today to settle bets by updating score columns in the odds table.
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                onClick={handleSettleBets}
                disabled={isSettling}
                className="bg-green-600 hover:bg-green-700"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isSettling ? 'animate-spin' : ''}`} />
                {isSettling ? 'Settling Bets...' : 'Settle Bets'}
              </Button>

              <div className="text-sm text-slate-600">
                Processes completed games from yesterday and today
              </div>
            </div>

            {settleResult && (
              <div className={`p-4 rounded-lg ${
                settleResult.startsWith('✅') 
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                <p className="font-mono text-sm">{settleResult}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Debug Tools */}
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Debug Tools</h3>
              <p className="text-slate-600 mb-4">
                Debug bet settlement issues by checking pending bets and odds data.
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                onClick={handleDebugBetSettlement}
                disabled={isDebugging}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isDebugging ? 'animate-spin' : ''}`} />
                {isDebugging ? 'Debugging...' : 'Debug Bet Settlement'}
              </Button>

              <div className="text-sm text-slate-600">
                Check why bets aren't being settled
              </div>
            </div>

            {debugResult && (
              <div className={`p-4 rounded-lg ${
                debugResult.startsWith('✅') 
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                <p className="font-mono text-sm">{debugResult}</p>
              </div>
            )}
          </div>
        </Card>

        {/* System Info */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">System Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-slate-700">Current Date:</span>
              <span className="ml-2 text-slate-600">{new Date().toLocaleDateString()}</span>
            </div>
            <div>
              <span className="font-medium text-slate-700">Environment:</span>
              <span className="ml-2 text-slate-600">Development</span>
            </div>
            <div>
              <span className="font-medium text-slate-700">API Status:</span>
              <span className="ml-2 text-green-600">Active</span>
            </div>
            <div>
              <span className="font-medium text-slate-700">Admin User:</span>
              <span className="ml-2 text-slate-600">Authenticated</span>
            </div>
          </div>
        </Card>

        {/* SharpSports Integration */}
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">SharpSports Integration</h3>
              <p className="text-slate-600 mb-4">
                Manage SharpSports bettors, accounts, and sync bets from the SharpSports platform.
              </p>
            </div>

            {/* Fetch Bettors - No inputs required */}
            <div className="border-b border-slate-200 pb-4">
              <h4 className="text-md font-medium text-slate-900 mb-2">1. Fetch All Bettors</h4>
              <p className="text-sm text-slate-600 mb-3">Get list of all bettors from SharpSports API and save bettor accounts to database.</p>
              
              <Button
                onClick={handleFetchBettors}
                disabled={isFetchingBettors}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isFetchingBettors ? 'animate-spin' : ''}`} />
                {isFetchingBettors ? 'Fetching Bettors...' : 'Fetch All Bettors'}
              </Button>

              {bettorsResult && (
                <div className={`mt-3 p-3 rounded-lg ${
                  bettorsResult.startsWith('✅') 
                    ? 'bg-green-50 border border-green-200 text-green-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                  <p className="font-mono text-sm">{bettorsResult}</p>
                </div>
              )}
            </div>

            {/* Fetch Bettor Profiles - No inputs required */}
            <div className="border-b border-slate-200 pb-4">
              <h4 className="text-md font-medium text-slate-900 mb-2">2. Match Bettor Profiles</h4>
              <p className="text-sm text-slate-600 mb-3">Fetch bettor profiles and match them to user profiles by internal ID, updating sharpsports_bettor_id in profiles table.</p>
              
              <Button
                onClick={handleFetchBettorProfiles}
                disabled={isFetchingBettorProfiles}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isFetchingBettorProfiles ? 'animate-spin' : ''}`} />
                {isFetchingBettorProfiles ? 'Matching Profiles...' : 'Match Bettor Profiles'}
              </Button>

              {bettorProfilesResult && (
                <div className={`mt-3 p-3 rounded-lg ${
                  bettorProfilesResult.startsWith('✅') 
                    ? 'bg-green-50 border border-green-200 text-green-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                  <p className="font-mono text-sm">{bettorProfilesResult}</p>
                </div>
              )}
            </div>

            {/* Refresh User Bets */}
            <div className="border-b border-slate-200 pb-4">
              <h4 className="text-md font-medium text-slate-900 mb-2">3. Refresh User Bets</h4>
              <p className="text-sm text-slate-600 mb-3">Fetch all bets for a specific user from SharpSports and save them to the bets table. Requires user to have a matched bettor profile.</p>
              
              <div className="mb-3">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  User ID (UUID)
                </label>
                <input
                  type="text"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  placeholder="28991397-dae7-42e8-..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              
              <Button
                onClick={handleRefreshUserBets}
                disabled={isRefreshingUserBets || !targetUserId}
                className="bg-green-600 hover:bg-green-700"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshingUserBets ? 'animate-spin' : ''}`} />
                {isRefreshingUserBets ? 'Refreshing User Bets...' : 'Refresh User Bets'}
              </Button>

              {userBetsResult && (
                <div className={`mt-3 p-3 rounded-lg ${
                  userBetsResult.startsWith('✅') 
                    ? 'bg-green-50 border border-green-200 text-green-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                  <p className="font-mono text-sm">{userBetsResult}</p>
                </div>
              )}
            </div>

            {/* Input fields for Bettor/Profile specific operations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  SharpSports Bettor ID
                </label>
                <input
                  type="text"
                  value={sharpSportsBettorId}
                  onChange={(e) => setSharpSportsBettorId(e.target.value)}
                  placeholder="BTTR_..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Profile ID (UUID)
                </label>
                <input
                  type="text"
                  value={sharpSportsProfileId}
                  onChange={(e) => setSharpSportsProfileId(e.target.value)}
                  placeholder="28991397-dae7-42e8-..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Bettor-specific operations */}
            <div className="border-t border-slate-200 pt-4">
              <h4 className="text-md font-medium text-slate-900 mb-2">4. Legacy Bettor Operations</h4>
              <p className="text-sm text-slate-600 mb-3">Manual operations requiring specific Bettor ID and Profile ID. Use step 3 above for automatic user-based operations.</p>
              
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <Button
                  onClick={handleFetchAccounts}
                  disabled={isFetchingAccounts || !sharpSportsBettorId || !sharpSportsProfileId}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isFetchingAccounts ? 'animate-spin' : ''}`} />
                  {isFetchingAccounts ? 'Fetching Accounts...' : 'Fetch Bettor Accounts'}
                </Button>

                <Button
                  onClick={handleRefreshBets}
                  disabled={isRefreshingBets || !sharpSportsBettorId || !sharpSportsProfileId}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshingBets ? 'animate-spin' : ''}`} />
                  {isRefreshingBets ? 'Refreshing Bets...' : 'Refresh Bets'}
                </Button>
              </div>
            </div>

            {/* Results */}
            {accountsResult && (
              <div className={`p-4 rounded-lg ${
                accountsResult.startsWith('✅') 
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                <h4 className="font-medium mb-2">Accounts Result:</h4>
                <p className="font-mono text-sm">{accountsResult}</p>
              </div>
            )}

            {betsResult && (
              <div className={`p-4 rounded-lg ${
                betsResult.startsWith('✅') 
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                <h4 className="font-medium mb-2">Bets Refresh Result:</h4>
                <p className="font-mono text-sm">{betsResult}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-start space-y-2">
              <div className="font-medium">View Logs</div>
              <div className="text-xs text-slate-500">Check browser console</div>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-start space-y-2">
              <div className="font-medium">Database Status</div>
              <div className="text-xs text-slate-500">Monitor connections</div>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-start space-y-2">
              <div className="font-medium">API Health</div>
              <div className="text-xs text-slate-500">Check external APIs</div>
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}