/**
 * Типы данных для интеграции с ресторанными кассовыми системами (POS)
 * (iikoCloud, Poster POS, r-keeper) и сетевой термопечати бегунков (ESC/POS).
 */

export type PosProviderType = 'iiko' | 'poster' | 'rkeeper' | 'autonomous';

export interface PosConfig {
  readonly provider: PosProviderType;
  readonly apiUrl: string;
  readonly apiKey: string;
  readonly organizationId: string;
  readonly terminalGroupId: string;
  readonly autoSendOrders: boolean;
  readonly autoSyncStopList: boolean;
  readonly isConnected: boolean;
  readonly lastSyncAt?: string;
}

export type PrinterPaperWidth = '80mm' | '58mm';
export type PrinterDepartment = 'kitchen' | 'bar' | 'all';

export interface PrinterConfig {
  readonly id: string;
  readonly name: string;
  readonly ipAddress: string;
  readonly port: number; // Стандартный порт термопринтеров 9100
  readonly paperWidth: PrinterPaperWidth;
  readonly department: PrinterDepartment;
  readonly autoCut: boolean;
  readonly isEnabled: boolean;
  readonly lastPrintAt?: string;
}

export type PosSyncLogType =
  | 'order_push'
  | 'menu_sync'
  | 'stoplist_sync'
  | 'print_ticket';

export type PosSyncLogStatus = 'success' | 'warning' | 'error';

export interface PosSyncLog {
  readonly id: string;
  readonly timestamp: string;
  readonly type: PosSyncLogType;
  readonly status: PosSyncLogStatus;
  readonly message: string;
  readonly details?: string;
}

export interface PosOrderResult {
  readonly success: boolean;
  readonly posOrderId: string;
  readonly provider: PosProviderType;
  readonly message: string;
  readonly syncTimestamp: string;
}

export interface EscPosTicketResult {
  readonly success: boolean;
  readonly printerId: string;
  readonly printerName: string;
  readonly ipAddress: string;
  readonly bytesCount: number;
  readonly textPreview: string;
  readonly printedAt: string;
}
