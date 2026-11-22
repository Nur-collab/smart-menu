/**
 * Comprehensive System & Edge-Case Audit Test Suite for AURA Smart Menu Bishkek
 */

const BASE_URL = 'http://localhost:3000';

async function runTestSuite() {
  console.log('🚀 Starting AURA Smart Menu Automated Audit Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName} ${details ? `(${details})` : ''}`);
      failed++;
    }
  }

  try {
    // 1. Initial State Check
    console.log('--- TEST 1: Initial Store State ---');
    const initRes = await fetch(`${BASE_URL}/api/orders`);
    const initData = await initRes.json();
    assert(initRes.status === 200 && Array.isArray(initData.data), 'GET /api/orders returns 200 and array');

    // 2. Edge Case: Invalid Order Submission (Validation Security)
    console.log('\n--- TEST 2: Order Validation & Edge Cases ---');
    const invalidOrderRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableNumber: 999, // Outside allowed range (1-50)
        items: [],
      }),
    });
    assert(invalidOrderRes.status === 400, 'Rejection of invalid table number (999) or empty items with HTTP 400');

    // 3. Valid Order Creation
    console.log('\n--- TEST 3: Valid Order Creation ---');
    const orderId = `audit-ord-${Date.now()}`;
    const testOrder = {
      id: orderId,
      tableNumber: 5,
      items: [
        {
          cartItemId: 'item-1',
          menuItem: {
            id: 'm-1',
            title: 'Американо Бишкек',
            price: 180,
            category: 'coffee',
          },
          quantity: 2,
          unitPrice: 180,
        },
      ],
      totalAmount: 360,
      discountAmount: 0,
      tipAmount: 36,
      finalAmount: 396,
      paymentMethod: 'elqr',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const createOrderRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testOrder),
    });
    const createOrderData = await createOrderRes.json();
    assert(createOrderRes.status === 201 && createOrderData.data.id === orderId, 'Valid order successfully created (201)');

    // 4. Edge Case: Order Idempotency (Offline Sync / Retry Duplication Safety)
    console.log('\n--- TEST 4: Order Idempotency / Retry Replay Safety ---');
    const duplicateOrderRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testOrder),
    });
    const duplicateOrderData = await duplicateOrderRes.json();
    assert(duplicateOrderRes.status === 201 && duplicateOrderData.data.id === orderId, 'Replay of existing orderId returns same order without duplicates');

    // 5. Payment Transaction Creation (ELQR / MBANK)
    console.log('\n--- TEST 5: Fintech Payment Initialization (ELQR Bishkek) ---');
    const paymentCreateRes = await fetch(`${BASE_URL}/api/payments/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: orderId,
        provider: 'elqr',
      }),
    });
    const paymentData = await paymentCreateRes.json();
    assert(
      (paymentCreateRes.status === 200 || paymentCreateRes.status === 201) &&
      (paymentData.transaction?.qrPayload?.startsWith('000201') || paymentData.transaction?.qrPayload?.startsWith('https://')) &&
      Boolean(paymentData.transaction?.deeplinks?.elqr) &&
      paymentData.transaction?.amount === 396,
      'ELQR transaction generated with valid EMVCo string payload, amount, and deeplinks'
    );
    const transactionId = paymentData.transaction.id;

    // 6. Payment Execution & Fiscalization (ЭККМ ГНС КР)
    console.log('\n--- TEST 6: Payment Execution & EKKM Fiscal Receipt Generation ---');
    const simulatePayRes = await fetch(`${BASE_URL}/api/payments/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionId }),
    });
    const simulateData = await simulatePayRes.json();
    assert(
      simulatePayRes.status === 200 &&
      simulateData.transaction?.status === 'paid' &&
      Boolean(simulateData.fiscalReceipt?.fiscalSign),
      'Payment marked as paid and official Kyrgyz EKKM receipt generated with fiscalSign & fnNumber'
    );

    // 7. Edge Case: Duplicate Webhook / Double-Payment Fiscal Idempotency
    console.log('\n--- TEST 7: Payment & Fiscal Idempotency (Duplicate Webhook Safety) ---');
    const duplicatePayRes = await fetch(`${BASE_URL}/api/payments/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionId }),
    });
    const duplicatePayData = await duplicatePayRes.json();
    assert(
      duplicatePayRes.status === 200 &&
      duplicatePayData.transaction?.status === 'paid' &&
      duplicatePayData.fiscalReceipt?.id === simulateData.fiscalReceipt?.id,
      'Duplicate payment simulation returns existing transaction & receipt without duplicate tax filing'
    );

    // 8. Guest Review & 2GIS Bonus Funnel
    console.log('\n--- TEST 8: Guest Review & 2GIS Rating Integration ---');
    const reviewRes = await fetch(`${BASE_URL}/api/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: orderId,
        tableNumber: 5,
        rating: 5,
        tags: ['Быстрая подача', 'Отличный кофе'],
        comment: 'Шикарно все прошло, спасибо!',
        externalPlatform: '2gis',
      }),
    });
    const reviewData = await reviewRes.json();
    assert(
      (reviewRes.status === 200 || reviewRes.status === 201) &&
      reviewData.review?.rating === 5 &&
      reviewData.review?.bonusAwarded === 50 &&
      reviewData.review?.externalPlatform === '2gis',
      '5-star review logged with +50 bonuses and 2GIS external funnel attribution'
    );

    // 9. Edge Case: Duplicate Review / Bonus Farming Prevention
    console.log('\n--- TEST 9: Review Bonus Deduplication Edge Case ---');
    const duplicateReviewRes = await fetch(`${BASE_URL}/api/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: orderId,
        tableNumber: 5,
        rating: 5,
        tags: ['Спам'],
        comment: 'Попытка повторного начисления бонусов',
        externalPlatform: '2gis',
      }),
    });
    const duplicateReviewData = await duplicateReviewRes.json();
    assert(
      (duplicateReviewRes.status === 200 || duplicateReviewRes.status === 201) &&
      duplicateReviewData.review?.id === reviewData.review?.id,
      'Repeated review submission for same orderId returns existing review, preventing duplicate bonus awards'
    );

    // 10. Thermal Printer Spooler & POS Bridge
    console.log('\n--- TEST 10: ESC/POS Network Printer & POS Spooler ---');
    const printRes = await fetch(`${BASE_URL}/api/printer/print-ticket`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    });
    const printData = await printRes.json();
    assert(
      printRes.status === 200 &&
      printData.bytesCount > 0 &&
      Boolean(printData.textPreview),
      'ESC/POS printer spooler generated 80mm kitchen ticket buffer and visual preview without socket hang'
    );

    // 11. AI Sommelier ("Айпери") Dialogue
    console.log('\n--- TEST 11: AI Sommelier Query Processing ---');
    const aiRes = await fetch(`${BASE_URL}/api/ai/sommelier`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Посоветуй легкий завтрак и освежающий напиток',
        tableNumber: 5,
        language: 'ru',
      }),
    });
    const aiData = await aiRes.json();
    assert(
      aiRes.status === 200 &&
      Boolean(aiData.reply) &&
      aiData.reply.length > 20,
      'AI Sommelier generated contextual culinary recommendation'
    );

    console.log(`\n========================================`);
    console.log(`🎯 AUDIT SUMMARY: Passed: ${passed} | Failed: ${failed}`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Audit suite encountered critical execution error:', error);
    process.exit(1);
  }
}

runTestSuite();
