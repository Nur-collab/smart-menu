'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useMenu } from '@/context/MenuContext';
import { OrderStatus } from '@/types/menu';
import { StaffMember, getPermissionsByRole } from '@/types/auth';
import { PinPadLockScreen } from '@/components/admin/PinPadLockScreen';
import {
  X,
  CookingPot,
  BellRing,
  Ban,
  Check,
  ArrowRight,
  Receipt,
  UserCheck,
  LogOut,
} from 'lucide-react';

export function AdminPanelModal(): React.JSX.Element | null {
  const {
    activeModal,
    setActiveModal,
    orders,
    updateOrderStatus,
    items,
    stopList,
    toggleStopList,
    waiterCalls,
    resolveWaiterCall,
    cafeInfo,
    openFiscalReceiptModal,
  } = useMenu();

  const [currentStaff, setCurrentStaff] = useState<StaffMember | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = sessionStorage.getItem('aura_staff_session');
      if (saved) return JSON.parse(saved) as StaffMember;
    } catch {
      return null;
    }
    return null;
  });

  const [activeTab, setActiveTab] = useState<'kds' | 'stoplist' | 'calls'>('kds');

  if (activeModal !== 'admin') return null;

  if (!currentStaff) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 bg-[#24211D]/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fadeIn"
        onClick={() => setActiveModal(null)}
      >
        <div
          className="w-full max-w-sm bg-[#FBF9F5] border border-[#EFE9E0] rounded-3xl p-5 shadow-2xl relative animate-scaleUp"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px] font-bold text-[#8C7A6B]">Авторизация персонала</span>
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="p-1.5 text-[#A8A095] hover:text-[#24211D] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <PinPadLockScreen
            onAuthenticated={(staff) => {
              setCurrentStaff(staff);
              try {
                sessionStorage.setItem('aura_staff_session', JSON.stringify(staff));
              } catch {
                // ignore
              }
              if (staff.role === 'waiter') {
                setActiveTab('calls');
              } else {
                setActiveTab('kds');
              }
            }}
            cafeName={cafeInfo.name}
          />
        </div>
      </div>
    );
  }

  const permissions = getPermissionsByRole(currentStaff.role);

  const canAdvanceStatus = (next: OrderStatus): boolean => {
    if (next === 'cooking' || next === 'ready') {
      return permissions.canCookOrders;
    }
    if (next === 'served') {
      return permissions.canServeOrders;
    }
    return false;
  };

  const handleLogout = (): void => {
    setCurrentStaff(null);
    try {
      sessionStorage.removeItem('aura_staff_session');
    } catch {
      // ignore
    }
  };

  const pendingCalls = waiterCalls.filter((c) => c.status === 'pending');
  const activeOrders = orders.filter((o) => o.status !== 'cancelled' && o.status !== 'served');
  const totalRevenue = orders.reduce((acc, o) => acc + o.finalAmount, 0);

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

  const getStatusBadge = (status: OrderStatus): React.JSX.Element => {
    switch (status) {
      case 'pending':
        return (
          <span className="bg-[#F4EBE3] text-[#B86B3E] border border-[#E8DDD2] px-2 py-0.5 rounded-full text-[10px] font-bold">
            Ожидает шефа
          </span>
        );
      case 'cooking':
        return (
          <span className="bg-[#EDF3FA] text-[#356BB3] border border-[#D5E4F5] px-2 py-0.5 rounded-full text-[10px] font-bold">
            На плите / баре
          </span>
        );
      case 'ready':
        return (
          <span className="bg-[#EBF5ED] text-[#2F6B42] border border-[#D5EADB] px-2 py-0.5 rounded-full text-[10px] font-bold animate-pulse">
            Готов к выдаче!
          </span>
        );
      case 'served':
        return (
          <span className="bg-[#F4EBE3] text-[#7E766D] px-2 py-0.5 rounded-full text-[10px]">
            Выдан
          </span>
        );
      default:
        return (
          <span className="bg-[#F4EBE3] text-[#7E766D] px-2 py-0.5 rounded-full text-[10px]">
            {status}
          </span>
        );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-[#24211D]/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fadeIn"
      onClick={() => setActiveModal(null)}
    >
      <div
        className="w-full max-w-2xl bg-[#FBF9F5] border border-[#EFE9E0] rounded-3xl p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col animate-scaleUp relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Шапка панели */}
        <div className="flex items-center justify-between border-b border-[#EFE9E0] pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-[#F4EBE3] text-[#B86B3E] rounded-2xl border border-[#E8DDD2]">
              <CookingPot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#24211D] flex items-center gap-2">
                <span>Панель управления кафе (KDS)</span>
                <span className="text-[10px] bg-[#B86B3E] text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  {currentStaff.role}
                </span>
              </h3>
              <p className="text-xs text-[#7E766D]">
                Сотрудник: <strong>{currentStaff.name}</strong> ({currentStaff.roleTitle})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              onClick={() => setActiveModal(null)}
              className="px-2.5 py-1.5 bg-[#F4EBE3] hover:bg-[#E8DDD2] text-[#B86B3E] rounded-xl text-xs font-bold transition-all flex items-center gap-1"
              title="Открыть полноэкранный терминал KDS"
            >
              <span className="hidden sm:inline">Терминал /admin</span>
              <ArrowRight className="w-3 h-3" />
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 text-[#7E766D] hover:text-[#B83A4A] transition-colors cursor-pointer"
              title="Сменить сотрудника / Завершить смену"
            >
              <LogOut className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="p-1.5 text-[#A8A095] hover:text-[#24211D] transition-colors cursor-pointer"
              title="Закрыть панель"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Быстрая статистика */}
        <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
          <div className="bg-white p-3 rounded-2xl border border-[#EFE9E0] shadow-sm">
            <span className="text-[#8C7A6B] text-[10px] block font-semibold uppercase">Активные чеки</span>
            <strong className="text-[#24211D] text-base font-black">{activeOrders.length}</strong>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-[#EFE9E0] shadow-sm">
            <span className="text-[#8C7A6B] text-[10px] block font-semibold uppercase">Вызовы зала</span>
            <strong className="text-[#B86B3E] text-base font-black">
              {pendingCalls.length}
            </strong>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-[#EFE9E0] shadow-sm">
            {permissions.canViewAnalytics ? (
              <>
                <span className="text-[#8C7A6B] text-[10px] block font-semibold uppercase">Выручка</span>
                <strong className="text-[#2F6B42] text-base font-black">
                  {totalRevenue} {cafeInfo.currency}
                </strong>
              </>
            ) : (
              <>
                <span className="text-[#8C7A6B] text-[10px] block font-semibold uppercase">Смена</span>
                <strong className="text-[#2F6B42] text-xs font-black flex items-center justify-center gap-1 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2F6B42] animate-pulse" />
                  Активна
                </strong>
              </>
            )}
          </div>
        </div>

        {/* Вкладки переключения разделов */}
        <div className="flex gap-2 bg-[#F4EBE3]/70 p-1 rounded-2xl border border-[#E8DDD2] shrink-0">
          {permissions.canViewKds && (
            <button
              type="button"
              onClick={() => setActiveTab('kds')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'kds'
                  ? 'bg-white text-[#24211D] shadow-sm'
                  : 'text-[#7E766D] hover:text-[#24211D]'
              }`}
            >
              <Receipt className="w-3.5 h-3.5 text-[#B86B3E]" />
              <span>Заказы ({activeOrders.length})</span>
            </button>
          )}

          {permissions.canManageStopList && (
            <button
              type="button"
              onClick={() => setActiveTab('stoplist')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'stoplist'
                  ? 'bg-white text-[#24211D] shadow-sm'
                  : 'text-[#7E766D] hover:text-[#24211D]'
              }`}
            >
              <Ban className="w-3.5 h-3.5 text-[#B83A4A]" />
              <span>Стоп-лист ({stopList.size})</span>
            </button>
          )}

          {permissions.canHandleCalls && (
            <button
              type="button"
              onClick={() => setActiveTab('calls')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'calls'
                  ? 'bg-white text-[#24211D] shadow-sm'
                  : 'text-[#7E766D] hover:text-[#24211D]'
              }`}
            >
              <BellRing className="w-3.5 h-3.5 text-[#B86B3E]" />
              <span>Вызовы ({pendingCalls.length})</span>
            </button>
          )}
        </div>

        {/* Тело выбранной вкладки */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {/* ВКЛАДКА: ЗАКАЗЫ КУХНИ */}
          {activeTab === 'kds' && (
            <>
              {orders.length === 0 ? (
                <div className="py-12 text-center text-[#8C7A6B] text-xs">
                  Заказов пока нет. Оформите тестовый заказ в меню!
                </div>
              ) : (
                orders.map((order) => {
                  const nextStatus = getNextStatus(order.status);

                  return (
                    <div
                      key={order.id}
                      className="bg-white border border-[#EFE9E0] rounded-2xl p-4 space-y-3 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-[#24211D]">
                            Стол №{order.tableNumber}
                          </span>
                          <span className="text-[10px] text-[#A8A095] font-mono">
                            #{order.id}
                          </span>
                        </div>
                        {getStatusBadge(order.status)}
                      </div>

                      {/* Список позиций в чеке */}
                      <div className="space-y-1.5 bg-[#FBF9F5] p-3 rounded-xl border border-[#EFE9E0] text-xs">
                        {order.items.map((i) => (
                          <div
                            key={i.cartItemId}
                            className="flex justify-between text-[#4A433B]"
                          >
                            <span>
                              <strong className="text-[#B86B3E] font-black">{i.quantity}×</strong>{' '}
                              <span className="font-medium text-[#24211D]">{i.menuItem?.name || 'Позиция'}</span>
                              {Boolean(i.selectedOptions && i.selectedOptions.length > 0) && (
                                <span className="text-[10px] text-[#8C7A6B] ml-1">
                                  ({i.selectedOptions?.map((o) => o.optionName).join(', ')})
                                </span>
                              )}
                            </span>
                            <span className="font-bold text-[#7E766D]">
                              {i.unitPrice * i.quantity} {cafeInfo.currency}
                            </span>
                          </div>
                        ))}
                      </div>

                      {order.guestComment && (
                        <p className="text-[11px] text-[#B86B3E] italic">
                          Примечание: «{order.guestComment}»
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-1 border-t border-[#EFE9E0]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-[#24211D]">
                            Итого: {order.finalAmount} {cafeInfo.currency}
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
                          <button
                            type="button"
                            onClick={() => openFiscalReceiptModal(order.id)}
                            className="text-[10px] text-[#B86B3E] hover:underline flex items-center gap-0.5 ml-1"
                            title="Посмотреть фискальный чек"
                          >
                            <Receipt className="w-3 h-3" />
                            <span>Чек</span>
                          </button>
                        </div>

                        {nextStatus ? (
                          canAdvanceStatus(nextStatus) ? (
                            <button
                              type="button"
                              onClick={() => updateOrderStatus(order.id, nextStatus)}
                              className="flex items-center gap-1.5 bg-[#B86B3E] hover:bg-[#A3592E] text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all shadow-sm cursor-pointer"
                            >
                              <span>
                                {nextStatus === 'cooking' && 'Начать готовить'}
                                {nextStatus === 'ready' && 'Готово к выдаче'}
                                {nextStatus === 'served' && 'Отметить поданным'}
                              </span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="text-[11px] font-bold text-[#8C7A6B] bg-[#F4EBE3] px-2.5 py-1 rounded-xl">
                              {nextStatus === 'cooking' && 'Ждёт повара'}
                              {nextStatus === 'ready' && 'Готовит кухня'}
                              {nextStatus === 'served' && 'Ожидает официанта'}
                            </span>
                          )
                        ) : (
                          <span className="text-[#2F6B42] text-xs font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Заказ закрыт
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}

          {/* ВКЛАДКА: СТОП-ЛИСТ */}
          {activeTab === 'stoplist' && (
            <div className="space-y-2">
              <p className="text-xs text-[#7E766D] mb-2">
                Кликните по блюду, чтобы мгновенно включить или отключить его доступность для гостей:
              </p>
              {items.map((item) => {
                const isBlocked = stopList.has(item.id);

                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                      isBlocked
                        ? 'bg-[#FDF2F4] border-[#F8D2D7] text-[#7E766D]'
                        : 'bg-white border-[#EFE9E0] text-[#24211D] shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className={`w-10 h-10 rounded-xl object-cover ${
                          isBlocked ? 'grayscale' : ''
                        }`}
                      />
                      <div>
                        <h4 className="text-xs font-bold">{item.name}</h4>
                        <span className="text-[11px] text-[#B86B3E] font-bold">
                          {item.price} {cafeInfo.currency}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleStopList(item.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
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
          )}

          {/* ВКЛАДКА: ВЫЗОВЫ ОФИЦИАНТА */}
          {activeTab === 'calls' && (
            <div className="space-y-2">
              {waiterCalls.length === 0 ? (
                <div className="py-12 text-center text-[#8C7A6B] text-xs">
                  Активных вызовов официанта нет. Все столики обслужены!
                </div>
              ) : (
                waiterCalls.map((call) => (
                  <div
                    key={call.id}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                      call.status === 'pending'
                        ? 'bg-[#F4EBE3] border-[#E8DDD2] shadow-sm'
                        : 'bg-white border-[#EFE9E0] opacity-60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-[#24211D]">
                          Стол №{call.tableNumber}
                        </span>
                        <span className="text-[10px] text-[#8C7A6B]">
                          {new Date(call.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-[#B86B3E] mt-0.5">
                        {call.reason === 'bill' && '💳 Просят счет'}
                        {call.reason === 'help' && '🙋 Требуется официант'}
                        {call.reason === 'cutlery' && '🍴 Принести приборы/салфетки'}
                        {call.reason === 'clean' && '🧹 Убрать со стола'}
                      </p>
                    </div>

                    {call.status === 'pending' ? (
                      <button
                        type="button"
                        onClick={() => resolveWaiterCall(call.id)}
                        className="bg-[#2F6B42] hover:bg-[#255434] text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-sm transition-all flex items-center gap-1"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Выполнено</span>
                      </button>
                    ) : (
                      <span className="text-xs text-[#2F6B42] font-semibold">
                        Обслужено ✓
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
