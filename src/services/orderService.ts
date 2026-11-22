import { Order, CartItem, SelectedOption } from '@/types/menu';
import { prisma } from '@/lib/prisma';
import { createOrder } from '@/lib/serverStore';

export interface OrderVerificationResult {
  readonly success: boolean;
  readonly order?: Order;
  readonly error?: string;
}

export class OrderService {
  /**
   * Verify prices against Neon PostgreSQL, validate availability, recalculate totals,
   * enforce business rules (max 30% bonus discount) and persist to storage.
   */
  static async verifyAndCreateOrder(inputOrder: Order): Promise<OrderVerificationResult> {
    const itemIds = Array.from(
      new Set(inputOrder.items.map((i) => i.menuItem?.id).filter(Boolean))
    );

    const dbItems = await prisma.menuItem.findMany({
      where: { id: { in: itemIds } },
      include: {
        optionGroups: {
          include: {
            options: true,
          },
        },
      },
    });

    const dbItemMap = new Map(dbItems.map((item) => [item.id, item]));
    let calculatedSubtotal = 0;
    const verifiedCartItems: CartItem[] = [];

    for (const item of inputOrder.items) {
      if (!item.menuItem?.id) {
        return { success: false, error: 'В заказе обнаружена позиция без идентификатора блюда' };
      }

      const dbItem = dbItemMap.get(item.menuItem.id);
      if (!dbItem) {
        return { success: false, error: `Блюдо #${item.menuItem.id} не найдено в меню заведения` };
      }

      if (!dbItem.isAvailable) {
        return { success: false, error: `Блюдо «${dbItem.name}» временно недоступно (в стоп-листе)` };
      }

      const quantity = Math.max(1, Math.min(50, Math.floor(Number(item.quantity) || 1)));

      let verifiedOptionsDelta = 0;
      const verifiedSelectedOptions: SelectedOption[] = [];

      if (Array.isArray(item.selectedOptions)) {
        const availableOptionsMap = new Map<
          string,
          { groupId: string; groupTitle: string; name: string; price: number }
        >();
        for (const group of dbItem.optionGroups) {
          for (const opt of group.options) {
            availableOptionsMap.set(opt.id, {
              groupId: group.id,
              groupTitle: group.title,
              name: opt.name,
              price: opt.price,
            });
          }
        }

        for (const selOpt of item.selectedOptions) {
          const matchedOpt = availableOptionsMap.get(selOpt.optionId);
          if (matchedOpt) {
            verifiedOptionsDelta += matchedOpt.price;
            verifiedSelectedOptions.push({
              groupId: matchedOpt.groupId,
              groupTitle: matchedOpt.groupTitle,
              optionId: selOpt.optionId,
              optionName: matchedOpt.name,
              price: matchedOpt.price,
            });
          }
        }
      }

      const verifiedUnitPrice = dbItem.price + verifiedOptionsDelta;
      calculatedSubtotal += verifiedUnitPrice * quantity;

      verifiedCartItems.push({
        ...item,
        quantity,
        unitPrice: verifiedUnitPrice,
        selectedOptions: verifiedSelectedOptions,
      });
    }

    const safeTipAmount = Math.max(0, Math.floor(Number(inputOrder.tipAmount) || 0));
    const maxAllowedDiscount = Math.round(calculatedSubtotal * 0.3);
    const safeDiscountAmount = Math.max(
      0,
      Math.min(maxAllowedDiscount, Math.floor(Number(inputOrder.discountAmount) || 0))
    );
    const calculatedFinalAmount = Math.max(
      0,
      calculatedSubtotal - safeDiscountAmount + safeTipAmount
    );

    const safeOrder: Order = {
      ...inputOrder,
      items: verifiedCartItems,
      totalAmount: calculatedSubtotal,
      discountAmount: safeDiscountAmount,
      tipAmount: safeTipAmount,
      finalAmount: calculatedFinalAmount,
    };

    const savedOrder = await createOrder(safeOrder);
    return { success: true, order: savedOrder };
  }
}
