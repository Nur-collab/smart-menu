import { NextRequest, NextResponse } from 'next/server';
import { updateReviewStatus } from '@/lib/serverStore';
import { GuestReview } from '@/types/review';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/reviews/[id]
 * Обновить статус отзыва управляющим (например, отметка об урегулировании претензии)
 */
export async function PATCH(
  req: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { id } = await context.params;
    const body = (await req.json()) as {
      status?: GuestReview['status'];
      managerNotes?: string;
    };

    if (!body.status) {
      return NextResponse.json(
        { success: false, error: 'Параметр status обязателен (new | reviewed | resolved)' },
        { status: 400 }
      );
    }

    const updated = updateReviewStatus(id, body.status, body.managerNotes);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Отзыв не найден' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, review: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API /api/reviews/[id] PATCH Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка при обновлении отзыва' },
      { status: 500 }
    );
  }
}
