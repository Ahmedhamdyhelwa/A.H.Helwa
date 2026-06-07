import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';
import { formatCurrency, formatDateTime, toNumber } from '@/lib/utils';
import { Plus, Printer } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SalesPage() {
  const session = await requireSession();

  const [invoices, tenant] = await Promise.all([
    prisma.salesInvoice.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { date: 'desc' },
      take: 100,
      include: { customer: true, items: true, cashier: true },
    }),
    prisma.tenant.findUnique({ where: { id: session.tenantId } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">المبيعات</h1>
          <p className="text-sm text-slate-500">إدارة فواتير البيع والمرتجعات</p>
        </div>
        <Link href="/sales/new" className="btn-primary">
          <Plus className="h-4 w-4" />
          فاتورة جديدة
        </Link>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="table">
          <thead>
            <tr>
              <th>رقم الفاتورة</th>
              <th>العميل</th>
              <th>الكاشير</th>
              <th>التاريخ</th>
              <th>عدد الأصناف</th>
              <th>الإجمالي</th>
              <th>الحالة</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400">
                  لا توجد فواتير بعد. أنشئ أول فاتورة الآن.
                </td>
              </tr>
            )}
            {invoices.map((inv) => (
              <tr key={inv.id}>
                <td className="font-mono text-xs">{inv.number}</td>
                <td>{inv.customer?.name || 'عميل نقدي'}</td>
                <td>{inv.cashier?.fullName || '-'}</td>
                <td>{formatDateTime(inv.date)}</td>
                <td>{inv.items.length}</td>
                <td className="font-semibold">
                  {formatCurrency(toNumber(inv.total), tenant?.currency)}
                </td>
                <td>
                  {inv.isReturn ? (
                    <span className="badge bg-amber-50 text-amber-700">مرتجع</span>
                  ) : inv.status === 'PAID' ? (
                    <span className="badge bg-emerald-50 text-emerald-700">مدفوعة</span>
                  ) : inv.status === 'PARTIAL' ? (
                    <span className="badge bg-blue-50 text-blue-700">جزئية</span>
                  ) : (
                    <span className="badge bg-slate-100 text-slate-700">مرحّلة</span>
                  )}
                </td>
                <td>
                  <Link
                    href={`/sales/${inv.id}`}
                    className="inline-flex items-center gap-1 text-brand-600 hover:underline"
                  >
                    <Printer className="h-4 w-4" />
                    عرض / طباعة
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
