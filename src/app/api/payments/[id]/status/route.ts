import { NextResponse } from 'next/server';
import {
  getPaymentTransaction,
  getOrderById,
  getFiscalReceiptByOrderId,
} from '@/lib/serverStore';
import { PaymentStatusResponse } from '@/types/payment';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await context.params;

    const transaction = getPaymentTransaction(id);
    if (!transaction) {
      return NextResponse.json(
        { error: `Платежная транзакция ${id} не найдена` },
        { status: 404 }
      );
    }

    const order = getOrderById(transaction.orderId);
    const orderStatus = order ? order.status : 'unknown';
    const fiscalReceipt = getFiscalReceiptByOrderId(transaction.orderId);

    const response: PaymentStatusResponse = {
      transaction,
      orderStatus,
      fiscalReceipt,
    };

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Внутренняя ошибка сервера';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
