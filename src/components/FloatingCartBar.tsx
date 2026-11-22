'use client';

import React from 'react';
import { useMenu } from '@/context/MenuContext';
import { ShoppingBag, ChevronRight, Clock, ChefHat, BellRing, UtensilsCrossed, CheckCircle2 } from 'lucide-react';

export function FloatingCartBar(): React.JSX.Element | null {
  const {
    cartItemsCount,
    cartSubtotal,
    setActiveModal,
    activeOrder,
    cafeInfo,
    t,
    language,
  } = useMenu();

  if (cartItemsCount === 0 && !activeOrder) {
    return null;
  }

  const isCooking = activeOrder?.status === 'cooking';
  const isReady = activeOrder?.status === 'ready';
  const isServed = activeOrder?.status === 'served';
  const isPaid = activeOrder?.status === 'paid';

  const statusLabel = isCooking
    ? t('statusCooking')
    : isReady
    ? t('statusReady')
    : isServed
    ? t('statusServed')
    : isPaid
    ? t('statusPaid')
    : t('statusAccepted');

  const bannerTitle = isCooking
    ? `${t('orderCookingBanner')} #${activeOrder?.id}`
    : isReady
    ? `${t('statusReady')}! #${activeOrder?.id}`
    : isServed
    ? `${t('statusServed')}! #${activeOrder?.id}`
    : isPaid
    ? `${t('statusPaid')} #${activeOrder?.id}`
    : `${t('orderAccepted')} #${activeOrder?.id}`;

  const iconBg = isReady || isServed || isPaid ? 'bg-[#EBF5ED] text-[#2F6B42]' : 'bg-[#F4EBE3] text-[#B86B3E]';
  const statusColor = isReady || isServed || isPaid ? 'text-[#2F6B42]' : 'text-[#B86B3E]';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-3.5 bg-gradient-to-t from-[#FBF9F5] via-[#FBF9F5]/90 to-transparent pointer-events-none">
      <div className="max-w-md mx-auto space-y-2 pointer-events-auto">
        {/* Если есть активный готовящийся заказ */}
        {activeOrder && (
          <button
            type="button"
            onClick={() => setActiveModal('tracker')}
            className="w-full bg-white/95 hover:bg-white border border-[#EFE9E0] rounded-2xl p-2.5 px-4 shadow-[0_4px_16px_rgba(40,30,20,0.06)] backdrop-blur-md flex items-center justify-between transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl ${iconBg} flex items-center justify-center transition-colors`}>
                {isCooking && <ChefHat className="w-4 h-4 animate-bounce" />}
                {isReady && <BellRing className="w-4 h-4 animate-pulse" />}
                {isServed && <UtensilsCrossed className="w-4 h-4" />}
                {isPaid && <CheckCircle2 className="w-4 h-4" />}
                {!isCooking && !isReady && !isServed && !isPaid && <Clock className="w-4 h-4" />}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#24211D]">
                  <span>{bannerTitle}</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${isReady || isServed || isPaid ? 'bg-[#2F6B42]' : 'bg-[#B86B3E]'} animate-pulse`} />
                </div>
                <span className={`text-[11px] ${statusColor} font-bold flex items-center gap-1`}>
                  <Clock className="w-3 h-3" /> {language === 'en' ? 'Status' : language === 'kg' ? 'Статусу' : 'Статус'}:{' '}
                  {statusLabel}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs font-bold text-[#7E766D] group-hover:text-[#24211D]">
              <span>{t('trackOrder')}</span>
              <ChevronRight className="w-4 h-4 text-[#A8A095] group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>
        )}

        {/* Кнопка перехода в корзину */}
        {cartItemsCount > 0 && (
          <button
            type="button"
            onClick={() => setActiveModal('cart')}
            className="w-full bg-[#B86B3E] hover:bg-[#A3592E] active:scale-[0.98] text-white font-bold p-3.5 px-5 rounded-2xl shadow-[0_4px_20px_rgba(184,107,62,0.3)] flex items-center justify-between transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
                <span className="absolute -top-1.5 -right-2 bg-white text-[#B86B3E] text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                  {cartItemsCount}
                </span>
              </div>
              <span className="text-sm font-extrabold">{t('checkoutOrder')}</span>
            </div>

            <div className="flex items-center gap-2 text-sm font-black">
              <span>{cartSubtotal} {cafeInfo.currency}</span>
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
