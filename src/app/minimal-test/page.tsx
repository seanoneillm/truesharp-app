'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useState } from 'react'

export default function MinimalAuthTestPage() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testMinimalAuth = async () => {
    setLoading(true)
    setResult('')
    
    try {
      console.log('🧪 Starting minimal auth test...')
      
      // Create client directly with hardcoded values
      const supabase = createBrowserClient(
        'https://trsogafrxpptszxydycn.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyc29nYWZyeHBwdHN6eHlkeWNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MjQ0OTQsImV4cCI6MjA2NjMwMDQ5NH0.STgM-_-9tTwI-Tr-gajQnfsA9cEZplw7W5uPWmn-SwA'
      )

      // Hardcoded string values - no variables, no state, no form data
      const testEmail = 'test@example.com'
      const testPassword = 'password123'
      
      console.log('🧪 Using hardcoded values:', {
        email: testEmail,
        emailType: typeof testEmail,
        emailConstructor: testEmail.constructor.name,
        password: '[REDACTED]',
        passwordType: typeof testPassword,
        passwordConstructor: testPassword.constructor.name
      })

      // Direct object creation with explicit string values
      const authRequest = {
        email: testEmail,
        password: testPassword
      }

      console.log('🧪 Auth request object:', {
        email: authRequest.email,
        emailType: typeof authRequest.email,
        password: '[REDACTED]',
        passwordType: typeof authRequest.password,
        objectKeys: Object.keys(authRequest),
        objectValues: Object.values(authRequest).map(v => typeof v)
      })

      console.log('🧪 About to call signInWithPassword...')
      
      const { data, error } = await supabase.auth.signInWithPassword(authRequest)

      console.log('🧪 Response received:', {
        hasData: !!data,
        hasError: !!error,
        errorMessage: error?.message
      })

      if (error) {
        setResult(`❌ Error: ${error.message}`)
      } else {
        setResult(`✅ Success! User: ${data.user?.email || 'Unknown'}`)
      }

    } catch (error) {
      console.error('🧪 Catch error:', error)
      setResult(`❌ Catch: ${String(error)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Minimal Auth Test</h1>
      <p className="mb-4 text-gray-600">
        This test uses hardcoded string values directly to bypass any form data issues.
      </p>
      
      <button
        onClick={testMinimalAuth}
        disabled={loading}
        className="bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Minimal Auth'}
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
