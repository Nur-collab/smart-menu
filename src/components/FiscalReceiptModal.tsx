'use client';

import React, { useState, useEffect } from 'react';
import { useMenu } from '@/context/MenuContext';
import { FiscalReceipt } from '@/types/payment';
import {
  X,
  Printer,
  Share2,
  ExternalLink,
  ShieldCheck,
  Building2,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface FiscalReceiptModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly orderId: string;
  readonly receiptData?: FiscalReceipt;
}

export function FiscalReceiptModal({
  isOpen,
  onClose,
  orderId,
  receiptData,
}: FiscalReceiptModalProps): React.JSX.Element | null {
  const { cafeInfo, setActiveModal } = useMenu();
  const [fetchedReceipt, setFetchedReceipt] = useState<FiscalReceipt | null>(null);

  useEffect(() => {
    if (receiptData || !isOpen || !orderId) return;

    let isMounted = true;

    fetch(`/api/fiscal/${orderId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Чек не найден');
        return res.json();
      })
      .then((data: { receipt: FiscalReceipt }) => {
        if (isMounted) {
          setFetchedReceipt(data.receipt);
        }
      })
      .catch(() => {
        // Игнорируем сетевые ошибки
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, orderId, receiptData]);

  const receipt = receiptData || fetchedReceipt;
  const isLoading = !receipt && isOpen && Boolean(orderId);

  if (!isOpen) return null;

  const handlePrint = (): void => {
    window.print();
  };

  const shareText = receipt
    ? `Электронный чек ЭККМ Aura Cafe Bishkek\nЧек №ФД-${receipt.fiscalDocNumber}\nСумма: ${receipt.totalAmount} ${cafeInfo.currency}\nПроверка в ГНС КР: ${receipt.verificationUrl}`
    : '';

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  const handleGoToTracker = (): void => {
    onClose();
    setActiveModal('tracker');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-[#24211D]/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#FBF9F5] border border-[#EFE9E0] rounded-3xl p-6 shadow-2xl space-y-4 max-h-[94vh] overflow-y-auto animate-scaleUp relative print:shadow-none print:border-none print:p-0 print:m-0"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-[#A8A095] hover:text-[#24211D] transition-colors print:hidden"
          title="Закрыть"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Заголовок модального окна */}
        <div className="print:hidden">
          <div className="flex items-center gap-1.5 text-[#2F6B42] text-[10px] font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-[#2F6B42]" />
            <span>ЭККМ Государственной налоговой службы КР</span>
          </div>
          <h3 className="text-base font-black text-[#24211D] mt-0.5">
            Электронный фискальный чек
          </h3>
        </div>

        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2 text-xs text-[#7E766D]">
            <Clock className="w-6 h-6 animate-spin text-[#B86B3E]" />
            <span>Загрузка фискального документа...</span>
          </div>
        ) : receipt ? (
          <div className="space-y-4">
            {/* Бумажный фискальный чек в термо-стиле */}
            <div className="bg-white border border-[#EFE9E0] rounded-2xl p-5 shadow-sm font-mono text-xs text-[#24211D] space-y-3 relative overflow-hidden">
              {/* Шапка чека */}
              <div className="text-center pb-3 border-b border-dashed border-[#DFD5C7] space-y-1">
                <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-[#B86B3E]">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{receipt.companyName}</span>
                </div>
                <div className="text-[10px] text-[#7E766D]">
                  г. Бишкек, бул. Эркиндик 35 • Ресторан Aura
                </div>
                <div className="text-[10px] font-bold text-[#24211D] pt-1">
                  ИНН: {receipt.tin}
                </div>
                <div className="text-[9px] text-[#7E766D]">
                  РН ККМ: {receipt.kkmRegNumber} | ЗН ФМ: {receipt.fiscalModuleNumber}
                </div>
              </div>

              {/* Метаданные документа */}
              <div className="space-y-1 text-[10px] text-[#7E766D] border-b border-dashed border-[#DFD5C7] pb-2">
                <div className="flex justify-between">
                  <span>ФИСКАЛЬНЫЙ ЧЕК:</span>
                  <span className="font-bold text-[#24211D]">№ФД-{receipt.fiscalDocNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>ФПД (Признак документа):</span>
                  <span className="font-bold text-[#24211D]">{receipt.fiscalSign}</span>
                </div>
                <div className="flex justify-between">
                  <span>Смена / Кассир:</span>
                  <span>#{receipt.fiscalShiftNumber} • {receipt.cashierName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Столик / Инвойс:</span>
                  <span>Стол №{receipt.tableNumber} • {receipt.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Дата и время:</span>
                  <span>{new Date(receipt.createdAt).toLocaleString('ru-RU')}</span>
                </div>
              </div>

              {/* Позиции заказа */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                <div className="text-[10px] font-bold uppercase text-[#8C7A6B] flex justify-between">
                  <span>Наименование</span>
                  <span>Сумма</span>
                </div>
                {receipt.items.map((item) => (
                  <div key={item.id} className="text-[11px] space-y-0.5">
                    <div className="flex justify-between font-medium text-[#24211D]">
                      <span className="truncate pr-2">{item.name}</span>
                      <span className="shrink-0">{item.total.toFixed(2)} с</span>
                    </div>
                    <div className="flex justify-between text-[9px] text-[#7E766D]">
                      <span>
                        {item.quantity} × {item.price.toFixed(2)} с (НСП {item.taxPercent}%)
                      </span>
                      <span>НСП: {item.taxAmount.toFixed(2)} с</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Итоговый расчет налогов и скидок */}
              <div className="border-t border-dashed border-[#DFD5C7] pt-2 space-y-1 text-[11px]">
                {receipt.discountAmount > 0 && (
                  <div className="flex justify-between text-[#B86B3E]">
                    <span>Скидка бонусами:</span>
                    <span>-{receipt.discountAmount.toFixed(2)} с</span>
                  </div>
                )}
                {receipt.tipAmount > 0 && (
                  <div className="flex justify-between text-[#7E766D]">
                    <span>Чаевые персоналу:</span>
                    <span>+{receipt.tipAmount.toFixed(2)} с</span>
                  </div>
                )}
                <div className="flex justify-between text-[10px] text-[#7E766D]">
                  <span>В том числе НСП (2%):</span>
                  <span>{receipt.taxTotalNsp.toFixed(2)} с</span>
                </div>
                <div className="flex justify-between text-sm font-black text-[#24211D] pt-1 border-t border-[#EFE9E0]">
                  <span>ИТОГО К ОПЛАТЕ:</span>
                  <span className="text-[#B86B3E]">{receipt.totalAmount.toFixed(2)} с</span>
                </div>
                <div className="flex justify-between text-[10px] text-[#2F6B42] font-bold">
                  <span>ОПЛАЧЕНО (БЕЗНАЛИЧНЫЙ):</span>
                  <span>{receipt.totalAmount.toFixed(2)} с</span>
                </div>
              </div>

              {/* QR-код верификации ГНС КР */}
              <div className="border-t border-dashed border-[#DFD5C7] pt-3 text-center space-y-2">
                <div className="mx-auto w-24 h-24 bg-[#FBF9F5] border border-[#E8DDD2] rounded-xl p-1.5 flex items-center justify-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
                      receipt.verificationUrl
                    )}&color=24-33-29`}
                    alt="Верификация ГНС КР"
                    className="w-20 h-20 object-contain rounded"
                  />
                </div>
                <p className="text-[9px] text-[#7E766D] leading-tight">
                  Проверка подлинности чека на портале ГНС КР salyk.kg
                </p>
                <a
                  href={receipt.verificationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-[#2F6B42] hover:underline"
                >
                  <span>Проверить чек онлайн</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Панель действий: WhatsApp, Печать, Трекер */}
            <div className="space-y-2 print:hidden">
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#25D366] hover:bg-[#20BA5A] text-white text-xs font-bold py-2.5 px-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <Share2 className="w-4 h-4" />
                  <span>В WhatsApp</span>
                </a>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="bg-white hover:bg-[#F4EBE3] text-[#24211D] border border-[#EFE9E0] text-xs font-bold py-2.5 px-3 rounded-2xl flex items-center justify-center gap-2 transition-all"
                >
                  <Printer className="w-4 h-4 text-[#7E766D]" />
                  <span>Печать чека</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleGoToTracker}
                className="w-full bg-[#B86B3E] hover:bg-[#A3592E] text-white text-xs font-bold py-3 px-4 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>К статусу приготовления блюд</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-[#7E766D]">
            Чек формируется после завершения оплаты заказа.
          </div>
        )}
      </div>
    </div>
  );
}
