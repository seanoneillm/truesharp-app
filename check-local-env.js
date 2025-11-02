#!/usr/bin/env node

/**
 * Check Local Environment Variables
 */

require('dotenv').config({ path: '.env.local' });

console.log('🔍 Checking Local Environment Variables\n');

console.log('📋 Apple API Configuration:');
console.log('APPLE_API_KEY_ID:', process.env.APPLE_API_KEY_ID);
console.log('APPLE_ISSUER_ID:', process.env.APPLE_ISSUER_ID);
console.log('APPLE_BUNDLE_ID:', process.env.APPLE_BUNDLE_ID);
console.log('APPLE_PRIVATE_KEY (first 100 chars):', process.env.APPLE_PRIVATE_KEY?.substring(0, 100) + '...');

console.log('\n🔍 Checking for other environment files:');
const fs = require('fs');
const path = require('path');

const envFiles = ['.env', '.env.local', '.env.development', '.env.production'];

envFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ Found: ${file}`);
    
    // Check if it contains Apple keys
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('APPLE_API_KEY_ID')) {
      const match = content.match(/APPLE_API_KEY_ID=([^\s\n]+)/);
      if (match) {
        console.log(`   🔑 Contains APPLE_API_KEY_ID: ${match[1]}`);
      }
    }
  } else {
    console.log(`❌ Not found: ${file}`);
  }
});

console.log('\n📁 Environment Loading Order (dotenv):');
console.log('1. .env.local (highest priority for local development)');
console.log('2. .env.development (if NODE_ENV=development)');
console.log('3. .env (lowest priority)');

console.log('\n🎯 Current NODE_ENV:', process.env.NODE_ENV || 'undefined');