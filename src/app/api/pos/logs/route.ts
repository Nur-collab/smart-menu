import { NextRequest, NextResponse } from 'next/server';
import { getPosSyncLogs } from '@/lib/posBridge';
import { authorizeStaffRequest } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const auth = authorizeStaffRequest(req, 'canViewAnalytics');
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const logs = getPosSyncLogs();
    return NextResponse.json({ success: true, logs });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ошибка получения логов POS';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
