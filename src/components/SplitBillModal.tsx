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
  Copy,
  Smartphone,
  Wallet,
} from 'lucide-react';

interface SplitItemEntry {
  readonly id: string;
  readonly name: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly total: number;
  readonly optionsText?: string;
}

export function SplitBillModal(): React.JSX.Element | null {
  const {
    activeModal,
    setActiveModal,
    tableNumber,
    cart,
    activeOrder,
    callWaiter,
    cafeInfo,
    language,
    t,
  } = useMenu();

  const [splitMode, setSplitMode] = useState<'equal' | 'items'>('items');
  const [equalGuestCount, setEqualGuestCount] = useState<number>(3);
  const [equalTipPercent, setEqualTipPercent] = useState<number>(10);
  const [equalPaidMap, setEqualPaidMap] = useState<Record<number, boolean>>({});
  const [selectedGuestQr, setSelectedGuestQr] = useState<string | null>(null);
  const [waiterCalledNotice, setWaiterCalledNotice] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  const cashierPhoneNumber = '+996 (555) 12-34-56';

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

  const baseSubtotal = sourceItems.reduce((acc, i) => acc + i.total, 0);
  const serviceFeePercent = 10;
  const serviceFeeAmount = Math.round((baseSubtotal * serviceFeePercent) / 100);

  // Equal Mode Math (with exact remainder distribution)
  const equalTipAmount = Math.round((baseSubtotal * equalTipPercent) / 100);
  const equalTotalBill = baseSubtotal + serviceFeeAmount + equalTipAmount;
  const equalBaseShare = Math.floor(equalTotalBill / equalGuestCount);
  const equalRemainder = equalTotalBill % equalGuestCount;

  const equalGuestsList = Array.from({ length: equalGuestCount }, (_, idx) => {
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

  // Assigned items list for active guest
  const assignedItemsForActiveGuest = useMemo(() => {
    const guestMap = itemAllocations[activeGuestIdx] || {};
    return sourceItems
      .map((item) => {
        const share = guestMap[item.id] || 0;
        if (share <= 0) return null;
        return {
          ...item,
          share,
          shareTotal: Math.round(share * item.unitPrice),
        };
      })
      .filter((i): i is NonNullable<typeof i> => i !== null);
  }, [sourceItems, itemAllocations, activeGuestIdx]);

  const handleCopy = (text: string, id: string): void => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleItemShareChange = (itemId: string, delta: number, maxQty: number): void => {
    const currentAllocated = getItemTotalAllocated(itemId);
    const guestCurrent = itemAllocations[activeGuestIdx]?.[itemId] || 0;
    const nextVal = Math.max(0, guestCurrent + delta);

    if (delta > 0 && currentAllocated + delta > maxQty) {
      return;
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

  if (activeModal !== 'split') return null;

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
                {activeOrder ? 'Заказ на столе' : 'Предварительный чек (корзина)'}
              </span>
              <span className="text-[10px] text-[#A8A095] dark:text-[#71717A]">
                {sourceItems.length} поз. • {t('splitServiceFeeNotice')}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-[#A8A095] dark:text-[#71717A] block">
              Итого за стол:
            </span>
            <span className="text-sm font-black text-[#B86B3E] dark:text-[#E07A43]">
              {baseSubtotal + serviceFeeAmount} {cafeInfo.currency}
            </span>
          </div>
        </div>

        {/* Переключатель режимов */}
        <div className="grid grid-cols-2 gap-2 bg-[#F4EBE3] dark:bg-[#27272A] p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setSplitMode('items')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              splitMode === 'items'
                ? 'bg-white dark:bg-[#18181B] text-[#B86B3E] dark:text-[#E07A43] shadow-xs'
                : 'text-[#7E766D] dark:text-[#A1A1AA] hover:text-[#24211D] dark:hover:text-[#F4F4F5]'
            }`}
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>{t('splitModeByItems')}</span>
          </button>
          <button
            type="button"
            onClick={() => setSplitMode('equal')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              splitMode === 'equal'
                ? 'bg-white dark:bg-[#18181B] text-[#B86B3E] dark:text-[#E07A43] shadow-xs'
                : 'text-[#7E766D] dark:text-[#A1A1AA] hover:text-[#24211D] dark:hover:text-[#F4F4F5]'
            }`}
          >
            <Divide className="w-3.5 h-3.5" />
            <span>{t('splitModeEqual')}</span>
          </button>
        </div>

        {/* ---------------- РЕЖИМ 1: ПО ПОЗИЦИЯМ (БЛЮДАМ) ---------------- */}
        {splitMode === 'items' && (
          <div className="space-y-4">
            {/* Панель выбора текущего гостя */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#24211D] dark:text-[#F4F4F5]">
                <span>{language === 'en' ? 'Select Guest to assign dishes:' : 'Выберите гостя для распределения блюд:'}</span>
                {itemGuests.length < 8 && (
                  <button
                    type="button"
                    onClick={handleAddGuest}
                    className="text-[11px] text-[#B86B3E] dark:text-[#E07A43] hover:underline flex items-center gap-0.5 font-bold cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{language === 'en' ? 'Add Guest' : '+ Гость'}</span>
                  </button>
                )}
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

            {/* Список всех блюд заказа для распределения */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
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

            {/* ПЕРСОНАЛЬНЫЙ ЧЕК АКТИВНОГО ГОСТЯ (НА СКОЛЬКО ОН СЪЕЛ) */}
            <div className="bg-[#FAF6F0] dark:bg-[#1E1B18] border-2 border-[#EFE9E0] dark:border-[#2E2822] rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-[#EFE9E0] dark:border-[#2E2822]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#B86B3E] text-white flex items-center justify-center text-xs font-bold">
                    {activeGuestIdx + 1}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-[#24211D] dark:text-[#F4F4F5]">
                      {itemGuests[activeGuestIdx]} • {t('splitGuestDishes')}
                    </h4>
                    <span className="text-[10px] text-[#8C7A6B] dark:text-[#A1A1AA]">
                      {assignedItemsForActiveGuest.length} блюд(а) выбрано
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-[#8C7A6B] dark:text-[#A1A1AA] block">
                    {t('splitTotalToTransfer')}:
                  </span>
                  <span className="text-lg font-black text-[#B86B3E] dark:text-[#E07A43]">
                    {currentGuestTotal} {cafeInfo.currency}
                  </span>
                </div>
              </div>

              {/* Детализация выбранных блюд */}
              {assignedItemsForActiveGuest.length === 0 ? (
                <div className="p-3 bg-white/70 dark:bg-[#27272A]/50 rounded-xl text-center text-xs text-[#7E766D] dark:text-[#A1A1AA] border border-dashed border-[#EFE9E0] dark:border-[#3F3F46]">
                  {t('splitNoItemsYet')}
                </div>
              ) : (
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {assignedItemsForActiveGuest.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white/60 dark:bg-[#27272A]/40 border border-[#EFE9E0]/60 dark:border-[#3F3F46]/50"
                    >
                      <div className="min-w-0 flex-1 truncate pr-2 text-[#24211D] dark:text-[#F4F4F5]">
                        <span>{item.name}</span>
                        <span className="ml-1 text-[10px] font-bold text-[#B86B3E] dark:text-[#E07A43]">
                          × {item.share === 0.5 ? '½' : item.share}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-[#24211D] dark:text-[#F4F4F5] shrink-0 font-mono">
                        {item.shareTotal} {cafeInfo.currency}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Расчет: Блюда + Сервис 10% + Чаевые */}
              <div className="grid grid-cols-2 gap-2 text-[11px] text-[#7E766D] dark:text-[#A1A1AA] pt-2 border-t border-[#EFE9E0] dark:border-[#2E2822]">
                <div>Сумма блюд: <strong className="text-[#24211D] dark:text-[#F4F4F5]">{currentGuestSubtotal} {cafeInfo.currency}</strong></div>
                <div>Сервис 10%: <strong className="text-[#24211D] dark:text-[#F4F4F5]">+{currentGuestServiceFee} {cafeInfo.currency}</strong></div>
              </div>

              {/* Выбор чаевых официанту */}
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

              {/* Кнопки перевода кассиру для активного гостя */}
              <div className="pt-2 flex flex-wrap sm:flex-nowrap items-center gap-2">
                {/* Скопировать точную сумму */}
                <button
                  type="button"
                  onClick={() => handleCopy(currentGuestTotal.toString(), `item-${activeGuestIdx}`)}
                  className="flex-1 bg-white dark:bg-[#18181B] hover:bg-[#F4EBE3] dark:hover:bg-[#27272A] text-[#24211D] dark:text-[#F4F4F5] border border-[#EFE9E0] dark:border-[#27272A] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  title="Скопировать сумму в буфер обмена для вставки в приложение банка"
                >
                  {copiedId === `item-${activeGuestIdx}` ? (
                    <>
                      <Check className="w-4 h-4 text-[#2F6B42] dark:text-[#4ADE80]" />
                      <span className="text-[#2F6B42] dark:text-[#4ADE80]">{t('splitCopied')}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-[#B86B3E] dark:text-[#E07A43]" />
                      <span>{t('splitCopyAmount')} ({currentGuestTotal} {cafeInfo.currency})</span>
                    </>
                  )}
                </button>

                {/* QR кассира */}
                <button
                  type="button"
                  onClick={() =>
                    setSelectedGuestQr(
                      selectedGuestQr === `item-guest-${activeGuestIdx}`
                        ? null
                        : `item-guest-${activeGuestIdx}`
                    )
                  }
                  className="p-2.5 bg-white dark:bg-[#18181B] hover:bg-[#F4EBE3] dark:hover:bg-[#27272A] text-[#24211D] dark:text-[#F4F4F5] border border-[#EFE9E0] dark:border-[#27272A] rounded-xl transition-all cursor-pointer shadow-2xs"
                  title={t('splitCashierQr')}
                >
                  <QrCode className="w-4 h-4 text-[#2F6B42] dark:text-[#4ADE80]" />
                </button>

                {/* Отметить: Перевел кассиру */}
                <button
                  type="button"
                  onClick={() =>
                    setItemGuestPaid((prev) => ({
                      ...prev,
                      [activeGuestIdx]: !prev[activeGuestIdx],
                    }))
                  }
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer shrink-0 ${
                    itemGuestPaid[activeGuestIdx]
                      ? 'bg-[#2F6B42] text-white border-[#2F6B42]'
                      : 'bg-[#B86B3E] hover:bg-[#A3592E] text-white border-[#B86B3E]'
                  }`}
                >
                  {itemGuestPaid[activeGuestIdx] ? t('splitMarkPaidCashier') : 'Отметить перевод'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ---------------- РЕЖИМ 2: ПОРОBНУ НА ВСЕХ ---------------- */}
        {splitMode === 'equal' && (
          <div className="space-y-4">
            {/* Количество гостей */}
            <div className="bg-white dark:bg-[#1C1C1F] border border-[#EFE9E0] dark:border-[#27272A] rounded-2xl p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold text-[#24211D] dark:text-[#F4F4F5]">
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#B86B3E] dark:text-[#E07A43]" />
                  <span>{t('splitGuestsCount')}</span>
                </span>
                <span className="text-base font-black text-[#B86B3E] dark:text-[#E07A43]">
                  {equalGuestCount} {language === 'en' ? 'guests' : language === 'kg' ? 'конок' : 'персоны'}
                </span>
              </div>

              {/* Кнопки выбора количества гостей */}
              <div className="flex items-center justify-between gap-1.5">
                <button
                  type="button"
                  onClick={() => setEqualGuestCount((prev) => Math.max(2, prev - 1))}
                  className="w-10 h-10 rounded-xl bg-[#FBF9F5] dark:bg-[#27272A] border border-[#EFE9E0] dark:border-[#3F3F46] flex items-center justify-center text-[#24211D] dark:text-[#F4F4F5] hover:bg-[#F4EBE3] dark:hover:bg-[#3F3F46] cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1 overflow-x-auto py-1">
                  {[2, 3, 4, 5, 6, 8].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setEqualGuestCount(count)}
                      className={`w-9 h-9 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        equalGuestCount === count
                          ? 'bg-[#B86B3E] text-white border-[#B86B3E] shadow-xs'
                          : 'bg-[#FBF9F5] dark:bg-[#27272A] text-[#7E766D] dark:text-[#A1A1AA] border-[#EFE9E0] dark:border-[#3F3F46]'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setEqualGuestCount((prev) => Math.min(10, prev + 1))}
                  className="w-10 h-10 rounded-xl bg-[#FBF9F5] dark:bg-[#27272A] border border-[#EFE9E0] dark:border-[#3F3F46] flex items-center justify-center text-[#24211D] dark:text-[#F4F4F5] hover:bg-[#F4EBE3] dark:hover:bg-[#3F3F46] cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Чаевые */}
              <div className="flex items-center justify-between pt-2 border-t border-[#EFE9E0] dark:border-[#27272A]">
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
                    {/* Кнопка скопировать сумму */}
                    <button
                      type="button"
                      onClick={() => handleCopy(guest.amount.toString(), guest.id)}
                      className="p-2 text-[#24211D] dark:text-[#F4F4F5] bg-[#FBF9F5] dark:bg-[#27272A] hover:bg-[#F4EBE3] dark:hover:bg-[#3F3F46] border border-[#EFE9E0] dark:border-[#3F3F46] rounded-xl transition-colors cursor-pointer"
                      title="Скопировать сумму в буфер обмена"
                    >
                      {copiedId === guest.id ? (
                        <Check className="w-4 h-4 text-[#2F6B42] dark:text-[#4ADE80]" />
                      ) : (
                        <Copy className="w-4 h-4 text-[#B86B3E] dark:text-[#E07A43]" />
                      )}
                    </button>

                    {/* Кнопка QR кассира */}
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedGuestQr(selectedGuestQr === guest.id ? null : guest.id)
                      }
                      className="p-2 text-[#24211D] dark:text-[#F4F4F5] bg-[#FBF9F5] dark:bg-[#27272A] hover:bg-[#F4EBE3] dark:hover:bg-[#3F3F46] border border-[#EFE9E0] dark:border-[#3F3F46] rounded-xl transition-colors cursor-pointer"
                      title={t('splitCashierQr')}
                    >
                      <QrCode className="w-4 h-4 text-[#2F6B42] dark:text-[#4ADE80]" />
                    </button>

                    {/* Отметить: Перевел кассиру */}
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
                      {guest.isPaid ? t('splitMarkPaidCashier') : 'Отметить'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---------------- ВИДЖЕТ: QR-КОД И РЕКВИЗИТЫ КАССИРА ДЛЯ ПЕРЕВОДА ---------------- */}
        {selectedGuestQr && (
          <div className="bg-white dark:bg-[#1C1C1F] border-2 border-[#B86B3E] dark:border-[#E07A43] rounded-2xl p-4 text-center space-y-3 shadow-lg animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-[#EFE9E0] dark:border-[#27272A]">
              <span className="text-xs font-bold text-[#24211D] dark:text-[#F4F4F5] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#2F6B42] dark:text-[#4ADE80]" />
                <span>Оплата кассиру • Столик №{tableNumber}</span>
              </span>
              <button
                type="button"
                onClick={() => setSelectedGuestQr(null)}
                className="text-xs text-[#7E766D] hover:text-[#24211D] cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* QR код заведения / кассы */}
            <div className="w-44 h-44 bg-white rounded-2xl mx-auto flex flex-col items-center justify-center p-3 border-2 border-dashed border-[#B86B3E] shadow-xs">
              <QrCode className="w-24 h-24 text-[#24211D]" />
              <div className="mt-1.5 text-center">
                <span className="text-[10px] font-mono text-[#8C7A6B] block">Касса заведения • Стол №{tableNumber}</span>
                <span className="text-sm font-black text-[#B86B3E]">
                  {splitMode === 'equal' ? equalBaseShare : currentGuestTotal} {cafeInfo.currency}
                </span>
              </div>
            </div>

            {/* Номер телефона кассы для прямого перевода */}
            <div className="bg-[#FAF6F0] dark:bg-[#27272A] p-2.5 rounded-xl border border-[#EFE9E0] dark:border-[#3F3F46] flex items-center justify-between text-xs">
              <div className="text-left">
                <span className="text-[10px] text-[#7E766D] dark:text-[#A1A1AA] block">
                  {t('splitCashierMbank')}
                </span>
                <span className="font-mono font-bold text-[#24211D] dark:text-[#F4F4F5]">
                  {cashierPhoneNumber}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(cashierPhoneNumber, 'cashier-phone')}
                className="px-2 py-1 rounded-lg bg-white dark:bg-[#18181B] text-[#B86B3E] dark:text-[#E07A43] border border-[#EFE9E0] dark:border-[#3F3F46] text-[10px] font-bold flex items-center gap-1 cursor-pointer"
              >
                {copiedId === 'cashier-phone' ? (
                  <>
                    <Check className="w-3 h-3 text-[#2F6B42]" />
                    <span>Скопировано</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Копировать</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-[#7E766D] dark:text-[#A1A1AA] leading-relaxed">
              Отсканируйте камерой смартфона в приложении банка (MBANK, О!Деньги, Optima, Demir, Бакай, Halyk) или переведите кассиру ровно{' '}
              <strong className="text-[#24211D] dark:text-[#F4F4F5]">
                {splitMode === 'equal' ? equalBaseShare : currentGuestTotal} {cafeInfo.currency}
              </strong>.
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
