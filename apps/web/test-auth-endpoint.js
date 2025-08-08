// Test NextAuth Endpoint
const https = require('https');
const http = require('http');

console.log('=== Testing NextAuth Endpoint ===');

// Test the NextAuth endpoint
const testEndpoint = async () => {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/providers',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Response:', data);
        resolve(data);
      });
    });

    req.on('error', (err) => {
      console.error('Error:', err.message);
      reject(err);
    });

    req.end();
  });
};

// Test Google OAuth URL
const testGoogleOAuth = () => {
  console.log('\n=== Testing Google OAuth URL ===');
  const googleOAuthUrl = 'http://localhost:3000/api/auth/signin/google';
  console.log('Google OAuth URL:', googleOAuthUrl);
  console.log('Try visiting this URL in your browser to test the OAuth flow');
};

// Run tests
const runTests = async () => {
  try {
    console.log('Testing NextAuth providers endpoint...');
    await testEndpoint();
    testGoogleOAuth();
  } catch (error) {
    console.error('Test failed:', error.message);
  }
};

runTests(); 