'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useState } from 'react'

export default function FixSellerAccountPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const fixAccount = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/debug/fix-missing-seller-account', {
        method: 'POST'
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
        <h1 className="mb-4 text-xl font-bold">Fix: Missing Seller Account Record</h1>
        <p className="mb-4 text-sm text-gray-600">
          This will create the missing database record for seanoneill715's Stripe Connect account.
        </p>
        
        <Button 
          onClick={fixAccount} 
          disabled={loading}
          className="mb-4"
        >
          {loading ? 'Fixing...' : 'Fix Missing Seller Account'}
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