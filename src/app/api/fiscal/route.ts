import { NextRequest, NextResponse } from 'next/server';
import { getAllFiscalReceipts } from '@/lib/serverStore';
import { authorizeStaffRequest } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const auth = authorizeStaffRequest(req, 'canViewAnalytics');
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const receipts = getAllFiscalReceipts();

    const totalFiscalRevenue = receipts.reduce((acc, r) => acc + r.totalAmount, 0);
    const totalNspTax = receipts.reduce((acc, r) => acc + r.taxTotalNsp, 0);

    return NextResponse.json({
      success: true,
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
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
