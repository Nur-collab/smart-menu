import { NextRequest, NextResponse } from 'next/server';
import { getStopList, toggleStopListItem } from '@/lib/serverStore';
import { authorizeStaffRequest } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const list = getStopList();
  return NextResponse.json({ success: true, data: list });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const auth = authorizeStaffRequest(req, 'canManageStopList');
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const body = (await req.json()) as { itemId: string };

    if (!body || !body.itemId) {
      return NextResponse.json(
        { success: false, error: 'Идентификатор блюда не указан' },
        { status: 400 }
      );
    }

    const updated = await toggleStopListItem(body.itemId);
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера при обновлении стоп-листа' },
      { status: 500 }
    );
  }
}
