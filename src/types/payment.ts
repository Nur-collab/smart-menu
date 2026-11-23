/**
 * Типы данных для платежного шлюза Кыргызской Республики (ELQR, MBANK, О!Деньги)
 * и фискализации ЭККМ (Государственная налоговая служба при Минфине КР - ГНС КР).
 */

export type PaymentGatewayProvider =
  | 'elqr'
  | 'mbank'
  | 'odengi'
  | 'card_to_waiter'
  | 'cash'
  | 'split'
  | 'waiter_qr';

export type PaymentTransactionStatus =
  | 'pending'
  | 'processing'
  | 'paid'
  | 'failed'
  | 'expired';

export interface PaymentDeeplinks {
  readonly mbank: string;
  readonly odengi: string;
  readonly elqr: string;
}

export interface PaymentTransaction {
  readonly id: string;
  readonly orderId: string;
  readonly invoiceNumber: string;
  readonly tableNumber: number;
  readonly amount: number;
  readonly tipAmount: number;
  readonly provider: PaymentGatewayProvider;
  readonly status: PaymentTransactionStatus;
  readonly qrPayload: string;
  readonly deeplinks: PaymentDeeplinks;
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly paidAt?: string;
  readonly fiscalReceiptId?: string;
  readonly externalTransactionId?: string;
}

export interface FiscalReceiptItem {
  readonly id: string;
  readonly name: string;
  readonly quantity: number;
  readonly price: number;
  readonly total: number;
  readonly taxPercent: number;
  readonly taxAmount: number;
}

export interface FiscalReceipt {
  readonly id: string;
  readonly orderId: string;
  readonly transactionId?: string;
  readonly invoiceNumber: string;
  readonly tableNumber: number;
  readonly companyName: string;
  readonly tin: string; // ИНН организации (14 знаков)
  readonly kkmRegNumber: string; // Регистрационный номер ККМ в ГНС КР
  readonly fiscalModuleNumber: string; // Заводской номер ФМ
  readonly fiscalDocNumber: number; // Номер фискального документа (ФД)
  readonly fiscalSign: string; // Фискальный признак документа (ФПД)
  readonly fiscalShiftNumber: number; // Номер смены
  readonly paymentMethod: PaymentGatewayProvider;
  readonly totalAmount: number;
  readonly discountAmount: number;
  readonly tipAmount: number;
  readonly taxTotalNsp: number; // Налог с продаж (2%)
  readonly taxTotalNds: number; // НДС (12% или 0% в зависимости от налогового режима)
  readonly items: readonly FiscalReceiptItem[];
  readonly verificationUrl: string; // Ссылка на портал ГНС КР salyk.kg
  readonly cashierName: string;
  readonly createdAt: string;
}

export interface CreatePaymentRequest {
  readonly orderId: string;
  readonly provider: PaymentGatewayProvider;
}

export interface CreatePaymentResponse {
  readonly transaction: PaymentTransaction;
}

export interface PaymentStatusResponse {
  readonly transaction: PaymentTransaction;
  readonly orderStatus: string;
  readonly fiscalReceipt?: FiscalReceipt;
}

export interface BankWebhookPayload {
  readonly transactionId: string;
  readonly invoiceNumber: string;
  readonly amount: number;
  readonly status: 'SUCCESS' | 'FAILED';
  readonly bankTransactionId: string;
  readonly timestamp: string;
  readonly signature: string;
}
