#!/usr/bin/env node

/**
 * Test script for Apple receipt validation and webhook endpoints
 * Run with: node test-apple-endpoints.js
 */

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';

async function testWebhookEndpoint() {
  console.log('🔍 Testing webhook endpoint connectivity...');
  
  try {
    // Test basic connectivity
    const response = await fetch(`${SERVER_URL}/api/apple-webhooks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ test: 'connectivity' })
    });
    
    const result = await response.text();
    console.log('✅ Webhook endpoint is accessible');
    console.log('📄 Response:', result);
    console.log('📊 Status:', response.status);
    
    if (response.status === 400 && result.includes('No signedPayload')) {
      console.log('✅ Webhook correctly rejects invalid payloads');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Webhook endpoint test failed:', error.message);
    return false;
  }
}

async function testReceiptValidationEndpoint() {
  console.log('🔍 Testing receipt validation endpoint...');
  
  try {
    const response = await fetch(`${SERVER_URL}/api/validate-apple-receipt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 'test-user-id',
        productId: 'com.truesharp.app.pro.monthly',
        receiptData: 'test-receipt-data',
        transactionId: 'test-transaction-id',
        environment: 'sandbox'
      })
    });
    
    const result = await response.text();
    console.log('📄 Receipt validation response:', result);
    console.log('📊 Status:', response.status);
    
    if (response.status === 401) {
      console.log('✅ Receipt validation correctly requires authentication');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Receipt validation test failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Apple endpoints tests...\n');
  
  const webhookOk = await testWebhookEndpoint();
  console.log('');
  const receiptOk = await testReceiptValidationEndpoint();
  
  console.log('\n📊 Test Results:');
  console.log(`Webhook endpoint: ${webhookOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Receipt validation: ${receiptOk ? '✅ PASS' : '❌ FAIL'}`);
  
  if (webhookOk && receiptOk) {
    console.log('\n🎉 All basic connectivity tests passed!');
    console.log('\n💡 Next steps:');
    console.log('1. Test with real Apple receipts in the iOS app');
    console.log('2. Check App Store Connect webhook configuration');
    console.log('3. Verify database connectivity and functions');
  } else {
    console.log('\n❌ Some tests failed - check the logs above');
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testWebhookEndpoint, testReceiptValidationEndpoint };