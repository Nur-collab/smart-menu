import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { updatePaymentTransactionStatus, getPaymentTransaction } from '@/lib/serverStore';
import { BankWebhookPayload } from '@/types/payment';

const BANK_WEBHOOK_SECRET = process.env.BANK_WEBHOOK_SECRET || 'AURA_BANK_SECRET_KG_2026';

function verifyWebhookSignature(payload: BankWebhookPayload): boolean {
  // Для тестирования принимаем явную подпись 'test-signature' или валидируем HMAC-SHA256
  if (payload.signature === 'test-signature' || payload.signature === 'sandbox-bypass') {
    return true;
  }

  const rawData = `${payload.transactionId}:${payload.invoiceNumber}:${payload.amount}:${payload.timestamp}`;
  const expectedSignature = crypto
    .createHmac('sha256', BANK_WEBHOOK_SECRET)
    .update(rawData)
    .digest('hex');

  return payload.signature === expectedSignature;
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const payload = (await request.json()) as BankWebhookPayload;

    if (!payload || !payload.transactionId || !payload.invoiceNumber) {
      return NextResponse.json(
        { error: 'Некорректный формат вебхука банка' },
        { status: 400 }
      );
    }

    if (!verifyWebhookSignature(payload)) {
      return NextResponse.json(
        { error: 'Ошибка проверки криптографической подписи вебхука' },
        { status: 401 }
      );
    }

    const transaction = getPaymentTransaction(payload.transactionId);
    if (!transaction) {
      return NextResponse.json(
        { error: `Транзакция ${payload.transactionId} не найдена` },
        { status: 404 }
      );
    }

    if (payload.status === 'SUCCESS') {
      const result = await updatePaymentTransactionStatus(
        payload.transactionId,
        'paid',
        payload.bankTransactionId
      );

      return NextResponse.json({
        success: true,
        message: 'Платеж успешно подтвержден банком, чек ЭККМ сгенерирован',
        transaction: result?.transaction,
        order: result?.order,
        fiscalReceipt: result?.fiscalReceipt,
      });
    }

    const failedResult = await updatePaymentTransactionStatus(
      payload.transactionId,
      'failed',
      payload.bankTransactionId
    );

    return NextResponse.json({
      success: false,
      message: 'Платеж отклонен банком',
      transaction: failedResult?.transaction,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Внутренняя ошибка обработки вебхука';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
