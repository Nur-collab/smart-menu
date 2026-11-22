import { NextRequest, NextResponse } from 'next/server';
import { getAllOrders } from '@/lib/serverStore';
import { getClientIp, checkRateLimit, RATE_LIMITS } from '@/lib/security/rateLimiter';
import { validateOrderInput } from '@/lib/validation/schemas';
import { OrderService } from '@/services/orderService';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const orders = getAllOrders();
  return NextResponse.json({ success: true, data: orders });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const ip = getClientIp(req);
    const rate = checkRateLimit(`order_create:${ip}`, RATE_LIMITS.ORDER_CREATION);
    if (!rate.allowed) {
      return NextResponse.json(
        { success: false, error: `Превышен лимит создания заказов. Подождите ${rate.retryAfterSeconds} сек.` },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
      );
    }

    const rawBody = await req.json();
    const validation = validateOrderInput(rawBody);
    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { success: false, error: validation.error || 'Некорректный формат заказа' },
        { status: 400 }
      );
    }

    const result = await OrderService.verifyAndCreateOrder(validation.data);
    if (!result.success || !result.order) {
      return NextResponse.json(
        { success: false, error: result.error || 'Ошибка создания заказа' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: result.order }, { status: 201 });
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    console.error('API /api/orders error:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера при создании заказа', details },
      { status: 500 }
    );
  }
}
