# 🚀 Production Readiness Checklist - iOS IAP with App Store Server API

## 📋 Pre-Deployment Verification

### ✅ **Apple Developer Account Requirements**

#### **App Store Connect Configuration**
- [ ] **Paid Apps Agreement** signed and active
- [ ] **Banking information** added and verified
- [ ] **Tax information** completed for all territories
- [ ] **App Store Connect API Key** generated and downloaded (.p8 file)
- [ ] **Key ID and Issuer ID** recorded securely
- [ ] **Bundle ID** matches exactly between Xcode and App Store Connect

#### **In-App Purchase Products**
- [ ] **Subscription Group** created and configured
- [ ] **Monthly subscription** (`pro_subscription_month`) created and approved
- [ ] **Yearly subscription** (`pro_subscription_year`) created and approved
- [ ] **Product pricing** set for all intended markets
- [ ] **App Store Server Notifications V2** webhook URLs configured:
  - Production: `https://truesharp.io/api/apple-webhooks`
  - Sandbox: `https://truesharp.io/api/apple-webhooks`

---

## 🔧 **Technical Implementation**

### ✅ **Backend Configuration**

#### **Environment Variables** (Production)
```bash
# Required for App Store Server API
APPLE_API_KEY_ID=ABC123DEFG        # From App Store Connect API key
APPLE_ISSUER_ID=12345678-1234-...  # From App Store Connect
APPLE_BUNDLE_ID=com.truesharp.app  # Your app's bundle identifier
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
...your .p8 file content...
-----END PRIVATE KEY-----"

# Legacy (for backward compatibility)
APPLE_SHARED_SECRET=abc123...      # App-specific shared secret

# Database
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...

# Security
NODE_ENV=production
```

#### **API Endpoints Implemented**
- [ ] **`POST /api/validate-apple-transaction`** - Modern transaction validation
- [ ] **`POST /api/apple-webhooks`** - Server Notifications V2 handler
- [ ] **`GET /api/health`** - Health check endpoint
- [ ] **`POST /api/test-jwt`** - JWT generation test (disable in production)

#### **Database Schema**
- [ ] **`pro_subscriptions` table** exists with required columns:
  - `apple_transaction_id` (unique)
  - `apple_original_transaction_id`
  - `environment` (sandbox/production)
  - Current period start/end dates
- [ ] **`apple_transaction_attempts` table** for audit logging
- [ ] **Database function** `complete_apple_subscription_validation` implemented

### ✅ **Client-Side Implementation**

#### **Expo App Configuration**
- [ ] **Modern StoreKit service** implemented (`modern-storekit.ts`)
- [ ] **Transaction ID-based validation** (not full receipt)
- [ ] **Proper error handling** and retry logic
- [ ] **Restore purchases** functionality working
- [ ] **Purchase state management** implemented
- [ ] **Server-side validation** before finishing transactions

#### **Product IDs Configuration**
```typescript
export const PRODUCT_IDS = {
  PRO_MONTHLY: 'pro_subscription_month',   // Must match App Store Connect
  PRO_YEARLY: 'pro_subscription_year',     // Must match App Store Connect
} as const
```

---

## 🧪 **Testing Requirements**

### ✅ **Sandbox Testing Completed**
- [ ] **Sandbox test accounts** created and tested
- [ ] **Purchase flow** tested end-to-end in sandbox
- [ ] **Subscription renewal** tested (accelerated in sandbox)
- [ ] **Subscription expiration** tested
- [ ] **Restore purchases** tested after app reinstall
- [ ] **Network failure scenarios** tested
- [ ] **Webhook notifications** received and processed correctly

### ✅ **Production Testing (Limited)**
- [ ] **Internal team testing** with real Apple IDs completed
- [ ] **TestFlight beta testing** with real payment methods
- [ ] **Server logs monitoring** shows no validation failures
- [ ] **Database records** created correctly for real purchases
- [ ] **Webhook processing** working with production notifications

---

## 🔒 **Security & Compliance**

### ✅ **Security Measures**
- [ ] **All credentials stored securely** (environment variables, never in code)
- [ ] **JWT tokens have proper expiration** (1 hour max)
- [ ] **Server-side validation always required** before granting access
- [ ] **Transaction finishing only after validation** success
- [ ] **API rate limiting** implemented if needed
- [ ] **Error logging** doesn't expose sensitive data

### ✅ **Privacy & Compliance**
- [ ] **Privacy policy updated** to mention subscription data collection
- [ ] **Data retention policy** implemented
- [ ] **Account deletion** properly removes subscription data
- [ ] **GDPR/CCPA compliance** if applicable to your markets
- [ ] **Transaction logging** complies with audit requirements

---

## 📊 **Monitoring & Alerting**

### ✅ **Production Monitoring**
- [ ] **Health check endpoint** (`/api/health`) monitoring
- [ ] **Webhook endpoint monitoring** for failures
- [ ] **Transaction validation error tracking**
- [ ] **Database connection monitoring**
- [ ] **App Store Server API response time monitoring**

