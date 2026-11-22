'use client';

import React, { useState } from 'react';
import { useMenu } from '@/context/MenuContext';
import { OrderStatus } from '@/types/menu';
import {
  X,
  Clock,
  ChefHat,
  BellRing,
  UtensilsCrossed,
  Star,
  Sparkles,
  Heart,
  Receipt,
  QrCode,
  CheckCircle2,
} from 'lucide-react';
import { getLocalizedName } from '@/lib/i18n';

interface StatusStep {
  readonly status: OrderStatus;
  readonly labelKey: 'statusAccepted' | 'statusCooking' | 'statusReady' | 'statusServed';
  readonly icon: React.ReactNode;
}

const STATUS_STEPS: readonly StatusStep[] = [
  {
    status: 'pending',
    labelKey: 'statusAccepted',
    icon: <Clock className="w-4 h-4" />,
  },
  {
    status: 'cooking',
    labelKey: 'statusCooking',
    icon: <ChefHat className="w-4 h-4" />,
  },
  {
    status: 'ready',
    labelKey: 'statusReady',
    icon: <BellRing className="w-4 h-4" />,
  },
  {
    status: 'served',
    labelKey: 'statusServed',
    icon: <UtensilsCrossed className="w-4 h-4" />,
  },
];

export function OrderTrackerModal(): React.JSX.Element | null {
  const {
    activeModal,
    setActiveModal,
    activeOrder,
    cafeInfo,
    openPaymentModal,
    openFiscalReceiptModal,
    t,
    language,
  } = useMenu();
  const [rating, setRating] = useState<number>(5);
  const [reviewSent, setReviewSent] = useState<boolean>(false);

  if (activeModal !== 'tracker' || !activeOrder) return null;

  const getStepIndex = (status: OrderStatus): number => {
    switch (status) {
      case 'pending':
      case 'accepted':
        return 0;
      case 'cooking':
        return 1;
      case 'ready':
        return 2;
      case 'served':
      case 'paid':
        return 3;
      default:
        return 0;
    }
  };

  const currentStep = getStepIndex(activeOrder.status);

  const handleSendReview = (): void => {
    setReviewSent(true);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-[#24211D]/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
      onClick={() => setActiveModal(null)}
    >
      <div
        className="w-full max-w-md bg-[#FBF9F5] border border-[#EFE9E0] rounded-3xl p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto animate-scaleUp relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setActiveModal(null)}
          className="absolute top-4 right-4 p-1.5 text-[#A8A095] hover:text-[#24211D] transition-colors cursor-pointer"
          title={t('close')}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Заголовок заказа */}
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2F6B42] animate-pulse" />
            <span className="text-[10px] uppercase font-bold text-[#2F6B42] tracking-wider">
              {language === 'en' ? 'Order' : language === 'kg' ? 'Буйрутма' : 'Заказ'} #{activeOrder.id}
            </span>
          </div>
          <h3 className="text-lg font-black text-[#24211D] mt-0.5">
            {activeOrder.status === 'cooking'
              ? `${t('orderCookingBanner')}: ${t('tableNumberPrefix')}${activeOrder.tableNumber}`
              : activeOrder.status === 'ready'
              ? `${t('statusReady')}! ${t('tableNumberPrefix')}${activeOrder.tableNumber}`
              : activeOrder.status === 'served' || activeOrder.status === 'paid'
              ? `${t('statusServed')}! ${t('tableNumberPrefix')}${activeOrder.tableNumber}`
              : `${t('orderAccepted')}: ${t('tableNumberPrefix')}${activeOrder.tableNumber}`}
          </h3>
          <p className="text-xs text-[#7E766D] mt-0.5">
            {activeOrder.status === 'cooking'
              ? (language === 'en' ? 'Our kitchen team has started preparing your dishes' : language === 'kg' ? 'Ашпозчу сиздин тамактарыңызды даярдап жатат' : 'Шеф уже приступил к приготовлению ваших блюд')
              : activeOrder.status === 'ready'
              ? (language === 'en' ? 'Your dishes are ready! The waiter is on the way' : language === 'kg' ? 'Тамактар даяр! Официант алып келе жатат' : 'Блюда готовы! Официант уже несет их к вашему столику')
              : activeOrder.status === 'served' || activeOrder.status === 'paid'
              ? (language === 'en' ? 'Enjoy your meal! Please let us know how everything was' : language === 'kg' ? 'Тамагыңыз таттуу болсун! Сизге жакты деп үмүттөнөбүз' : 'Приятного аппетита! Желаем отличного отдыха')
              : (language === 'en' ? 'Order received and sent to the kitchen' : language === 'kg' ? 'Буйрутма кабыл алынды жана ашканага жөнөтүлдү' : 'Заказ принят и передан поварам')}
          </p>
        </div>

        {/* Шкала статуса приготовления */}
        <div className="bg-white border border-[#EFE9E0] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between relative">
            {/* Фоновая линия прогресса */}
            <div className="absolute top-4 left-6 right-6 h-0.5 bg-[#EFE9E0] -z-0" />
            <div
              className="absolute top-4 left-6 h-0.5 bg-[#B86B3E] transition-all duration-700 -z-0"
              style={{
                width: `${(currentStep / (STATUS_STEPS.length - 1)) * 82}%`,
              }}
            />

            {STATUS_STEPS.map((step, idx) => {
              const isPassed = idx <= currentStep;
              const isCurrent = idx === currentStep;

              return (
                <div key={step.status} className="flex flex-col items-center gap-2 relative z-10">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      isCurrent
                        ? 'bg-[#B86B3E] text-white ring-4 ring-[#F4EBE3] font-bold scale-110 shadow-sm'
                        : isPassed
                        ? 'bg-[#B86B3E]/80 text-white font-bold'
                        : 'bg-[#F4EBE3] text-[#A8A095]'
                    }`}
                  >
                    {step.icon}
                  </div>
                  <span
                    className={`text-[10px] font-bold ${
                      isPassed ? 'text-[#B86B3E]' : 'text-[#A8A095]'
                    }`}
                  >
                    {t(step.labelKey)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-[#EFE9E0] flex items-center justify-between text-xs">
            <span className="text-[#7E766D] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#B86B3E]" />
              {t('cookingTimePrefix')}:
            </span>
            <span className="font-bold text-[#24211D]">~12-15 {t('minutesShort')}</span>
          </div>
        </div>

        {/* Состав текущего заказа */}
        <div className="bg-white border border-[#EFE9E0] rounded-2xl p-4 space-y-2 shadow-sm">
          <h4 className="text-[11px] font-bold text-[#8C7A6B] uppercase tracking-wider">
            {language === 'en' ? 'Order items' : language === 'kg' ? 'Буйрутма курамы' : 'Состав заказа'} ({activeOrder.items.length} {t('itemsCount')})
          </h4>
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {activeOrder.items.map((item) => {
              const itemTitle = getLocalizedName(item.menuItem, language);
              return (
                <div
                  key={item.cartItemId}
                  className="flex items-center justify-between text-xs text-[#4A433B]"
                >
                  <div className="truncate pr-2">
                    <span className="font-bold text-[#B86B3E]">{item.quantity} × </span>
                    <span className="text-[#24211D] font-medium">{itemTitle}</span>
                  </div>
                  <span className="font-bold text-[#7E766D] shrink-0">
                    {item.unitPrice * item.quantity} {cafeInfo.currency}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-[#EFE9E0] flex justify-between text-xs font-bold">
            <span className="text-[#7E766D]">{t('total')}:</span>
            <span className="text-[#B86B3E] text-sm font-black">{activeOrder.finalAmount} {cafeInfo.currency}</span>
          </div>

          {/* Плашка статуса оплаты Кыргызстана и кнопка чека ЭККМ */}
          <div className="pt-2 border-t border-dashed border-[#EFE9E0] space-y-2">
            {activeOrder.status === 'paid' ? (
              <div className="flex items-center justify-between bg-[#EBF5ED] border border-[#2F6B42]/20 rounded-xl p-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#2F6B42]">
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>{t('statusPaid')} (ELQR / КР)</span>
                </div>
                <button
                  type="button"
                  onClick={() => openFiscalReceiptModal(activeOrder.id)}
                  className="text-[11px] font-bold text-[#2F6B42] hover:underline flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-[#2F6B42]/20 shadow-xs cursor-pointer"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>{t('orderReceipt')}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openPaymentModal(activeOrder.id)}
                  className="flex-1 bg-[#B86B3E] hover:bg-[#A3592E] text-white text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>{t('payOnline')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => openFiscalReceiptModal(activeOrder.id)}
                  className="bg-white hover:bg-[#F4EBE3] text-[#24211D] border border-[#EFE9E0] text-xs font-bold py-2 px-2.5 rounded-xl flex items-center gap-1 shadow-2xs cursor-pointer"
                  title={t('orderReceipt')}
                >
                  <Receipt className="w-3.5 h-3.5 text-[#B86B3E]" />
                  <span>{t('bill')}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Интерактивная оценка и отзыв */}
        <div className="bg-white border border-[#EFE9E0] rounded-2xl p-4 text-center space-y-2.5 shadow-sm">
          {reviewSent ? (
            <div className="py-2 text-center space-y-1">
              <Heart className="w-6 h-6 text-[#B83A4A] mx-auto fill-[#B83A4A] animate-pulse" />
              <h5 className="text-xs font-bold text-[#24211D]">
                {language === 'en' ? 'Thank you for your review!' : language === 'kg' ? 'Пикириңиз үчүн чоң рахмат!' : 'Спасибо за ваш отзыв!'}
              </h5>
              <p className="text-[11px] text-[#7E766D]">
                {language === 'en' ? 'We shared your warm feedback with our team ❤️' : language === 'kg' ? 'Сиздин жылуу сөзүңүз ашкана жамаатына жеткирилди ❤️' : 'Мы передали вашу благодарность команде кухни ❤️'}
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center gap-1 text-xs font-bold text-[#24211D]">
                <Sparkles className="w-3.5 h-3.5 text-[#B86B3E]" />
                <span>{language === 'en' ? 'Rate service & taste' : language === 'kg' ? 'Тейлөөнү жана даамды баалаңыз' : 'Оцените обслуживание и подачу'}</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 py-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 transition-transform hover:scale-125 cursor-pointer"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating
                          ? 'text-[#E5A93C] fill-[#E5A93C]'
                          : 'text-[#E8DDD2]'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={handleSendReview}
                className="text-xs font-bold text-[#24211D] hover:text-[#B86B3E] bg-[#F4EBE3] hover:bg-[#E8DDD2] px-4 py-1.5 rounded-xl transition-colors border border-[#E8DDD2] cursor-pointer"
              >
                {language === 'en' ? 'Send Review' : language === 'kg' ? 'Пикир жөнөтүү' : 'Отправить отзыв'}
              </button>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setActiveModal(null)}
          className="w-full py-3 rounded-2xl bg-[#24211D] hover:bg-[#3D3731] text-[#FBF9F5] font-bold text-xs transition-colors shadow-sm cursor-pointer"
        >
          {t('backToHall')}
        </button>
      </div>
    </div>
  );
}
