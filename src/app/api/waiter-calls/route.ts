import { NextRequest, NextResponse } from 'next/server';
import { getAllWaiterCalls, createWaiterCall } from '@/lib/serverStore';
import { getClientIp, checkRateLimit, RATE_LIMITS } from '@/lib/security/rateLimiter';
import { validateWaiterCallInput } from '@/lib/validation/schemas';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const calls = await getAllWaiterCalls();
  return NextResponse.json({ success: true, data: calls });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const ip = getClientIp(req);
    const rate = checkRateLimit(`waiter_call:${ip}`, RATE_LIMITS.WAITER_CALL);
    if (!rate.allowed) {
      return NextResponse.json(
        { success: false, error: `Слишком много вызовов официанта. Подождите ${rate.retryAfterSeconds} сек.` },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
      );
    }

    const raw = await req.json();
    const validation = validateWaiterCallInput(raw);
    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { success: false, error: validation.error || 'Некорректные параметры вызова' },
        { status: 400 }
      );
    }

    const newCall = await createWaiterCall(validation.data.tableNumber, validation.data.reason);
    return NextResponse.json({ success: true, data: newCall }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера при создании вызова' },
      { status: 500 }
    );
  }
}