### ✅ **Error Alerting**
- [ ] **Failed transaction validations** alert setup
- [ ] **Webhook delivery failures** alert setup
- [ ] **JWT generation failures** alert setup
- [ ] **Database connection issues** alert setup
- [ ] **High error rate thresholds** configured

### ✅ **Logging Strategy**
```typescript
// Example logging configuration
const logLevels = {
  ERROR: 'Transaction validation failed',
  WARN: 'Webhook retry attempt',
  INFO: 'Successful purchase validation',
  DEBUG: 'JWT token generated' // Disable in production
}
```

---

## 🚀 **Deployment Steps**

### ✅ **Pre-Deployment**
1. [ ] **Environment variables** set in production environment
2. [ ] **Database migrations** run successfully
3. [ ] **API endpoints** tested with curl/Postman
4. [ ] **Webhook URL** accessible from internet
5. [ ] **SSL certificate** valid for webhook endpoint

### ✅ **Deployment**
1. [ ] **Deploy backend** with new App Store Server API endpoints
2. [ ] **Deploy Expo app** with modern StoreKit implementation
3. [ ] **Test production API** connectivity immediately after deployment
4. [ ] **Verify webhook** receiving test notifications from Apple
5. [ ] **Monitor logs** for first 24 hours post-deployment

### ✅ **Post-Deployment Verification**
1. [ ] **Test complete purchase flow** with real Apple ID
2. [ ] **Verify database records** created correctly
3. [ ] **Check webhook notifications** processed successfully
4. [ ] **Confirm subscription status** reflects correctly in app
5. [ ] **Test restore purchases** functionality

---

## ⚠️ **Critical Verification Commands**

### **Test JWT Generation**
```bash
curl -X POST https://truesharp.io/api/test-jwt \
  -H "Content-Type: application/json" \
  -d '{"verify": true}'
```

### **Test Transaction Validation**
```bash
curl -X POST https://truesharp.io/api/validate-apple-transaction \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_USER_JWT" \
  -d '{
    "userId": "test-user",
    "transactionId": "test-transaction",
    "originalTransactionId": "test-original",
    "productId": "pro_subscription_month"
  }'
```

### **Test Webhook Endpoint**
```bash
curl -X POST https://truesharp.io/api/apple-webhooks \
  -H "Content-Type: application/json" \
  -d '{"signedPayload": "test"}'
```

### **Health Check**
```bash
curl https://truesharp.io/api/health
# Expected: {"status": "healthy", "timestamp": "..."}
```

---

## 🎯 **App Store Review Preparation**

### ✅ **Review Guidelines Compliance**
- [ ] **App Store Review Guidelines 3.1.1** compliance (In-App Purchases)
- [ ] **Subscription auto-renewal disclosure** in app UI
- [ ] **Terms and conditions** accessible within app
- [ ] **Privacy policy** link provided
- [ ] **Restore purchases** functionality accessible to users
- [ ] **Purchase flow** clear and intuitive for reviewers

### ✅ **Demo Account for Review**
- [ ] **Test account credentials** provided to Apple if needed
- [ ] **Demo content** available without purchase for review purposes
- [ ] **Review notes** explain subscription functionality clearly
- [ ] **Screenshots** show subscription management UI

---

## 🔧 **Rollback Plan**

### ✅ **Rollback Preparation**
- [ ] **Previous working version** tagged in git
- [ ] **Database backup** taken before deployment
- [ ] **Environment variables backup** secured
- [ ] **Rollback procedure** documented and tested
- [ ] **Monitoring thresholds** set for automatic rollback triggers

### ✅ **Emergency Contacts**
- [ ] **Apple Developer Support** contact info available
- [ ] **Team member contact list** for critical issues
- [ ] **Database administrator** on-call information
- [ ] **DevOps team** emergency procedures documented

---

## ✅ **Final Go/No-Go Decision**

**All items above must be checked before production deployment.**

### **Go Criteria Met:**
- ✅ All Apple Developer Account requirements completed
- ✅ All technical implementation verified
- ✅ All testing completed successfully
- ✅ All security measures implemented
- ✅ All monitoring and alerting configured
- ✅ All deployment steps completed
- ✅ App Store review preparation completed
- ✅ Rollback plan documented and tested

### **Ready for Production:** ✅ YES / ❌ NO

**Deployment Authorization:**
- **Technical Lead:** _________________ Date: _______
- **Product Owner:** _________________ Date: _______
- **Security Review:** _________________ Date: _______

---

## 📞 **Post-Launch Support**

### **First 48 Hours**
- [ ] **Monitor error rates** continuously
- [ ] **Check webhook delivery** success rates
- [ ] **Verify transaction validations** succeeding
- [ ] **Review user feedback** for purchase issues
- [ ] **Check App Store Connect** for any issues

### **First Week**
- [ ] **Analyze subscription conversion** rates
- [ ] **Review server performance** metrics
- [ ] **Check for any edge cases** not covered in testing
- [ ] **Document any issues** and solutions found
- [ ] **Update runbooks** based on production experience

This checklist ensures your iOS IAP implementation with App Store Server API is production-ready and compliant with Apple's latest requirements.