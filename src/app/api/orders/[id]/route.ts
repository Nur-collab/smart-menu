import { NextRequest, NextResponse } from 'next/server';
import { updateOrderStatusInStore } from '@/lib/serverStore';
import { OrderStatus } from '@/types/menu';
import { authorizeStaffRequest } from '@/lib/serverAuth';
import { getPermissionsByRole } from '@/types/auth';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const auth = authorizeStaffRequest(req);
    if (!auth.authorized || !auth.session) {
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

    const permissions = getPermissionsByRole(auth.session.role);

    // Ролевая валидация перехода статуса в KDS (RBAC)
    if (body.status === 'cooking' || body.status === 'ready') {
      if (!permissions.canCookOrders) {
        return NextResponse.json(
          { success: false, error: `Роль ${auth.session.role} не имеет прав на приготовление заказов (canCookOrders)` },
          { status: 403 }
        );
      }
    } else if (body.status === 'served' || body.status === 'paid') {
      if (!permissions.canServeOrders) {
        return NextResponse.json(
          { success: false, error: `Роль ${auth.session.role} не имеет прав на выдачу и расчет заказа (canServeOrders)` },
          { status: 403 }
        );
      }
    } else if (body.status === 'cancelled') {
      if (!permissions.canManageMenu) {
        return NextResponse.json(
          { success: false, error: `Роль ${auth.session.role} не имеет прав на отмену заказа` },
          { status: 403 }
        );
      }
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
