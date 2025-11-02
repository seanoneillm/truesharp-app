#!/usr/bin/env node

/**
 * Debug JWT Generation in Production
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function debugJWTProduction() {
  console.log('🔍 Debugging JWT Generation in Production\n');
  
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
  
  // Test 1: Check environment variables visibility 
  console.log('\n🧪 Test 1: Environment Variables Check');
  
  const envCheckPayload = {
    userId: signInData.user.id,
    transactionId: 'env_check_test',
    originalTransactionId: 'env_check_orig',
    productId: 'pro_subscription_month',
    environment: 'sandbox',
    debugMode: 'check_env_vars'
  };
  
  try {
    const response = await fetch('https://truesharp.io/api/validate-apple-transaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${signInData.session.access_token}`,
        'X-Debug-Mode': 'env-check'
      },
      body: JSON.stringify(envCheckPayload)
    });
    
    const result = await response.text();
    console.log('📊 Status:', response.status);
    console.log('📄 Response:', result);
    
    if (result.includes('Missing Apple API credentials')) {
      console.log('\n❌ CONFIRMED: Apple API credentials missing in production');
      console.log('🔧 Environment variables are not accessible in the API route');
    } else if (result.includes('Failed to generate App Store API token')) {
      console.log('\n❌ JWT generation failing for other reasons');
      console.log('🔧 Environment variables present but JWT generation has issues');
    }
    
  } catch (error) {
    console.error('❌ Environment check failed:', error);
  }
  
  // Test 2: Compare with a simple unauthenticated call
  console.log('\n🧪 Test 2: Unauthenticated Call (should fail differently)');
  
  try {
    const unauthResponse = await fetch('https://truesharp.io/api/validate-apple-transaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid-token'
      },
      body: JSON.stringify(envCheckPayload)
    });
    
    const unauthResult = await unauthResponse.text();
    console.log('📊 Unauth Status:', unauthResponse.status);
    console.log('📄 Unauth Response:', unauthResult);
    
    if (unauthResponse.status === 401) {
      console.log('✅ Unauthenticated requests fail as expected');
    }
    
  } catch (error) {
    console.error('❌ Unauthenticated test failed:', error);
  }
  
  // Test 3: Check if it's a timing issue
  console.log('\n🧪 Test 3: Multiple Rapid Requests');
  
  for (let i = 1; i <= 3; i++) {
    try {
      const testPayload = {
        userId: signInData.user.id,
        transactionId: `timing_test_${i}`,
        originalTransactionId: `timing_orig_${i}`,
        productId: 'pro_subscription_month',
        environment: 'sandbox'
      };
      
      const response = await fetch('https://truesharp.io/api/validate-apple-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${signInData.session.access_token}`
        },
        body: JSON.stringify(testPayload)
      });
      
      const result = await response.text();
      console.log(`Request ${i}: Status ${response.status}`);
      
      if (result.includes('Failed to generate App Store API token')) {
        console.log(`   ❌ JWT generation failed on request ${i}`);
      } else if (result.includes('not found in any environment')) {
        console.log(`   ✅ JWT generation succeeded on request ${i}`);
      } else {
        console.log(`   🤔 Unexpected response on request ${i}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Request ${i} failed:`, error.message);
    }
  }
}

// Global fetch polyfill
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

debugJWTProduction().catch(console.error);