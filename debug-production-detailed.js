#!/usr/bin/env node

/**
 * Detailed Production Debugging - Check specific JWT generation issues
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function detailedProductionDebug() {
  console.log('🔍 Detailed Production Debugging\n');
  
  // Create authenticated user
  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  const { data: signInData } = await supabaseClient.auth.signInWithPassword({
    email: 'production-test@truesharp.io',
    password: 'prodtest123456'
  });

  if (!signInData.session) {
    console.error('❌ Failed to authenticate user');
    return;
  }
  
  console.log('✅ User authenticated');
  
  // Test 1: Check if it's a dependency issue
  console.log('\n🧪 Test 1: Check JWT Library Availability');
  
  const jwtTestPayload = {
    userId: signInData.user.id,
    transactionId: 'jwt_lib_test',
    originalTransactionId: 'jwt_lib_orig',
    productId: 'pro_subscription_month',
    environment: 'sandbox',
    debugType: 'jwt_library_test'
  };
  
  try {
    const response = await fetch('https://truesharp.io/api/validate-apple-transaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${signInData.session.access_token}`,
        'X-Debug': 'jwt-library'
      },
      body: JSON.stringify(jwtTestPayload)
    });
    
    const result = await response.text();
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${result}`);
    
    if (result.includes('jwt is not defined') || result.includes('Cannot find module')) {
      console.log('❌ JWT library issue in production');
    } else if (result.includes('Failed to generate App Store API token')) {
      console.log('❌ JWT generation failing - likely environment or key format issue');
    }
    
  } catch (error) {
    console.error('❌ Test 1 failed:', error);
  }
  
  // Test 2: Check if it's a specific environment variable
  console.log('\n🧪 Test 2: Test Each Environment Variable Individually');
  
  const envTests = [
    { name: 'KEY_ID', test: 'key_id_test' },
    { name: 'ISSUER_ID', test: 'issuer_id_test' },
    { name: 'PRIVATE_KEY', test: 'private_key_test' },
    { name: 'BUNDLE_ID', test: 'bundle_id_test' }
  ];
  
  for (const envTest of envTests) {
    try {
      const testPayload = {
        userId: signInData.user.id,
        transactionId: `env_${envTest.test}`,
        originalTransactionId: `env_orig_${envTest.test}`,
        productId: 'pro_subscription_month',
        environment: 'sandbox',
        debugType: envTest.test
      };
      
      const response = await fetch('https://truesharp.io/api/validate-apple-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${signInData.session.access_token}`,
          'X-Debug-Env': envTest.name
        },
        body: JSON.stringify(testPayload)
      });
      
      const result = await response.text();
      console.log(`${envTest.name}: Status ${response.status}`);
      
      if (result.includes('Missing Apple API credentials')) {
        console.log(`   ❌ ${envTest.name} missing or undefined`);
      } else if (result.includes('Failed to generate App Store API token')) {
        console.log(`   ⚠️ ${envTest.name} present but JWT generation still failing`);
      } else {
        console.log(`   ✅ ${envTest.name} seems OK`);
      }
      
    } catch (error) {
      console.log(`   ❌ ${envTest.name} test failed:`, error.message);
    }
  }
  
  // Test 3: Check if it's a Next.js environment loading issue
  console.log('\n🧪 Test 3: Direct Environment Variable Check');
  
  try {
    const envCheckPayload = {
      userId: signInData.user.id,
      transactionId: 'direct_env_check',
      originalTransactionId: 'direct_env_orig',
      productId: 'pro_subscription_month',
      environment: 'sandbox',
      debugType: 'direct_env_check',
      checkAllEnvVars: true
    };
    
    const response = await fetch('https://truesharp.io/api/validate-apple-transaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${signInData.session.access_token}`,
        'X-Debug': 'env-vars'
      },
      body: JSON.stringify(envCheckPayload)
    });
    
    const result = await response.text();
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${result}`);
    
    try {
      const parsedResult = JSON.parse(result);
      if (parsedResult.debug) {
        console.log('🔍 Debug info from server:', parsedResult.debug);
      }
    } catch (parseError) {
      // Response not JSON, that's OK
    }
    
  } catch (error) {
    console.error('❌ Test 3 failed:', error);
  }
  
  // Test 4: Compare response timing
  console.log('\n🧪 Test 4: Response Timing Analysis');
  
  const timingTests = [];
  for (let i = 1; i <= 3; i++) {
    try {
      const start = Date.now();
      const response = await fetch('https://truesharp.io/api/validate-apple-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${signInData.session.access_token}`
        },
        body: JSON.stringify({
          userId: signInData.user.id,
          transactionId: `timing_test_${i}`,
          originalTransactionId: `timing_orig_${i}`,
          productId: 'pro_subscription_month',
          environment: 'sandbox'
        })
      });
      
      const end = Date.now();
      const result = await response.text();
      
      timingTests.push({
        test: i,
        duration: end - start,
        status: response.status,
        failed: result.includes('Failed to generate App Store API token')
      });
      
    } catch (error) {
      timingTests.push({
        test: i,
        duration: 0,
        status: 'ERROR',
        failed: true,
        error: error.message
      });
    }
  }
  
  console.log('Timing Results:');
  timingTests.forEach(test => {
    console.log(`  Test ${test.test}: ${test.duration}ms, Status: ${test.status}, Failed: ${test.failed}`);
    if (test.error) console.log(`    Error: ${test.error}`);
  });
  
  const avgDuration = timingTests.reduce((sum, test) => sum + test.duration, 0) / timingTests.length;
  console.log(`Average duration: ${avgDuration.toFixed(0)}ms`);
  
  if (avgDuration < 100) {
    console.log('⚡ Very fast failures - likely missing environment variables');
  } else if (avgDuration > 500) {
    console.log('🐌 Slow failures - likely timeout or Apple API issues');
  } else {
    console.log('⏱️ Normal timing - likely JWT generation issue');
  }
}

// Global fetch polyfill
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

detailedProductionDebug().catch(console.error);