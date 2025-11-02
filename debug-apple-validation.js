#!/usr/bin/env node

/**
 * Debug Apple Transaction Validation Flow
 * This script simulates what happens when the iOS app calls the server
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAuthenticatedUser() {
  console.log('🔐 Creating authenticated user for testing...');
  
  const testEmail = 'debug-test@truesharp.io';
  const testPassword = 'debug123456';
  
  try {
    // Try to sign in first
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
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
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword
    });

    if (signUpError) {
      throw new Error(`Sign up failed: ${signUpError.message}`);
    }

    if (signUpData.user && signUpData.session) {
      console.log('✅ Created new test user:', signUpData.user.id);
      
      // Create profile
      await supabase.from('profiles').upsert({
        id: signUpData.user.id,
        email: testEmail,
        pro: 'no',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      return {
        userId: signUpData.user.id,
        accessToken: signUpData.session.access_token
      };
    }

    throw new Error('Could not create or authenticate user');
  } catch (error) {
    console.error('❌ Authentication setup failed:', error);
    throw error;
  }
}

async function testAppleValidationFlow() {
  console.log('🍎 Testing Apple validation flow...\n');
  
  const auth = await createAuthenticatedUser();
  
  console.log('📱 Simulating iOS app transaction validation call...');
  
  // Simulate what the iOS app sends
  const mockTransactionData = {
    userId: auth.userId,
    transactionId: `test_ios_txn_${Date.now()}`,
    originalTransactionId: `test_ios_orig_${Date.now()}`,
    productId: 'pro_subscription_month',
    environment: 'sandbox' // This is what iOS app would send
  };
  
  console.log('📤 Request payload:', JSON.stringify(mockTransactionData, null, 2));
  
  try {
    console.log('🌐 Making request to:', `${SERVER_URL}/api/validate-apple-transaction`);
    
    const response = await fetch(`${SERVER_URL}/api/validate-apple-transaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.accessToken}`
      },
      body: JSON.stringify(mockTransactionData)
    });

    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📄 Raw response:', responseText);
    
    if (response.ok) {
      try {
        const result = JSON.parse(responseText);
        console.log('✅ Parsed response:', JSON.stringify(result, null, 2));
      } catch (parseError) {
        console.log('⚠️ Could not parse JSON response');
      }
    } else {
      console.log('❌ Request failed with status:', response.status);
      try {
        const errorResult = JSON.parse(responseText);
        console.log('❌ Error details:', JSON.stringify(errorResult, null, 2));
      } catch (parseError) {
        console.log('❌ Error response (not JSON):', responseText);
      }
    }
    
  } catch (error) {
    console.error('❌ Network/fetch error:', error);
  }
}

async function checkAppleAPICredentials() {
  console.log('🔑 Checking Apple API credentials...\n');
  
  const requiredEnvVars = [
    'APPLE_API_KEY_ID',
    'APPLE_ISSUER_ID', 
    'APPLE_PRIVATE_KEY',
    'APPLE_BUNDLE_ID'
  ];
  
  const missing = [];
  
  requiredEnvVars.forEach(varName => {
    const value = process.env[varName];
    if (!value) {
      missing.push(varName);
    } else {
      console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
    }
  });
  
  if (missing.length > 0) {
    console.error('❌ Missing required Apple API credentials:', missing);
    return false;
  }
  
  console.log('✅ All Apple API credentials present\n');
  return true;
}

async function runDebugAnalysis() {
  console.log('🔍 DEBUGGING APPLE VALIDATION FLOW\n');
  console.log('='.repeat(50) + '\n');
  
  try {
    // Check credentials first
    const hasCredentials = await checkAppleAPICredentials();
    if (!hasCredentials) {
      console.log('❌ Cannot proceed without Apple API credentials');
      return;
    }
    
    // Test the validation flow
    await testAppleValidationFlow();
    
    console.log('\n' + '='.repeat(50));
    console.log('🎯 DEBUG ANALYSIS COMPLETE');
    
  } catch (error) {
    console.error('❌ Debug analysis failed:', error);
  }
}

// Global fetch polyfill for Node.js
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

if (require.main === module) {
  runDebugAnalysis().catch(console.error);
}

module.exports = { runDebugAnalysis };