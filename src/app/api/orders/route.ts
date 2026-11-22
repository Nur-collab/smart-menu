import { NextRequest, NextResponse } from 'next/server';
import { getAllOrders, createOrder } from '@/lib/serverStore';
import { Order } from '@/types/menu';
import { isValidTableNumber } from '@/lib/tableAuth';

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

    const savedOrder = createOrder(body);
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
