import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';
import { formatCurrency, toNumber } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const session = await requireSession();
  const tenantId = session.tenantId;
  const currency = (await prisma.tenant.findUnique({ where: { id: tenantId } }))?.currency || 'EGP';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [salesToday, salesMonth, purchasesMonth, expensesMonth, topProducts, lowStock] =
    await Promise.all([
      prisma.salesInvoice.aggregate({
        where: { tenantId, date: { gte: today }, isReturn: false },
        _sum: { total: true, tax: true },
        _count: true,
      }),
      prisma.salesInvoice.aggregate({
        where: { tenantId, date: { gte: startOfMonth }, isReturn: false },
        _sum: { total: true, tax: true },
      }),
      prisma.purchaseInvoice.aggregate({
        where: { tenantId, date: { gte: startOfMonth }, isReturn: false },
        _sum: { total: true },
      }),
      prisma.expense.aggregate({
        where: { tenantId, date: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      prisma.salesInvoiceItem.groupBy({
        by: ['productId'],
        where: { invoice: { tenantId, date: { gte: startOfMonth }, isReturn: false } },
        _sum: { quantity: true, total: true },
        orderBy: { _sum: { total: 'desc' } },
        take: 10,
      }),
      prisma.product.findMany({
        where: { tenantId, isActive: true, reorderLevel: { gt: 0 } },
        include: { stocks: true },
        take: 100,
      }),
    ]);

  const productIds = topProducts.map((t) => t.productId);
  const productMap = new Map(
    (
      await prisma.product.findMany({ where: { id: { in: productIds } } })
    ).map((p) => [p.id, p]),
  );

  // Profit (rough) for month = sum( quantity * (unitPrice - costPrice) - discount )
  const monthSaleItems = await prisma.salesInvoiceItem.findMany({
    where: { invoice: { tenantId, date: { gte: startOfMonth }, isReturn: false } },
  });
  const grossProfit = monthSaleItems.reduce((s, it) => {
    const qty = toNumber(it.quantity);
    return s + qty * (toNumber(it.unitPrice) - toNumber(it.costPrice)) - toNumber(it.discount);
  }, 0);
  const netProfit = grossProfit - toNumber(expensesMonth._sum.amount);

  const lowStockItems = lowStock.filter((p) => {
    const total = p.stocks.reduce((s, st) => s + toNumber(st.quantity), 0);
    return total <= p.reorderLevel;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">التقارير</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <div className="text-sm text-slate-500">مبيعات اليوم</div>
          <div className="mt-2 text-2xl font-bold">
            {formatCurrency(toNumber(salesToday._sum.total), currency)}
          </div>
          <div className="mt-1 text-xs text-slate-400">{salesToday._count} فاتورة</div>
        </div>
        <div className="card">
          <div className="text-sm text-slate-500">مبيعات الشهر</div>
          <div className="mt-2 text-2xl font-bold">
            {formatCurrency(toNumber(salesMonth._sum.total), currency)}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            ضريبة: {formatCurrency(toNumber(salesMonth._sum.tax), currency)}
          </div>
        </div>
        <div className="card">
          <div className="text-sm text-slate-500">مشتريات الشهر</div>
          <div className="mt-2 text-2xl font-bold">
            {formatCurrency(toNumber(purchasesMonth._sum.total), currency)}
          </div>
        </div>
        <div className="card">
          <div className="text-sm text-slate-500">صافي الربح (الشهر)</div>
          <div
            className={`mt-2 text-2xl font-bold ${netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}
          >
            {formatCurrency(netProfit, currency)}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            مصروفات: {formatCurrency(toNumber(expensesMonth._sum.amount), currency)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-4 text-lg font-semibold">الأكثر مبيعاً (الشهر)</h3>
          <table className="table">
            <thead>
              <tr>
                <th>الصنف</th>
                <th>الكمية المباعة</th>
                <th>إجمالي المبيعات</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-slate-400">
                    لا توجد بيانات
                  </td>
                </tr>
              )}
              {topProducts.map((t) => (
                <tr key={t.productId}>
                  <td className="font-medium">{productMap.get(t.productId)?.name || '-'}</td>
                  <td>{toNumber(t._sum.quantity)}</td>
                  <td className="font-semibold">
                    {formatCurrency(toNumber(t._sum.total), currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3 className="mb-4 text-lg font-semibold">منتجات قاربت على النفاد</h3>
          <table className="table">
            <thead>
              <tr>
                <th>الصنف</th>
                <th>الرصيد</th>
                <th>حد إعادة الطلب</th>
              </tr>
            </thead>
            <tbody>
              {lowStockItems.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-slate-400">
                    لا يوجد تنبيهات
                  </td>
                </tr>
              )}
              {lowStockItems.map((p) => {
                const total = p.stocks.reduce((s, st) => s + toNumber(st.quantity), 0);
                return (
                  <tr key={p.id}>
                    <td className="font-medium">{p.name}</td>
                    <td className="font-semibold text-red-600">{total}</td>
                    <td>{p.reorderLevel}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
