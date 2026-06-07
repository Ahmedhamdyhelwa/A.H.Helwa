import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';
import { formatCurrency, toNumber } from '@/lib/utils';
import { Plus, AlertTriangle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function InventoryPage() {
  const session = await requireSession();
  const [products, tenant] = await Promise.all([
    prisma.product.findMany({
      where: { tenantId: session.tenantId, isActive: true },
      include: { category: true, stocks: true },
      orderBy: { name: 'asc' },
    }),
    prisma.tenant.findUnique({ where: { id: session.tenantId } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">المخزون</h1>
          <p className="text-sm text-slate-500">إدارة الأصناف وتتبع الكميات</p>
        </div>
        <Link href="/inventory/new" className="btn-primary">
          <Plus className="h-4 w-4" />
          صنف جديد
        </Link>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="table">
          <thead>
            <tr>
              <th>الكود</th>
              <th>الباركود</th>
              <th>الاسم</th>
              <th>التصنيف</th>
              <th>سعر التكلفة</th>
              <th>سعر البيع</th>
              <th>الرصيد</th>
              <th>تنبيهات</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400">
                  لا توجد أصناف. أضف أول صنف.
                </td>
              </tr>
            )}
            {products.map((p) => {
              const totalStock = p.stocks.reduce((s, st) => s + toNumber(st.quantity), 0);
              const low = p.reorderLevel > 0 && totalStock <= p.reorderLevel;
              const expiringSoon =
                p.expiryDate &&
                new Date(p.expiryDate).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000;
              return (
                <tr key={p.id}>
                  <td className="font-mono text-xs">{p.sku}</td>
                  <td className="font-mono text-xs">{p.barcode || '-'}</td>
                  <td className="font-medium">
                    <Link href={`/inventory/${p.id}`} className="hover:text-brand-600">
                      {p.name}
                    </Link>
                  </td>
                  <td>{p.category?.name || '-'}</td>
                  <td>{formatCurrency(toNumber(p.costPrice), tenant?.currency)}</td>
                  <td>{formatCurrency(toNumber(p.sellingPrice), tenant?.currency)}</td>
                  <td className={low ? 'font-bold text-red-600' : 'font-medium'}>
                    {totalStock}
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {low && (
                        <span className="badge bg-red-50 text-red-700">
                          <AlertTriangle className="me-1 inline h-3 w-3" />
                          منخفض
                        </span>
                      )}
                      {expiringSoon && (
                        <span className="badge bg-amber-50 text-amber-700">
                          ينتهي قريباً
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
