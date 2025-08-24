'use client'

import { createBrowserClient } from '@/lib/auth/supabase'
import { useAuth } from '@/lib/hooks/use-auth'
import { BarChart3 } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function AnalyticsDebug() {
  const { user } = useAuth()
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function debugAnalytics() {
      console.log('=== ANALYTICS DEBUG START ===')
      console.log('Auth user:', user)
      
      const debugData: any = {
        authUser: user ? { id: user.id, email: user.email } : null,
        timestamp: new Date().toISOString()
      }

      if (!user) {
        console.log('No user found')
        setDebugInfo({ ...debugData, error: 'No user authenticated' })
        setLoading(false)
        return
      }

      try {
        const supabase = createBrowserClient()
        console.log('Supabase client created')

        // Test 1: Basic connection
        const { data: testConnection, error: connectionError } = await supabase
          .from('bets')
          .select('count(*)')
          .limit(1)

        debugData.connectionTest = {
          error: connectionError?.message || null,
          success: !connectionError
        }

        console.log('Connection test:', debugData.connectionTest)

        // Test 2: User-specific query
        const { data: userBets, error: userBetsError } = await supabase
          .from('bets')
          .select('id, placed_at, status, profit')
          .eq('user_id', user.id)
          .limit(5)

        debugData.userBetsTest = {
          error: userBetsError?.message || null,
          count: userBets?.length || 0,
          sample: userBets || []
        }

        console.log('User bets test:', debugData.userBetsTest)

        // Test 3: 2024 settled bets
        const { data: settledBets, error: settledError } = await supabase
          .from('bets')
          .select('placed_at, stake, profit, status')
          .eq('user_id', user.id)
          .gte('placed_at', '2024-01-01T00:00:00Z')
          .lte('placed_at', '2024-12-31T23:59:59Z')
          .in('status', ['won', 'lost'])
          .order('placed_at', { ascending: true })

        debugData.settledBetsTest = {
          error: settledError?.message || null,
          count: settledBets?.length || 0,
          sample: settledBets?.slice(0, 3) || []
        }

        console.log('2024 settled bets test:', debugData.settledBetsTest)

        // Test 4: RLS check
        const { data: rlsTest, error: rlsError } = await supabase
          .rpc('auth.uid')

        debugData.rlsTest = {
          error: rlsError?.message || null,
          authUid: rlsTest || 'null'
        }

        console.log('RLS test:', debugData.rlsTest)

      } catch (err) {
        console.error('Debug error:', err)
        debugData.error = err instanceof Error ? err.message : 'Unknown error'
      }

      console.log('=== ANALYTICS DEBUG END ===')
      setDebugInfo(debugData)
      setLoading(false)
    }

    debugAnalytics()
  }, [user])

  if (loading) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="font-semibold text-yellow-800 mb-2">🔍 Analytics Debug - Loading...</h3>
        <p className="text-yellow-700">Analyzing authentication and data access...</p>
      </div>
    )
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 bg-blue-100 rounded-lg">
          <BarChart3 className="h-5 w-5 text-blue-600" />
        </div>
        <h3 className="font-semibold text-blue-800">🔍 Analytics Debug Info</h3>
      </div>

      <div className="space-y-4 text-sm">
        <div>
          <strong className="text-blue-800">Auth User:</strong>
          <pre className="bg-white p-2 rounded mt-1 text-xs overflow-auto">
            {JSON.stringify(debugInfo.authUser, null, 2)}
          </pre>
        </div>

        <div>
          <strong className="text-blue-800">Connection Test:</strong>
          <pre className="bg-white p-2 rounded mt-1 text-xs overflow-auto">
            {JSON.stringify(debugInfo.connectionTest, null, 2)}
          </pre>
        </div>

        <div>
          <strong className="text-blue-800">User Bets Test:</strong>
          <pre className="bg-white p-2 rounded mt-1 text-xs overflow-auto">
            {JSON.stringify(debugInfo.userBetsTest, null, 2)}
          </pre>
        </div>

        <div>
          <strong className="text-blue-800">2024 Settled Bets Test:</strong>
          <pre className="bg-white p-2 rounded mt-1 text-xs overflow-auto">
            {JSON.stringify(debugInfo.settledBetsTest, null, 2)}
          </pre>
        </div>

        <div>
          <strong className="text-blue-800">RLS Test:</strong>
          <pre className="bg-white p-2 rounded mt-1 text-xs overflow-auto">
            {JSON.stringify(debugInfo.rlsTest, null, 2)}
          </pre>
        </div>

        {debugInfo.error && (
          <div>
            <strong className="text-red-800">Error:</strong>
            <pre className="bg-red-50 p-2 rounded mt-1 text-xs overflow-auto text-red-700">
              {debugInfo.error}
            </pre>
          </div>
        )}

        <div className="text-xs text-blue-600">
          Timestamp: {debugInfo.timestamp}
        </div>
      </div>
    </div>
  )
}
