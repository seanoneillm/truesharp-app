'use client'

import { useAuth } from '@/lib/hooks/use-auth'
import { createBrowserClient } from '@/lib/auth/supabase'
import { useState } from 'react'

export default function DebugStrategies() {
  const { user, loading } = useAuth()
  const [testResults, setTestResults] = useState<any>(null)

  const runTests = async () => {
    const supabase = createBrowserClient()
    const results: any = {}

    try {
      // Test 1: Check auth
      const { data: authData, error: authError } = await supabase.auth.getUser()
      results.auth = { data: authData, error: authError }

      // Test 2: Simple query
      const { data: strategiesData, error: strategiesError } = await supabase
        .from('strategies')
        .select('id, name')
        .limit(5)
      results.strategies = { data: strategiesData, error: strategiesError }

      // Test 3: User-specific query
      if (user?.id) {
        const { data: userStrategies, error: userError } = await supabase
          .from('strategies')
          .select('id, name, user_id')
          .eq('user_id', user.id)
        results.userStrategies = { data: userStrategies, error: userError }
      }

      // Test 4: Leaderboard query
      const { data: leaderboardData, error: leaderboardError } = await supabase
        .from('strategy_leaderboard')
        .select('id, strategy_id')
        .limit(5)
      results.leaderboard = { data: leaderboardData, error: leaderboardError }

      setTestResults(results)
    } catch (error) {
      setTestResults({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
  }

  if (loading) return <div>Loading auth...</div>

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Strategies</h1>
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold">User Info:</h2>
        <pre className="bg-gray-100 p-2 rounded text-sm">
          {JSON.stringify({ user, loading }, null, 2)}
        </pre>
      </div>

      <button 
        onClick={runTests}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
      >
        Run Supabase Tests
      </button>

      {testResults && (
        <div>
          <h2 className="text-lg font-semibold">Test Results:</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto max-h-96">
            {JSON.stringify(testResults, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}