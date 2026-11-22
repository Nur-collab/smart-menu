import { NextResponse } from 'next/server';
import { getOrderById } from '@/lib/serverStore';
import { sendOrderToPos } from '@/lib/posBridge';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { orderId } = (await request.json()) as { orderId: string };

    if (!orderId) {
      return NextResponse.json(
        { error: 'Параметр orderId обязателен' },
        { status: 400 }
      );
    }

    const order = getOrderById(orderId);
    if (!order) {
      return NextResponse.json(
        { error: `Заказ #${orderId} не найден` },
        { status: 404 }
      );
    }

    const result = await sendOrderToPos(order);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ошибка отправки заказа в кассу';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
