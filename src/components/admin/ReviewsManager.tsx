'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Star,
  Sparkles,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Gift,
  Clock,
  Compass,
} from 'lucide-react';
import { GuestReview, ReviewStats } from '@/types/review';

export const ReviewsManager: React.FC = () => {
  const [reviews, setReviews] = useState<readonly GuestReview[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [filter, setFilter] = useState<'all' | 'issues' | 'positive'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchReviews = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/reviews');
      if (res.ok) {
        const data = (await res.json()) as {
          reviews: GuestReview[];
          stats: ReviewStats;
        };
        setReviews(data.reviews);
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Ошибка загрузки отзывов:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;
    fetch('/api/reviews')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { reviews: GuestReview[]; stats: ReviewStats } | null) => {
        if (!isCancelled && data) {
          setReviews(data.reviews);
          setStats(data.stats);
        }
      })
      .catch((err) => console.error('Ошибка загрузки отзывов:', err));

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleResolveIssue = async (id: string, notes?: string): Promise<void> => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'resolved',
          managerNotes: notes || 'Урегулировано управляющим смены',
        }),
      });
      if (res.ok) {
        await fetchReviews();
      }
    } catch (err) {
      console.error('Ошибка обновления отзыва:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    if (filter === 'issues') return r.rating <= 3;
    if (filter === 'positive') return r.rating >= 4;
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Шапка раздела и кнопка обновления */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-[#24211D] dark:text-[#F4F4F5] flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#00A040] dark:text-[#4ADE80]" />
            <span>Рейтинг заведения & Отзывы 2ГИС (Бишкек)</span>
          </h2>
          <p className="text-xs text-[#7E766D] dark:text-[#A1A1AA] mt-0.5">
            Управление репутацией кафе: продвижение высоких оценок в 2ГИС и внутренний перехват претензий.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchReviews}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#18181B] border border-[#EFE9E0] dark:border-[#27272A] hover:border-[#B86B3E] dark:hover:border-[#E07A43] text-xs font-bold text-[#7E766D] dark:text-[#A1A1AA] hover:text-[#24211D] dark:hover:text-[#F4F4F5] transition-all shadow-xs cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Обновить данные</span>
        </button>
      </div>

      {/* KPI Дашборд показателей */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Средний рейтинг */}
          <div className="bg-white dark:bg-[#18181B] p-4 rounded-2xl border border-[#EFE9E0] dark:border-[#27272A] shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-bold text-[#7E766D] dark:text-[#A1A1AA] uppercase tracking-wider">
              Средний рейтинг
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-[#24211D] dark:text-[#F4F4F5]">{stats.averageRating}</span>
              <div className="flex text-amber-500">
                <Star className="w-4 h-4 fill-amber-500" />
              </div>
            </div>
            <span className="text-[10px] text-[#2F6B42] dark:text-[#4ADE80] font-semibold mt-1">
              Цель: 4.9+ в 2ГИС
            </span>
          </div>

          {/* Довольные гости / NPS */}
          <div className="bg-white dark:bg-[#18181B] p-4 rounded-2xl border border-[#EFE9E0] dark:border-[#27272A] shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-bold text-[#7E766D] dark:text-[#A1A1AA] uppercase tracking-wider">
              NPS Промоутеры
            </span>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-3xl font-black text-[#2F6B42] dark:text-[#4ADE80]">
                {stats.positivePercentage}%
              </span>
            </div>
            <span className="text-[10px] text-[#7E766D] dark:text-[#A1A1AA] font-medium mt-1">
              Оценки 4★ и 5★
            </span>
          </div>

          {/* Переходы в 2ГИС / Карты */}
          <div className="bg-white dark:bg-[#18181B] p-4 rounded-2xl border border-[#EFE9E0] dark:border-[#27272A] shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-bold text-[#7E766D] dark:text-[#A1A1AA] uppercase tracking-wider">
              Внешние отзывы
            </span>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-3xl font-black text-[#00A040] dark:text-[#4ADE80]">
                {stats.externalRedirectsCount}
              </span>
            </div>
            <span className="text-[10px] text-[#00A040] dark:text-[#4ADE80] font-semibold mt-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Переходов в 2ГИС/Google
            </span>
          </div>

          {/* Выдано бонусов */}
          <div className="bg-white dark:bg-[#18181B] p-4 rounded-2xl border border-[#EFE9E0] dark:border-[#27272A] shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-bold text-[#7E766D] dark:text-[#A1A1AA] uppercase tracking-wider">
              Бонусов гостям
            </span>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-3xl font-black text-[#B86B3E] dark:text-[#E07A43]">
                {stats.totalBonusesGiven}
              </span>
            </div>
            <span className="text-[10px] text-[#7E766D] dark:text-[#A1A1AA] font-medium mt-1 flex items-center gap-1">
              <Gift className="w-3 h-3 text-[#B86B3E] dark:text-[#E07A43]" /> +50 за каждый отзыв
            </span>
          </div>

          {/* Претензии / Требуют внимания */}
          <div className={`p-4 rounded-2xl border shadow-sm flex flex-col justify-between ${
            stats.pendingIssuesCount > 0
              ? 'bg-[#FEF2F2] dark:bg-[#2A0F14] border-[#FCA5A5] dark:border-[#5C1D24]'
              : 'bg-white dark:bg-[#18181B] border-[#EFE9E0] dark:border-[#27272A]'
          }`}>
            <span className="text-[11px] font-bold text-[#7E766D] dark:text-[#A1A1AA] uppercase tracking-wider">
              К разрешению
            </span>
            <div className="flex items-baseline gap-1 mt-2">
              <span className={`text-3xl font-black ${
                stats.pendingIssuesCount > 0 ? 'text-[#B83A4A] dark:text-[#F87171]' : 'text-[#24211D] dark:text-[#F4F4F5]'
              }`}>
                {stats.pendingIssuesCount}
              </span>
            </div>
            <span className={`text-[10px] font-semibold mt-1 ${
              stats.pendingIssuesCount > 0 ? 'text-[#B83A4A] dark:text-[#F87171]' : 'text-[#2F6B42] dark:text-[#4ADE80]'
            }`}>
              {stats.pendingIssuesCount > 0 ? 'Требуют реакции зала' : 'Все урегулировано ✓'}
            </span>
          </div>
        </div>
      )}

      {/* Панель фильтров списка */}
      <div className="flex items-center gap-2 border-b border-[#EFE9E0] dark:border-[#27272A] pb-3">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filter === 'all'
              ? 'bg-[#24211D] dark:bg-[#F4F4F5] text-white dark:text-[#18181B] shadow-xs'
              : 'bg-white dark:bg-[#18181B] text-[#7E766D] dark:text-[#A1A1AA] hover:text-[#24211D] dark:hover:text-[#F4F4F5] border border-[#EFE9E0] dark:border-[#27272A]'
          }`}
        >
          Все отзывы ({reviews.length})
        </button>

        <button
          type="button"
          onClick={() => setFilter('issues')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            filter === 'issues'
              ? 'bg-[#B83A4A] text-white shadow-xs'
              : 'bg-white dark:bg-[#18181B] text-[#B83A4A] dark:text-[#F87171] border border-[#FCA5A5] dark:border-[#5C1D24] hover:bg-[#FEF2F2] dark:hover:bg-[#2A0F14]'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Претензии (1-3★)</span>
          {stats && stats.pendingIssuesCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-white dark:bg-[#18181B] text-[#B83A4A] dark:text-[#F87171] text-[10px] font-black">
              {stats.pendingIssuesCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setFilter('positive')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            filter === 'positive'
              ? 'bg-[#00A040] text-white shadow-xs'
              : 'bg-white dark:bg-[#18181B] text-[#00A040] dark:text-[#4ADE80] border border-[#86EFAC] dark:border-[#166534] hover:bg-[#F0FDF4] dark:hover:bg-[#062D15]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Положительные (4-5★ 2ГИС)</span>
        </button>
      </div>

      {/* Список карточек отзывов */}
      <div className="space-y-3">
        {filteredReviews.length === 0 ? (
          <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-[#EFE9E0] dark:border-[#27272A] p-10 text-center text-xs text-[#7E766D] dark:text-[#A1A1AA]">
            В выбранной категории отзывов пока нет.
          </div>
        ) : (
          filteredReviews.map((rev) => {
            const isIssue = rev.rating <= 3;
            const isResolved = rev.status === 'resolved';

            return (
              <div
                key={rev.id}
                className={`p-4 rounded-2xl border transition-all shadow-xs ${
                  isIssue && !isResolved
                    ? 'bg-[#FFF8F8] dark:bg-[#220B0E] border-[#FCA5A5] dark:border-[#5C1D24]'
                    : isResolved
                    ? 'bg-[#F9FBF9] dark:bg-[#0B1F12] border-[#BBF7D0] dark:border-[#166534]'
                    : 'bg-white dark:bg-[#18181B] border-[#EFE9E0] dark:border-[#27272A]'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-9 h-9 rounded-xl bg-[#F4EBE3] dark:bg-[#2C1810] text-[#B86B3E] dark:text-[#E07A43] font-black text-sm flex items-center justify-center shrink-0">
                      №{rev.tableNumber}
                    </span>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-[#24211D] dark:text-[#F4F4F5]">
                          Стол №{rev.tableNumber}
                        </span>
                        {rev.orderId && (
                          <span className="text-[10px] text-stone-400 dark:text-stone-500 font-mono">
                            • #{rev.orderId}
                          </span>
                        )}
                        <span className="text-[10px] text-stone-400 dark:text-stone-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(rev.createdAt).toLocaleTimeString('ru-RU', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {/* Звездочки */}
                      <div className="flex items-center gap-1 mt-0.5">
                        <div className="flex text-amber-500">
                          {([1, 2, 3, 4, 5] as const).map((starIdx) => (
                            <Star
                              key={starIdx}
                              className={`w-3.5 h-3.5 ${
                                starIdx <= rev.rating ? 'fill-amber-500' : 'text-stone-300 dark:text-stone-700'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-bold text-[#24211D] dark:text-[#F4F4F5] ml-1">
                          {rev.rating} / 5
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Бейджи статуса и платформы */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {rev.externalPlatform === '2gis' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E6F7ED] dark:bg-[#062D15] text-[#00A040] dark:text-[#4ADE80] border border-[#86EFAC] dark:border-[#166534]">
                        <Compass className="w-3 h-3" />
                        2ГИС Бишкек
                      </span>
                    )}

                    {rev.externalPlatform === 'google' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EFF6FF] dark:bg-[#0C2238] text-[#2563EB] dark:text-[#60A5FA] border border-[#BFDBFE] dark:border-[#1E3A5F]">
                        Google Карты
                      </span>
                    )}

                    {rev.bonusAwarded > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300">
                        +{rev.bonusAwarded} бонусов
                      </span>
                    )}

                    {isIssue && (
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isResolved
                            ? 'bg-[#EBF5ED] dark:bg-[#062D15] text-[#2F6B42] dark:text-[#4ADE80]'
                            : 'bg-[#FEE2E2] dark:bg-[#2A0F14] text-[#B83A4A] dark:text-[#F87171] animate-pulse'
                        }`}
                      >
                        {isResolved ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" /> Урегулировано
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3 h-3" /> Требует внимания
                          </>
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {/* Теги впечатлений */}
                {rev.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {rev.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`text-[11px] px-2.5 py-0.5 rounded-lg font-medium ${
                          isIssue
                            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Комментарий гостя */}
                {rev.comment && (
                  <div className="mt-2 text-xs text-[#24211D] dark:text-[#F4F4F5] bg-[#FAF7F2] dark:bg-[#27272A]/70 p-2.5 rounded-xl border border-[#EAE3D2] dark:border-[#3F3F46] flex items-start gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500 mt-0.5 shrink-0" />
                    <p className="italic leading-relaxed">{rev.comment}</p>
                  </div>
                )}

                {/* Заметка управляющего */}
                {rev.managerNotes && (
                  <p className="text-[11px] text-[#2F6B42] dark:text-[#4ADE80] font-medium mt-2 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Заметка: {rev.managerNotes}
                  </p>
                )}

                {/* Действие управляющего для открытых претензий */}
                {isIssue && !isResolved && (
                  <div className="mt-3 pt-2.5 border-t border-rose-200 dark:border-rose-900/60 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-[#B83A4A] dark:text-[#F87171] font-semibold">
                      Негативный отзыв перехвачен внутри заведения (не попал в 2ГИС).
                    </span>
                    <button
                      type="button"
                      disabled={updatingId === rev.id}
                      onClick={() => handleResolveIssue(rev.id, 'Официант принес комплимент от шефа')}
                      className="px-3 py-1.5 rounded-xl bg-[#2F6B42] hover:bg-[#255635] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Отметить как урегулировано</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Информационная плашка для управляющего */}
      <div className="p-4 bg-emerald-50 dark:bg-[#062D15]/60 border border-emerald-200 dark:border-[#166534] rounded-2xl text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-3">
        <Compass className="w-5 h-5 text-emerald-700 dark:text-[#4ADE80] shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-emerald-950 dark:text-emerald-100">
            Как работает автоматическая воронка 2ГИС в Бишкеке:
          </h4>
          <p className="mt-0.5 leading-relaxed text-emerald-800 dark:text-emerald-300">
            Гости с оценкой <strong>4-5 звезд</strong> сразу перенаправляются для публикации отзыва в 2ГИС и Google Maps с начислением <strong>+50 бонусов</strong> на баланс. 
            Гости с оценкой <strong>1-3 звезды</strong> перехватываются здесь в панели администратора, предотвращая снижение публичного рейтинга кафе.
          </p>
        </div>
      </div>
    </div>
  );
};
