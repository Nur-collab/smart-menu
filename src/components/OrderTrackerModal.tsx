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

interface StatusStep {
  readonly status: OrderStatus;
  readonly label: string;
  readonly icon: React.ReactNode;
}

const STATUS_STEPS: readonly StatusStep[] = [
  {
    status: 'pending',
    label: 'Принят',
    icon: <Clock className="w-4 h-4" />,
  },
  {
    status: 'cooking',
    label: 'Готовится',
    icon: <ChefHat className="w-4 h-4" />,
  },
  {
    status: 'ready',
    label: 'Готов',
    icon: <BellRing className="w-4 h-4" />,
  },
  {
    status: 'served',
    label: 'Подан',
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
          className="absolute top-4 right-4 p-1.5 text-[#A8A095] hover:text-[#24211D] transition-colors"
          title="Закрыть"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Заголовок заказа */}
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2F6B42] animate-pulse" />
            <span className="text-[10px] uppercase font-bold text-[#2F6B42] tracking-wider">
              Заказ #{activeOrder.id}
            </span>
          </div>
          <h3 className="text-lg font-black text-[#24211D] mt-0.5">
            Готовим для столика №{activeOrder.tableNumber}
          </h3>
          <p className="text-xs text-[#7E766D] mt-0.5">
            Шеф уже приступил к приготовлению ваших блюд
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
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-[#EFE9E0] flex items-center justify-between text-xs">
            <span className="text-[#7E766D] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#B86B3E]" />
              Примерное время подачи:
            </span>
            <span className="font-bold text-[#24211D]">~12-15 минут</span>
          </div>
        </div>

        {/* Состав текущего заказа */}
        <div className="bg-white border border-[#EFE9E0] rounded-2xl p-4 space-y-2 shadow-sm">
          <h4 className="text-[11px] font-bold text-[#8C7A6B] uppercase tracking-wider">
            Состав заказа ({activeOrder.items.length} поз.)
          </h4>
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {activeOrder.items.map((item) => (
              <div
                key={item.cartItemId}
                className="flex items-center justify-between text-xs text-[#4A433B]"
              >
                <div className="truncate pr-2">
                  <span className="font-bold text-[#B86B3E]">{item.quantity} × </span>
                  <span className="text-[#24211D] font-medium">{item.menuItem.name}</span>
                </div>
                <span className="font-bold text-[#7E766D] shrink-0">
                  {item.unitPrice * item.quantity} {cafeInfo.currency}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-[#EFE9E0] flex justify-between text-xs font-bold">
            <span className="text-[#7E766D]">Сумма к оплате:</span>
            <span className="text-[#B86B3E] text-sm font-black">{activeOrder.finalAmount} {cafeInfo.currency}</span>
          </div>

          {/* Плашка статуса оплаты Кыргызстана и кнопка чека ЭККМ */}
          <div className="pt-2 border-t border-dashed border-[#EFE9E0] space-y-2">
            {activeOrder.status === 'paid' ? (
              <div className="flex items-center justify-between bg-[#EBF5ED] border border-[#2F6B42]/20 rounded-xl p-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#2F6B42]">
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>Оплачено онлайн (КР)</span>
                </div>
                <button
                  type="button"
                  onClick={() => openFiscalReceiptModal(activeOrder.id)}
                  className="text-[11px] font-bold text-[#2F6B42] hover:underline flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-[#2F6B42]/20 shadow-xs"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Чек ЭККМ</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openPaymentModal(activeOrder.id)}
                  className="flex-1 bg-[#B86B3E] hover:bg-[#A3592E] text-white text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Оплатить через ELQR / MBANK</span>
                </button>
                <button
                  type="button"
                  onClick={() => openFiscalReceiptModal(activeOrder.id)}
                  className="bg-white hover:bg-[#F4EBE3] text-[#24211D] border border-[#EFE9E0] text-xs font-bold py-2 px-2.5 rounded-xl flex items-center gap-1 shadow-2xs"
                  title="Посмотреть чек"
                >
                  <Receipt className="w-3.5 h-3.5 text-[#B86B3E]" />
                  <span>Чек</span>
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
              <h5 className="text-xs font-bold text-[#24211D]">Спасибо за ваш отзыв!</h5>
              <p className="text-[11px] text-[#7E766D]">
                Мы передали вашу благодарность команде кухни ❤️
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center gap-1 text-xs font-bold text-[#24211D]">
                <Sparkles className="w-3.5 h-3.5 text-[#B86B3E]" />
                <span>Оцените обслуживание и подачу</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 py-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 transition-transform hover:scale-125"
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
                className="text-xs font-bold text-[#24211D] hover:text-[#B86B3E] bg-[#F4EBE3] hover:bg-[#E8DDD2] px-4 py-1.5 rounded-xl transition-colors border border-[#E8DDD2]"
              >
                Отправить отзыв
              </button>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setActiveModal(null)}
          className="w-full py-3 rounded-2xl bg-[#24211D] hover:bg-[#3D3731] text-[#FBF9F5] font-bold text-xs transition-colors shadow-sm"
        >
          Вернуться к меню
        </button>
      </div>
    </div>
  );
}
