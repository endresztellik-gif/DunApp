// Test the chartView regex pattern with actual HTML format
const https = require('https');

const testWellCode = '4576'; // Sátorhely

https.get(`https://www.vizugy.hu/talajvizkut_grafikon/index.php?torzsszam=${testWellCode}`, (res) => {
  let html = '';

  res.on('data', (chunk) => {
    html += chunk;
  });

  res.on('end', () => {
    console.log('✅ HTML fetched, length:', html.length);

    // Test the regex pattern (FOUR arrays)
    const pattern = /chartView\s*\(\s*(\[.*?\])\s*,\s*(\[.*?\])\s*,\s*\[.*?\]\s*,\s*\[.*?\]\s*\)/s;
    const match = html.match(pattern);

    if (!match) {
      console.log('❌ REGEX FAILED TO MATCH');

      // Debug: Check if chartView exists
      if (html.includes('chartView')) {
        console.log('✅ chartView function found in HTML');

        // Extract the chartView line
        const chartViewLine = html.substring(
          html.indexOf('chartView'),
          html.indexOf('chartView') + 200
        );
        console.log('📝 chartView start:', chartViewLine);
      } else {
        console.log('❌ chartView function NOT found in HTML');
      }
    } else {
      console.log('✅ REGEX MATCHED!');
      console.log('📊 First array length:', match[1].length, 'chars');
      console.log('📊 Second array length:', match[2].length, 'chars');

      // Parse the arrays
      try {
        const values = JSON.parse(match[1]);
        const timestamps = JSON.parse(match[2]);

        console.log(`✅ Parsed ${values.length} values`);
        console.log(`✅ Parsed ${timestamps.length} timestamps`);
        console.log('📈 First value:', values[0]);
        console.log('📅 First timestamp:', timestamps[0]);
        console.log('📈 Last value:', values[values.length - 1]);
        console.log('📅 Last timestamp:', timestamps[timestamps.length - 1]);
      } catch (parseError) {
        console.log('❌ JSON PARSE ERROR:', parseError.message);
        console.log('📝 First array sample:', match[1].substring(0, 100));
        console.log('📝 Second array sample:', match[2].substring(0, 100));
      }
    }
  });
}).on('error', (err) => {
  console.error('❌ HTTP ERROR:', err.message);
});
