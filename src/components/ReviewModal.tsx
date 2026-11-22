'use client';

import React, { useState } from 'react';
import {
  X,
  Star,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Send,
  MessageSquareHeart,
  Gift,
} from 'lucide-react';
import { useMenu } from '@/context/MenuContext';
import {
  ReviewRating,
  EXTERNAL_PLATFORMS,
  POSITIVE_FEEDBACK_TAGS,
  CRITICAL_FEEDBACK_TAGS,
  ExternalReviewPlatform,
  ReviewSubmitPayload,
} from '@/types/review';

interface ReviewModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly orderId?: string;
  readonly initialRating?: ReviewRating;
}

const RATING_EMOJIS: Record<ReviewRating, { emoji: string; label: string }> = {
  1: { emoji: '😠', label: 'Ужасно' },
  2: { emoji: '🙁', label: 'Не понравилось' },
  3: { emoji: '😐', label: 'Нормально' },
  4: { emoji: '🙂', label: 'Хорошо' },
  5: { emoji: '😍', label: 'Восхитительно!' },
};

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  orderId,
  initialRating = 5,
}) => {
  const { tableNumber, addBonusPoints } = useMenu();
  const [rating, setRating] = useState<ReviewRating>(initialRating);
  const [selectedTags, setSelectedTags] = useState<readonly string[]>([]);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [chosenPlatform, setChosenPlatform] = useState<ExternalReviewPlatform | null>(null);

  if (!isOpen) return null;

  const isPositive = rating >= 4;

  const handleToggleTag = (tag: string): void => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Готовый сгенерированный текст для отзыва в 2ГИС Бишкек
  const generatedReviewText = [
    `Отличное место в Бишкеке! Столик №${tableNumber}.`,
    selectedTags.length > 0 ? `Особенно понравилось: ${selectedTags.join(', ')}.` : '',
    comment.trim(),
    'Рекомендую к посещению!',
  ]
    .filter(Boolean)
    .join(' ');

  const handleCopyText = (): void => {
    navigator.clipboard.writeText(generatedReviewText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleSubmitInternalReview = async (platform?: ExternalReviewPlatform): Promise<void> => {
    if (isSubmitting || isSubmitted) return;
    setIsSubmitting(true);
    try {
      const payload: ReviewSubmitPayload = {
        orderId,
        tableNumber,
        rating,
        tags: selectedTags,
        comment: comment.trim() || undefined,
        externalPlatform: platform ?? null,
      };

      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        // Проверяем, не начислялись ли бонусы за этот заказ ранее
        const storageKey = 'aura_rewarded_orders';
        let alreadyRewarded = false;
        try {
          const raw = localStorage.getItem(storageKey);
          const rewardedList: string[] = raw ? JSON.parse(raw) : [];
          if (orderId && rewardedList.includes(orderId)) {
            alreadyRewarded = true;
          } else if (orderId) {
            rewardedList.push(orderId);
            localStorage.setItem(storageKey, JSON.stringify(rewardedList));
          }
        } catch {
          // ignore storage error
        }

        if (isPositive && !alreadyRewarded) {
          addBonusPoints(50);
        }
        setIsSubmitted(true);
      }
    } catch (err) {
      console.error('Ошибка отправки отзыва:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExternalPlatformClick = (platform: ExternalReviewPlatform, url: string): void => {
    setChosenPlatform(platform);
    handleSubmitInternalReview(platform);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-[#24211D]/65 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#FBF9F5] border border-[#EAE3D2] rounded-3xl p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 transition-colors rounded-full"
          title="Закрыть"
        >
          <X className="w-5 h-5" />
        </button>

        {!isSubmitted ? (
          <div className="space-y-5">
            {/* Заголовок */}
            <div className="text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/80 text-amber-800 text-xs font-semibold mb-2">
                <Gift className="w-3.5 h-3.5 text-amber-600" />
                <span>+50 бонусов за ваш отзыв</span>
              </div>
              <h3 className="text-xl font-bold text-[#24211D]">
                Как прошел ваш визит?
              </h3>
              <p className="text-xs text-[#78716C] mt-1">
                Столик №{tableNumber}. Ваше мнение помогает нам становиться лучше каждый день!
              </p>
            </div>

            {/* Селектор рейтинга (смайлики и звезды) */}
            <div className="bg-white p-4 rounded-2xl border border-[#EAE3D2] shadow-xs">
              <div className="flex items-center justify-around gap-1">
                {([1, 2, 3, 4, 5] as const).map((r) => {
                  const item = RATING_EMOJIS[r];
                  const isSelected = rating === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        setRating(r);
                        setSelectedTags([]);
                      }}
                      className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all cursor-pointer ${
                        isSelected
                          ? 'scale-110 bg-[#FFFBEB] ring-2 ring-amber-500 shadow-xs'
                          : 'opacity-70 hover:opacity-100 hover:bg-stone-50'
                      }`}
                    >
                      <span className="text-3xl filter drop-shadow-xs">{item.emoji}</span>
                      <div className="flex items-center gap-0.5">
                        <Star
                          className={`w-3.5 h-3.5 ${
                            isSelected ? 'text-amber-500 fill-amber-500' : 'text-stone-300'
                          }`}
                        />
                        <span className="text-xs font-bold text-[#24211D]">{r}</span>
                      </div>
                      <span className="text-[10px] text-stone-500 font-medium">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Быстрые теги впечатлений */}
            <div>
              <label className="block text-xs font-semibold text-[#57534E] mb-2">
                {isPositive ? 'Что понравилось больше всего?' : 'Что нам нужно улучшить?'}
              </label>
              <div className="flex flex-wrap gap-2">
                {(isPositive ? POSITIVE_FEEDBACK_TAGS : CRITICAL_FEEDBACK_TAGS).map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleToggleTag(tag)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
                        isSelected
                          ? isPositive
                            ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-xs font-semibold'
                            : 'bg-rose-100 text-rose-900 border-rose-300 shadow-xs font-semibold'
                          : 'bg-white text-stone-600 border-stone-200 hover:border-amber-200'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Поле комментария */}
            <div>
              <label className="block text-xs font-semibold text-[#57534E] mb-1.5">
                {isPositive ? 'Ваш комментарий (по желанию):' : 'Опишите ситуацию подробнее:'}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder={
                  isPositive
                    ? 'Например: очень понравился куурдак и свежая выпечка...'
                    : 'Пожалуйста, расскажите, что пошло не так...'
                }
                className="w-full text-xs p-3 rounded-xl border border-stone-200 bg-white text-[#24211D] placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Воронка: Разделение по оценке */}
            {isPositive ? (
              /* Положительный отзыв: Продвижение в 2ГИС и Google Maps Бишкека */
              <div className="space-y-3 pt-1 border-t border-stone-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#24211D] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    Опубликовать на картах Бишкека (+50 бонусов):
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyText}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 hover:text-amber-950 cursor-pointer"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">Скопировано!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Скопировать готовый отзыв</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {EXTERNAL_PLATFORMS.map((platform) => (
                    <button
                      key={platform.id}
                      type="button"
                      onClick={() => handleExternalPlatformClick(platform.id, platform.url)}
                      className="p-3 bg-white border border-stone-200 hover:border-amber-400 rounded-xl flex flex-col items-center gap-1 text-center group transition-all shadow-xs hover:shadow-md cursor-pointer"
                    >
                      <div className="flex items-center gap-1 text-xs font-bold text-[#24211D] group-hover:text-amber-700">
                        <span>{platform.name}</span>
                        <ExternalLink className="w-3 h-3 text-stone-400 group-hover:text-amber-600" />
                      </div>
                      <span className="text-[10px] text-stone-500">
                        {platform.badgeText}
                      </span>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSubmitInternalReview()}
                  className="w-full mt-2 py-3 rounded-xl bg-[#B45309] hover:bg-[#92400E] text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Отправка...' : 'Отправить отзыв в кафе (+50 бонусов)'}</span>
                </button>
              </div>
            ) : (
              /* Отрицательный отзыв: Внутренний перехват негатива */
              <div className="space-y-3 pt-1 border-t border-stone-200">
                <div className="p-3 bg-stone-100 rounded-xl text-xs text-stone-600 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    Мы не публикуем замечания на внешних картах. Ваше обращение поступит напрямую
                    управляющему для немедленного решения ситуации.
                  </span>
                </div>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSubmitInternalReview()}
                  className="w-full py-3 rounded-xl bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Отправка...' : 'Передать обращение управляющему'}</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Экран благодарности после отправки */
          <div className="text-center py-6 space-y-4 animate-scaleUp">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center shadow-xs">
              <MessageSquareHeart className="w-9 h-9" />
            </div>

            <div>
              <h4 className="text-lg font-bold text-[#24211D]">
                {isPositive ? 'Рахмат! Ваш отзыв принят' : 'Спасибо за откровенность'}
              </h4>
              <p className="text-xs text-[#78716C] max-w-sm mx-auto mt-1">
                {isPositive
                  ? 'Вам начислено +50 бонусов. Они будут автоматически применены при следующем заказе!'
                  : 'Управляющий заведением уже уведомлен. Мы сделаем все, чтобы ваш следующий визит был безупречным.'}
              </p>
            </div>

            {chosenPlatform && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 max-w-xs mx-auto">
                <p className="font-semibold">Страница на картах открыта в новой вкладке</p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Если текст не вставился автоматически, нажмите «Вставить» (Ctrl+V / Нажмите и удерживайте).
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-[#24211D] hover:bg-black text-white text-xs font-bold transition-all cursor-pointer"
            >
              Вернуться в меню
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
