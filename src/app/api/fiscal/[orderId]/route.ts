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

    let receipt = getFiscalReceiptByOrderId(orderId);

    // Если чек еще не создан, но заказ существует, генерируем фискальный чек
    if (!receipt) {
      const order = getOrderById(orderId);
      if (!order) {
        return NextResponse.json(
          { error: `Заказ #${orderId} не найден` },
          { status: 404 }
        );
      }

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
