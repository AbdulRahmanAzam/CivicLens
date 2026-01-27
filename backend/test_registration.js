#!/usr/bin/env node

/**
 * Quick test script to verify registration endpoint functionality
 */

const http = require('http');

// Test data
const testUser = {
  name: "Test User",
  email: "test@example.com",
  phone: "1234567890",
  password: "testpassword123",
  confirmPassword: "testpassword123"
};

// Test registration
function testRegistration() {
  const postData = JSON.stringify(testUser);
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/auth/register',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  console.log('🔵 Testing registration endpoint...');
  
  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log(`📊 Status: ${res.statusCode}`);
      console.log(`📋 Response:`, JSON.stringify(JSON.parse(data), null, 2));
      
      if (res.statusCode === 201) {
        console.log('✅ Registration test PASSED');
      } else {
        console.log('❌ Registration test FAILED');
      }
    });
  });

  req.on('error', (e) => {
    console.error('❌ Request error:', e.message);
  });

  req.write(postData);
  req.end();
}

// Wait a moment and test
setTimeout(testRegistration, 1000);

console.log('⏳ Waiting for server to be ready...');