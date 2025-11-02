# 🔧 External Configuration Checklist for TrueSharp iOS IAP

## 📋 **What You Need to Do Outside the Codebase**

### ✅ **1. Supabase Database Updates**

You need to run the SQL schema updates in your Supabase dashboard:

#### **Step 1: Execute Database Schema**
1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy and paste the contents of `modern-apple-subscription-schema.sql`
3. Click **Run** to execute the schema updates
4. Verify no errors occurred

#### **What this adds:**
- New columns for Apple transaction tracking
- Optimized indexes for performance
- Updated database functions for modern validation
- Audit table for transaction attempts

---

### ✅ **2. App Store Connect Configuration**

#### **Step 2: Set Up App Store Server Notifications V2**
1. **Go to App Store Connect** → **Your App** → **App Information**
2. **Navigate to "App Store Server Notifications"** section
3. **Configure Production Server URL:**
   ```
   https://truesharp.io/api/apple-webhooks
   ```
4. **Configure Sandbox Server URL:**
   ```
   https://truesharp.io/api/apple-webhooks
   ```
5. **Test the webhook URLs** (Apple will send test notifications)
6. **Save the configuration**

#### **Step 3: Verify In-App Purchase Products**
1. **Go to App Store Connect** → **Your App** → **In-App Purchases**
2. **Ensure these products exist and are approved:**
   - Product ID: `pro_subscription_month`
   - Product ID: `pro_subscription_year`
3. **If they don't exist, create them following the subscription setup process**

---

### ✅ **3. Production Environment Variables**

#### **Step 4: Add Environment Variables to truesharp.io**

You need to add these environment variables to your production deployment (Vercel/hosting platform):

```bash
# Apple App Store Server API (Modern)
APPLE_API_KEY_ID=NDZKM529W7
APPLE_ISSUER_ID=bfd9cd55-a018-4093-a4e3-7a41f1ea399c
APPLE_BUNDLE_ID=com.truesharp.app
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgyEZfRwKnPBjl65t0
qWF1gSRbT0ygUjtD3WZFdk5GbAagCgYIKoZIzj0DAQehRANCAARhbWakpZj3VcMZ
t/ZvE4WOUdtxNhFT+8UAD7kCr21wB13gHedeHAxq3zrikTCXLVENZgUPysg3ko1I
dbEJFbMI
-----END PRIVATE KEY-----"

# Keep existing variables (Legacy support)
APPLE_SHARED_SECRET=ade85877983244cca0db2444fac135b2
```

#### **How to add them:**
- **Vercel:** Dashboard → Your Project → Settings → Environment Variables
- **Netlify:** Site Settings → Environment Variables
- **Railway:** Project → Variables
- **Heroku:** Settings → Config Vars

---

### ✅ **4. Testing & Validation**

#### **Step 5: Test the New Endpoints**

Once deployed, test the new functionality:

```bash
# Test JWT generation (should return success)
curl -X POST https://truesharp.io/api/validate-apple-transaction \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Test webhook endpoint (should return 200)
curl -X POST https://truesharp.io/api/apple-webhooks \
  -H "Content-Type: application/json" \
  -d '{"signedPayload": "test"}'
```

#### **Step 6: Verify Database Schema**
In Supabase SQL Editor, run this to verify the schema was applied:

```sql
-- Check if new columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'pro_subscriptions' 
AND column_name LIKE 'apple_%';

-- Check if new function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'complete_apple_subscription_validation';
```

---

### ✅ **5. iOS App Configuration**

#### **Step 7: Update Your iOS App to Use Modern Service**

In your iOS app, replace the old StoreKit service imports:

```typescript
// OLD (replace this):
import { storeKitService } from '../services/storekit'

// NEW (use this instead):
import { modernStoreKitService } from '../services/modern-storekit'
```

#### **Step 8: Update Component Imports**

Update any components that use the StoreKit service:

```typescript
// In your subscription components, replace:
// storeKitService.purchaseSubscription(productId)
// with:
// modernStoreKitService.purchaseSubscription(productId)
```

---

### ✅ **6. App Store Review Preparation**

#### **Step 9: Ensure Compliance**
- [ ] **Subscription auto-renewal disclaimer** is visible in your app
- [ ] **Terms of service** link is accessible
- [ ] **Privacy policy** link is accessible  
- [ ] **Restore purchases** button is easily accessible
- [ ] **Subscription management** redirects to iOS Settings

#### **Step 10: Test with TestFlight**
1. **Upload new build** to TestFlight with modern implementation
2. **Test with sandbox account** on real device
3. **Verify subscription flow** works end-to-end
4. **Check database records** are created correctly

---

### ✅ **7. Monitoring & Alerts**

#### **Step 11: Set Up Monitoring**

Add monitoring for the new endpoints:

1. **Monitor `/api/validate-apple-transaction`** for errors
2. **Monitor `/api/apple-webhooks`** for webhook delivery failures
3. **Set up alerts** for failed transaction validations

---

## 🚨 **Important Notes**

### **Critical Security Points:**
1. **Never commit the private key** to version control
2. **Always use environment variables** for credentials
3. **Test webhook endpoint** is publicly accessible before going live
4. **Monitor API usage** to detect any unusual patterns

### **Testing Strategy:**
1. **Start with sandbox environment** using TestFlight
2. **Test with real sandbox Apple ID** (not your developer account)
3. **Verify webhook notifications** are received and processed
4. **Check database records** are created correctly
5. **Only proceed to production** after successful sandbox testing

### **Rollback Plan:**
If something goes wrong, you can quickly rollback by:
1. **Reverting environment variables** to use the old `APPLE_SHARED_SECRET` only
2. **Switching iOS app** back to the old `storekit.ts` service
3. **Database changes are additive** and won't break existing functionality

---

## ✅ **Final Verification Checklist**

Before going live, verify:

- [ ] **Database schema** updated successfully
- [ ] **Environment variables** added to production
- [ ] **Webhook URLs** configured in App Store Connect
- [ ] **New API endpoints** respond correctly
- [ ] **JWT generation** working with your credentials
- [ ] **TestFlight build** tested with sandbox purchases
- [ ] **Database records** created correctly for test purchases
- [ ] **Webhook notifications** received and processed
- [ ] **Old functionality** still works (backward compatibility)

Once all items are checked, you're ready to deploy the modern App Store Server API implementation! 🚀