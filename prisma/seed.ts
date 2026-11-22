import { PrismaClient } from '@prisma/client';
import { CAFE_INFO, CATEGORIES, MENU_ITEMS } from '../src/data/mockData';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Smart-Menu Database Seed ---');

  // 1. Seed Cafe Settings
  console.log('Seeding cafe settings...');
  for (const [key, value] of Object.entries(CAFE_INFO)) {
    await prisma.cafeSetting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    });
  }

  // 2. Seed Categories
  console.log('Seeding categories...');
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: {
        name: cat.name,
        slug: cat.slug,
        iconName: cat.iconName,
        order: cat.order,
      },
      create: {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        iconName: cat.iconName,
        order: cat.order,
      },
    });
  }

  // 3. Seed Menu Items and Option Groups
  console.log('Seeding menu items...');
  for (const item of MENU_ITEMS) {
    await prisma.menuItem.upsert({
      where: { id: item.id },
      update: {
        categoryId: item.categoryId,
        name: item.name,
        description: item.description,
        price: item.price,
        oldPrice: item.oldPrice ?? null,
        imageUrl: item.imageUrl,
        weight: item.weight,
        calories: item.calories,
        proteins: item.proteins,
        fats: item.fats,
        carbs: item.carbs,
        allergens: [...item.allergens],
        badges: [...item.badges],
        isAvailable: item.isAvailable,
        cookingTimeMinutes: item.cookingTimeMinutes,
        weatherAffinity: item.weatherAffinity ?? null,
        recommendedItemIds: [...item.recommendedItemIds],
      },
      create: {
        id: item.id,
        categoryId: item.categoryId,
        name: item.name,
        description: item.description,
        price: item.price,
        oldPrice: item.oldPrice ?? null,
        imageUrl: item.imageUrl,
        weight: item.weight,
        calories: item.calories,
        proteins: item.proteins,
        fats: item.fats,
        carbs: item.carbs,
        allergens: [...item.allergens],
        badges: [...item.badges],
        isAvailable: item.isAvailable,
        cookingTimeMinutes: item.cookingTimeMinutes,
        weatherAffinity: item.weatherAffinity ?? null,
        recommendedItemIds: [...item.recommendedItemIds],
      },
    });

    // Delete existing option groups for this item to ensure clean state
    await prisma.menuItemOptionGroup.deleteMany({
      where: { menuItemId: item.id },
    });

    if (item.optionGroups && item.optionGroups.length > 0) {
      for (const group of item.optionGroups) {
        const createdGroup = await prisma.menuItemOptionGroup.create({
          data: {
            id: `${item.id}-${group.id}`,
            menuItemId: item.id,
            title: group.title,
            required: group.required,
            multiple: group.multiple,
          },
        });

        for (const opt of group.options) {
          await prisma.menuItemOption.create({
            data: {
              id: `${createdGroup.id}-${opt.id}`,
              groupId: createdGroup.id,
              name: opt.name,
              price: opt.price,
            },
          });
        }
      }
    }
  }

  // 4. Seed Initial Reviews
  console.log('Seeding initial reviews...');
  const existingReviews = await prisma.guestReview.count();
  if (existingReviews === 0) {
    await prisma.guestReview.createMany({
      data: [
        {
          id: 'rev-seed-1',
          tableNumber: 4,
          rating: 5,
          sentiment: 'positive',
          tags: ['Вкусная еда', 'Отличный specialty кофе', 'Уютная атмосфера'],
          comment: 'Шикарный флэт уайт и сырники! Атмосфера на Эркиндик как в лучших кофейнях Европы.',
          externalPlatform: '2gis',
          bonusAwarded: 50,
          status: 'reviewed',
        },
        {
          id: 'rev-seed-2',
          tableNumber: 2,
          rating: 5,
          sentiment: 'positive',
          tags: ['Быстрая подача', 'Вежливый персонал'],
          comment: 'Заказ принесли буквально за 10 минут, очень удобно вызывать официанта через QR-код.',
          externalPlatform: '2gis',
          bonusAwarded: 50,
          status: 'reviewed',
        },
      ],
    });
  }

  console.log('--- Smart-Menu Database Seed Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
