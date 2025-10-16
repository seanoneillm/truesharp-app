#!/usr/bin/env node

// Simple test for the add-bets-to-strategies API route
const https = require('https');

async function testApiRoute() {
    console.log('🧪 Testing add-bets-to-strategies API route...\n');

    const testData = {
        betIds: ['test-bet-1', 'test-bet-2'],
        strategyIds: ['test-strategy-1'],
        userId: 'test-user-id'
    };

    const postData = JSON.stringify(testData);

    const options = {
        hostname: 'truesharp.io',
        port: 443,
        path: '/api/add-bets-to-strategies',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                console.log(`Status Code: ${res.statusCode}`);
                console.log('Response Headers:', res.headers);
                console.log('Response Body:', data);
                
                if (res.statusCode === 200 || res.statusCode === 400 || res.statusCode === 401) {
                    console.log('\n✅ API route is accessible and responding');
                } else {
                    console.log('\n❌ API route returned unexpected status');
                }
                
                resolve(data);
            });
        });

        req.on('error', (e) => {
            console.error('❌ Error testing API route:', e.message);
            reject(e);
        });

        req.write(postData);
        req.end();
    });
}

testApiRoute().catch(console.error);