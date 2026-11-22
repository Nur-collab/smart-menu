import { NextRequest, NextResponse } from 'next/server';
import { resolveWaiterCallInStore } from '@/lib/serverStore';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(_req: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const { id } = await context.params;
    const resolved = resolveWaiterCallInStore(id);

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
