#!/usr/bin/env node

/**
 * Local Purchase Flow Testing Script
 * Simulates the complete iOS purchase flow to test locally
 */

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test user for local testing
const TEST_USER = {
  email: 'test@truesharp.io',
  password: 'test123456',
  userId: null, // Will be set after auth
  accessToken: null // Will be set after auth
};

async function createTestUser() {
  console.log('🔧 Setting up test user...');
  
  try {
    // Try to sign in first
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: TEST_USER.email,
      password: TEST_USER.password
    });

    if (signInData.user) {
      TEST_USER.userId = signInData.user.id;
      TEST_USER.accessToken = signInData.session.access_token;
      console.log('✅ Using existing test user:', TEST_USER.userId);
      return;
    }

    // Create new user if sign in failed
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: TEST_USER.email,
      password: TEST_USER.password
    });

    if (signUpError) {
      console.error('❌ Failed to create test user:', signUpError.message);
      process.exit(1);
    }

    if (signUpData.user) {
      TEST_USER.userId = signUpData.user.id;
      TEST_USER.accessToken = signUpData.session?.access_token;
      console.log('✅ Created test user:', TEST_USER.userId);
      
      // Create profile for the user
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: TEST_USER.userId,
          email: TEST_USER.email,
          pro: 'no',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.warn('⚠️ Could not create profile:', profileError.message);
      }
    }
  } catch (error) {
    console.error('❌ Error setting up test user:', error);
    process.exit(1);
  }
}

async function testTransactionValidation() {
  console.log('\n🧪 Testing transaction validation endpoint...');
  
  const mockTransactionData = {
    userId: TEST_USER.userId,
    transactionId: `test_txn_${Date.now()}`,
    originalTransactionId: `test_orig_txn_${Date.now()}`,
    productId: 'pro_subscription_month',
    environment: 'sandbox'
  };

  try {
    const response = await fetch(`${SERVER_URL}/api/validate-apple-transaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_USER.accessToken}`
      },
      body: JSON.stringify(mockTransactionData)
    });

    const result = await response.text();
    console.log('📄 Response:', result);
    console.log('📊 Status:', response.status);

    if (response.status === 200) {
      console.log('✅ Transaction validation endpoint is working');
      return JSON.parse(result);
    } else if (response.status === 401) {
      console.log('✅ Authentication is working (401 expected for invalid token)');
    } else {
      console.log('⚠️ Unexpected response from validation endpoint');
    }
  } catch (error) {
    console.error('❌ Transaction validation test failed:', error.message);
  }
}

async function testReceiptValidation() {
  console.log('\n🧪 Testing receipt validation endpoint...');
  
  const mockReceiptData = {
    userId: TEST_USER.userId,
    productId: 'pro_subscription_month',
    receiptData: 'mock_receipt_data_for_testing',
    transactionId: `test_receipt_txn_${Date.now()}`,
    environment: 'sandbox'
  };

  try {
    const response = await fetch(`${SERVER_URL}/api/validate-apple-receipt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_USER.accessToken}`
      },
      body: JSON.stringify(mockReceiptData)
    });

    const result = await response.text();
    console.log('📄 Response:', result);
    console.log('📊 Status:', response.status);

    if (response.status === 401) {
      console.log('✅ Authentication is working');
    } else if (response.status === 503) {
      console.log('✅ Endpoint reached Apple validation (expected failure with mock data)');
    } else {
      console.log('⚠️ Unexpected response from receipt validation');
    }
  } catch (error) {
    console.error('❌ Receipt validation test failed:', error.message);
  }
}

async function testWebhookEndpoint() {
  console.log('\n🧪 Testing webhook endpoint...');
  
  try {
    const response = await fetch(`${SERVER_URL}/api/apple-webhooks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ test: 'webhook-connectivity' })
    });

    const result = await response.text();
    console.log('📄 Response:', result);
    console.log('📊 Status:', response.status);

    if (response.status === 400 && result.includes('No signedPayload')) {
      console.log('✅ Webhook endpoint is working and correctly rejecting invalid data');
    } else {
      console.log('⚠️ Unexpected webhook response');
    }
  } catch (error) {
    console.error('❌ Webhook test failed:', error.message);
  }
}

async function testDatabaseFunctions() {
  console.log('\n🧪 Testing database functions...');
  
  try {
    // Test the main validation function with mock data
    const { data, error } = await supabase.rpc('complete_apple_subscription_validation', {
      p_user_id: TEST_USER.userId,
      p_transaction_id: `test_db_txn_${Date.now()}`,
      p_original_transaction_id: `test_db_orig_${Date.now()}`,
      p_product_id: 'pro_subscription_month',
      p_environment: 'sandbox',
      p_purchase_date: new Date().toISOString(),
      p_expiration_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    });

    if (error) {
      console.log('❌ Database function error (some errors expected with test data):', error.message);
    } else {
      console.log('✅ Database function executed successfully:', data);
    }

    // Test user lookup function
    const { data: userData, error: userError } = await supabase.rpc('find_user_by_apple_transaction', {
      p_original_transaction_id: 'non-existent-transaction'
    });

    if (userError) {
      console.log('❌ User lookup function error:', userError.message);
    } else {
      console.log('✅ User lookup function working:', userData === null ? 'correctly returns null for non-existent transaction' : userData);
    }

  } catch (error) {
    console.error('❌ Database function test failed:', error);
  }
}

async function checkSubscriptionStatus() {
  console.log('\n🧪 Checking subscription status...');
  
  try {
    const { data: subscription } = await supabase
      .from('pro_subscriptions')
      .select('*')
      .eq('user_id', TEST_USER.userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subscription) {
      console.log('✅ Found subscription:', {
        id: subscription.id,
        status: subscription.status,
        plan: subscription.plan,
        expirationDate: subscription.current_period_end
      });
    } else {
      console.log('📋 No subscription found for test user');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('pro')
      .eq('id', TEST_USER.userId)
      .single();

    if (profile) {
      console.log('✅ Profile pro status:', profile.pro);
    }
  } catch (error) {
    console.error('❌ Subscription status check failed:', error);
  }
}

async function runComprehensiveTest() {
  console.log('🚀 Starting comprehensive local purchase flow test...\n');
  
  await createTestUser();
  
  if (!TEST_USER.userId || !TEST_USER.accessToken) {
    console.error('❌ Could not set up test user. Exiting.');
    process.exit(1);
  }

  await testWebhookEndpoint();
  await testTransactionValidation();
  await testReceiptValidation();
  await testDatabaseFunctions();
  await checkSubscriptionStatus();
  
  console.log('\n🎉 Local testing completed!');
  console.log('\n💡 Next steps:');
  console.log('1. If all tests pass, deploy your fixes to production');
  console.log('2. Update the iOS app to call the correct endpoint URL');
  console.log('3. Test with real purchase in TestFlight');
  
  process.exit(0);
}

if (require.main === module) {
  runComprehensiveTest().catch(console.error);
}

module.exports = { runComprehensiveTest };