#!/bin/bash

echo "🚀 Deploying Add Bets to Strategies Edge Function"
echo ""
echo "Step 1: Get your access token from:"
echo "https://supabase.com/dashboard/account/tokens"
echo ""
echo "Step 2: Copy the token and run:"
echo "export SUPABASE_ACCESS_TOKEN=\"your_token_here\""
echo ""
echo "Step 3: Run this script again with the token set"
echo ""

if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo "❌ SUPABASE_ACCESS_TOKEN not set"
  echo "Please set your token first:"
  echo "export SUPABASE_ACCESS_TOKEN=\"your_token_here\""
  exit 1
fi

echo "✅ Token found, deploying function..."
supabase functions deploy add-bets-to-strategies --project-ref trsogafrxpptszxydycn

if [ $? -eq 0 ]; then
  echo ""
  echo "🎉 Function deployed successfully!"
  echo ""
  echo "Now update the iOS app to use the Edge Function:"
  echo "Change the URL back to:"
  echo "const url = \`\${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/add-bets-to-strategies\`;"
else
  echo ""
  echo "❌ Deployment failed"
  echo "Try deploying manually via dashboard:"
  echo "https://supabase.com/dashboard/project/trsogafrxpptszxydycn/functions"
fi