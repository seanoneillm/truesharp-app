#!/usr/bin/env node

/**
 * Test script to simulate a sandbox transaction and trace the validation flow
 * This helps debug the exact point where the flow breaks without TestFlight builds
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function testSandboxTransaction() {
  console.log('🧪 Testing Sandbox Transaction Flow');
  console.log('='.repeat(60));
  
  // Create test user
  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  const { data: signInData } = await supabaseClient.auth.signInWithPassword({
    email: 'production-test@truesharp.io',
    password: 'prodtest123456'
  });

  if (!signInData.session) {
    console.error('❌ Failed to authenticate user');
    return;
  }
  
  console.log('✅ User authenticated:', signInData.user.id);
  
  // Simulate what the iOS app would send
  const mockSandboxTransaction = {
    userId: signInData.user.id,
    transactionId: `sandbox_test_${Date.now()}`, // Simulated sandbox transaction
    originalTransactionId: `sandbox_orig_${Date.now()}`,
    productId: 'pro_subscription_month',
    environment: 'sandbox'
  };
  
  console.log('\n📱 Simulating iOS app transaction data:');
  console.log(JSON.stringify(mockSandboxTransaction, null, 2));
  
  console.log('\n🌐 Testing server validation...');
  
  try {
    const startTime = Date.now();
    
    const response = await fetch('https://truesharp.io/api/validate-apple-transaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${signInData.session.access_token}`,
      },
      body: JSON.stringify(mockSandboxTransaction)
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`📊 Response received in ${duration}ms`);
    console.log('📊 Status:', response.status);
    console.log('📊 Headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📄 Response body:', responseText);
    
    if (response.status === 200) {
      const result = JSON.parse(responseText);
      console.log('\n✅ SUCCESS: Server responded correctly');
      console.log('Valid:', result.valid);
      if (result.error) {
        console.log('Error details:', result.error);
      }
    } else if (response.status === 401) {
      console.log('\n❌ AUTHENTICATION FAILED');
      console.log('Check: Bearer token, Supabase auth, user permissions');
    } else if (response.status === 500) {
      console.log('\n❌ SERVER ERROR');
      console.log('Check: Apple API keys, JWT generation, database functions');
    } else {
      console.log('\n❓ UNEXPECTED STATUS');
    }
    
    // Test database check
    console.log('\n🗄️ Checking database for subscription...');
    
    const { data: subscriptions, error: dbError } = await supabaseClient
      .from('pro_subscriptions')
      .select('*')
      .eq('user_id', signInData.user.id)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (dbError) {
      console.log('❌ Database error:', dbError);
    } else {
      console.log(`📊 Found ${subscriptions.length} subscription(s) for user`);
      subscriptions.forEach((sub, index) => {
        console.log(`  ${index + 1}. ID: ${sub.id}, Status: ${sub.status}, Created: ${sub.created_at}`);
      });
    }
    
    // Test profile check
    console.log('\n👤 Checking user profile...');
    
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('pro, id, updated_at')
      .eq('id', signInData.user.id)
      .single();
    
    if (profileError) {
      console.log('❌ Profile error:', profileError);
    } else {
      console.log('📊 Profile pro status:', profile.pro);
      console.log('📊 Profile updated:', profile.updated_at);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Global fetch polyfill
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

testSandboxTransaction().catch(console.error);