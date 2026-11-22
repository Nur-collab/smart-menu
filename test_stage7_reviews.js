/* eslint-disable */
// Integration & E2E Test Suite for Stage 7: Guest Reviews, 2GIS/Google Maps Funnel & Admin NPS Dashboard
const http = require('http');

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
  console.log('=== ЗАПУСК ТЕСТОВ ЭТАПА 7: ОТЗЫВЫ, ВОРОНКА 2ГИС И NPS ДАШБОРД ===\n');
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

  // 1. Проверка получения списка отзывов и статистики
  let initialStats = null;
  try {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/reviews',
      method: 'GET',
    });
    assert(res.statusCode === 200, `GET /api/reviews -> HTTP 200 (получен: ${res.statusCode})`);
    const data = JSON.parse(res.text);
    assert(data.success === true, 'Успешный ответ API отзывов');
    assert(Array.isArray(data.reviews) && data.reviews.length >= 3, `Получены отзывы из базы (насчитано: ${data.reviews?.length})`);
    assert(typeof data.stats.averageRating === 'number', `Средний рейтинг рассчитан корректно: ${data.stats.averageRating}`);
    initialStats = data.stats;
  } catch (err) {
    assert(false, `Сбой GET /api/reviews: ${err.message}`);
  }

  // 2. Отправка положительного отзыва (5★) с переходом в 2ГИС Бишкека и начислением +50 бонусов
  let positiveReviewId = null;
  try {
    const postPayload = JSON.stringify({
      tableNumber: 4,
      rating: 5,
      tags: ['Вкусная еда', 'Отличный specialty кофе'],
      comment: 'Великолепный кофе и круассаны на Эркиндик!',
      externalPlatform: '2gis',
    });

    const res = await request(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/reviews',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postPayload),
        },
      },
      postPayload
    );

    assert(res.statusCode === 201, `POST /api/reviews (5★ 2ГИС) -> HTTP 201 (получен: ${res.statusCode})`);
    const data = JSON.parse(res.text);
    assert(data.success === true, 'Успешный статус создания отзыва');
    assert(data.review.rating === 5, 'Рейтинг зафиксирован: 5 звезд');
    assert(data.review.sentiment === 'positive', 'Сентимент определен как positive');
    assert(data.review.bonusAwarded === 50, 'Начислено ровно +50 бонусов за отзыв');
    assert(data.review.externalPlatform === '2gis', 'Зафиксирован переход в 2ГИС Бишкек');
    positiveReviewId = data.review.id;
  } catch (err) {
    assert(false, `Сбой отправки положительного отзыва: ${err.message}`);
  }

  // 3. Отправка критического отзыва (2★): Внутренний перехват негатива (без публикации в 2ГИС)
  let issueReviewId = null;
  try {
    const postPayload = JSON.stringify({
      tableNumber: 7,
      rating: 2,
      tags: ['Долгое ожидание блюда', 'Холодная еда'],
      comment: 'Заказ несли 30 минут, суп успел остыть.',
      externalPlatform: null,
    });

    const res = await request(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/reviews',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postPayload),
        },
      },
      postPayload
    );

    assert(res.statusCode === 201, `POST /api/reviews (2★ претензия) -> HTTP 201`);
    const data = JSON.parse(res.text);
    assert(data.review.sentiment === 'negative', 'Сентимент определен как negative');
    assert(data.review.bonusAwarded === 0, 'Бонусы за внешний отзыв не начисляются');
    assert(data.review.externalPlatform === null, 'Отзыв НЕ направлен на внешние карты (перехвачен внутри)');
    assert(data.review.status === 'new', 'Отзыв помечен как требующий внимания (new)');
    issueReviewId = data.review.id;
  } catch (err) {
    assert(false, `Сбой отправки отзыва-претензии: ${err.message}`);
  }

  // 4. Реакция управляющего в панели администратора: урегулирование претензии (PATCH /api/reviews/[id])
  if (issueReviewId) {
    try {
      const patchPayload = JSON.stringify({
        status: 'resolved',
        managerNotes: 'Официант подошел к столику №7, принес десерт Павлова в качестве комплимента. Гость остался доволен.',
      });

      const res = await request(
        {
          hostname: 'localhost',
          port: 3000,
          path: `/api/reviews/${issueReviewId}`,
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(patchPayload),
          },
        },
        patchPayload
      );

      assert(res.statusCode === 200, `PATCH /api/reviews/${issueReviewId} -> HTTP 200`);
      const data = JSON.parse(res.text);
      assert(data.review.status === 'resolved', 'Статус успешно изменен на resolved');
      assert(data.review.managerNotes.includes('комплимента'), 'Служебная заметка управляющего сохранена');
    } catch (err) {
      assert(false, `Сбой PATCH /api/reviews/[id]: ${err.message}`);
    }
  }

  // 5. Проверка динамического пересчета аналитики в GET /api/reviews
  try {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/reviews',
      method: 'GET',
    });
    const data = JSON.parse(res.text);
    assert(data.stats.totalReviews > initialStats.totalReviews, 'Общий счетчик отзывов корректно увеличился');
    assert(data.stats.externalRedirectsCount >= 1, 'Счетчик переходов в 2ГИС зафиксирован в дашборде');
    assert(data.stats.totalBonusesGiven >= 50, 'Счетчик выданных бонусов обновился');
  } catch (err) {
    assert(false, `Сбой проверки аналитики: ${err.message}`);
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
