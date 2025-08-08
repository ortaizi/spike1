// Test Google OAuth Configuration
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

console.log('=== Google OAuth Configuration Test ===');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✅ Set' : '❌ Missing');
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
console.log('APP_URL:', process.env.APP_URL);

// Test the exact values (first few characters for security)
if (process.env.GOOGLE_CLIENT_ID) {
  console.log('Client ID starts with:', process.env.GOOGLE_CLIENT_ID.substring(0, 20) + '...');
}
if (process.env.GOOGLE_CLIENT_SECRET) {
  console.log('Client Secret starts with:', process.env.GOOGLE_CLIENT_SECRET.substring(0, 10) + '...');
}

console.log('\n=== Expected Redirect URIs ===');
console.log('Development:', 'http://localhost:3000/api/auth/callback/google');
console.log('Production:', 'https://your-domain.com/api/auth/callback/google');

console.log('\n=== Instructions ===');
console.log('1. Go to Google Cloud Console > APIs & Services > Credentials');
console.log('2. Find your OAuth 2.0 Client ID');
console.log('3. Add these Authorized redirect URIs:');
console.log('   - http://localhost:3000/api/auth/callback/google');
console.log('   - https://your-domain.com/api/auth/callback/google (for production)');
console.log('4. Make sure the Client ID and Secret match your .env.local file'); 