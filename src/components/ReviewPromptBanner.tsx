'use client';

import React, { useState, useEffect } from 'react';
import { Star, Gift, X } from 'lucide-react';
import { useMenu } from '@/context/MenuContext';

export const ReviewPromptBanner: React.FC = () => {
  const { orders, openReviewModal } = useMenu();
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if guest has an active or recent paid/ready order
    const hasFinishedOrder = orders.some(
      (o) => o.status === 'ready' || o.status === 'served' || o.status === 'paid'
    );

    const isDismissed = sessionStorage.getItem('aura_review_prompt_dismissed');

    if (hasFinishedOrder && !isDismissed) {
      // Delay prompt slightly so it feels organic
      const timer = setTimeout(() => setIsVisible(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [orders]);

  const handleOpen = (): void => {
    setIsVisible(false);
    openReviewModal();
  };

  const handleDismiss = (): void => {
    setIsVisible(false);
    sessionStorage.setItem('aura_review_prompt_dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <aside aria-label="Приглашение оставить отзыв" className="fixed bottom-24 right-4 left-4 sm:left-auto sm:right-6 sm:w-80 z-40 bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] p-3.5 rounded-2xl shadow-xl transition-all animate-slideUp">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-200/70 text-amber-900 flex items-center justify-center shrink-0">
          <Gift className="w-5 h-5 text-amber-700" />
        </div>

        <div className="flex-1 pr-3">
          <div className="flex items-center gap-1 text-[11px] font-bold text-amber-900">
            <span>Оцените ваш визит</span>
            <div className="flex text-amber-500">
              <Star className="w-3 h-3 fill-amber-500" />
              <Star className="w-3 h-3 fill-amber-500" />
              <Star className="w-3 h-3 fill-amber-500" />
            </div>
          </div>
          <p className="text-xs text-[#B45309] mt-0.5 leading-tight">
            Поделитесь впечатлением и получите <strong>+50 бонусов</strong> на счет кафе!
          </p>

          <div className="flex items-center gap-2 mt-2.5">
            <button
              type="button"
              onClick={handleOpen}
              className="px-3 py-1 rounded-lg bg-[#B45309] hover:bg-[#92400E] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Оценить (1 мин)
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="text-xs text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
            >
              Не сейчас
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="text-amber-400 hover:text-amber-700 p-1 -mr-1 -mt-1 cursor-pointer"
          title="Скрыть"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};
