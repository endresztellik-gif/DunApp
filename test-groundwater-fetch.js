// Test groundwater fetch Edge Function manually
// Uses native fetch (Node.js 18+)

const SUPABASE_URL = 'https://zpwoicpajmvbtmtumsah.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwd29pY3Bham12YnRtdHVtc2FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNzY5MTMsImV4cCI6MjA3Njk1MjkxM30.iQ5WAAgtdX7CIVZAZSHXukKiOj2bbTTD7lODJ75RpH0';

async function testGroundwaterFetch() {
  console.log('🌊 Testing fetch-groundwater Edge Function...');
  console.log('📡 Calling:', `${SUPABASE_URL}/functions/v1/fetch-groundwater`);

  const startTime = Date.now();

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/fetch-groundwater`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const elapsed = Date.now() - startTime;
    console.log(`⏱️  Response received in ${elapsed}ms (${(elapsed/1000).toFixed(1)}s)`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);

    const data = await response.json();
    console.log('\n📦 Response body:');
    console.log(JSON.stringify(data, null, 2));

    if (data.wells_fetched > 0) {
      console.log(`\n✅ SUCCESS: ${data.wells_fetched} wells fetched successfully`);
    } else if (data.wells_cached > 0) {
      console.log(`\n🟡 CACHED: ${data.wells_cached} wells already cached today`);
    } else {
      console.log(`\n❌ FAILED: ${data.wells_failed} wells failed`);
      if (data.errors) {
        console.log('Errors:', data.errors);
      }
    }

  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`\n💥 Error after ${elapsed}ms:`, error.message);
  }
}

testGroundwaterFetch();
