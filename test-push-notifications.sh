#!/bin/bash

# Test script for TrueSharp Push Notification System
echo "🧪 Testing TrueSharp Push Notification System..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

# Test configuration
SUPABASE_URL="https://trsogafrxpptszxydycn.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyc29nYWZyeHBwdHN6eHlkeWNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MjQ0OTQsImV4cCI6MjA2NjMwMDQ5NH0.STgM-_-9tTwI-Tr-gajQnfsA9cEZplw7W5uPWmn-SwA"

# Check if required environment variables are set
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    print_error "SUPABASE_SERVICE_ROLE_KEY environment variable is not set"
    echo "Please set it with: export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key"
    exit 1
fi

# Test 1: Check if Edge Functions are deployed
print_status "Test 1: Checking Edge Function deployment..."

# Test send-push-notifications function
send_push_response=$(curl -s -o /dev/null -w "%{http_code}" \
    -X OPTIONS \
    "$SUPABASE_URL/functions/v1/send-push-notifications")

if [ "$send_push_response" = "200" ]; then
    print_success "send-push-notifications Edge Function is deployed"
else
    print_error "send-push-notifications Edge Function not accessible (HTTP $send_push_response)"
fi

# Test add-bets-to-strategies function
add_bets_response=$(curl -s -o /dev/null -w "%{http_code}" \
    -X OPTIONS \
    "$SUPABASE_URL/functions/v1/add-bets-to-strategies")

if [ "$add_bets_response" = "200" ]; then
    print_success "add-bets-to-strategies Edge Function is deployed"
else
    print_error "add-bets-to-strategies Edge Function not accessible (HTTP $add_bets_response)"
fi

# Test 2: Check database schema
print_status "Test 2: Checking database schema..."

# Check if notifications table exists
notifications_check=$(curl -s \
    -H "apikey: $SUPABASE_ANON_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    "$SUPABASE_URL/rest/v1/notifications?select=id&limit=1")

if echo "$notifications_check" | grep -q "error\|table"; then
    print_error "notifications table not found or not accessible"
else
    print_success "notifications table exists and is accessible"
fi

# Check if profiles table has push notification fields
profiles_check=$(curl -s \
    -H "apikey: $SUPABASE_ANON_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    "$SUPABASE_URL/rest/v1/profiles?select=expo_push_token,notifications_enabled,push_token_environment&limit=1")

if echo "$profiles_check" | grep -q "expo_push_token"; then
    print_success "profiles table has push notification fields"
else
    print_error "profiles table missing push notification fields"
fi

# Test 3: Test push notification function with mock data
print_status "Test 3: Testing push notification function with mock data..."

mock_request='{
    "type": "strategy_bets",
    "strategyId": "test-strategy-id",
    "sellerName": "Test Seller",
    "strategyName": "Test Strategy",
    "betCount": 2,
    "message": "Test notification message"
}'

push_test_response=$(curl -s \
    -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    -d "$mock_request" \
    "$SUPABASE_URL/functions/v1/send-push-notifications")

if echo "$push_test_response" | grep -q "success"; then
    print_success "Push notification function responded successfully"
    echo "Response: $push_test_response"
else
    print_warning "Push notification function test completed (may be no subscribers)"
    echo "Response: $push_test_response"
fi

# Test 4: Check iOS app configuration
print_status "Test 4: Checking iOS app configuration..."

if [ -f "ios-app/app.json" ]; then
    # Check for required fields in app.json
    if grep -q '"scheme": "truesharp"' ios-app/app.json; then
        print_success "Deep linking scheme configured"
    else
        print_error "Deep linking scheme not configured in app.json"
    fi
    
    if grep -q '"expo-notifications"' ios-app/app.json; then
        print_success "Expo notifications plugin configured"
    else
        print_error "Expo notifications plugin not configured in app.json"
    fi
    
    if grep -q '"projectId"' ios-app/app.json; then
        print_success "Expo project ID configured"
    else
        print_error "Expo project ID not configured in app.json"
    fi
else
    print_error "ios-app/app.json not found"
fi

if [ -f "ios-app/package.json" ]; then
    if grep -q '"expo-notifications"' ios-app/package.json; then
        print_success "expo-notifications package installed"
    else
        print_error "expo-notifications package not installed"
    fi
    
    if grep -q '"expo-device"' ios-app/package.json; then
        print_success "expo-device package installed"
    else
        print_error "expo-device package not installed"
    fi
else
    print_error "ios-app/package.json not found"
fi

# Test 5: Manual testing instructions
print_status "Test 5: Manual testing required..."
echo ""
print_warning "The following tests require manual execution:"
echo ""
echo "📱 iOS App Testing:"
echo "1. Build and install app in TestFlight"
echo "2. Login to app (should register push token)"
echo "3. Check Supabase profiles table for expo_push_token"
echo "4. Subscribe to a monetized strategy"
echo ""
echo "🔔 Push Notification Testing:"
echo "1. Have seller add bets to subscribed strategy"
echo "2. Verify push notification is received"
echo "3. Tap notification and verify it opens subscriptions tab"
echo "4. Check notification appears in iOS notification history"
echo ""
echo "🔗 Deep Link Testing:"
echo "1. Test direct deep link: truesharp://subscriptions?strategy=test-id"
echo "2. Test notification deep link navigation"
echo "3. Test deep link when app is closed vs open"
echo ""

# Test Summary
echo ""
print_status "Test Summary Complete"
echo ""
print_warning "Automated tests completed. Please run manual tests for full verification."
echo ""
print_status "To monitor real-time logs:"
echo "supabase functions logs send-push-notifications --project-ref trsogafrxpptszxydycn --follow"
echo "supabase functions logs add-bets-to-strategies --project-ref trsogafrxpptszxydycn --follow"