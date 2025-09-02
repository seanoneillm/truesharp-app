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
        password: 'testpassword123',
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
      <h1 className="mb-4 text-2xl font-bold">Auth Test</h1>
      <button
        onClick={testSignIn}
        disabled={loading}
        className="rounded bg-blue-500 px-4 py-2 text-white"
      >
        {loading ? 'Testing...' : 'Test Sign In'}
      </button>
      {result && (
        <div className="mt-4 rounded bg-gray-100 p-4">
          <pre>{result}</pre>
        </div>
      )}
    </div>
  )
}
