export type BadgeType =
  | 'vegan'
  | 'spicy'
  | 'gluten_free'
  | 'hit'
  | 'chef_choice'
  | 'discount'
  | 'breakfast';

export type WeatherType = 'cold' | 'hot' | 'rain' | 'sunny' | 'all';

export interface Category {
  readonly id: string;
  readonly name: string;
  readonly nameKg?: string;
  readonly nameEn?: string;
  readonly slug: string;
  readonly iconName: string;
  readonly order: number;
}

export interface MenuItemOption {
  readonly id: string;
  readonly name: string;
  readonly nameKg?: string;
  readonly nameEn?: string;
  readonly price: number;
}

export interface MenuItemOptionGroup {
  readonly id: string;
  readonly title: string;
  readonly titleKg?: string;
  readonly titleEn?: string;
  readonly required: boolean;
  readonly multiple: boolean;
  readonly options: readonly MenuItemOption[];
}

export interface MenuItem {
  readonly id: string;
  readonly categoryId: string;
  readonly name: string;
  readonly nameKg?: string;
  readonly nameEn?: string;
  readonly description: string;
  readonly descriptionKg?: string;
  readonly descriptionEn?: string;
  readonly price: number;
  readonly oldPrice?: number;
  readonly imageUrl: string;
  readonly weight: string;
  readonly calories: number;
  readonly proteins: number;
  readonly fats: number;
  readonly carbs: number;
  readonly allergens: readonly string[];
  readonly badges: readonly BadgeType[];
  readonly isAvailable: boolean;
  readonly cookingTimeMinutes: number;
  readonly weatherAffinity?: WeatherType;
  readonly recommendedItemIds: readonly string[];
  readonly optionGroups?: readonly MenuItemOptionGroup[];
}

export interface SelectedOption {
  readonly groupId: string;
  readonly groupTitle: string;
  readonly optionId: string;
  readonly optionName: string;
  readonly price: number;
}

export interface CartItem {
  readonly cartItemId: string;
  readonly menuItem: MenuItem;
  readonly quantity: number;
  readonly selectedOptions: readonly SelectedOption[];
  readonly comment?: string;
  readonly unitPrice: number;
}

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'cooking'
  | 'ready'
  | 'served'
  | 'paid'
  | 'cancelled';

// Способы оплаты с учетом рынка Кыргызстана: ELQR (Национальный QR КР), MBANK QR, О!Деньги, Терминал (Элкарт/Visa), Наличные, Сплит
export type PaymentMethod =
  | 'elqr'
  | 'mbank'
  | 'odengi'
  | 'card_to_waiter'
  | 'cash'
  | 'split';

export interface Order {
  readonly id: string;
  readonly tableNumber: number;
  readonly items: readonly CartItem[];
  readonly totalAmount: number;
  readonly discountAmount: number;
  readonly tipAmount: number;
  readonly finalAmount: number;
  readonly paymentMethod: PaymentMethod;
  readonly status: OrderStatus;
  readonly guestComment?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type WaiterCallReason = 'bill' | 'help' | 'cutlery' | 'clean';

export interface WaiterCall {
  readonly id: string;
  readonly tableNumber: number;
  readonly reason: WaiterCallReason;
  readonly status: 'pending' | 'resolved';
  readonly createdAt: string;
}

export interface DishReview {
  readonly id: string;
  readonly menuItemId: string;
  readonly tableNumber: number;
  readonly rating: number;
  readonly comment: string;
  readonly createdAt: string;
}

export interface SplitGuest {
  readonly id: string;
  readonly name: string;
  readonly itemIndices: readonly number[];
  readonly isPaid: boolean;
}

export interface CafeInfo {
  readonly name: string;
  readonly address: string;
  readonly city: string;
  readonly currency: string;
  readonly openHours: string;
  readonly wifiName: string;
  readonly wifiPass: string;
  readonly cashbackPercent: number;
  readonly currentTemperature: number;
  readonly weatherDescription: string;
  readonly weatherType: WeatherType;
}

export interface ServerEventData {
  readonly type:
    | 'INIT'
    | 'NEW_ORDER'
    | 'UPDATE_ORDER'
    | 'NEW_WAITER_CALL'
    | 'RESOLVE_WAITER_CALL'
    | 'UPDATE_STOPLIST'
    | 'MENU_UPDATED'
    | 'PAYMENT_SUCCESS'
    | 'NEW_FISCAL_RECEIPT';
  readonly payload: unknown;
  readonly timestamp: string;
}
