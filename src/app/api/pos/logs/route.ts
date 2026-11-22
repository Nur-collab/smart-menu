import { NextResponse } from 'next/server';
import { getPosSyncLogs } from '@/lib/posBridge';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  try {
    const logs = getPosSyncLogs();
    return NextResponse.json({ logs });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ошибка получения логов POS';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
