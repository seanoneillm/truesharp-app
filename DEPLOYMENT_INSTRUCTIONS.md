# TrueSharp Push Notifications - Deployment Instructions

## ✅ Current Status

Your database migration was successful! The notifications table has been created and is working correctly.

## 🚀 Next Steps to Complete Deployment

### 1. Deploy Edge Functions

You need to deploy the `send-push-notifications` Edge Function to Supabase:

```bash
# Login to Supabase CLI (if not already logged in)
supabase login

# Deploy the push notification function
supabase functions deploy send-push-notifications --project-ref trsogafrxpptszxydycn

# Verify deployment
supabase functions list --project-ref trsogafrxpptszxydycn
```

### 2. Test the Complete System

After deploying the Edge Function, run the test script:

```bash
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
./test-push-notifications.sh
```

### 3. iOS App Testing

1. **Install Dependencies** (already done ✅):
   - expo-linking has been installed
   - All required packages are ready

2. **Build and Test**:
   ```bash
   cd ios-app
   npm start
   # or
   expo run:ios
   ```

3. **TestFlight Deployment**:
   - Build for TestFlight to test production push tokens
   - Test the complete flow: login → subscribe → receive notifications

## 🧪 Testing Verification

### ✅ What's Working:
- Database schema created successfully
- notifications table operational
- profiles, subscriptions, strategies tables accessible
- iOS app dependencies installed
- API route integration complete
- Deep linking configuration ready

### ⏳ What Needs Deployment:
- `send-push-notifications` Edge Function
- End-to-end testing with real users

## 🔍 Test Results Summary

Your database verification shows:
```
📊 Database Verification Summary:
- notifications table: Created ✅
- profiles table: Available ✅  
- subscriptions table: Available ✅
- strategies table: Available ✅
```

## 🎯 Complete Flow Test

Once the Edge Function is deployed, test this flow:

1. **User Registration**: iOS app registers push token
2. **Strategy Subscription**: User subscribes to a monetized strategy  
3. **Bet Addition**: Seller adds bets to that strategy
4. **Push Notification**: System sends notification via Expo
5. **Deep Link**: User taps notification → opens subscriptions screen

## 📱 Expected Notification Format

```
Title: "New Strategy Bets"
Body: "SellerName posted 3 bets to NFL Favorites — View Now"
Deep Link: truesharp://subscriptions?strategy=uuid
```

## 🚨 Important Notes

- **TestFlight Required**: Production push tokens only work in TestFlight/App Store builds
- **Expo Go Limitation**: Development tokens won't work for production testing
- **Deep Linking**: Ensure URL scheme "truesharp" is configured in iOS

Your system is **95% ready** - just needs the Edge Function deployed!