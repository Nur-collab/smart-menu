'use client';

import React, { useState, useMemo } from 'react';
import { useMenu } from '@/context/MenuContext';
import { getLocalizedName } from '@/lib/i18n';
import {
  X,
  Users,
  Divide,
  Receipt,
  QrCode,
  Check,
  CheckCircle2,
  Plus,
  Minus,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  UtensilsCrossed,
  Share2,
} from 'lucide-react';

interface SplitItemEntry {
  readonly id: string;
  readonly name: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly total: number;
  readonly optionsText?: string;
}

interface GuestItemAllocation {
  readonly guestId: string;
  readonly guestName: string;
  readonly isPaid: boolean;
  // itemId -> quantity (can be 0.5, 1, 2, etc.)
  readonly shares: Record<string, number>;
  readonly tipPercent: number;
}

export function SplitBillModal(): React.JSX.Element | null {
  const {
    activeModal,
    setActiveModal,
    tableNumber,
    cart,
    cartSubtotal,
    activeOrder,
    callWaiter,
    cafeInfo,
    language,
    t,
  } = useMenu();

  const [splitMode, setSplitMode] = useState<'equal' | 'items'>('equal');
  const [equalGuestCount, setEqualGuestCount] = useState<number>(3);
  const [equalTipPercent, setEqualTipPercent] = useState<number>(10);
  const [equalPaidMap, setEqualPaidMap] = useState<Record<number, boolean>>({});
  const [selectedGuestQr, setSelectedGuestQr] = useState<string | null>(null);
  const [waiterCalledNotice, setWaiterCalledNotice] = useState<boolean>(false);

  // By-Items State
  const [itemGuests, setItemGuests] = useState<readonly string[]>([
    'Гость 1',
    'Гость 2',
    'Гость 3',
  ]);
  const [activeGuestIdx, setActiveGuestIdx] = useState<number>(0);
  // guestIndex -> itemId -> quantity (e.g. 1 or 0.5)
  const [itemAllocations, setItemAllocations] = useState<Record<number, Record<string, number>>>({
    0: {},
    1: {},
    2: {},
  });
  const [itemGuestTips, setItemGuestTips] = useState<Record<number, number>>({
    0: 10,
    1: 10,
    2: 10,
  });
  const [itemGuestPaid, setItemGuestPaid] = useState<Record<number, boolean>>({});

  // 1. Resolve source items (active placed order takes priority, fallback to cart)
  const sourceItems: readonly SplitItemEntry[] = useMemo(() => {
    if (activeOrder && activeOrder.items.length > 0 && activeOrder.status !== 'paid') {
      return activeOrder.items.map((item, idx) => ({
        id: item.cartItemId || `order-item-${idx}`,
        name: getLocalizedName(item.menuItem, language),
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.unitPrice * item.quantity,
        optionsText: item.selectedOptions?.map((o) => o.optionName).join(', '),
      }));
    }
    return cart.map((item) => ({
      id: item.cartItemId,
      name: getLocalizedName(item.menuItem, language),
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.unitPrice * item.quantity,
      optionsText: item.selectedOptions?.map((o) => o.optionName).join(', '),
    }));
  }, [activeOrder, cart, language]);

  if (activeModal !== 'split') return null;

  const baseSubtotal = sourceItems.reduce((acc, i) => acc + i.total, 0);
  const serviceFeePercent = 10;
  const serviceFeeAmount = Math.round((baseSubtotal * serviceFeePercent) / 100);

  // Equal Mode Math (with exact remainder distribution)
  const equalTipAmount = Math.round((baseSubtotal * equalTipPercent) / 100);
  const equalTotalBill = baseSubtotal + serviceFeeAmount + equalTipAmount;
  const equalBaseShare = Math.floor(equalTotalBill / equalGuestCount);
  const equalRemainder = equalTotalBill % equalGuestCount;

  const equalGuestsList = Array.from({ length: equalGuestCount }, (_, idx) => {
    // Distribute remainder so sum strictly matches equalTotalBill
    const amount = idx < equalRemainder ? equalBaseShare + 1 : equalBaseShare;
    return {
      index: idx,
      id: `eq-guest-${idx + 1}`,
      name: `${language === 'en' ? 'Guest' : language === 'kg' ? 'Конок' : 'Гость'} ${idx + 1}`,
      amount,
      isPaid: Boolean(equalPaidMap[idx]),
    };
  });

  const allEqualPaid = equalGuestsList.every((g) => g.isPaid);

  // By-Items Math
  const getItemTotalAllocated = (itemId: string): number => {
    let sum = 0;
    Object.values(itemAllocations).forEach((guestMap) => {
      sum += guestMap[itemId] || 0;
    });
    return sum;
  };

  const getGuestSubtotal = (gIdx: number): number => {
    const guestMap = itemAllocations[gIdx] || {};
    let sub = 0;
    sourceItems.forEach((item) => {
      const share = guestMap[item.id] || 0;
      sub += share * item.unitPrice;
    });
    return Math.round(sub);
  };

  const currentGuestSubtotal = getGuestSubtotal(activeGuestIdx);
  const currentGuestServiceFee = Math.round((currentGuestSubtotal * serviceFeePercent) / 100);
  const currentGuestTipPercent = itemGuestTips[activeGuestIdx] ?? 10;
  const currentGuestTipAmount = Math.round((currentGuestSubtotal * currentGuestTipPercent) / 100);
  const currentGuestTotal = currentGuestSubtotal + currentGuestServiceFee + currentGuestTipAmount;

  // Total allocated across all guests in items mode
  const totalAllocatedSubtotal = itemGuests.reduce((acc, _, idx) => acc + getGuestSubtotal(idx), 0);
  const unallocatedAmount = Math.max(0, baseSubtotal - totalAllocatedSubtotal);

  // Modifiers for by-items
  const handleItemShareChange = (itemId: string, delta: number, maxQty: number): void => {
    const currentAllocated = getItemTotalAllocated(itemId);
    const guestCurrent = itemAllocations[activeGuestIdx]?.[itemId] || 0;
    const nextVal = Math.max(0, guestCurrent + delta);

    if (delta > 0 && currentAllocated + delta > maxQty) {
      return; // Can't allocate more than total item quantity
    }

    setItemAllocations((prev) => ({
      ...prev,
      [activeGuestIdx]: {
        ...(prev[activeGuestIdx] || {}),
        [itemId]: nextVal,
      },
    }));
  };

  const handleShareHalfItem = (itemId: string, maxQty: number): void => {
    const currentAllocated = getItemTotalAllocated(itemId);
    const guestCurrent = itemAllocations[activeGuestIdx]?.[itemId] || 0;

    if (guestCurrent > 0) {
      // Toggle off
      handleItemShareChange(itemId, -guestCurrent, maxQty);
    } else {
      if (currentAllocated + 0.5 <= maxQty) {
        handleItemShareChange(itemId, 0.5, maxQty);
      }
    }
  };

  const handleAddGuest = (): void => {
    if (itemGuests.length >= 8) return;
    const nextIdx = itemGuests.length;
    const nextName = `${language === 'en' ? 'Guest' : language === 'kg' ? 'Конок' : 'Гость'} ${nextIdx + 1}`;
    setItemGuests((prev) => [...prev, nextName]);
    setItemAllocations((prev) => ({ ...prev, [nextIdx]: {} }));
    setItemGuestTips((prev) => ({ ...prev, [nextIdx]: 10 }));
  };

  const handleCallWaiterForSplit = (): void => {
    callWaiter('bill');
    setWaiterCalledNotice(true);
    setTimeout(() => setWaiterCalledNotice(false), 4500);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
      onClick={() => setActiveModal(null)}
    >
      <div
        className="w-full max-w-lg bg-[#FBF9F5] dark:bg-[#18181B] border border-[#EFE9E0] dark:border-[#27272A] rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto animate-scaleUp relative text-[#24211D] dark:text-[#F4F4F5]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Кнопка закрытия */}
        <button
          type="button"
          onClick={() => setActiveModal(null)}
          className="absolute top-4 right-4 p-2 text-[#A8A095] dark:text-[#71717A] hover:text-[#24211D] dark:hover:text-[#F4F4F5] rounded-xl transition-colors cursor-pointer"
          title={t('close')}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Заголовок */}
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#B86B3E] dark:bg-[#E07A43] animate-pulse" />
            <span className="text-[10px] uppercase font-bold text-[#B86B3E] dark:text-[#E07A43] tracking-wider">
              {t('splitBillTitle')} • {t('tableNumberPrefix')}{tableNumber}
            </span>
          </div>
          <h3 className="text-lg font-black text-[#24211D] dark:text-[#F4F4F5] mt-0.5">
            {t('splitBillTitle')}
          </h3>
          <p className="text-xs text-[#7E766D] dark:text-[#A1A1AA] mt-0.5">
            {t('splitBillSubtitle')}
          </p>
        </div>

        {/* Индикатор источника чека */}
        <div className="bg-white dark:bg-[#1C1C1F] border border-[#EFE9E0] dark:border-[#27272A] rounded-2xl p-3 flex items-center justify-between text-xs shadow-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#F4EBE3] dark:bg-[#2C1810] text-[#B86B3E] dark:text-[#E07A43] flex items-center justify-center font-bold">
              №{tableNumber}
            </div>
            <div>
              <span className="font-bold text-[#24211D] dark:text-[#F4F4F5] block">
                {activeOrder ? `${language === 'en' ? 'Active Order' : 'Активный заказ столика'} #${activeOrder.id}` : (language === 'en' ? 'Cart order preview' : 'Текущая корзина столика')}
              </span>
              <span className="text-[11px] text-[#7E766D] dark:text-[#A1A1AA]">
                {sourceItems.length} {t('itemsCount')} • {t('splitServiceFeeNotice')}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-sm font-black text-[#B86B3E] dark:text-[#E07A43] block">
              {baseSubtotal + serviceFeeAmount} {cafeInfo.currency}
            </span>
            <span className="text-[10px] text-[#7E766D] dark:text-[#A1A1AA]">
              {language === 'en' ? 'with service' : 'с обслуживанием'}
            </span>
          </div>
        </div>

        {/* Переключатель режимов: Поровну / По позициям */}
        <div className="grid grid-cols-2 gap-2 bg-[#F4EBE3] dark:bg-[#27272A]/70 p-1 rounded-2xl border border-[#E8DDD2] dark:border-[#3F3F46]">
          <button
            type="button"
            onClick={() => setSplitMode('equal')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              splitMode === 'equal'
                ? 'bg-white dark:bg-[#18181B] text-[#24211D] dark:text-[#F4F4F5] shadow-sm'
                : 'text-[#7E766D] dark:text-[#A1A1AA] hover:text-[#24211D] dark:hover:text-[#F4F4F5]'
            }`}
          >
            <Divide className="w-4 h-4 text-[#B86B3E] dark:text-[#E07A43]" />
            <span>{t('splitModeEqual')}</span>
          </button>
          <button
            type="button"
            onClick={() => setSplitMode('items')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              splitMode === 'items'
                ? 'bg-white dark:bg-[#18181B] text-[#24211D] dark:text-[#F4F4F5] shadow-sm'
                : 'text-[#7E766D] dark:text-[#A1A1AA] hover:text-[#24211D] dark:hover:text-[#F4F4F5]'
            }`}
          >
            <Receipt className="w-4 h-4 text-[#B86B3E] dark:text-[#E07A43]" />
            <span>{t('splitModeByItems')}</span>
          </button>
        </div>

        {/* ---------------- РЕЖИМ 1: ПОРОВНУ НА ВСЕХ ---------------- */}
        {splitMode === 'equal' && (
          <div className="space-y-4">
            {/* Количество гостей */}
            <div className="bg-white dark:bg-[#1C1C1F] border border-[#EFE9E0] dark:border-[#27272A] rounded-2xl p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#24211D] dark:text-[#F4F4F5] flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#B86B3E] dark:text-[#E07A43]" />
                  <span>{t('splitGuestsCount')}</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEqualGuestCount((c) => Math.max(2, c - 1))}
                    disabled={equalGuestCount <= 2}
                    className="w-7 h-7 rounded-lg bg-[#FBF9F5] dark:bg-[#27272A] border border-[#EFE9E0] dark:border-[#3F3F46] flex items-center justify-center text-[#24211D] dark:text-[#F4F4F5] disabled:opacity-30 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-base font-black text-[#B86B3E] dark:text-[#E07A43] w-5 text-center">
                    {equalGuestCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEqualGuestCount((c) => Math.min(10, c + 1))}
                    disabled={equalGuestCount >= 10}
                    className="w-7 h-7 rounded-lg bg-[#FBF9F5] dark:bg-[#27272A] border border-[#EFE9E0] dark:border-[#3F3F46] flex items-center justify-center text-[#24211D] dark:text-[#F4F4F5] disabled:opacity-30 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Быстрые кнопки */}
              <div className="flex items-center gap-1.5">
                {[2, 3, 4, 5, 6, 8].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setEqualGuestCount(count)}
                    className={`flex-1 py-1 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      equalGuestCount === count
                        ? 'bg-[#B86B3E] text-white border-[#B86B3E] shadow-sm'
                        : 'bg-[#FBF9F5] dark:bg-[#27272A] text-[#7E766D] dark:text-[#A1A1AA] border-[#EFE9E0] dark:border-[#3F3F46] hover:border-[#DFD5C7]'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>

              {/* Чаевые для равного сплита */}
              <div className="pt-2 border-t border-[#EFE9E0] dark:border-[#27272A] flex items-center justify-between">
                <span className="text-xs text-[#7E766D] dark:text-[#A1A1AA] flex items-center gap-1">
                  <HeartHandshake className="w-3.5 h-3.5 text-[#B86B3E] dark:text-[#E07A43]" />
                  <span>{t('tipAmount')}:</span>
                </span>
                <div className="flex gap-1">
                  {[0, 5, 10, 15].map((percent) => (
                    <button
                      key={percent}
                      type="button"
                      onClick={() => setEqualTipPercent(percent)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                        equalTipPercent === percent
                          ? 'bg-[#B86B3E] text-white border-[#B86B3E]'
                          : 'bg-[#FBF9F5] dark:bg-[#27272A] text-[#7E766D] dark:text-[#A1A1AA] border-[#EFE9E0] dark:border-[#3F3F46]'
                      }`}
                    >
                      {percent}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Карточки долей гостей */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-[#8C7A6B] dark:text-[#A1A1AA] uppercase tracking-wider">
                <span>{language === 'en' ? 'Guest Shares' : 'Доли к оплате'} ({equalGuestsList.filter((g) => g.isPaid).length}/{equalGuestCount})</span>
                <span>{t('splitPerPerson')} ~{equalBaseShare} {cafeInfo.currency}</span>
              </div>

              {equalGuestsList.map((guest) => (
                <div
                  key={guest.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    guest.isPaid
                      ? 'bg-[#EBF5ED] dark:bg-[#062D15] border-[#D5EADB] dark:border-[#166534]'
                      : 'bg-white dark:bg-[#1C1C1F] border-[#EFE9E0] dark:border-[#27272A] shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                        guest.isPaid
                          ? 'bg-[#2F6B42] dark:bg-[#166534] text-white'
                          : 'bg-[#F4EBE3] dark:bg-[#2C1810] text-[#B86B3E] dark:text-[#E07A43]'
                      }`}
                    >
                      {guest.isPaid ? <Check className="w-4 h-4 stroke-[3]" /> : guest.index + 1}
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-[#24211D] dark:text-[#F4F4F5]">
                        {guest.name}
                      </h5>
                      <span className="text-xs font-black text-[#B86B3E] dark:text-[#E07A43]">
                        {guest.amount} {cafeInfo.currency}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedGuestQr(selectedGuestQr === guest.id ? null : guest.id)
                      }
                      className="p-2 text-[#24211D] dark:text-[#F4F4F5] bg-[#FBF9F5] dark:bg-[#27272A] hover:bg-[#F4EBE3] dark:hover:bg-[#3F3F46] border border-[#EFE9E0] dark:border-[#3F3F46] rounded-xl transition-colors cursor-pointer"
                      title="Показать персональный QR код (ELQR / MBANK)"
                    >
                      <QrCode className="w-4 h-4 text-[#2F6B42] dark:text-[#4ADE80]" />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setEqualPaidMap((prev) => ({
                          ...prev,
                          [guest.index]: !prev[guest.index],
                        }))
                      }
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        guest.isPaid
                          ? 'bg-[#2F6B42]/10 dark:bg-[#166534]/40 text-[#2F6B42] dark:text-[#4ADE80] border-[#2F6B42]/30 dark:border-[#166534]'
                          : 'bg-[#B86B3E] hover:bg-[#A3592E] text-white border-[#B86B3E]'
                      }`}
                    >
                      {guest.isPaid ? 'Оплачено ✓' : 'Отметить'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---------------- РЕЖИМ 2: ПО БЛЮДАМ / ПОЗИЦИЯМ ---------------- */}
        {splitMode === 'items' && (
          <div className="space-y-4">
            {/* Панель выбора текущего гостя */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#24211D] dark:text-[#F4F4F5]">
                <span>{language === 'en' ? 'Select Guest to assign dishes:' : 'Выберите гостя для распределения блюд:'}</span>
                <button
                  type="button"
                  onClick={handleAddGuest}
                  disabled={itemGuests.length >= 8}
                  className="inline-flex items-center gap-1 text-[11px] text-[#B86B3E] dark:text-[#E07A43] hover:underline cursor-pointer disabled:opacity-40"
                >
                  <Plus className="w-3 h-3" />
                  <span>{language === 'en' ? 'Add Guest' : '+ Гость'}</span>
                </button>
              </div>

              {/* Таблетки гостей */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {itemGuests.map((name, gIdx) => {
                  const gSub = getGuestSubtotal(gIdx);
                  const isCur = activeGuestIdx === gIdx;
                  return (
                    <button
                      key={gIdx}
                      type="button"
                      onClick={() => setActiveGuestIdx(gIdx)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border cursor-pointer ${
                        isCur
                          ? 'bg-[#B86B3E] text-white border-[#B86B3E] shadow-sm'
                          : 'bg-white dark:bg-[#1C1C1F] text-[#7E766D] dark:text-[#A1A1AA] border-[#EFE9E0] dark:border-[#27272A] hover:border-[#DFD5C7]'
                      }`}
                    >
                      <span>{name}</span>
                      <span className={`ml-1 text-[10px] ${isCur ? 'text-white/80' : 'text-[#B86B3E] dark:text-[#E07A43]'}`}>
                        ({gSub} {cafeInfo.currency})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Статус распределения счета */}
            <div className={`p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between border ${
              unallocatedAmount === 0
                ? 'bg-[#EBF5ED] dark:bg-[#062D15] text-[#2F6B42] dark:text-[#4ADE80] border-[#D5EADB] dark:border-[#166534]'
                : 'bg-[#FFF8F2] dark:bg-[#2C1810]/70 text-[#B86B3E] dark:text-[#E07A43] border-[#F2DECE] dark:border-[#442316]'
            }`}>
              <span className="flex items-center gap-1.5">
                {unallocatedAmount === 0 ? <CheckCircle2 className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                <span>{unallocatedAmount === 0 ? t('splitAllAllocated') : `${t('splitUnallocated')}: ${unallocatedAmount} ${cafeInfo.currency}`}</span>
              </span>
              <span className="text-[11px] font-mono">
                {totalAllocatedSubtotal} / {baseSubtotal} {cafeInfo.currency}
              </span>
            </div>

            {/* Список блюд для привязки к текущему гостю */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {sourceItems.map((item) => {
                const totalAlloc = getItemTotalAllocated(item.id);
                const guestPortion = itemAllocations[activeGuestIdx]?.[item.id] || 0;
                const isFullyAllocated = totalAlloc >= item.quantity;

                return (
                  <div
                    key={item.id}
                    className="p-3 bg-white dark:bg-[#1C1C1F] border border-[#EFE9E0] dark:border-[#27272A] rounded-2xl flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#24211D] dark:text-[#F4F4F5] truncate">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-[#A8A095] dark:text-[#71717A]">
                          (всего {item.quantity} шт)
                        </span>
                      </div>
                      <div className="text-[11px] text-[#B86B3E] dark:text-[#E07A43] font-bold">
                        {item.unitPrice} {cafeInfo.currency}
                      </div>

                      {/* Индикатор долей */}
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-[#7E766D] dark:text-[#A1A1AA]">
                        <span>Распределено: <strong>{totalAlloc} / {item.quantity}</strong></span>
                        {item.quantity === 1 && (
                          <button
                            type="button"
                            onClick={() => handleShareHalfItem(item.id, item.quantity)}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition-colors cursor-pointer ${
                              guestPortion === 0.5
                                ? 'bg-[#B86B3E] text-white border-[#B86B3E]'
                                : 'bg-[#FBF9F5] dark:bg-[#27272A] text-[#7E766D] dark:text-[#A1A1AA] border-[#EFE9E0] dark:border-[#3F3F46]'
                            }`}
                            title="Разделить порцию пополам с другим гостем"
                          >
                            {t('splitShareHalf')}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Счётчик долей для активного гостя */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleItemShareChange(item.id, -1, item.quantity)}
                        disabled={guestPortion <= 0}
                        className="w-7 h-7 rounded-lg bg-[#FBF9F5] dark:bg-[#27272A] border border-[#EFE9E0] dark:border-[#3F3F46] flex items-center justify-center text-[#24211D] dark:text-[#F4F4F5] disabled:opacity-30 cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-black text-[#24211D] dark:text-[#F4F4F5] w-6 text-center">
                        {guestPortion}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleItemShareChange(item.id, 1, item.quantity)}
                        disabled={isFullyAllocated}
                        className="w-7 h-7 rounded-lg bg-[#FBF9F5] dark:bg-[#27272A] border border-[#EFE9E0] dark:border-[#3F3F46] flex items-center justify-center text-[#24211D] dark:text-[#F4F4F5] disabled:opacity-30 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Карточка расчета для активного гостя */}
            <div className="bg-[#FAF6F0] dark:bg-[#1E1B18] border border-[#EFE9E0] dark:border-[#2E2822] rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-[#24211D] dark:text-[#F4F4F5]">
                <span>{itemGuests[activeGuestIdx]} — {t('splitMyShare')}:</span>
                <span className="text-base font-black text-[#B86B3E] dark:text-[#E07A43]">
                  {currentGuestTotal} {cafeInfo.currency}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-[#7E766D] dark:text-[#A1A1AA] pt-1 border-t border-[#EFE9E0] dark:border-[#2E2822]">
                <div>Блюда: <strong className="text-[#24211D] dark:text-[#F4F4F5]">{currentGuestSubtotal} {cafeInfo.currency}</strong></div>
                <div>Сервис (10%): <strong className="text-[#24211D] dark:text-[#F4F4F5]">+{currentGuestServiceFee} {cafeInfo.currency}</strong></div>
              </div>

              {/* Чаевые */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-[#7E766D] dark:text-[#A1A1AA] flex items-center gap-1">
                  <HeartHandshake className="w-3.5 h-3.5 text-[#B86B3E] dark:text-[#E07A43]" />
                  <span>Чаевые:</span>
                </span>
                <div className="flex gap-1">
                  {[0, 5, 10, 15].map((percent) => (
                    <button
                      key={percent}
                      type="button"
                      onClick={() =>
                        setItemGuestTips((prev) => ({
                          ...prev,
                          [activeGuestIdx]: percent,
                        }))
                      }
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border cursor-pointer ${
                        currentGuestTipPercent === percent
                          ? 'bg-[#B86B3E] text-white border-[#B86B3E]'
                          : 'bg-white dark:bg-[#27272A] text-[#7E766D] dark:text-[#A1A1AA] border-[#EFE9E0] dark:border-[#3F3F46]'
                      }`}
                    >
                      {percent}%
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedGuestQr(
                      selectedGuestQr === `item-guest-${activeGuestIdx}`
                        ? null
                        : `item-guest-${activeGuestIdx}`
                    )
                  }
                  className="flex-1 bg-white dark:bg-[#18181B] hover:bg-[#F4EBE3] dark:hover:bg-[#27272A] text-[#24211D] dark:text-[#F4F4F5] border border-[#EFE9E0] dark:border-[#27272A] py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <QrCode className="w-4 h-4 text-[#2F6B42] dark:text-[#4ADE80]" />
                  <span>Показать мой QR к оплате</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setItemGuestPaid((prev) => ({
                      ...prev,
                      [activeGuestIdx]: !prev[activeGuestIdx],
                    }))
                  }
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    itemGuestPaid[activeGuestIdx]
                      ? 'bg-[#2F6B42] text-white border-[#2F6B42]'
                      : 'bg-[#B86B3E] hover:bg-[#A3592E] text-white border-[#B86B3E]'
                  }`}
                >
                  {itemGuestPaid[activeGuestIdx] ? 'Оплачено ✓' : 'Отметить'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* QR-контейнер для оплаты доли (ELQR / MBANK) */}
        {selectedGuestQr && (
          <div className="bg-white dark:bg-[#1C1C1F] border border-[#EFE9E0] dark:border-[#27272A] rounded-2xl p-4 text-center space-y-2 shadow-md animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-[#EFE9E0] dark:border-[#27272A]">
              <span className="text-xs font-bold text-[#24211D] dark:text-[#F4F4F5] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#2F6B42] dark:text-[#4ADE80]" />
                <span>Национальный ELQR НБКР • Столик №{tableNumber}</span>
              </span>
              <button
                type="button"
                onClick={() => setSelectedGuestQr(null)}
                className="text-xs text-[#7E766D] hover:text-[#24211D] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="w-44 h-44 bg-white rounded-2xl mx-auto flex flex-col items-center justify-center p-3 border-2 border-dashed border-[#B86B3E] shadow-xs">
              <QrCode className="w-24 h-24 text-[#24211D]" />
              <div className="mt-1.5 text-center">
                <span className="text-[10px] font-mono text-[#8C7A6B] block">Стол №{tableNumber} • Сплит</span>
                <span className="text-xs font-black text-[#B86B3E]">
                  {splitMode === 'equal' ? equalBaseShare : currentGuestTotal} {cafeInfo.currency}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-[#7E766D] dark:text-[#A1A1AA] leading-relaxed">
              Отсканируйте камерой смартфона в любом банковском приложении Кыргызстана (MBANK, О!Деньги, Optima, Demir, Бакай, Halyk).
            </p>
          </div>
        )}

        {/* Уведомление о вызове официанта */}
        {waiterCalledNotice && (
          <div className="bg-[#EBF5ED] dark:bg-[#062D15] border border-[#D5EADB] dark:border-[#166534] text-[#2F6B42] dark:text-[#4ADE80] text-xs font-bold p-3 rounded-2xl flex items-center gap-2 animate-fadeIn shadow-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Официант уведомлен о раздельном счете за столиком №{tableNumber}!</span>
          </div>
        )}

        {/* Нижние действия */}
        <div className="pt-1 space-y-2">
          <button
            type="button"
            onClick={handleCallWaiterForSplit}
            className="w-full bg-[#B86B3E] hover:bg-[#A3592E] active:scale-95 text-white font-bold text-xs sm:text-sm py-3.5 px-4 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Receipt className="w-4 h-4" />
            <span>{t('splitAskWaiterBill')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModal(null)}
            className="w-full py-2.5 text-xs font-bold text-[#7E766D] dark:text-[#A1A1AA] hover:text-[#24211D] dark:hover:text-[#F4F4F5] transition-colors cursor-pointer text-center"
          >
            {language === 'en' ? 'Back to menu' : 'Вернуться к меню'}
          </button>
        </div>
      </div>
    </div>
  );
}
