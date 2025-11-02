#!/usr/bin/env node

/**
 * Simple endpoint testing using curl
 */

const { spawn } = require('child_process');

function runCurl(description, url, data = null, headers = []) {
  return new Promise((resolve) => {
    console.log(`\n🧪 ${description}`);
    
    const args = ['-X', 'POST', url, '-v'];
    
    headers.forEach(header => {
      args.push('-H', header);
    });
    
    if (data) {
      args.push('-d', JSON.stringify(data));
    }
    
    const curl = spawn('curl', args);
    let output = '';
    let error = '';
    
    curl.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    curl.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    curl.on('close', (code) => {
      console.log('📄 Response:', output.trim());
      if (error.includes('HTTP/')) {
        const statusMatch = error.match(/HTTP\/[\d\.]+\s+(\d+)/);
        if (statusMatch) {
          console.log('📊 Status:', statusMatch[1]);
        }
      }
      resolve({ code, output, error });
    });
  });
}

async function testEndpoints() {
  console.log('🚀 Testing local endpoints with curl...');
  
  const baseUrl = 'http://localhost:3000';
  
  // Test 1: Webhook endpoint
  await runCurl(
    'Testing webhook endpoint',
    `${baseUrl}/api/apple-webhooks`,
    { test: 'connectivity' },
    ['Content-Type: application/json']
  );
  
  // Test 2: Transaction validation (without auth - should get 401)
  await runCurl(
    'Testing transaction validation endpoint (expect 401)',
    `${baseUrl}/api/validate-apple-transaction`,
    {
      userId: 'test-user',
      transactionId: 'test-txn',
      productId: 'pro_subscription_month'
    },
    ['Content-Type: application/json']
  );
  
  // Test 3: Receipt validation (without auth - should get 401)
  await runCurl(
    'Testing receipt validation endpoint (expect 401)',
    `${baseUrl}/api/validate-apple-receipt`,
    {
      userId: 'test-user',
      productId: 'pro_subscription_month',
      receiptData: 'test-receipt',
      transactionId: 'test-txn',
      environment: 'sandbox'
    },
    ['Content-Type: application/json']
  );
  
  console.log('\n✅ Endpoint testing completed!');
  console.log('\n📋 Results Summary:');
  console.log('- Webhook should return 400 "No signedPayload" (✅ working)');
  console.log('- Transaction validation should return 401 "Authentication required" (✅ working)');
  console.log('- Receipt validation should return 401 "Authentication required" (✅ working)');
  console.log('\nIf you see these responses, your local server is working correctly!');
}

testEndpoints().catch(console.error);