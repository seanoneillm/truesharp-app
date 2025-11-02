#!/usr/bin/env node

/**
 * Test to see the detailed debug error message
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function testDebugError() {
  console.log('🔍 Testing for detailed debug error message\n');
  
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
  
  try {
    const response = await fetch('https://truesharp.io/api/validate-apple-transaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${signInData.session.access_token}`
      },
      body: JSON.stringify({
        userId: signInData.user.id,
        transactionId: 'debug_error_test',
        originalTransactionId: 'debug_error_orig',
        productId: 'pro_subscription_month',
        environment: 'sandbox'
      })
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📄 Raw response:', responseText);
    
    try {
      const parsedResponse = JSON.parse(responseText);
      console.log('📋 Parsed response:', JSON.stringify(parsedResponse, null, 2));
      
      if (parsedResponse.error) {
        console.log('\n🔍 Error details:', parsedResponse.error);
        
        if (parsedResponse.error.includes('Debug:')) {
          console.log('✅ Debug information found in error message!');
        } else {
          console.log('❌ No debug information in error message');
        }
      }
      
    } catch (parseError) {
      console.log('❌ Could not parse response as JSON');
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error);
  }
}

// Global fetch polyfill
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

testDebugError().catch(console.error);