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

async function runMenuCrudTests() {
  console.log('=====================================================');
  console.log('--- MENU CRUD IN NEON POSTGRESQL E2E TEST SUITE ---');
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

  const PORT = 3000;

  // 1. Get a valid category from Neon
  const category = await prisma.category.findFirst();
  assert(category !== null, 'Found existing category in Neon', `Category: ${category?.name} (${category?.id})`);
  if (!category) {
    console.error('Cannot proceed without a category');
    process.exit(1);
  }

  // 2. Create a new Dish via POST /api/menu
  let createdDishId = '';
  try {
    const newDishPayload = JSON.stringify({
      name: 'Матча Чизкейк с Малиной (Тест)',
      categoryId: category.id,
      description: 'Нежный японский зеленый чай матча, сливочный крем и свежая малина',
      price: 450,
      oldPrice: 500,
      imageUrl: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80',
      weight: '180 г',
      calories: 320,
      proteins: 8,
      fats: 18,
      carbs: 28,
      allergens: ['Лактоза', 'Яйца'],
      badges: ['hit', 'chef_choice'],
      isAvailable: true,
      cookingTimeMinutes: 5,
      optionGroups: [
        {
          title: 'Топпинг',
          required: false,
          multiple: true,
          options: [
            { name: 'Малиновый соус', price: 50 },
            { name: 'Карамельная крошка', price: 40 },
          ],
        },
      ],
    });

    const createRes = await makeRequest(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/menu',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(newDishPayload),
        },
      },
      newDishPayload
    );

    assert(
      createRes.statusCode === 201 && createRes.data.success === true,
      'POST /api/menu creates dish successfully in Neon',
      `ID: ${createRes.data.item?.id}, Name: ${createRes.data.item?.name}`
    );

    createdDishId = createRes.data.item?.id;

    // Direct check in Neon PostgreSQL
    const neonItem = await prisma.menuItem.findUnique({
      where: { id: createdDishId },
      include: { optionGroups: { include: { options: true } } },
    });
    assert(
      neonItem !== null && neonItem.name === 'Матча Чизкейк с Малиной (Тест)',
      'Prisma directly verifies dish persisted in Neon PostgreSQL',
      `Neon DB Price: ${neonItem?.price}, OptionGroups: ${neonItem?.optionGroups.length}`
    );
  } catch (err) {
    console.error('Create dish error:', err);
  }

  // 3. Update the Dish via PATCH /api/menu/[id] (e.g. quick price change)
  try {
    const updatePayload = JSON.stringify({
      price: 490,
      oldPrice: 550,
      cookingTimeMinutes: 8,
    });

    const updateRes = await makeRequest(
      {
        hostname: 'localhost',
        port: PORT,
        path: `/api/menu/${createdDishId}`,
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(updatePayload),
        },
      },
      updatePayload
    );

    assert(
      updateRes.statusCode === 200 && updateRes.data.success === true,
      'PATCH /api/menu/[id] updates dish fields successfully',
      `New Price: ${updateRes.data.item?.price}`
    );

    // Direct check in Neon PostgreSQL
    const updatedInNeon = await prisma.menuItem.findUnique({
      where: { id: createdDishId },
    });
    assert(
      updatedInNeon?.price === 490,
      'Prisma directly verifies updated price in Neon PostgreSQL',
      `Neon DB Price is now: ${updatedInNeon?.price} (was 450)`
    );
  } catch (err) {
    console.error('Update dish error:', err);
  }

  // 4. Verify GET /api/menu returns the updated item
  try {
    const getRes = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/menu',
      method: 'GET',
    });

    const foundInList = (getRes.data.items || []).find((i: any) => i.id === createdDishId);
    assert(
      foundInList !== undefined && foundInList.price === 490,
      'GET /api/menu reflects live changes from Neon PostgreSQL',
      `Item found in menu feed: ${foundInList?.name} at ${foundInList?.price}`
    );
  } catch (err) {
    console.error('Fetch menu error:', err);
  }

  // 5. Delete the test dish via DELETE /api/menu/[id]
  try {
    const deleteRes = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: `/api/menu/${createdDishId}`,
      method: 'DELETE',
    });

    assert(
      deleteRes.statusCode === 200 && deleteRes.data.success === true,
      'DELETE /api/menu/[id] deletes dish successfully',
      `Deleted ID: ${deleteRes.data.deletedId}`
    );

    // Direct check in Neon PostgreSQL
    const checkDeleted = await prisma.menuItem.findUnique({
      where: { id: createdDishId },
    });
    assert(checkDeleted === null, 'Prisma confirms dish is completely removed from Neon PostgreSQL');
  } catch (err) {
    console.error('Delete dish error:', err);
  }

  console.log(`\n=====================================================`);
  console.log(`SUMMARY: ${passed}/${total} MENU CRUD TESTS PASSED`);
  console.log(`=====================================================`);

  await prisma.$disconnect();
  process.exit(passed === total ? 0 : 1);
}

runMenuCrudTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
