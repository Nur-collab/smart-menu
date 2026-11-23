import { NextRequest, NextResponse } from 'next/server';
import { createReview, getAllReviews, getReviewStats } from '@/lib/serverStore';
import { ReviewSubmitPayload } from '@/types/review';
import { getClientIp, checkRateLimit, RATE_LIMITS } from '@/lib/security/rateLimiter';

/**
 * GET /api/reviews
 * Получить список всех отзывов и агрегированную статистику NPS/2ГИС
 */
export async function GET(): Promise<NextResponse> {
  try {
    const reviews = await getAllReviews();
    const stats = getReviewStats();

    return NextResponse.json(
      {
        success: true,
        reviews,
        stats,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API /api/reviews GET Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка при получении отзывов' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reviews
 * Сохранить новый отзыв гостя со столика
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(`review:${ip}`, RATE_LIMITS.REVIEWS);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Слишком много отзывов. Пожалуйста, повторите попытку через ${rateCheck.retryAfterSeconds} сек.`,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateCheck.retryAfterSeconds),
          },
        }
      );
    }

    const body = (await req.json()) as ReviewSubmitPayload;

    if (!body || typeof body.rating !== 'number' || !body.tableNumber) {
      return NextResponse.json(
        { success: false, error: 'Некорректные параметры: ожидается rating (1-5) и tableNumber' },
        { status: 400 }
      );
    }

    const review = await createReview({
      orderId: body.orderId,
      tableNumber: Number(body.tableNumber),
      rating: body.rating,
      tags: Array.isArray(body.tags) ? body.tags : [],
      comment: body.comment,
      externalPlatform: body.externalPlatform,
    });

    const stats = getReviewStats();

    return NextResponse.json(
      {
        success: true,
        review,
        stats,
        message: review.rating >= 4
          ? 'Спасибо за высокую оценку! Вам начислено 50 бонусов.'
          : 'Спасибо за обратную связь. Мы передали ваши замечания управляющему.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API /api/reviews POST Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка при сохранении отзыва' },
      { status: 500 }
    );
  }
}
