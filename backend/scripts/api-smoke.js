/*
 * API Smoke Test Runner
 * - Runs a small suite of API calls against the backend
 * - Outputs results to console and writes a JSON report under /reports
 * - Demo data is configurable below
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Configurable demo data
const envNumber = (key, fallback) => {
  const val = process.env[key];
  return val !== undefined ? Number(val) : fallback;
};

// Configurable demo data (override via env vars)
const demoData = {
  baseLocation: {
    latitude: envNumber('TEST_LAT', 33.6844),
    longitude: envNumber('TEST_LNG', 73.0479),
    radius: envNumber('TEST_RADIUS', 2000),
  },
  classificationText: process.env.TEST_CLASSIFY_TEXT
    || 'Overflowing garbage bin causing foul smell near main road.',
  complaint: {
    description: process.env.TEST_COMPLAINT_DESC
      || 'Pothole on the main road causing traffic slowdown',
    phone: process.env.TEST_PHONE || '03001234567',
    name: process.env.TEST_NAME || 'Test User',
    latitude: envNumber('TEST_LAT', 33.6844),
    longitude: envNumber('TEST_LNG', 73.0479),
    address: process.env.TEST_ADDRESS || 'Main Road, Sector 5',
    area: process.env.TEST_AREA || 'Sector 5',
    ward: process.env.TEST_WARD || 'Ward 3',
    category: process.env.TEST_CATEGORY || 'Roads',
    attachments: [],
    // Optional manual UC/Town/City IDs if geo assignment fails
    ucId: process.env.TEST_UC_ID || undefined,
    townId: process.env.TEST_TOWN_ID || undefined,
    cityId: process.env.TEST_CITY_ID || undefined,
  },
};

const baseURL = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3000}/api/v1`;
const authToken = process.env.TEST_BEARER_TOKEN || '';

const tests = [
  {
    name: 'List categories',
    method: 'get',
    url: '/categories',
  },
  {
    name: 'Create complaint',
    method: 'post',
    url: '/complaints',
    data: demoData.complaint,
  },
  {
    name: 'Get complaints (paginated)',
    method: 'get',
    url: '/complaints',
    params: { limit: 5 },
    requiresAuth: true,
  },
  {
    name: 'Category stats',
    method: 'get',
    url: '/categories/stats',
  },
  {
    name: 'Complaint heatmap',
    method: 'get',
    url: '/complaints/heatmap',
    params: {
      lat: demoData.baseLocation.latitude,
      lng: demoData.baseLocation.longitude,
      radius: demoData.baseLocation.radius,
    },
  },
  {
    name: 'Classify text',
    method: 'post',
    url: '/categories/classify',
    data: { text: demoData.classificationText },
  },
];

const runTest = async (test) => {
  const started = Date.now();
  if (test.requiresAuth && !authToken) {
    return {
      name: test.name,
      success: false,
      status: 'skipped',
      durationMs: 0,
      message: 'Skipped: set TEST_BEARER_TOKEN to enable',
    };
  }

  try {
    const response = await axios({
      baseURL,
      url: test.url,
      method: test.method,
      data: test.data,
      params: test.params,
      headers: {
        ...(test.requiresAuth && authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        'Content-Type': 'application/json',
      },
      validateStatus: () => true,
    });

    const durationMs = Date.now() - started;
    const success = response.status >= 200 && response.status < 300;

    return {
      name: test.name,
      success,
      status: response.status,
      durationMs,
      message: response.data?.message || (success ? 'OK' : 'Non-2xx response'),
      sample: truncateSample(response.data),
    };
  } catch (error) {
    const durationMs = Date.now() - started;
    return {
      name: test.name,
      success: false,
      status: error.response?.status || 'error',
      durationMs,
      message: error.message,
      sample: truncateSample(error.response?.data),
    };
  }
};

const truncateSample = (data) => {
  if (!data) return null;
  try {
    const json = JSON.stringify(data);
    return json.length > 500 ? `${json.slice(0, 500)}...` : json;
  } catch (_) {
    return String(data).slice(0, 500);
  }
};

const writeReport = (results) => {
  const reportsDir = path.join(__dirname, '../reports');
  fs.mkdirSync(reportsDir, { recursive: true });

  const filePath = path.join(
    reportsDir,
    `api-smoke-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
  );

  const payload = {
    meta: {
      baseURL,
      authTokenPresent: !!authToken,
      startedAt: new Date().toISOString(),
    },
    demoData,
    results,
  };

  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
  return filePath;
};

(async () => {
  console.log(`Running ${tests.length} API smoke tests against ${baseURL}`);
  if (!authToken) {
    console.log('Note: No TEST_BEARER_TOKEN provided; auth-only tests will be skipped.');
  }

  const results = [];
  for (const test of tests) {
    const result = await runTest(test);
    results.push(result);
    console.log(`[${result.success ? 'PASS' : 'FAIL'}] ${test.name} -> status ${result.status} (${result.durationMs}ms)`);
    if (!result.success) {
      console.log(`  Message: ${result.message}`);
    }
  }

  console.table(results.map(r => ({
    Test: r.name,
    Success: r.success,
    Status: r.status,
    DurationMs: r.durationMs,
    Message: r.message,
  })));

  const reportPath = writeReport(results);
  const failures = results.filter(r => !r.success).length;

  console.log(`\nReport saved to: ${reportPath}`);
  console.log(`Completed with ${failures} failure(s).`);
  process.exitCode = failures > 0 ? 1 : 0;
})();
