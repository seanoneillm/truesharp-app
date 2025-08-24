'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useState } from 'react'

export default function SupabaseTestPage() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testSupabaseConnection = async () => {
    setLoading(true)
    setResult('')
    
    try {
      console.log('🧪 Testing Supabase connection...')
      
      // Create client with direct env vars
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      console.log('🧪 Supabase client created')
      console.log('🧪 URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
      console.log('🧪 Key (first 20 chars):', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20))

      // Test 1: Check if client exists
      if (!supabase) {
        setResult('❌ Supabase client not created')
        return
      }

      // Test 2: Try to get session (should work even without auth)
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('🧪 Session error:', sessionError)
        setResult(`❌ Session error: ${sessionError.message}`)
        return
      }

      console.log('🧪 Session check successful')

      // Test 3: Try to sign in with clearly string values
      const testEmail = 'test@example.com'
      const testPassword = 'testpassword123'
      
      console.log('🧪 Attempting sign in with:', {
        email: testEmail,
        emailType: typeof testEmail,
        password: '[REDACTED]',
        passwordType: typeof testPassword
      })

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      })

      if (authError) {
        console.error('🧪 Auth error:', authError)
        setResult(`Auth error: ${authError.message}`)
      } else {
        console.log('🧪 Auth successful:', authData)
        setResult('✅ Auth successful (this should not happen with fake credentials)')
      }

    } catch (error) {
      console.error('🧪 Catch error:', error)
      setResult(`❌ Catch error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
      
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
        <h2 className="font-semibold mb-2">Environment Check:</h2>
        <p><strong>URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL || '❌ Missing'}</p>
        <p><strong>Key:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Present' : '❌ Missing'}</p>
      </div>

      <button
        onClick={testSupabaseConnection}
        disabled={loading}
        className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Supabase Connection'}
      </button>

      {result && (
        <div className="mt-6 p-4 bg-gray-50 border rounded-lg">
          <h3 className="font-semibold mb-2">Result:</h3>
          <pre className="whitespace-pre-wrap text-sm">{result}</pre>
        </div>
      )}
    </div>
  )
}
