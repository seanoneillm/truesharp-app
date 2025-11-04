#!/usr/bin/env node

/**
 * Test JWT generation for Apple App Store Server API
 */

const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '.env.local' });

function testJWTGeneration() {
  console.log('🔐 Testing Apple JWT Generation');
  console.log('='.repeat(50));
  
  const keyId = process.env.APPLE_API_KEY_ID;
  const issuerId = process.env.APPLE_ISSUER_ID;
  let privateKey = process.env.APPLE_PRIVATE_KEY;
  const bundleId = process.env.APPLE_BUNDLE_ID;
  
  console.log('📊 Environment Variables:');
  console.log('  Key ID:', keyId ? 'SET' : 'MISSING');
  console.log('  Issuer ID:', issuerId ? 'SET' : 'MISSING');
  console.log('  Bundle ID:', bundleId ? 'SET' : 'MISSING');
  console.log('  Private Key Length:', privateKey?.length || 0);
  
  if (!keyId || !issuerId || !privateKey || !bundleId) {
    console.error('❌ Missing required environment variables');
    return;
  }
  
  // Process private key like the server does
  if (privateKey) {
    privateKey = privateKey.replace(/^["']|["']$/g, '');
    privateKey = privateKey.replace(/\\n/g, '\n');
    
    if (!privateKey.includes('\n') && privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      privateKey = privateKey
        .replace('-----BEGIN PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----\n')
        .replace('-----END PRIVATE KEY-----', '\n-----END PRIVATE KEY-----')
        .replace(/^-----BEGIN PRIVATE KEY-----\n(.+)\n-----END PRIVATE KEY-----$/, (match, content) => {
          const formattedContent = content.match(/.{1,64}/g)?.join('\n') || content;
          return `-----BEGIN PRIVATE KEY-----\n${formattedContent}\n-----END PRIVATE KEY-----`;
        });
    }
  }
  
  console.log('\n🔍 Private Key Format:');
  console.log('  Length:', privateKey.length);
  console.log('  Has newlines:', privateKey.includes('\n'));
  console.log('  First 50 chars:', privateKey.substring(0, 50));
  console.log('  Last 50 chars:', privateKey.substring(privateKey.length - 50));
  
  const now = Math.round(Date.now() / 1000);
  
  const payload = {
    iss: issuerId,
    iat: now,
    exp: now + 3600,
    aud: 'appstoreconnect-v1',
    bid: bundleId
  };
  
  console.log('\n📦 JWT Payload:');
  console.log(JSON.stringify(payload, null, 2));
  
  try {
    console.log('\n🔐 Generating JWT token...');
    
    const token = jwt.sign(payload, privateKey, {
      algorithm: 'ES256',
      header: {
        alg: 'ES256',
        kid: keyId,
        typ: 'JWT'
      }
    });
    
    console.log('✅ JWT Generated Successfully!');
    console.log('Token length:', token.length);
    console.log('Token preview:', token.substring(0, 100) + '...');
    
    // Test with Apple API
    console.log('\n🌐 Testing with Apple Sandbox API...');
    testAppleAPI(token);
    
  } catch (error) {
    console.error('❌ JWT Generation Failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

async function testAppleAPI(token) {
  try {
    // Test with a fake transaction ID to verify auth works
    const response = await fetch('https://api.storekit-sandbox.itunes.apple.com/inApps/v1/history/fake_transaction_id', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'User-Agent': 'TrueSharp/1.0'
      }
    });
    
    console.log('📊 Apple API Response:');
    console.log('  Status:', response.status);
    console.log('  Status Text:', response.statusText);
    
    if (response.status === 404) {
      console.log('✅ AUTH SUCCESS: 404 means auth worked but transaction not found (expected)');
    } else if (response.status === 401) {
      const errorText = await response.text();
      console.log('❌ AUTH FAILED: 401 Unauthorized');
      console.log('  Error:', errorText);
    } else {
      const responseText = await response.text();
      console.log('📄 Response:', responseText);
    }
    
  } catch (error) {
    console.error('❌ API Test Failed:', error.message);
  }
}

// Global fetch polyfill
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

testJWTGeneration();