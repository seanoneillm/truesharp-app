#!/usr/bin/env node

/**
 * Test Apple JWT token generation and validation
 */

const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '.env.local' });

function testAppleJWT() {
  console.log('🔍 Testing Apple JWT token generation...\n');
  
  const keyId = process.env.APPLE_API_KEY_ID;
  const issuerId = process.env.APPLE_ISSUER_ID;
  const privateKey = process.env.APPLE_PRIVATE_KEY;
  const bundleId = process.env.APPLE_BUNDLE_ID;
  
  console.log('📋 Apple API Credentials:');
  console.log('Key ID:', keyId);
  console.log('Issuer ID:', issuerId);
  console.log('Bundle ID:', bundleId);
  console.log('Private Key (first 100 chars):', privateKey?.substring(0, 100) + '...');
  
  if (!keyId || !issuerId || !privateKey || !bundleId) {
    console.error('❌ Missing Apple API credentials');
    return;
  }
  
  console.log('\n🔐 Generating JWT token...');
  
  const now = Math.round(Date.now() / 1000);
  
  const payload = {
    iss: issuerId,
    iat: now,
    exp: now + 3600, // 1 hour expiration
    aud: 'appstoreconnect-v1',
    bid: bundleId
  };
  
  console.log('📤 JWT Payload:', JSON.stringify(payload, null, 2));
  
  try {
    const token = jwt.sign(payload, privateKey, {
      algorithm: 'ES256',
      header: {
        alg: 'ES256',
        kid: keyId,
        typ: 'JWT'
      }
    });
    
    console.log('✅ JWT Generated successfully');
    console.log('Token (first 100 chars):', token.substring(0, 100) + '...');
    
    console.log('\n🧪 Testing JWT with Apple API...');
    
    // Test with a simple Apple API call
    testAppleAPI(token);
    
  } catch (error) {
    console.error('❌ JWT generation failed:', error);
  }
}

async function testAppleAPI(token) {
  // Test with a simple endpoint to see if JWT works
  const testUrl = 'https://api.storekit-sandbox.itunes.apple.com/inApps/v1/subscriptions/test_transaction_id';
  
  try {
    console.log('📡 Testing JWT with Apple API...');
    console.log('URL:', testUrl);
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'User-Agent': 'TrueSharp/1.0'
      },
      signal: AbortSignal.timeout(10000)
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📄 Response body:', responseText);
    
    if (response.status === 401) {
      console.log('\n❌ JWT Authentication failed with Apple');
      console.log('Possible issues:');
      console.log('1. Private key format incorrect');
      console.log('2. Key ID mismatch');
      console.log('3. Issuer ID incorrect');
      console.log('4. Bundle ID mismatch');
      console.log('5. JWT payload structure incorrect');
    } else if (response.status === 404) {
      console.log('\n✅ JWT Authentication successful (404 expected for test transaction)');
    } else {
      console.log('\n📊 Unexpected response - may indicate JWT issues');
    }
    
  } catch (error) {
    console.error('❌ Apple API test failed:', error);
  }
}

// Global fetch polyfill
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

testAppleJWT();