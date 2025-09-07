'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useState } from 'react'

export default function StripeSetupDebugPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string>('')

  const createStripeAccount = async () => {
    setLoading(true)
    setResult('')
    
    try {
      const response = await fetch('/api/debug/create-stripe-account', {
        method: 'POST',
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setResult(`Success! Onboarding URL: ${data.onboarding_url}`)
        // Redirect to onboarding
        if (data.onboarding_url) {
          window.location.href = data.onboarding_url
        }
      } else {
        setResult(`Error: ${data.error} - ${data.details || ''}`)
      }
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="mx-auto max-w-lg p-6">
        <h1 className="mb-4 text-xl font-bold">Debug: Stripe Connect Setup</h1>
        <p className="mb-4 text-sm text-gray-600">
          This page helps sellers complete their Stripe Connect onboarding if they missed it.
        </p>
        
        <Button 
          onClick={createStripeAccount} 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Creating Account...' : 'Create Stripe Connect Account'}
        </Button>
        
        {result && (
          <div className="mt-4 rounded bg-gray-100 p-3">
            <pre className="text-xs">{result}</pre>
          </div>
        )}
      </Card>
    </div>
  )
}