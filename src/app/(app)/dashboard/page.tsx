import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';
import { formatCurrency, toNumber } from '@/lib/utils';
import {
  ShoppingCart,
  Wallet,
  Package,
  AlertTriangle,
  TrendingUp,
  Users,
} from 'lucide-react';
import { SalesChart } from './SalesChart';

export const dynamic = 'force-dynamic';

async function getStats(tenantId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [salesToday, salesMonth, totalProducts, lowStock, customerCount, recentSales] =
    await Promise.all([
      prisma.salesInvoice.aggregate({
        where: { tenantId, date: { gte: today }, isReturn: false },
        _sum: { total: true },
        _count: true,
      }),
      prisma.salesInvoice.aggregate({
        where: { tenantId, date: { gte: startOfMonth }, isReturn: false },
        _sum: { total: true },
        _count: true,
      }),
      prisma.product.count({ where: { tenantId, isActive: true } }),
      prisma.product.findMany({
        where: { tenantId, isActive: true, reorderLevel: { gt: 0 } },
        include: { stocks: true },
        take: 50,
      }),
      prisma.customer.count({ where: { tenantId } }),
      prisma.salesInvoice.findMany({
        where: { tenantId },
        orderBy: { date: 'desc' },
        take: 10,
        include: { customer: true },
      }),
    ]);

  const lowStockCount = lowStock.filter((p) => {
    const total = p.stocks.reduce((s, st) => s + toNumber(st.quantity), 0);
    return total <= p.reorderLevel;
  }).length;

  // Last 7 days chart
  const last7Days: { date: string; total: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const start = new Date();
    start.setDate(start.getDate() - i);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const agg = await prisma.salesInvoice.aggregate({
      where: { tenantId, date: { gte: start, lt: end }, isReturn: false },
      _sum: { total: true },
    });
    last7Days.push({
      date: start.toLocaleDateString('ar-EG', { weekday: 'short' }),
      total: toNumber(agg._sum.total),
    });
  }

  return {
    salesToday: toNumber(salesToday._sum.total),
    salesTodayCount: salesToday._count,
    salesMonth: toNumber(salesMonth._sum.total),
    salesMonthCount: salesMonth._count,
    totalProducts,
    lowStockCount,
    customerCount,
    recentSales,
    last7Days,
  };
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  icon: typeof ShoppingCart;
  color: string;
}) {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-slate-500">{title}</div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{value}</div>
        </div>
        <div className={`rounded-lg p-3 ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const session = await requireSession();
  const tenant = await prisma.tenant.findUnique({ where: { id: session.tenantId } });
  const stats = await getStats(session.tenantId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">لوحة التحكم</h1>
        <p className="text-sm text-slate-500">نظرة عامة على نشاطك التجاري</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="مبيعات اليوم"
          value={formatCurrency(stats.salesToday, tenant?.currency)}
          icon={ShoppingCart}
          color="bg-brand-600"
        />
        <StatCard
          title="مبيعات الشهر"
          value={formatCurrency(stats.salesMonth, tenant?.currency)}
          icon={TrendingUp}
          color="bg-emerald-600"
        />
        <StatCard
          title="عدد المنتجات"
          value={String(stats.totalProducts)}
          icon={Package}
          color="bg-indigo-600"
        />
        <StatCard
          title="منتجات قاربت على النفاد"
          value={String(stats.lowStockCount)}
          icon={AlertTriangle}
          color="bg-amber-500"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">مبيعات آخر 7 أيام</h2>
          <SalesChart data={stats.last7Days} />
        </div>
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold">مؤشرات سريعة</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">عدد فواتير اليوم</span>
              <span className="font-semibold">{stats.salesTodayCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">عدد فواتير الشهر</span>
              <span className="font-semibold">{stats.salesMonthCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 flex items-center gap-2">
                <Users className="h-4 w-4" /> العملاء
              </span>
              <span className="font-semibold">{stats.customerCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 flex items-center gap-2">
                <Wallet className="h-4 w-4" /> العملة
              </span>
              <span className="font-semibold">{tenant?.currency}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="mb-4 text-lg font-semibold">أحدث المبيعات</h2>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>رقم الفاتورة</th>
                <th>العميل</th>
                <th>التاريخ</th>
                <th>الإجمالي</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentSales.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-slate-400">
                    لا توجد مبيعات بعد
                  </td>
                </tr>
              )}
              {stats.recentSales.map((s) => (
                <tr key={s.id}>
                  <td className="font-mono text-xs">{s.number}</td>
                  <td>{s.customer?.name || 'عميل نقدي'}</td>
                  <td>{new Date(s.date).toLocaleDateString('ar-EG')}</td>
                  <td>{formatCurrency(toNumber(s.total), tenant?.currency)}</td>
                  <td>
                    <span className="badge bg-emerald-50 text-emerald-700">
                      {s.status === 'POSTED' ? 'مرحّلة' : s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
