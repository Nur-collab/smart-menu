'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useMenu } from '@/context/MenuContext';
import {
  PaymentTransaction,
  PaymentGatewayProvider,
  FiscalReceipt,
} from '@/types/payment';
import {
  QrCode,
  Smartphone,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  X,
  Zap,
  Receipt,
  RotateCw,
  Sparkles,
  Star,
} from 'lucide-react';

interface PaymentModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly orderId: string;
  readonly initialProvider?: PaymentGatewayProvider;
  readonly onPaymentSuccess: (receipt?: FiscalReceipt) => void;
}

export function PaymentModal({
  isOpen,
  onClose,
  orderId,
  initialProvider = 'elqr',
  onPaymentSuccess,
}: PaymentModalProps): React.JSX.Element | null {
  const { cafeInfo, orders, openReviewModal, t, language } = useMenu();

  const [provider, setProvider] = useState<PaymentGatewayProvider>(initialProvider);
  const [transaction, setTransaction] = useState<PaymentTransaction | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(300); // 5 минут
  const [error, setError] = useState<string | null>(null);

  const order = orders.find((o) => o.id === orderId);

  // Инициализация платежной транзакции
  useEffect(() => {
    if (!isOpen || !orderId) return;

    let isMounted = true;

    async function loadPayment(): Promise<void> {
      try {
        const res = await fetch('/api/payments/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId,
            provider,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Ошибка инициализации платежа');
        }

        const data = (await res.json()) as { transaction: PaymentTransaction };
        if (isMounted) {
          setTransaction(data.transaction);
          setTimeLeftSeconds(300);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Не удалось связаться с банком');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadPayment();

    return () => {
      isMounted = false;
    };
  }, [isOpen, orderId, provider]);

  const handleRetry = useCallback(() => {
    setIsLoading(true);
    setError(null);
    fetch('/api/payments/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, provider }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Ошибка связи с банком');
        return res.json();
      })
      .then((data: { transaction: PaymentTransaction }) => {
        setTransaction(data.transaction);
        setTimeLeftSeconds(300);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Ошибка соединения');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [orderId, provider]);

  // Таймер обратного отсчета 5 минут
  useEffect(() => {
    if (!isOpen || transaction?.status === 'paid') return;

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, transaction?.status]);

  // Поллинг статуса платежа (каждые 2 сек)
  useEffect(() => {
    if (!isOpen || !transaction?.id || transaction.status === 'paid') return;

    const pollInterval = setInterval(async () => {
      if (transaction.expiresAt && Date.now() > new Date(transaction.expiresAt).getTime()) {
        clearInterval(pollInterval);
        return;
      }

      try {
        const res = await fetch(`/api/payments/${transaction.id}/status`);
        if (!res.ok) return;

        const data = await res.json();
        if (data.transaction?.status === 'paid') {
          setTransaction(data.transaction);
          clearInterval(pollInterval);
          onPaymentSuccess(data.fiscalReceipt);
        }
      } catch {
        // Игнорируем сетевые сбои поллинга
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [isOpen, transaction?.id, transaction?.status, transaction?.expiresAt, onPaymentSuccess]);

  // Симуляция успешной оплаты в Sandbox-режиме
  const handleSimulatePayment = async () => {
    if (!transaction) return;

    try {
      setIsSimulating(true);
      const res = await fetch('/api/payments/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: transaction.id }),
      });

      if (!res.ok) {
        throw new Error('Ошибка Sandbox оплаты');
      }

      const data = await res.json();
      setTransaction(data.transaction);
      onPaymentSuccess(data.fiscalReceipt);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка симуляции');
    } finally {
      setIsSimulating(false);
    }
  };

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeftSeconds / 60);
  const seconds = timeLeftSeconds % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const isPaid = transaction?.status === 'paid';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-[#24211D]/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#FBF9F5] border border-[#EFE9E0] rounded-3xl p-6 shadow-2xl space-y-5 max-h-[94vh] overflow-y-auto animate-scaleUp relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-[#A8A095] hover:text-[#24211D] transition-colors"
          title="Закрыть"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Заголовок */}
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2F6B42] animate-pulse" />
            <span className="text-[10px] uppercase font-bold text-[#2F6B42] tracking-wider">
              {language === 'en' ? 'Secure Payment KG' : language === 'kg' ? 'Коопсуз төлөм КР' : 'Безопасный эквайринг КР'}
            </span>
          </div>
          <h3 className="text-lg font-black text-[#24211D] mt-0.5">
            {isPaid
              ? (language === 'en' ? 'Payment Successful!' : language === 'kg' ? 'Төлөм ийгиликтүү кабыл алынды!' : 'Оплата успешно принята!')
              : (language === 'en' ? 'Order Payment' : language === 'kg' ? 'Буйрутманы төлөө' : 'Оплата заказа со столика')}
          </h3>
          <p className="text-xs text-[#7E766D] mt-0.5">
            {order
              ? `${language === 'en' ? 'Order' : language === 'kg' ? 'Буйрутма' : 'Заказ'} #${order.id} • ${t('tableNumberPrefix')}${order.tableNumber}`
              : `${language === 'en' ? 'Order' : language === 'kg' ? 'Буйрутма' : 'Заказ'} #${orderId}`}
          </p>
        </div>

        {isPaid ? (
          /* Экран успешной оплаты */
          <div className="bg-white border border-[#2F6B42]/30 rounded-2xl p-6 text-center space-y-4 shadow-sm animate-scaleUp">
            <div className="w-16 h-16 rounded-full bg-[#EBF5ED] border border-[#2F6B42]/20 flex items-center justify-center mx-auto text-[#2F6B42]">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>

            <div>
              <h4 className="text-base font-black text-[#24211D]">
                {language === 'en' ? 'Payment Confirmed' : language === 'kg' ? 'Акча эсепке түштү' : 'Деньги зачислены на счет'}
              </h4>
              <p className="text-xs text-[#7E766D] mt-1">
                {language === 'en' ? 'Receipt fiscalized with State Tax Service KR and sent to kitchen.' : language === 'kg' ? 'Чек КР Салык кызматына фискалдаштырылып, ашканага берилди.' : 'Чек автоматически отправлен на фискализацию в ГНС КР и передан на кухню.'}
              </p>
            </div>

            <div className="bg-[#FBF9F5] rounded-xl p-3 text-xs border border-[#EFE9E0] space-y-1">
              <div className="flex justify-between text-[#7E766D]">
                <span>{t('total')}:</span>
                <span className="font-bold text-[#24211D]">
                  {order?.finalAmount ?? transaction?.amount} {cafeInfo.currency}
                </span>
              </div>
              <div className="flex justify-between text-[#7E766D]">
                <span>{language === 'en' ? 'Invoice number' : language === 'kg' ? 'Инвойс номери' : 'Номер инвойса'}:</span>
                <span className="font-mono text-[11px] text-[#24211D]">
                  {transaction?.invoiceNumber}
                </span>
              </div>
              <div className="flex justify-between text-[#7E766D]">
                <span>{language === 'en' ? 'Bank status' : language === 'kg' ? 'Банктагы абалы' : 'Статус в банке'}:</span>
                <span className="font-bold text-[#2F6B42]">{language === 'en' ? 'Confirmed ✓' : language === 'kg' ? 'Ырасталды ✓' : 'Подтвержден ✓'}</span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => onPaymentSuccess()}
                className="w-full bg-[#B86B3E] hover:bg-[#A3592E] text-white font-bold text-xs py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Receipt className="w-4 h-4" />
                <span>{t('orderReceipt')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  openReviewModal(order?.id || orderId);
                }}
                className="w-full bg-[#EBF5ED] hover:bg-[#D8EEDE] text-[#2F6B42] font-bold text-xs py-2.5 px-4 rounded-xl border border-[#2F6B42]/30 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                <span>{language === 'en' ? 'Rate visit & earn +50 bonuses 🌟' : language === 'kg' ? 'Тейлөөнү баалап +50 бонус алыңыз 🌟' : 'Оценить визит и получить +50 бонусов 🌟'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Основной экран оплаты */
          <div className="space-y-4">
            {/* Переключатель банков Кыргызстана */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-white border border-[#EFE9E0] rounded-2xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setProvider('elqr')}
                className={`py-2 px-1 rounded-xl transition-all text-center flex flex-col items-center gap-1 ${
                  provider === 'elqr'
                    ? 'bg-[#EBF5ED] text-[#2F6B42] shadow-sm'
                    : 'text-[#7E766D] hover:text-[#24211D]'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span className="text-[11px] leading-none">ELQR КР</span>
              </button>

              <button
                type="button"
                onClick={() => setProvider('mbank')}
                className={`py-2 px-1 rounded-xl transition-all text-center flex flex-col items-center gap-1 ${
                  provider === 'mbank'
                    ? 'bg-[#F4EBE3] text-[#B86B3E] shadow-sm'
                    : 'text-[#7E766D] hover:text-[#24211D]'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span className="text-[11px] leading-none">MBANK</span>
              </button>

              <button
                type="button"
                onClick={() => setProvider('odengi')}
                className={`py-2 px-1 rounded-xl transition-all text-center flex flex-col items-center gap-1 ${
                  provider === 'odengi'
                    ? 'bg-[#FDF0ED] text-[#B84232] shadow-sm'
                    : 'text-[#7E766D] hover:text-[#24211D]'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span className="text-[11px] leading-none">О!Деньги</span>
              </button>
            </div>

            {/* Блок с динамическим QR-кодом */}
            <div className="bg-white border border-[#EFE9E0] rounded-3xl p-5 text-center shadow-sm relative overflow-hidden">
              {isLoading ? (
                <div className="h-56 flex flex-col items-center justify-center gap-3 text-[#7E766D]">
                  <RotateCw className="w-6 h-6 animate-spin text-[#B86B3E]" />
                  <span className="text-xs">Формирование QR-кода банка...</span>
                </div>
              ) : error ? (
                <div className="h-56 flex flex-col items-center justify-center gap-2 text-[#B83A4A] p-4">
                  <p className="text-xs font-semibold">{error}</p>
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="text-xs bg-[#FBF9F5] border border-[#EFE9E0] px-3 py-1.5 rounded-xl text-[#24211D] font-bold mt-2"
                  >
                    Попробовать снова
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between text-xs text-[#7E766D] mb-3">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#2F6B42]" />
                      <span>Стандарт НБКР</span>
                    </span>
                    <span className="flex items-center gap-1 font-mono font-bold text-[#B86B3E]">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formattedTime}</span>
                    </span>
                  </div>

                  {/* Визуальный QR-код со стилизацией */}
                  <div className="relative mx-auto w-48 h-48 bg-[#FBF9F5] border border-[#E8DDD2] rounded-2xl p-3 flex flex-col items-center justify-center shadow-inner group">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                        transaction?.qrPayload || 'ELQR'
                      )}&color=24-33-29`}
                      alt="ELQR Кыргызстан"
                      className="w-40 h-40 object-contain rounded-lg"
                    />

                    {/* Центральный значок банка в центре QR */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-9 h-9 rounded-xl bg-white border border-[#E8DDD2] shadow-md flex items-center justify-center text-xs font-black text-[#B86B3E]">
                        {provider === 'mbank' ? 'M' : provider === 'odengi' ? 'O!' : 'с'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="text-sm font-black text-[#24211D]">
                      {order?.finalAmount ?? transaction?.amount} {cafeInfo.currency}
                    </div>
                    <p className="text-[11px] text-[#7E766D] mt-0.5">
                      {provider === 'elqr'
                        ? (language === 'en' ? 'Scan with any Kyrgyz banking app (MBANK, Optima, Bakai, Demir)' : language === 'kg' ? 'КР каалаган банкынын тиркемеси менен сканерлеңиз' : 'Отсканируйте камерой любого банка КР (Optima, Bakai, Demir, MBANK)')
                        : provider === 'mbank'
                        ? (language === 'en' ? 'Scan with MBANK mobile app' : language === 'kg' ? 'MBANK тиркемеси менен сканерлеңиз' : 'Отсканируйте сканером в приложении MBANK')
                        : (language === 'en' ? 'Scan in My O! wallet' : language === 'kg' ? 'Мой О! капчыгында сканерлеңиз' : 'Отсканируйте в кошельке Мой О!')}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Кнопки быстрого открытия на смартфоне */}
            <div className="space-y-2">
              {provider === 'mbank' && (
                <a
                  href={transaction?.deeplinks.mbank || '#'}
                  className="w-full bg-[#B86B3E] hover:bg-[#A3592E] text-white text-xs font-bold py-3 px-4 rounded-2xl shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>{language === 'en' ? 'Open MBANK App' : language === 'kg' ? 'MBANK тиркемесин ачуу' : 'Открыть приложение MBANK'}</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                </a>
              )}

              {provider === 'odengi' && (
                <a
                  href={transaction?.deeplinks.odengi || '#'}
                  className="w-full bg-[#B84232] hover:bg-[#9E3527] text-white text-xs font-bold py-3 px-4 rounded-2xl shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>{language === 'en' ? 'Open O!Dengi Wallet' : language === 'kg' ? 'О!Деньги капчыгын ачуу' : 'Открыть кошелек О!Деньги'}</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                </a>
              )}

              {/* Демо-кнопка Sandbox для тестирования в один клик */}
              <button
                type="button"
                onClick={handleSimulatePayment}
                disabled={isSimulating || isLoading}
                className="w-full bg-[#F4EBE3] hover:bg-[#E8DDD2] text-[#B86B3E] border border-[#E8DDD2] text-xs font-bold py-2.5 px-4 rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 fill-[#B86B3E]" />
                <span>
                  {isSimulating
                    ? (language === 'en' ? 'Simulating bank webhook...' : language === 'kg' ? 'Банктан жооп күтүлүүдө...' : 'Эмуляция ответа банка КР...')
                    : (language === 'en' ? '⚡ Simulate Payment (KG Sandbox)' : language === 'kg' ? '⚡ Сыноо төлөмүн жүргүзүү (Sandbox)' : '⚡ Симуляция успешной оплаты (Sandbox КР)')}
                </span>
                <Sparkles className="w-3 h-3" />
              </button>
            </div>

            <div className="text-[10px] text-center text-[#7E766D] flex items-center justify-center gap-1.5 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2F6B42]" />
              <span>{t('fiscalSalykNotice')}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
