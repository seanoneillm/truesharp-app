# 🧪 Local Apple Purchase Flow Testing Guide

## 🔍 **What We Fixed:**

1. **✅ Next.js 15 Compatibility** - Fixed `cookies()` API issues in both endpoints
2. **✅ Database Functions** - All functions work correctly (`complete_apple_subscription_validation`, etc.)
3. **✅ iOS App Configuration** - Updated to use environment variables for API endpoints
4. **✅ Local Testing Setup** - Created comprehensive testing tools

## 🚀 **How to Test Locally:**

### **Step 1: Update Your Local IP Address**

1. Your current local IP is: `192.168.1.173`
2. If this changes, update the file: `ios-app/.env.development`
3. Change the line: `EXPO_PUBLIC_API_BASE_URL=http://YOUR_IP:3000`

### **Step 2: Test Your Local Server**

```bash
# Start your local server (if not already running)
npm run dev

# Test endpoints are working
node test-endpoints-simple.js
```

You should see:
- ✅ Webhook: 400 "No signedPayload" 
- ✅ Transaction validation: 401 "Authentication required"
- ✅ Receipt validation: 401 "Authentication required"

### **Step 3: Test Database Functions**

```bash
# Test database connectivity
node test-purchase-flow-local.js
```

This will:
- Create a test user
- Test all database functions
- Verify subscription creation works
- Show you a working subscription in the database

### **Step 4: Configure iOS App for Local Testing**

1. Copy the development environment file:
   ```bash
   cd ios-app
   cp .env.development .env.development.local
   ```

2. Update `.env.development.local` with your actual IP if different

3. Rebuild your iOS app:
   ```bash
   npx expo start --clear
   # Then rebuild on your device/simulator
   ```

### **Step 5: Test Purchase Flow**

Now when you make a purchase in your iOS app:

1. **iOS app** will call your local server at `http://192.168.1.173:3000`
2. **Your local server** will validate with Apple's API
3. **Database** will be updated with subscription
4. **User gets Pro access** immediately

## 📊 **Monitoring the Test:**

### **Watch Local Server Logs:**
Your terminal running `npm run dev` will show:
```
📬 Received request to /api/validate-apple-transaction
🔍 Starting App Store Server API transaction validation
✅ Transaction validation successful
```

### **Check Database:**
```bash
# See what happened in the database
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
supabase.from('pro_subscriptions').select('*').order('created_at', { ascending: false }).limit(5).then(({ data }) => console.log('Recent subscriptions:', data));
"
```

## 🔧 **Troubleshooting:**

### **iOS App Still Calling Production:**
- Make sure you rebuilt the app after changing environment variables
- Check `Environment.API_BASE_URL` in your app logs

### **"Network Error" in iOS:**
- Verify your IP address is correct
- Make sure iOS device is on the same network
- Check firewall isn't blocking port 3000

### **"Authentication Required":**
- This is expected for curl tests
- Real iOS app will send proper auth headers

### **Apple API Errors:**
- These are expected when testing with mock transaction IDs
- Real Apple transaction IDs will work properly

## ✅ **Success Indicators:**

When everything works, you'll see:

1. **iOS App Logs**: "✅ Transaction validation successful"
2. **Server Logs**: "✅ Subscription created/updated"  
3. **Database**: New record in `pro_subscriptions` table
4. **User Profile**: `pro` field set to `'yes'`

## 🚢 **Next Steps:**

Once local testing works:

1. **Deploy fixes to production**:
   ```bash
   # Deploy your fixed endpoints
   git add .
   git commit -m "Fix Next.js cookies API and iOS app configuration"
   git push
   ```

2. **Switch iOS app back to production**:
   - Remove `.env.development.local` 
   - Rebuild app for TestFlight

3. **Test with real purchase in TestFlight**

The local testing proves your code works - now you just need to deploy it!