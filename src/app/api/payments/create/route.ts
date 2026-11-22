import { NextResponse } from 'next/server';
import { createPaymentTransaction, getOrderById } from '@/lib/serverStore';
import { CreatePaymentRequest, CreatePaymentResponse } from '@/types/payment';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as CreatePaymentRequest;

    if (!body || !body.orderId) {
      return NextResponse.json(
        { error: 'Параметр orderId обязателен для создания платежа' },
        { status: 400 }
      );
    }

    const order = getOrderById(body.orderId);
    if (!order) {
      return NextResponse.json(
        { error: `Заказ #${body.orderId} не найден в системе` },
        { status: 404 }
      );
    }

    const provider = body.provider || 'elqr';
    const transaction = createPaymentTransaction(body.orderId, provider);

    const responseData: CreatePaymentResponse = {
      transaction,
    };

    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ошибка создания платежа';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
