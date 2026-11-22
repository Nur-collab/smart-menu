import { Order, CartItem, SelectedOption, WaiterCallReason } from '@/types/menu';

export interface ValidationResult<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: string;
}

/**
 * Sanitize strings against XSS / HTML injection
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .trim();
}

/**
 * Validate and sanitize order submission input
 */
export function validateOrderInput(raw: unknown): ValidationResult<Order> {
  if (!raw || typeof raw !== 'object') {
    return { success: false, error: 'Тело запроса должно быть объектом' };
  }

  const obj = raw as Record<string, unknown>;

  const tableNumber = Number(obj.tableNumber);
  if (!Number.isInteger(tableNumber) || tableNumber < 1 || tableNumber > 99) {
    return { success: false, error: 'Номер столика должен быть целым числом от 1 до 99' };
  }

  if (!Array.isArray(obj.items) || obj.items.length === 0) {
    return { success: false, error: 'Заказ не может быть пустым' };
  }

  if (obj.items.length > 50) {
    return { success: false, error: 'Превышено максимальное число позиций в заказе (макс. 50)' };
  }

  const sanitizedItems: CartItem[] = [];

  for (let idx = 0; idx < obj.items.length; idx++) {
    const rawItem = obj.items[idx];
    if (!rawItem || typeof rawItem !== 'object') {
      return { success: false, error: `Элемент #${idx + 1} в заказе некорректен` };
    }

    const itemObj = rawItem as Record<string, unknown>;
    const menuItemObj = itemObj.menuItem as Record<string, unknown> | undefined;

    if (!menuItemObj || typeof menuItemObj.id !== 'string' || !menuItemObj.id.trim()) {
      return { success: false, error: `У позиции #${idx + 1} отсутствует ID блюда` };
    }

    const quantity = Math.floor(Number(itemObj.quantity) || 1);
    if (quantity < 1 || quantity > 50) {
      return { success: false, error: `Некорректное количество для позиции #${idx + 1} (допустимо 1-50)` };
    }

    const selectedOptions: SelectedOption[] = [];
    if (Array.isArray(itemObj.selectedOptions)) {
      for (const opt of itemObj.selectedOptions) {
        if (opt && typeof opt === 'object') {
          const optObj = opt as Record<string, unknown>;
          if (typeof optObj.optionId === 'string') {
            selectedOptions.push({
              groupId: String(optObj.groupId || ''),
              groupTitle: sanitizeString(String(optObj.groupTitle || '')),
              optionId: String(optObj.optionId),
              optionName: sanitizeString(String(optObj.optionName || '')),
              price: Math.max(0, Number(optObj.price) || 0),
            });
          }
        }
      }
    }

    const cartItemId = typeof itemObj.cartItemId === 'string'
      ? sanitizeString(itemObj.cartItemId)
      : `cart-${idx}-${Date.now()}`;

    const comment = typeof itemObj.comment === 'string' && itemObj.comment.trim()
      ? sanitizeString(itemObj.comment).slice(0, 300)
      : undefined;

    sanitizedItems.push({
      ...itemObj,
      cartItemId,
      menuItem: menuItemObj as unknown as CartItem['menuItem'],
      quantity,
      selectedOptions,
      comment,
      unitPrice: Math.max(0, Number(itemObj.unitPrice) || 0),
    });
  }

  const validPaymentMethods = ['elqr', 'mbank', 'odengi', 'card_to_waiter', 'cash', 'split'] as const;
  const paymentMethod = validPaymentMethods.includes(obj.paymentMethod as (typeof validPaymentMethods)[number])
    ? (obj.paymentMethod as (typeof validPaymentMethods)[number])
    : 'elqr';

  const guestComment = typeof obj.guestComment === 'string' && obj.guestComment.trim()
    ? sanitizeString(obj.guestComment).slice(0, 500)
    : undefined;

  const order: Order = {
    id: typeof obj.id === 'string' ? sanitizeString(obj.id) : `ord-${Date.now().toString(36).toUpperCase()}`,
    tableNumber,
    items: sanitizedItems,
    totalAmount: Math.max(0, Number(obj.totalAmount) || 0),
    discountAmount: Math.max(0, Number(obj.discountAmount) || 0),
    tipAmount: Math.max(0, Number(obj.tipAmount) || 0),
    finalAmount: Math.max(0, Number(obj.finalAmount) || 0),
    paymentMethod,
    status: 'pending',
    guestComment,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return { success: true, data: order };
}

/**
 * Validate waiter call input
 */
export function validateWaiterCallInput(raw: unknown): ValidationResult<{ tableNumber: number; reason: WaiterCallReason }> {
  if (!raw || typeof raw !== 'object') {
    return { success: false, error: 'Тело запроса должно быть объектом' };
  }

  const obj = raw as Record<string, unknown>;
  const tableNumber = Number(obj.tableNumber);

  if (!Number.isInteger(tableNumber) || tableNumber < 1 || tableNumber > 99) {
    return { success: false, error: 'Некорректный номер столика (1-99)' };
  }

  const validReasons: WaiterCallReason[] = ['bill', 'help', 'cutlery', 'clean'];
  if (!obj.reason || !validReasons.includes(obj.reason as WaiterCallReason)) {
    return { success: false, error: 'Некорректная причина вызова официанта' };
  }

  return {
    success: true,
    data: {
      tableNumber,
      reason: obj.reason as WaiterCallReason,
    },
  };
}
