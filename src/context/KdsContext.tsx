'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  ReactNode,
} from 'react';
import { Order, OrderStatus, WaiterCall, WaiterCallReason, ServerEventData } from '@/types/menu';
import { playOrderChime, playWaiterCallChime } from '@/lib/audioAlert';
import { enqueueOfflineAction } from '@/lib/offlineSync';

export interface KdsContextValue {
  readonly orders: readonly Order[];
  readonly waiterCalls: readonly WaiterCall[];
  readonly activeOrder: Order | null;
  readonly updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  readonly callWaiter: (reason: WaiterCallReason) => void;
  readonly resolveWaiterCall: (callId: string) => void;
  readonly syncOrders: () => Promise<void>;
  readonly syncWaiterCalls: () => Promise<void>;
  readonly addOptimisticOrder: (order: Order) => void;
}

const KdsContext = createContext<KdsContextValue | undefined>(undefined);

export interface KdsProviderProps {
  readonly children: ReactNode;
  readonly tableNumber: number;
  readonly isSoundEnabled?: boolean;
  readonly onFiscalReceiptReceived?: (receipt: unknown) => void;
  readonly onStopListUpdated?: (stopList: string[]) => void;
  readonly onMenuUpdated?: () => void;
}

export function KdsProvider({
  children,
  tableNumber,
  isSoundEnabled = true,
  onFiscalReceiptReceived,
  onStopListUpdated,
  onMenuUpdated,
}: KdsProviderProps): React.JSX.Element {
  const [orders, setOrders] = useState<readonly Order[]>([]);
  const [waiterCalls, setWaiterCalls] = useState<readonly WaiterCall[]>([]);
  const isSoundEnabledRef = useRef<boolean>(isSoundEnabled);

  useEffect(() => {
    isSoundEnabledRef.current = isSoundEnabled;
  }, [isSoundEnabled]);

  // Синхронизация заказов с сервером с учетом токена персонала и номера столика
  const syncOrders = useCallback(async (): Promise<void> => {
    try {
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('staff_session_token') : null;
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const url = token
        ? '/api/orders'
        : tableNumber
        ? `/api/orders?table=${tableNumber}`
        : '/api/orders';

      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          const serverOrders = data.data as Order[];
          setOrders((prev) => {
            const map = new Map<string, Order>();
            for (const ord of prev) {
              map.set(ord.id, ord);
            }
            for (const sOrd of serverOrders) {
              const localOrd = map.get(sOrd.id);
              if (!localOrd) {
                map.set(sOrd.id, sOrd);
              } else {
                const sTime = new Date(sOrd.updatedAt || sOrd.createdAt).getTime();
                const lTime = new Date(localOrd.updatedAt || localOrd.createdAt).getTime();
                if (sTime >= lTime || sOrd.status !== localOrd.status) {
                  map.set(sOrd.id, { ...localOrd, ...sOrd });
                }
              }
            }
            return Array.from(map.values()).sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          });
        }
      }
    } catch {
      // Игнорируем фоновые ошибки сети
    }
  }, [tableNumber]);

  // Синхронизация вызовов официанта
  const syncWaiterCalls = useCallback(async (): Promise<void> => {
    try {
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('staff_session_token') : null;
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const url = token
        ? '/api/waiter-calls'
        : tableNumber
        ? `/api/waiter-calls?table=${tableNumber}`
        : '/api/waiter-calls';

      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          const serverCalls = data.data as WaiterCall[];
          setWaiterCalls(serverCalls);
        }
      }
    } catch {
      // Игнорируем фоновые ошибки сети
    }
  }, [tableNumber]);

  // Первоначальная загрузка заказов и вызовов при монтировании
  useEffect(() => {
    void syncOrders();
    void syncWaiterCalls();
  }, [syncOrders, syncWaiterCalls]);

  // Периодический опрос сервера каждые 2.5 секунды для мгновенной синхронизации KDS и гостя
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        void syncOrders();
        void syncWaiterCalls();
      }
    }, 2500);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void syncOrders();
        void syncWaiterCalls();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [syncOrders, syncWaiterCalls]);

  // Подключение к серверному SSE потоку для real-time синхронизации
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource('/api/orders/live');

      eventSource.onmessage = (event: MessageEvent) => {
        try {
          const parsed = JSON.parse(event.data) as ServerEventData;

          switch (parsed.type) {
            case 'INIT': {
              const data = parsed.payload as {
                orders: Order[];
                waiterCalls: WaiterCall[];
                stopList: string[];
              };
              if (data.orders) setOrders(data.orders);
              if (data.waiterCalls) setWaiterCalls(data.waiterCalls);
              if (data.stopList && onStopListUpdated) onStopListUpdated(data.stopList);
              break;
            }
            case 'NEW_ORDER': {
              const newOrder = parsed.payload as Order;
              setOrders((prev) => {
                const exists = prev.some((o) => o.id === newOrder.id);
                return exists ? prev : [newOrder, ...prev];
              });
              if (isSoundEnabledRef.current) {
                playOrderChime();
              }
              break;
            }
            case 'UPDATE_ORDER': {
              const updatedOrder = parsed.payload as Order;
              setOrders((prev) =>
                prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
              );
              break;
            }
            case 'NEW_WAITER_CALL': {
              const newCall = parsed.payload as WaiterCall;
              setWaiterCalls((prev) => {
                const exists = prev.some((c) => c.id === newCall.id);
                return exists ? prev : [newCall, ...prev];
              });
              if (isSoundEnabledRef.current) {
                playWaiterCallChime();
              }
              break;
            }
            case 'RESOLVE_WAITER_CALL': {
              const resolvedCall = parsed.payload as WaiterCall;
              setWaiterCalls((prev) =>
                prev.map((c) => (c.id === resolvedCall.id ? resolvedCall : c))
              );
              break;
            }
            case 'UPDATE_STOPLIST': {
              const list = parsed.payload as string[];
              if (onStopListUpdated) onStopListUpdated(list);
              break;
            }
            case 'MENU_UPDATED': {
              if (onMenuUpdated) onMenuUpdated();
              break;
            }
            case 'PAYMENT_SUCCESS': {
              const data = parsed.payload as {
                order?: Order;
                fiscalReceipt?: unknown;
              };
              if (data.order) {
                const updatedOrder = data.order;
                setOrders((prev) =>
                  prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
                );
              }
              if (data.fiscalReceipt && onFiscalReceiptReceived) {
                onFiscalReceiptReceived(data.fiscalReceipt);
              }
              break;
            }
            case 'NEW_FISCAL_RECEIPT': {
              if (onFiscalReceiptReceived) {
                onFiscalReceiptReceived(parsed.payload);
              }
              break;
            }
            default:
              break;
          }
        } catch {
          // Игнорируем heartbeat сообщения
        }
      };
    } catch {
      // Игнорируем ошибки соединения SSE
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [onFiscalReceiptReceived, onStopListUpdated, onMenuUpdated]);

  const addOptimisticOrder = useCallback((order: Order): void => {
    setOrders((prev) => [order, ...prev]);
  }, []);

  const updateOrderStatus = useCallback((orderId: string, status: OrderStatus): void => {
    const now = new Date().toISOString();

    // Оптимистичное локальное обновление
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, status, updatedAt: now } : ord))
    );

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (typeof window !== 'undefined') {
      const token = sessionStorage.getItem('aura_staff_token') || sessionStorage.getItem('staff_session_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status }),
    }).catch(() => {
      // Фолбэк при сетевой ошибке
    });
  }, []);

  const callWaiter = useCallback(
    (reason: WaiterCallReason): void => {
      const newCall: WaiterCall = {
        id: `call-${Date.now().toString(36).toUpperCase()}`,
        tableNumber,
        reason,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      setWaiterCalls((prev) => [newCall, ...prev]);

      fetch('/api/waiter-calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableNumber, reason }),
      }).catch(() => {
        enqueueOfflineAction(
          'CALL_WAITER',
          '/api/waiter-calls',
          { tableNumber, reason },
          `Вызов официанта (${reason}) на столик №${tableNumber}`
        );
      });
    },
    [tableNumber]
  );

  const resolveWaiterCall = useCallback((callId: string): void => {
    setWaiterCalls((prev) =>
      prev.map((call) => (call.id === callId ? { ...call, status: 'resolved' } : call))
    );

    const headers: Record<string, string> = {};
    if (typeof window !== 'undefined') {
      const token = sessionStorage.getItem('aura_staff_token') || sessionStorage.getItem('staff_session_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    fetch(`/api/waiter-calls/${callId}`, {
      method: 'PATCH',
      headers,
    }).catch(() => {
      // Фолбэк при сетевой ошибке
    });
  }, []);

  // Вычисление активного заказа столика
  const activeOrder = useMemo((): Order | null => {
    // 1. Приоритет: текущий незавершенный заказ стола
    const inProgressOrder = orders.find(
      (o) =>
        o.tableNumber === tableNumber &&
        (o.status === 'pending' ||
          o.status === 'accepted' ||
          o.status === 'cooking' ||
          o.status === 'ready' ||
          o.status === 'served')
    );
    if (inProgressOrder) return inProgressOrder;

    // 2. Если незавершенных нет, берем последний оплаченный заказ за последние 2 часа
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
    const recentPaidOrder = orders.find(
      (o) =>
        o.tableNumber === tableNumber &&
        o.status === 'paid' &&
        new Date(o.createdAt).getTime() > twoHoursAgo
    );
    return recentPaidOrder ?? null;
  }, [orders, tableNumber]);

  const value: KdsContextValue = useMemo(
    () => ({
      orders,
      waiterCalls,
      activeOrder,
      updateOrderStatus,
      callWaiter,
      resolveWaiterCall,
      syncOrders,
      syncWaiterCalls,
      addOptimisticOrder,
    }),
    [
      orders,
      waiterCalls,
      activeOrder,
      updateOrderStatus,
      callWaiter,
      resolveWaiterCall,
      syncOrders,
      syncWaiterCalls,
      addOptimisticOrder,
    ]
  );

  return <KdsContext.Provider value={value}>{children}</KdsContext.Provider>;
}

export function useKds(): KdsContextValue {
  const context = useContext(KdsContext);
  if (!context) {
    throw new Error('useKds must be used within a KdsProvider');
  }
  return context;
}
