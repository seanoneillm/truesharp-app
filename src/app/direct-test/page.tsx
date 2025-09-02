'use client'

import { createClient } from '@supabase/supabase-js'

export default function DirectJSTestPage() {
  const handleDirectTest = async () => {
    try {
      console.log('🧪 Direct JS test starting...')

      // Create client
      const supabase = createClient(
        'https://trsogafrxpptszxydycn.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyc29nYWZyeHBwdHN6eHlkeWNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MjQ0OTQsImV4cCI6MjA2NjMwMDQ5NH0.STgM-_-9tTwI-Tr-gajQnfsA9cEZplw7W5uPWmn-SwA'
      )

      // Completely literal string values
      const result = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123',
      })

      console.log('🧪 Direct result:', result)

      const resultDiv = document.getElementById('result')
      if (resultDiv) {
        resultDiv.textContent = result.error ? `Error: ${result.error.message}` : 'Success!'
      }
    } catch (error) {
      console.error('🧪 Direct error:', error)
      const resultDiv = document.getElementById('result')
      if (resultDiv) {
        resultDiv.textContent = `Catch: ${error}`
      }
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="mb-4 text-2xl font-bold">Direct JS Test</h1>
      <p className="mb-4 text-gray-600">This test uses plain JavaScript with literal values.</p>

      <button
        onClick={handleDirectTest}
        className="rounded-lg bg-green-500 px-6 py-3 text-white hover:bg-green-600"
      >
        Test Direct JS
      </button>

      <div id="result" className="mt-6 min-h-[50px] rounded-lg border bg-gray-50 p-4">
        Results will appear here...
      </div>
    </div>
  )
}
