'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useState } from 'react'

export default function TestAuthPage() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)
  
  const supabase = createClientComponentClient()

  const testSignIn = async () => {
    setLoading(true)
    setResult('')
    
    try {
      console.log('🧪 Testing Supabase auth...')
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'testpassword123'
      })
      
      if (error) {
        console.error('🧪 Auth error:', error)
        setResult(`Error: ${error.message}`)
      } else {
        console.log('🧪 Auth success:', data)
        setResult('Success!')
      }
    } catch (error) {
      console.error('🧪 Catch error:', error)
      setResult(`Catch error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Auth Test</h1>
      <button
        onClick={testSignIn}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        {loading ? 'Testing...' : 'Test Sign In'}
      </button>
      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <pre>{result}</pre>
        </div>
      )}
    </div>
  )
}
