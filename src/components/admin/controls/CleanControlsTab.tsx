'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  RefreshCw, 
  Target, 
  Users, 
  User,
  Database,
  Zap
} from 'lucide-react'
import { TrueSharpBetSettlement } from './TrueSharpBetSettlement'

interface CleanControlsTabProps {
  className?: string
}

export function CleanControlsTab({ className }: CleanControlsTabProps) {
  // Odds Management State
  const [isFetching, setIsFetching] = useState(false)
  const [fetchResult, setFetchResult] = useState<string | null>(null)
  const [selectedSport, setSelectedSport] = useState<string>('ALL')

  // Bet Settlement State
  const [isSettling, setIsSettling] = useState(false)
  const [settleResult, setSettleResult] = useState<string | null>(null)

  // SharpSports State
  const [isFetchingBettors, setIsFetchingBettors] = useState(false)
  const [isFetchingBettorProfiles, setIsFetchingBettorProfiles] = useState(false)
  const [isRefreshingUserBets, setIsRefreshingUserBets] = useState(false)
  const [bettorsResult, setBettorsResult] = useState<string | null>(null)
  const [bettorProfilesResult, setBettorProfilesResult] = useState<string | null>(null)
  const [userBetsResult, setUserBetsResult] = useState<string | null>(null)
  const [targetUserId, setTargetUserId] = useState('')

  const handleFetchCurrentOdds = async () => {
    setIsFetching(true)
    setFetchResult(null)
    
    try {
      console.log('🎯 Starting odds fetch for all leagues...')
      
      const response = await fetch('/api/fetch-odds-dual-table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sport: 'ALL' })
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        setFetchResult(`✅ Successfully fetched odds for all leagues. ${data.message || ''}`)
      } else {
        setFetchResult(`❌ Error: ${data.error || 'Failed to fetch odds'}`)
      }
    } catch (error) {
      console.error('❌ Odds fetch error:', error)
      setFetchResult(`❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsFetching(false)
    }
  }

  const handleSettleBets = async () => {
    setIsSettling(true)
    setSettleResult(null)
    
    try {
      console.log('🏆 Starting bet settlement...')
      
      const response = await fetch('/api/settle-bets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        setSettleResult(`✅ Bet settlement completed. ${data.message || ''}`)
      } else {
        setSettleResult(`❌ Error: ${data.error || 'Failed to settle bets'}`)
      }
    } catch (error) {
      console.error('❌ Bet settlement error:', error)
      setSettleResult(`❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSettling(false)
    }
  }

  const handleFetchBettors = async () => {
    setIsFetchingBettors(true)
    setBettorsResult(null)
    
    try {
      const response = await fetch('/api/sharpsports/fetch-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        setBettorsResult(`✅ Successfully synced bettors. ${data.message || ''}`)
      } else {
        setBettorsResult(`❌ Error: ${data.error || 'Failed to sync bettors'}`)
      }
    } catch (error) {
      setBettorsResult(`❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsFetchingBettors(false)
    }
  }

  const handleFetchBettorProfiles = async () => {
    setIsFetchingBettorProfiles(true)
    setBettorProfilesResult(null)
    
    try {
      const response = await fetch('/api/sharpsports/fetch-bettor-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        setBettorProfilesResult(`✅ Successfully matched profiles. ${data.message || ''}`)
      } else {
        setBettorProfilesResult(`❌ Error: ${data.error || 'Failed to match profiles'}`)
      }
    } catch (error) {
      setBettorProfilesResult(`❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsFetchingBettorProfiles(false)
    }
  }

  const handleRefreshUserBets = async () => {
    if (!targetUserId.trim()) return
    
    setIsRefreshingUserBets(true)
    setUserBetsResult(null)
    
    try {
      const response = await fetch('/api/sharpsports/refresh-user-bets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUserId.trim() })
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        setUserBetsResult(`✅ Successfully refreshed user bets. ${data.message || ''}`)
      } else {
        setUserBetsResult(`❌ Error: ${data.error || 'Failed to refresh user bets'}`)
      }
    } catch (error) {
      setUserBetsResult(`❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsRefreshingUserBets(false)
    }
  }

  const ResultDisplay = ({ result }: { result: string | null }) => {
    if (!result) return null
    
    const isSuccess = result.startsWith('✅')
    return (
      <div
        className={`mt-4 rounded-lg border p-3 ${
          isSuccess
            ? 'border-green-200 bg-green-50 text-green-800'
            : 'border-red-200 bg-red-50 text-red-800'
        }`}
      >
        <p className="font-mono text-sm">{result}</p>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* TrueSharp Bet Settlement */}
      <TrueSharpBetSettlement />

      {/* Odds Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" />
            Odds Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Fetch current odds from all supported leagues and sportsbooks.
          </p>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Sport:</label>
              <Select value={selectedSport} onValueChange={setSelectedSport}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Sports</SelectItem>
                  <SelectItem value="MLB">MLB</SelectItem>
                  <SelectItem value="NBA">NBA</SelectItem>
                  <SelectItem value="WNBA">WNBA</SelectItem>
                  <SelectItem value="NFL">NFL</SelectItem>
                  <SelectItem value="NHL">NHL</SelectItem>
                  <SelectItem value="NCAAF">NCAAF</SelectItem>
                  <SelectItem value="NCAAB">NCAAB</SelectItem>
                  <SelectItem value="MLS">MLS</SelectItem>
                  <SelectItem value="UCL">UCL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button
              onClick={handleFetchCurrentOdds}
              disabled={isFetching}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              {isFetching ? 'Fetching Odds...' : 'Fetch Odds'}
            </Button>
          </div>

          <ResultDisplay result={fetchResult} />
        </CardContent>
      </Card>

      {/* Bet Settlement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-green-600" />
            Bet Settlement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Process completed games and settle pending bets.
          </p>
          
          <Button
            onClick={handleSettleBets}
            disabled={isSettling}
            className="bg-green-600 hover:bg-green-700"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isSettling ? 'animate-spin' : ''}`} />
            {isSettling ? 'Settling Bets...' : 'Settle Bets'}
          </Button>

          <ResultDisplay result={settleResult} />
        </CardContent>
      </Card>

      {/* SharpSports Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-600" />
            SharpSports Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-6 text-sm text-gray-600">
            Sync data with SharpSports API including bettors, profiles, and user bets.
          </p>
          
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Sync Bettors */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <h4 className="font-medium">Sync Bettors</h4>
              </div>
              <p className="text-xs text-gray-500">
                Fetch all bettors from SharpSports API
              </p>
              <Button
                onClick={handleFetchBettors}
                disabled={isFetchingBettors}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                <RefreshCw className={`mr-2 h-3 w-3 ${isFetchingBettors ? 'animate-spin' : ''}`} />
                {isFetchingBettors ? 'Syncing...' : 'Sync Bettors'}
              </Button>
              <ResultDisplay result={bettorsResult} />
            </div>

            {/* Match Profiles */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-purple-600" />
                <h4 className="font-medium">Match Profiles</h4>
              </div>
              <p className="text-xs text-gray-500">
                Match bettor profiles to platform users
              </p>
              <Button
                onClick={handleFetchBettorProfiles}
                disabled={isFetchingBettorProfiles}
                className="w-full bg-purple-600 hover:bg-purple-700"
                size="sm"
              >
                <RefreshCw className={`mr-2 h-3 w-3 ${isFetchingBettorProfiles ? 'animate-spin' : ''}`} />
                {isFetchingBettorProfiles ? 'Matching...' : 'Match Profiles'}
              </Button>
              <ResultDisplay result={bettorProfilesResult} />
            </div>

            {/* Refresh User Bets */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-green-600" />
                <h4 className="font-medium">Refresh User Bets</h4>
              </div>
              <p className="text-xs text-gray-500">
                Update bets data for specific user
              </p>
              <Input
                type="text"
                value={targetUserId}
                onChange={e => setTargetUserId(e.target.value)}
                placeholder="User ID (UUID)"
                className="text-sm"
              />
              <Button
                onClick={handleRefreshUserBets}
                disabled={isRefreshingUserBets || !targetUserId.trim()}
                className="w-full bg-green-600 hover:bg-green-700"
                size="sm"
              >
                <RefreshCw className={`mr-2 h-3 w-3 ${isRefreshingUserBets ? 'animate-spin' : ''}`} />
                {isRefreshingUserBets ? 'Refreshing...' : 'Refresh Bets'}
              </Button>
              <ResultDisplay result={userBetsResult} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}