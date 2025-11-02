# 🧪 iOS IAP Testing Guide - App Store Server API

## Testing Strategy Overview

Testing modern iOS IAP requires a multi-stage approach:
1. **Local Development** (Simulator + Mock)
2. **Sandbox Testing** (TestFlight + Sandbox Users)
3. **Production Validation** (Real App Store)

---

## 🏗️ Stage 1: Local Development Testing

### **Setup Mock Testing Environment**

```typescript
// ios-app/src/services/__tests__/storekit-test.ts
import { modernStoreKitService } from '../modern-storekit'

describe('StoreKit Service', () => {
  beforeEach(() => {
    // Reset service state
    modernStoreKitService.reset()
  })

  test('should initialize successfully in test environment', async () => {
    const result = await modernStoreKitService.initialize()
    expect(result).toBe(true)
  })

  test('should handle mock purchase flow', async () => {
    await modernStoreKitService.initialize()
    
    const result = await modernStoreKitService.purchaseSubscription('pro_subscription_month')
    
    expect(result.success).toBe(true)
    expect(result.serverValidated).toBe(true)
    expect(result.transactionId).toMatch(/^dev_txn_/)
  })
})
```

### **Backend API Testing**

```bash
# Test JWT generation
curl -X POST http://localhost:3000/api/test-jwt \
  -H "Content-Type: application/json" \
  -d '{
    "keyId": "YOUR_KEY_ID",
    "issuerId": "YOUR_ISSUER_ID",
    "bundleId": "com.truesharp.app"
  }'

# Test transaction validation endpoint
curl -X POST http://localhost:3000/api/validate-apple-transaction \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_JWT" \
  -d '{
    "userId": "test-user-id",
    "transactionId": "test-transaction-id",
    "originalTransactionId": "test-original-id",
    "productId": "pro_subscription_month"
  }'
```

---

## 🧪 Stage 2: Sandbox Testing

### **2.1 Sandbox Account Setup**

1. **Create Sandbox Test Users**:
   - Go to App Store Connect → Users and Access → Sandbox
   - Create test accounts with different countries/regions
   - Use unique email addresses (e.g., `test+ios1@truesharp.io`)

2. **Device Configuration**:
   ```bash
   # Sign out of production App Store on test device
   Settings → App Store → Sign Out
   
   # Install TestFlight build
   # Sign in with sandbox test account when prompted for first purchase
   ```

### **2.2 Sandbox Testing Checklist**

#### **Purchase Flow Testing**
- [ ] **Test initial subscription purchase**
  - Verify purchase dialog appears
  - Confirm sandbox pricing shows
  - Check server validation succeeds
  - Verify database records created

- [ ] **Test purchase cancellation**
  - Cancel during purchase flow
  - Verify no charges or database changes
  - Check error handling

- [ ] **Test network failure scenarios**
  - Disconnect internet during purchase
  - Verify purchase completes when reconnected
  - Check retry logic works

#### **Subscription Management Testing**
- [ ] **Test subscription renewal**
  - Wait for auto-renewal (accelerated in sandbox)
  - Verify webhook receives renewal notification
  - Check database updates correctly

- [ ] **Test subscription expiration**
  - Let subscription expire
  - Verify access is revoked
  - Check expiration handling

- [ ] **Test restore purchases**
  - Delete and reinstall app
  - Restore purchases with same sandbox account
  - Verify subscription status restored

#### **Edge Case Testing**
- [ ] **Test duplicate transaction handling**
  - Attempt to validate same transaction twice
  - Verify idempotent behavior

- [ ] **Test invalid transaction IDs**
  - Send non-existent transaction ID
  - Verify proper error handling

- [ ] **Test cross-environment scenarios**
  - Production transaction in sandbox (should fail gracefully)
  - Invalid JWT tokens

### **2.3 Sandbox Testing Scripts**

