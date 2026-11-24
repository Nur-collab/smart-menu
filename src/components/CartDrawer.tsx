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
  ChefHat,
} from 'lucide-react';
import { getSmartUpsellRecommendations } from '@/lib/upsellEngine';
import { getLocalizedName } from '@/lib/i18n';

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
    language,
    getItemPriceWithDiscount,
  } = useMenu();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('waiter_qr');
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
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end animate-fadeIn"
      onClick={() => setActiveModal(null)}
    >
      <div
        className="w-full sm:max-w-md bg-[#FBF9F5] dark:bg-[#18181B] border-l border-[#EFE9E0] dark:border-[#27272A] h-full flex flex-col shadow-2xl animate-slideLeft text-[#24211D] dark:text-[#F4F4F5]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Шапка корзины */}
        <div className="p-4 bg-white dark:bg-[#18181B] border-b border-[#EFE9E0] dark:border-[#27272A] flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-[#24211D] dark:text-[#F4F4F5] flex items-center gap-2">
              <span>{t('yourOrder')}</span>
              <span className="text-xs bg-[#F4EBE3] dark:bg-[#27201C] text-[#B86B3E] dark:text-[#E07A43] border border-[#E8DDD2] dark:border-[#3D3028] px-2.5 py-0.5 rounded-full font-bold">
                {t('tableNumberPrefix')}{tableNumber}
              </span>
            </h2>
            <span className="text-xs text-[#7E766D] dark:text-[#A1A1AA]">
              {cart.length === 0
                ? t('emptyCart')
                : `${cart.reduce((acc, i) => acc + i.quantity, 0)} ${t('itemsCount')}`}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="p-2 text-[#A8A095] dark:text-[#71717A] hover:text-[#B83A4A] dark:hover:text-[#F87171] transition-colors cursor-pointer"
                title={t('clearCartTitle')}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="p-2 text-[#7E766D] dark:text-[#A1A1AA] hover:text-[#24211D] dark:hover:text-[#F4F4F5] transition-colors cursor-pointer"
              title={t('close')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Список блюд в корзине */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#A8A095] dark:text-[#71717A] space-y-3">
              <div className="w-16 h-16 rounded-full bg-white dark:bg-[#1C1C1F] border border-[#EFE9E0] dark:border-[#27272A] flex items-center justify-center text-xl shadow-sm">
                🍽️
              </div>
              <h3 className="text-[#24211D] dark:text-[#F4F4F5] font-bold text-sm">{t('emptyCart')}</h3>
              <p className="text-xs text-[#7E766D] dark:text-[#A1A1AA] max-w-xs leading-relaxed">
                {t('emptyCartSubtitle')}
              </p>
            </div>
          ) : (
            <>
              {cart.map((item) => {
                const itemLocalizedTitle = getLocalizedName(item.menuItem, language);
                return (
                  <div
                    key={item.cartItemId}
                    className="bg-white dark:bg-[#1C1C1F] border border-[#EFE9E0] dark:border-[#27272A] rounded-2xl p-3.5 flex gap-3 items-center justify-between shadow-[0_1px_6px_rgba(40,30,20,0.02)]"
                  >
                    <img
                      src={item.menuItem.imageUrl}
                      alt={itemLocalizedTitle}
                      className="w-14 h-14 rounded-xl object-cover shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-[#24211D] dark:text-[#F4F4F5] truncate">
                        {itemLocalizedTitle}
                      </h4>

                      {Boolean(item.selectedOptions && item.selectedOptions.length > 0) && (
                        <div className="text-[11px] text-[#B86B3E] dark:text-[#E07A43] font-medium leading-tight mt-0.5">
                          {item.selectedOptions?.map((o) => o.optionName).join(', ')}
                        </div>
                      )}

                      {item.comment && (
                        <div className="text-[10px] text-[#8C7A6B] dark:text-[#A8988B] italic mt-0.5 truncate">
                          «{item.comment}»
                        </div>
                      )}

                      <div className="text-xs font-black text-[#24211D] dark:text-[#F4F4F5] mt-1">
                        {item.unitPrice * item.quantity} {cafeInfo.currency}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 bg-[#FBF9F5] dark:bg-[#27272A] border border-[#EFE9E0] dark:border-[#3F3F46] rounded-xl p-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateCartItemQuantity(item.cartItemId, -1)}
                        className="w-6 h-6 flex items-center justify-center text-[#7E766D] dark:text-[#A1A1AA] hover:text-[#24211D] dark:hover:text-[#F4F4F5] cursor-pointer"
                        title="-"
                      >
                        <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                      <span className="w-4 text-center text-xs font-black text-[#24211D] dark:text-[#F4F4F5]">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCartItemQuantity(item.cartItemId, 1)}
                        className="w-6 h-6 flex items-center justify-center text-[#7E766D] dark:text-[#A1A1AA] hover:text-[#24211D] dark:hover:text-[#F4F4F5] cursor-pointer"
                        title="+"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeCartItem(item.cartItemId)}
                        className="w-6 h-6 flex items-center justify-center text-[#A8A095] dark:text-[#71717A] hover:text-[#B83A4A] dark:hover:text-[#F87171] ml-0.5 cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Умный апсейл шеф-повара (Smart Upsell Engine) */}
              {upsellRecommendations.length > 0 && (
                <div className="bg-white dark:bg-[#1C1C1F] border border-[#EFE9E0] dark:border-[#27272A] rounded-2xl p-3.5 space-y-2.5 shadow-sm mt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#8C7A6B] dark:text-[#A1A1AA] uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#B86B3E] dark:text-[#E07A43]" />
                      <span>{t('upsellTitle')}</span>
                    </span>
                    <span className="text-[10px] text-[#2F6B42] dark:text-[#34D399] font-semibold">
                      {t('perfectPair')}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {upsellRecommendations.map((recItem) => {
                      const priceInfo = getItemPriceWithDiscount(recItem);
                      const recLocalizedTitle = getLocalizedName(recItem, language);
                      return (
                        <div
                          key={recItem.id}
                          className="flex items-center justify-between gap-2.5 p-2 rounded-xl bg-[#FBF9F5] dark:bg-[#27272A] border border-[#EFE9E0] dark:border-[#3F3F46] hover:border-[#DFD5C7] dark:hover:border-[#52525B] transition-all"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={recItem.imageUrl}
                              alt={recLocalizedTitle}
                              className="w-10 h-10 rounded-lg object-cover bg-[#F4EBE3] dark:bg-[#18181B] shrink-0"
                            />
                            <div className="min-w-0">
                              <h5 className="text-xs font-bold text-[#24211D] dark:text-[#F4F4F5] truncate leading-tight">
                                {recLocalizedTitle}
                              </h5>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-xs font-black text-[#2F6B42] dark:text-[#34D399]">
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
                            title={t('addToCart')}
                          >
                            <Plus className="w-3 h-3 stroke-[3]" />
                            <span>{t('addToCart')}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Программа лояльности: Списание бонусов */}
              <div className="bg-[#F4EBE3]/70 dark:bg-[#27201C]/70 border border-[#E8DDD2] dark:border-[#3D3028] rounded-2xl p-4 mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#B86B3E] dark:text-[#E07A43]">
                    <Sparkles className="w-3.5 h-3.5 text-[#B86B3E] dark:text-[#E07A43]" />
                    <span>Aura Club</span>
                  </div>
                  <span className="text-xs text-[#7E766D] dark:text-[#A1A1AA]">
                    {language === 'en' ? 'Balance' : 'Баланс'}: <strong className="text-[#24211D] dark:text-[#F4F4F5]">{userBonusBalance} {cafeInfo.currency}</strong>
                  </span>
                </div>
                <p className="text-[11px] text-[#7E766D] dark:text-[#A1A1AA]">
                  {language === 'en' ? 'You can pay up to 30% of your bill with bonus points.' : language === 'kg' ? 'Сиз эсепти 30% чейин топтолгон бонустар менен төлөй аласыз.' : 'Вы можете оплатить до 30% счета накопленными бонусами.'}
                </p>
                <button
                  type="button"
                  onClick={() => setUseBonuses(!useBonuses)}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border cursor-pointer ${
                    useBonuses
                      ? 'bg-[#B86B3E] text-white border-[#B86B3E] shadow-sm'
                      : 'bg-white dark:bg-[#1C1C1F] text-[#B86B3E] dark:text-[#E07A43] border-[#E8DDD2] dark:border-[#3D3028] hover:border-[#B86B3E]'
                  }`}
                >
                  {useBonuses ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>{t('bonusDiscount')}: {maxBonusDiscount}</span>
                    </>
                  ) : (
                    <span>{t('bonusDiscount')}: {maxBonusDiscount}</span>
                  )}
                </button>
              </div>

              {/* Чаевые официанту */}
              <div className="bg-white dark:bg-[#1C1C1F] border border-[#EFE9E0] dark:border-[#27272A] rounded-2xl p-4 space-y-2.5 shadow-sm">
                <div className="flex items-center justify-between text-xs font-semibold text-[#24211D] dark:text-[#F4F4F5]">
                  <span className="flex items-center gap-1.5">
                    <HeartHandshake className="w-3.5 h-3.5 text-[#B86B3E] dark:text-[#E07A43]" />
                    <span>{t('tipAmount')}</span>
                  </span>
                  <span className="text-[#B86B3E] dark:text-[#E07A43] font-black">{tipAmount} {cafeInfo.currency}</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 5, 10, 15].map((percent) => (
                    <button
                      key={percent}
                      type="button"
                      onClick={() => setTipPercent(percent)}
                      className={`py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        tipPercent === percent
                          ? 'bg-[#B86B3E] text-white border-[#B86B3E] shadow-sm'
                          : 'bg-[#FBF9F5] dark:bg-[#27272A] text-[#7E766D] dark:text-[#A1A1AA] border-[#EFE9E0] dark:border-[#3F3F46] hover:border-[#DFD5C7]'
                      }`}
                    >
                      {percent === 0 ? '0%' : `${percent}%`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Информация об оплате официанту */}
              <div className="bg-[#FAF6F0] dark:bg-[#1E1B18] border border-[#EFE9E0] dark:border-[#2E2822] rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white dark:bg-[#27201C] border border-[#E8DDD2] dark:border-[#3D3028] flex items-center justify-center text-[#B86B3E] dark:text-[#E07A43] shadow-2xs shrink-0 mt-0.5">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[#24211D] dark:text-[#F4F4F5]">
                      {t('paymentToWaiter')}
                    </h5>
                    <p className="text-[11px] text-[#7E766D] dark:text-[#A1A1AA] leading-relaxed mt-0.5">
                      {t('paymentToWaiterDesc')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 pt-2 border-t border-[#EFE9E0] dark:border-[#2E2822] text-[10px] text-[#8C7A6B] dark:text-[#A8988B] flex-wrap">
                  <span className="bg-white dark:bg-[#27201C] px-2 py-0.5 rounded-md border border-[#E8DDD2] dark:border-[#3D3028] font-semibold text-[#2F6B42] dark:text-[#34D399]">ELQR НБКР</span>
                  <span className="bg-white dark:bg-[#27201C] px-2 py-0.5 rounded-md border border-[#E8DDD2] dark:border-[#3D3028] font-semibold text-[#B86B3E] dark:text-[#E07A43]">MBANK QR</span>
                  <span className="bg-white dark:bg-[#27201C] px-2 py-0.5 rounded-md border border-[#E8DDD2] dark:border-[#3D3028] font-semibold text-[#B84232] dark:text-[#F87171]">О!Деньги</span>
                  <span className="bg-white dark:bg-[#27201C] px-2 py-0.5 rounded-md border border-[#E8DDD2] dark:border-[#3D3028] font-semibold text-[#356BB3] dark:text-[#60A5FA]">Элкарт / Visa</span>
                  <span className="bg-white dark:bg-[#27201C] px-2 py-0.5 rounded-md border border-[#E8DDD2] dark:border-[#3D3028] font-semibold text-[#7E766D] dark:text-[#A1A1AA]">Наличные</span>
                </div>
              </div>

              {/* Общий комментарий к заказу */}
              <div>
                <input
                  type="text"
                  value={orderComment}
                  onChange={(e) => setOrderComment(e.target.value)}
                  placeholder={language === 'en' ? 'Order comment (napkins, allergy note...)' : language === 'kg' ? 'Буйрутмага комментарий (аспаптар, салфеткалар...)' : 'Комментарий к заказу (приборы на 3 персоны...)'}
                  className="w-full bg-white dark:bg-[#1C1C1F] border border-[#EFE9E0] dark:border-[#27272A] rounded-2xl px-3.5 py-2.5 text-xs text-[#24211D] dark:text-[#F4F4F5] placeholder-[#A8A095] dark:placeholder-[#71717A] outline-none focus:border-[#B86B3E] dark:focus:border-[#E07A43] transition-all"
                />
              </div>
            </>
          )}
        </div>

        {/* Фиксированный подвал с чеком */}
        {cart.length > 0 && (
          <div className="p-4 bg-white dark:bg-[#18181B] border-t border-[#EFE9E0] dark:border-[#27272A] space-y-3 shadow-[0_-2px_10px_rgba(40,30,20,0.03)]">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-[#7E766D] dark:text-[#A1A1AA]">
                <span>{t('subtotal')}:</span>
                <span className="text-[#24211D] dark:text-[#F4F4F5] font-bold">{cartSubtotal} {cafeInfo.currency}</span>
              </div>
              {appliedDiscount > 0 && (
                <div className="flex justify-between text-[#B86B3E] dark:text-[#E07A43] font-medium">
                  <span>{t('bonusDiscount')}:</span>
                  <span>-{appliedDiscount} {cafeInfo.currency}</span>
                </div>
              )}
              {tipAmount > 0 && (
                <div className="flex justify-between text-[#7E766D] dark:text-[#A1A1AA] font-medium">
                  <span>{t('tipAmount')} ({tipPercent}%):</span>
                  <span>+{tipAmount} {cafeInfo.currency}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-[#24211D] dark:text-[#F4F4F5] pt-2 border-t border-[#EFE9E0] dark:border-[#27272A]">
                <span>{t('total')}:</span>
                <span className="text-[#B86B3E] dark:text-[#E07A43] text-lg">{finalTotal} {cafeInfo.currency}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveModal('split')}
                className="flex-1 bg-white dark:bg-[#27272A] hover:bg-[#F4EBE3] dark:hover:bg-[#3F3F46] text-[#B86B3E] dark:text-[#E07A43] border border-[#E8DDD2] dark:border-[#3D3028] font-bold text-xs py-3.5 px-3 rounded-2xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                title={t('paySplit')}
              >
                <Users className="w-4 h-4" />
                <span>{t('paySplit')}</span>
              </button>

              <button
                type="button"
                onClick={handleCheckout}
                className="flex-[1.5] bg-[#B86B3E] hover:bg-[#A3592E] active:scale-95 text-white font-bold text-sm py-3.5 px-4 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ChefHat className="w-4 h-4 stroke-[2.5]" />
                <span>{t('sendToKitchen')}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
