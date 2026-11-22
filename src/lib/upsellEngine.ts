import { CartItem, MenuItem } from '@/types/menu';

/**
 * Умный алгоритм подбора гармоничных дополнений к корзине (Smart Cross-sell & Upsell)
 */
export function getSmartUpsellRecommendations(
  cart: readonly CartItem[],
  allItems: readonly MenuItem[]
): readonly MenuItem[] {
  if (allItems.length === 0) return [];

  const cartItemIds = new Set(cart.map((c) => c.menuItem.id));
  const availableItems = allItems.filter((item) => item.isAvailable && !cartItemIds.has(item.id));

  if (availableItems.length === 0) return [];

  // Анализируем структуру корзины
  const hasMains = cart.some((c) => c.menuItem.categoryId === 'cat-mains');
  const hasCoffee = cart.some((c) => c.menuItem.categoryId === 'cat-coffee' || c.menuItem.categoryId === 'cat-seasonal');
  const hasDessert = cart.some((c) => c.menuItem.categoryId === 'cat-desserts');
  const hasBreakfast = cart.some((c) => c.menuItem.categoryId === 'cat-breakfast');

  // Кандидаты по правилам сопряжения (Gastronomic Pairing)
  const candidateIds: string[] = [];

  if (hasMains && !hasDessert) {
    // К сытному горячему — десерт дня (Баскский чизкейк)
    candidateIds.push('item-8');
  }

  if ((hasMains || hasBreakfast) && !hasCoffee) {
    // К завтраку или обеду — флэт уайт или тыквенный латте
    candidateIds.push('item-3', 'item-1');
  }

  if (hasCoffee && !hasDessert) {
    // К кофе — чизкейк или сырники
    candidateIds.push('item-8', 'item-4');
  }

  if (hasDessert && !hasCoffee) {
    // К десерту — кофе
    candidateIds.push('item-3', 'item-1');
  }

  // Находим элементы по приоритетным кандидатам
  const prioritized = availableItems.filter((item) => candidateIds.includes(item.id));

  // Дополняем популярными хитами, если кандидатов мало
  const hits = availableItems.filter(
    (item) => item.badges.includes('hit') && !prioritized.some((p) => p.id === item.id)
  );

  const result = [...prioritized, ...hits].slice(0, 3);

  // Если все еще меньше 3 — добиваем первыми доступными
  if (result.length < 3) {
    for (const item of availableItems) {
      if (!result.some((r) => r.id === item.id)) {
        result.push(item);
        if (result.length >= 3) break;
      }
    }
  }

  return result;
}
