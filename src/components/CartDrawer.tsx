'use client';

import React, { useState } from 'react';
import { useMenu } from '@/context/MenuContext';
import { PaymentMethod } from '@/types/menu';
import {
  X,
  Trash2,
  Plus,
  Minus,
  QrCode,
  CreditCard,
  Banknote,
  Users,
  Sparkles,
  HeartHandshake,
  Check,
  Smartphone,
} from 'lucide-react';
import { getSmartUpsellRecommendations } from '@/lib/upsellEngine';

export function CartDrawer(): React.JSX.Element | null {
  const {
    activeModal,
    setActiveModal,
    cart,
    tableNumber,
    cartSubtotal,
    updateCartItemQuantity,
    removeCartItem,
    clearCart,
    submitOrder,
    userBonusBalance,
    cafeInfo,
    items,
    addToCart,
    t,
    getItemPriceWithDiscount,
  } = useMenu();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('elqr');
  const [tipPercent, setTipPercent] = useState<number>(10);
  const [useBonuses, setUseBonuses] = useState<boolean>(false);
  const [orderComment, setOrderComment] = useState<string>('');

  const upsellRecommendations = getSmartUpsellRecommendations(cart, items);

  if (activeModal !== 'cart') return null;

  const maxBonusDiscount = Math.min(userBonusBalance, Math.round(cartSubtotal * 0.3));
  const appliedDiscount = useBonuses ? maxBonusDiscount : 0;
  const tipAmount = Math.round((cartSubtotal * tipPercent) / 100);
  const finalTotal = Math.max(0, cartSubtotal - appliedDiscount + tipAmount);

  const handleCheckout = (): void => {
    if (cart.length === 0) return;

    if (paymentMethod === 'split') {
      setActiveModal('split');
      return;
    }

    submitOrder({
      paymentMethod,
      tipAmount,
      discountAmount: appliedDiscount,
      comment: orderComment.trim() || undefined,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-[#24211D]/60 backdrop-blur-sm flex justify-end animate-fadeIn"
      onClick={() => setActiveModal(null)}
    >
      <div
        className="w-full sm:max-w-md bg-[#FBF9F5] border-l border-[#EFE9E0] h-full flex flex-col shadow-2xl animate-slideLeft"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Шапка корзины */}
        <div className="p-4 bg-white border-b border-[#EFE9E0] flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-[#24211D] flex items-center gap-2">
              <span>Ваш заказ</span>
              <span className="text-xs bg-[#F4EBE3] text-[#B86B3E] border border-[#E8DDD2] px-2.5 py-0.5 rounded-full font-bold">
                Столик №{tableNumber}
              </span>
            </h2>
            <span className="text-xs text-[#7E766D]">
              {cart.length === 0
                ? 'Корзина пуста'
                : `${cart.reduce((acc, i) => acc + i.quantity, 0)} поз.`}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="p-2 text-[#A8A095] hover:text-[#B83A4A] transition-colors"
                title="Очистить корзину"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="p-2 text-[#7E766D] hover:text-[#24211D] transition-colors"
              title="Закрыть"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Список блюд в корзине */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#A8A095] space-y-3">
              <div className="w-16 h-16 rounded-full bg-white border border-[#EFE9E0] flex items-center justify-center text-xl shadow-sm">
                🍽️
              </div>
              <h3 className="text-[#24211D] font-bold text-sm">В корзине пока пусто</h3>
              <p className="text-xs text-[#7E766D] max-w-xs">
                Выберите вкусные блюда и напитки из меню, чтобы оформить заказ со столика.
              </p>
            </div>
          ) : (
            <>
              {cart.map((item) => (
                <div
                  key={item.cartItemId}
                  className="bg-white border border-[#EFE9E0] rounded-2xl p-3.5 flex gap-3 items-center justify-between shadow-[0_1px_6px_rgba(40,30,20,0.02)]"
                >
                  <img
                    src={item.menuItem.imageUrl}
                    alt={item.menuItem.name}
                    className="w-14 h-14 rounded-xl object-cover shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-[#24211D] truncate">
                      {item.menuItem?.name || 'Позиция'}
                    </h4>

                    {Boolean(item.selectedOptions && item.selectedOptions.length > 0) && (
                      <div className="text-[11px] text-[#B86B3E] font-medium leading-tight mt-0.5">
                        {item.selectedOptions?.map((o) => o.optionName).join(', ')}
                      </div>
                    )}

                    {item.comment && (
                      <div className="text-[10px] text-[#8C7A6B] italic mt-0.5 truncate">
                        «{item.comment}»
                      </div>
                    )}

                    <div className="text-xs font-black text-[#24211D] mt-1">
                      {item.unitPrice * item.quantity} {cafeInfo.currency}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 bg-[#FBF9F5] border border-[#EFE9E0] rounded-xl p-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateCartItemQuantity(item.cartItemId, -1)}
                      className="w-6 h-6 flex items-center justify-center text-[#7E766D] hover:text-[#24211D]"
                      title="Уменьшить"
                    >
                      <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                    <span className="w-4 text-center text-xs font-black text-[#24211D]">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateCartItemQuantity(item.cartItemId, 1)}
                      className="w-6 h-6 flex items-center justify-center text-[#7E766D] hover:text-[#24211D]"
                      title="Увеличить"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeCartItem(item.cartItemId)}
                      className="w-6 h-6 flex items-center justify-center text-[#A8A095] hover:text-[#B83A4A] ml-0.5"
                      title="Удалить позицию"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Умный апсейл шеф-повара (Smart Upsell Engine) */}
              {upsellRecommendations.length > 0 && (
                <div className="bg-white border border-[#EFE9E0] rounded-2xl p-3.5 space-y-2.5 shadow-sm mt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#8C7A6B] uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#B86B3E]" />
                      <span>{t('upsellTitle')}</span>
                    </span>
                    <span className="text-[10px] text-[#2F6B42] font-semibold">
                      Идеальная пара
                    </span>
                  </div>

                  <div className="space-y-2">
                    {upsellRecommendations.map((recItem) => {
                      const priceInfo = getItemPriceWithDiscount(recItem);
                      return (
                        <div
                          key={recItem.id}
                          className="flex items-center justify-between gap-2.5 p-2 rounded-xl bg-[#FBF9F5] border border-[#EFE9E0] hover:border-[#DFD5C7] transition-all"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={recItem.imageUrl}
                              alt={recItem.name}
                              className="w-10 h-10 rounded-lg object-cover bg-[#F4EBE3] shrink-0"
                            />
                            <div className="min-w-0">
                              <h5 className="text-xs font-bold text-[#24211D] truncate leading-tight">
                                {recItem.name}
                              </h5>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-xs font-black text-[#2F6B42]">
                                  {priceInfo.currentPrice} {cafeInfo.currency}
                                </span>
                                {priceInfo.isHappyHoursDiscount && (
                                  <span className="text-[10px] text-[#E39666] font-bold">
                                    -20%
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => addToCart(recItem)}
                            className="bg-[#B86B3E] hover:bg-[#A3592E] active:scale-95 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-xs transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                            title="Добавить блюдо к заказу"
                          >
                            <Plus className="w-3 h-3 stroke-[3]" />
                            <span>Добавить</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Программа лояльности: Списание бонусов */}
              <div className="bg-[#F4EBE3]/70 border border-[#E8DDD2] rounded-2xl p-4 mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#B86B3E]">
                    <Sparkles className="w-3.5 h-3.5 text-[#B86B3E]" />
                    <span>Бонусы Aura Club</span>
                  </div>
                  <span className="text-xs text-[#7E766D]">
                    Баланс: <strong className="text-[#24211D]">{userBonusBalance} {cafeInfo.currency}</strong>
                  </span>
                </div>
                <p className="text-[11px] text-[#7E766D]">
                  Вы можете оплатить до 30% счета накопленными бонусами.
                </p>
                <button
                  type="button"
                  onClick={() => setUseBonuses(!useBonuses)}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border ${
                    useBonuses
                      ? 'bg-[#B86B3E] text-white border-[#B86B3E] shadow-sm'
                      : 'bg-white text-[#B86B3E] border-[#E8DDD2] hover:border-[#B86B3E]'
                  }`}
                >
                  {useBonuses ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Списано {maxBonusDiscount} бонусов</span>
                    </>
                  ) : (
                    <span>Списать {maxBonusDiscount} бонусов</span>
                  )}
                </button>
              </div>

              {/* Чаевые официанту */}
              <div className="bg-white border border-[#EFE9E0] rounded-2xl p-4 space-y-2.5 shadow-sm">
                <div className="flex items-center justify-between text-xs font-semibold text-[#24211D]">
                  <span className="flex items-center gap-1.5">
                    <HeartHandshake className="w-3.5 h-3.5 text-[#B86B3E]" />
                    <span>Чаевые официанту</span>
                  </span>
                  <span className="text-[#B86B3E] font-black">{tipAmount} {cafeInfo.currency}</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 5, 10, 15].map((percent) => (
                    <button
                      key={percent}
                      type="button"
                      onClick={() => setTipPercent(percent)}
                      className={`py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        tipPercent === percent
                          ? 'bg-[#B86B3E] text-white border-[#B86B3E] shadow-sm'
                          : 'bg-[#FBF9F5] text-[#7E766D] border-[#EFE9E0] hover:border-[#DFD5C7]'
                      }`}
                    >
                      {percent === 0 ? '0%' : `${percent}%`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Способ оплаты для Кыргызстана */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-[#8C7A6B] uppercase tracking-wider block">
                    Способ оплаты (Кыргызстан)
                  </label>
                  <span className="text-[10px] text-[#2F6B42] font-semibold bg-[#EBF5ED] px-2 py-0.5 rounded-full">
                    ELQR / Банки КР
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('elqr')}
                    className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-all ${
                      paymentMethod === 'elqr'
                        ? 'bg-[#EBF5ED] border-[#2F6B42] text-[#2F6B42] shadow-sm'
                        : 'bg-white border-[#EFE9E0] text-[#7E766D] hover:border-[#DFD5C7]'
                    }`}
                  >
                    <QrCode className="w-4 h-4 text-[#2F6B42]" />
                    <div className="text-left">
                      <span className="block leading-tight">ELQR КР</span>
                      <span className="text-[9px] font-normal text-[#7E766D] block">Все банки КР</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('mbank')}
                    className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-all ${
                      paymentMethod === 'mbank'
                        ? 'bg-[#F4EBE3] border-[#B86B3E] text-[#B86B3E] shadow-sm'
                        : 'bg-white border-[#EFE9E0] text-[#7E766D] hover:border-[#DFD5C7]'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-[#B86B3E]" />
                    <div className="text-left">
                      <span className="block leading-tight">MBANK QR</span>
                      <span className="text-[9px] font-normal text-[#7E766D] block">Приложение MBANK</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('odengi')}
                    className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-all ${
                      paymentMethod === 'odengi'
                        ? 'bg-[#FDF0ED] border-[#B84232] text-[#B84232] shadow-sm'
                        : 'bg-white border-[#EFE9E0] text-[#7E766D] hover:border-[#DFD5C7]'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-[#B84232]" />
                    <div className="text-left">
                      <span className="block leading-tight">О!Деньги</span>
                      <span className="text-[9px] font-normal text-[#7E766D] block">Мой О! кошелек</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card_to_waiter')}
                    className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-all ${
                      paymentMethod === 'card_to_waiter'
                        ? 'bg-[#EDF3FA] border-[#356BB3] text-[#356BB3] shadow-sm'
                        : 'bg-white border-[#EFE9E0] text-[#7E766D] hover:border-[#DFD5C7]'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-[#356BB3]" />
                    <div className="text-left">
                      <span className="block leading-tight">Терминал</span>
                      <span className="text-[9px] font-normal text-[#7E766D] block">Элкарт / Visa</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-all ${
                      paymentMethod === 'cash'
                        ? 'bg-[#F4EBE3] border-[#B86B3E] text-[#B86B3E] shadow-sm'
                        : 'bg-white border-[#EFE9E0] text-[#7E766D] hover:border-[#DFD5C7]'
                    }`}
                  >
                    <Banknote className="w-4 h-4 text-[#B86B3E]" />
                    <div className="text-left">
                      <span className="block leading-tight">Наличные</span>
                      <span className="text-[9px] font-normal text-[#7E766D] block">Официанту</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('split')}
                    className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-all ${
                      paymentMethod === 'split'
                        ? 'bg-[#F2EBF5] border-[#7A4B85] text-[#7A4B85] shadow-sm'
                        : 'bg-white border-[#EFE9E0] text-[#7E766D] hover:border-[#DFD5C7]'
                    }`}
                  >
                    <Users className="w-4 h-4 text-[#7A4B85]" />
                    <div className="text-left">
                      <span className="block leading-tight">Сплит-чек</span>
                      <span className="text-[9px] font-normal text-[#7E766D] block">Разделить на всех</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Общий комментарий к заказу */}
              <div>
                <input
                  type="text"
                  value={orderComment}
                  onChange={(e) => setOrderComment(e.target.value)}
                  placeholder="Комментарий к заказу (приборы на 3 персоны...)"
                  className="w-full bg-white border border-[#EFE9E0] rounded-2xl px-3.5 py-2.5 text-xs text-[#24211D] placeholder-[#A8A095] outline-none focus:border-[#B86B3E] transition-all"
                />
              </div>
            </>
          )}
        </div>

        {/* Фиксированный подвал с чеком */}
        {cart.length > 0 && (
          <div className="p-4 bg-white border-t border-[#EFE9E0] space-y-3 shadow-[0_-2px_10px_rgba(40,30,20,0.03)]">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-[#7E766D]">
                <span>Блюда и напитки:</span>
                <span className="text-[#24211D] font-bold">{cartSubtotal} {cafeInfo.currency}</span>
              </div>
              {appliedDiscount > 0 && (
                <div className="flex justify-between text-[#B86B3E] font-medium">
                  <span>Скидка бонусами:</span>
                  <span>-{appliedDiscount} {cafeInfo.currency}</span>
                </div>
              )}
              {tipAmount > 0 && (
                <div className="flex justify-between text-[#7E766D] font-medium">
                  <span>Чаевые ({tipPercent}%):</span>
                  <span>+{tipAmount} {cafeInfo.currency}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-[#24211D] pt-2 border-t border-[#EFE9E0]">
                <span>Итого к оплате:</span>
                <span className="text-[#B86B3E] text-lg">{finalTotal} {cafeInfo.currency}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCheckout}
              className="w-full bg-[#B86B3E] hover:bg-[#A3592E] active:scale-95 text-white font-bold text-sm py-3 px-4 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              {paymentMethod === 'split' ? (
                <>
                  <Users className="w-4 h-4" />
                  <span>Перейти к разделению счета</span>
                </>
              ) : (
                <>
                  <QrCode className="w-4 h-4" />
                  <span>Отправить заказ на кухню</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
