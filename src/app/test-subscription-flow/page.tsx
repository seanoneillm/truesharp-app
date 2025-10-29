'use client'

import { useState } from 'react'

interface TestResult {
  test_timestamp: string
  test_results: {
    environment_variables: any
    database_structure: any
    apple_endpoints: any
    authentication: any
  }
  summary: {
    ready_for_testing: boolean
    critical_issues: string[]
  }
}

export default function TestSubscriptionFlowPage() {
  const [testResults, setTestResults] = useState<TestResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runBasicTests = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/test-apple-subscription-flow')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Test failed')
      }
      
      setTestResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const runSpecificTest = async (testType: string, testData: any = {}) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/test-apple-subscription-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testType,
          testData
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Test failed')
      }
      
      setTestResults(prev => prev ? {
        ...prev,
        test_results: {
          ...prev.test_results,
          [testType]: data
        }
      } : null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const testReceiptValidationEndpoint = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Test the actual receipt validation endpoint with mock data
      const response = await fetch('/api/validate-apple-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'test-user-id',
          productId: 'pro_subscription_month',
          receiptData: 'mock_receipt_data_for_testing',
          transactionId: 'mock_transaction_id',
          environment: 'sandbox'
        })
      })
      
      const data = await response.json()
      
      setTestResults(prev => prev ? {
        ...prev,
        test_results: {
          ...prev.test_results,
          receipt_endpoint_test: {
            status: response.status,
            response: data,
            endpoint_reachable: true,
            expected_auth_error: response.status === 401
          }
        }
      } : null)
    } catch (err) {
      setError(`Receipt endpoint test failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            🧪 Subscribe to Pro Flow Testing
          </h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">Test Controls</h2>
              
              <button
                onClick={runBasicTests}
                disabled={loading}
                className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Running Tests...' : '🔍 Run Basic Infrastructure Tests'}
              </button>
              
              <button
                onClick={() => runSpecificTest('mock_receipt_validation')}
                disabled={loading}
                className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🍎 Test Apple Receipt Validation
              </button>
              
              <button
                onClick={() => runSpecificTest('database_subscription_creation')}
                disabled={loading}
                className="w-full bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🗄️ Test Database Structure
              </button>
              
              <button
                onClick={testReceiptValidationEndpoint}
                disabled={loading}
                className="w-full bg-orange-600 text-white px-4 py-3 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🔗 Test Receipt Validation Endpoint
              </button>
            </div>
            
            <div className="lg:col-span-2">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Test Results</h2>
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <h3 className="text-red-800 font-semibold">❌ Error</h3>
                  <p className="text-red-700">{error}</p>
                </div>
              )}
              
              {testResults && (
                <div className="space-y-6">
                  {/* Summary */}
                  <div className={`border rounded-lg p-4 ${
                    testResults.summary.ready_for_testing 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <h3 className="font-semibold mb-2">
                      {testResults.summary.ready_for_testing ? '✅ Ready for Testing' : '❌ Issues Found'}
                    </h3>
                    {testResults.summary.critical_issues.length > 0 && (
                      <ul className="list-disc list-inside text-sm">
                        {testResults.summary.critical_issues.map((issue, idx) => (
                          <li key={idx} className="text-red-700">{issue}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  
                  {/* Environment Variables */}
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">🔑 Environment Variables</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span>Apple Shared Secret:</span>
                        <span className={testResults.test_results.environment_variables.apple_shared_secret ? 'text-green-600' : 'text-red-600'}>
                          {testResults.test_results.environment_variables.apple_shared_secret ? '✅' : '❌'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Supabase Service Key:</span>
                        <span className={testResults.test_results.environment_variables.supabase_service_key ? 'text-green-600' : 'text-red-600'}>
                          {testResults.test_results.environment_variables.supabase_service_key ? '✅' : '❌'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Database Structure */}
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">🗄️ Database Structure</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span>Database Connected:</span>
                        <span className={testResults.test_results.database_structure.database_connected ? 'text-green-600' : 'text-red-600'}>
                          {testResults.test_results.database_structure.database_connected ? '✅' : '❌'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Apple Transaction ID Column:</span>
                        <span className={testResults.test_results.database_structure.has_apple_transaction_id ? 'text-green-600' : 'text-red-600'}>
                          {testResults.test_results.database_structure.has_apple_transaction_id ? '✅' : '❌'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Apple Endpoints */}
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">🍎 Apple Endpoints</h3>
                    <div className="text-sm">
                      <div className="flex justify-between">
                        <span>Sandbox Reachable:</span>
                        <span className={testResults.test_results.apple_endpoints.sandbox_reachable ? 'text-green-600' : 'text-red-600'}>
                          {testResults.test_results.apple_endpoints.sandbox_reachable ? '✅' : '❌'}
                        </span>
                      </div>
                      {testResults.test_results.apple_endpoints.sandbox_status && (
                        <div className="text-xs text-gray-600 mt-1">
                          Sandbox Status: {testResults.test_results.apple_endpoints.sandbox_status}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Raw Results */}
                  <details className="border rounded-lg p-4">
                    <summary className="font-semibold cursor-pointer">🔍 Raw Test Results</summary>
                    <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto">
                      {JSON.stringify(testResults, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">📋 Testing Instructions</h3>
            <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
              <li>Run <strong>Basic Infrastructure Tests</strong> first to verify environment setup</li>
              <li>Test <strong>Apple Receipt Validation</strong> to ensure Apple endpoints are reachable</li>
              <li>Test <strong>Database Structure</strong> to verify subscription table is properly configured</li>
              <li>Test <strong>Receipt Validation Endpoint</strong> to check authentication flow</li>
              <li>For end-to-end testing, use the iOS app with TestFlight build</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}