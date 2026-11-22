'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import Link from 'next/link';

const emptySubscribe = () => () => {};
import { MenuProvider, useMenu } from '@/context/MenuContext';
import { OrderStatus } from '@/types/menu';
import {
  CookingPot,
  Receipt,
  Ban,
  BellRing,
  QrCode,
  ArrowLeft,
  Clock,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Printer,
  Flame,
  Search,
  Volume2,
  VolumeX,
  LogOut,
  UserCheck,
  ChefHat,
  Crown,
  ShieldCheck,
  Building2,
  ExternalLink,
  Server,
  Compass,
} from 'lucide-react';
import { playOrderChime } from '@/lib/audioAlert';
import { StaffMember, getPermissionsByRole } from '@/types/auth';
import { PinPadLockScreen } from '@/components/admin/PinPadLockScreen';
import { generateTableToken } from '@/lib/tableAuth';
import { FiscalReceiptModal } from '@/components/FiscalReceiptModal';
import { FiscalReceipt } from '@/types/payment';
import { PosPrinterManager } from '@/components/admin/PosPrinterManager';
import { ReviewsManager } from '@/components/admin/ReviewsManager';
import { MenuManager } from '@/components/admin/MenuManager';

let cachedStaffRaw: string | null = null;
let cachedStaffObj: StaffMember | null = null;

function subscribeToStaffSession(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  window.addEventListener('aura_staff_session_change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('aura_staff_session_change', callback);
  };
}

function getStaffSessionSnapshot(): StaffMember | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem('aura_staff_session');
    if (raw === cachedStaffRaw) {
      return cachedStaffObj;
    }
    cachedStaffRaw = raw;
    cachedStaffObj = raw ? (JSON.parse(raw) as StaffMember) : null;
    return cachedStaffObj;
  } catch {
    return null;
  }
}

