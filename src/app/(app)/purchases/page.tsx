import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';
import { formatCurrency, formatDateTime, toNumber } from '@/lib/utils';
import { Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PurchasesPage() {
  const session = await requireSession();
  const [invoices, tenant] = await Promise.all([
    prisma.purchaseInvoice.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { date: 'desc' },
      take: 100,
      include: { supplier: true, items: true },
    }),
    prisma.tenant.findUnique({ where: { id: session.tenantId } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">المشتريات</h1>
          <p className="text-sm text-slate-500">فواتير الشراء ومرتجعات المشتريات</p>
        </div>
        <Link href="/purchases/new" className="btn-primary">
          <Plus className="h-4 w-4" />
          فاتورة شراء
        </Link>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="table">
          <thead>
            <tr>
              <th>رقم الفاتورة</th>
              <th>المورد</th>
              <th>التاريخ</th>
              <th>عدد الأصناف</th>
              <th>الإجمالي</th>
              <th>المدفوع</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  لا توجد فواتير شراء بعد
                </td>
              </tr>
            )}
            {invoices.map((inv) => (
              <tr key={inv.id}>
                <td className="font-mono text-xs">{inv.number}</td>
                <td>{inv.supplier?.name || '-'}</td>
                <td>{formatDateTime(inv.date)}</td>
                <td>{inv.items.length}</td>
                <td className="font-semibold">
                  {formatCurrency(toNumber(inv.total), tenant?.currency)}
                </td>
                <td>{formatCurrency(toNumber(inv.paid), tenant?.currency)}</td>
                <td>
                  {inv.status === 'PAID' ? (
                    <span className="badge bg-emerald-50 text-emerald-700">مدفوعة</span>
                  ) : inv.status === 'PARTIAL' ? (
                    <span className="badge bg-blue-50 text-blue-700">جزئية</span>
                  ) : (
                    <span className="badge bg-slate-100 text-slate-700">آجلة</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