```bash
#!/bin/bash
# sandbox-test-suite.sh

echo "🧪 Starting Sandbox Test Suite"

# Test 1: JWT Generation
echo "Testing JWT generation..."
RESPONSE=$(curl -s -X POST https://truesharp.io/api/test-jwt \
  -H "Content-Type: application/json" \
  -d "{\"test\": true}")

if [[ $RESPONSE == *"token"* ]]; then
  echo "✅ JWT generation working"
else
  echo "❌ JWT generation failed"
  exit 1
fi

# Test 2: Webhook Endpoint
echo "Testing webhook endpoint..."
WEBHOOK_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST https://truesharp.io/api/apple-webhooks \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook"}')

if [[ $WEBHOOK_RESPONSE == "200" ]]; then
  echo "✅ Webhook endpoint accessible"
else
  echo "❌ Webhook endpoint failed: $WEBHOOK_RESPONSE"
fi

# Test 3: Database Connection
echo "Testing database operations..."
# Add your database test here

echo "🎉 Sandbox test suite completed"
```

---

## 🚀 Stage 3: Production Testing

### **3.1 Pre-Production Checklist**

#### **Environment Verification**
- [ ] **Verify production environment variables**
  ```bash
  # Check all required env vars are set
  echo "API Key ID: ${APPLE_API_KEY_ID:0:4}..."
  echo "Issuer ID: ${APPLE_ISSUER_ID:0:8}..."
  echo "Bundle ID: $APPLE_BUNDLE_ID"
  ```

- [ ] **Test production API connectivity**
  ```bash
  # Test production App Store Server API
  curl -H "Authorization: Bearer $PRODUCTION_JWT" \
       https://api.storekit.itunes.apple.com/inApps/v1/history/DUMMY_ID
  ```

#### **Webhook Configuration**
- [ ] **Verify webhook URL is accessible**
- [ ] **Test webhook with Apple's test notifications**
- [ ] **Configure webhook retry logic**

### **3.2 Production Testing Strategy**

#### **Limited Production Testing**
1. **Internal Team Testing**:
   - Use real Apple IDs (not sandbox)
   - Test with actual payment methods
   - Verify real money transactions work

2. **Beta User Testing**:
   - Release to limited TestFlight group
   - Monitor server logs for validation failures
   - Check webhook notification processing

#### **Production Monitoring**

```typescript
// monitoring/app-store-api-health.ts
export async function checkAppStoreAPIHealth() {
  const healthChecks = [
    {
      name: 'JWT Generation',
      test: () => generateAppStoreAPIToken()
    },
    {
      name: 'API Connectivity',
      test: () => testAppStoreAPIConnection()
    },
    {
      name: 'Webhook Endpoint',
      test: () => testWebhookEndpoint()
    },
    {
      name: 'Database Connection',
      test: () => testDatabaseConnection()
    }
  ]

  const results = await Promise.allSettled(
    healthChecks.map(async check => {
      try {
        await check.test()
        return { name: check.name, status: 'healthy' }
      } catch (error) {
        return { 
          name: check.name, 
          status: 'unhealthy', 
          error: error.message 
        }
      }
    })
  )

  return results.map(result => 
    result.status === 'fulfilled' ? result.value : result.reason
  )
}
```

---

## 🔍 Debugging Common Issues

### **Issue 1: "Transaction not found in any environment"**

**Symptoms**: Server validation fails with transaction not found error

**Debugging Steps**:
```bash
# 1. Verify transaction ID format
echo "Transaction ID: $TRANSACTION_ID"
echo "Length: ${#TRANSACTION_ID}"

# 2. Check both environments manually
curl -H "Authorization: Bearer $JWT" \
     https://api.storekit.itunes.apple.com/inApps/v1/transactions/$TRANSACTION_ID

curl -H "Authorization: Bearer $JWT" \
     https://api.storekit-sandbox.itunes.apple.com/inApps/v1/transactions/$TRANSACTION_ID

# 3. Check JWT token validity
node -e "
const jwt = require('jsonwebtoken');
try {
  const decoded = jwt.decode('$JWT', { complete: true });
  console.log('JWT Header:', decoded.header);
  console.log('JWT Payload:', decoded.payload);
} catch(e) {
  console.error('Invalid JWT:', e.message);
}
"
```

