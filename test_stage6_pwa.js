/* eslint-disable */
// Integration & E2E Test Suite for Stage 6: PWA, Service Worker & Offline Caching
const http = require('http');
const fs = require('fs');
const path = require('path');

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = [];
      res.on('data', (chunk) => data.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(data);
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          buffer,
          text: buffer.toString('utf8'),
        });
      });
    });

    req.on('error', (err) => reject(err));
    req.setTimeout(8000, () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== ЗАПУСК ТЕСТОВ ЭТАПА 6: PWA, SERVICE WORKER И ОФФЛАЙН-РЕЖИМ ===\n');
  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
    }
  }

  // 1. Проверка Web App Manifest (Next.js route)
  try {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/manifest.webmanifest',
      method: 'GET',
    });
    assert(res.statusCode === 200, `GET /manifest.webmanifest -> HTTP 200 (получен: ${res.statusCode})`);
    
    const manifest = JSON.parse(res.text);
    assert(manifest.name.includes('Smart Menu') || manifest.short_name.includes('Smart Menu'), 'Манифест содержит корректное имя "Smart Menu"');
    assert(Array.isArray(manifest.icons) && manifest.icons.length >= 3, `Манифест содержит массив иконок (насчитано: ${manifest.icons?.length})`);
    assert(manifest.display === 'standalone', 'PWA режим отображения: standalone');
    assert(manifest.theme_color === '#B45309', 'PWA theme_color соответствует бренду: #B45309');
  } catch (err) {
    assert(false, `Ошибка запроса /manifest.webmanifest: ${err.message}`);
  }

  // 2. Проверка статического манифеста public/manifest.json
  try {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/manifest.json',
      method: 'GET',
    });
    assert(res.statusCode === 200, `GET /manifest.json -> HTTP 200`);
    const staticManifest = JSON.parse(res.text);
    assert(staticManifest.short_name === 'Smart Menu', 'Статический манифест public/manifest.json валиден');
  } catch (err) {
    assert(false, `Ошибка запроса /manifest.json: ${err.message}`);
  }

  // 3. Проверка Service Worker (public/sw.js)
  try {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/sw.js',
      method: 'GET',
    });
    assert(res.statusCode === 200, `GET /sw.js -> HTTP 200 (Service Worker доступен по корневому пути)`);
    assert(res.text.includes('CACHE_NAME'), 'Service Worker содержит стратегию версионирования CACHE_NAME');
    assert(res.text.includes('/offline.html'), 'Service Worker содержит аварийный оффлайн-фолбэк /offline.html');
    assert(res.text.includes('caches.claim()') || res.text.includes('skipWaiting()'), 'Service Worker настроен на немедленную активацию (skipWaiting / claim)');
  } catch (err) {
    assert(false, `Ошибка запроса /sw.js: ${err.message}`);
  }

  // 4. Проверка страницы оффлайн-заглушки public/offline.html
  try {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/offline.html',
      method: 'GET',
    });
    assert(res.statusCode === 200, `GET /offline.html -> HTTP 200`);
    assert(res.text.includes('Режим оффлайн') || res.text.includes('Нет подключения'), 'offline.html содержит понятное уведомление для гостя о слабом сигнале');
  } catch (err) {
    assert(false, `Ошибка запроса /offline.html: ${err.message}`);
  }

  // 5. Проверка иконок PWA (PNG сигнатура и SVG)
  try {
    const resPng = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/icons/icon-192.png',
      method: 'GET',
    });
    assert(resPng.statusCode === 200, `GET /icons/icon-192.png -> HTTP 200`);
    // Check PNG signature: 137, 80, 78, 71 (0x89 'P' 'N' 'G')
    const isPng = resPng.buffer[0] === 0x89 && resPng.buffer[1] === 0x50 && resPng.buffer[2] === 0x4e && resPng.buffer[3] === 0x47;
    assert(isPng, 'icon-192.png имеет валидный двоичный заголовок формата PNG');

    const resSvg = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/icons/icon.svg',
      method: 'GET',
    });
    assert(resSvg.statusCode === 200, `GET /icons/icon.svg -> HTTP 200`);
    assert(resSvg.text.includes('<svg') && resSvg.text.includes('#B45309'), 'icon.svg содержит векторную графику и теплые фирменные цвета');
  } catch (err) {
    assert(false, `Ошибка проверки иконок: ${err.message}`);
  }

  // 6. Проверка главной страницы и наличия PWA метатегов
  try {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/',
      method: 'GET',
    });
    assert(res.statusCode === 200, 'GET / -> HTTP 200');
    assert(res.text.includes('manifest.webmanifest') || res.text.includes('manifest'), 'Главная страница подключает PWA манифест');
  } catch (err) {
    assert(false, `Ошибка загрузки главной страницы: ${err.message}`);
  }

  console.log(`\n========================================`);
  console.log(`РЕЗУЛЬТАТ ТЕСТИРОВАНИЯ: ${passed}/${total} пройдено (${Math.round((passed / total) * 100)}%)`);
  console.log(`========================================\n`);

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Критический сбой тестов:', err);
  process.exit(1);
});
