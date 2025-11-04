#!/usr/bin/env node

/**
 * Comprehensive test of Apple API credentials and JWT generation
 * This will test every step and show you exactly what should be configured
 */

const jwt = require('jsonwebtoken');

async function testAppleCredentials() {
console.log('🔍 Apple API Credentials Test');
console.log('============================');

// Expected environment variable names (EXACT names to use in Vercel)
const REQUIRED_VARS = {
  'APPLE_API_KEY_ID': process.env.APPLE_API_KEY_ID,
  'APPLE_ISSUER_ID': process.env.APPLE_ISSUER_ID, 
  'APPLE_BUNDLE_ID': process.env.APPLE_BUNDLE_ID,
  'APPLE_PRIVATE_KEY': process.env.APPLE_PRIVATE_KEY
};

console.log('\n📋 Environment Variables Check:');
console.log('================================');

let allPresent = true;
for (const [name, value] of Object.entries(REQUIRED_VARS)) {
  const status = value ? '✅ SET' : '❌ MISSING';
  const length = value ? value.length : 0;
  console.log(`${status} ${name}: ${length} characters`);
  
  if (name === 'APPLE_BUNDLE_ID' && value) {
    console.log(`   Value: ${value}`);
    if (value !== 'com.truesharp.app') {
      console.log('   ⚠️  Expected: com.truesharp.app');
    }
  }
  
  if (name === 'APPLE_API_KEY_ID' && value) {
    console.log(`   Format: ${value.length === 10 ? '✅ Correct (10 chars)' : '❌ Should be 10 characters'}`);
  }
  
  if (name === 'APPLE_ISSUER_ID' && value) {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
    console.log(`   Format: ${isUUID ? '✅ Valid UUID' : '❌ Should be UUID format'}`);
  }
  
  if (name === 'APPLE_PRIVATE_KEY' && value) {
    const hasBegin = value.includes('-----BEGIN PRIVATE KEY-----');
    const hasEnd = value.includes('-----END PRIVATE KEY-----');
    const hasNewlines = value.includes('\n');
    
    console.log(`   Format checks:`);
    console.log(`     - Starts with BEGIN: ${hasBegin ? '✅' : '❌'}`);
    console.log(`     - Ends with END: ${hasEnd ? '✅' : '❌'}`);
    console.log(`     - Contains newlines: ${hasNewlines ? '✅' : '❌'}`);
    
    if (!hasNewlines) {
      console.log(`     ⚠️  Key appears to be on one line - may need \\n replacement`);
    }
  }
  
  if (!value) {
    allPresent = false;
  }
}

if (!allPresent) {
  console.log('\n❌ Missing environment variables! Cannot proceed with tests.');
  console.log('\n📝 Vercel Configuration Instructions:');
  console.log('=====================================');
  console.log('1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables');
  console.log('2. Add these EXACT variable names:');
  console.log('   - APPLE_API_KEY_ID (10 character string, e.g., "2X9R4HXF34")');
  console.log('   - APPLE_ISSUER_ID (UUID format, e.g., "57246542-96fe-1a63-e053-0824d011072a")');
  console.log('   - APPLE_BUNDLE_ID (should be "com.truesharp.app")');
  console.log('   - APPLE_PRIVATE_KEY (full PEM private key with newlines)');
  console.log('3. Set Environment: Production, Preview, Development (all checked)');
  console.log('4. Save and redeploy');
  process.exit(1);
}

console.log('\n🔐 JWT Generation Test:');
console.log('=======================');

try {
  // Process private key
  let privateKey = REQUIRED_VARS.APPLE_PRIVATE_KEY;
  
  console.log('🔧 Processing private key...');
  
  // Remove quotes if present
  privateKey = privateKey.replace(/^["']|["']$/g, '');
  console.log(`   - Removed quotes: ${privateKey.length} chars`);
  
  // Ensure proper newlines (replace \\n with actual newlines)
  const beforeNewlines = privateKey.length;
  privateKey = privateKey.replace(/\\\\n/g, '\n');
  console.log(`   - Processed \\\\n: ${beforeNewlines} → ${privateKey.length} chars`);
  
  // Ensure it starts and ends with proper markers
  if (!privateKey.includes('\n') && privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
    console.log('   - Formatting single-line key...');
    privateKey = privateKey
      .replace('-----BEGIN PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----\n')
      .replace('-----END PRIVATE KEY-----', '\n-----END PRIVATE KEY-----')
      .replace(/^-----BEGIN PRIVATE KEY-----\n(.+)\n-----END PRIVATE KEY-----$/, (match, content) => {
        const formattedContent = content.match(/.{1,64}/g)?.join('\n') || content;
        return `-----BEGIN PRIVATE KEY-----\n${formattedContent}\n-----END PRIVATE KEY-----`;
      });
    console.log(`   - Formatted key: ${privateKey.length} chars`);
  }
  
  console.log('✅ Private key processing complete');
  
  // Generate JWT
  const now = Math.round(Date.now() / 1000);
  const payload = {
    iss: REQUIRED_VARS.APPLE_ISSUER_ID,
    iat: now,
    exp: now + 3600, // 1 hour expiration
    aud: 'appstoreconnect-v1',
    bid: REQUIRED_VARS.APPLE_BUNDLE_ID
  };
  
  console.log('🎯 Generating JWT with payload:');
  console.log(`   - Issuer: ${payload.iss}`);
  console.log(`   - Bundle: ${payload.bid}`);
  console.log(`   - Audience: ${payload.aud}`);
  console.log(`   - Issued: ${new Date(payload.iat * 1000).toISOString()}`);
  console.log(`   - Expires: ${new Date(payload.exp * 1000).toISOString()}`);
  
  const token = jwt.sign(payload, privateKey, {
    algorithm: 'ES256',
    header: {
      alg: 'ES256',
      kid: REQUIRED_VARS.APPLE_API_KEY_ID,
      typ: 'JWT'
    }
  });
  
  console.log('✅ JWT generation successful!');
  console.log(`   - Token length: ${token.length} characters`);
  console.log(`   - Token preview: ${token.substring(0, 50)}...`);
  
  // Test with Apple API
  console.log('\n🌐 Apple API Test:');
  console.log('==================');
  
  console.log('Testing sandbox API endpoint...');
  
  let fetch;
  try {
    fetch = require('node-fetch');
  } catch (error) {
    fetch = globalThis.fetch;
  }
  
  const response = await fetch('https://api.storekit-sandbox.itunes.apple.com/inApps/v1/notifications/test', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'TrueSharp/1.0'
    },
    body: JSON.stringify({
      notificationType: 'TEST'
    })
  });
  
  console.log(`📊 API Response: HTTP ${response.status}`);
  
  if (response.ok) {
    const result = await response.json();
    console.log('✅ Apple API authentication successful!');
    console.log(`   - Test notification token: ${result.testNotificationToken}`);
    console.log('\n🎉 All Apple API credentials are working correctly!');
    console.log('📱 The issue is likely environment-specific or timing-related.');
  } else {
    const errorText = await response.text();
    console.log('❌ Apple API authentication failed');
    console.log(`   - Status: ${response.status}`);
    console.log(`   - Error: ${errorText}`);
    
    if (response.status === 401) {
      console.log('\n💡 HTTP 401 Suggestions:');
      console.log('   - Double-check your Apple API Key ID');
      console.log('   - Verify the private key matches the Key ID');
      console.log('   - Ensure the Issuer ID is correct');
      console.log('   - Check that the key hasn\'t expired');
    }
  }
  
} catch (error) {
  console.log('❌ JWT generation failed:');
  console.log(`   Error: ${error.message}`);
  
  if (error.message.includes('invalid key')) {
    console.log('\n💡 Private Key Issues:');
    console.log('   - Ensure the private key is in proper PEM format');
    console.log('   - Check for missing BEGIN/END markers');
    console.log('   - Verify newlines are preserved (\\n not \\\\n)');
    console.log('   - Make sure it\'s the PRIVATE key, not public');
  }
  
  if (error.message.includes('algorithm')) {
    console.log('\n💡 Algorithm Issues:');
    console.log('   - Ensure you\'re using an ES256 key (not RS256)');
    console.log('   - Verify the key was generated for App Store Connect');
  }
}

console.log('\n📝 Summary:');
console.log('===========');
console.log('If this test passes locally but fails on Vercel:');
console.log('1. ✅ Your local environment is correct');
console.log('2. ❌ Vercel environment variables need to be updated');
console.log('3. 🔄 After updating Vercel vars, redeploy your application');
console.log('4. 🧪 Test again with a purchase or restore');
}

// Run the test
testAppleCredentials().catch(error => {
  console.error('💥 Test failed:', error.message);
  process.exit(1);
});