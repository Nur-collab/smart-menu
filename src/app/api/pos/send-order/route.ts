import { NextRequest, NextResponse } from 'next/server';
import { getOrderById } from '@/lib/serverStore';
import { sendOrderToPos } from '@/lib/posBridge';
import { authorizeStaffRequest } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const auth = authorizeStaffRequest(req);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { orderId } = (await req.json()) as { orderId: string };

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Параметр orderId обязателен' },
        { status: 400 }
      );
    }

    const order = getOrderById(orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, error: `Заказ #${orderId} не найден` },
        { status: 404 }
      );
    }

    const result = await sendOrderToPos(order);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ошибка отправки заказа в кассу';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
