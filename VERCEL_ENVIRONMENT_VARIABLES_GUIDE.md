# 🔐 Vercel Environment Variables Setup Guide

## 📋 **How to Add Environment Variables to Vercel**

### **Step 1: Access Vercel Dashboard**
1. Go to [vercel.com](https://vercel.com)
2. Navigate to your project: **truesharp.io**
3. Click **Settings** tab
4. Click **Environment Variables** in the sidebar

### **Step 2: Add Each Variable Individually**

You need to add these environment variables **exactly** as shown below:

---

## 🔑 **Environment Variables to Add**

### **Variable 1: APPLE_API_KEY_ID**
- **Name:** `APPLE_API_KEY_ID`
- **Value:** `NDZKM529W7`
- **Environment:** Production, Preview, Development ✅

### **Variable 2: APPLE_ISSUER_ID** 
- **Name:** `APPLE_ISSUER_ID`
- **Value:** `bfd9cd55-a018-4093-a4e3-7a41f1ea399c`
- **Environment:** Production, Preview, Development ✅

### **Variable 3: APPLE_BUNDLE_ID**
- **Name:** `APPLE_BUNDLE_ID` 
- **Value:** `com.truesharp.app`
- **Environment:** Production, Preview, Development ✅

### **Variable 4: APPLE_PRIVATE_KEY (IMPORTANT FORMAT)**
- **Name:** `APPLE_PRIVATE_KEY`
- **Value:** **Copy EXACTLY as shown below** (including quotes and line breaks):
```
"-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgyEZfRwKnPBjl65t0
qWF1gSRbT0ygUjtD3WZFdk5GbAagCgYIKoZIzj0DAQehRANCAARhbWakpZj3VcMZ
t/ZvE4WOUdtxNhFT+8UAD7kCr21wB13gHedeHAxq3zrikTCXLVENZgUPysg3ko1I
dbEJFbMI
-----END PRIVATE KEY-----"
```
- **Environment:** Production, Preview, Development ✅

### **Variable 5: APPLE_WEBHOOK_SECRET**
- **Name:** `APPLE_WEBHOOK_SECRET`
- **Value:** `truesharp_apple_webhook_secret_2024_secure_random_string`
- **Environment:** Production, Preview, Development ✅

### **Variable 6: APPLE_SHARED_SECRET (Legacy - Keep for Backward Compatibility)**
- **Name:** `APPLE_SHARED_SECRET`
- **Value:** `ade85877983244cca0db2444fac135b2`
- **Environment:** Production, Preview, Development ✅

---

## ⚠️ **CRITICAL: Private Key Format in Vercel**

### **❌ WRONG WAY (Don't do this):**
```
-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgyEZfRwKnPBjl65t0
qWF1gSRbT0ygUjtD3WZFdk5GbAagCgYIKoZIzj0DAQehRANCAARhbWakpZj3VcMZ
t/ZvE4WOUdtxNhFT+8UAD7kCr21wB13gHedeHAxq3zrikTCXLVENZgUPysg3ko1I
dbEJFbMI
-----END PRIVATE KEY-----
```

### **✅ CORRECT WAY (Include the quotes):**
```
"-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgyEZfRwKnPBjl65t0
qWF1gSRbT0ygUjtD3WZFdk5GbAagCgYIKoZIzj0DAQehRANCAARhbWakpZj3VcMZ
t/ZvE4WOUdtxNhFT+8UAD7kCr21wB13gHedeHAxq3zrikTCXLVENZgUPysg3ko1I
dbEJFbMI
-----END PRIVATE KEY-----"
```

**Why?** The quotes are needed so that Node.js properly interprets the line breaks when parsing the environment variable.

---

## 🖥️ **Vercel Interface Steps**

### **Adding APPLE_PRIVATE_KEY Step-by-Step:**

1. **Click "Add New" in Environment Variables**
2. **Name field:** Type `APPLE_PRIVATE_KEY`
3. **Value field:** Copy and paste this EXACT text:
   ```
   "-----BEGIN PRIVATE KEY-----
   MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgyEZfRwKnPBjl65t0
   qWF1gSRbT0ygUjtD3WZFdk5GbAagCgYIKoZIzj0DAQehRANCAARhbWakpZj3VcMZ
   t/ZvE4WOUdtxNhFT+8UAD7kCr21wB13gHedeHAxq3zrikTCXLVENZgUPysg3ko1I
   dbEJFbMI
   -----END PRIVATE KEY-----"
   ```
4. **Environments:** Check all three: Production, Preview, Development
5. **Click "Save"**

### **For All Other Variables:**
- Simply copy the value without quotes
- Check all three environments (Production, Preview, Development)
- Click "Save" for each one

---

## 🧪 **Testing After Setup**

### **Step 1: Deploy and Test**
After adding all variables:
1. **Trigger a deployment** (push code or redeploy in Vercel)
2. **Test the JWT generation endpoint:**
   ```bash
   curl -X POST https://truesharp.io/api/validate-apple-transaction \
     -H "Content-Type: application/json" \
     -d '{"test": true}'
   ```
3. **Should return success** (not "Missing Apple API credentials" error)

### **Step 2: Test Webhook Endpoint**
```bash
curl -X POST https://truesharp.io/api/apple-webhooks \
  -H "Content-Type: application/json" \
  -d '{"signedPayload": "test"}'
```

### **Step 3: Check Logs**
- Go to Vercel Dashboard → Your Project → Functions
- Click on the API function logs to see if environment variables are loading correctly

---

## 🔐 **App Store Connect Webhook Configuration**

Now that you have the webhook secret, configure it in App Store Connect:

### **Apple Webhook Settings:**
1. **Go to:** App Store Connect → Your App → App Information → App Store Server Notifications
2. **Production Server URL:** `https://truesharp.io/api/apple-webhooks`
3. **Sandbox Server URL:** `https://truesharp.io/api/apple-webhooks`
4. **Webhook Secret:** `truesharp_apple_webhook_secret_2024_secure_random_string`
5. **Version:** Select **Version 2**
6. **Click Save**

---

## ✅ **Final Verification Checklist**

- [ ] All 6 environment variables added to Vercel
- [ ] APPLE_PRIVATE_KEY includes quotes and line breaks
- [ ] All variables set for Production, Preview, and Development
- [ ] Webhook secret configured in App Store Connect
- [ ] Test endpoints return success (not credential errors)
- [ ] Deployment completed successfully

Your Apple IAP system should now be fully configured and working! 🚀

---

## 🚨 **Common Issues & Solutions**

### **Issue: "Missing Apple API credentials" error**
- **Solution:** Check that APPLE_PRIVATE_KEY includes the quotes
- **Solution:** Verify all environment variables are set for "Production" environment

### **Issue: "Invalid JWT" error**
- **Solution:** Ensure no extra spaces in the private key
- **Solution:** Copy the private key exactly as shown (including quotes)

### **Issue: Webhook signature verification fails**
- **Solution:** Make sure APPLE_WEBHOOK_SECRET matches exactly in both Vercel and App Store Connect
- **Solution:** No extra quotes around the webhook secret (only around the private key)

If you encounter any issues, the environment variables are the most common cause - double-check the format!