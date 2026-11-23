'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
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
  SubmitOrderParams,
} from '@/types/menu';
import { FiscalReceipt } from '@/types/payment';
import { CAFE_INFO, CATEGORIES, MENU_ITEMS } from '@/data/mockData';
import { unlockAudio } from '@/lib/audioAlert';
import { Language, Translations, DICTIONARY } from '@/lib/i18n';
import { calculateItemPrice, isDefaultHappyHoursTime, PriceCalculationResult } from '@/lib/pricingEngine';
import { CartProvider, useCart, CartContextValue } from './CartContext';
import { KdsProvider, useKds, KdsContextValue } from './KdsContext';

export { useCart } from './CartContext';
export type { CartContextValue } from './CartContext';
export { useKds } from './KdsContext';
export type { KdsContextValue } from './KdsContext';
export type { SubmitOrderParams } from '@/types/menu';

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

export interface MenuContextValue {
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

  // Инициализация столика из URL-параметров (например, ?table=4)
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

  const [stopList, setStopList] = useState<ReadonlySet<string>>(new Set<string>());
  const [activeFilter, setActiveFilter] = useState<BadgeType | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>(CATEGORIES[0].id);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [currentPayingOrderId, setCurrentPayingOrderId] = useState<string | null>(null);
  const [activeFiscalReceipt, setActiveFiscalReceipt] = useState<FiscalReceipt | null>(null);
  const [selectedItemForDetails, setSelectedItemForDetails] = useState<MenuItem | null>(null);
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);

  // Мультиязычность
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

  // Happy Hours
  const [isHappyHoursActive, setIsHappyHoursActive] = useState<boolean>(isDefaultHappyHoursTime);

  const toggleHappyHours = useCallback((): void => {
    setIsHappyHoursActive((prev) => !prev);
  }, []);

  // Погода
  const [weatherType, setWeatherType] = useState<'sunny' | 'rain' | 'cold'>('sunny');

  const getItemPriceWithDiscount = useCallback(
    (item: MenuItem): PriceCalculationResult => {
      return calculateItemPrice(item, isHappyHoursActive);
    },
    [isHappyHoursActive]
  );

  const toggleStopList = useCallback((itemId: string): void => {
    setStopList((prev) => {
      const next = new Set<string>(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });

    const token = typeof window !== 'undefined'
      ? sessionStorage.getItem('aura_staff_token') || sessionStorage.getItem('staff_session_token')
      : null;
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

  const handleStopListFromSse = useCallback((list: string[]): void => {
    setStopList(new Set(list));
  }, []);

  const handleFiscalReceiptFromSse = useCallback((receipt: unknown): void => {
    if (receipt && typeof receipt === 'object') {
      setActiveFiscalReceipt(receipt as FiscalReceipt);
    }
  }, []);

  // Базовые свойства каталога и UI
  const catalogValue = useMemo(
    () => ({
      cafeInfo,
      categories,
      items,
      tableNumber,
      setTableNumber,
      stopList,
      toggleStopList,
      activeFilter,
      setActiveFilter,
      searchQuery,
      setSearchQuery,
      selectedCategory,
      setSelectedCategory,
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
      refreshMenu,
    }),
    [
      cafeInfo,
      categories,
      items,
      tableNumber,
      setTableNumber,
      stopList,
      toggleStopList,
      activeFilter,
      setActiveFilter,
      searchQuery,
      setSearchQuery,
      selectedCategory,
      setSelectedCategory,
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
      refreshMenu,
    ]
  );

  return (
    <KdsProvider
      tableNumber={tableNumber}
      isSoundEnabled={isSoundEnabled}
      onFiscalReceiptReceived={handleFiscalReceiptFromSse}
      onStopListUpdated={handleStopListFromSse}
      onMenuUpdated={refreshMenu}
    >
      <KdsCartBridge
        tableNumber={tableNumber}
        isHappyHoursActive={isHappyHoursActive}
        catalogValue={catalogValue}
      >
        {children}
      </KdsCartBridge>
    </KdsProvider>
  );
}

interface KdsCartBridgeProps {
  readonly children: ReactNode;
  readonly tableNumber: number;
  readonly isHappyHoursActive: boolean;
  readonly catalogValue: Omit<MenuContextValue, keyof CartContextValue | keyof KdsContextValue>;
}

function KdsCartBridge({
  children,
  tableNumber,
  isHappyHoursActive,
  catalogValue,
}: KdsCartBridgeProps): React.JSX.Element {
  const kds = useKds();

  const handleOrderSubmitted = useCallback(
    (newOrder: Order) => {
      kds.addOptimisticOrder(newOrder);
      catalogValue.setCurrentPayingOrderId(newOrder.id);
      catalogValue.setActiveModal('tracker');
    },
    [kds, catalogValue]
  );

  return (
    <CartProvider
      tableNumber={tableNumber}
      isHappyHoursActive={isHappyHoursActive}
      onOrderSubmitted={handleOrderSubmitted}
    >
      <MenuCompositeProvider catalogValue={catalogValue}>
        {children}
      </MenuCompositeProvider>
    </CartProvider>
  );
}

interface MenuCompositeProviderProps {
  readonly children: ReactNode;
  readonly catalogValue: Omit<MenuContextValue, keyof CartContextValue | keyof KdsContextValue>;
}

function MenuCompositeProvider({
  children,
  catalogValue,
}: MenuCompositeProviderProps): React.JSX.Element {
  const cart = useCart();
  const kds = useKds();

  const fullValue: MenuContextValue = useMemo(
    () => ({
      ...catalogValue,
      ...cart,
      ...kds,
    }),
    [catalogValue, cart, kds]
  );

  return <MenuContext.Provider value={fullValue}>{children}</MenuContext.Provider>;
}

export function useMenu(): MenuContextValue {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('useMenu must be used within a MenuProvider');
  }
  return context;
}
