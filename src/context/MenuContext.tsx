'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import {
  CafeInfo,
  Category,
  MenuItem,
  CartItem,
  Order,
  OrderStatus,
  PaymentMethod,
  WaiterCall,
  WaiterCallReason,
  SelectedOption,
  BadgeType,
  ServerEventData,
} from '@/types/menu';
import { FiscalReceipt } from '@/types/payment';
import { CAFE_INFO, CATEGORIES, MENU_ITEMS } from '@/data/mockData';
import { playOrderChime, playWaiterCallChime, unlockAudio } from '@/lib/audioAlert';
import { Language, Translations, DICTIONARY } from '@/lib/i18n';
import { calculateItemPrice, isDefaultHappyHoursTime, PriceCalculationResult } from '@/lib/pricingEngine';
import { enqueueOfflineAction } from '@/lib/offlineSync';

interface SubmitOrderParams {
  readonly paymentMethod: PaymentMethod;
  readonly tipAmount: number;
  readonly discountAmount: number;
  readonly comment?: string;
}

export type ModalType =
  | 'cart'
  | 'waiter'
  | 'split'
  | 'admin'
  | 'tracker'
  | 'payment'
  | 'fiscal'
  | 'sommelier'
  | 'review'
  | null;

interface MenuContextValue {
  readonly cafeInfo: CafeInfo;
  readonly categories: readonly Category[];
  readonly items: readonly MenuItem[];
  readonly cart: readonly CartItem[];
  readonly tableNumber: number;
  readonly setTableNumber: (table: number) => void;
  readonly stopList: ReadonlySet<string>;
  readonly toggleStopList: (itemId: string) => void;
  readonly orders: readonly Order[];
  readonly waiterCalls: readonly WaiterCall[];
  readonly activeFilter: BadgeType | null;
  readonly setActiveFilter: (filter: BadgeType | null) => void;
  readonly searchQuery: string;
  readonly setSearchQuery: (query: string) => void;
  readonly selectedCategory: string;
  readonly setSelectedCategory: (categoryId: string) => void;
  readonly addToCart: (
    item: MenuItem,
    selectedOptions?: readonly SelectedOption[],
    comment?: string
  ) => void;
  readonly updateCartItemQuantity: (cartItemId: string, delta: number) => void;
  readonly removeCartItem: (cartItemId: string) => void;
  readonly clearCart: () => void;
  readonly submitOrder: (params: SubmitOrderParams) => Order;
  readonly updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  readonly callWaiter: (reason: WaiterCallReason) => void;
  readonly resolveWaiterCall: (callId: string) => void;
  readonly activeModal: ModalType;
  readonly setActiveModal: (modal: ModalType) => void;
  readonly currentPayingOrderId: string | null;
  readonly setCurrentPayingOrderId: (id: string | null) => void;
  readonly activeFiscalReceipt: FiscalReceipt | null;
  readonly setActiveFiscalReceipt: (receipt: FiscalReceipt | null) => void;
  readonly openPaymentModal: (orderId: string) => void;
  readonly openFiscalReceiptModal: (orderId: string, receipt?: FiscalReceipt) => void;
  readonly selectedItemForDetails: MenuItem | null;
  readonly setSelectedItemForDetails: (item: MenuItem | null) => void;
  readonly activeOrder: Order | null;
  readonly userBonusBalance: number;
  readonly cartSubtotal: number;
  readonly cartItemsCount: number;
  readonly isSoundEnabled: boolean;
  readonly toggleSound: () => void;
  readonly language: Language;
  readonly setLanguage: (lang: Language) => void;
  readonly t: (key: keyof Translations) => string;
  readonly isHappyHoursActive: boolean;
  readonly toggleHappyHours: () => void;
  readonly weatherType: 'sunny' | 'rain' | 'cold';
  readonly setWeatherType: (weather: 'sunny' | 'rain' | 'cold') => void;
  readonly getItemPriceWithDiscount: (item: MenuItem) => PriceCalculationResult;
  readonly openSommelierModal: () => void;
  readonly openReviewModal: (orderId?: string) => void;
  readonly addBonusPoints: (amount: number) => void;
  readonly refreshMenu: () => Promise<void>;
}

const MenuContext = createContext<MenuContextValue | undefined>(undefined);

interface MenuProviderProps {
  readonly children: ReactNode;
}

