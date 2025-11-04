#!/bin/bash

# Apple Test Notification Sender using curl
# This will trigger Apple to send a TEST notification to your webhook

echo "🚀 Apple Test Notification Sender (curl version)"
echo "==============================================="

# Check if required environment variables are set
if [ -z "$APPLE_API_KEY_ID" ] || [ -z "$APPLE_ISSUER_ID" ] || [ -z "$APPLE_PRIVATE_KEY" ] || [ -z "$APPLE_BUNDLE_ID" ]; then
    echo "❌ Missing required environment variables:"
    echo "   APPLE_API_KEY_ID: ${APPLE_API_KEY_ID:+SET}"
    echo "   APPLE_ISSUER_ID: ${APPLE_ISSUER_ID:+SET}"
    echo "   APPLE_PRIVATE_KEY: ${APPLE_PRIVATE_KEY:+SET}"
    echo "   APPLE_BUNDLE_ID: ${APPLE_BUNDLE_ID:+SET}"
    echo ""
    echo "💡 Make sure these are set in your .env file or environment"
    exit 1
fi

# Generate JWT token using Node.js (since it's complex to do in bash)
echo "🔐 Generating Apple JWT token..."
JWT_TOKEN=$(node -e "
const jwt = require('jsonwebtoken');

// Process private key
let privateKey = process.env.APPLE_PRIVATE_KEY;
privateKey = privateKey.replace(/^[\"']|[\"']$/g, '');
privateKey = privateKey.replace(/\\\\n/g, '\n');

if (!privateKey.includes('\n') && privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
  privateKey = privateKey
    .replace('-----BEGIN PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----\n')
    .replace('-----END PRIVATE KEY-----', '\n-----END PRIVATE KEY-----')
    .replace(/^-----BEGIN PRIVATE KEY-----\n(.+)\n-----END PRIVATE KEY-----$/, (match, content) => {
      const formattedContent = content.match(/.{1,64}/g)?.join('\n') || content;
      return \`-----BEGIN PRIVATE KEY-----\n\${formattedContent}\n-----END PRIVATE KEY-----\`;
    });
}

const now = Math.round(Date.now() / 1000);
const payload = {
  iss: process.env.APPLE_ISSUER_ID,
  iat: now,
  exp: now + 3600,
  aud: 'appstoreconnect-v1',
  bid: process.env.APPLE_BUNDLE_ID
};

const token = jwt.sign(payload, privateKey, {
  algorithm: 'ES256',
  header: {
    alg: 'ES256',
    kid: process.env.APPLE_API_KEY_ID,
    typ: 'JWT'
  }
});

console.log(token);
")

if [ $? -ne 0 ] || [ -z "$JWT_TOKEN" ]; then
    echo "❌ Failed to generate JWT token"
    exit 1
fi

echo "✅ JWT token generated successfully"

# Try sandbox environment first
echo "📱 Sending test notification to SANDBOX environment..."
SANDBOX_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}\n" \
    -X POST \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -H "User-Agent: TrueSharp/1.0" \
    -d '{"notificationType":"TEST"}' \
    "https://api.storekit-sandbox.itunes.apple.com/inApps/v1/notifications/test")

# Extract HTTP status code
HTTP_STATUS=$(echo "$SANDBOX_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
RESPONSE_BODY=$(echo "$SANDBOX_RESPONSE" | grep -v "HTTP_STATUS:")

echo "📊 Sandbox response status: $HTTP_STATUS"

if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "202" ]; then
    echo "✅ Test notification sent successfully to SANDBOX!"
    echo "📋 Response: $RESPONSE_BODY"
    echo ""
    echo "🎉 Success! Apple should now send a TEST notification to your webhook."
    echo "📊 Monitor your Vercel logs at: https://vercel.com/dashboard"
    echo "📱 Webhook URL: https://truesharp.io/api/apple-webhooks"
    exit 0
else
    echo "⚠️ Sandbox failed with status $HTTP_STATUS"
    echo "📋 Response: $RESPONSE_BODY"
    echo ""
    echo "🔄 Trying PRODUCTION environment..."
    
    # Try production environment
    PROD_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}\n" \
        -X POST \
        -H "Authorization: Bearer $JWT_TOKEN" \
        -H "Content-Type: application/json" \
        -H "User-Agent: TrueSharp/1.0" \
        -d '{"notificationType":"TEST"}' \
        "https://api.storekit.itunes.apple.com/inApps/v1/notifications/test")
    
    # Extract HTTP status code
    PROD_HTTP_STATUS=$(echo "$PROD_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
    PROD_RESPONSE_BODY=$(echo "$PROD_RESPONSE" | grep -v "HTTP_STATUS:")
    
    echo "📊 Production response status: $PROD_HTTP_STATUS"
    
    if [ "$PROD_HTTP_STATUS" = "200" ] || [ "$PROD_HTTP_STATUS" = "202" ]; then
        echo "✅ Test notification sent successfully to PRODUCTION!"
        echo "📋 Response: $PROD_RESPONSE_BODY"
        echo ""
        echo "🎉 Success! Apple should now send a TEST notification to your webhook."
        echo "📊 Monitor your Vercel logs at: https://vercel.com/dashboard"
        echo "📱 Webhook URL: https://truesharp.io/api/apple-webhooks"
    else
        echo "❌ Both environments failed:"
        echo "📋 Sandbox ($HTTP_STATUS): $RESPONSE_BODY"
        echo "📋 Production ($PROD_HTTP_STATUS): $PROD_RESPONSE_BODY"
        exit 1
    fi
fi