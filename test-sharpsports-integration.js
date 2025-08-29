#!/usr/bin/env node

// Simple test script for SharpSports integration
// Run with: node test-sharpsports-integration.js

const BASE_URL = 'http://localhost:3000' // Adjust for your dev server
const TEST_USER_ID = '28991397-dae7-42e8-a822-0dffc6ff49b7' // Use your test user ID

async function testEndpoint(method, endpoint, body = null) {
  console.log(`\n🔄 Testing ${method} ${endpoint}`)
  
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    }
    
    if (body) {
      options.body = JSON.stringify(body)
    }
    
    const response = await fetch(`${BASE_URL}${endpoint}`, options)
    const data = await response.text()
    
    console.log(`Status: ${response.status}`)
    console.log(`Response: ${data.substring(0, 500)}${data.length > 500 ? '...' : ''}`)
    
    return { status: response.status, data: data }
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`)
    return { error: error.message }
  }
}

async function runTests() {
  console.log('🧪 Testing SharpSports Integration Endpoints\n')
  console.log(`Base URL: ${BASE_URL}`)
  console.log(`Test User: ${TEST_USER_ID}\n`)
  
  // Test 1: Get linked accounts (should be empty initially)
  await testEndpoint('GET', `/api/sharpsports/accounts?userId=${TEST_USER_ID}`)
  
  // Test 2: Try to refresh accounts (should handle empty accounts gracefully)
  await testEndpoint('POST', '/api/sharpsports/refresh', { userId: TEST_USER_ID })
  
  // Test 3: Try manual sync (should handle empty accounts gracefully)  
  await testEndpoint('POST', '/api/sharpsports/sync', { userId: TEST_USER_ID })
  
  // Test 4: Test webhook endpoint (should return 400 for invalid data)
  await testEndpoint('POST', '/api/sharpsports/webhook', { invalid: 'data' })
  
  // Test 5: Test webhook with valid structure
  await testEndpoint('POST', '/api/sharpsports/webhook', {
    event: 'test.event',
    data: { id: 'test-id', status: 'test' }
  })
  
  // Test 6: Test storing a mock bettor account
  const mockBettorAccount = {
    userId: TEST_USER_ID,
    bettorAccount: {
      id: 'test-account-123',
      bettorId: 'test-bettor-456',
      book: {
        id: 'test-book-789',
        name: 'Test Sportsbook',
        abbr: 'TEST'
      },
      region: {
        id: 'test-region-101',
        name: 'Test Region',
        abbr: 'TR'
      },
      balance: '1000.00',
      verified: true,
      access: true,
      paused: false
    }
  }
  
  await testEndpoint('POST', '/api/sharpsports/accounts', mockBettorAccount)
  
  // Test 7: Get accounts again (should now show the test account)
  await testEndpoint('GET', `/api/sharpsports/accounts?userId=${TEST_USER_ID}`)
  
  console.log('\n✅ Test suite completed!')
  console.log('\nNext steps:')
  console.log('1. Add SHARPSPORTS_API_KEY to your .env.local file')
  console.log('2. Configure SharpSports webhooks to point to your app')
  console.log('3. Test with real SharpSports Booklink UI')
  console.log('4. Monitor logs during account linking and refresh')
}

// Run the tests
runTests().catch(console.error)