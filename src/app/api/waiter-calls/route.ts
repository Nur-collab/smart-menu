import { NextRequest, NextResponse } from 'next/server';
import { getAllWaiterCalls, createWaiterCall } from '@/lib/serverStore';
import { WaiterCallReason } from '@/types/menu';
import { isValidTableNumber } from '@/lib/tableAuth';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const calls = getAllWaiterCalls();
  return NextResponse.json({ success: true, data: calls });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as { tableNumber: number; reason: WaiterCallReason };

    if (
      !body ||
      typeof body.tableNumber !== 'number' ||
      !isValidTableNumber(body.tableNumber) ||
      !body.reason
    ) {
      return NextResponse.json(
        { success: false, error: 'Некорректный номер столика (допустимо 1-50) или причина вызова' },
        { status: 400 }
      );
    }

    const newCall = createWaiterCall(body.tableNumber, body.reason);
    return NextResponse.json({ success: true, data: newCall }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера при создании вызова' },
      { status: 500 }
    );
  }
}
