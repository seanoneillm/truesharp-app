#!/usr/bin/env node

/**
 * Test different private key formats for ES256 JWT
 */

const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '.env.local' });

function testKeyFormats() {
  console.log('🔍 Testing Apple Private Key Formats for ES256\n');
  
  const keyId = process.env.APPLE_API_KEY_ID;
  const issuerId = process.env.APPLE_ISSUER_ID;
  const bundleId = process.env.APPLE_BUNDLE_ID;
  const originalKey = process.env.APPLE_PRIVATE_KEY;
  
  console.log('📋 Current Key Info:');
  console.log('Key ID:', keyId);
  console.log('Key length:', originalKey?.length);
  console.log('Key starts with:', originalKey?.substring(0, 30));
  console.log('Key ends with:', originalKey?.substring(originalKey.length - 30));
  
  const now = Math.round(Date.now() / 1000);
  const payload = {
    iss: issuerId,
    iat: now,
    exp: now + 3600,
    aud: 'appstoreconnect-v1',
    bid: bundleId
  };
  
  console.log('\n🧪 Testing Current Format:');
  try {
    const token = jwt.sign(payload, originalKey, {
      algorithm: 'ES256',
      header: {
        alg: 'ES256',
        kid: keyId,
        typ: 'JWT'
      }
    });
    console.log('✅ SUCCESS: Current format works');
    console.log('Token preview:', token.substring(0, 50) + '...');
  } catch (error) {
    console.log('❌ FAILED:', error.message);
  }
  
  // Test format that would match one-line format
  console.log('\n🧪 Testing One-Line Format (like current Vercel):');
  const oneLineKey = originalKey?.replace(/\n/g, '');
  try {
    const token = jwt.sign(payload, oneLineKey, {
      algorithm: 'ES256',
      header: {
        alg: 'ES256',
        kid: keyId,
        typ: 'JWT'
      }
    });
    console.log('✅ SUCCESS: One-line format works');
  } catch (error) {
    console.log('❌ FAILED:', error.message);
  }
  
  // Test format with explicit newlines
  console.log('\n🧪 Testing \\n Format:');
  const backslashNKey = originalKey?.replace(/\n/g, '\\n');
  try {
    const token = jwt.sign(payload, backslashNKey, {
      algorithm: 'ES256',
      header: {
        alg: 'ES256',
        kid: keyId,
        typ: 'JWT'
      }
    });
    console.log('✅ SUCCESS: \\n format works');
  } catch (error) {
    console.log('❌ FAILED:', error.message);
  }
  
  // Show exact format needed for Vercel
  console.log('\n📝 Exact Format for Vercel Environment Variable:');
  console.log('Copy this EXACTLY into Vercel APPLE_PRIVATE_KEY:');
  console.log('━'.repeat(60));
  console.log(originalKey);
  console.log('━'.repeat(60));
  
  console.log('\n💡 Alternative with \\n escapes:');
  console.log('━'.repeat(60));
  console.log(originalKey?.replace(/\n/g, '\\n'));
  console.log('━'.repeat(60));
}

testKeyFormats();