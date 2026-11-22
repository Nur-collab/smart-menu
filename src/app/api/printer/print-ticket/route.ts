import { NextResponse } from 'next/server';
import { getOrderById } from '@/lib/serverStore';
import { printTicketToNetworkPrinter } from '@/lib/posBridge';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { orderId, printerId } = (await request.json()) as {
      orderId: string;
      printerId?: string;
    };

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

    const printResult = await printTicketToNetworkPrinter(order, printerId);
    return NextResponse.json(printResult);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ошибка термопечати бегунка';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
