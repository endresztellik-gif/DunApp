// Test all 15 groundwater wells for data availability
const https = require('https');

const WELLS = [
  { name: 'Sátorhely', code: '4576' },
  { name: 'Mohács II.', code: '912' },
  { name: 'Kölked', code: '1461' },
  { name: 'Mohács', code: '1460' },
  { name: 'Mohács-Sárhát', code: '4481' },
  { name: 'Dávod', code: '448' },
  { name: 'Hercegszántó', code: '1450' },
  { name: 'Nagybaracska', code: '4479' },
  { name: 'Szeremle', code: '132042' },
  { name: 'Alsónyék', code: '662' },
  { name: 'Érsekcsanád', code: '1426' },
  { name: 'Decs', code: '658' },
  { name: 'Szekszárd-Borrév', code: '656' },
  { name: 'Őcsény', code: '653' },
  { name: 'Báta', code: '660' }
];

// Regex pattern for chartView (4 arrays)
const pattern = /chartView\s*\(\s*(\[.*?\])\s*,\s*(\[.*?\])\s*,\s*\[.*?\]\s*,\s*\[.*?\]\s*\)/s;

function testWell(well) {
  return new Promise((resolve) => {
    const url = `https://www.vizugy.hu/talajvizkut_grafikon/index.php?torzsszam=${well.code}`;

    https.get(url, (res) => {
      let html = '';

      res.on('data', (chunk) => {
        html += chunk;
      });

      res.on('end', () => {
        const match = html.match(pattern);

        if (!match) {
          resolve({
            name: well.name,
            code: well.code,
            status: '❌ NO DATA',
            count: 0,
            firstDate: null,
            lastDate: null
          });
          return;
        }

        try {
          const values = JSON.parse(match[1]);
          const timestamps = JSON.parse(match[2]);

          resolve({
            name: well.name,
            code: well.code,
            status: '✅ SUCCESS',
            count: values.length,
            firstDate: timestamps[0]?.substring(0, 10) || null,
            lastDate: timestamps[timestamps.length - 1]?.substring(0, 10) || null
          });
        } catch (err) {
          resolve({
            name: well.name,
            code: well.code,
            status: '❌ PARSE ERROR',
            count: 0,
            firstDate: null,
            lastDate: null
          });
        }
      });
    }).on('error', (err) => {
      resolve({
        name: well.name,
        code: well.code,
        status: '❌ HTTP ERROR',
        count: 0,
        firstDate: null,
        lastDate: null
      });
    });
  });
}

async function testAllWells() {
  console.log('🧪 Testing all 15 groundwater wells...\n');

  const results = await Promise.all(WELLS.map(well => testWell(well)));

  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log(' WELL NAME             | CODE    | STATUS        | COUNT   | DATE RANGE');
  console.log('═══════════════════════════════════════════════════════════════════════');

  let totalCount = 0;
  let successCount = 0;

  results.forEach(result => {
    const nameCol = result.name.padEnd(20);
    const codeCol = result.code.padEnd(7);
    const statusCol = result.status.padEnd(13);
    const countCol = result.count.toString().padStart(7);
    const dateRange = result.firstDate && result.lastDate
      ? `${result.firstDate} → ${result.lastDate}`
      : 'N/A';

    console.log(` ${nameCol} | ${codeCol} | ${statusCol} | ${countCol} | ${dateRange}`);

    if (result.status === '✅ SUCCESS') {
      successCount++;
      totalCount += result.count;
    }
  });

  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log(`\n📊 SUMMARY:`);
  console.log(`   Total wells: ${WELLS.length}`);
  console.log(`   Successful: ${successCount}/${WELLS.length} (${Math.round(successCount/WELLS.length*100)}%)`);
  console.log(`   Total measurements: ${totalCount.toLocaleString()}`);
  console.log(`   Average per well: ${Math.round(totalCount/successCount)} measurements`);
  console.log(`\n🎯 RESULT: ${successCount === WELLS.length ? '✅ ALL WELLS WORKING!' : '⚠️ Some wells have issues'}`);
}

testAllWells();
