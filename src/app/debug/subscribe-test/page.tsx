'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useState } from 'react'

export default function SubscribeTestPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const testSubscribeDebug = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/debug/subscribe-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategyId: "fee0e373-45ef-4ffd-b08a-4e546360f886",
          sellerId: "28991397-dae7-42e8-a822-0dffc6ff49b7", // seanoneill715's user ID
          frequency: "monthly"
        })
      })
      
      const data = await response.json()
      setResult({ status: response.status, data })
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  const testSubscribeReal = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategyId: "fee0e373-45ef-4ffd-b08a-4e546360f886",
          sellerId: "28991397-dae7-42e8-a822-0dffc6ff49b7", // seanoneill715's user ID
          frequency: "monthly"
        })
      })
      
      const data = await response.json()
      setResult({ status: response.status, data })
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="mx-auto max-w-4xl p-6">
        <h1 className="mb-4 text-xl font-bold">Debug: Subscribe Request Test</h1>
        <p className="mb-4 text-sm text-gray-600">
          Test the subscribe API with known good data. Must be logged in as derekshorter (buyer).
        </p>
        
        <div className="space-x-4 mb-4">
          <Button 
            onClick={testSubscribeDebug} 
            disabled={loading}
            variant="outline"
          >
            {loading ? 'Testing...' : 'Test Debug API'}
          </Button>
          
          <Button 
            onClick={testSubscribeReal} 
            disabled={loading}
          >
            {loading ? 'Testing...' : 'Test Real Subscribe API'}
          </Button>
        </div>
        
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