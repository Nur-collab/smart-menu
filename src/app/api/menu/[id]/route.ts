import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { broadcastEvent } from '@/lib/serverStore';
import { authorizeStaffRequest } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await context.params;
    const item = await prisma.menuItem.findUnique({
      where: { id },
      include: {
        category: true,
        optionGroups: {
          include: {
            options: true,
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ success: false, error: 'Блюдо не найдено' }, { status: 404 });
    }

    return NextResponse.json({ success: true, item });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ошибка загрузки блюда';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const auth = authorizeStaffRequest(req, 'canManageMenu');
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { id } = await context.params;
    const body = await req.json();

    const existing = await prisma.menuItem.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Блюдо не найдено' }, { status: 404 });
    }

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

    // Optional optionGroups update: if passed, delete existing and recreate
    if (Array.isArray(optionGroups)) {
      await prisma.menuItemOptionGroup.deleteMany({
        where: { menuItemId: id },
      });

      for (const group of optionGroups) {
        await prisma.menuItemOptionGroup.create({
          data: {
            menuItemId: id,
            title: group.title,
            required: Boolean(group.required),
            multiple: Boolean(group.multiple),
            options: {
              create: (group.options || []).map((o: { name: string; price?: number }) => ({
                name: o.name,
                price: Number(o.price) || 0,
              })),
            },
          },
        });
      }
    }

    const updatedItem = await prisma.menuItem.update({
      where: { id },
      data: {
        name: name !== undefined ? String(name).trim() : undefined,
        categoryId: categoryId !== undefined ? String(categoryId) : undefined,
        description: description !== undefined ? String(description).trim() : undefined,
        price: price !== undefined ? Number(price) : undefined,
        oldPrice: oldPrice !== undefined ? (oldPrice ? Number(oldPrice) : null) : undefined,
        imageUrl: imageUrl !== undefined ? String(imageUrl).trim() : undefined,
        weight: weight !== undefined ? String(weight).trim() : undefined,
        calories: calories !== undefined ? Number(calories) : undefined,
        proteins: proteins !== undefined ? Number(proteins) : undefined,
        fats: fats !== undefined ? Number(fats) : undefined,
        carbs: carbs !== undefined ? Number(carbs) : undefined,
        allergens: Array.isArray(allergens) ? allergens : undefined,
        badges: Array.isArray(badges) ? badges : undefined,
        isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : undefined,
        cookingTimeMinutes: cookingTimeMinutes !== undefined ? Number(cookingTimeMinutes) : undefined,
        weatherAffinity: weatherAffinity !== undefined ? (weatherAffinity || null) : undefined,
        recommendedItemIds: Array.isArray(recommendedItemIds) ? recommendedItemIds : undefined,
      },
      include: {
        category: true,
        optionGroups: {
          include: {
            options: true,
          },
        },
      },
    });

    broadcastEvent({
      type: 'MENU_UPDATED',
      payload: updatedItem,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, item: updatedItem });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ошибка обновления блюда';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const auth = authorizeStaffRequest(req, 'canManageMenu');
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { id } = await context.params;

    const existing = await prisma.menuItem.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Блюдо не найдено' }, { status: 404 });
    }

    await prisma.menuItem.delete({
      where: { id },
    });

    broadcastEvent({
      type: 'MENU_UPDATED',
      payload: { id, deleted: true },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ошибка удаления блюда';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
