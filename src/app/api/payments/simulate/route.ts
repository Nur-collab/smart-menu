import { NextResponse } from 'next/server';
import { updatePaymentTransactionStatus, getPaymentTransaction } from '@/lib/serverStore';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { transactionId } = (await request.json()) as { transactionId: string };

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Параметр transactionId обязателен' },
        { status: 400 }
      );
    }

    const transaction = getPaymentTransaction(transactionId);
    if (!transaction) {
      return NextResponse.json(
        { error: `Транзакция ${transactionId} не найдена` },
        { status: 404 }
      );
    }

    const mockBankTxnId = `BNK-KG-${Date.now().toString(36).toUpperCase()}`;
    const result = await updatePaymentTransactionStatus(transactionId, 'paid', mockBankTxnId);

    if (!result) {
      return NextResponse.json(
        { error: 'Не удалось обновить статус транзакции' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Тестовая оплата успешно подтверждена (Sandbox Режим КР)',
      transaction: result.transaction,
      order: result.order,
      fiscalReceipt: result.fiscalReceipt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ошибка симуляции платежа';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
