#!/usr/bin/env node

/**
 * Test Individual Apple API Key Components in Production
 */

async function testIndividualAppleKeys() {
  console.log('🔍 Testing Individual Apple API Key Components in Production\n');
  
  const tests = [
    {
      name: 'APPLE_API_KEY_ID',
      test: { keyId: 'test' }
    },
    {
      name: 'APPLE_ISSUER_ID', 
      test: { issuerId: 'test' }
    },
    {
      name: 'APPLE_BUNDLE_ID',
      test: { bundleId: 'test' }
    },
    {
      name: 'APPLE_PRIVATE_KEY',
      test: { privateKey: 'test' }
    },
    {
      name: 'All Keys Present',
      test: { 
        keyId: 'DX4XSJW2XV',
        issuerId: 'bfd9cd55-a018-4093-a4e3-7a41f1ea399c',
        bundleId: 'com.truesharp.app',
        privateKey: 'test-key'
      }
    }
  ];
  
  for (const testCase of tests) {
    console.log(`🧪 Testing: ${testCase.name}`);
    
    try {
      const response = await fetch('https://truesharp.io/api/validate-apple-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token-for-env-check'
        },
        body: JSON.stringify({
          userId: 'test',
          transactionId: 'test',
          originalTransactionId: 'test',
          productId: 'test',
          environment: 'sandbox',
          debugKeys: testCase.test
        })
      });
      
      const result = await response.text();
      console.log(`   Status: ${response.status}`);
      
      if (result.includes('Failed to generate App Store API token')) {
        console.log(`   ❌ Apple API token generation failed`);
        
        if (result.includes('Missing') || result.includes('undefined')) {
          console.log(`   🔍 Likely missing environment variable: ${testCase.name}`);
        }
      } else if (result.includes('Authentication required')) {
        console.log(`   ✅ Apple keys working (auth error expected)`);
      } else {
        console.log(`   📄 Response: ${result.substring(0, 100)}...`);
      }
      
    } catch (error) {
      console.log(`   ❌ Test failed: ${error.message}`);
    }
    
    console.log('');
  }
  
  // Final comprehensive test with real values
  console.log('🎯 Final Test: Complete Apple JWT Generation');
  try {
    const response = await fetch('https://truesharp.io/api/validate-apple-transaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token-comprehensive'
      },
      body: JSON.stringify({
        userId: 'test-comprehensive',
        transactionId: 'test_comprehensive_transaction',
        originalTransactionId: 'test_comprehensive_original',
        productId: 'pro_subscription_month',
        environment: 'sandbox'
      })
    });
    
    const result = await response.text();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${result}`);
    
    if (response.status === 401) {
      console.log('   ❌ User authentication failed (expected with test token)');
    } else if (result.includes('Failed to generate App Store API token')) {
      console.log('   ❌ Apple API token generation still failing');
      console.log('   🔧 Check Vercel environment variables are deployed correctly');
    } else if (result.includes('not found in any environment')) {
      console.log('   ✅ SUCCESS: Apple JWT generation working!');
      console.log('   ✅ Apple API authentication successful');
    } else {
      console.log('   🤔 Unexpected response - needs investigation');
    }
    
  } catch (error) {
    console.error('   ❌ Comprehensive test failed:', error);
  }
}

// Global fetch polyfill
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

testIndividualAppleKeys().catch(console.error);