// Quick test to check if the strategy update API is working
// Run this with: node test-strategy-update.js

const fetch = require('node-fetch');

async function testStrategyUpdate() {
  try {
    console.log('Testing strategy update API endpoint...');
    
    // Test if the API endpoint is reachable
    const response = await fetch('http://localhost:3000/api/strategies', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 'test-strategy-id',
        monetized: true,
        pricing_weekly: 25
      })
    });
    
    const result = await response.text();
    console.log('Response status:', response.status);
    console.log('Response body:', result);
    
    if (response.status === 401) {
      console.log('✅ API endpoint is working (401 Unauthorized is expected without auth)');
    } else {
      console.log('❌ Unexpected response');
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

testStrategyUpdate();