export function MenuProvider({ children }: MenuProviderProps): React.JSX.Element {
  const [cafeInfo, setCafeInfo] = useState<CafeInfo>(CAFE_INFO);
  const [categories, setCategories] = useState<readonly Category[]>(CATEGORIES);
  const [items, setItems] = useState<readonly MenuItem[]>(MENU_ITEMS);

  const refreshMenu = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch('/api/menu');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (Array.isArray(data.categories)) setCategories(data.categories);
          if (Array.isArray(data.items)) setItems(data.items);
          if (data.cafeInfo) setCafeInfo(data.cafeInfo);
        }
      }
    } catch (err) {
      console.warn('Failed to refresh menu from /api/menu:', err);
    }
  }, []);

  useEffect(() => {
    void refreshMenu();
  }, [refreshMenu]);

  // Инициализация столика из URL-параметров (например, ?table=7) или по умолчанию 4
  const [tableNumber, setTableNumber] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tableParam = params.get('table');
      if (tableParam !== null) {
        const parsed = parseInt(tableParam, 10);
        if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= 50) {
          return parsed;
        }
      }
    }
    return 4;
  });

  const [cart, setCart] = useState<readonly CartItem[]>([]);
  const [stopList, setStopList] = useState<ReadonlySet<string>>(new Set<string>());
  const [orders, setOrders] = useState<readonly Order[]>([]);
  const [waiterCalls, setWaiterCalls] = useState<readonly WaiterCall[]>([]);
  const [activeFilter, setActiveFilter] = useState<BadgeType | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>(CATEGORIES[0].id);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [currentPayingOrderId, setCurrentPayingOrderId] = useState<string | null>(null);
  const [activeFiscalReceipt, setActiveFiscalReceipt] = useState<FiscalReceipt | null>(null);
  const [selectedItemForDetails, setSelectedItemForDetails] = useState<MenuItem | null>(null);
  const [userBonusBalance, setUserBonusBalance] = useState<number>(350);
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);
  const isSoundEnabledRef = useRef<boolean>(isSoundEnabled);

  useEffect(() => {
    isSoundEnabledRef.current = isSoundEnabled;
  }, [isSoundEnabled]);

  // Мультиязычность (SSR-safe инициализация без гидратационных сбоев)
  const [language, setLanguageState] = useState<Language>('ru');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aura_lang_preference') as Language;
      if (saved === 'ru' || saved === 'kg' || saved === 'en') {
        setLanguageState(saved);
      }
    }
  }, []);

  const setLanguage = useCallback((lang: Language): void => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('aura_lang_preference', lang);
    }
  }, []);

  const t = useCallback(
    (key: keyof Translations): string => {
      return DICTIONARY[language]?.[key] ?? DICTIONARY.ru[key] ?? '';
    },
    [language]
  );

  // Динамические Happy Hours (-20% на десерты и выпечку)
  const [isHappyHoursActive, setIsHappyHoursActive] = useState<boolean>(isDefaultHappyHoursTime);

  const toggleHappyHours = useCallback((): void => {
    setIsHappyHoursActive((prev) => !prev);
  }, []);

  // Погодный контекст Бишкека
  const [weatherType, setWeatherType] = useState<'sunny' | 'rain' | 'cold'>('sunny');

  const getItemPriceWithDiscount = useCallback(
    (item: MenuItem): PriceCalculationResult => {
      return calculateItemPrice(item, isHappyHoursActive);
    },
    [isHappyHoursActive]
  );

  const openSommelierModal = useCallback((): void => {
    setActiveModal('sommelier');
  }, []);

  const toggleSound = useCallback((): void => {
    unlockAudio();
    setIsSoundEnabled((prev) => !prev);
  }, []);

  const openPaymentModal = useCallback((orderId: string): void => {
    setCurrentPayingOrderId(orderId);
    setActiveModal('payment');
  }, []);

  const openFiscalReceiptModal = useCallback(
    (orderId: string, receipt?: FiscalReceipt): void => {
      setCurrentPayingOrderId(orderId);
      if (receipt) {
        setActiveFiscalReceipt(receipt);
      }
      setActiveModal('fiscal');
    },
    []
  );

  const openReviewModal = useCallback((orderId?: string): void => {
    if (orderId) {
      setCurrentPayingOrderId(orderId);
    }
    setActiveModal('review');
  }, []);

  const addBonusPoints = useCallback((amount: number): void => {
    setUserBonusBalance((prev) => Math.max(0, prev + amount));
  }, []);

  // Синхронизация заказов с сервером (Neon PostgreSQL)
  const syncOrders = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch('/api/orders');
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
  }, []);

  // Синхронизация вызовов официанта
  const syncWaiterCalls = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch('/api/waiter-calls');
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
  }, []);

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

  // Подключение к серверному SSE потоку (Server-Sent Events) для real-time синхронизации
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
              if (data.stopList) setStopList(new Set(data.stopList));
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
              setStopList(new Set(list));
              break;
            }
            case 'MENU_UPDATED': {
              void refreshMenu();
              break;
            }
            case 'PAYMENT_SUCCESS': {
              const data = parsed.payload as {
                order?: Order;
                fiscalReceipt?: FiscalReceipt;
              };
              if (data.order) {
                const updatedOrder = data.order;
                setOrders((prev) =>
                  prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
                );
              }
              if (data.fiscalReceipt) {
                setActiveFiscalReceipt(data.fiscalReceipt);
              }
              break;
            }
            case 'NEW_FISCAL_RECEIPT': {
              const receipt = parsed.payload as FiscalReceipt;
              setActiveFiscalReceipt(receipt);
              break;
            }
            default:
              break;
          }
        } catch {
          // Игнорируем ошибки парсинга heartbeat сообщений
        }
      };
    } catch {
      // Фолбэк, если EventSource не поддерживается
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  const toggleStopList = useCallback((itemId: string): void => {
    // Оптимистичное локальное обновление
    setStopList((prev) => {
      const next = new Set<string>(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });

    // Отправка на центральный сервер с токеном авторизации сотрудника
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('staff_session_token') : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    fetch('/api/stoplist', {
      method: 'POST',
      headers,
      body: JSON.stringify({ itemId }),
    }).catch(() => {
      // Фолбэк при сетевой ошибке
    });
  }, []);

  const addToCart = useCallback(
    (
      item: MenuItem,
      selectedOptions: readonly SelectedOption[] = [],
      comment?: string
    ): void => {
      const priceInfo = calculateItemPrice(item, isHappyHoursActive);
      const optionsPrice = selectedOptions.reduce((acc, opt) => acc + opt.price, 0);
      const unitPrice = priceInfo.currentPrice + optionsPrice;

      const optionsKey = selectedOptions
        .map((opt) => opt.optionId)
        .sort()
        .join('-');
      const generatedId = `${item.id}-${optionsKey}-${comment ?? ''}`;

      setCart((prev) => {
        const existingIndex = prev.findIndex((ci) => ci.cartItemId === generatedId);
        if (existingIndex !== -1) {
          return prev.map((ci, idx) =>
            idx === existingIndex ? { ...ci, quantity: ci.quantity + 1 } : ci
          );
        }
        const newItem: CartItem = {
          cartItemId: generatedId,
          menuItem: {
            ...item,
            price: priceInfo.currentPrice,
            oldPrice: priceInfo.isHappyHoursDiscount ? item.price : item.oldPrice,
          },
          quantity: 1,
          selectedOptions,
          comment,
          unitPrice,
        };
        return [...prev, newItem];
      });
    },
    [isHappyHoursActive]
  );

  const updateCartItemQuantity = useCallback((cartItemId: string, delta: number): void => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.cartItemId === cartItemId) {
            const nextQuantity = item.quantity + delta;
            return nextQuantity > 0 ? { ...item, quantity: nextQuantity } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  }, []);

  const removeCartItem = useCallback((cartItemId: string): void => {
    setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  }, []);

  const clearCart = useCallback((): void => {
    setCart([]);
  }, []);

  const cartSubtotal = useMemo((): number => {
    return cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  }, [cart]);

  const cartItemsCount = useMemo((): number => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart]);

  const submitOrder = useCallback(
    ({ paymentMethod, tipAmount, discountAmount, comment }: SubmitOrderParams): Order => {
      const subtotal = cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
      const finalAmount = Math.max(0, subtotal - discountAmount + tipAmount);
      const now = new Date().toISOString();

      const newOrder: Order = {
        id: `ord-${Date.now().toString(36).toUpperCase()}`,
        tableNumber,
        items: [...cart],
        totalAmount: subtotal,
        discountAmount,
        tipAmount,
        finalAmount,
        paymentMethod,
        status: 'pending',
        guestComment: comment,
        createdAt: now,
        updatedAt: now,
      };

      // Оптимистичное локальное добавление
      setOrders((prev) => [newOrder, ...prev]);
      setCart([]);

      // Списание использованных бонусов гостя
      if (discountAmount > 0) {
        setUserBonusBalance((prev) => Math.max(0, prev - discountAmount));
      }

      // Заказ отправлен на кухню, переходим к отслеживанию статуса
      setCurrentPayingOrderId(newOrder.id);
      setActiveModal('tracker');

      // Отправка на центральный сервер для оповещения кухни
      fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder),
      }).catch(() => {
        // Локальное сохранение в оффлайн-очередь при отсутствии связи
        enqueueOfflineAction(
          'CREATE_ORDER',
          '/api/orders',
          newOrder as unknown as Record<string, unknown>,
          `Заказ столика №${tableNumber} (${newOrder.items.length} поз.)`
        );
      });

      return newOrder;
    },
    [cart, tableNumber]
  );

  const updateOrderStatus = useCallback((orderId: string, status: OrderStatus): void => {
    const now = new Date().toISOString();

    // Оптимистичное локальное обновление
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, status, updatedAt: now } : ord))
    );

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (typeof window !== 'undefined') {
      const token = sessionStorage.getItem('aura_staff_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    // Отправка на центральный сервер
    fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status }),
    }).catch(() => {
      // Фолбэк
    });
  }, []);

  const callWaiter = useCallback(
    (reason: WaiterCallReason): void => {
      const newCall: WaiterCall = {
        id: `call-${Date.now().toString(36)}`,
        tableNumber,
        reason,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      setWaiterCalls((prev) => [newCall, ...prev]);

      // Отправка на центральный сервер для оповещения персонала
      fetch('/api/waiter-calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableNumber, reason }),
      }).catch(() => {
        // Локальное сохранение в оффлайн-очередь при отсутствии связи
        enqueueOfflineAction(
          'CALL_WAITER',
          '/api/waiter-calls',
          { tableNumber, reason },
          `Вызов официанта к столику №${tableNumber} (${reason})`
        );
      });
    },
    [tableNumber]
  );

  const resolveWaiterCall = useCallback((callId: string): void => {
    setWaiterCalls((prev) =>
      prev.map((call) => (call.id === callId ? { ...call, status: 'resolved' } : call))
    );

    fetch(`/api/waiter-calls/${callId}`, {
      method: 'PATCH',
    }).catch(() => {
      // Фолбэк
    });
  }, []);

  const activeOrder = useMemo((): Order | null => {
    return (
      orders.find(
        (o) =>
          o.tableNumber === tableNumber &&
          (o.status === 'pending' ||
            o.status === 'accepted' ||
            o.status === 'cooking' ||
            o.status === 'ready' ||
            o.status === 'served')
      ) ?? null
    );
  }, [orders, tableNumber]);

  const contextValue: MenuContextValue = useMemo(
    () => ({
      cafeInfo,
      categories,
      items,
      cart,
      tableNumber,
      setTableNumber,
      stopList,
      toggleStopList,
      orders,
      waiterCalls,
      activeFilter,
      setActiveFilter,
      searchQuery,
      setSearchQuery,
      selectedCategory,
      setSelectedCategory,
      addToCart,
      updateCartItemQuantity,
      removeCartItem,
      clearCart,
      submitOrder,
      updateOrderStatus,
      callWaiter,
      resolveWaiterCall,
      activeModal,
      setActiveModal,
      currentPayingOrderId,
      setCurrentPayingOrderId,
      activeFiscalReceipt,
      setActiveFiscalReceipt,
      openPaymentModal,
      openFiscalReceiptModal,
      selectedItemForDetails,
      setSelectedItemForDetails,
      activeOrder,
      userBonusBalance,
      cartSubtotal,
      cartItemsCount,
      isSoundEnabled,
      toggleSound,
      language,
      setLanguage,
      t,
      isHappyHoursActive,
      toggleHappyHours,
      weatherType,
      setWeatherType,
      getItemPriceWithDiscount,
      openSommelierModal,
      openReviewModal,
      addBonusPoints,
      refreshMenu,
    }),
    [
      cafeInfo,
      categories,
      items,
      cart,
      tableNumber,
      stopList,
      toggleStopList,
      orders,
      waiterCalls,
      activeFilter,
      searchQuery,
      selectedCategory,
      addToCart,
      updateCartItemQuantity,
      removeCartItem,
      clearCart,
      submitOrder,
      updateOrderStatus,
      callWaiter,
      resolveWaiterCall,
      activeModal,
      currentPayingOrderId,
      activeFiscalReceipt,
      openPaymentModal,
      openFiscalReceiptModal,
      selectedItemForDetails,
      activeOrder,
      userBonusBalance,
      cartSubtotal,
      cartItemsCount,
      isSoundEnabled,
      toggleSound,
      language,
      setLanguage,
      t,
      isHappyHoursActive,
      toggleHappyHours,
      weatherType,
      setWeatherType,
      getItemPriceWithDiscount,
      openSommelierModal,
      openReviewModal,
      addBonusPoints,
      refreshMenu,
    ]
  );

  return <MenuContext.Provider value={contextValue}>{children}</MenuContext.Provider>;
}

export function useMenu(): MenuContextValue {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('useMenu must be used within a MenuProvider');
  }
  return context;
}
