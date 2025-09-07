'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useState } from 'react'

export default function SubscriptionTestPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const testSubscription = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/debug/subscription-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategyId: "fee0e373-45ef-4ffd-b08a-4e546360f886",
          sellerId: "28991397-dae7-42e8-a822-0dffc6ff49b7"
        })
      })
      
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="mx-auto max-w-4xl p-6">
        <h1 className="mb-4 text-xl font-bold">Debug: Subscription Test</h1>
        <p className="mb-4 text-sm text-gray-600">
          This will test what the subscribe API sees for seanoneill715's strategy.
          Must be logged in as derek.shorter (buyer).
        </p>
        
        <Button 
          onClick={testSubscription} 
          disabled={loading}
          className="mb-4"
        >
          {loading ? 'Testing...' : 'Test Subscription Data'}
        </Button>
        
        {result && (
          <div className="mt-4 rounded bg-gray-100 p-4">
            <h3 className="mb-2 font-semibold">Result:</h3>
            <pre className="text-xs overflow-auto">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </Card>
    </div>
  )
}