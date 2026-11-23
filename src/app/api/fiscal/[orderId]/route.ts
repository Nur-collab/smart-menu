import { NextResponse } from 'next/server';
import {
  getFiscalReceiptByOrderId,
  generateFiscalReceiptForOrder,
  getOrderById,
} from '@/lib/serverStore';

export async function GET(
  _request: Request,
  context: { params: Promise<{ orderId: string }> }
): Promise<NextResponse> {
  try {
    const { orderId } = await context.params;

    const order = getOrderById(orderId);
    if (!order) {
      return NextResponse.json(
        { error: `Заказ #${orderId} не найден` },
        { status: 404 }
      );
    }

    // Фискализация разрешена исключительно для оплаченных заказов
    if (order.status !== 'paid') {
      return NextResponse.json(
        { error: `Заказ #${orderId} еще не оплачен (текущий статус: ${order.status}). Фискальный чек недоступен.` },
        { status: 400 }
      );
    }

    let receipt = getFiscalReceiptByOrderId(orderId);

    if (!receipt) {
      receipt = generateFiscalReceiptForOrder(orderId) ?? undefined;
    }

    if (!receipt) {
      return NextResponse.json(
        { error: `Не удалось сформировать фискальный чек для заказа #${orderId}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ receipt });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Внутренняя ошибка фискализации';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
