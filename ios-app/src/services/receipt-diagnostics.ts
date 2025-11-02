import { storeKitService } from './storekit';

/**
 * Receipt Diagnostics - Test receipt responsiveness in iOS app
 */

export interface ReceiptDiagnosticResult {
  testName: string;
  success: boolean;
  duration: number;
  details: any;
  recommendations: string[];
}

export class ReceiptDiagnostics {
  
  /**
   * Test receipt validation endpoint responsiveness
   */
  async testReceiptValidationSpeed(): Promise<ReceiptDiagnosticResult> {
    const startTime = Date.now();
    const testName = 'Receipt Validation Speed';
    
    try {
      console.log('🧪 Testing receipt validation endpoint speed...');
      
      // Mock receipt data for testing
      const mockReceiptData = 'mock_receipt_data_for_speed_testing_' + Date.now();
      const mockProductId = 'pro_subscription_month';
      const mockTransactionId = 'speed_test_' + Date.now();
      
      // Call the same validation method that real purchases use
      const result = await (storeKitService as any).validateReceiptWithServer(
        mockReceiptData,
        mockProductId,
        mockTransactionId
      );
      
      const duration = Date.now() - startTime;
      
      return {
        testName,
        success: true,
        duration,
        details: {
          validationResult: result,
          mockData: {
            receiptLength: mockReceiptData.length,
            productId: mockProductId,
            transactionId: mockTransactionId
          },
          endpointReachable: true,
          expectedFailure: !result.valid // Mock data should fail validation
        },
        recommendations: this.getSpeedRecommendations(duration)
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        testName,
        success: false,
        duration,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          networkIssue: error instanceof Error && error.message.includes('network'),
          timeoutIssue: error instanceof Error && error.message.includes('timeout')
        },
        recommendations: this.getErrorRecommendations(error)
      };
    }
  }
  
  /**
   * Test multiple receipt validations to check consistency
   */
  async testReceiptValidationConsistency(iterations: number = 3): Promise<ReceiptDiagnosticResult> {
    const testName = 'Receipt Validation Consistency';
    const results: Array<{duration: number; success: boolean}> = [];
    
    console.log(`🧪 Testing receipt validation consistency (${iterations} iterations)...`);
    
    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      
      try {
        const mockReceiptData = `mock_receipt_consistency_test_${i}_${Date.now()}`;
        const result = await (storeKitService as any).validateReceiptWithServer(
          mockReceiptData,
          'pro_subscription_month',
          `consistency_test_${i}_${Date.now()}`
        );
        
        const duration = Date.now() - startTime;
        results.push({ duration, success: true });
        
        console.log(`  Iteration ${i + 1}: ${duration}ms`);
        
        // Small delay between requests
        if (i < iterations - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error) {
        const duration = Date.now() - startTime;
        results.push({ duration, success: false });
        console.log(`  Iteration ${i + 1}: ${duration}ms (FAILED)`);
      }
    }
    
    const successfulResults = results.filter(r => r.success);
    const averageDuration = successfulResults.length > 0 
      ? successfulResults.reduce((sum, r) => sum + r.duration, 0) / successfulResults.length
      : 0;
    
    const maxDuration = Math.max(...results.map(r => r.duration));
    const minDuration = Math.min(...results.map(r => r.duration));
    
    return {
      testName,
      success: successfulResults.length > 0,
      duration: averageDuration,
      details: {
        iterations,
        successfulRequests: successfulResults.length,
        failedRequests: results.length - successfulResults.length,
        averageDuration: Math.round(averageDuration),
        minDuration,
        maxDuration,
        variance: this.calculateVariance(successfulResults.map(r => r.duration)),
        allResults: results
      },
      recommendations: this.getConsistencyRecommendations(results, averageDuration)
    };
  }
  
  /**
   * Test the purchase timeout behavior
   */
  async testPurchaseTimeoutBehavior(): Promise<ReceiptDiagnosticResult> {
    const testName = 'Purchase Timeout Behavior';
    
    try {
      console.log('🧪 Testing purchase timeout behavior...');
      
      // Check current timeout settings
      const timeoutSettings = {
        purchaseTimeout: 60000, // From storekit.ts line 225
        retryAttempts: 6, // From storekit.ts MAX_RECEIPT_VALIDATION_ATTEMPTS
        maxRetryDelay: 30000, // From storekit.ts MAX_RETRY_DELAY_MS
        baseRetryDelay: 1000 // From storekit.ts BASE_RETRY_DELAY_MS
      };
      
      return {
        testName,
        success: true,
        duration: 0,
        details: {
          currentSettings: timeoutSettings,
          totalMaxWaitTime: timeoutSettings.purchaseTimeout + (timeoutSettings.maxRetryDelay * timeoutSettings.retryAttempts),
          recommendedSettings: {
            purchaseTimeout: 90000, // Increase to 90s
            retryAttempts: 6, // Keep same
            maxRetryDelay: 30000, // Keep same
            baseRetryDelay: 2000 // Increase initial delay
          }
        },
        recommendations: [
          'Consider increasing purchase timeout from 60s to 90s',
          'Monitor Apple endpoint health regularly',
          'Implement user-friendly timeout messages',
          'Consider background receipt validation for poor connections'
        ]
      };
      
    } catch (error) {
      return {
        testName,
        success: false,
        duration: 0,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        recommendations: ['Fix timeout configuration issues before testing']
      };
    }
  }
  
  /**
   * Test environment detection accuracy
   */
  async testEnvironmentDetection(): Promise<ReceiptDiagnosticResult> {
    const testName = 'Environment Detection';
    
    try {
      const isDev = __DEV__;
      const isSimulator = storeKitService.isSimulator();
      const detectedEnvironment = isDev || isSimulator ? 'sandbox' : 'production';
      
      return {
        testName,
        success: true,
        duration: 0,
        details: {
          isDevelopment: isDev,
          isSimulator,
          detectedEnvironment,
          shouldUseSandbox: detectedEnvironment === 'sandbox',
          appleEndpoint: detectedEnvironment === 'sandbox' 
            ? 'https://sandbox.itunes.apple.com/verifyReceipt'
            : 'https://buy.itunes.apple.com/verifyReceipt'
        },
        recommendations: [
          `Environment detected as: ${detectedEnvironment}`,
          detectedEnvironment === 'sandbox' 
            ? 'Use sandbox Apple ID for testing'
            : 'Use production Apple ID',
          'Verify this matches your testing intention'
        ]
      };
      
    } catch (error) {
      return {
        testName,
        success: false,
        duration: 0,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        recommendations: ['Fix environment detection logic']
      };
    }
  }
  
  private getSpeedRecommendations(duration: number): string[] {
    const recommendations: string[] = [];
    
    if (duration < 1000) {
      recommendations.push('✅ Excellent response time - current settings optimal');
    } else if (duration < 3000) {
      recommendations.push('✅ Good response time - current settings should work');
    } else if (duration < 5000) {
      recommendations.push('⚠️ Moderate response time - consider user messaging');
      recommendations.push('Show "Validating purchase..." message to user');
    } else if (duration < 10000) {
      recommendations.push('⚠️ Slow response time - increase timeout to 90s');
      recommendations.push('Implement retry logic with exponential backoff');
    } else {
      recommendations.push('❌ Very slow response time - critical issue');
      recommendations.push('Increase timeout to 120s minimum');
      recommendations.push('Consider background receipt validation');
      recommendations.push('Check network connectivity and Apple service status');
    }
    
    return recommendations;
  }
  
  private getErrorRecommendations(error: any): string[] {
    const recommendations: string[] = [];
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
      recommendations.push('❌ Network connectivity issue detected');
      recommendations.push('Check internet connection');
      recommendations.push('Test on different network if possible');
      recommendations.push('Consider implementing offline queue for receipts');
    } else if (errorMessage.includes('401') || errorMessage.includes('authentication')) {
      recommendations.push('❌ Authentication issue detected');
      recommendations.push('Re-login to the app');
      recommendations.push('Check Supabase session validity');
    } else if (errorMessage.includes('500') || errorMessage.includes('server')) {
      recommendations.push('❌ Server error detected');
      recommendations.push('Check backend API status');
      recommendations.push('Verify environment variables are set');
    } else {
      recommendations.push('❌ Unknown error occurred');
      recommendations.push('Check console logs for more details');
      recommendations.push('Contact support if issue persists');
    }
    
    return recommendations;
  }
  
  private getConsistencyRecommendations(results: Array<{duration: number; success: boolean}>, averageDuration: number): string[] {
    const recommendations: string[] = [];
    const successRate = results.filter(r => r.success).length / results.length;
    
    if (successRate < 0.5) {
      recommendations.push('❌ Poor consistency - less than 50% success rate');
      recommendations.push('Check network stability');
      recommendations.push('Consider implementing circuit breaker pattern');
    } else if (successRate < 0.8) {
      recommendations.push('⚠️ Moderate consistency - some failures detected');
      recommendations.push('Implement retry logic');
      recommendations.push('Monitor Apple service status');
    } else {
      recommendations.push('✅ Good consistency - most requests successful');
    }
    
    const durations = results.filter(r => r.success).map(r => r.duration);
    if (durations.length > 1) {
      const variance = this.calculateVariance(durations);
      const stdDev = Math.sqrt(variance);
      
      if (stdDev > averageDuration * 0.5) {
        recommendations.push('⚠️ High response time variance detected');
        recommendations.push('Apple endpoints showing inconsistent performance');
        recommendations.push('Consider adaptive timeout based on recent performance');
      }
    }
    
    return recommendations;
  }
  
  private calculateVariance(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    
    const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
    const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));
    return squaredDiffs.reduce((sum, sq) => sum + sq, 0) / numbers.length;
  }
}

export const receiptDiagnostics = new ReceiptDiagnostics();