#!/usr/bin/env node

/**
 * Create a test active subscription for testing Pro features
 * This simulates what would happen with a current, active Apple subscription
 */

const { createClient } = require('@supabase/supabase-js');

// You'll need to provide these - check your environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || 'your-supabase-url';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key';

async function createActiveSubscription() {
  console.log('🧪 Creating test active subscription...');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  const userId = '11713c12-b3cc-4841-b2a2-4f10dbf3b250'; // Your user ID
  
  // Create subscription that's active for next 30 days
  const now = new Date();
  const futureExpiration = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days from now
  
  const testSubscription = {
    user_id: userId,
    status: 'active',
    current_period_start: now.toISOString(),
    current_period_end: futureExpiration.toISOString(),
    price_id: 'pro_subscription_month',
    plan: 'monthly',
    apple_transaction_id: `test_active_${Date.now()}`,
    apple_original_transaction_id: `test_active_${Date.now()}`,
    apple_environment: 'sandbox',
    receipt_validation_status: 'validated',
    transaction_finished_at: now.toISOString(),
    validation_attempts: 1
  };
  
  // Insert the test subscription
  const { data: subscription, error: subError } = await supabase
    .from('pro_subscriptions')
    .insert(testSubscription)
    .select()
    .single();
    
  if (subError) {
    console.error('❌ Failed to create subscription:', subError);
    return;
  }
  
  // Update profile to pro
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ 
      pro: 'yes',
      updated_at: now.toISOString()
    })
    .eq('id', userId);
    
  if (profileError) {
    console.error('❌ Failed to update profile:', profileError);
    return;
  }
  
  console.log('✅ Test active subscription created:', {
    subscriptionId: subscription.id,
    userId: userId,
    expiresAt: futureExpiration.toISOString(),
    status: 'active'
  });
  
  console.log('📱 Your app should now show Pro features unlocked!');
  console.log('🧹 Remember to clean this up later if needed.');
}

createActiveSubscription().catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});