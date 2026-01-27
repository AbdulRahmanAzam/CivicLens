/**
 * Test script for dual heatmap endpoints
 * Run this after starting the server to verify endpoints work correctly
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000/api/v1';

// ANSI color codes
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

async function testEndpoint(name, url, expectedStatus = 200) {
  try {
    console.log(`\n${colors.blue}Testing: ${name}${colors.reset}`);
    console.log(`URL: ${url}`);
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (response.status === expectedStatus) {
      console.log(`${colors.green}✓ Status: ${response.status} (Expected: ${expectedStatus})${colors.reset}`);
      console.log(`${colors.green}✓ Success: ${data.success}${colors.reset}`);
      
      if (data.data) {
        console.log(`${colors.green}✓ Data received:${colors.reset}`);
        console.log(JSON.stringify(data.data, null, 2).substring(0, 500) + '...');
      }
      
      return true;
    } else {
      console.log(`${colors.red}✗ Status: ${response.status} (Expected: ${expectedStatus})${colors.reset}`);
      console.log(JSON.stringify(data, null, 2));
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ Error: ${error.message}${colors.reset}`);
    return false;
  }
}

async function runTests() {
  console.log(`\n${colors.yellow}====================================${colors.reset}`);
  console.log(`${colors.yellow}  DUAL HEATMAP ENDPOINT TESTS${colors.reset}`);
  console.log(`${colors.yellow}====================================${colors.reset}\n`);

  const tests = [
    {
      name: 'Global Heatmap (Default)',
      url: `${BASE_URL}/complaints/heatmap/global`,
    },
    {
      name: 'Global Heatmap (7 days)',
      url: `${BASE_URL}/complaints/heatmap/global?days=7`,
    },
    {
      name: 'Global Heatmap (Category filter)',
      url: `${BASE_URL}/complaints/heatmap/global?days=30&category=roads`,
    },
    {
      name: 'Global Heatmap (High precision)',
      url: `${BASE_URL}/complaints/heatmap/global?days=90&precision=4`,
    },
    {
      name: 'Profile Heatmap (MCD_SOUTH)',
      url: `${BASE_URL}/complaints/heatmap/profile/MCD_SOUTH`,
    },
    {
      name: 'Profile Heatmap (180 days)',
      url: `${BASE_URL}/complaints/heatmap/profile/DELHI_POLICE?days=180`,
    },
    {
      name: 'Profile Heatmap (Missing entity ID - should fail)',
      url: `${BASE_URL}/complaints/heatmap/profile/`,
      expectedStatus: 404,
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = await testEndpoint(
      test.name,
      test.url,
      test.expectedStatus || 200
    );
    
    if (result) {
      passed++;
    } else {
      failed++;
    }
    
    await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
  }

  console.log(`\n\n${colors.yellow}====================================${colors.reset}`);
  console.log(`${colors.yellow}  TEST RESULTS${colors.reset}`);
  console.log(`${colors.yellow}====================================${colors.reset}`);
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  console.log(`Total: ${passed + failed}\n`);

  if (failed === 0) {
    console.log(`${colors.green}🎉 All tests passed!${colors.reset}\n`);
  } else {
    console.log(`${colors.red}⚠  Some tests failed. Check the output above.${colors.reset}\n`);
  }
}

// Run tests
runTests().catch(console.error);
