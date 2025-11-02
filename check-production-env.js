#!/usr/bin/env node

/**
 * Check which environment variables are missing in production
 */

async function checkProductionEnvironment() {
  console.log('🔍 Checking production environment variables...\n');
  
  try {
    const response = await fetch('https://truesharp.io/api/validate-apple-transaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid-token-for-env-check'
      },
      body: JSON.stringify({
        userId: 'test',
        transactionId: 'test',
        originalTransactionId: 'test', 
        productId: 'test',
        environment: 'sandbox'
      })
    });
    
    const result = await response.text();
    console.log('📊 Status:', response.status);
    console.log('📄 Response:', result);
    
    if (result.includes('Failed to generate App Store API token')) {
      console.log('\n❌ ISSUE: Apple API token generation failing in production');
      console.log('\n🔧 This means one or more of these environment variables are missing:');
      console.log('- APPLE_API_KEY_ID');
      console.log('- APPLE_ISSUER_ID'); 
      console.log('- APPLE_PRIVATE_KEY');
      console.log('- APPLE_BUNDLE_ID');
      console.log('\n💡 Solution: Update production environment variables in Vercel/deployment platform');
    } else if (result.includes('Authentication required')) {
      console.log('\n✅ Apple API keys are configured correctly');
      console.log('❌ But Bearer token authentication is still broken');
    } else {
      console.log('\n📊 Unexpected response - need further investigation');
    }
    
  } catch (error) {
    console.error('❌ Environment check failed:', error);
  }
}

// Global fetch polyfill
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

checkProductionEnvironment();