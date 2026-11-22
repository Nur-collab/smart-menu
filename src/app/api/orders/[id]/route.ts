import { NextRequest, NextResponse } from 'next/server';
import { updateOrderStatusInStore } from '@/lib/serverStore';
import { OrderStatus } from '@/types/menu';
import { authorizeStaffRequest } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const auth = authorizeStaffRequest(req);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { id } = await context.params;
    const body = (await req.json()) as { status: OrderStatus };

    if (!body || !body.status) {
      return NextResponse.json(
        { success: false, error: 'Статус заказа не указан' },
        { status: 400 }
      );
    }

    const updated = await updateOrderStatusInStore(id, body.status);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Заказ не найден' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера при обновлении статуса' },
      { status: 500 }
    );
  }
}