### **Issue 2: Webhook notifications not received**

**Debugging Steps**:
```bash
# 1. Test webhook URL accessibility
curl -X POST https://truesharp.io/api/apple-webhooks \
     -H "Content-Type: application/json" \
     -d '{"test": "manual"}'

# 2. Check webhook logs
tail -f /var/log/webhook.log

# 3. Verify App Store Connect configuration
# Go to App Store Connect → App Information → App Store Server Notifications
```

### **Issue 3: JWT authentication failures**

**Common Causes & Solutions**:
1. **Incorrect Key ID**: Double-check against App Store Connect
2. **Wrong Algorithm**: Must use ES256, not RS256
3. **Expired Token**: Regenerate with proper expiration time
4. **Invalid Private Key Format**: Ensure proper PEM formatting

---

## 📊 Test Result Validation

### **Expected Test Results**

#### **Successful Purchase Flow**
```json
{
  "success": true,
  "productId": "pro_subscription_month",
  "transactionId": "1000000123456789",
  "originalTransactionId": "1000000123456789",
  "serverValidated": true
}
```

#### **Successful Server Validation**
```json
{
  "valid": true,
  "subscription": {
    "id": "sub_xyz123",
    "plan": "monthly",
    "isActive": true,
    "expirationDate": "2024-12-01T10:30:00Z"
  },
  "meta": {
    "validationTime": 245
  }
}
```

#### **Database Records**
```sql
-- Check subscription was created
SELECT * FROM pro_subscriptions 
WHERE apple_transaction_id = 'your_transaction_id';

-- Verify user profile updated
SELECT pro FROM profiles 
WHERE id = 'your_user_id';
```

---

## ⚡ Automated Testing Scripts

```bash
#!/bin/bash
# comprehensive-iap-test.sh

set -e

echo "🚀 Starting Comprehensive IAP Testing"

# Configuration
API_BASE="https://truesharp.io/api"
TEST_USER_ID="test-user-$(date +%s)"
TEST_TRANSACTION_ID="test-txn-$(date +%s)"

# Test 1: Environment Check
echo "1️⃣ Testing environment variables..."
if [[ -z "$APPLE_API_KEY_ID" ]]; then
  echo "❌ APPLE_API_KEY_ID not set"
  exit 1
fi
echo "✅ Environment variables configured"

# Test 2: JWT Generation
echo "2️⃣ Testing JWT generation..."
JWT_RESPONSE=$(curl -s -X POST $API_BASE/test-jwt -d '{"test":true}')
if [[ $JWT_RESPONSE == *"error"* ]]; then
  echo "❌ JWT generation failed: $JWT_RESPONSE"
  exit 1
fi
echo "✅ JWT generation working"

# Test 3: Database Connectivity
echo "3️⃣ Testing database connectivity..."
DB_RESPONSE=$(curl -s -X GET $API_BASE/health)
if [[ $DB_RESPONSE != *"healthy"* ]]; then
  echo "❌ Database connectivity failed"
  exit 1
fi
echo "✅ Database connectivity working"

# Test 4: Webhook Endpoint
echo "4️⃣ Testing webhook endpoint..."
WEBHOOK_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST $API_BASE/apple-webhooks \
  -d '{"signedPayload":"test"}')
if [[ $WEBHOOK_CODE != "200" ]]; then
  echo "❌ Webhook endpoint failed: $WEBHOOK_CODE"
  exit 1
fi
echo "✅ Webhook endpoint accessible"

echo "🎉 All tests passed! Ready for production deployment."
```

This comprehensive testing guide ensures your App Store Server API integration works correctly across all environments.