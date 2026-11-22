import { NextResponse } from 'next/server';
import { getPosConfig, updatePosConfig, getAllPrinters, updatePrinterConfig } from '@/lib/posBridge';
import { PosConfig, PrinterConfig } from '@/types/pos';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  try {
    const config = getPosConfig();
    const printers = getAllPrinters();

    return NextResponse.json({
      config,
      printers,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ошибка получения POS конфигурации';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as {
      posConfig?: Partial<PosConfig>;
      printerId?: string;
      printerConfig?: Partial<PrinterConfig>;
    };

    if (body.posConfig) {
      updatePosConfig(body.posConfig);
    }

    if (body.printerId && body.printerConfig) {
      updatePrinterConfig(body.printerId, body.printerConfig);
    }

    const updatedConfig = getPosConfig();
    const updatedPrinters = getAllPrinters();

    return NextResponse.json({
      success: true,
      message: 'Настройки кассовой системы и оборудования сохранены',
      config: updatedConfig,
      printers: updatedPrinters,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ошибка сохранения конфигурации';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
