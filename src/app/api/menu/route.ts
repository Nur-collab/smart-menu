import { NextRequest, NextResponse } from 'next/server';
import { CAFE_INFO, CATEGORIES, MENU_ITEMS } from '@/data/mockData';
import { getStopList, broadcastEvent } from '@/lib/serverStore';
import { prisma } from '@/lib/prisma';
import { Category, MenuItem } from '@/types/menu';
import { authorizeStaffRequest } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  try {
    const stopList = new Set(getStopList());

    // 1. Attempt to query Neon PostgreSQL via Prisma
    try {
      const dbCategories = await prisma.category.findMany({
        orderBy: { order: 'asc' },
      });

      const dbMenuItems = await prisma.menuItem.findMany({
        include: {
          optionGroups: {
            include: {
              options: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });

      if (dbCategories.length > 0 && dbMenuItems.length > 0) {
        const mappedCategories: Category[] = dbCategories.map((c) => {
          const catMock = CATEGORIES.find((mc) => mc.id === c.id || mc.slug === c.slug);
          return {
            id: c.id,
            name: c.name,
            nameKg: catMock?.nameKg,
            nameEn: catMock?.nameEn,
            slug: c.slug,
            iconName: c.iconName,
            order: c.order,
          };
        });

        const mappedItems: MenuItem[] = dbMenuItems.map((item) => {
          const mockItem = MENU_ITEMS.find((m) => m.id === item.id || m.name === item.name);
          return {
            id: item.id,
            categoryId: item.categoryId,
            name: item.name,
            nameKg: mockItem?.nameKg,
            nameEn: mockItem?.nameEn,
            description: item.description,
            descriptionKg: mockItem?.descriptionKg,
            descriptionEn: mockItem?.descriptionEn,
            price: item.price,
            oldPrice: item.oldPrice ?? undefined,
            imageUrl: item.imageUrl,
            weight: item.weight,
            calories: item.calories,
            proteins: item.proteins,
            fats: item.fats,
            carbs: item.carbs,
            allergens: item.allergens,
            badges: item.badges as MenuItem['badges'],
            isAvailable: item.isAvailable && !stopList.has(item.id),
            cookingTimeMinutes: item.cookingTimeMinutes,
            weatherAffinity: (item.weatherAffinity as MenuItem['weatherAffinity']) ?? undefined,
            recommendedItemIds: item.recommendedItemIds,
            optionGroups: item.optionGroups.map((g) => {
              const mockGroup = mockItem?.optionGroups?.find(
                (mg) => mg.id === g.id || mg.title === g.title
              );
              return {
                id: g.id,
                title: g.title,
                titleKg: mockGroup?.titleKg,
                titleEn: mockGroup?.titleEn,
                required: g.required,
                multiple: g.multiple,
                options: g.options.map((opt) => {
                  const mockOpt = mockGroup?.options.find(
                    (mo) => mo.id === opt.id || mo.name === opt.name
                  );
                  return {
                    id: opt.id,
                    name: opt.name,
                    nameKg: mockOpt?.nameKg,
                    nameEn: mockOpt?.nameEn,
                    price: opt.price,
                  };
                }),
              };
            }),
          };
        });

        const settings = await prisma.cafeSetting.findMany();
        const settingsMap = new Map(settings.map((s) => [s.key, s.value]));
        const cafeInfo = {
          ...CAFE_INFO,
          name: settingsMap.get('name') ?? CAFE_INFO.name,
          address: settingsMap.get('address') ?? CAFE_INFO.address,
          city: settingsMap.get('city') ?? CAFE_INFO.city,
          currency: settingsMap.get('currency') ?? CAFE_INFO.currency,
          openHours: settingsMap.get('openHours') ?? CAFE_INFO.openHours,
        };

        return NextResponse.json(
          {
            success: true,
            source: 'neon_postgres',
            cafeInfo,
            categories: mappedCategories,
            items: mappedItems,
            timestamp: new Date().toISOString(),
          },
          { status: 200 }
        );
      }
    } catch (dbError) {
      console.warn('Fallback to mockData due to DB query error:', dbError);
    }

    // 2. Fallback to mockData if DB is empty or unreachable
    const items = MENU_ITEMS.map((item) => ({
      ...item,
      isAvailable: !stopList.has(item.id),
    }));

    return NextResponse.json(
      {
        success: true,
        source: 'static_fallback',
        cafeInfo: CAFE_INFO,
        categories: CATEGORIES,
        items,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ошибка загрузки меню';
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const auth = authorizeStaffRequest(req, 'canManageMenu');
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const {
      name,
      categoryId,
      description,
      price,
      oldPrice,
      imageUrl,
      weight,
      calories,
      proteins,
      fats,
      carbs,
      allergens,
      badges,
      isAvailable,
      cookingTimeMinutes,
      weatherAffinity,
      recommendedItemIds,
      optionGroups,
    } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Название блюда обязательно' }, { status: 400 });
    }
    if (!categoryId || typeof categoryId !== 'string') {
      return NextResponse.json({ success: false, error: 'Категория обязательна' }, { status: 400 });
    }
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      return NextResponse.json({ success: false, error: 'Цена должна быть положительным числом' }, { status: 400 });
    }

    const createdItem = await prisma.menuItem.create({
      data: {
        name: name.trim(),
        categoryId,
        description: description?.trim() || '',
        price: numPrice,
        oldPrice: oldPrice ? Number(oldPrice) : null,
        imageUrl:
          imageUrl?.trim() ||
          'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
        weight: weight?.trim() || '300 г',
        calories: calories ? Number(calories) : 0,
        proteins: proteins ? Number(proteins) : 0,
        fats: fats ? Number(fats) : 0,
        carbs: carbs ? Number(carbs) : 0,
        allergens: Array.isArray(allergens) ? allergens : [],
        badges: Array.isArray(badges) ? badges : [],
        isAvailable: isAvailable !== false,
        cookingTimeMinutes: cookingTimeMinutes ? Number(cookingTimeMinutes) : 10,
        weatherAffinity: weatherAffinity || null,
        recommendedItemIds: Array.isArray(recommendedItemIds) ? recommendedItemIds : [],
        optionGroups:
          Array.isArray(optionGroups) && optionGroups.length > 0
            ? {
                create: optionGroups.map((g: { title: string; required?: boolean; multiple?: boolean; options?: { name: string; price?: number }[] }) => ({
                  title: g.title,
                  required: Boolean(g.required),
                  multiple: Boolean(g.multiple),
                  options: {
                    create: (g.options || []).map((o: { name: string; price?: number }) => ({
                      name: o.name,
                      price: Number(o.price) || 0,
                    })),
                  },
                })),
              }
            : undefined,
      },
      include: {
        optionGroups: {
          include: {
            options: true,
          },
        },
      },
    });

    broadcastEvent({
      type: 'MENU_UPDATED',
      payload: createdItem,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, item: createdItem }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ошибка создания блюда';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
