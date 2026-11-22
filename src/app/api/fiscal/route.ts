import { NextResponse } from 'next/server';
import { getAllFiscalReceipts } from '@/lib/serverStore';

export async function GET(): Promise<NextResponse> {
  try {
    const receipts = getAllFiscalReceipts();

    const totalFiscalRevenue = receipts.reduce((acc, r) => acc + r.totalAmount, 0);
    const totalNspTax = receipts.reduce((acc, r) => acc + r.taxTotalNsp, 0);

    return NextResponse.json({
      receipts,
      summary: {
        totalReceiptsCount: receipts.length,
        totalFiscalRevenue,
        totalNspTax,
        kkmRegNumber: '0000854219',
        tin: '01204202310123',
        status: 'ONLINE_CONNECTED_GNS_KR',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ошибка получения реестра чеков';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
