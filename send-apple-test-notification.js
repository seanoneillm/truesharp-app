#!/usr/bin/env node

/**
 * Send a test notification using Apple's App Store Server API
 * This will trigger Apple to send a TEST notification to your webhook
 */

const jwt = require('jsonwebtoken');

// Import fetch - handle both CommonJS and ESM
let fetch;
try {
  fetch = require('node-fetch');
} catch (error) {
  // Fallback to native fetch in newer Node.js versions
  fetch = globalThis.fetch;
}

// Apple API Configuration (using environment variables)
const APPLE_API_KEY_ID = process.env.APPLE_API_KEY_ID;
const APPLE_ISSUER_ID = process.env.APPLE_ISSUER_ID;
const APPLE_BUNDLE_ID = process.env.APPLE_BUNDLE_ID;
let APPLE_PRIVATE_KEY = process.env.APPLE_PRIVATE_KEY;

// Apple API endpoints
const SANDBOX_API_BASE = 'https://api.storekit-sandbox.itunes.apple.com';
const PRODUCTION_API_BASE = 'https://api.storekit.itunes.apple.com';

function generateAppleJWT() {
  // Process private key to ensure proper format
  if (APPLE_PRIVATE_KEY) {
    // Remove quotes if present
    APPLE_PRIVATE_KEY = APPLE_PRIVATE_KEY.replace(/^["']|["']$/g, '');
    // Ensure proper newlines (replace \n with actual newlines)
    APPLE_PRIVATE_KEY = APPLE_PRIVATE_KEY.replace(/\\n/g, '\n');
    
    // Ensure it starts and ends with proper markers
    if (!APPLE_PRIVATE_KEY.includes('\n') && APPLE_PRIVATE_KEY.includes('-----BEGIN PRIVATE KEY-----')) {
      // If it's all on one line, try to format it properly
      APPLE_PRIVATE_KEY = APPLE_PRIVATE_KEY
        .replace('-----BEGIN PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----\n')
        .replace('-----END PRIVATE KEY-----', '\n-----END PRIVATE KEY-----')
        // Add newlines every 64 characters in the middle
        .replace(/^-----BEGIN PRIVATE KEY-----\n(.+)\n-----END PRIVATE KEY-----$/, (match, content) => {
          const formattedContent = content.match(/.{1,64}/g)?.join('\n') || content;
          return `-----BEGIN PRIVATE KEY-----\n${formattedContent}\n-----END PRIVATE KEY-----`;
        });
    }
  }

  if (!APPLE_API_KEY_ID || !APPLE_ISSUER_ID || !APPLE_PRIVATE_KEY || !APPLE_BUNDLE_ID) {
    const debugInfo = {
      keyId: APPLE_API_KEY_ID ? 'SET' : 'MISSING',
      issuerId: APPLE_ISSUER_ID ? 'SET' : 'MISSING', 
      privateKey: APPLE_PRIVATE_KEY ? 'SET' : 'MISSING',
      bundleId: APPLE_BUNDLE_ID ? 'SET' : 'MISSING',
      keyIdLength: APPLE_API_KEY_ID?.length || 0,
      issuerIdLength: APPLE_ISSUER_ID?.length || 0,
      privateKeyLength: APPLE_PRIVATE_KEY?.length || 0,
      bundleIdLength: APPLE_BUNDLE_ID?.length || 0
    };
    throw new Error(`Missing Apple API credentials. Debug: ${JSON.stringify(debugInfo)}`);
  }

  const now = Math.round(Date.now() / 1000);
  
  const payload = {
    iss: APPLE_ISSUER_ID,
    iat: now,
    exp: now + 3600, // 1 hour expiration
    aud: 'appstoreconnect-v1',
    bid: APPLE_BUNDLE_ID
  };

  try {
    console.log('🔐 Generating Apple JWT token...');
    return jwt.sign(payload, APPLE_PRIVATE_KEY, {
      algorithm: 'ES256',
      header: {
        alg: 'ES256',
        kid: APPLE_API_KEY_ID,
        typ: 'JWT'
      }
    });
  } catch (error) {
    console.error('❌ JWT generation failed:', error);
    throw new Error(`Failed to generate App Store API token: ${error.message}`);
  }
}

async function sendTestNotification(environment = 'sandbox') {
  try {
    console.log(`🧪 Sending test notification to ${environment} environment...`);
    
    const apiBase = environment === 'sandbox' ? SANDBOX_API_BASE : PRODUCTION_API_BASE;
    const apiToken = generateAppleJWT();
    
    console.log('✅ JWT token generated successfully');
    console.log(`📡 Making request to: ${apiBase}/inApps/v1/notifications/test`);
    
    const response = await fetch(`${apiBase}/inApps/v1/notifications/test`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'TrueSharp/1.0'
      },
      body: JSON.stringify({
        notificationType: 'TEST'
      })
    });

    console.log(`📊 Response status: ${response.status}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Test notification sent successfully!');
      console.log('📋 Response:', JSON.stringify(result, null, 2));
      console.log('🔍 Check your Vercel logs for the webhook notification');
      console.log('📱 Webhook URL: https://truesharp.io/api/apple-webhooks');
      return result;
    } else {
      const errorText = await response.text();
      console.error(`❌ Failed to send test notification: HTTP ${response.status}`);
      console.error('📋 Error response:', errorText);
      
      // Try to parse error details
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.errorMessage) {
          console.error('💡 Error details:', errorJson.errorMessage);
        }
      } catch (parseError) {
        // Response wasn't JSON, that's fine
      }
      
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
  } catch (error) {
    console.error('❌ Error sending test notification:', error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 Apple Test Notification Sender');
  console.log('================================');
  
  try {
    // Try sandbox first (most common for testing)
    console.log('📱 Attempting to send test notification to SANDBOX environment...');
    await sendTestNotification('sandbox');
    
    console.log('\n🎉 Success! Apple should now send a TEST notification to your webhook.');
    console.log('📊 Monitor your Vercel logs at: https://vercel.com/dashboard');
    console.log('🔗 Or check logs directly in Vercel CLI: vercel logs');
    
  } catch (sandboxError) {
    console.log('\n⚠️  Sandbox failed, trying production environment...');
    
    try {
      await sendTestNotification('production');
      console.log('\n🎉 Success with production environment!');
    } catch (productionError) {
      console.error('\n💥 Both environments failed:');
      console.error('📋 Sandbox error:', sandboxError.message);
      console.error('📋 Production error:', productionError.message);
      process.exit(1);
    }
  }
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Script failed:', error.message);
    process.exit(1);
  });
}

module.exports = { sendTestNotification };