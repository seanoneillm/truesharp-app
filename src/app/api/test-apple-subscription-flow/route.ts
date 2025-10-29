import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(_request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Test 1: Environment Variables Check
    const envCheck = {
      apple_shared_secret: !!process.env.APPLE_SHARED_SECRET,
      apple_shared_secret_length: process.env.APPLE_SHARED_SECRET?.length || 0,
      supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabase_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabase_service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      node_env: process.env.NODE_ENV
    };

    // Test 2: Database Connection & Structure
    let dbStructureCheck: any = {};
    try {
      const { data: tableInfo, error: tableError } = await supabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_name', 'pro_subscriptions');

      const columns = tableInfo?.map(col => col.column_name) || [];
      
      dbStructureCheck = {
        database_connected: !tableError,
        has_apple_transaction_id: columns.includes('apple_transaction_id'),
        has_apple_receipt_data: columns.includes('apple_receipt_data'),
        has_user_id: columns.includes('user_id'),
        has_status: columns.includes('status'),
        has_plan: columns.includes('plan'),
        all_columns: columns
      };
    } catch (dbError) {
      dbStructureCheck = {
        database_connected: false,
        error: dbError instanceof Error ? dbError.message : 'Unknown database error'
      };
    }

    // Test 3: Apple Receipt Validation Endpoint Accessibility
    let appleEndpointCheck = {};
    try {
      // Test sandbox endpoint
      const sandboxResponse = await fetch('https://sandbox.itunes.apple.com/verifyReceipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          'receipt-data': 'test',
          'password': process.env.APPLE_SHARED_SECRET || 'test'
        })
      });
      
      const sandboxData = await sandboxResponse.json();
      
      appleEndpointCheck = {
        sandbox_reachable: true,
        sandbox_status: sandboxData.status,
        sandbox_response_type: typeof sandboxData
      };
    } catch (appleError) {
      appleEndpointCheck = {
        sandbox_reachable: false,
        error: appleError instanceof Error ? appleError.message : 'Network error'
      };
    }

    // Test 4: Authentication Context
    let authCheck = {};
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      authCheck = {
        auth_working: !authError,
        user_authenticated: !!user,
        user_id: user?.id || null,
        auth_error: authError?.message || null
      };
    } catch (authErr) {
      authCheck = {
        auth_working: false,
        error: authErr instanceof Error ? authErr.message : 'Auth system error'
      };
    }

    return NextResponse.json({
      test_timestamp: new Date().toISOString(),
      test_results: {
        environment_variables: envCheck,
        database_structure: dbStructureCheck,
        apple_endpoints: appleEndpointCheck,
        authentication: authCheck
      },
      summary: {
        ready_for_testing: 
          envCheck.apple_shared_secret && 
          envCheck.supabase_service_key && 
          dbStructureCheck.database_connected &&
          dbStructureCheck.has_apple_transaction_id,
        critical_issues: [
          !envCheck.apple_shared_secret && 'Missing APPLE_SHARED_SECRET',
          !envCheck.supabase_service_key && 'Missing SUPABASE_SERVICE_ROLE_KEY',
          !dbStructureCheck.has_apple_transaction_id && 'Missing apple_transaction_id column',
          !dbStructureCheck.database_connected && 'Database connection failed'
        ].filter(Boolean)
      }
    });

  } catch (error) {
    console.error('❌ Test endpoint error:', error);
    return NextResponse.json({
      error: 'Test endpoint failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await request.json();
    const { testType, testData } = body;

    switch (testType) {
      case 'mock_receipt_validation':
        return await testMockReceiptValidation(supabase, testData);
      
      case 'database_subscription_creation':
        return await testDatabaseSubscriptionCreation(supabase, testData);
      
      case 'auth_token_validation':
        return await testAuthTokenValidation(supabase, testData);
        
      default:
        return NextResponse.json({ error: 'Unknown test type' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({
      error: 'POST test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function testMockReceiptValidation(_supabase: any, testData: any) {
  // Test the receipt validation flow with mock data
  const mockReceiptData = testData.receiptData || 'mock_receipt_data_for_testing';
  const mockProductId = testData.productId || 'pro_subscription_month';
  const mockTransactionId = testData.transactionId || 'mock_transaction_' + Date.now();
  
  try {
    // Simulate the Apple receipt validation call our endpoint makes
    const response = await fetch('https://sandbox.itunes.apple.com/verifyReceipt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        'receipt-data': mockReceiptData,
        'password': process.env.APPLE_SHARED_SECRET,
        'exclude-old-transactions': true
      })
    });

    const appleResponse = await response.json();
    
    return NextResponse.json({
      test: 'mock_receipt_validation',
      success: true,
      apple_response: {
        status: appleResponse.status,
        reachable: true,
        expected_error: appleResponse.status !== 0 // Mock data should fail
      },
      test_data_used: {
        productId: mockProductId,
        transactionId: mockTransactionId,
        receiptDataLength: mockReceiptData.length
      }
    });
  } catch (error) {
    return NextResponse.json({
      test: 'mock_receipt_validation',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function testDatabaseSubscriptionCreation(supabase: any, testData: any) {
  // Test creating a subscription record (will rollback)
  const mockSubscription = {
    user_id: testData.userId || '00000000-0000-0000-0000-000000000000',
    stripe_subscription_id: null,
    stripe_customer_id: null,
    status: 'active',
    plan: 'monthly',
    current_period_start: new Date().toISOString(),
    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    price_id: 'pro_subscription_month',
    apple_transaction_id: 'test_transaction_' + Date.now(),
    apple_receipt_data: 'test_receipt_data_for_testing'
  };

  try {
    // Test insert (will likely fail due to foreign key constraints, but tests structure)
    const { data, error } = await supabase
      .from('pro_subscriptions')
      .insert(mockSubscription)
      .select();

    if (error) {
      // Expected - likely foreign key constraint
      return NextResponse.json({
        test: 'database_subscription_creation',
        structure_test: true,
        insert_attempted: true,
        expected_error: error.message,
        table_accessible: true,
        columns_compatible: !error.message.includes('column') || !error.message.includes('does not exist')
      });
    } else {
      // Unexpected success - cleanup
      if (data && data[0]) {
        await supabase
          .from('pro_subscriptions')
          .delete()
          .eq('id', data[0].id);
      }
      
      return NextResponse.json({
        test: 'database_subscription_creation',
        structure_test: true,
        insert_successful: true,
        cleaned_up: true
      });
    }
  } catch (dbError) {
    return NextResponse.json({
      test: 'database_subscription_creation',
      structure_test: false,
      error: dbError instanceof Error ? dbError.message : 'Database error'
    });
  }
}

async function testAuthTokenValidation(supabase: any, testData: any) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({
        test: 'auth_token_validation',
        authenticated: false,
        error: authError?.message || 'No user found',
        suggestion: 'Test this endpoint with a valid Authorization header'
      });
    }

    // Test user ID validation (what the real endpoint does)
    const testUserId = testData.userId || user.id;
    const userIdMatch = testUserId === user.id;

    return NextResponse.json({
      test: 'auth_token_validation',
      authenticated: true,
      user_id: user.id,
      user_email: user.email,
      user_id_match: userIdMatch,
      auth_flow_working: true
    });
  } catch (authErr) {
    return NextResponse.json({
      test: 'auth_token_validation',
      authenticated: false,
      error: authErr instanceof Error ? authErr.message : 'Auth error'
    });
  }
}