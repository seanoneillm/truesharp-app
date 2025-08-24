'use client'

import { useState } from 'react'

export default function RawSupabaseTestPage() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testRawFetch = async () => {
    setLoading(true)
    setResult('')
    
    try {
      console.log('🧪 Testing raw fetch to Supabase...')
      
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!supabaseUrl || !supabaseKey) {
        setResult('❌ Missing environment variables')
        return
      }

      // Test raw HTTP request to Supabase auth endpoint
      const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'testpassword123'
        })
      })

      console.log('🧪 Response status:', response.status)
      console.log('🧪 Response headers:', Object.fromEntries(response.headers.entries()))

      const responseText = await response.text()
      console.log('🧪 Response body:', responseText)

      if (!response.ok) {
        setResult(`❌ HTTP ${response.status}: ${responseText}`)
      } else {
        setResult(`✅ HTTP ${response.status}: ${responseText}`)
      }

    } catch (error) {
      console.error('🧪 Raw fetch error:', error)
      setResult(`❌ Fetch error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Raw Supabase Auth Test</h1>
      
      <button
        onClick={testRawFetch}
        disabled={loading}
        className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Raw HTTP Request'}
      </button>

      {result && (
        <div className="mt-6 p-4 bg-gray-50 border rounded-lg">
          <h3 className="font-semibold mb-2">Result:</h3>
          <pre className="whitespace-pre-wrap text-sm max-h-96 overflow-auto">{result}</pre>
        </div>
      )}
    </div>
  )
}
