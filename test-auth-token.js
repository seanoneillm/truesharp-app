#!/usr/bin/env node

/**
 * Test authentication token validity
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase authentication...\n');

async function testAuth() {
  // Test with anon key (like the iOS app would use)
  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  
  const testEmail = 'auth-test@truesharp.io';
  const testPassword = 'authtest123456';
  
  try {
    console.log('1. Creating test user...');
    const { data: signUpData, error: signUpError } = await supabaseClient.auth.signUp({
      email: testEmail,
      password: testPassword
    });
    
    if (signUpError && !signUpError.message.includes('already registered')) {
      throw signUpError;
    }
    
    console.log('2. Signing in...');
    const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (signInError) {
      throw signInError;
    }
    
    if (!signInData.session) {
      throw new Error('No session returned from sign in');
    }
    
    console.log('✅ Authentication successful');
    console.log('User ID:', signInData.user.id);
    console.log('Access token (first 50 chars):', signInData.session.access_token.substring(0, 50) + '...');
    
    console.log('\n3. Testing token with /api/validate-apple-transaction...');
    
    const testPayload = {
      userId: signInData.user.id,
      transactionId: 'test_auth_txn_' + Date.now(),
      originalTransactionId: 'test_auth_orig_' + Date.now(),
      productId: 'pro_subscription_month',
      environment: 'sandbox'
    };
    
    const response = await fetch('http://localhost:3000/api/validate-apple-transaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${signInData.session.access_token}`
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log('Response status:', response.status);
    const responseText = await response.text();
    console.log('Response:', responseText);
    
    if (response.status === 401) {
      console.log('\n❌ AUTHENTICATION ISSUE CONFIRMED');
      console.log('The token is valid but the server is rejecting it');
      
      // Test if the issue is with createRouteHandlerClient
      console.log('\n4. Testing direct Supabase auth...');
      const { data: userData, error: userError } = await supabaseClient.auth.getUser(signInData.session.access_token);
      
      if (userError) {
        console.log('❌ Token is invalid:', userError);
      } else {
        console.log('✅ Token is valid, user:', userData.user.id);
        console.log('❌ Issue is with server-side authentication in Next.js API route');
      }
    } else if (response.status === 500) {
      console.log('✅ Authentication passed, but validation failed (expected with mock transaction)');
    } else {
      console.log('📊 Unexpected response status');
    }
    
  } catch (error) {
    console.error('❌ Auth test failed:', error);
  }
}

// Global fetch polyfill
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

testAuth().catch(console.error);