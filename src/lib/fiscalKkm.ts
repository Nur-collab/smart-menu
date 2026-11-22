import { Order } from '@/types/menu';
import { FiscalReceipt, FiscalReceiptItem } from '@/types/payment';

export interface FiscalConfig {
  readonly companyName: string;
  readonly tin: string;
  readonly kkmRegNumber: string;
  readonly fiscalModuleNumber: string;
  readonly address: string;
  readonly city: string;
  readonly cashierName: string;
  readonly nspPercent: number; // 2% для общепита
}

export const AURA_FISCAL_CONFIG: FiscalConfig = {
  companyName: 'ОсОО "Аура Ресторанс Групп Бишкек"',
  tin: '01204202310123',
  kkmRegNumber: '0000854219',
  fiscalModuleNumber: 'FM-KG-99214',
  address: 'бул. Эркиндик, 35',
  city: 'г. Бишкек',
  cashierName: 'Кассир-автомат ЭККМ #1',
  nspPercent: 2,
};

let fiscalDocCounter = 1047;
const fiscalShiftCounter = 42;

/**
 * Псевдокриптографический расчет 9-значного фискального признака документа (ФПД)
 * на основе реквизитов чека и секретного ключа фискального модуля.
 */
function computeFiscalSign(orderId: string, docNumber: number, totalAmount: number): string {
  const secretKey = 'AURA_KKM_SECRET_KG_2026';
  const seedString = `${orderId}-${docNumber}-${totalAmount}-${secretKey}`;

  let hash = 5381;
  for (let i = 0; i < seedString.length; i++) {
    hash = ((hash << 5) + hash) ^ seedString.charCodeAt(i);
  }

  const positiveHash = Math.abs(hash);
  const nineDigits = (positiveHash % 900000000) + 100000000;
  return nineDigits.toString();
}

/**
 * Создание официального электронного чека ЭККМ ГНС КР на основе заказа
 */
export function createFiscalReceiptFromOrder({
  order,
  transactionId,
  config = AURA_FISCAL_CONFIG,
}: {
  readonly order: Order;
  readonly transactionId?: string;
  readonly config?: FiscalConfig;
}): FiscalReceipt {
  fiscalDocCounter += 1;
  const currentDocNumber = fiscalDocCounter;
  const now = new Date().toISOString();

  // Расчет фискальных позиций и налога с продаж
  const receiptItems: FiscalReceiptItem[] = order.items.map((item, idx) => {
    const itemTotal = item.unitPrice * item.quantity;
    const taxAmount = Math.round((itemTotal * (config.nspPercent / (100 + config.nspPercent))) * 100) / 100;

    return {
      id: `pos-${idx + 1}`,
      name: item.menuItem.name,
      quantity: item.quantity,
      price: item.unitPrice,
      total: itemTotal,
      taxPercent: config.nspPercent,
      taxAmount,
    };
  });

  const totalNsp = Math.round((order.finalAmount * (config.nspPercent / 100)) * 100) / 100;
  const fiscalSign = computeFiscalSign(order.id, currentDocNumber, order.finalAmount);

  // Ссылка верификации на портале Государственной налоговой службы Кыргызстана (ГНС КР)
  const verificationUrl = `https://salyk.kg/check?tin=${config.tin}&kkm=${config.kkmRegNumber}&fd=${currentDocNumber}&fpd=${fiscalSign}`;

  return {
    id: `fisc-${currentDocNumber}`,
    orderId: order.id,
    transactionId,
    invoiceNumber: `INV-KG-${new Date().getFullYear()}-${currentDocNumber}`,
    tableNumber: order.tableNumber,
    companyName: config.companyName,
    tin: config.tin,
    kkmRegNumber: config.kkmRegNumber,
    fiscalModuleNumber: config.fiscalModuleNumber,
    fiscalDocNumber: currentDocNumber,
    fiscalSign,
    fiscalShiftNumber: fiscalShiftCounter,
    paymentMethod: order.paymentMethod,
    totalAmount: order.finalAmount,
    discountAmount: order.discountAmount,
    tipAmount: order.tipAmount,
    taxTotalNsp: totalNsp,
    taxTotalNds: 0, // Общепит по упрощенной системе / единому налогу (НСП 2%)
    items: receiptItems,
    verificationUrl,
    cashierName: config.cashierName,
    createdAt: now,
  };
}
