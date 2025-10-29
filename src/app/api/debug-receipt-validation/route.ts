import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const APPLE_SANDBOX_URL = 'https://sandbox.itunes.apple.com/verifyReceipt';
const APPLE_PRODUCTION_URL = 'https://buy.itunes.apple.com/verifyReceipt';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 ENHANCED RECEIPT VALIDATION DEBUG');
    console.log('=====================================');
    
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Enhanced authentication logging
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log('🔐 Authentication Check:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      authError: authError?.message,
      timestamp: new Date().toISOString()
    });
    
    if (authError || !user) {
      return NextResponse.json({
        valid: false,
        error: 'Authentication required',
        debug: {
          step: 'authentication',
          authError: authError?.message,
          hasUser: !!user
        }
      }, { status: 401 });
    }

    const body = await request.json();
    const { userId, productId, receiptData, transactionId, environment } = body;

    console.log('📥 Receipt Validation Request:', {
      userId,
      productId,
      transactionId,
      environment,
      receiptDataLength: receiptData?.length,
      receiptDataSample: receiptData?.substring(0, 100) + '...',
      userIdMatch: userId === user.id,
      timestamp: new Date().toISOString()
    });

    // User ID verification
    if (userId !== user.id) {
      console.error('❌ User ID Mismatch:', { 
        authenticatedUserId: user.id, 
        requestUserId: userId 
      });
      return NextResponse.json({
        valid: false,
        error: 'User ID mismatch',
        debug: {
          step: 'user_verification',
          authenticatedUserId: user.id,
          requestUserId: userId
        }
      }, { status: 403 });
    }

    // Input validation
    if (!receiptData || !productId || !transactionId) {
      console.error('❌ Missing Required Fields:', {
        hasReceiptData: !!receiptData,
        hasProductId: !!productId,
        hasTransactionId: !!transactionId
      });
      return NextResponse.json({
        valid: false,
        error: 'Missing required fields',
        debug: {
          step: 'input_validation',
          hasReceiptData: !!receiptData,
          hasProductId: !!productId,
          hasTransactionId: !!transactionId
        }
      }, { status: 400 });
    }

    // Apple verification request
    const appleRequestBody = {
      'receipt-data': receiptData,
      'password': process.env.APPLE_SHARED_SECRET,
      'exclude-old-transactions': true
    };

    console.log('🍎 Apple Request Details:', {
      endpoint: environment === 'production' ? APPLE_PRODUCTION_URL : APPLE_SANDBOX_URL,
      hasSharedSecret: !!process.env.APPLE_SHARED_SECRET,
      sharedSecretLength: process.env.APPLE_SHARED_SECRET?.length,
      excludeOldTransactions: true,
      requestTimestamp: new Date().toISOString()
    });

    if (!process.env.APPLE_SHARED_SECRET) {
      console.error('❌ APPLE_SHARED_SECRET not configured');
      return NextResponse.json({
        valid: false,
        error: 'Server configuration error',
        debug: {
          step: 'configuration',
          hasAppleSharedSecret: false
        }
      }, { status: 500 });
    }

    // Determine Apple endpoint
    let appleEndpoint = environment === 'production' ? APPLE_PRODUCTION_URL : APPLE_SANDBOX_URL;
    
    console.log(`📡 Sending receipt to Apple ${environment} endpoint: ${appleEndpoint}`);

    // Send receipt to Apple
    const startTime = Date.now();
    let appleResponse: Response;
    let appleData: any;
    
    try {
      appleResponse = await fetch(appleEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appleRequestBody),
      });

      const responseTime = Date.now() - startTime;
      appleData = await appleResponse.json();
      
      console.log('📋 Apple Response:', {
        status: appleData.status,
        environment: appleData.environment,
        responseTime: `${responseTime}ms`,
        hasReceipt: !!appleData.receipt,
        hasLatestReceiptInfo: !!appleData.latest_receipt_info,
        receiptInfoLength: appleData.latest_receipt_info?.length || 0,
        bundleId: appleData.receipt?.bundle_id,
        timestamp: new Date().toISOString()
      });

      // Log first few transactions for debugging
      if (appleData.latest_receipt_info?.length > 0) {
        console.log('🧾 Transaction Details:', {
          firstTransaction: {
            productId: appleData.latest_receipt_info[0].product_id,
            transactionId: appleData.latest_receipt_info[0].transaction_id,
            originalTransactionId: appleData.latest_receipt_info[0].original_transaction_id,
            purchaseDate: appleData.latest_receipt_info[0].purchase_date_ms,
            expiresDate: appleData.latest_receipt_info[0].expires_date_ms
          },
          totalTransactions: appleData.latest_receipt_info.length
        });
      }

    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error('❌ Network error contacting Apple:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: `${responseTime}ms`,
        endpoint: appleEndpoint
      });
      return NextResponse.json({
        valid: false,
        error: 'Failed to contact Apple verification service',
        debug: {
          step: 'apple_network',
          error: error instanceof Error ? error.message : 'Unknown error',
          responseTime,
          endpoint: appleEndpoint
        }
      }, { status: 503 });
    }

    // Handle sandbox-to-production redirect (status 21007)
    if (appleData.status === 21007 && environment === 'production') {
      console.log('🔄 Redirecting to sandbox for validation (status 21007)');
      
      try {
        const sandboxStartTime = Date.now();
        appleResponse = await fetch(APPLE_SANDBOX_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(appleRequestBody),
        });

        const sandboxResponseTime = Date.now() - sandboxStartTime;
        appleData = await appleResponse.json();
        
        console.log('📋 Apple Sandbox Response:', {
          status: appleData.status,
          environment: appleData.environment,
          responseTime: `${sandboxResponseTime}ms`,
          redirectSuccess: appleData.status === 0
        });
        
      } catch (error) {
        console.error('❌ Network error contacting Apple sandbox:', error);
        return NextResponse.json({
          valid: false,
          error: 'Failed to contact Apple sandbox service',
          debug: {
            step: 'apple_sandbox',
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }, { status: 503 });
      }
    }

    // Check Apple's response status
    if (appleData.status !== 0) {
      const errorMessages: { [key: number]: string } = {
        21000: 'The App Store could not read the JSON object you provided',
        21002: 'The data in the receipt-data property was malformed or missing',
        21003: 'The receipt could not be authenticated',
        21004: 'The shared secret you provided does not match the shared secret on file',
        21005: 'The receipt server is not currently available',
        21006: 'This receipt is valid but the subscription has expired',
        21007: 'This receipt is from the sandbox environment but was sent to production',
        21008: 'This receipt is from the production environment but was sent to sandbox',
        21009: 'Internal data access error',
        21010: 'The user account cannot be found or has been deleted'
      };

      const errorMessage = errorMessages[appleData.status] || `Unknown error: ${appleData.status}`;
      
      console.error('❌ Apple receipt validation failed:', { 
        status: appleData.status, 
        error: errorMessage,
        environment: appleData.environment,
        receivedEnvironment: environment
      });

      return NextResponse.json({
        valid: false,
        error: errorMessage,
        debug: {
          step: 'apple_validation',
          appleStatus: appleData.status,
          appleEnvironment: appleData.environment,
          requestedEnvironment: environment,
          errorMessage
        }
      }, { status: 400 });
    }

    // Extract and analyze transaction info
    const receiptInfo = appleData.latest_receipt_info || 
                       (appleData.receipt?.in_app) ||
                       [];

    console.log('🔍 Transaction Search:', {
      totalTransactions: receiptInfo.length,
      searchingForTransactionId: transactionId,
      searchingForProductId: productId,
      availableTransactions: receiptInfo.map((t: any) => ({
        productId: t.product_id,
        transactionId: t.transaction_id,
        originalTransactionId: t.original_transaction_id
      }))
    });

    if (!Array.isArray(receiptInfo) || receiptInfo.length === 0) {
      console.error('❌ No transaction info found in receipt');
      return NextResponse.json({
        valid: false,
        error: 'No transaction information found in receipt',
        debug: {
          step: 'transaction_extraction',
          hasReceiptInfo: !!receiptInfo,
          receiptInfoType: typeof receiptInfo,
          receiptInfoLength: Array.isArray(receiptInfo) ? receiptInfo.length : 'not array'
        }
      }, { status: 400 });
    }

    // Find the specific transaction
    const matchingTransaction = receiptInfo.find((transaction: any) => 
      transaction.transaction_id === transactionId ||
      transaction.original_transaction_id === transactionId
    );

    if (!matchingTransaction) {
      console.error('❌ Transaction not found in receipt:', { 
        searchTransactionId: transactionId,
        availableTransactions: receiptInfo.map((t: any) => t.transaction_id)
      });
      return NextResponse.json({
        valid: false,
        error: 'Transaction not found in receipt',
        debug: {
          step: 'transaction_matching',
          searchTransactionId: transactionId,
          availableTransactions: receiptInfo.map((t: any) => ({
            transactionId: t.transaction_id,
            originalTransactionId: t.original_transaction_id,
            productId: t.product_id
          }))
        }
      }, { status: 400 });
    }

    console.log('✅ Transaction Found:', {
      productId: matchingTransaction.product_id,
      transactionId: matchingTransaction.transaction_id,
      originalTransactionId: matchingTransaction.original_transaction_id,
      purchaseDate: matchingTransaction.purchase_date_ms,
      expiresDate: matchingTransaction.expires_date_ms,
      isTrialPeriod: matchingTransaction.is_trial_period,
      isInIntroOfferPeriod: matchingTransaction.is_in_intro_offer_period
    });

    // Validate product ID matches
    if (matchingTransaction.product_id !== productId) {
      console.error('❌ Product ID mismatch:', { 
        expected: productId, 
        actual: matchingTransaction.product_id 
      });
      return NextResponse.json({
        valid: false,
        error: 'Product ID mismatch',
        debug: {
          step: 'product_validation',
          expectedProductId: productId,
          actualProductId: matchingTransaction.product_id
        }
      }, { status: 400 });
    }

    console.log('🎉 Receipt validation successful! All checks passed.');

    return NextResponse.json({
      valid: true,
      debug: {
        step: 'success',
        userId,
        productId,
        transactionId,
        environment: appleData.environment,
        appleStatus: appleData.status,
        transactionFound: true,
        productIdMatch: true
      },
      transactionDetails: {
        productId: matchingTransaction.product_id,
        transactionId: matchingTransaction.transaction_id,
        originalTransactionId: matchingTransaction.original_transaction_id,
        purchaseDate: matchingTransaction.purchase_date_ms,
        expiresDate: matchingTransaction.expires_date_ms
      }
    });

  } catch (error) {
    console.error('❌ Unexpected error during receipt validation:', error);
    return NextResponse.json({
      valid: false,
      error: 'Unexpected server error',
      debug: {
        step: 'unexpected_error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}