/**
 * Phase 4: Load Testing for Migration Validation
 * K6 performance tests to validate system under load
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
export const errorRate = new Rate('error_rate');
export const responseTime = new Trend('response_time');

// Test configuration
export const options = {
  stages: [
    // Phase 1: Warm up
    { duration: '2m', target: 100 },   // Ramp up to 100 users over 2 minutes
    { duration: '5m', target: 100 },   // Stay at 100 users for 5 minutes

    // Phase 2: Load test
    { duration: '2m', target: 500 },   // Ramp up to 500 users over 2 minutes
    { duration: '10m', target: 500 },  // Stay at 500 users for 10 minutes

    // Phase 3: Stress test
    { duration: '2m', target: 1000 },  // Ramp up to 1000 users over 2 minutes
    { duration: '5m', target: 1000 },  // Stay at 1000 users for 5 minutes

    // Phase 4: Spike test
    { duration: '1m', target: 2000 },  // Spike to 2000 users over 1 minute
    { duration: '3m', target: 2000 },  // Stay at 2000 users for 3 minutes

    // Phase 5: Cool down
    { duration: '2m', target: 100 },   // Ramp down to 100 users
    { duration: '2m', target: 0 },     // Ramp down to 0 users
  ],
  thresholds: {
    // Performance requirements from migration plan
    http_req_duration: ['p(95)<200'],     // 95% of requests under 200ms
    http_req_failed: ['rate<0.1'],        // Error rate under 10%
    error_rate: ['rate<0.05'],           // Custom error rate under 5%
    response_time: ['p(95)<200'],        // 95th percentile under 200ms
  },
  ext: {
    loadimpact: {
      distribution: {
        'amazon:us:ashburn': { loadZone: 'amazon:us:ashburn', percent: 50 },
        'amazon:eu:dublin': { loadZone: 'amazon:eu:dublin', percent: 30 },
        'amazon:ap:singapore': { loadZone: 'amazon:ap:singapore', percent: 20 },
      },
    },
  },
};

// Configuration
const BASE_URL = __ENV.API_BASE_URL || 'https://api.spike-platform.com';
const TENANTS = ['bgu', 'tau', 'huji'];

// Test data
const TEST_USERS = {
  bgu: { email: 'loadtest@bgu.ac.il', password: 'loadtest123' },
  tau: { email: 'loadtest@tau.ac.il', password: 'loadtest123' },
  huji: { email: 'loadtest@huji.ac.il', password: 'loadtest123' }
};

// Utility function to get random tenant
function getRandomTenant() {
  return TENANTS[Math.floor(Math.random() * TENANTS.length)];
}

// Authentication helper
function authenticate(tenant) {
  const loginPayload = {
    email: TEST_USERS[tenant].email,
    password: TEST_USERS[tenant].password
  };

  const loginParams = {
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenant,
    },
  };

  const response = http.post(`${BASE_URL}/auth/login`, JSON.stringify(loginPayload), loginParams);

  const success = check(response, {
    'authentication successful': (r) => r.status === 200,
    'received auth token': (r) => {
      try {
        const json = r.json();
        return json && json.token && json.token.length > 0;
      } catch {
        return false;
      }
    },
  });

  errorRate.add(!success);
  responseTime.add(response.timings.duration);

  if (success) {
    const authData = response.json();
    return {
      token: authData.token,
      userId: authData.user.id,
      tenant: tenant
    };
  }

  return null;
}

// Main load test scenario
export default function () {
  const tenant = getRandomTenant();
  const auth = authenticate(tenant);

  if (!auth) {
    console.log(`Authentication failed for tenant: ${tenant}`);
    return;
  }

  const authHeaders = {
    'Authorization': `Bearer ${auth.token}`,
    'Content-Type': 'application/json',
    'X-Tenant-ID': auth.tenant,
  };

  // Test scenario 1: Dashboard data loading (Analytics Service)
  group('Dashboard Analytics', function () {
    const dashboardResponse = http.get(`${BASE_URL}/analytics/dashboard`, {
      headers: authHeaders,
    });

    const dashboardSuccess = check(dashboardResponse, {
      'dashboard loads successfully': (r) => r.status === 200,
      'dashboard response time < 500ms': (r) => r.timings.duration < 500,
    });

    errorRate.add(!dashboardSuccess);
    responseTime.add(dashboardResponse.timings.duration);
  });

  // Test scenario 2: Course data retrieval (Academic Service)
  group('Academic Data', function () {
    const coursesResponse = http.get(`${BASE_URL}/academic/courses`, {
      headers: authHeaders,
    });

    const coursesSuccess = check(coursesResponse, {
      'courses load successfully': (r) => r.status === 200,
      'courses data is valid': (r) => {
        try {
          const data = r.json();
          return Array.isArray(data);
        } catch {
          return false;
        }
      },
    });

    errorRate.add(!coursesSuccess);
    responseTime.add(coursesResponse.timings.duration);

    // Get assignments for a random course
    if (coursesSuccess && coursesResponse.json().length > 0) {
      const courses = coursesResponse.json();
      const randomCourse = courses[Math.floor(Math.random() * courses.length)];

      const assignmentsResponse = http.get(`${BASE_URL}/academic/courses/${randomCourse.id}/assignments`, {
        headers: authHeaders,
      });

      const assignmentsSuccess = check(assignmentsResponse, {
        'assignments load successfully': (r) => r.status === 200,
      });

      errorRate.add(!assignmentsSuccess);
      responseTime.add(assignmentsResponse.timings.duration);
    }
  });

  // Test scenario 3: Notification checking
  group('Notifications', function () {
    const notificationsResponse = http.get(`${BASE_URL}/notifications`, {
      headers: authHeaders,
    });

    const notificationsSuccess = check(notificationsResponse, {
      'notifications load successfully': (r) => r.status === 200,
    });

    errorRate.add(!notificationsSuccess);
    responseTime.add(notificationsResponse.timings.duration);
  });

  // Test scenario 4: Sync status checking (Sync Orchestrator)
  group('Sync Status', function () {
    const syncResponse = http.get(`${BASE_URL}/sync/status`, {
      headers: authHeaders,
    });

    const syncSuccess = check(syncResponse, {
      'sync status loads successfully': (r) => r.status === 200,
      'sync status has valid data': (r) => {
        try {
          const data = r.json();
          return data && typeof data.lastSync === 'string';
        } catch {
          return false;
        }
      },
    });

    errorRate.add(!syncSuccess);
    responseTime.add(syncResponse.timings.duration);
  });

  // Test scenario 5: Tenant-specific operations
  group('Tenant Operations', function () {
    const tenantConfigResponse = http.get(`${BASE_URL}/tenant/config`, {
      headers: authHeaders,
    });

    const configSuccess = check(tenantConfigResponse, {
      'tenant config loads successfully': (r) => r.status === 200,
      'tenant config is for correct tenant': (r) => {
        try {
          const config = r.json();
          return config.tenantId === auth.tenant;
        } catch {
          return false;
        }
      },
    });

    errorRate.add(!configSuccess);
    responseTime.add(tenantConfigResponse.timings.duration);
  });

  // Simulate user think time
  sleep(Math.random() * 2 + 1); // 1-3 seconds
}

// Stress test scenario for database connections
export function stressTestDatabaseConnections() {
  const tenant = getRandomTenant();
  const auth = authenticate(tenant);

  if (!auth) return;

  const authHeaders = {
    'Authorization': `Bearer ${auth.token}`,
    'Content-Type': 'application/json',
    'X-Tenant-ID': auth.tenant,
  };

  // Simulate heavy database operations
  group('Database Stress Test', function () {
    // Multiple concurrent requests to database-heavy endpoints
    const requests = [
      http.get(`${BASE_URL}/analytics/detailed-dashboard`, { headers: authHeaders }),
      http.get(`${BASE_URL}/academic/courses/search?query=all`, { headers: authHeaders }),
      http.get(`${BASE_URL}/academic/assignments/history`, { headers: authHeaders }),
      http.get(`${BASE_URL}/analytics/performance-metrics`, { headers: authHeaders }),
    ];

    const responses = http.batch(requests);

    responses.forEach((response, index) => {
      const success = check(response, {
        [`database request ${index} successful`]: (r) => r.status === 200,
        [`database request ${index} under 1s`]: (r) => r.timings.duration < 1000,
      });

      errorRate.add(!success);
      responseTime.add(response.timings.duration);
    });
  });
}

// Memory stress test scenario
export function stressTestMemoryUsage() {
  const tenant = getRandomTenant();
  const auth = authenticate(tenant);

  if (!auth) return;

  const authHeaders = {
    'Authorization': `Bearer ${auth.token}`,
    'Content-Type': 'application/json',
    'X-Tenant-ID': auth.tenant,
  };

  // Simulate memory-intensive operations
  group('Memory Stress Test', function () {
    // Request large data sets
    const largeDataResponse = http.get(`${BASE_URL}/analytics/export/full-data`, {
      headers: authHeaders,
    });

    const success = check(largeDataResponse, {
      'large data export successful': (r) => r.status === 200,
      'large data export under 5s': (r) => r.timings.duration < 5000,
    });

    errorRate.add(!success);
    responseTime.add(largeDataResponse.timings.duration);
  });
}

// Tenant isolation stress test
export function stressTestTenantIsolation() {
  const tenants = ['bgu', 'tau', 'huji'];
  const auths = tenants.map(tenant => ({ tenant, auth: authenticate(tenant) }));

  group('Tenant Isolation Stress Test', function () {
    auths.forEach(({ tenant, auth }) => {
      if (!auth) return;

      const authHeaders = {
        'Authorization': `Bearer ${auth.token}`,
        'Content-Type': 'application/json',
        'X-Tenant-ID': tenant,
      };

      // Create tenant-specific data rapidly
      const createResponse = http.post(`${BASE_URL}/academic/courses`, JSON.stringify({
        name: `Stress Test Course ${Math.random()}`,
        code: `${tenant.toUpperCase()}-STRESS-${Math.floor(Math.random() * 1000)}`,
        faculty: 'Load Testing'
      }), { headers: authHeaders });

      const success = check(createResponse, {
        [`${tenant} data creation successful`]: (r) => r.status === 201,
        [`${tenant} data creation under 1s`]: (r) => r.timings.duration < 1000,
      });

      errorRate.add(!success);
      responseTime.add(createResponse.timings.duration);
    });
  });
}

// Test phases based on stage
export function handleSummary(data) {
  console.log('\n📊 Phase 4 Load Testing Summary');
  console.log('================================');

  console.log(`\n🎯 Performance Targets:`);
  console.log(`   • Response Time (95th): < 200ms`);
  console.log(`   • Error Rate: < 0.1%`);
  console.log(`   • Availability: > 99.9%`);

  console.log(`\n📈 Test Results:`);
  console.log(`   • Average Response Time: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms`);
  console.log(`   • 95th Percentile: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms`);
  console.log(`   • Error Rate: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%`);
  console.log(`   • Total Requests: ${data.metrics.http_reqs.values.count}`);
  console.log(`   • Failed Requests: ${data.metrics.http_req_failed.values.fails}`);

  const performanceTarget = data.metrics.http_req_duration.values['p(95)'] < 200;
  const errorRateTarget = data.metrics.http_req_failed.values.rate < 0.001;

  console.log(`\n✅ Performance Target: ${performanceTarget ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ Error Rate Target: ${errorRateTarget ? 'PASSED' : 'FAILED'}`);

  if (performanceTarget && errorRateTarget) {
    console.log(`\n🎉 LOAD TEST PASSED - System ready for production!`);
  } else {
    console.log(`\n⚠️  LOAD TEST FAILED - Performance optimization needed`);
  }

  return {
    'phase4-load-test-summary.json': JSON.stringify(data, null, 2),
  };
}