function AdminDashboardContent(): React.JSX.Element {
  const {
    cafeInfo,
    orders,
    updateOrderStatus,
    items,
    stopList,
    toggleStopList,
    waiterCalls,
    resolveWaiterCall,
    isSoundEnabled,
    toggleSound,
  } = useMenu();

  const hasMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const currentStaff = useSyncExternalStore(
    subscribeToStaffSession,
    getStaffSessionSnapshot,
    () => null
  );

  const [activeTab, setActiveTab] = useState<
    'kds' | 'stoplist' | 'calls' | 'qr' | 'analytics' | 'kkm' | 'pos' | 'reviews' | 'menu'
  >('kds');
  const [selectedQrTable, setSelectedQrTable] = useState<number>(1);
  const [stopListSearch, setStopListSearch] = useState<string>('');
  const [selectedFiscalOrderId, setSelectedFiscalOrderId] = useState<string | null>(null);
  const [fiscalReceipts, setFiscalReceipts] = useState<readonly FiscalReceipt[]>([]);
  const [printingOrderId, setPrintingOrderId] = useState<string | null>(null);
  const [syncingOrderId, setSyncingOrderId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Загрузка фискальных чеков с сервера
  useEffect(() => {
    fetch('/api/fiscal')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { receipts: FiscalReceipt[] } | null) => {
        if (data?.receipts) {
          setFiscalReceipts(data.receipts);
        }
      })
      .catch(() => {
        // Игнорируем сетевые ошибки
      });
  }, [activeTab]);

  const handleAuthenticated = (staff: StaffMember): void => {
    try {
      sessionStorage.setItem('aura_staff_session', JSON.stringify(staff));
      window.dispatchEvent(new Event('aura_staff_session_change'));
    } catch {
      // ignore
    }
    if (staff.role === 'waiter') {
      setActiveTab('calls');
    } else {
      setActiveTab('kds');
    }
  };

  const handleLogout = (): void => {
    try {
      sessionStorage.removeItem('aura_staff_session');
      sessionStorage.removeItem('aura_staff_token');
      if (typeof document !== 'undefined') {
        document.cookie = 'aura_staff_token=; path=/; max-age=0';
      }
      window.dispatchEvent(new Event('aura_staff_session_change'));
    } catch {
      // ignore
    }
  };

  const pendingCalls = waiterCalls.filter((c) => c.status === 'pending');
  const activeOrders = orders.filter((o) => o.status !== 'cancelled' && o.status !== 'served');
  const completedOrders = orders.filter((o) => o.status === 'served');
  const totalRevenue = orders.reduce((acc, o) => acc + o.finalAmount, 0);
  const averageBill = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;

  const handleSoundToggle = (): void => {
    const willBeEnabled = !isSoundEnabled;
    toggleSound();
    if (willBeEnabled) {
      playOrderChime();
    }
  };

  const getPaymentLabel = (method: string): string => {
    switch (method) {
      case 'elqr':
        return 'ELQR (КР)';
      case 'mbank':
        return 'MBANK';
      case 'odengi':
        return 'О!Деньги';
      case 'card_to_waiter':
        return 'Картой официанту';
      case 'cash':
        return 'Наличные';
      case 'split':
        return 'Сплит-чек';
      default:
        return method;
    }
  };

  const getNextStatus = (current: OrderStatus): OrderStatus | null => {
    switch (current) {
      case 'pending':
        return 'cooking';
      case 'cooking':
        return 'ready';
      case 'ready':
        return 'served';
      default:
        return null;
    }
  };

  const filteredStopListItems = items.filter((item) =>
    item.name.toLowerCase().includes(stopListSearch.toLowerCase())
  );

  if (!hasMounted) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-stone-300 border-t-[#B86B3E] animate-spin" />
      </div>
    );
  }

  // Если сотрудник не авторизован — показываем PIN-Pad экран блокировки
  if (!currentStaff) {
    return (
      <PinPadLockScreen
        onAuthenticated={handleAuthenticated}
        cafeName={cafeInfo.name}
      />
    );
  }

  const permissions = getPermissionsByRole(currentStaff.role);

  type AdminTab = 'kds' | 'stoplist' | 'calls' | 'qr' | 'analytics' | 'kkm' | 'pos' | 'reviews' | 'menu';

  const isTabAllowed = (tab: AdminTab): boolean => {
    switch (tab) {
      case 'kds':
        return permissions.canViewKds;
      case 'calls':
        return permissions.canHandleCalls;
      case 'stoplist':
        return permissions.canManageStopList;
      case 'menu':
        return Boolean(permissions.canManageMenu);
      case 'qr':
        return permissions.canGenerateQr;
      case 'analytics':
      case 'kkm':
      case 'pos':
        return permissions.canViewAnalytics;
      case 'reviews':
        return currentStaff.role === 'manager' || Boolean(permissions.canManageReviews);
    }
  };

  const handlePrintTicket = async (orderId: string): Promise<void> => {
    setPrintingOrderId(orderId);
    try {
      const res = await fetch('/api/printer/print-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage(`Бегунок для заказа #${orderId} отправлен на печать!`);
      } else {
        setActionMessage(`Ошибка печати: ${data.error || 'Сбой принтера'}`);
      }
    } catch {
      setActionMessage('Ошибка сети при отправке на печать');
    } finally {
      setPrintingOrderId(null);
      setTimeout(() => setActionMessage(null), 3500);
    }
  };

  const handleSendToPos = async (orderId: string): Promise<void> => {
    setSyncingOrderId(orderId);
    try {
      const res = await fetch('/api/pos/send-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage(`Заказ #${orderId} зарегистрирован в POS (${data.posOrderId || 'Успех'})`);
      } else {
        setActionMessage(`Ошибка POS: ${data.error || 'Сбой интеграции'}`);
      }
    } catch {
      setActionMessage('Ошибка сети при отправке в POS');
    } finally {
      setSyncingOrderId(null);
      setTimeout(() => setActionMessage(null), 3500);
    }
  };

  const effectiveTab: AdminTab = isTabAllowed(activeTab)
    ? activeTab
    : permissions.canViewKds
    ? 'kds'
    : permissions.canHandleCalls
    ? 'calls'
    : 'stoplist';

  const canAdvanceStatus = (next: OrderStatus): boolean => {
    if (next === 'cooking' || next === 'ready') {
      return permissions.canCookOrders;
    }
    if (next === 'served') {
      return permissions.canServeOrders;
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#24211D] flex flex-col font-sans">
      {/* Шапка панели администратора */}
      <header className="sticky top-0 z-30 bg-white border-b border-[#EFE9E0] px-4 sm:px-6 py-3.5 shadow-[0_1px_8px_rgba(40,30,20,0.03)]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 bg-[#FBF9F5] hover:bg-[#F4EBE3] text-[#7E766D] hover:text-[#24211D] rounded-2xl border border-[#EFE9E0] transition-colors flex items-center gap-1.5 text-xs font-bold"
              title="Вернуться к меню гостя"
            >
              <ArrowLeft className="w-4 h-4 text-[#B86B3E]" />
              <span className="hidden sm:inline">В зал</span>
            </Link>

            <div className="h-6 w-px bg-[#EFE9E0] hidden sm:block" />

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-2xl bg-[#F4EBE3] text-[#B86B3E] border border-[#E8DDD2] flex items-center justify-center">
                <CookingPot className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-base font-black text-[#24211D] flex items-center gap-2">
                  <span>Панель персонала</span>
                  <span className="text-[10px] bg-[#B86B3E] text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {currentStaff.role}
                  </span>
                </h1>
                <p className="text-xs text-[#7E766D]">{cafeInfo.name}</p>
              </div>
            </div>
          </div>

          {/* Быстрые индикаторы, звуковой колокол и профиль сотрудника */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            {/* Карточка сотрудника с логаутом */}
            <div className="flex items-center gap-2 bg-[#F4EBE3] border border-[#E8DDD2] px-3 py-1.5 rounded-2xl shadow-sm">
              <div className="w-7 h-7 rounded-xl bg-[#B86B3E] text-white flex items-center justify-center font-black text-xs shadow-sm">
                {currentStaff.avatarInitial}
              </div>
              <div className="text-left hidden md:block">
                <div className="text-xs font-black text-[#24211D] leading-tight">
                  {currentStaff.name}
                </div>
                <div className="text-[10px] text-[#B86B3E] font-bold flex items-center gap-1">
                  {currentStaff.role === 'waiter' && <UserCheck className="w-3 h-3" />}
                  {currentStaff.role === 'kitchen' && <ChefHat className="w-3 h-3 text-[#356BB3]" />}
                  {currentStaff.role === 'manager' && <Crown className="w-3 h-3 text-[#B87D2E]" />}
                  <span>{currentStaff.roleTitle}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 hover:bg-white rounded-xl text-[#7E766D] hover:text-[#B83A4A] transition-all ml-1 cursor-pointer"
                title="Завершить смену / Сменить сотрудника"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Звуковой сигнал кухни */}
            <button
              type="button"
              onClick={handleSoundToggle}
              className={`px-3 py-1.5 rounded-2xl border text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer ${
                isSoundEnabled
                  ? 'bg-[#2F6B42]/10 text-[#2F6B42] border-[#2F6B42]/30 hover:bg-[#2F6B42]/20'
                  : 'bg-[#B83A4A]/10 text-[#B83A4A] border-[#B83A4A]/30 hover:bg-[#B83A4A]/20'
              }`}
              title={
                isSoundEnabled
                  ? 'Звуковой колокол кухни активен (нажмите для проверки/выключения)'
                  : 'Звуковой колокол кухни выключен (нажмите для включения)'
              }
            >
              {isSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden lg:inline">
                {isSoundEnabled ? 'Звук: Вкл 🔔' : 'Звук: Выкл 🔕'}
              </span>
            </button>

            {/* Финансовые индикаторы видны только управляющему */}
            {permissions.canViewAnalytics ? (
              <>
                <div className="bg-[#FBF9F5] border border-[#EFE9E0] px-3.5 py-1.5 rounded-2xl text-right shadow-sm">
                  <span className="text-[10px] text-[#8C7A6B] block uppercase font-bold">Выручка</span>
                  <strong className="text-[#2F6B42] font-black text-sm">{totalRevenue} {cafeInfo.currency}</strong>
                </div>

                <div className="bg-[#FBF9F5] border border-[#EFE9E0] px-3.5 py-1.5 rounded-2xl text-right shadow-sm hidden sm:block">
                  <span className="text-[10px] text-[#8C7A6B] block uppercase font-bold">Ср. чек</span>
                  <strong className="text-[#24211D] font-bold text-sm">{averageBill} {cafeInfo.currency}</strong>
                </div>
              </>
            ) : (
              <div className="bg-[#FBF9F5] border border-[#EFE9E0] px-3.5 py-1.5 rounded-2xl text-right shadow-sm">
                <span className="text-[10px] text-[#8C7A6B] block uppercase font-bold">Смена</span>
                <strong className="text-[#2F6B42] font-black text-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2F6B42] animate-pulse" />
                  Активна
                </strong>
              </div>
            )}
          </div>
        </div>

        {/* Навигационные вкладки панели (фильтруются по правам роли) */}
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-2 mt-3">
          {permissions.canViewKds && (
            <button
              type="button"
              onClick={() => setActiveTab('kds')}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                effectiveTab === 'kds'
                  ? 'bg-[#24211D] text-[#FBF9F5] shadow-sm'
                  : 'bg-[#FBF9F5] text-[#7E766D] hover:text-[#24211D] border border-[#EFE9E0]'
              }`}
            >
              <Receipt className="w-3.5 h-3.5 text-[#B86B3E]" />
              <span>Заказы кухни (KDS)</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  effectiveTab === 'kds' ? 'bg-white/20 text-[#FBF9F5]' : 'bg-[#EFE9E0] text-[#7E766D]'
                }`}
              >
                {activeOrders.length}
              </span>
            </button>
          )}

          {permissions.canHandleCalls && (
            <button
              type="button"
              onClick={() => setActiveTab('calls')}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                effectiveTab === 'calls'
                  ? 'bg-[#24211D] text-[#FBF9F5] shadow-sm'
                  : 'bg-[#FBF9F5] text-[#7E766D] hover:text-[#24211D] border border-[#EFE9E0]'
              }`}
            >
              <BellRing className="w-3.5 h-3.5 text-[#B86B3E]" />
              <span>Вызовы официанта</span>
              {pendingCalls.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#B83A4A] text-white font-bold animate-pulse">
                  {pendingCalls.length}
                </span>
              )}
            </button>
          )}

          {permissions.canManageStopList && (
            <button
              type="button"
              onClick={() => setActiveTab('stoplist')}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                effectiveTab === 'stoplist'
                  ? 'bg-[#24211D] text-[#FBF9F5] shadow-sm'
                  : 'bg-[#FBF9F5] text-[#7E766D] hover:text-[#24211D] border border-[#EFE9E0]'
              }`}
            >
              <Ban className="w-3.5 h-3.5 text-[#B83A4A]" />
              <span>Стоп-лист</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  effectiveTab === 'stoplist' ? 'bg-white/20 text-[#FBF9F5]' : 'bg-[#EFE9E0] text-[#7E766D]'
                }`}
              >
                {stopList.size}
              </span>
            </button>
          )}

          {permissions.canManageMenu && (
            <button
              type="button"
              onClick={() => setActiveTab('menu')}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                effectiveTab === 'menu'
                  ? 'bg-[#B86B3E] text-white shadow-md'
                  : 'bg-[#FBF9F5] text-[#7E766D] hover:text-[#24211D] border border-[#EFE9E0]'
              }`}
            >
              <CookingPot className={`w-3.5 h-3.5 ${effectiveTab === 'menu' ? 'text-white' : 'text-[#B86B3E]'}`} />
              <span>Управление меню</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  effectiveTab === 'menu' ? 'bg-white/20 text-white' : 'bg-[#EFE9E0] text-[#7E766D]'
                }`}
              >
                {items.length}
              </span>
            </button>
          )}

          {permissions.canGenerateQr && (
            <button
              type="button"
              onClick={() => setActiveTab('qr')}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                effectiveTab === 'qr'
                  ? 'bg-[#24211D] text-[#FBF9F5] shadow-sm'
                  : 'bg-[#FBF9F5] text-[#7E766D] hover:text-[#24211D] border border-[#EFE9E0]'
              }`}
            >
              <QrCode className="w-3.5 h-3.5 text-[#B86B3E]" />
              <span>Генератор QR столиков</span>
            </button>
          )}

          {permissions.canViewAnalytics && (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  effectiveTab === 'analytics'
                    ? 'bg-[#24211D] text-[#FBF9F5] shadow-sm'
                    : 'bg-[#FBF9F5] text-[#7E766D] hover:text-[#24211D] border border-[#EFE9E0]'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-[#2F6B42]" />
                <span>Аналитика & Отчеты</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('kkm')}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  effectiveTab === 'kkm'
                    ? 'bg-[#24211D] text-[#FBF9F5] shadow-sm'
                    : 'bg-[#FBF9F5] text-[#7E766D] hover:text-[#24211D] border border-[#EFE9E0]'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-[#B86B3E]" />
                <span>Касса & ЭККМ (ГНС КР)</span>
                {fiscalReceipts.length > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      effectiveTab === 'kkm'
                        ? 'bg-white/20 text-[#FBF9F5]'
                        : 'bg-[#EBF5ED] text-[#2F6B42]'
                    }`}
                  >
                    {fiscalReceipts.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('pos')}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  effectiveTab === 'pos'
                    ? 'bg-[#24211D] text-[#FBF9F5] shadow-sm'
                    : 'bg-[#FBF9F5] text-[#7E766D] hover:text-[#24211D] border border-[#EFE9E0]'
                }`}
              >
                <Server className="w-3.5 h-3.5 text-[#B86B3E]" />
                <span>Касса & Принтеры (POS)</span>
              </button>
            </>
          )}

          {(currentStaff.role === 'manager' || permissions.canManageReviews) && (
            <button
              type="button"
              onClick={() => setActiveTab('reviews')}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                effectiveTab === 'reviews'
                  ? 'bg-[#00A040] text-white shadow-md ring-2 ring-[#00A040]/30'
                  : 'bg-[#F0FDF4] text-[#00A040] hover:bg-[#DCFCE7] border border-[#86EFAC] shadow-xs'
              }`}
            >
              <Compass className={`w-4 h-4 ${effectiveTab === 'reviews' ? 'text-white' : 'text-[#00A040]'}`} />
              <span>Отзывы & 2ГИС (NPS)</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  effectiveTab === 'reviews'
                    ? 'bg-white/25 text-white'
                    : 'bg-[#00A040] text-white'
                }`}
              >
                2ГИС
              </span>
            </button>
          )}
        </div>
      </header>

      {/* Основной контент */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex-1">
        {/* ВКЛАДКА 1: KDS (КАНБАН КУХНИ) */}
        {effectiveTab === 'kds' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-[#24211D] flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-[#B86B3E]" />
                  <span>Очередь кухни и бара (KDS)</span>
                </h2>
                {currentStaff.role === 'waiter' && (
                  <p className="text-xs text-[#2F6B42] font-semibold mt-0.5">
                    Готовые к выдаче блюда подсвечены зеленым — заберите их с кухни и нажмите «Подать гостю».
                  </p>
                )}
              </div>
              <span className="text-xs text-[#7E766D] font-medium">
                Всего заказов: {orders.length}
              </span>
            </div>

            {actionMessage && (
              <div className="bg-[#EBF5ED] border border-[#D5EADB] text-[#2F6B42] text-xs font-bold px-4 py-2.5 rounded-2xl flex items-center justify-between shadow-sm">
                <span>{actionMessage}</span>
                <button
                  type="button"
                  onClick={() => setActionMessage(null)}
                  className="text-[#7E766D] hover:text-[#24211D] text-xs font-bold ml-2 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {orders.length === 0 ? (
              <div className="bg-white border border-[#EFE9E0] rounded-3xl p-12 text-center space-y-3 shadow-sm">
                <div className="w-14 h-14 bg-[#FBF9F5] border border-[#EFE9E0] rounded-full flex items-center justify-center mx-auto text-[#7E766D] text-xl">
                  🍽️
                </div>
                <h3 className="text-base font-black text-[#24211D]">Входящих заказов пока нет</h3>
                <p className="text-xs text-[#7E766D] max-w-sm mx-auto">
                  Перейдите в меню гостя по ссылке вверху, добавьте блюда в корзину и оформите заказ — он сразу отобразится на этом экране!
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 bg-[#B86B3E] hover:bg-[#A3592E] text-white font-bold text-xs px-4 py-2 rounded-2xl shadow-sm transition-all"
                >
                  <span>Оформить тестовый заказ</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {orders.map((order) => {
                  const nextStatus = getNextStatus(order.status);
                  const isServed = order.status === 'served';

                  return (
                    <div
                      key={order.id}
                      className={`bg-white border rounded-3xl p-5 flex flex-col justify-between space-y-3 transition-all shadow-sm ${
                        order.status === 'ready'
                          ? 'border-[#2F6B42]/50 shadow-[0_4px_16px_rgba(47,107,66,0.08)]'
                          : order.status === 'cooking'
                          ? 'border-[#356BB3]/40'
                          : isServed
                          ? 'border-[#EFE9E0] opacity-60'
                          : 'border-[#B86B3E]/40'
                      }`}
                    >
                      <div>
                        {/* Шапка чека */}
                        <div className="flex items-center justify-between pb-3 border-b border-[#F2ECE4]">
                          <div className="flex items-center gap-2">
                            <span className="text-base font-black text-[#B86B3E]">
                              Стол №{order.tableNumber}
                            </span>
                            <span className="text-[10px] text-[#A8A095] font-mono">
                              #{order.id}
                            </span>
                          </div>

                          <div>
                            {order.status === 'pending' && (
                              <span className="bg-[#F4EBE3] text-[#B86B3E] border border-[#E8DDD2] text-[10px] font-bold px-2 py-0.5 rounded-full">
                                Новый заказ
                              </span>
                            )}
                            {order.status === 'cooking' && (
                              <span className="bg-[#EDF3FA] text-[#356BB3] border border-[#D5E4F5] text-[10px] font-bold px-2 py-0.5 rounded-full">
                                Готовится
                              </span>
                            )}
                            {order.status === 'ready' && (
                              <span className="bg-[#EBF5ED] text-[#2F6B42] border border-[#D5EADB] text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                                Готов к выдаче!
                              </span>
                            )}
                            {isServed && (
                              <span className="bg-[#F4EBE3] text-[#7E766D] text-[10px] font-bold px-2 py-0.5 rounded-full">
                                Выдан гостю ✓
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Список позиций */}
                        <div className="py-3 space-y-1.5">
                          {order.items.map((i) => (
                            <div
                              key={i.cartItemId}
                              className="flex items-start justify-between text-xs"
                            >
                              <div className="pr-2">
                                <span className="font-black text-[#B86B3E]">{i.quantity} × </span>
                                <span className="text-[#24211D] font-medium">{i.menuItem?.name || 'Позиция'}</span>
                                {Boolean(i.selectedOptions && i.selectedOptions.length > 0) && (
                                  <div className="text-[10px] text-[#7E766D] pl-4">
                                    + {i.selectedOptions?.map((o) => o.optionName).join(', ')}
                                  </div>
                                )}
                              </div>
                              <span className="font-semibold text-[#7E766D] shrink-0">
                                {i.unitPrice * i.quantity} {cafeInfo.currency}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Комментарий гостя */}
                        {order.guestComment && (
                          <div className="bg-[#FBF9F5] border border-[#EFE9E0] p-2.5 rounded-xl text-[11px] text-[#B86B3E] italic">
                            Примечание: «{order.guestComment}»
                          </div>
                        )}

                        {/* Кнопки быстрой печати бегунка и отправки в POS */}
                        <div className="mt-3 pt-2.5 flex items-center justify-between border-t border-[#F2ECE4] text-[11px]">
                          <button
                            type="button"
                            disabled={printingOrderId === order.id}
                            onClick={() => handlePrintTicket(order.id)}
                            className="text-[#7E766D] hover:text-[#B86B3E] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50 transition-colors"
                            title="Напечатать бегунок на кухонном термопринтере (ESC/POS)"
                          >
                            <Printer className="w-3.5 h-3.5 text-[#B86B3E]" />
                            <span>{printingOrderId === order.id ? 'Печать...' : 'Бегунок'}</span>
                          </button>

                          {permissions.canViewAnalytics && (
                            <button
                              type="button"
                              disabled={syncingOrderId === order.id}
                              onClick={() => handleSendToPos(order.id)}
                              className="text-[#7E766D] hover:text-[#356BB3] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50 transition-colors"
                              title="Отправить или обновить заказ в POS-системе (iiko / Poster / r-keeper)"
                            >
                              <Server className="w-3.5 h-3.5 text-[#356BB3]" />
                              <span>{syncingOrderId === order.id ? 'В POS...' : 'В POS'}</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Футер чека с кнопкой продвижения статуса */}
                      <div className="pt-3 border-t border-[#F2ECE4] flex items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-[#8C7A6B] uppercase block font-semibold">
                              {getPaymentLabel(order.paymentMethod)}
                            </span>
                            {order.status === 'paid' ? (
                              <span className="text-[9px] bg-[#EBF5ED] text-[#2F6B42] font-bold px-1.5 py-0.2 rounded-full border border-[#D5EADB]">
                                Оплачено ✓
                              </span>
                            ) : (
                              <span className="text-[9px] bg-[#F4EBE3] text-[#B86B3E] font-bold px-1.5 py-0.2 rounded-full border border-[#E8DDD2]">
                                Ожидает
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-sm font-black text-[#24211D]">
                              {order.finalAmount} {cafeInfo.currency}
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedFiscalOrderId(order.id)}
                              className="text-[10px] text-[#B86B3E] hover:underline flex items-center gap-0.5 cursor-pointer"
                              title="Посмотреть чек ЭККМ"
                            >
                              <Receipt className="w-3 h-3" />
                              <span>Чек</span>
                            </button>
                          </div>
                        </div>

                        {nextStatus ? (
                          canAdvanceStatus(nextStatus) ? (
                            <button
                              type="button"
                              onClick={() => updateOrderStatus(order.id, nextStatus)}
                              className="bg-[#B86B3E] hover:bg-[#A3592E] active:scale-95 text-white text-xs font-bold px-4 py-2 rounded-2xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                            >
                              <span>
                                {nextStatus === 'cooking' && 'В работу'}
                                {nextStatus === 'ready' && 'Готово'}
                                {nextStatus === 'served' && 'Подать гостю ✓'}
                              </span>
                              <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
                            </button>
                          ) : (
                            <div className="bg-[#F4EBE3] border border-[#E8DDD2] text-[#8C7A6B] text-[11px] font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-[#B86B3E]" />
                              <span>
                                {nextStatus === 'cooking' && 'Ждёт повара'}
                                {nextStatus === 'ready' && 'Готовит кухня'}
                                {nextStatus === 'served' && 'Ожидает официанта'}
                              </span>
                            </div>
                          )
                        ) : (
                          <span className="text-[#2F6B42] text-xs font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Чек закрыт
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ВКЛАДКА 2: ВЫЗОВЫ ОФИЦИАНТА */}
        {effectiveTab === 'calls' && (
          <div className="space-y-4 max-w-3xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-[#24211D] flex items-center gap-2">
                <BellRing className="w-4 h-4 text-[#B86B3E]" />
                <span>Журнал вызовов персонала со столиков</span>
              </h2>
              <span className="text-xs text-[#7E766D] font-medium">
                В ожидании: {pendingCalls.length}
              </span>
            </div>

            {waiterCalls.length === 0 ? (
              <div className="bg-white border border-[#EFE9E0] rounded-3xl p-10 text-center text-xs text-[#7E766D] shadow-sm">
                Вызовов персонала пока не поступало. Все гости обслужены!
              </div>
            ) : (
              <div className="space-y-2.5">
                {waiterCalls.map((call) => (
                  <div
                    key={call.id}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      call.status === 'pending'
                        ? 'bg-white border-[#B86B3E]/40 shadow-sm'
                        : 'bg-[#FBF9F5] border-[#EFE9E0] opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#F4EBE3] flex items-center justify-center text-sm font-black text-[#B86B3E]">
                        №{call.tableNumber}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#24211D]">
                          {call.reason === 'bill' && '💳 Гость просит счет'}
                          {call.reason === 'help' && '🙋 Требуется помощь официанта'}
                          {call.reason === 'cutlery' && '🍴 Принести приборы / салфетки'}
                          {call.reason === 'clean' && '🧹 Убрать со столика'}
                        </h4>
                        <span className="text-[11px] text-[#7E766D] flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-[#B86B3E]" />
                          {new Date(call.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    {call.status === 'pending' ? (
                      <button
                        type="button"
                        onClick={() => resolveWaiterCall(call.id)}
                        className="bg-[#2F6B42] hover:bg-[#255434] text-white font-bold text-xs px-4 py-2 rounded-2xl transition-all shadow-sm flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Обслужено</span>
                      </button>
                    ) : (
                      <span className="text-xs text-[#2F6B42] font-semibold">
                        Выполнено ✓
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ВКЛАДКА 3: СТОП-ЛИСТ */}
        {effectiveTab === 'stoplist' && (
          <div className="space-y-4 max-w-4xl">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-black text-[#24211D] flex items-center gap-2">
                  <Ban className="w-4 h-4 text-[#B83A4A]" />
                  <span>Мгновенный стоп-лист заведения</span>
                </h2>
                <p className="text-xs text-[#7E766D]">
                  Выключите блюдо в 1 клик, если ингредиенты закончились. Оно сразу заблокируется в смартфонах гостей.
                </p>
              </div>

              {/* Поиск по меню */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-[#A8A095] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={stopListSearch}
                  onChange={(e) => setStopListSearch(e.target.value)}
                  placeholder="Поиск по меню..."
                  className="w-full bg-white border border-[#EFE9E0] rounded-2xl pl-8 pr-3 py-2 text-xs text-[#24211D] placeholder-[#A8A095] outline-none focus:border-[#B86B3E]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredStopListItems.map((item) => {
                const isBlocked = stopList.has(item.id);

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isBlocked
                        ? 'bg-[#FDF2F4] border-[#F8D2D7]'
                        : 'bg-white border-[#EFE9E0] shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className={`w-12 h-12 rounded-2xl object-cover shrink-0 ${
                          isBlocked ? 'grayscale' : ''
                        }`}
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-[#24211D] truncate">
                          {item.name}
                        </h4>
                        <span className="text-xs font-black text-[#B86B3E]">
                          {item.price} {cafeInfo.currency}
                        </span>
                        <div className="text-[10px] text-[#A8A095] truncate">
                          {item.weight} • {item.calories} ккал
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleStopList(item.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 ${
                        isBlocked
                          ? 'bg-[#B83A4A]/10 text-[#B83A4A] border-[#B83A4A]/30 hover:bg-[#2F6B42] hover:text-white'
                          : 'bg-[#2F6B42]/10 text-[#2F6B42] border-[#2F6B42]/30 hover:bg-[#B83A4A] hover:text-white'
                      }`}
                    >
                      {isBlocked ? 'В стоп-листе ✕' : 'В наличии ✓'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ВКЛАДКА 4: ГЕНЕРАТОР QR-КОДОВ ДЛЯ СТОЛИКОВ */}
        {effectiveTab === 'qr' && (
          <div className="space-y-4 max-w-xl">
            <div>
              <h2 className="text-base font-black text-[#24211D] flex items-center gap-2">
                <QrCode className="w-4 h-4 text-[#B86B3E]" />
                <span>Генератор QR-кодов для тейбл-тентов</span>
              </h2>
              <p className="text-xs text-[#7E766D]">
                Распечатайте наклейки на столики кафе. Гость сканирует QR и сразу видит меню со своего столика с криптографической Anti-Fraud защитой!
              </p>
            </div>

            {/* Выбор столика */}
            <div className="bg-white border border-[#EFE9E0] rounded-2xl p-4 space-y-2 shadow-sm">
              <label className="text-xs font-bold text-[#24211D] block">
                Выберите номер столика:
              </label>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setSelectedQrTable(num)}
                    className={`w-9 h-9 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      selectedQrTable === num
                        ? 'bg-[#B86B3E] text-white border-[#B86B3E] font-black shadow-sm'
                        : 'bg-[#FBF9F5] text-[#7E766D] border-[#EFE9E0] hover:border-[#DFD5C7]'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Макет тейбл-тента для печати */}
            <div className="bg-white text-[#24211D] rounded-3xl p-6 text-center space-y-3 shadow-xl max-w-sm mx-auto border-2 border-[#EFE9E0]">
              <div className="text-[11px] uppercase font-bold text-[#B86B3E] tracking-wider">
                {cafeInfo.name}
              </div>

              <div className="text-xl font-black text-[#24211D]">
                СТОЛИК №{selectedQrTable}
              </div>

              <div className="w-48 h-48 bg-[#FBF9F5] rounded-2xl mx-auto border border-[#EFE9E0] p-3 flex flex-col items-center justify-center">
                <QrCode className="w-24 h-24 text-[#24211D]" />
                <span className="text-[9px] font-mono text-[#8C7A6B] mt-2 break-all bg-white px-2 py-1 rounded-lg border border-[#EFE9E0]">
                  /?table={selectedQrTable}&token={generateTableToken(selectedQrTable)}
                </span>
              </div>

              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#2F6B42] bg-[#EBF5ED] px-3 py-1 rounded-full border border-[#D5EADB]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Anti-Fraud защита столика активна</span>
              </div>

              <p className="text-xs font-bold text-[#4A433B]">
                Наведите камеру смартфона для просмотра меню и заказа
              </p>

              <div className="pt-1 text-[10px] text-[#A8A095]">
                Wi-Fi: <strong>{cafeInfo.wifiName}</strong> / Пароль: <strong>{cafeInfo.wifiPass}</strong>
              </div>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => window.print()}
                className="bg-[#B86B3E] hover:bg-[#A3592E] text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Распечатать наклейку для столика №{selectedQrTable}</span>
              </button>
            </div>
          </div>
        )}

        {/* ВКЛАДКА 5: АНАЛИТИКА */}
        {effectiveTab === 'analytics' && (
          <div className="space-y-4 max-w-4xl">
            <h2 className="text-base font-black text-[#24211D] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#2F6B42]" />
              <span>Аналитика продаж и средний чек смены</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white border border-[#EFE9E0] p-4 rounded-3xl shadow-sm">
                <span className="text-xs text-[#7E766D] block font-medium">Выручка за смену</span>
                <strong className="text-2xl font-black text-[#2F6B42]">{totalRevenue} {cafeInfo.currency}</strong>
                <span className="text-[10px] text-[#8C7A6B] block mt-1">+14% по сравнению со вчера</span>
              </div>
              <div className="bg-white border border-[#EFE9E0] p-4 rounded-3xl shadow-sm">
                <span className="text-xs text-[#7E766D] block font-medium">Количество чеков</span>
                <strong className="text-2xl font-black text-[#24211D]">{orders.length}</strong>
                <span className="text-[10px] text-[#8C7A6B] block mt-1">Выдано: {completedOrders.length}</span>
              </div>
              <div className="bg-white border border-[#EFE9E0] p-4 rounded-3xl shadow-sm">
                <span className="text-xs text-[#7E766D] block font-medium">Средний чек гостя</span>
                <strong className="text-2xl font-black text-[#B86B3E]">{averageBill} {cafeInfo.currency}</strong>
                <span className="text-[10px] text-[#8C7A6B] block mt-1">По всем столам заведения</span>
              </div>
            </div>

            {/* Топ блюд (ABC-анализ) */}
            <div className="bg-white border border-[#EFE9E0] rounded-3xl p-5 space-y-3 shadow-sm">
              <h3 className="text-xs font-bold text-[#8C7A6B] uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-[#B86B3E]" />
                <span>Топ популярных позиций меню (Хиты продаж)</span>
              </h3>
              <div className="space-y-2">
                {items.slice(0, 4).map((dish, idx) => (
                  <div
                    key={dish.id}
                    className="flex items-center justify-between text-xs p-3 bg-[#FBF9F5] rounded-2xl border border-[#EFE9E0]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-black text-[#B86B3E] w-4">{idx + 1}.</span>
                      <span className="font-bold text-[#24211D]">{dish.name}</span>
                    </div>
                    <span className="font-black text-[#7E766D]">{dish.price} {cafeInfo.currency}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ВКЛАДКА 6: КАССА И ЭККМ ГНС КР */}
        {effectiveTab === 'kkm' && (
          <div className="space-y-5 max-w-5xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-[#24211D] flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#B86B3E]" />
                  <span>Реестр фискальных чеков ЭККМ (ГНС при МФ КР)</span>
                </h2>
                <p className="text-xs text-[#7E766D] mt-0.5">
                  Электронная контрольно-кассовая машина • Автоматическая фискализация заказов
                </p>
              </div>

              <div className="flex items-center gap-2 bg-[#EBF5ED] border border-[#D5EADB] px-3.5 py-1.5 rounded-2xl text-xs font-bold text-[#2F6B42]">
                <ShieldCheck className="w-4 h-4" />
                <span>ОФД: Онлайн • Статус ГНС КР: Активен</span>
              </div>
            </div>

            {/* Карточка реквизитов кассы */}
            <div className="bg-[#F4EBE3]/50 border border-[#E8DDD2] rounded-3xl p-4 text-xs space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[#7E766D]">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-[#8C7A6B]">Организация</span>
                  <span className="font-bold text-[#24211D]">ОсОО «Аура Ресторанс Групп»</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-[#8C7A6B]">ИНН</span>
                  <span className="font-mono font-bold text-[#24211D]">01204202310123</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-[#8C7A6B]">РН ККМ</span>
                  <span className="font-mono font-bold text-[#24211D]">0000854219</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-[#8C7A6B]">ЗН ФМ</span>
                  <span className="font-mono font-bold text-[#24211D]">FM-KG-99214</span>
                </div>
              </div>
            </div>

            {/* Сводные показатели кассы */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white border border-[#EFE9E0] p-4 rounded-3xl shadow-sm">
                <span className="text-xs text-[#7E766D] block font-medium">Фискализированная выручка</span>
                <strong className="text-2xl font-black text-[#2F6B42]">
                  {fiscalReceipts.reduce((acc, r) => acc + r.totalAmount, 0)} {cafeInfo.currency}
                </strong>
                <span className="text-[10px] text-[#8C7A6B] block mt-1">Передано в ГНС КР</span>
              </div>
              <div className="bg-white border border-[#EFE9E0] p-4 rounded-3xl shadow-sm">
                <span className="text-xs text-[#7E766D] block font-medium">Налог с продаж (НСП 2%)</span>
                <strong className="text-2xl font-black text-[#B86B3E]">
                  {fiscalReceipts.reduce((acc, r) => acc + r.taxTotalNsp, 0).toFixed(2)} {cafeInfo.currency}
                </strong>
                <span className="text-[10px] text-[#8C7A6B] block mt-1">Ставка для общепита КР</span>
              </div>
              <div className="bg-white border border-[#EFE9E0] p-4 rounded-3xl shadow-sm">
                <span className="text-xs text-[#7E766D] block font-medium">Количество пробитых чеков</span>
                <strong className="text-2xl font-black text-[#24211D]">
                  {fiscalReceipts.length}
                </strong>
                <span className="text-[10px] text-[#8C7A6B] block mt-1">Текущая смена #42</span>
              </div>
            </div>

            {/* Реестр чеков */}
            <div className="bg-white border border-[#EFE9E0] rounded-3xl p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#8C7A6B] uppercase tracking-wider">
                  Список фискальных документов
                </h3>
                <span className="text-xs text-[#7E766D]">
                  Всего: {fiscalReceipts.length} чеков
                </span>
              </div>

              {fiscalReceipts.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#7E766D] space-y-1">
                  <Receipt className="w-8 h-8 text-[#C4B8A9] mx-auto mb-2" />
                  <p className="font-bold text-[#24211D]">Фискальных чеков пока нет</p>
                  <p>Чеки автоматически формируются при оплате заказов через ELQR / MBANK / О!Деньги</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-[#EFE9E0] text-[10px] text-[#8C7A6B] uppercase font-bold">
                        <th className="py-2.5 px-3">№ ФД</th>
                        <th className="py-2.5 px-3">ФПД</th>
                        <th className="py-2.5 px-3">Стол</th>
                        <th className="py-2.5 px-3">Метод оплаты</th>
                        <th className="py-2.5 px-3">Сумма</th>
                        <th className="py-2.5 px-3">НСП (2%)</th>
                        <th className="py-2.5 px-3">Время</th>
                        <th className="py-2.5 px-3 text-right">Действие</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EFE9E0]/60">
                      {fiscalReceipts.map((receipt) => (
                        <tr key={receipt.id} className="hover:bg-[#FBF9F5] transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-[#24211D]">
                            №{receipt.fiscalDocNumber}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-[#7E766D]">
                            {receipt.fiscalSign}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-[#B86B3E]">
                            Стол №{receipt.tableNumber}
                          </td>
                          <td className="py-2.5 px-3 uppercase text-[10px] font-semibold text-[#7E766D]">
                            {getPaymentLabel(receipt.paymentMethod)}
                          </td>
                          <td className="py-2.5 px-3 font-black text-[#24211D]">
                            {receipt.totalAmount} {cafeInfo.currency}
                          </td>
                          <td className="py-2.5 px-3 text-[#7E766D]">
                            {receipt.taxTotalNsp.toFixed(2)} {cafeInfo.currency}
                          </td>
                          <td className="py-2.5 px-3 text-[10px] text-[#7E766D]">
                            {new Date(receipt.createdAt).toLocaleTimeString('ru-RU', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="py-2.5 px-3 text-right space-x-2">
                            <button
                              type="button"
                              onClick={() => setSelectedFiscalOrderId(receipt.orderId)}
                              className="text-[11px] font-bold text-[#B86B3E] hover:underline cursor-pointer"
                            >
                              Чек
                            </button>
                            <a
                              href={receipt.verificationUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] font-bold text-[#2F6B42] hover:underline inline-flex items-center gap-0.5"
                              title="Проверить в ГНС КР salyk.kg"
                            >
                              <span>ГНС</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ВКЛАДКА 7: POS & СЕТЕВАЯ ПЕЧАТЬ ESC/POS */}
        {effectiveTab === 'pos' && (
          <PosPrinterManager />
        )}

        {/* ВКЛАДКА 8: ОТЗЫВЫ, РЕЙТИНГ & 2ГИС БИШКЕКА */}
        {effectiveTab === 'reviews' && (
          <ReviewsManager />
        )}

        {effectiveTab === 'menu' && (
          <MenuManager />
        )}
      </main>

      {/* Модальное окно чека ЭККМ */}
      <FiscalReceiptModal
        isOpen={Boolean(selectedFiscalOrderId)}
        onClose={() => setSelectedFiscalOrderId(null)}
        orderId={selectedFiscalOrderId || ''}
      />
    </div>
  );
}

export default function AdminPage(): React.JSX.Element {
  return (
    <MenuProvider>
      <AdminDashboardContent />
    </MenuProvider>
  );
}
