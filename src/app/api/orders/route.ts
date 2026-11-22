import { NextRequest, NextResponse } from 'next/server';
import { getAllOrders, createOrder } from '@/lib/serverStore';
import { Order, CartItem, SelectedOption } from '@/types/menu';
import { isValidTableNumber } from '@/lib/tableAuth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const orders = getAllOrders();
  return NextResponse.json({ success: true, data: orders });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as Order;

    if (
      !body ||
      typeof body.tableNumber !== 'number' ||
      !isValidTableNumber(body.tableNumber) ||
      !Array.isArray(body.items) ||
      body.items.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Некорректный номер столика (допустимо от 1 до 50) или пустой состав заказа',
        },
        { status: 400 }
      );
    }

    // --- СЕРВЕРНАЯ ВАЛИДАЦИЯ ЦЕН И СОСТАВА ЗАКАЗА (Server-Side Price Validation) ---
    const itemIds = Array.from(new Set(body.items.map((i) => i.menuItem?.id).filter(Boolean)));
    const dbItems = await prisma.menuItem.findMany({
      where: { id: { in: itemIds } },
      include: {
        optionGroups: {
          include: {
            options: true,
          },
        },
      },
    });

    const dbItemMap = new Map(dbItems.map((item) => [item.id, item]));

    let calculatedSubtotal = 0;
    const verifiedCartItems: CartItem[] = [];

    for (const item of body.items) {
      if (!item.menuItem || !item.menuItem.id) {
        return NextResponse.json(
          { success: false, error: 'В заказе обнаружена позиция без идентификатора блюда' },
          { status: 400 }
        );
      }

      const dbItem = dbItemMap.get(item.menuItem.id);
      if (!dbItem) {
        return NextResponse.json(
          { success: false, error: `Блюдо #${item.menuItem.id} не найдено в меню заведения` },
          { status: 400 }
        );
      }

      if (!dbItem.isAvailable) {
        return NextResponse.json(
          { success: false, error: `Блюдо «${dbItem.name}» временно недоступно (в стоп-листе)` },
          { status: 400 }
        );
      }

      const quantity = Math.max(1, Math.min(50, Math.floor(Number(item.quantity) || 1)));

      // Валидация выбранных опций/модификаторов по БД
      let verifiedOptionsDelta = 0;
      const verifiedSelectedOptions: SelectedOption[] = [];

      if (Array.isArray(item.selectedOptions)) {
        // Создаем карту доступных опций для этого блюда
        const availableOptionsMap = new Map<
          string,
          { groupId: string; groupTitle: string; name: string; price: number }
        >();
        for (const group of dbItem.optionGroups) {
          for (const opt of group.options) {
            availableOptionsMap.set(opt.id, {
              groupId: group.id,
              groupTitle: group.title,
              name: opt.name,
              price: opt.price,
            });
          }
        }

        for (const selOpt of item.selectedOptions) {
          const matchedOpt = availableOptionsMap.get(selOpt.optionId);
          if (matchedOpt) {
            verifiedOptionsDelta += matchedOpt.price;
            verifiedSelectedOptions.push({
              groupId: matchedOpt.groupId,
              groupTitle: matchedOpt.groupTitle,
              optionId: selOpt.optionId,
              optionName: matchedOpt.name,
              price: matchedOpt.price,
            });
          }
        }
      }

      const verifiedUnitPrice = dbItem.price + verifiedOptionsDelta;
      calculatedSubtotal += verifiedUnitPrice * quantity;

      verifiedCartItems.push({
        ...item,
        quantity,
        unitPrice: verifiedUnitPrice,
        selectedOptions: verifiedSelectedOptions,
      });
    }

    // Валидация чаевых и скидки бонусами
    const safeTipAmount = Math.max(0, Math.floor(Number(body.tipAmount) || 0));
    // Скидка не может превышать 30% от реальной суммы заказа
    const maxAllowedDiscount = Math.round(calculatedSubtotal * 0.3);
    const safeDiscountAmount = Math.max(
      0,
      Math.min(maxAllowedDiscount, Math.floor(Number(body.discountAmount) || 0))
    );
    const calculatedFinalAmount = Math.max(
      0,
      calculatedSubtotal - safeDiscountAmount + safeTipAmount
    );

    const safeOrder: Order = {
      ...body,
      items: verifiedCartItems,
      totalAmount: calculatedSubtotal,
      discountAmount: safeDiscountAmount,
      tipAmount: safeTipAmount,
      finalAmount: calculatedFinalAmount,
    };

    const savedOrder = await createOrder(safeOrder);
    return NextResponse.json({ success: true, data: savedOrder }, { status: 201 });
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    console.error('API /api/orders error:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера при создании заказа', details },
      { status: 500 }
    );
  }
}
