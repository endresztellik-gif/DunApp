// Test 30-day groundwater fetch (reduced from 60 to improve success rate)
// Tests if reducing the API request to 30 days prevents timeout

const SUPABASE_URL = 'https://zpwoicpajmvbtmtumsah.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwd29pY3Bham12YnRtdHVtc2FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNzY5MTMsImV4cCI6MjA3Njk1MjkxM30.iQ5WAAgtdX7CIVZAZSHXukKiOj2bbTTD7lODJ75RpH0';

async function test30DayFetch() {
  console.log('🧪 Testing 30-day groundwater fetch (reduced from 60 days)...');
  console.log('📡 Edge Function URL:', `${SUPABASE_URL}/functions/v1/fetch-groundwater`);
  console.log('⏱️  Timeout: 90 seconds per well (increased from 60s)');
  console.log('🎯 Expected: Better success rate due to smaller data range\n');

  const startTime = Date.now();

  try {
    console.log('🚀 Sending request...');
    const response = await fetch(`${SUPABASE_URL}/functions/v1/fetch-groundwater`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const elapsed = Date.now() - startTime;
    console.log(`\n⏱️  Response received in ${elapsed}ms (${(elapsed/1000).toFixed(1)}s)`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);

    const data = await response.json();
    console.log('\n📦 Response Summary:');
    console.log('   Total wells:', data.wells_total);
    console.log('   ✅ Fetched:', data.wells_fetched);
    console.log('   🟡 Cached:', data.wells_cached);
    console.log('   ❌ Failed:', data.wells_failed);
    console.log('   ⏱️  Execution time:', data.execution_time_ms + 'ms');

    if (data.errors && data.errors.length > 0) {
      console.log('\n❌ Errors:');
      data.errors.forEach((err, i) => {
        console.log(`   ${i + 1}. ${err}`);
      });
    }

    if (data.wells_fetched > 0) {
      console.log(`\n🎉 SUCCESS! ${data.wells_fetched}/${data.wells_total} wells fetched`);
      console.log('   The 30-day reduction improved API response time! ✅');
    } else if (data.wells_cached > 0) {
      console.log(`\n🟡 All ${data.wells_cached} wells already cached today`);
      console.log('   Run again tomorrow to test fresh fetch');
    } else {
      console.log('\n⚠️  WARNING: All wells still timing out');
      console.log('   The API may be currently overloaded');
      console.log('   Consider reducing to 15 or 7 days');
    }

  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`\n💥 Request failed after ${elapsed}ms:`, error.message);
  }
}

test30DayFetch();
