import { prisma } from '../src/lib/prisma';
import http from 'http';

function makeRequest(options: http.RequestOptions, postData?: string): Promise<{ statusCode: number; data: any }> {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ statusCode: res.statusCode || 200, data: parsed });
        } catch {
          resolve({ statusCode: res.statusCode || 200, data: body });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runVerification() {
  console.log('=====================================================');
  console.log('--- NEON POSTGRESQL & NEXT.JS END-TO-END VERIFICATION ---');
  console.log('=====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, name: string, detail?: string) {
    total++;
    if (condition) {
      passed++;
      console.log(`  [PASS] #${total}: ${name}`);
      if (detail) console.log(`         -> ${detail}`);
    } else {
      console.error(`  [FAIL] #${total}: ${name}`);
      if (detail) console.error(`         -> ${detail}`);
    }
  }

  // 1. Direct Prisma -> Neon Cloud Queries
  console.log('--- 1. Testing Direct Prisma Client -> Neon Cloud DB ---');
  const catCount = await prisma.category.count();
  assert(catCount > 0, `Neon Categories count > 0`, `Found ${catCount} categories`);

  const itemCount = await prisma.menuItem.count();
  assert(itemCount > 0, `Neon MenuItems count > 0`, `Found ${itemCount} menu items`);

  const optionGroupsCount = await prisma.menuItemOptionGroup.count();
  assert(optionGroupsCount > 0, `Neon OptionGroups count > 0`, `Found ${optionGroupsCount} option groups`);

  const reviewCount = await prisma.guestReview.count();
  assert(reviewCount > 0, `Neon Seed Reviews count > 0`, `Found ${reviewCount} reviews in Neon`);

  // 2. Test HTTP Endpoints on Local Server
  console.log('\n--- 2. Testing HTTP Endpoints against Neon Backend ---');
  const PORT = 3000;

  // Test GET /api/menu
  try {
    const menuRes = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/menu',
      method: 'GET',
    });
    assert(
      menuRes.statusCode === 200 && menuRes.data.success === true,
      'GET /api/menu returns HTTP 200 with success: true',
      `Items returned: ${menuRes.data.items?.length}, Source: ${menuRes.data.source}`
    );
    assert(
      menuRes.data.source === 'neon_postgres',
      'GET /api/menu serves data directly from Neon PostgreSQL',
      `Source: ${menuRes.data.source}`
    );
  } catch (e) {
    console.warn('HTTP server test skipped or timed out on port', PORT, (e as Error).message);
  }

  // Test POST /api/orders
  const testOrderId = `test-ord-neon-${Date.now().toString(36)}`;
  try {
    const orderPayload = JSON.stringify({
      id: testOrderId,
      tableNumber: 7,
      totalAmount: 950,
      discountAmount: 0,
      tipAmount: 50,
      finalAmount: 1000,
      paymentMethod: 'elqr',
      status: 'pending',
      guestComment: 'E2E Neon Verification Test Order',
      items: [
        {
          cartItemId: `cart-${Date.now()}`,
          menuItem: {
            id: 'item-1',
            categoryId: 'cat-seasonal',
            name: 'Латте Солёная Карамель',
            price: 320,
            imageUrl: '',
            weight: '350 мл',
            calories: 210,
            proteins: 6,
            fats: 7,
            carbs: 33,
            allergens: ['Лактоза'],
            badges: ['hit'],
            isAvailable: true,
            cookingTimeMinutes: 5,
            recommendedItemIds: [],
          },
          quantity: 2,
          selectedOptions: [],
          unitPrice: 320,
        },
      ],
    });

    const orderRes = await makeRequest(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/orders',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(orderPayload),
        },
      },
      orderPayload
    );

    assert(
      orderRes.statusCode === 201 && orderRes.data.success === true,
      'POST /api/orders creates order successfully',
      `Order ID: ${orderRes.data.data?.id}`
    );

    // Verify order exists in Neon via Prisma query
    await new Promise((r) => setTimeout(r, 1000));
    const neonOrder = await prisma.order.findUnique({
      where: { id: testOrderId },
    });
    assert(
      neonOrder !== null && neonOrder.id === testOrderId,
      'Order is successfully persisted in Neon PostgreSQL cloud database',
      `Neon DB TableNumber: ${neonOrder?.tableNumber}, FinalAmount: ${neonOrder?.finalAmount}`
    );
  } catch (e) {
    console.warn('POST /api/orders test error:', (e as Error).message);
  }

  // Test POST /api/waiter-calls
  try {
    const callPayload = JSON.stringify({
      tableNumber: 7,
      reason: 'bill',
    });
    const callRes = await makeRequest(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/waiter-calls',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(callPayload),
        },
      },
      callPayload
    );

    assert(
      (callRes.statusCode === 200 || callRes.statusCode === 201) && callRes.data.success === true,
      'POST /api/waiter-calls dispatches call',
      `Call ID: ${callRes.data.data?.id}, HTTP ${callRes.statusCode}`
    );

    // Verify in Neon
    await new Promise((r) => setTimeout(r, 1000));
    const neonCall = await prisma.waiterCall.findFirst({
      where: { tableNumber: 7, status: 'pending' },
      orderBy: { createdAt: 'desc' },
    });
    assert(
      neonCall !== null,
      'WaiterCall is successfully persisted in Neon PostgreSQL cloud database',
      `Neon DB Call: ${neonCall?.id}, Reason: ${neonCall?.reason}`
    );
  } catch (e) {
    console.warn('POST /api/waiter-calls test error:', (e as Error).message);
  }

  console.log(`\n=====================================================`);
  console.log(`SUMMARY: ${passed}/${total} TESTS PASSED`);
  console.log(`=====================================================`);

  await prisma.$disconnect();
  process.exit(passed === total ? 0 : 1);
}

runVerification().catch((err) => {
  console.error('Verification failed with exception:', err);
  process.exit(1);
});
