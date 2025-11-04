#!/bin/bash

# Test different subscription notification types that Apple sends
echo "🧪 Testing Different Apple Notification Types"
echo "============================================"

# Generate JWT token
echo "🔐 Generating Apple JWT token..."
JWT_TOKEN=$(node -e "
const jwt = require('jsonwebtoken');
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
  header: { alg: 'ES256', kid: process.env.APPLE_API_KEY_ID, typ: 'JWT' }
});
console.log(token);
")

if [ -z "$JWT_TOKEN" ]; then
    echo "❌ Failed to generate JWT token"
    exit 1
fi

echo "✅ JWT token generated"

# Test different notification types
NOTIFICATION_TYPES=("TEST" "SUBSCRIBED" "DID_RENEW" "EXPIRED")

for TYPE in "${NOTIFICATION_TYPES[@]}"; do
    echo ""
    echo "📱 Testing notification type: $TYPE"
    
    RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}\n" \
        -X POST \
        -H "Authorization: Bearer $JWT_TOKEN" \
        -H "Content-Type: application/json" \
        -H "User-Agent: TrueSharp/1.0" \
        -d "{\"notificationType\":\"$TYPE\"}" \
        "https://api.storekit-sandbox.itunes.apple.com/inApps/v1/notifications/test")
    
    HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
    RESPONSE_BODY=$(echo "$RESPONSE" | grep -v "HTTP_STATUS:")
    
    if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "202" ]; then
        echo "✅ $TYPE: Success (HTTP $HTTP_STATUS)"
        echo "   Token: $(echo "$RESPONSE_BODY" | jq -r '.testNotificationToken // "N/A"' 2>/dev/null || echo "$RESPONSE_BODY")"
    else
        echo "❌ $TYPE: Failed (HTTP $HTTP_STATUS)"
        echo "   Response: $RESPONSE_BODY"
    fi
done

echo ""
echo "🔍 Check your Vercel logs to see which notification types Apple supports for testing"
echo "📊 Monitor: https://vercel.com/dashboard"