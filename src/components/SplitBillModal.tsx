'use client';

import React, { useState } from 'react';
import { useMenu } from '@/context/MenuContext';
import {
  X,
  Users,
  Divide,
  QrCode,
  Check,
  CheckCircle2,
  Receipt,
  UserCheck,
} from 'lucide-react';

interface GuestState {
  readonly id: string;
  readonly name: string;
  readonly isPaid: boolean;
}

export function SplitBillModal(): React.JSX.Element | null {
  const {
    activeModal,
    setActiveModal,
    tableNumber,
    cartSubtotal,
    submitOrder,
    cafeInfo,
  } = useMenu();

  const [splitMode, setSplitMode] = useState<'equal' | 'custom'>('equal');
  const [guestCount, setGuestCount] = useState<number>(2);
  const [guests, setGuests] = useState<readonly GuestState[]>([
    { id: 'g-1', name: 'Гость 1', isPaid: true },
    { id: 'g-2', name: 'Гость 2', isPaid: false },
  ]);
  const [showQrForGuest, setShowQrForGuest] = useState<string | null>(null);

  if (activeModal !== 'split') return null;

  const totalBill = cartSubtotal;
  const amountPerPerson = Math.ceil(totalBill / guestCount);

  const handleGuestCountChange = (newCount: number): void => {
    if (newCount < 2 || newCount > 8) return;
    setGuestCount(newCount);

    const updatedGuests: GuestState[] = [];
    for (let i = 1; i <= newCount; i += 1) {
      const existing = guests.find((g) => g.id === `g-${i}`);
      updatedGuests.push(
        existing ?? {
          id: `g-${i}`,
          name: `Гость ${i}`,
          isPaid: false,
        }
      );
    }
    setGuests(updatedGuests);
  };

  const handleToggleGuestPaid = (guestId: string): void => {
    setGuests((prev) =>
      prev.map((g) => (g.id === guestId ? { ...g, isPaid: !g.isPaid } : g))
    );
  };

  const allPaid = guests.every((g) => g.isPaid);

  const handleFinishSplitOrder = (): void => {
    submitOrder({
      paymentMethod: 'split',
      tipAmount: 0,
      discountAmount: 0,
      comment: `Раздельный счет на ${guestCount} персон.`,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-[#24211D]/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
      onClick={() => setActiveModal(null)}
    >
      <div
        className="w-full max-w-md bg-[#FBF9F5] border border-[#EFE9E0] rounded-3xl p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto animate-scaleUp relative"
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

        <div>
          <span className="text-[10px] uppercase font-bold text-[#7A4B85] tracking-wider flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> Сплит-калькулятор
          </span>
          <h3 className="text-base font-black text-[#24211D] mt-0.5">
            Разделение счета за столиком №{tableNumber}
          </h3>
          <p className="text-xs text-[#7E766D] mt-1">
            Сумма заказа:{' '}
            <strong className="text-[#B86B3E] font-black">{totalBill} {cafeInfo.currency}</strong>.
            Каждый гость может оплатить свою долю по ELQR или MBANK.
          </p>
        </div>

        {/* Выбор режима разделения */}
        <div className="grid grid-cols-2 gap-2 bg-[#F4EBE3]/80 p-1 rounded-2xl border border-[#E8DDD2]">
          <button
            type="button"
            onClick={() => setSplitMode('equal')}
            className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              splitMode === 'equal'
                ? 'bg-white text-[#24211D] shadow-sm'
                : 'text-[#7E766D] hover:text-[#24211D]'
            }`}
          >
            <Divide className="w-3.5 h-3.5 text-[#B86B3E]" />
            <span>Поровну на всех</span>
          </button>
          <button
            type="button"
            onClick={() => setSplitMode('custom')}
            className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              splitMode === 'custom'
                ? 'bg-white text-[#24211D] shadow-sm'
                : 'text-[#7E766D] hover:text-[#24211D]'
            }`}
          >
            <Receipt className="w-3.5 h-3.5 text-[#B86B3E]" />
            <span>По позициям</span>
          </button>
        </div>

        {/* Настройка количества гостей */}
        <div className="bg-white border border-[#EFE9E0] rounded-2xl p-4 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#24211D]">
            <span className="text-[#7E766D]">Количество персон за столом:</span>
            <span className="font-black text-[#B86B3E] text-sm">{guestCount}</span>
          </div>
          <div className="flex items-center gap-2">
            {[2, 3, 4, 5, 6].map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => handleGuestCountChange(count)}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  guestCount === count
                    ? 'bg-[#B86B3E] text-white border-[#B86B3E] shadow-sm'
                    : 'bg-[#FBF9F5] text-[#7E766D] border-[#EFE9E0] hover:border-[#DFD5C7]'
                }`}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        {/* Список долей гостей */}
        <div className="space-y-2">
          <h4 className="text-[11px] font-bold text-[#8C7A6B] uppercase tracking-wider">
            Статус оплаты каждого гостя
          </h4>

          {guests.map((guest) => (
            <div
              key={guest.id}
              className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                guest.isPaid
                  ? 'bg-[#EBF5ED] border-[#D5EADB]'
                  : 'bg-white border-[#EFE9E0] shadow-sm'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold ${
                    guest.isPaid
                      ? 'bg-[#2F6B42] text-white'
                      : 'bg-[#F4EBE3] text-[#7E766D]'
                  }`}
                >
                  {guest.isPaid ? <Check className="w-4 h-4 stroke-[3]" /> : guest.name[6]}
                </div>
                <div>
                  <h5 className="text-xs font-bold text-[#24211D]">{guest.name}</h5>
                  <span className="text-[11px] text-[#B86B3E] font-bold">
                    {amountPerPerson} {cafeInfo.currency}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {!guest.isPaid && (
                  <button
                    type="button"
                    onClick={() =>
                      setShowQrForGuest(showQrForGuest === guest.id ? null : guest.id)
                    }
                    className="p-1.5 text-[#24211D] bg-[#FBF9F5] hover:bg-[#F4EBE3] border border-[#EFE9E0] rounded-xl transition-colors"
                    title="Показать ELQR для гостя"
                  >
                    <QrCode className="w-4 h-4 text-[#2F6B42]" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleToggleGuestPaid(guest.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    guest.isPaid
                      ? 'bg-[#2F6B42]/10 text-[#2F6B42] border-[#2F6B42]/30'
                      : 'bg-[#24211D] text-white border-[#24211D] hover:bg-[#B86B3E] hover:border-[#B86B3E]'
                  }`}
                >
                  {guest.isPaid ? 'Оплачено ✓' : 'Отметить оплату'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* QR-код ELQR для оплаты гостем */}
        {showQrForGuest && (
          <div className="bg-white border border-[#EFE9E0] rounded-2xl p-4 text-center space-y-2 shadow-sm">
            <h5 className="text-xs font-bold text-[#24211D]">
              Оплата ELQR / MBANK для {guests.find((g) => g.id === showQrForGuest)?.name}
            </h5>
            <div className="w-36 h-36 bg-[#FBF9F5] rounded-2xl mx-auto flex items-center justify-center p-2 border border-[#EFE9E0]">
              <div className="w-full h-full border-2 border-[#24211D] border-dashed rounded-xl flex flex-col items-center justify-center text-[#24211D]">
                <QrCode className="w-12 h-12 text-[#24211D]" />
                <span className="text-[10px] font-black mt-1 text-[#B86B3E]">{amountPerPerson} {cafeInfo.currency}</span>
              </div>
            </div>
            <p className="text-[11px] text-[#7E766D]">
              Отсканируйте камерой смартфона в приложении любого банка КР (ELQR)
            </p>
          </div>
        )}

        {/* Кнопка завершения */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleFinishSplitOrder}
            className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
              allPaid
                ? 'bg-[#2F6B42] hover:bg-[#255434] text-white shadow-md'
                : 'bg-[#B86B3E] hover:bg-[#A3592E] text-white shadow-md'
            }`}
          >
            {allPaid ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Все доли оплачены — Передать на кухню!</span>
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4" />
                <span>Подтвердить раздельный заказ</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
