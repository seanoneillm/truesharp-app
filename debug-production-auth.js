#!/usr/bin/env node

/**
 * Debug Production Authentication Issue
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function debugProductionAuth() {
  console.log('🔍 Debugging Production Authentication Issue\n');
  
  // Step 1: Create authenticated user
  console.log('🔐 Step 1: Creating authenticated user...');
  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  
  const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
    email: 'production-test@truesharp.io',
    password: 'prodtest123456'
  });

  if (signInError || !signInData.session) {
    console.error('❌ Failed to authenticate user:', signInError);
    return;
  }
  
  console.log('✅ User authenticated:', signInData.user.id);
  console.log('✅ Access token length:', signInData.session.access_token.length);
  
  // Step 2: Test with minimal payload
  console.log('\n🧪 Step 2: Testing with minimal payload...');
  
  const minimalPayload = {
    userId: signInData.user.id,
    transactionId: 'debug_test_001',
    originalTransactionId: 'debug_test_orig_001',
    productId: 'pro_subscription_month',
    environment: 'sandbox'
  };
  
  try {
    const response = await fetch('https://truesharp.io/api/validate-apple-transaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${signInData.session.access_token}`
      },
      body: JSON.stringify(minimalPayload)
    });
    
    console.log('📊 Response status:', response.status);
    const responseText = await response.text();
    console.log('📄 Response body:', responseText);
    
    // Analyze the response
    if (response.status === 401) {
      console.log('\n❌ ISSUE: User authentication failed in production');
      console.log('🔧 Possible causes:');
      console.log('   - Supabase auth config mismatch between local and production');
      console.log('   - JWT secret mismatch');
      console.log('   - Token validation logic issue');
    } else if (responseText.includes('Failed to generate App Store API token')) {
      console.log('\n❌ ISSUE: Apple API token generation failed');
      console.log('🔧 But individual key tests passed...');
      console.log('🤔 This suggests the issue occurs only with authenticated requests');
    } else if (responseText.includes('not found in any environment')) {
      console.log('\n✅ SUCCESS: Both user auth and Apple API working!');
      console.log('✅ The error is expected (test transaction not found)');
    } else {
      console.log('\n🤔 Unexpected response - needs investigation');
    }
    
    // Step 3: Test local environment for comparison
    console.log('\n🔍 Step 3: Testing local environment for comparison...');
    
    const localResponse = await fetch('http://localhost:3007/api/validate-apple-transaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${signInData.session.access_token}`
      },
      body: JSON.stringify(minimalPayload)
    });
    
    console.log('📊 Local status:', localResponse.status);
    const localResponseText = await localResponse.text();
    console.log('📄 Local response:', localResponseText);
    
  } catch (error) {
    console.error('❌ Debug test failed:', error);
  }
}

// Global fetch polyfill
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

debugProductionAuth().catch(console.error);