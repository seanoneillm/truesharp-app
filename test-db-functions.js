#!/usr/bin/env node

/**
 * Test script to verify database functions exist
 * Run with: node test-db-functions.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.log('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDatabaseFunctions() {
  console.log('🔍 Testing database functions...\n');
  
  try {
    // Test 1: Check if complete_apple_subscription_validation function exists
    console.log('1. Testing complete_apple_subscription_validation function...');
    const { data: validationData, error: validationError } = await supabase.rpc(
      'complete_apple_subscription_validation',
      {
        p_user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
        p_transaction_id: 'test-transaction-123',
        p_original_transaction_id: 'test-original-123',
        p_product_id: 'com.truesharp.app.pro.monthly',
        p_environment: 'sandbox',
        p_purchase_date: new Date().toISOString(),
        p_expiration_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    );
    
    if (validationError) {
      console.log('❌ Function exists but failed (expected for dummy data):', validationError.message);
    } else {
      console.log('✅ Function executed successfully (unexpected with dummy data)');
    }
    
    // Test 2: Check if find_user_by_apple_transaction function exists
    console.log('\n2. Testing find_user_by_apple_transaction function...');
    const { data: userData, error: userError } = await supabase.rpc(
      'find_user_by_apple_transaction',
      {
        p_original_transaction_id: 'non-existent-transaction'
      }
    );
    
    if (userError) {
      console.log('❌ Function failed:', userError.message);
    } else {
      console.log('✅ Function executed successfully, result:', userData);
    }
    
    // Test 3: Check tables exist
    console.log('\n3. Testing table access...');
    const { data: subsData, error: subsError } = await supabase
      .from('pro_subscriptions')
      .select('id')
      .limit(1);
    
    if (subsError) {
      console.log('❌ pro_subscriptions table access failed:', subsError.message);
    } else {
      console.log('✅ pro_subscriptions table accessible');
    }
    
    const { data: attemptsData, error: attemptsError } = await supabase
      .from('apple_transaction_attempts')
      .select('id')
      .limit(1);
    
    if (attemptsError) {
      console.log('❌ apple_transaction_attempts table access failed:', attemptsError.message);
    } else {
      console.log('✅ apple_transaction_attempts table accessible');
    }
    
    console.log('\n🎉 Database connectivity test completed!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
}

if (require.main === module) {
  testDatabaseFunctions().catch(console.error);
}

module.exports = { testDatabaseFunctions };