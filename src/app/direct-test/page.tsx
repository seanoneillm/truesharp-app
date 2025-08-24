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
        password: 'password123'
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
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Direct JS Test</h1>
      <p className="mb-4 text-gray-600">
        This test uses plain JavaScript with literal values.
      </p>
      
      <button
        onClick={handleDirectTest}
        className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600"
      >
        Test Direct JS
      </button>

      <div id="result" className="mt-6 p-4 bg-gray-50 border rounded-lg min-h-[50px]">
        Results will appear here...
      </div>
    </div>
  )
}
