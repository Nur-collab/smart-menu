import { NextRequest, NextResponse } from 'next/server';
import { syncMenuAndStopListFromPos } from '@/lib/posBridge';
import { authorizeStaffRequest } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const auth = authorizeStaffRequest(req, 'canManageMenu');
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const result = await syncMenuAndStopListFromPos();
    return NextResponse.json({
      success: true,
      message: 'Меню и складские остатки успешно синхронизированы с кассой',
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ошибка синхронизации меню с кассой';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
