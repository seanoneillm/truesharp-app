/**
 * StoreKit Testing Utilities for iOS App Development
 *
 * USAGE INSTRUCTIONS:
 *
 * 1. Open iOS Simulator or connect iOS device
 * 2. In your app's debug menu or developer settings, add:
 *
 *    import { storeKitTestSuite } from '../test-storekit';
 *
 *    // Add a test button in your development menu:
 *    <Button title="Test StoreKit" onPress={runStoreKitTests} />
 *
 *    async function runStoreKitTests() {
 *      const results = await storeKitTestSuite.runAllTests();
 *      console.log('StoreKit Test Results:', results);
 *
 *      // Show results in alert or log them
 *      const passed = results.filter(r => r.success).length;
 *      Alert.alert('Tests Complete', `${passed}/${results.length} tests passed`);
 *    }
 *
 * 2. Run individual tests:
 *    await storeKitTestSuite.testStoreKitInitialization();
 *    await storeKitTestSuite.testProductRetrieval();
 *    await storeKitTestSuite.testMockPurchaseFlow(); // Simulator only
 *
 * 3. Test real purchase flow:
 *    - Use TestFlight build with sandbox Apple ID
 *    - Or use development build on physical device
 *    - Test through your existing UpgradeToProModal
 */

import { storeKitTestSuite } from './src/services/storekit-test'

// Quick test runner function - add this to your debug menu
export async function runQuickStoreKitTest() {
  console.log('🧪 Running Quick StoreKit Test...')

  try {
    const results = await storeKitTestSuite.runAllTests()

    const passed = results.filter(r => r.success).length
    const total = results.length

    console.log(`✅ StoreKit Tests: ${passed}/${total} passed`)

    results.forEach(result => {
      const icon = result.success ? '✅' : '❌'
      console.log(`${icon} ${result.testName}: ${result.message}`)
      if (result.error) console.error(`   Error: ${result.error}`)
    })

    return { passed, total, results }
  } catch (error) {
    console.error('❌ StoreKit test runner failed:', error)
    return { passed: 0, total: 0, results: [], error }
  }
}

// Test mock purchase (simulator only)
export async function runMockPurchaseTest() {
  console.log('🛒 Testing Mock Purchase...')

  try {
    const result = await storeKitTestSuite.testMockPurchaseFlow()

    console.log(result.success ? '✅ Mock Purchase Success' : '❌ Mock Purchase Failed')
    console.log(`   ${result.message}`)
    if (result.data) console.log('   Data:', result.data)
    if (result.error) console.error('   Error:', result.error)

    return result
  } catch (error) {
    console.error('❌ Mock purchase test failed:', error)
    return { success: false, message: 'Test failed', error }
  }
}

// Export the test suite for direct access
export { storeKitTestSuite }

// Utility functions for testing StoreKit in your iOS app development
