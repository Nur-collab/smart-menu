import { NextResponse } from 'next/server';
import { syncMenuAndStopListFromPos } from '@/lib/posBridge';

export async function POST(): Promise<NextResponse> {
  try {
    const result = await syncMenuAndStopListFromPos();
    return NextResponse.json({
      success: true,
      message: 'Меню и складские остатки успешно синхронизированы с кассой',
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ошибка синхронизации меню с кассой';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
