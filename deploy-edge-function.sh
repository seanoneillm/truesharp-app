#!/bin/bash

# Deploy the add-bets-to-strategies Edge Function to Supabase
echo "Deploying add-bets-to-strategies Edge Function..."

# Make sure you're in the project root
cd /Users/seanoneill/Desktop/truesharp

# Deploy the function
supabase functions deploy add-bets-to-strategies --project-ref trsogafrxpptszxydycn

echo "Edge Function deployed successfully!"
echo ""
echo "Next steps:"
echo "1. Run the database migration: add-push-notification-fields.sql"
echo "2. Test the function by adding bets to strategies in the iOS app"
echo "3. Verify push notifications are being sent to subscribers"