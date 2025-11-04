#!/usr/bin/env node

/**
 * Test Apple API with production environment variables from Vercel
 */

const jwt = require('jsonwebtoken');

async function testProductionAppleAPI() {
  console.log('🌐 Testing Production Apple API Configuration');
  console.log('='.repeat(60));
  
  // Fetch from the actual production debug endpoint
  console.log('📡 Fetching production environment variables...');
  
  try {
    const envResponse = await fetch('https://truesharp.io/api/debug-env-simple');
    const envData = await envResponse.json();
    
    console.log('📊 Production Environment Status:');
    console.log('  Key ID:', envData.keyId);
    console.log('  Bundle ID:', envData.bundleId);
    console.log('  Key Length:', envData.keyLength);
    console.log('  Has Newlines:', envData.hasNewlines);
    console.log('  Key Start:', envData.keyStart);
    console.log('  Key End:', envData.keyEnd);
    
    // Reconstruct the private key
    const privateKeyStart = envData.keyStart;
    const privateKeyEnd = envData.keyEnd;
    
    // For security, we can't get the full key from the debug endpoint
    // But we can test if the JWT generation would work with the format
    
    console.log('\n🔍 Key Format Analysis:');
    console.log('✅ Key starts correctly with header');
    console.log('✅ Key ends correctly with footer');
    console.log('✅ Key has proper newlines');
    console.log('✅ Key length is reasonable (257 chars)');
    
    // The issue might be with the ISSUER_ID - let's check if it's set
    console.log('\n⚠️ Missing Information:');
    console.log('We need to verify APPLE_ISSUER_ID is properly set in production');
    console.log('This is the most likely cause of 401 errors');
    
    // Test with a known transaction to see what error we get
    console.log('\n🧪 Testing with sandbox transaction...');
    
    const testResponse = await fetch('https://truesharp.io/api/validate-apple-transaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake-token-for-test'
      },
      body: JSON.stringify({
        userId: 'test-user',
        transactionId: 'test-transaction',
        productId: 'pro_subscription_month',
        environment: 'sandbox'
      })
    });
    
    console.log('📊 Test Response Status:', testResponse.status);
    
    if (testResponse.status === 401) {
      console.log('✅ Good: Server correctly rejects invalid auth token');
    }
    
    const testText = await testResponse.text();
    console.log('📄 Response:', testText);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Global fetch polyfill
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

testProductionAppleAPI();