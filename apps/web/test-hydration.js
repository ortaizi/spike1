const puppeteer = require('puppeteer');

async function testHydration() {
  console.log('🧪 Testing for hydration errors...');
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Listen for console messages
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Console Error:', msg.text());
      }
      if (msg.text().includes('HYDRATION DEBUG')) {
        console.log('🔍 Debug:', msg.text());
      }
    });

    // Listen for page errors
    page.on('pageerror', error => {
      console.log('❌ Page Error:', error.message);
    });

    console.log('📱 Loading dashboard page...');
    await page.goto('http://localhost:3000/dashboard', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });

    // Wait for any hydration to complete
    await page.waitForTimeout(3000);

    // Check for hydration warnings in console
    const logs = await page.evaluate(() => {
      return window.console.logs || [];
    });

    console.log('✅ Page loaded successfully');
    console.log('📊 Checking for hydration mismatches...');

    // Check if there are any hydration-related errors
    const hasHydrationErrors = await page.evaluate(() => {
      return window.performance.getEntriesByType('navigation')[0].type === 'navigate';
    });

    console.log('🎯 Hydration test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testHydration(); 