# 🍎 Apple Developer Configuration Checklist

## Required Apple Developer Account Setup

### ✅ 1. App Store Connect Configuration

#### **1.1 Paid Apps Agreement**
- [ ] **Sign Paid Apps Agreement** in App Store Connect
- [ ] **Add banking information** for revenue collection
- [ ] **Add tax information** for all relevant territories
- [ ] **Verify agreement status** shows "Active"

#### **1.2 App Store Connect API Key Generation**
- [ ] Navigate to **Users and Access** → **Integrations** → **App Store Connect API**
- [ ] Click **Generate API Key**
- [ ] Set **Key Name**: `TrueSharp IAP Validation`
- [ ] Set **Access Level**: `Developer` (minimum required)
- [ ] **Download the .p8 file** immediately (cannot be re-downloaded)
- [ ] **Record the Key ID** (you'll need this for JWT generation)
- [ ] **Record the Issuer ID** (found at the top of the API Keys page)

#### **1.3 Bundle ID Configuration**
- [ ] **Register Bundle ID** in Developer Portal (if not already done)
- [ ] **Enable In-App Purchase capability** for your Bundle ID
- [ ] **Match Bundle ID** exactly in Xcode project settings

### ✅ 2. In-App Purchase Products Setup

#### **2.1 Subscription Group Creation**
- [ ] Go to **App Store Connect** → **Your App** → **In-App Purchases**
- [ ] Create **Subscription Group** (e.g., "TrueSharp Pro Subscriptions")
- [ ] Set **Reference Name**: `truesharp_pro_subscriptions`

#### **2.2 Subscription Products**
- [ ] **Create Monthly Subscription**:
  - Product ID: `pro_subscription_month`
  - Reference Name: `TrueSharp Pro Monthly`
  - Price: Set your desired price point
- [ ] **Create Yearly Subscription**:
  - Product ID: `pro_subscription_year`
  - Reference Name: `TrueSharp Pro Yearly`
  - Price: Set your desired price point
- [ ] **Set subscription duration** (1 month / 1 year)
- [ ] **Configure pricing** for all territories
- [ ] **Submit for review** (products must be approved)

#### **2.3 App Store Server Notifications V2**
- [ ] In **App Store Connect** → **Your App** → **App Information**
- [ ] Navigate to **App Store Server Notifications**
- [ ] Set **Production Server URL**: `https://truesharp.io/api/apple-webhooks`
- [ ] Set **Sandbox Server URL**: `https://truesharp.io/api/apple-webhooks`
- [ ] **Test the webhook URL** (Apple will send a test notification)

### ✅ 3. Environment Variables Configuration

#### **3.1 Backend Environment Variables**
Add these to your backend deployment (Vercel, Heroku, etc.):

```bash
# Apple App Store Server API Credentials
APPLE_API_KEY_ID=your_key_id_here
APPLE_ISSUER_ID=your_issuer_id_here
APPLE_BUNDLE_ID=com.truesharp.app
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
your_p8_file_content_here
-----END PRIVATE KEY-----"

# Legacy (for backward compatibility)
APPLE_SHARED_SECRET=your_app_specific_shared_secret
```

#### **3.2 Secure Private Key Storage**
- [ ] **Store .p8 file securely** - never commit to version control
- [ ] **Use environment variables** for all credentials
- [ ] **Test in staging environment** before production deployment

### ✅ 4. Xcode Project Configuration

#### **4.1 Capabilities**
- [ ] **Enable In-App Purchase** capability in Xcode
- [ ] **Add StoreKit Configuration** file for local testing (optional)
- [ ] **Configure App Groups** if using multiple apps

#### **4.2 Info.plist Settings**
- [ ] **Verify Bundle Identifier** matches App Store Connect
- [ ] **Set appropriate iOS deployment target** (iOS 15+ for StoreKit 2)

### ✅ 5. TestFlight & Testing Setup

#### **5.1 TestFlight Configuration**
- [ ] **Upload build to TestFlight**
- [ ] **Add internal testers** for IAP testing
- [ ] **Create sandbox test accounts**:
  - Go to **Users and Access** → **Sandbox**
  - Create test accounts with different countries/payment methods

#### **5.2 Sandbox Testing Requirements**
- [ ] **Ensure test accounts are signed out** of production App Store
- [ ] **Use different Apple IDs** for testing vs development
- [ ] **Test in Simulator** (for development) and **real device** (for integration)

### ✅ 6. App Store Server API Testing

#### **6.1 JWT Token Generation Test**
- [ ] **Verify JWT generation** works with your credentials
- [ ] **Test API endpoint access**:
  ```bash
  curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
       https://api.storekit-sandbox.itunes.apple.com/inApps/v1/transactions/DUMMY_TRANSACTION_ID
  ```
- [ ] **Confirm proper error handling** for invalid credentials

#### **6.2 Webhook Testing**
- [ ] **Create webhook endpoint** at your server URL
- [ ] **Test webhook reception** with Apple's test notifications
- [ ] **Verify JWS signature validation** (recommended for production)

### ✅ 7. Security Best Practices

#### **7.1 Credential Management**
- [ ] **Rotate API keys periodically** (every 6-12 months)
- [ ] **Use separate keys** for staging/production if needed
- [ ] **Monitor API usage** in App Store Connect

#### **7.2 Transaction Validation**
- [ ] **Always validate on server-side** (never trust client-only validation)
- [ ] **Implement proper error handling** for network failures
- [ ] **Log transaction attempts** for debugging and audit

#### **7.3 User Privacy**
- [ ] **Handle subscription data** according to privacy policies
- [ ] **Implement data deletion** for account closure
- [ ] **Follow GDPR/CCPA requirements** if applicable

### ✅ 8. Production Deployment Preparation

#### **8.1 App Store Connect Final Steps**
- [ ] **Submit app for review** with IAP functionality
- [ ] **Respond to reviewer feedback** promptly
- [ ] **Test purchase flow** in production environment

#### **8.2 Monitoring & Analytics**
- [ ] **Set up server monitoring** for webhook endpoints
- [ ] **Implement logging** for transaction validation
- [ ] **Create alerts** for failed validations or API errors

---

## 🚨 Common Issues to Avoid

### **Critical Mistakes**
1. **❌ Using sandbox receipts in production** - Always check environment
2. **❌ Not finishing transactions** - Causes repeated charges
3. **❌ Ignoring webhook failures** - Leads to inconsistent subscription state
4. **❌ Hard-coding credentials** - Security vulnerability
5. **❌ Not testing restore purchases** - Required for App Store approval

### **Testing Issues**
1. **❌ Testing with production Apple ID** - Use sandbox accounts only
2. **❌ Not clearing test account purchase history** - Can cause confusion
3. **❌ Missing StoreKit testing configuration** - Makes debugging harder

---

## ⚡ Quick Verification Commands

```bash
# Test JWT generation
node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign({
  iss: 'YOUR_ISSUER_ID',
  iat: Math.round(Date.now() / 1000),
  exp: Math.round(Date.now() / 1000) + 3600,
  aud: 'appstoreconnect-v1',
  bid: 'YOUR_BUNDLE_ID'
}, 'YOUR_PRIVATE_KEY', {
  algorithm: 'ES256',
  header: { alg: 'ES256', kid: 'YOUR_KEY_ID', typ: 'JWT' }
});
console.log('JWT Token:', token);
"

# Test webhook endpoint
curl -X POST https://truesharp.io/api/apple-webhooks \
     -H "Content-Type: application/json" \
     -d '{"test": true}'
```

This checklist ensures you have everything configured correctly for modern iOS IAP with the App Store Server API.