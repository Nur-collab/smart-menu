import { Order, OrderStatus, WaiterCall, WaiterCallReason, ServerEventData, CartItem, PaymentMethod } from '@/types/menu';
import {
  PaymentTransaction,
  FiscalReceipt,
  PaymentGatewayProvider,
  PaymentTransactionStatus,
} from '@/types/payment';
import { GuestReview, ReviewSubmitPayload, ReviewStats } from '@/types/review';
import { generateElqrPayload, generatePaymentDeeplinks } from '@/lib/elqr';
import { createFiscalReceiptFromOrder } from '@/lib/fiscalKkm';
import { getPosConfig, sendOrderToPos, printTicketToNetworkPrinter } from '@/lib/posBridge';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

/**
 * Единое серверное хранилище (Singleton) в памяти Node.js процесса
 * Обеспечивает синхронизацию между смартфонами гостей и планшетами кухни.
 */

interface ServerStoreState {
  orders: Order[];
  waiterCalls: WaiterCall[];
  stopList: Set<string>;
  transactions: Map<string, PaymentTransaction>;
  fiscalReceipts: Map<string, FiscalReceipt>;
  reviews: GuestReview[];
  sseControllers: Set<ReadableStreamDefaultController<Uint8Array>>;
}

// Прикрепляем к globalThis, чтобы состояние сохранялось при Next.js HMR в dev-режиме
const globalForStore = globalThis as unknown as {
  __smartMenuStore?: ServerStoreState;
};

const INITIAL_REVIEWS: GuestReview[] = [
  {
    id: 'rev-seed-1',
    tableNumber: 4,
    rating: 5,
    sentiment: 'positive',
    tags: ['Вкусная еда', 'Отличный specialty кофе', 'Уютная атмосфера'],
    comment: 'Шикарный флэт уайт и сырники! Атмосфера на Эркиндик как в лучших кофейнях Европы.',
    externalPlatform: '2gis',
    bonusAwarded: 50,
    status: 'reviewed',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'rev-seed-2',
    tableNumber: 2,
    rating: 5,
    sentiment: 'positive',
    tags: ['Быстрая подача', 'Вежливый официант'],
    comment: 'Заказ принесли буквально за 8 минут. Очень вежливый парень официант, спасибо!',
    externalPlatform: 'google',
    bonusAwarded: 50,
    status: 'reviewed',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'rev-seed-3',
    tableNumber: 6,
    rating: 3,
    sentiment: 'neutral',
    tags: ['Долгое ожидание блюда'],
    comment: 'Еда вкусная, но десерт несли дольше обычного. Пожалуйста, обратите внимание.',
    externalPlatform: null,
    bonusAwarded: 0,
    status: 'new',
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    managerNotes: 'Официант подошел с извинениями, подарили комплимент от заведения.',
  },
];

const storeState: ServerStoreState = globalForStore.__smartMenuStore ?? {
  orders: [],
  waiterCalls: [],
  stopList: new Set<string>(),
  transactions: new Map<string, PaymentTransaction>(),
  fiscalReceipts: new Map<string, FiscalReceipt>(),
  reviews: [...INITIAL_REVIEWS],
  sseControllers: new Set(),
};

// Защита при HMR перезагрузках существующего globalForStore
if (!storeState.transactions) {
  storeState.transactions = new Map<string, PaymentTransaction>();
}
if (!storeState.fiscalReceipts) {
  storeState.fiscalReceipts = new Map<string, FiscalReceipt>();
}
if (!storeState.reviews) {
  storeState.reviews = [...INITIAL_REVIEWS];
}
if (storeState.orders) {
  storeState.orders = storeState.orders.map((o) => ({
    ...o,
    items: (o.items || []).map((i) => ({
      ...i,
      selectedOptions: Array.isArray(i.selectedOptions) ? i.selectedOptions : [],
    })),
  }));
}

if (process.env.NODE_ENV !== 'production') {
  globalForStore.__smartMenuStore = storeState;
}

let isSyncedFromDb = false;

