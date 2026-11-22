import { NextRequest, NextResponse } from 'next/server';
import { authenticateStaffByPinOnServer, createStaffToken } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as { pin?: string };

    if (!body || !body.pin || typeof body.pin !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Параметр pin обязателен' },
        { status: 400 }
      );
    }

    const member = authenticateStaffByPinOnServer(body.pin);
    if (!member) {
      return NextResponse.json(
        { success: false, error: 'Неверный PIN-код сотрудника' },
        { status: 401 }
      );
    }

    const token = createStaffToken(member);

    // Удаляем pinCode из ответа для безопасности
    const safeMember = {
      id: member.id,
      name: member.name,
      role: member.role,
      roleTitle: member.roleTitle,
      avatarInitial: member.avatarInitial,
    };

    const response = NextResponse.json({
      success: true,
      member: safeMember,
      token,
    });

    // Выставляем cookie для автоматической передачи браузером при запросах к API
    response.cookies.set({
      name: 'aura_staff_token',
      value: token,
      httpOnly: false, // Доступна для чтения и передачи в заголовках
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 12 * 60 * 60, // 12 часов
    });

    return response;
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка аутентификации', details },
      { status: 500 }
    );
  }
}
