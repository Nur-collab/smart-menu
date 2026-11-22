import { MenuItem } from '@/types/menu';

export interface PriceCalculationResult {
  readonly currentPrice: number;
  readonly originalPrice: number;
  readonly isHappyHoursDiscount: boolean;
  readonly discountPercentage: number;
}

/**
 * Проверка активности режима Happy Hours по системному времени (20:00 - 23:59)
 * или принудительному флагу заведения
 */
export function isDefaultHappyHoursTime(): boolean {
  if (typeof window === 'undefined') return false;
  const currentHour = new Date().getHours();
  return currentHour >= 20 || currentHour < 2; // вечерние и ночные часы
}

/**
 * Расчет эффективной цены позиции с учетом Happy Hours (скидка 20% на десерты и выпечку)
 */
export function calculateItemPrice(
  item: MenuItem,
  happyHoursEnabled: boolean
): PriceCalculationResult {
  const isDessertOrPastry =
    item.categoryId === 'cat-desserts' ||
    item.name.toLowerCase().includes('чизкейк') ||
    item.name.toLowerCase().includes('круассан') ||
    item.name.toLowerCase().includes('тирамису');

  if (happyHoursEnabled && isDessertOrPastry) {
    const discounted = Math.round(item.price * 0.8); // -20%
    return {
      currentPrice: discounted,
      originalPrice: item.oldPrice ?? item.price,
      isHappyHoursDiscount: true,
      discountPercentage: 20,
    };
  }

  return {
    currentPrice: item.price,
    originalPrice: item.oldPrice ?? item.price,
    isHappyHoursDiscount: false,
    discountPercentage: item.oldPrice ? Math.round(((item.oldPrice - item.price) / item.oldPrice) * 100) : 0,
  };
}
