# Deployment Guide: Add Bets to Strategies Feature

## Step 1: Database Migration ✅ (You need to do this)

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/trsogafrxpptszxydycn
2. Click on "SQL Editor" in the left sidebar  
3. Copy and paste this SQL:

```sql
-- Add push notification support to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS expo_push_token TEXT,
ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT true;

-- Create index for push token lookups
CREATE INDEX IF NOT EXISTS idx_profiles_expo_push_token ON public.profiles(expo_push_token) WHERE expo_push_token IS NOT NULL;

-- Create index for notification settings
CREATE INDEX IF NOT EXISTS idx_profiles_notifications_enabled ON public.profiles(notifications_enabled) WHERE notifications_enabled = true;

-- Update RLS policy to allow users to update their own push token
CREATE POLICY "Users can update their own push token" ON profiles
    FOR UPDATE USING (auth.uid() = id);
```

4. Click "Run" to execute

## Step 2: Deploy Edge Function ✅ (CLI is now installed)

### Option A: Manual Deployment (Recommended)

1. Open Terminal and run:
```bash
cd /Users/seanoneill/Desktop/truesharp
supabase login
```

2. When prompted, go to: https://supabase.com/dashboard/account/tokens
3. Create a new access token
4. Copy the token and paste it when prompted

5. Deploy the function:
```bash
supabase functions deploy add-bets-to-strategies --project-ref trsogafrxpptszxydycn
```

### Option B: Using Dashboard (Alternative)

1. Go to https://supabase.com/dashboard/project/trsogafrxpptszxydycn/functions
2. Click "Create a new function"  
3. Name it: `add-bets-to-strategies`
4. Copy the entire content from `/supabase/functions/add-bets-to-strategies/index.ts`
5. Paste it into the function editor
6. Click "Deploy"

## Step 3: Test the Feature

### iOS App Testing

1. Install dependencies:
```bash
cd /Users/seanoneill/Desktop/truesharp/ios-app
npm install
```

2. Start the app:
```bash
npm run ios
# or
npm run android
```

3. Test the flow:
   - Go to Sell Screen → Overview Tab
   - Look for "Recent Open Bets" section
   - Tap on bet cards to select them (you should see checkboxes)
   - Look for debug messages in red/yellow (if in development mode)
   - When bets are selected, "Add to Strategies" button should appear
   - Tap the button to open strategy selection modal
   - Select strategies and confirm

### Debug Information

I've added debug logging to help identify issues:

- **Console logs**: Check React Native debugger for bet selection logs
- **Visual debug**: Red text showing selection count in development mode
- **Yellow debug bar**: Shows selected bet IDs at bottom

### Troubleshooting

**If "Add to Strategies" button doesn't appear:**

1. Check console for bet selection logs starting with "🎯"
2. Look for the debug text showing selection count
3. Ensure you're tapping the bet cards (not just viewing them)
4. Try selecting different bets to see if specific bets are problematic

**If Edge Function fails:**

1. Check Supabase function logs: https://supabase.com/dashboard/project/trsogafrxpptszxydycn/functions
2. Verify the database migration was successful
3. Check if all required tables exist: `bets`, `strategies`, `strategy_bets`, `subscriptions`, `profiles`

## Step 4: Push Notification Testing

### Manual Test

1. Have a user subscribe to a strategy
2. As the strategy owner, add bets to that strategy using the iOS app
3. The subscriber should receive a push notification

### Check Push Token Registration

In your app, you can verify push tokens are being saved:

1. Go to Supabase dashboard → Table Editor → profiles
2. Look for the `expo_push_token` column
3. Verify users have valid push tokens after logging in

## Production Considerations

### Before Going Live

1. **Remove Debug Code**: Remove the debug logging and visual indicators:
   ```typescript
   // Remove these lines from SellScreen.tsx:
   console.log('🎯 Bet selection - betId:', betId, 'item:', item);
   console.log('🎯 Updated selectedBetIds:', newSelection);
   
   // Remove the __DEV__ debug text elements
   ```

2. **Test Push Notifications**: Verify push notifications work on real devices (not simulators)

3. **Performance Testing**: Test with larger numbers of bets and strategies

### Environment Variables

Ensure these are set in production:

```bash
# iOS App
EXPO_PUBLIC_SUPABASE_URL=https://trsogafrxpptszxydycn.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Supabase Edge Function (auto-configured)
SUPABASE_URL=https://trsogafrxpptszxydycn.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Feature Status

✅ **iOS Implementation**: Complete with debug logging  
✅ **Edge Function**: Ready for deployment  
✅ **Database Schema**: Migration script ready  
✅ **Push Notifications**: Full implementation with Expo integration  
✅ **Error Handling**: Filter mismatches, duplicates, network errors  
✅ **Security**: Authentication, RLS policies, user-scoped operations  

## Next Steps

1. Complete database migration (Step 1)
2. Deploy Edge Function (Step 2)  
3. Test on iOS device (Step 3)
4. Remove debug code for production
5. Monitor Edge Function logs for any issues

The feature is production-ready once deployed and tested!