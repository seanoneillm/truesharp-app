#!/usr/bin/env node

/**
 * Test Production Deployment with New Apple In-App Purchase API Keys
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const PRODUCTION_URL = 'https://truesharp.io';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function createTestUser() {
  console.log('🔐 Creating test user for production testing...');
  
  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  const testEmail = 'production-test@truesharp.io';
  const testPassword = 'prodtest123456';
  
  try {
    // Try to sign in first
    const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (signInData.user && signInData.session) {
      console.log('✅ Using existing test user:', signInData.user.id);
      return {
        userId: signInData.user.id,
        accessToken: signInData.session.access_token
      };
    }

    // Create new user if sign in failed
    const { data: signUpData, error: signUpError } = await supabaseClient.auth.signUp({
      email: testEmail,
      password: testPassword
    });

    if (signUpError && !signUpError.message.includes('already registered')) {
      throw signUpError;
    }

    // Sign in after signup
    const { data: finalSignIn, error: finalSignInError } = await supabaseClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (finalSignInError || !finalSignIn.session) {
      throw new Error('Could not authenticate after signup');
    }

    console.log('✅ Created and authenticated test user:', finalSignIn.user.id);
    return {
      userId: finalSignIn.user.id,
      accessToken: finalSignIn.session.access_token
    };
  } catch (error) {
    console.error('❌ Test user creation failed:', error);
    throw error;
  }
}

async function testProductionWebhook() {
  console.log('\n🧪 Testing production webhook endpoint...');
  
  try {
    const response = await fetch(`${PRODUCTION_URL}/api/apple-webhooks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ test: 'production-connectivity' })
    });

    const result = await response.text();
    console.log('📊 Webhook status:', response.status);
    console.log('📄 Webhook response:', result);
    
    if (response.status === 400 && result.includes('No signedPayload')) {
      console.log('✅ Production webhook working correctly');
      return true;
    }
    
    console.log('⚠️ Unexpected webhook response');
    return false;
  } catch (error) {
    console.error('❌ Production webhook test failed:', error);
    return false;
  }
}

async function testProductionAuthentication(auth) {
  console.log('\n🔐 Testing production authentication...');
  
  const testPayload = {
    userId: auth.userId,
    transactionId: `prod_test_txn_${Date.now()}`,
    originalTransactionId: `prod_test_orig_${Date.now()}`,
    productId: 'pro_subscription_month',
    environment: 'sandbox'
  };
  
  try {
    console.log('📤 Sending request to production...');
    console.log('🌐 URL:', `${PRODUCTION_URL}/api/validate-apple-transaction`);
    
    const response = await fetch(`${PRODUCTION_URL}/api/validate-apple-transaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.accessToken}`
      },
      body: JSON.stringify(testPayload)
    });

    console.log('📊 Response status:', response.status);
    
    const responseText = await response.text();
    console.log('📄 Response body:', responseText);
    
    if (response.status === 401) {
      console.log('❌ AUTHENTICATION FAILED - Bearer tokens not working in production');
      return false;
    } else if (response.status === 500) {
      try {
        const errorData = JSON.parse(responseText);
        if (errorData.error && errorData.error.includes('not found in any environment')) {
          console.log('✅ AUTHENTICATION SUCCESS - Reached Apple validation (expected failure with test data)');
          console.log('✅ NEW APPLE API KEYS WORKING IN PRODUCTION');
          return true;
        } else {
          console.log('⚠️ Unexpected server error:', errorData.error);
          return false;
        }
      } catch (parseError) {
        console.log('⚠️ Could not parse error response');
        return false;
      }
    } else if (response.status === 200) {
      console.log('🎉 UNEXPECTED SUCCESS - Transaction validation worked (should not happen with test data)');
      return true;
    } else {
      console.log('⚠️ Unexpected response status:', response.status);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Production authentication test failed:', error);
    return false;
  }
}

async function runProductionTests() {
  console.log('🚀 TESTING PRODUCTION DEPLOYMENT');
  console.log('='.repeat(50));
  console.log('🌐 Production URL:', PRODUCTION_URL);
  console.log('📅 Test time:', new Date().toISOString());
  console.log('');
  
  try {
    // Test 1: Webhook connectivity
    const webhookOk = await testProductionWebhook();
    
    // Test 2: User authentication and Apple API
    const auth = await createTestUser();
    const authOk = await testProductionAuthentication(auth);
    
    // Results
    console.log('\n' + '='.repeat(50));
    console.log('📊 PRODUCTION TEST RESULTS:');
    console.log('');
    console.log(`🌐 Webhook Endpoint: ${webhookOk ? '✅ WORKING' : '❌ FAILED'}`);
    console.log(`🔐 Authentication: ${authOk ? '✅ WORKING' : '❌ FAILED'}`);
    console.log('');
    
    if (webhookOk && authOk) {
      console.log('🎉 SUCCESS: Production deployment is working!');
      console.log('');
      console.log('💡 Next Steps:');
      console.log('1. ✅ Test real purchase in iOS TestFlight app');
      console.log('2. ✅ Verify subscription creation in database');
      console.log('3. ✅ Confirm Pro features unlock');
      console.log('');
      console.log('🚀 Your Apple purchase flow is ready for real testing!');
    } else {
      console.log('❌ ISSUES DETECTED: Some tests failed');
      console.log('');
      console.log('🔧 Debug steps:');
      if (!webhookOk) console.log('- Check webhook deployment');
      if (!authOk) console.log('- Check Apple API keys in production environment');
    }
    
  } catch (error) {
    console.error('❌ Production test suite failed:', error);
  }
}

// Global fetch polyfill
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

if (require.main === module) {
  runProductionTests().catch(console.error);
}

module.exports = { runProductionTests };