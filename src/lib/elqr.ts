import { PaymentDeeplinks } from '@/types/payment';

/**
 * Расчет 16-битной контрольной суммы CRC16-CCITT (0xFFFF, poly 0x1021) для стандарта EMVCo QR
 */
function calculateCrc16(payload: string): string {
  let crc = 0xffff;
  const polynomial = 0x1021;

  for (let i = 0; i < payload.length; i++) {
    const byte = payload.charCodeAt(i);
    for (let bit = 0; bit < 8; bit++) {
      const bitFlag = ((crc >> 15) ^ (byte >> (7 - bit))) & 0x0001;
      crc = (crc << 1) & 0xffff;
      if (bitFlag === 1) {
        crc ^= polynomial;
      }
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Форматирование тега EMVCo TLV: ID (2 символа) + Length (2 символа) + Value
 */
function formatTlv(tag: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${tag}${len}${value}`;
}

export interface ElqrMerchantConfig {
  readonly merchantName: string;
  readonly merchantCity: string;
  readonly merchantTin: string;
  readonly merchantId: string;
  readonly mcc: string; // 5812: Кафе и рестораны
}

export const AURA_MERCHANT_CONFIG: ElqrMerchantConfig = {
  merchantName: 'Aura Cafe Bishkek',
  merchantCity: 'Bishkek',
  merchantTin: '01204202310123',
  merchantId: 'TT-AURA-0042',
  mcc: '5812',
};

/**
 * Генерация строки полезной нагрузки стандарта ELQR (НБКР / EMVCo)
 */
export function generateElqrPayload({
  invoiceNumber,
  amount,
  tableNumber,
  config = AURA_MERCHANT_CONFIG,
}: {
  readonly invoiceNumber: string;
  readonly amount: number;
  readonly tableNumber: number;
  readonly config?: ElqrMerchantConfig;
}): string {
  const formattedAmount = amount.toFixed(2);

  // Собираем Merchant Account Information (Tag 26 для ELQR КР)
  const elqrGuidTlv = formatTlv('00', 'kg.elqr.nbkr');
  const merchantIdTlv = formatTlv('01', config.merchantId);
  const merchantTinTlv = formatTlv('02', config.merchantTin);
  const merchantSubPayload = `${elqrGuidTlv}${merchantIdTlv}${merchantTinTlv}`;
  const tag26 = formatTlv('26', merchantSubPayload);

  // Tag 62: Дополнительные данные (Invoice ID и Номер столика)
  const invTlv = formatTlv('01', invoiceNumber);
  const tableTlv = formatTlv('07', `TABLE-${tableNumber}`);
  const tag62 = formatTlv('62', `${invTlv}${tableTlv}`);

  // Собираем базовую часть без контрольной суммы
  const basePayload =
    formatTlv('00', '01') + // Format indicator
    formatTlv('01', '12') + // Dynamic QR
    tag26 +
    formatTlv('52', config.mcc) + // MCC Кафе
    formatTlv('53', '417') + // 417 = Сом (KGS)
    formatTlv('54', formattedAmount) +
    formatTlv('58', 'KG') + // Кыргызская Республика
    formatTlv('59', config.merchantName) +
    formatTlv('60', config.merchantCity) +
    tag62 +
    '6304'; // Tag CRC с ожидаемой длиной 4

  const crc = calculateCrc16(basePayload);
  return `${basePayload}${crc}`;
}

/**
 * Формирование глубоких ссылок (Deeplinks) для моментального перехода в мобильные банки КР
 */
export function generatePaymentDeeplinks({
  invoiceNumber,
  amount,
  tableNumber,
}: {
  readonly invoiceNumber: string;
  readonly amount: number;
  readonly tableNumber: number;
}): PaymentDeeplinks {
  const encInv = encodeURIComponent(invoiceNumber);
  const encAmt = encodeURIComponent(amount.toString());
  const encTable = encodeURIComponent(tableNumber.toString());

  // Deeplink схема MBANK (Коммерческий банк КЫРГЫЗСТАН)
  const mbankLink = `mbank://pay?invoiceId=${encInv}&amount=${encAmt}&merchant=aura_cafe&table=${encTable}`;

  // Deeplink схема О!Деньги (ГКНТ / Мой О!)
  const odengiLink = `odengi://pay?invoiceId=${encInv}&amount=${encAmt}&service=aura_smart_menu`;

  // Универсальный веб-шлюз ELQR НБКР
  const elqrLink = `https://elqr.nbkr.kg/pay?ref=${encInv}&amount=${encAmt}&mcc=5812`;

  return {
    mbank: mbankLink,
    odengi: odengiLink,
    elqr: elqrLink,
  };
}
