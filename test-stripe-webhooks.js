#!/usr/bin/env node

/**
 * Stripe Webhook Testing Script for TrueSharp
 * Tests webhook functionality without requiring Stripe signature verification
 */

import https from 'https';

// Configuration
const WEBHOOK_URL = 'https://truesharp-8ziyvo4uw-truesharps-projects.vercel.app/api/webhooks/stripe';

// Mock webhook events for testing
const mockEvents = {
  'checkout.session.completed': {
    id: 'evt_test_' + Math.random().toString(36).substr(2, 9),
    object: 'event',
    created: Math.floor(Date.now() / 1000),
    type: 'checkout.session.completed',
    livemode: false,
    pending_webhooks: 1,
    request: {
      id: 'req_test',
      idempotency_key: null
    },
    data: {
      object: {
        id: 'cs_test_' + Math.random().toString(36).substr(2, 9),
        object: 'checkout.session',
        customer: 'cus_test_customer',
        payment_status: 'paid',
        status: 'complete',
        subscription: 'sub_test_subscription',
        metadata: {
          strategy_id: '95a38163-d111-49d7-8489-f15be448c655',
          subscriber_id: '28991397-dae7-42e8-a822-0dffc6ff49b7', 
          seller_id: '0e16e4f5-f206-4e62-8282-4188ff8af48a',
          frequency: 'monthly',
          seller_connect_account_id: 'acct_test'
        }
      }
    }
  },
  
  'customer.subscription.created': {
    id: 'evt_test_' + Math.random().toString(36).substr(2, 9),
    object: 'event', 
    created: Math.floor(Date.now() / 1000),
    type: 'customer.subscription.created',
    livemode: false,
    data: {
      object: {
        id: 'sub_test_subscription',
        object: 'subscription',
        customer: 'cus_test_customer',
        status: 'active',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
        items: {
          data: [{
            price: {
              id: 'price_test_monthly'
            }
          }]
        },
        metadata: {
          strategy_id: '95a38163-d111-49d7-8489-f15be448c655',
          subscriber_id: '28991397-dae7-42e8-a822-0dffc6ff49b7',
          seller_id: '0e16e4f5-f206-4e62-8282-4188ff8af48a',
          frequency: 'monthly'
        }
      }
    }
  },

  'invoice.payment_succeeded': {
    id: 'evt_test_' + Math.random().toString(36).substr(2, 9),
    object: 'event',
    created: Math.floor(Date.now() / 1000), 
    type: 'invoice.payment_succeeded',
    livemode: false,
    data: {
      object: {
        id: 'in_test_invoice',
        object: 'invoice',
        customer: 'cus_test_customer',
        subscription: 'sub_test_subscription',
        status: 'paid',
        amount_paid: 2999,
        currency: 'usd'
      }
    }
  }
};

// Function to send webhook test
async function testWebhook(eventType) {
  return new Promise((resolve, reject) => {
    const event = mockEvents[eventType];
    if (!event) {
      reject(new Error(`Event type ${eventType} not found`));
      return;
    }

    const payload = JSON.stringify(event);
    
    console.log(`\n🧪 Testing webhook: ${eventType}`);
    console.log(`📦 Event ID: ${event.id}`);
    console.log(`🔗 Webhook URL: ${WEBHOOK_URL}`);
    
    const url = new URL(WEBHOOK_URL);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': payload.length,
        'stripe-signature': 'test_signature_bypass_verification',
        'User-Agent': 'TrueSharp-Webhook-Test/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`✅ Status: ${res.statusCode}`);
        console.log(`📄 Response: ${data}`);
        
        resolve({
          eventType,
          statusCode: res.statusCode,
          response: data,
          headers: res.headers
        });
      });
    });

    req.on('error', (error) => {
      console.error(`❌ Error testing ${eventType}:`, error.message);
      reject(error);
    });

    req.write(payload);
    req.end();
  });
}

// Function to test webhook endpoint health
async function testWebhookHealth() {
  return new Promise((resolve, reject) => {
    const healthUrl = WEBHOOK_URL.replace('/webhooks/stripe', '/debug/webhook-health');
    
    console.log(`\n🏥 Testing webhook health: ${healthUrl}`);
    
    const url = new URL(healthUrl);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TrueSharp-Webhook-Test/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`✅ Health Status: ${res.statusCode}`);
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(data);
            console.log(`📊 Health Report:`, JSON.stringify(parsed, null, 2));
          } catch {
            console.log(`📄 Response: ${data}`);
          }
        } else {
          console.log(`📄 Response: ${data}`);
        }
        
        resolve({
          statusCode: res.statusCode,
          response: data
        });
      });
    });

    req.on('error', (error) => {
      console.error(`❌ Health check error:`, error.message);
      reject(error);
    });

    req.end();
  });
}

// Main test function
async function runWebhookTests() {
  console.log('🚀 Starting Stripe Webhook Tests for TrueSharp');
  console.log('================================================');
  
  const results = [];
  
  try {
    // Test webhook health first
    console.log('\n1️⃣ Testing webhook health...');
    const healthResult = await testWebhookHealth();
    results.push({ test: 'health', ...healthResult });
    
    // Test each webhook event type
    const eventTypes = Object.keys(mockEvents);
    
    for (let i = 0; i < eventTypes.length; i++) {
      const eventType = eventTypes[i];
      console.log(`\n${i + 2}️⃣ Testing ${eventType}...`);
      
      try {
        const result = await testWebhook(eventType);
        results.push({ test: eventType, ...result });
        
        // Wait a bit between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`❌ Failed to test ${eventType}:`, error.message);
        results.push({ 
          test: eventType, 
          error: error.message,
          statusCode: 'ERROR'
        });
      }
    }
    
    // Summary
    console.log('\n📊 Test Results Summary');
    console.log('========================');
    
    results.forEach(result => {
      const status = result.statusCode === 200 ? '✅' : 
                    result.statusCode === 'ERROR' ? '❌' : 
                    result.statusCode >= 400 ? '⚠️' : '🔄';
      
      console.log(`${status} ${result.test}: ${result.statusCode || 'ERROR'}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    const successCount = results.filter(r => r.statusCode === 200).length;
    const totalCount = results.length;
    
    console.log(`\n🎯 Success Rate: ${successCount}/${totalCount} (${Math.round(successCount/totalCount*100)}%)`);
    
    if (successCount === totalCount) {
      console.log('🎉 All webhook tests passed!');
    } else {
      console.log('⚠️ Some webhook tests failed. Check the logs above for details.');
    }
    
  } catch (error) {
    console.error('💥 Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
if (import.meta.url === new URL(import.meta.url).href) {
  runWebhookTests().catch(console.error);
}

export { testWebhook, testWebhookHealth, runWebhookTests };
