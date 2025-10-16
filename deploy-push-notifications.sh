#!/bin/bash

# Deploy complete push notification system for TrueSharp
echo "🚀 Deploying TrueSharp Push Notification System..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "supabase" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Step 1: Deploy database migrations
print_status "Step 1: Deploying database migrations..."
echo ""
print_status "⚠️  Please run the following SQL in your Supabase SQL Editor:"
echo ""
echo "1. Run: create-notifications-table.sql"
echo ""
echo "-- Database migrations --"
cat create-notifications-table.sql
echo ""
echo "Press any key to continue after running the database migration..."
read -n 1 -s

# Step 2: Deploy Edge Functions
print_status "Step 2: Deploying Edge Functions..."

# Deploy send-push-notifications function
print_status "Deploying send-push-notifications Edge Function..."
if supabase functions deploy send-push-notifications --project-ref trsogafrxpptszxydycn; then
    print_success "send-push-notifications function deployed successfully"
else
    print_error "Failed to deploy send-push-notifications function"
    exit 1
fi

# Deploy add-bets-to-strategies function (updated version)
print_status "Deploying add-bets-to-strategies Edge Function..."
if supabase functions deploy add-bets-to-strategies --project-ref trsogafrxpptszxydycn; then
    print_success "add-bets-to-strategies function deployed successfully"
else
    print_error "Failed to deploy add-bets-to-strategies function"
    exit 1
fi

# Step 3: Environment Variables Check
print_status "Step 3: Checking environment variables..."
echo ""
print_warning "Ensure these environment variables are set in your deployment:"
echo ""
echo "Web App (.env.local):"
echo "- NEXT_PUBLIC_SUPABASE_URL"
echo "- NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "- SUPABASE_SERVICE_ROLE_KEY"
echo ""
echo "iOS App (app.json extra):"
echo "- EXPO_PUBLIC_SUPABASE_URL"
echo "- EXPO_PUBLIC_SUPABASE_ANON_KEY"
echo ""
echo "Supabase Edge Functions:"
echo "- SUPABASE_URL (auto-configured)"
echo "- SUPABASE_SERVICE_ROLE_KEY (auto-configured)"
echo ""

# Step 4: iOS App Configuration
print_status "Step 4: iOS App configuration checks..."
echo ""
print_status "Verify the following in your iOS app:"
echo "✓ expo-notifications package installed"
echo "✓ expo-device package installed"
echo "✓ App scheme 'truesharp' configured in app.json"
echo "✓ Notification plugin configured in app.json"
echo "✓ Deep linking setup in App.tsx"
echo ""

# Step 5: Testing Instructions
print_status "Step 5: Testing Instructions"
echo ""
print_warning "To test the push notification system:"
echo ""
echo "1. Install iOS app in TestFlight (for production tokens)"
echo "2. Login to the app (this registers push token)"
echo "3. Subscribe to a monetized strategy"
echo "4. Have the seller add bets to that strategy"
echo "5. Check that you receive a push notification"
echo "6. Tap the notification to verify deep linking works"
echo ""

# Step 6: Monitoring Setup
print_status "Step 6: Monitoring and Logs"
echo ""
print_status "Monitor Edge Function logs:"
echo "supabase functions logs send-push-notifications --project-ref trsogafrxpptszxydycn"
echo "supabase functions logs add-bets-to-strategies --project-ref trsogafrxpptszxydycn"
echo ""

# Step 7: Production Checklist
print_status "Step 7: Production Readiness Checklist"
echo ""
print_warning "Before going live, ensure:"
echo "□ Database migration ran successfully"
echo "□ Edge Functions deployed without errors"
echo "□ TestFlight build tested with real push notifications"
echo "□ Deep linking tested on physical devices"
echo "□ Notification permissions working correctly"
echo "□ Production environment variables configured"
echo "□ Push token environment detection working"
echo "□ Error handling and logging in place"
echo ""

print_success "🎉 Push notification system deployment completed!"
echo ""
print_status "Next steps:"
echo "1. Test the system thoroughly in TestFlight"
echo "2. Monitor Edge Function logs for any errors"
echo "3. Verify push notification delivery rates"
echo "4. Test deep linking on various iOS versions"
echo ""
print_warning "Remember: Push notifications in TestFlight use production tokens, not development tokens!"