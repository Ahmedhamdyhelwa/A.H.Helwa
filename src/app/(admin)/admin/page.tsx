import { prisma } from '@/lib/prisma';
import { formatCurrency, toNumber } from '@/lib/utils';
import { Building2, Users, ShoppingCart, TrendingUp } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [tenantCount, activeCount, suspendedCount, userCount, salesAgg, recentTenants] =
    await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { status: { in: ['ACTIVE', 'TRIAL'] } } }),
      prisma.tenant.count({ where: { status: { in: ['PAST_DUE', 'CANCELED'] } } }),
      prisma.user.count(),
      prisma.salesInvoice.aggregate({
        where: { date: { gte: startOfMonth }, isReturn: false },
        _sum: { total: true },
        _count: true,
      }),
      prisma.tenant.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
    ]);

  const Stat = ({
    title,
    value,
    icon: Icon,
    color,
  }: {
    title: string;
    value: string;
    icon: typeof Building2;
    color: string;
  }) => (
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">لوحة المنصة</h1>
        <p className="text-sm text-slate-500">نظرة شاملة على كل المنشآت المشتركة في نظامك</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat title="إجمالي المنشآت" value={String(tenantCount)} icon={Building2} color="bg-purple-600" />
        <Stat title="منشآت نشطة" value={String(activeCount)} icon={TrendingUp} color="bg-emerald-600" />
        <Stat title="منشآت معلّقة" value={String(suspendedCount)} icon={Building2} color="bg-amber-500" />
        <Stat title="إجمالي المستخدمين" value={String(userCount)} icon={Users} color="bg-blue-600" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Stat
          title="إجمالي المبيعات على المنصة (هذا الشهر)"
          value={formatCurrency(toNumber(salesAgg._sum.total))}
          icon={ShoppingCart}
          color="bg-indigo-600"
        />
        <Stat
          title="عدد الفواتير (هذا الشهر)"
          value={String(salesAgg._count)}
          icon={ShoppingCart}
          color="bg-pink-600"
        />
      </div>

      <div className="card">
        <h2 className="mb-4 text-lg font-semibold">آخر منشآت سُجِّلت</h2>
        <table className="table">
          <thead>
            <tr>
              <th>الاسم</th>
              <th>المعرّف</th>
              <th>النشاط</th>
              <th>الخطة</th>
              <th>الحالة</th>
              <th>تاريخ التسجيل</th>
            </tr>
          </thead>
          <tbody>
            {recentTenants.map((t) => (
              <tr key={t.id}>
                <td className="font-medium">{t.name}</td>
                <td className="font-mono text-xs">{t.slug}</td>
                <td>{t.businessType}</td>
                <td>{t.plan}</td>
                <td>
                  <StatusBadge status={t.status} />
                </td>
                <td>{new Date(t.createdAt).toLocaleDateString('ar-EG')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    ACTIVE: { label: 'نشطة', cls: 'bg-emerald-50 text-emerald-700' },
    TRIAL: { label: 'تجريبية', cls: 'bg-blue-50 text-blue-700' },
    PAST_DUE: { label: 'معلّقة', cls: 'bg-amber-50 text-amber-700' },
    CANCELED: { label: 'ملغية', cls: 'bg-red-50 text-red-700' },
  };
  const m = map[status] || { label: status, cls: 'bg-slate-100 text-slate-700' };
  return <span className={`badge ${m.cls}`}>{m.label}</span>;
}