export async function syncStoreFromNeon(): Promise<void> {
  if (isSyncedFromDb) return;
  try {
    const [dbOrders, dbCalls, dbUnavailableItems, dbReviews] = await Promise.all([
      prisma.order.findMany({
        where: { status: { notIn: ['cancelled', 'completed'] } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.waiterCall.findMany({
        where: { status: 'pending' },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.menuItem.findMany({
        where: { isAvailable: false },
        select: { id: true },
      }),
      prisma.guestReview.findMany({
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
    ]);

    if (dbOrders.length > 0) {
      storeState.orders = dbOrders.map((o) => ({
        id: o.id,
        tableNumber: o.tableNumber,
        items: Array.isArray(o.items) ? (o.items as unknown as CartItem[]) : [],
        totalAmount: o.totalAmount,
        discountAmount: o.discountAmount,
        tipAmount: o.tipAmount,
        finalAmount: o.finalAmount,
        paymentMethod: o.paymentMethod as PaymentMethod,
        status: o.status as OrderStatus,
        guestComment: o.guestComment ?? undefined,
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
      }));
    }

    if (dbCalls.length > 0) {
      storeState.waiterCalls = dbCalls.map((c) => ({
        id: c.id,
        tableNumber: c.tableNumber,
        reason: c.reason as WaiterCallReason,
        status: c.status as 'pending' | 'resolved',
        createdAt: c.createdAt.toISOString(),
      }));
    }

    if (dbUnavailableItems.length > 0) {
      dbUnavailableItems.forEach((item) => storeState.stopList.add(item.id));
    }

    if (dbReviews.length > 0) {
      storeState.reviews = dbReviews.map((r) => ({
        id: r.id,
        tableNumber: r.tableNumber,
        rating: r.rating as 1 | 2 | 3 | 4 | 5,
        sentiment: r.sentiment as 'positive' | 'neutral' | 'negative',
        tags: r.tags,
        comment: r.comment ?? '',
        externalPlatform: (r.externalPlatform as '2gis' | 'google') ?? null,
        bonusAwarded: r.bonusAwarded,
        status: r.status as 'new' | 'reviewed' | 'resolved',
        createdAt: r.createdAt.toISOString(),
      }));
    }

    isSyncedFromDb = true;
    console.log('Successfully synced state from Neon PostgreSQL');
  } catch (err) {
    console.warn('Neon syncStoreFromNeon fallback to local state:', err);
  }
}

// Initial background sync
void syncStoreFromNeon();

const encoder = new TextEncoder();

/**
 * Рассылка событий всем подключенным клиентам (SSE)
 */
export function broadcastEvent(event: ServerEventData): void {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  const encoded = encoder.encode(data);

  storeState.sseControllers.forEach((controller) => {
    try {
      controller.enqueue(encoded);
    } catch {
      // Клиент отключился, удаляем
      storeState.sseControllers.delete(controller);
    }
  });
}

/**
 * Регистрация нового SSE слушателя
 */
export function registerSseClient(controller: ReadableStreamDefaultController<Uint8Array>): () => void {
  storeState.sseControllers.add(controller);

  // Отправляем первоначальное состояние подключившемуся клиенту
  const initEvent: ServerEventData = {
    type: 'INIT',
    payload: {
      orders: storeState.orders,
      waiterCalls: storeState.waiterCalls,
      stopList: Array.from(storeState.stopList),
    },
    timestamp: new Date().toISOString(),
  };

  try {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(initEvent)}\n\n`));
  } catch {
    storeState.sseControllers.delete(controller);
  }

  return () => {
    storeState.sseControllers.delete(controller);
  };
}

// Поддержание постоянного соединения SSE (Keep-Alive ping раз в 25 сек для защиты от разрыва мобильными сетями)
const globalWithTimer = globalThis as unknown as {
  __smartMenuSseKeepAlive?: NodeJS.Timeout;
};

if (!globalWithTimer.__smartMenuSseKeepAlive) {
  globalWithTimer.__smartMenuSseKeepAlive = setInterval(() => {
    if (storeState.sseControllers.size === 0) return;
    const pingData = encoder.encode(': ping\n\n');
    storeState.sseControllers.forEach((controller) => {
      try {
        controller.enqueue(pingData);
      } catch {
        storeState.sseControllers.delete(controller);
      }
    });
  }, 25000);
}

// === Методы работы с заказами ===

export async function getAllOrders(): Promise<readonly Order[]> {
  try {
    const dbOrders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    if (dbOrders.length > 0) {
      const mappedOrders: Order[] = dbOrders.map((o) => ({
        id: o.id,
        tableNumber: o.tableNumber,
        items: Array.isArray(o.items) ? (o.items as unknown as CartItem[]) : [],
        totalAmount: o.totalAmount,
        discountAmount: o.discountAmount,
        tipAmount: o.tipAmount,
        finalAmount: o.finalAmount,
        paymentMethod: o.paymentMethod as PaymentMethod,
        status: o.status as OrderStatus,
        guestComment: o.guestComment ?? undefined,
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
      }));

      const orderMap = new Map<string, Order>();
      for (const ord of storeState.orders) {
        orderMap.set(ord.id, ord);
      }
      for (const ord of mappedOrders) {
        orderMap.set(ord.id, ord);
      }
      storeState.orders = Array.from(orderMap.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
  } catch (err) {
    console.warn('getAllOrders Neon fallback to memory store:', err);
  }
  return [...storeState.orders];
}

export async function createOrder(order: Order): Promise<Order> {
  if (order.id) {
    const existing = storeState.orders.find((o) => o.id === order.id);
    if (existing) {
      return existing;
    }
  }

  const now = new Date().toISOString();
  const sanitizedItems = (order.items || []).map((i) => ({
    ...i,
    selectedOptions: Array.isArray(i.selectedOptions) ? i.selectedOptions : [],
  }));

  const completeOrder: Order = {
    ...order,
    id: order.id || `ord-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    status: order.status || 'pending',
    items: sanitizedItems,
    createdAt: order.createdAt || now,
    updatedAt: now,
  };

  const MAX_ORDERS_CACHE = 100;
  storeState.orders = [completeOrder, ...storeState.orders].slice(0, MAX_ORDERS_CACHE);

  broadcastEvent({
    type: 'NEW_ORDER',
    payload: completeOrder,
    timestamp: now,
  });

  // Надежное сохранение заказа в облачный Neon PostgreSQL (дожидаемся перед ответом в serverless)
  try {
    await prisma.order.upsert({
      where: { id: completeOrder.id },
      update: {
        status: completeOrder.status,
        totalAmount: completeOrder.totalAmount,
        discountAmount: completeOrder.discountAmount,
        tipAmount: completeOrder.tipAmount,
        finalAmount: completeOrder.finalAmount,
        paymentMethod: completeOrder.paymentMethod,
        guestComment: completeOrder.guestComment ?? null,
        items: completeOrder.items as unknown as Prisma.InputJsonValue,
        updatedAt: new Date(now),
      },
      create: {
        id: completeOrder.id,
        tableNumber: completeOrder.tableNumber,
        totalAmount: completeOrder.totalAmount,
        discountAmount: completeOrder.discountAmount,
        tipAmount: completeOrder.tipAmount,
        finalAmount: completeOrder.finalAmount,
        paymentMethod: completeOrder.paymentMethod,
        status: completeOrder.status,
        guestComment: completeOrder.guestComment ?? null,
        items: completeOrder.items as unknown as Prisma.InputJsonValue,
        createdAt: new Date(completeOrder.createdAt || now),
        updatedAt: new Date(now),
      },
    });
  } catch (err) {
    console.error('Failed to sync order to Neon Prisma:', err);
  }

  // Автоматический фоновый проброс в кассу POS и на сетевой принтер бегунков кухни
  try {
    const posConfig = getPosConfig();
    if (posConfig.autoSendOrders) {
      void sendOrderToPos(completeOrder);
      void printTicketToNetworkPrinter(completeOrder);
    }
  } catch {
    // Не блокируем создание заказа при ошибках локальной сети кассы
  }

  return completeOrder;
}

export async function updateOrderStatusInStore(orderId: string, status: OrderStatus): Promise<Order | null> {
  const now = new Date().toISOString();
  let existingIndex = storeState.orders.findIndex((o) => o.id === orderId);

  // Если заказ не найден в памяти текущего serverless контейнера, поднимаем из Neon DB
  if (existingIndex === -1) {
    try {
      const dbOrder = await prisma.order.findUnique({
        where: { id: orderId },
      });
      if (dbOrder) {
        const mappedOrder: Order = {
          id: dbOrder.id,
          tableNumber: dbOrder.tableNumber,
          items: Array.isArray(dbOrder.items) ? (dbOrder.items as unknown as CartItem[]) : [],
          totalAmount: dbOrder.totalAmount,
          discountAmount: dbOrder.discountAmount,
          tipAmount: dbOrder.tipAmount,
          finalAmount: dbOrder.finalAmount,
          paymentMethod: dbOrder.paymentMethod as PaymentMethod,
          status: dbOrder.status as OrderStatus,
          guestComment: dbOrder.guestComment ?? undefined,
          createdAt: dbOrder.createdAt.toISOString(),
          updatedAt: dbOrder.updatedAt.toISOString(),
        };
        storeState.orders.unshift(mappedOrder);
        existingIndex = 0;
      }
    } catch (err) {
      console.error('Failed to lookup order in Neon Prisma during status update:', err);
    }
  }

  if (existingIndex === -1) return null;

  const updatedOrder: Order = {
    ...storeState.orders[existingIndex],
    status,
    updatedAt: now,
  };

  storeState.orders[existingIndex] = updatedOrder;

  broadcastEvent({
    type: 'UPDATE_ORDER',
    payload: updatedOrder,
    timestamp: now,
  });

  // Надежное сохранение статуса заказа в Neon PostgreSQL
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { status, updatedAt: new Date(now) },
    });
  } catch (err) {
    console.error('Failed to update order status in Neon Prisma:', err);
  }

  return updatedOrder;
}

// === Методы работы с вызовами официанта ===

export async function getAllWaiterCalls(): Promise<readonly WaiterCall[]> {
  try {
    const dbCalls = await prisma.waiterCall.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    if (dbCalls.length > 0) {
      const mappedCalls: WaiterCall[] = dbCalls.map((c) => ({
        id: c.id,
        tableNumber: c.tableNumber,
        reason: c.reason as WaiterCallReason,
        status: c.status as 'pending' | 'resolved',
        createdAt: c.createdAt.toISOString(),
      }));

      const callMap = new Map<string, WaiterCall>();
      for (const call of storeState.waiterCalls) {
        callMap.set(call.id, call);
      }
      for (const call of mappedCalls) {
        callMap.set(call.id, call);
      }
      storeState.waiterCalls = Array.from(callMap.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
  } catch (err) {
    console.warn('getAllWaiterCalls Neon fallback to memory store:', err);
  }
  return [...storeState.waiterCalls];
}

export async function createWaiterCall(tableNumber: number, reason: WaiterCallReason): Promise<WaiterCall> {
  const newCall: WaiterCall = {
    id: `call-${Date.now().toString(36)}`,
    tableNumber,
    reason,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  const MAX_WAITER_CALLS_CACHE = 50;
  storeState.waiterCalls = [newCall, ...storeState.waiterCalls].slice(0, MAX_WAITER_CALLS_CACHE);

  broadcastEvent({
    type: 'NEW_WAITER_CALL',
    payload: newCall,
    timestamp: new Date().toISOString(),
  });

  // Надежное сохранение вызова официанта в Neon PostgreSQL
  try {
    await prisma.waiterCall.create({
      data: {
        id: newCall.id,
        tableNumber: newCall.tableNumber,
        reason: newCall.reason,
        status: newCall.status,
        createdAt: new Date(newCall.createdAt),
      },
    });
  } catch (err) {
    console.error('Failed to sync waiter call to Neon Prisma:', err);
  }

  return newCall;
}

export async function resolveWaiterCallInStore(callId: string): Promise<WaiterCall | null> {
  let existingIndex = storeState.waiterCalls.findIndex((c) => c.id === callId);

  if (existingIndex === -1) {
    try {
      const dbCall = await prisma.waiterCall.findUnique({
        where: { id: callId },
      });
      if (dbCall) {
        const mappedCall: WaiterCall = {
          id: dbCall.id,
          tableNumber: dbCall.tableNumber,
          reason: dbCall.reason as WaiterCallReason,
          status: dbCall.status as 'pending' | 'resolved',
          createdAt: dbCall.createdAt.toISOString(),
        };
        storeState.waiterCalls.unshift(mappedCall);
        existingIndex = 0;
      }
    } catch (err) {
      console.error('Failed to lookup waiter call in Neon Prisma:', err);
    }
  }

  if (existingIndex === -1) return null;

  const resolvedCall: WaiterCall = {
    ...storeState.waiterCalls[existingIndex],
    status: 'resolved',
  };

  storeState.waiterCalls[existingIndex] = resolvedCall;

  broadcastEvent({
    type: 'RESOLVE_WAITER_CALL',
    payload: resolvedCall,
    timestamp: new Date().toISOString(),
  });

  // Надежное обновление статуса вызова в Neon PostgreSQL
  try {
    await prisma.waiterCall.update({
      where: { id: callId },
      data: { status: 'resolved', updatedAt: new Date() },
    });
  } catch (err) {
    console.error('Failed to resolve waiter call in Neon Prisma:', err);
  }

  return resolvedCall;
}

// === Методы работы со стоп-листом ===

export function getStopList(): readonly string[] {
  return Array.from(storeState.stopList);
}

export async function toggleStopListItem(itemId: string): Promise<readonly string[]> {
  const isNowInStopList = !storeState.stopList.has(itemId);
  if (isNowInStopList) {
    storeState.stopList.add(itemId);
  } else {
    storeState.stopList.delete(itemId);
  }

  const updated = Array.from(storeState.stopList);

  broadcastEvent({
    type: 'UPDATE_STOPLIST',
    payload: updated,
    timestamp: new Date().toISOString(),
  });

  // Надежное обновление доступности блюда в Neon PostgreSQL
  try {
    await prisma.menuItem.update({
      where: { id: itemId },
      data: { isAvailable: !isNowInStopList },
    });
  } catch (err) {
    console.error('Failed to sync stoplist to Neon Prisma:', err);
  }

  return updated;
}

// === Методы работы с транзакциями оплаты и фискализацией (Кыргызстан) ===

export function getOrderById(orderId: string): Order | undefined {
  return storeState.orders.find((o) => o.id === orderId);
}

export function createPaymentTransaction(
  orderId: string,
  provider: PaymentGatewayProvider
): PaymentTransaction {
  const order = getOrderById(orderId);
  if (!order) {
    throw new Error(`Заказ с идентификатором ${orderId} не найден`);
  }

  // Если заказ уже оплачен, возвращаем существующую транзакцию
  if (order.status === 'paid') {
    const existingPaid = Array.from(storeState.transactions.values()).find(
      (t) => t.orderId === orderId && t.status === 'paid'
    );
    if (existingPaid) {
      return existingPaid;
    }
  }

  const transactionId = `txn-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const invoiceNumber = `INV-KG-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 5 * 60 * 1000).toISOString(); // 5 минут таймаут

  const qrPayload = generateElqrPayload({
    invoiceNumber,
    amount: order.finalAmount,
    tableNumber: order.tableNumber,
  });

  const deeplinks = generatePaymentDeeplinks({
    invoiceNumber,
    amount: order.finalAmount,
    tableNumber: order.tableNumber,
  });

  const transaction: PaymentTransaction = {
    id: transactionId,
    orderId,
    invoiceNumber,
    tableNumber: order.tableNumber,
    amount: order.finalAmount,
    tipAmount: order.tipAmount,
    provider,
    status: 'pending',
    qrPayload,
    deeplinks,
    createdAt: now.toISOString(),
    expiresAt,
  };

  const MAX_TRANSACTIONS_CACHE = 200;
  if (storeState.transactions.size >= MAX_TRANSACTIONS_CACHE) {
    const oldestKey = storeState.transactions.keys().next().value;
    if (oldestKey) storeState.transactions.delete(oldestKey);
  }

  storeState.transactions.set(transactionId, transaction);
  return transaction;
}

export function getPaymentTransaction(transactionId: string): PaymentTransaction | undefined {
  return storeState.transactions.get(transactionId);
}

export function getPaymentTransactionByOrderId(orderId: string): PaymentTransaction | undefined {
  for (const txn of storeState.transactions.values()) {
    if (txn.orderId === orderId) {
      return txn;
    }
  }
  return undefined;
}

export async function updatePaymentTransactionStatus(
  transactionId: string,
  status: PaymentTransactionStatus,
  externalTransactionId?: string
): Promise<{ transaction: PaymentTransaction; order?: Order; fiscalReceipt?: FiscalReceipt } | null> {
  const existingTxn = storeState.transactions.get(transactionId);
  if (!existingTxn) return null;

  // Идемпотентность: защита от повторной фискализации чека ЭККМ при дублирующих вебхуках
  if (existingTxn.status === 'paid' && status === 'paid') {
    const fiscalReceipt = existingTxn.fiscalReceiptId
      ? storeState.fiscalReceipts.get(existingTxn.fiscalReceiptId)
      : getFiscalReceiptByOrderId(existingTxn.orderId);
    const order = getOrderById(existingTxn.orderId);
    return {
      transaction: existingTxn,
      order,
      fiscalReceipt,
    };
  }

  const now = new Date().toISOString();
  let updatedTxn: PaymentTransaction = {
    ...existingTxn,
    status,
    externalTransactionId: externalTransactionId ?? existingTxn.externalTransactionId,
    paidAt: status === 'paid' ? now : existingTxn.paidAt,
  };

  let updatedOrder: Order | undefined;
  let fiscalReceipt: FiscalReceipt | undefined;

  if (status === 'paid') {
    // 1. Обновляем статус заказа на 'paid'
    const orderIndex = storeState.orders.findIndex((o) => o.id === existingTxn.orderId);
    if (orderIndex !== -1) {
      const order = storeState.orders[orderIndex];
      updatedOrder = {
        ...order,
        status: 'paid',
        updatedAt: now,
      };
      storeState.orders[orderIndex] = updatedOrder;

      // Надежно сохраняем статус оплаты заказа в Neon PostgreSQL
      try {
        await prisma.order.update({
          where: { id: existingTxn.orderId },
          data: { status: 'paid', updatedAt: new Date(now) },
        });
      } catch (err) {
        console.error('Failed to update order status to paid in Neon Prisma:', err);
      }

      // 2. Генерируем фискальный чек ЭККМ ГНС КР
      fiscalReceipt = createFiscalReceiptFromOrder({
        order: updatedOrder,
        transactionId: updatedTxn.id,
      });
      const MAX_RECEIPTS_CACHE = 200;
      if (storeState.fiscalReceipts.size >= MAX_RECEIPTS_CACHE) {
        const oldestKey = storeState.fiscalReceipts.keys().next().value;
        if (oldestKey) storeState.fiscalReceipts.delete(oldestKey);
      }
      storeState.fiscalReceipts.set(fiscalReceipt.id, fiscalReceipt);

      updatedTxn = {
        ...updatedTxn,
        fiscalReceiptId: fiscalReceipt.id,
      };

      // Оповещаем кухню и клиентов о поступлении оплаты и чека
      broadcastEvent({
        type: 'PAYMENT_SUCCESS',
        payload: {
          transaction: updatedTxn,
          order: updatedOrder,
          fiscalReceipt,
        },
        timestamp: now,
      });

      broadcastEvent({
        type: 'UPDATE_ORDER',
        payload: updatedOrder,
        timestamp: now,
      });
    }
  }

  storeState.transactions.set(transactionId, updatedTxn);

  return {
    transaction: updatedTxn,
    order: updatedOrder,
    fiscalReceipt,
  };
}

export function getFiscalReceiptByOrderId(orderId: string): FiscalReceipt | undefined {
  for (const receipt of storeState.fiscalReceipts.values()) {
    if (receipt.orderId === orderId) {
      return receipt;
    }
  }
  return undefined;
}

export function getFiscalReceipt(receiptId: string): FiscalReceipt | undefined {
  return storeState.fiscalReceipts.get(receiptId);
}

export function getAllFiscalReceipts(): readonly FiscalReceipt[] {
  return Array.from(storeState.fiscalReceipts.values()).reverse();
}

export function generateFiscalReceiptForOrder(
  orderId: string,
  transactionId?: string
): FiscalReceipt | null {
  const existingReceipt = getFiscalReceiptByOrderId(orderId);
  if (existingReceipt) return existingReceipt;

  const order = getOrderById(orderId);
  if (!order) return null;

  const receipt = createFiscalReceiptFromOrder({
    order,
    transactionId,
  });

  const MAX_RECEIPTS_CACHE = 200;
  if (storeState.fiscalReceipts.size >= MAX_RECEIPTS_CACHE) {
    const oldestKey = storeState.fiscalReceipts.keys().next().value;
    if (oldestKey) storeState.fiscalReceipts.delete(oldestKey);
  }
  storeState.fiscalReceipts.set(receipt.id, receipt);

  broadcastEvent({
    type: 'NEW_FISCAL_RECEIPT',
    payload: receipt,
    timestamp: new Date().toISOString(),
  });

  return receipt;
}

/**
 * Создать новый отзыв гостя со столика и начислить бонусы при высокой оценке
 */
export async function createReview(payload: ReviewSubmitPayload): Promise<GuestReview> {
  // Защита от дублирования отзывов и накрутки бонусов по одному заказу
  if (payload.orderId) {
    const existing = storeState.reviews.find((r) => r.orderId === payload.orderId);
    if (existing) {
      return existing;
    }
  }

  const rating = Math.min(5, Math.max(1, payload.rating)) as 1 | 2 | 3 | 4 | 5;
  const sentiment = rating >= 4 ? 'positive' : rating === 3 ? 'neutral' : 'negative';
  const bonusAwarded = rating >= 4 ? 50 : 0;

  const review: GuestReview = {
    id: `rev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    orderId: payload.orderId,
    tableNumber: payload.tableNumber,
    rating,
    sentiment,
    tags: [...payload.tags],
    comment: payload.comment?.trim() || undefined,
    externalPlatform: payload.externalPlatform ?? null,
    bonusAwarded,
    status: 'new',
    createdAt: new Date().toISOString(),
  };

  const MAX_REVIEWS_CACHE = 50;
  storeState.reviews = [review, ...storeState.reviews].slice(0, MAX_REVIEWS_CACHE);

  // Надежное сохранение отзыва в Neon PostgreSQL
  try {
    await prisma.guestReview.create({
      data: {
        id: review.id,
        tableNumber: review.tableNumber,
        rating: review.rating,
        sentiment: review.sentiment,
        tags: [...review.tags],
        comment: review.comment || null,
        externalPlatform: review.externalPlatform || null,
        bonusAwarded: review.bonusAwarded,
        status: review.status,
        createdAt: new Date(review.createdAt),
      },
    });
  } catch (err) {
    console.error('Failed to sync review to Neon Prisma:', err);
  }

  // Рассылка оповещения на планшет администратора
  broadcastEvent({
    type: 'NEW_REVIEW' as unknown as 'INIT',
    payload: review,
    timestamp: review.createdAt,
  });

  return review;
}

/**
 * Получить все отзывы гостей
 */
export async function getAllReviews(): Promise<readonly GuestReview[]> {
  try {
    const dbReviews = await prisma.guestReview.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    if (dbReviews.length > 0) {
      const mappedReviews: GuestReview[] = dbReviews.map((r) => ({
        id: r.id,
        orderId: undefined,
        tableNumber: r.tableNumber,
        rating: r.rating as 1 | 2 | 3 | 4 | 5,
        sentiment: r.sentiment as 'positive' | 'negative' | 'neutral',
        tags: Array.isArray(r.tags) ? (r.tags as string[]) : [],
        comment: r.comment ?? undefined,
        externalPlatform: (r.externalPlatform as '2gis' | 'google' | 'yandex' | null) ?? null,
        bonusAwarded: r.bonusAwarded,
        status: (r.status as 'new' | 'reviewed' | 'resolved') || 'new',
        createdAt: r.createdAt.toISOString(),
      }));

      const reviewMap = new Map<string, GuestReview>();
      for (const rev of storeState.reviews) {
        reviewMap.set(rev.id, rev);
      }
      for (const rev of mappedReviews) {
        reviewMap.set(rev.id, rev);
      }
      storeState.reviews = Array.from(reviewMap.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
  } catch (err) {
    console.warn('getAllReviews Neon fallback to memory store:', err);
  }
  return [...storeState.reviews];
}

/**
 * Получить агрегированную статистику отзывов, NPS и переходов в 2ГИС
 */
export function getReviewStats(): ReviewStats {
  const reviews = storeState.reviews;
  const totalReviews = reviews.length;

  if (totalReviews === 0) {
    return {
      totalReviews: 0,
      averageRating: 5.0,
      ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      positivePercentage: 100,
      externalRedirectsCount: 0,
      totalBonusesGiven: 0,
      pendingIssuesCount: 0,
    };
  }

  const ratingCounts: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  let sum = 0;
  let positiveCount = 0;
  let externalRedirectsCount = 0;
  let totalBonusesGiven = 0;
  let pendingIssuesCount = 0;

  reviews.forEach((r) => {
    ratingCounts[r.rating]++;
    sum += r.rating;
    if (r.rating >= 4) positiveCount++;
    if (r.externalPlatform) externalRedirectsCount++;
    totalBonusesGiven += r.bonusAwarded;
    if (r.rating <= 3 && r.status === 'new') pendingIssuesCount++;
  });

  const averageRating = Number((sum / totalReviews).toFixed(1));
  const positivePercentage = Math.round((positiveCount / totalReviews) * 100);

  return {
    totalReviews,
    averageRating,
    ratingCounts,
    positivePercentage,
    externalRedirectsCount,
    totalBonusesGiven,
    pendingIssuesCount,
  };
}

/**
 * Обновить статус отзыва управляющим (например, отметка об урегулировании претензии)
 */
export async function updateReviewStatus(
  id: string,
  status: GuestReview['status'],
  managerNotes?: string
): Promise<GuestReview | null> {
  let target = storeState.reviews.find((r) => r.id === id);

  if (!target) {
    try {
      const dbReview = await prisma.guestReview.findUnique({ where: { id } });
      if (dbReview) {
        const foundReview: GuestReview = {
          id: dbReview.id,
          orderId: undefined,
          tableNumber: dbReview.tableNumber,
          rating: dbReview.rating as 1 | 2 | 3 | 4 | 5,
          sentiment: dbReview.sentiment as 'positive' | 'negative' | 'neutral',
          tags: Array.isArray(dbReview.tags) ? (dbReview.tags as string[]) : [],
          comment: dbReview.comment ?? undefined,
          externalPlatform: (dbReview.externalPlatform as '2gis' | 'google' | 'yandex' | null) ?? null,
          bonusAwarded: dbReview.bonusAwarded,
          status: (dbReview.status as 'new' | 'reviewed' | 'resolved') || 'new',
          createdAt: dbReview.createdAt.toISOString(),
        };
        target = foundReview;
        storeState.reviews.push(foundReview);
      }
    } catch (err) {
      console.warn('updateReviewStatus fallback search failed:', err);
    }
  }

  if (!target) return null;

  const updated: GuestReview = {
    ...target,
    status,
    managerNotes: managerNotes ?? target.managerNotes,
  };

  storeState.reviews = storeState.reviews.map((r) => (r.id === id ? updated : r));

  try {
    await prisma.guestReview.update({
      where: { id },
      data: {
        status,
      },
    });
  } catch (err) {
    console.error('Failed to update review status in Neon Prisma:', err);
  }

  return updated;
}

