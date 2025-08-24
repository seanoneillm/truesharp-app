'use client'

import { createClient } from '@supabase/supabase-js'

// Standalone auth function that doesn't use React state or hooks
async function testStandaloneAuth() {
  try {
    console.log('🧪 Standalone auth test...')
    
    // Direct client creation
    const supabase = createClient(
      'https://trsogafrxpptszxydycn.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyc29nYWZyeHBwdHN6eHlkeWNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MjQ0OTQsImV4cCI6MjA2NjMwMDQ5NH0.STgM-_-9tTwI-Tr-gajQnfsA9cEZplw7W5uPWmn-SwA'
    )

    console.log('🧪 Client created, testing auth...')

    // Test authentication with literal values
    const response = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'password123'
    })

    console.log('🧪 Auth response:', response)
    return response

  } catch (error) {
    console.error('🧪 Standalone auth error:', error)
    throw error
  }
}

export default function StandaloneTestPage() {
  const handleTest = () => {
    testStandaloneAuth()
      .then(result => {
        const output = document.getElementById('output')
        if (output) {
          output.innerHTML = `
            <h3>Success!</h3>
            <pre>${JSON.stringify(result, null, 2)}</pre>
          `
        }
      })
      .catch(error => {
        const output = document.getElementById('output')
        if (output) {
          output.innerHTML = `
            <h3>Error:</h3>
            <pre>${String(error)}</pre>
          `
        }
      })
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Standalone Auth Test</h1>
      <p className="mb-4 text-gray-600">
        This test uses a standalone function without React hooks or state.
      </p>
      
      <button
        onClick={handleTest}
        className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600"
      >
        Test Standalone Auth
      </button>

      <div id="output" className="mt-6 p-4 bg-gray-50 border rounded-lg min-h-[100px]">
        Results will appear here...
      </div>
    </div>
  )
}
