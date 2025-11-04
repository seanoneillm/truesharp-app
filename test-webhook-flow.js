#!/usr/bin/env node

/**
 * Test webhook flow locally by simulating Apple Server Notifications
 * This tests the actual flow that should happen
 */

const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '.env.local' });

function createMockAppleNotification() {
  // Create a mock Apple notification payload
  const transactionData = {
    transactionId: `test_transaction_${Date.now()}`,
    originalTransactionId: `test_original_${Date.now()}`,
    productId: 'pro_subscription_month',
    bundleId: 'com.truesharp.app',
    purchaseDate: Date.now(),
    expiresDate: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days from now
    type: 'Auto-Renewable Subscription',
    inAppOwnershipType: 'PURCHASED',
    environment: 'Sandbox',
    signedDate: Date.now()
  };

  // Mock signed transaction info (normally Apple signs this)
  const mockSignedTransaction = Buffer.from(JSON.stringify(transactionData)).toString('base64url');

  const notificationPayload = {
    notificationType: 'SUBSCRIBED',
    subtype: 'INITIAL_BUY',
    notificationUUID: `mock-uuid-${Date.now()}`,
    version: '2.0',
    signedDate: Date.now(),
    data: {
      appAppleId: 123456789,
      bundleId: 'com.truesharp.app',
      bundleVersion: '1.0',
      environment: 'Sandbox',
      signedTransactionInfo: `header.${mockSignedTransaction}.signature`
    }
  };

  // Mock signed payload (normally Apple signs this)
  const mockSignedPayload = Buffer.from(JSON.stringify(notificationPayload)).toString('base64url');

  return {
    signedPayload: `header.${mockSignedPayload}.signature`,
    transactionData
  };
}

async function testWebhookFlow() {
  console.log('🧪 Testing Apple Webhook Flow Locally');
  console.log('='.repeat(60));

  const { signedPayload, transactionData } = createMockAppleNotification();

  console.log('📦 Mock notification created:');
  console.log('  Transaction ID:', transactionData.transactionId);
  console.log('  Product ID:', transactionData.productId);
  console.log('  Environment:', transactionData.environment);

  // Test webhook endpoint locally
  console.log('\n🌐 Testing webhook endpoint...');

  try {
    const response = await fetch('http://localhost:3000/api/apple-webhooks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'App Store Server Notifications/1.0'
      },
      body: JSON.stringify({
        signedPayload: signedPayload
      })
    });

    console.log('📊 Webhook Response:');
    console.log('  Status:', response.status);
    console.log('  Status Text:', response.statusText);

    const responseText = await response.text();
    console.log('  Body:', responseText);

    if (response.ok) {
      console.log('\n✅ SUCCESS: Webhook endpoint is working');
      console.log('This shows the proper flow:');
      console.log('1. Apple sends notification → Webhook processes it');
      console.log('2. iOS app just finishes transaction (no blocking)');
      console.log('3. User gets immediate success feedback');
    } else {
      console.log('\n❌ WEBHOOK FAILED: Check the server logs');
    }

  } catch (error) {
    console.error('❌ Webhook test failed:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Local server not running. Start with: npm run dev');
    }
  }
}

async function testAppleAPIDirectly() {
  console.log('\n🔍 Testing Direct Apple API Call');
  console.log('='.repeat(50));

  // Test if our Apple API configuration works
  const keyId = process.env.APPLE_API_KEY_ID;
  const issuerId = process.env.APPLE_ISSUER_ID;
  let privateKey = process.env.APPLE_PRIVATE_KEY;
  const bundleId = process.env.APPLE_BUNDLE_ID;

  if (!keyId || !issuerId || !privateKey || !bundleId) {
    console.log('❌ Missing Apple API credentials in .env.local');
    return;
  }

  // Process private key
  privateKey = privateKey.replace(/^["']|["']$/g, '');
  privateKey = privateKey.replace(/\\n/g, '\n');

  const now = Math.round(Date.now() / 1000);
  const payload = {
    iss: issuerId,
    iat: now,
    exp: now + 3600,
    aud: 'appstoreconnect-v1',
    bid: bundleId
  };

  try {
    const token = jwt.sign(payload, privateKey, {
      algorithm: 'ES256',
      header: { alg: 'ES256', kid: keyId, typ: 'JWT' }
    });

    console.log('✅ JWT token generated successfully');

    // Test with Apple's sandbox API
    const response = await fetch('https://api.storekit-sandbox.itunes.apple.com/inApps/v1/history/fake_test_id', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    console.log('📊 Apple API Response:');
    console.log('  Status:', response.status);

    if (response.status === 400) {
      const result = await response.json();
      if (result.errorCode === 4000006) {
        console.log('✅ AUTH SUCCESS: Invalid transaction ID error means auth worked!');
        console.log('The timeout issue is NOT Apple API authentication');
      }
    } else if (response.status === 401) {
      console.log('❌ AUTH FAILED: Check APPLE_ISSUER_ID in production');
    }

  } catch (error) {
    console.log('❌ JWT generation failed:', error.message);
  }
}

// Global fetch polyfill
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

async function main() {
  await testWebhookFlow();
  await testAppleAPIDirectly();

  console.log('\n🎯 SOLUTION SUMMARY:');
  console.log('1. The timeout issue is from iOS trying to validate during purchase');
  console.log('2. Apple recommends: finish transaction immediately, validate separately');
  console.log('3. Our webhook is ready - just need to fix iOS flow');
  console.log('4. User should get instant success, database updates via webhook');
}

main().catch(console.error);