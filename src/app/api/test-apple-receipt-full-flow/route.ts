import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Hard-coded test user ID
const TEST_USER_ID = '11713c12-b3cc-4841-b2a2-4f10dbf3b250';

export async function POST(_request: NextRequest) {
  try {
    console.log('🧪 Starting full Apple receipt flow test with hard-coded user');
    
    // Create admin Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Mock receipt data that would come from iOS
    const mockReceiptData = 'test_receipt_' + Date.now();
    const mockTransactionId = 'test_transaction_' + Date.now();
    const mockProductId = 'pro_subscription_month';

    console.log('📋 Test data:', {
      userId: TEST_USER_ID,
      productId: mockProductId,
      transactionId: mockTransactionId
    });

    // Step 1: Verify user exists
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id, username, email, pro')
      .eq('id', TEST_USER_ID)
      .single();

    if (userError || !userData) {
      return NextResponse.json({
        success: false,
        step: 'user_verification',
        error: 'Test user not found',
        userId: TEST_USER_ID
      }, { status: 404 });
    }

    console.log('✅ User found:', userData);

    // Step 2: Check if user already has active subscription
    const { data: existingSubscription } = await supabase
      .from('pro_subscriptions')
      .select('*')
      .eq('user_id', TEST_USER_ID)
      .eq('status', 'active')
      .single();

    if (existingSubscription) {
      console.log('⚠️ User already has active subscription:', existingSubscription);
      
      return NextResponse.json({
        success: true,
        step: 'already_subscribed',
        message: 'User already has active Pro subscription',
        subscription: existingSubscription,
        user: userData
      });
    }

    // Step 3: Create subscription record (simulating successful Apple receipt validation)
    const currentPeriodStart = new Date();
    const currentPeriodEnd = new Date();
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1); // 1 month from now

    const subscriptionData = {
      user_id: TEST_USER_ID,
      stripe_subscription_id: null, // Apple purchase - no Stripe
      stripe_customer_id: null,
      status: 'active',
      plan: 'monthly',
      current_period_start: currentPeriodStart.toISOString(),
      current_period_end: currentPeriodEnd.toISOString(),
      price_id: mockProductId,
      apple_transaction_id: mockTransactionId,
      apple_receipt_data: mockReceiptData.substring(0, 500) // Store first 500 chars for audit
    };

    console.log('💳 Creating subscription:', subscriptionData);

    const { data: newSubscription, error: subscriptionError } = await supabase
      .from('pro_subscriptions')
      .insert(subscriptionData)
      .select()
      .single();

    if (subscriptionError) {
      console.error('❌ Failed to create subscription:', subscriptionError);
      return NextResponse.json({
        success: false,
        step: 'subscription_creation',
        error: subscriptionError.message,
        subscriptionData
      }, { status: 500 });
    }

    console.log('✅ Subscription created:', newSubscription);

    // Step 4: Update user profile to pro status
    const { data: updatedProfile, error: profileError } = await supabase
      .from('profiles')
      .update({ pro: 'yes' })
      .eq('id', TEST_USER_ID)
      .select()
      .single();

    if (profileError) {
      console.error('❌ Failed to update profile:', profileError);
      // Don't fail the whole flow for this
    } else {
      console.log('✅ Profile updated to pro status:', updatedProfile);
    }

    // Step 5: Verify subscription is active
    const { data: verificationSubscription } = await supabase
      .from('pro_subscriptions')
      .select('*')
      .eq('user_id', TEST_USER_ID)
      .eq('status', 'active')
      .single();

    const { data: verificationProfile } = await supabase
      .from('profiles')
      .select('id, username, email, pro')
      .eq('id', TEST_USER_ID)
      .single();

    return NextResponse.json({
      success: true,
      step: 'complete',
      message: '🎉 Successfully subscribed user to Pro!',
      results: {
        user: {
          before: userData,
          after: verificationProfile
        },
        subscription: {
          id: newSubscription.id,
          plan: newSubscription.plan,
          status: newSubscription.status,
          current_period_start: newSubscription.current_period_start,
          current_period_end: newSubscription.current_period_end,
          apple_transaction_id: newSubscription.apple_transaction_id
        },
        verification: {
          hasActiveSubscription: !!verificationSubscription,
          proStatus: verificationProfile?.pro === 'yes'
        }
      },
      testData: {
        mockTransactionId,
        mockReceiptData: mockReceiptData.substring(0, 50) + '...',
        mockProductId
      }
    });

  } catch (error) {
    console.error('❌ Full flow test failed:', error);
    return NextResponse.json({
      success: false,
      step: 'unexpected_error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest) {
  try {
    console.log('🧹 Cleaning up test subscription for user:', TEST_USER_ID);
    
    // Create admin Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Remove pro status from profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ pro: null })
      .eq('id', TEST_USER_ID);

    if (profileError) {
      console.error('⚠️ Failed to remove pro status:', profileError);
    } else {
      console.log('✅ Removed pro status from profile');
    }

    // Delete test subscriptions
    const { data: deletedSubscriptions, error: deleteError } = await supabase
      .from('pro_subscriptions')
      .delete()
      .eq('user_id', TEST_USER_ID)
      .eq('stripe_subscription_id', null) // Only delete Apple subscriptions (test ones)
      .select();

    if (deleteError) {
      console.error('❌ Failed to delete subscriptions:', deleteError);
      return NextResponse.json({
        success: false,
        error: deleteError.message
      }, { status: 500 });
    }

    console.log(`✅ Deleted ${deletedSubscriptions?.length || 0} test subscriptions`);

    return NextResponse.json({
      success: true,
      message: 'Test subscription cleanup complete',
      deletedSubscriptions: deletedSubscriptions?.length || 0,
      userId: TEST_USER_ID
    });

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(_request: NextRequest) {
  try {
    // Check current status of test user
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, email, pro')
      .eq('id', TEST_USER_ID)
      .single();

    const { data: subscriptions } = await supabase
      .from('pro_subscriptions')
      .select('*')
      .eq('user_id', TEST_USER_ID)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      userId: TEST_USER_ID,
      profile,
      subscriptions,
      currentStatus: {
        hasProfile: !!profile,
        proStatus: profile?.pro,
        activeSubscriptions: subscriptions?.filter(s => s.status === 'active').length || 0,
        totalSubscriptions: subscriptions?.length || 0
      }
    });

  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}