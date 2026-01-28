// Quick test script to check backend connectivity
import https from 'https';

const testEndpoints = [
  { url: 'https://civiclensbackend.abdulrahmanazam.me/', name: 'Root' },
  { url: 'https://civiclensbackend.abdulrahmanazam.me/api/v1', name: 'API Root' },
  { url: 'https://civiclensbackend.abdulrahmanazam.me/api/v1/health', name: 'Health Check' },
];

console.log('🔍 Testing backend endpoints...\n');

const testEndpoint = (url, name) => {
  return new Promise((resolve) => {
    const req = https.get(url, { timeout: 5000 }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`✅ ${name} (${url})`);
        console.log(`   Status: ${res.statusCode}`);
        try {
          const json = JSON.parse(data);
          console.log(`   Response:`, JSON.stringify(json, null, 2));
        } catch (e) {
          console.log(`   Response:`, data.substring(0, 200));
        }
        console.log('');
        resolve();
      });
    });
    
    req.on('error', (err) => {
      console.log(`❌ ${name} (${url})`);
      console.log(`   Error: ${err.message}`);
      console.log('');
      resolve();
    });
    
    req.on('timeout', () => {
      console.log(`⏱️  ${name} (${url})`);
      console.log(`   Error: Request timed out`);
      console.log('');
      req.destroy();
      resolve();
    });
  });
};

// Test endpoints sequentially
for (const endpoint of testEndpoints) {
  await testEndpoint(endpoint.url, endpoint.name);
}
