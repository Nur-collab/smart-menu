'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import {
  CartItem,
  MenuItem,
  SelectedOption,
  Order,
  SubmitOrderParams,
} from '@/types/menu';
import { calculateItemPrice } from '@/lib/pricingEngine';
import { enqueueOfflineAction } from '@/lib/offlineSync';

export interface CartContextValue {
  readonly cart: readonly CartItem[];
  readonly cartSubtotal: number;
  readonly cartItemsCount: number;
  readonly userBonusBalance: number;
  readonly addToCart: (
    item: MenuItem,
    selectedOptions?: readonly SelectedOption[],
    comment?: string
  ) => void;
  readonly updateCartItemQuantity: (cartItemId: string, delta: number) => void;
  readonly removeCartItem: (cartItemId: string) => void;
  readonly clearCart: () => void;
  readonly addBonusPoints: (amount: number) => void;
  readonly submitOrder: (params: SubmitOrderParams) => Order;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export interface CartProviderProps {
  readonly children: ReactNode;
  readonly tableNumber: number;
  readonly isHappyHoursActive?: boolean;
  readonly onOrderSubmitted?: (newOrder: Order) => void;
}

export function CartProvider({
  children,
  tableNumber,
  isHappyHoursActive = false,
  onOrderSubmitted,
}: CartProviderProps): React.JSX.Element {
  const [cart, setCart] = useState<readonly CartItem[]>([]);
  const [userBonusBalance, setUserBonusBalance] = useState<number>(350);

  const addBonusPoints = useCallback((amount: number): void => {
    setUserBonusBalance((prev) => Math.max(0, prev + amount));
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

      // Очистка локальной корзины
      setCart([]);

      // Списание бонусов гостя
      if (discountAmount > 0) {
        setUserBonusBalance((prev) => Math.max(0, prev - discountAmount));
      }

      // Оповещение родительского провайдера (KDS и модальных окон)
      if (onOrderSubmitted) {
        onOrderSubmitted(newOrder);
      }

      // Отправка на центральный сервер для кухни
      fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder),
      }).catch(() => {
        enqueueOfflineAction(
          'CREATE_ORDER',
          '/api/orders',
          newOrder as unknown as Record<string, unknown>,
          `Заказ столика №${tableNumber} (${newOrder.items.length} поз.)`
        );
      });

      return newOrder;
    },
    [cart, tableNumber, onOrderSubmitted]
  );

  const value: CartContextValue = useMemo(
    () => ({
      cart,
      cartSubtotal,
      cartItemsCount,
      userBonusBalance,
      addToCart,
      updateCartItemQuantity,
      removeCartItem,
      clearCart,
      addBonusPoints,
      submitOrder,
    }),
    [
      cart,
      cartSubtotal,
      cartItemsCount,
      userBonusBalance,
      addToCart,
      updateCartItemQuantity,
      removeCartItem,
      clearCart,
      addBonusPoints,
      submitOrder,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
