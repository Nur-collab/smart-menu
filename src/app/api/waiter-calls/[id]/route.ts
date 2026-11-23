import { NextRequest, NextResponse } from 'next/server';
import { resolveWaiterCallInStore } from '@/lib/serverStore';
import { authorizeStaffRequest } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const auth = authorizeStaffRequest(req, 'canHandleCalls');
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { id } = await context.params;
    const resolved = await resolveWaiterCallInStore(id);

    if (!resolved) {
      return NextResponse.json(
        { success: false, error: 'Вызов не найден' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: resolved });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера при закрытии вызова' },
      { status: 500 }
    );
  }
}
