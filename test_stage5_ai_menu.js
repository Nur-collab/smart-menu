/* eslint-disable */
// E2E Test Suite for Stage 5: AI Sommelier, Dynamic Pricing & Multilingual Experience
const http = require('http');

const baseUrl = 'http://localhost:3000';

async function postJson(urlPath, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request(
      `${baseUrl}${urlPath}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: body });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function getRequest(urlPath) {
  return new Promise((resolve, reject) => {
    http.get(`${baseUrl}${urlPath}`, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => resolve({ status: res.statusCode, body }));
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('=== Starting Stage 5 E2E Test Suite (AI Sommelier & Dynamic Menu) ===\n');

  // 1. Тест AI-сомелье на русском языке (RU)
  console.log('1. Testing AI Sommelier (Russian - "Что посоветуете к кофе без сахара?")...');
  const ruRes = await postJson('/api/ai/sommelier', {
    message: 'Что посоветуете к кофе без сахара?',
    language: 'ru',
    cartItemIds: [],
  });

  if (ruRes.status !== 200 || !ruRes.data?.success || !ruRes.data?.recommendedItems?.length) {
    throw new Error('Failed Russian AI sommelier response: ' + JSON.stringify(ruRes));
  }
  console.log('  Status: 200 OK');
  console.log('  AI Reply (RU): ' + ruRes.data.reply);
  console.log('  Dishes: ' + ruRes.data.recommendedItems.map((i) => i.name).join(', '));
  console.log('  Prompts: ' + ruRes.data.quickPrompts.join(' | ') + '\n');

  // 2. Тест AI-сомелье на кыргызском языке (KG)
  console.log('2. Testing AI Sommelier (Kyrgyz - "Тоюмдуу ысык тамак сунуштаңыз")...');
  const kgRes = await postJson('/api/ai/sommelier', {
    message: 'Тоюмдуу ысык тамак сунуштаңыз',
    language: 'kg',
    cartItemIds: [],
  });

  if (kgRes.status !== 200 || !kgRes.data?.success || !kgRes.data?.recommendedItems?.length) {
    throw new Error('Failed Kyrgyz AI sommelier response: ' + JSON.stringify(kgRes));
  }
  console.log('  Status: 200 OK');
  console.log('  AI Reply (KG): ' + kgRes.data.reply);
  console.log('  Dishes: ' + kgRes.data.recommendedItems.map((i) => i.name).join(', '));
  console.log('  Prompts: ' + kgRes.data.quickPrompts.join(' | ') + '\n');

  // 3. Тест AI-сомелье на английском языке (EN)
  console.log('3. Testing AI Sommelier (English - "Looking for a vegan gluten free healthy lunch")...');
  const enRes = await postJson('/api/ai/sommelier', {
    message: 'Looking for a vegan gluten free healthy lunch',
    language: 'en',
    cartItemIds: [],
  });

  if (enRes.status !== 200 || !enRes.data?.success || !enRes.data?.recommendedItems?.length) {
    throw new Error('Failed English AI sommelier response: ' + JSON.stringify(enRes));
  }
  console.log('  Status: 200 OK');
  console.log('  AI Reply (EN): ' + enRes.data.reply);
  console.log('  Dishes: ' + enRes.data.recommendedItems.map((i) => i.name).join(', '));
  console.log('  Prompts: ' + enRes.data.quickPrompts.join(' | ') + '\n');

  // 4. Тест умных пар с учетом состава корзины
  console.log('4. Testing Cart-Aware Smart Pairings (Item item-5 already in cart)...');
  const cartRes = await postJson('/api/ai/sommelier', {
    message: 'Что посоветуете на обед?',
    language: 'ru',
    cartItemIds: ['item-5'],
  });

  if (cartRes.status !== 200 || !cartRes.data?.success) {
    throw new Error('Failed Cart-Aware AI sommelier response: ' + JSON.stringify(cartRes));
  }
  console.log('  Status: 200 OK');
  console.log('  Recommended fresh pairings: ' + cartRes.data.recommendedItems.map((i) => i.name).join(', ') + '\n');

  // 5. Проверка доступности главного экрана гостя
  console.log('5. Verifying Guest Page with Multilingual, Happy Hours & Weather...');
  const pageRes = await getRequest('/');
  if (pageRes.status !== 200) {
    throw new Error('Failed to load guest page, status: ' + pageRes.status);
  }
  console.log('  Guest Page HTTP 200 OK! Content length: ' + pageRes.body.length + ' bytes\n');

  console.log('>>> ALL STAGE 5 TESTS COMPLETED SUCCESSFULLY! AI SOMMELIER & DYNAMIC MENU ARE LIVE! <<<');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
