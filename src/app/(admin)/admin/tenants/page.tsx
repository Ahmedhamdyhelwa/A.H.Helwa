import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function TenantsListPage() {
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { users: true, salesInvoices: true, products: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">المنشآت المشتركة</h1>
        <p className="text-sm text-slate-500">إجمالي: {tenants.length} منشأة</p>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="table">
          <thead>
            <tr>
              <th>الاسم</th>
              <th>المعرّف</th>
              <th>النشاط</th>
              <th>الحالة</th>
              <th>المستخدمون</th>
              <th>الفواتير</th>
              <th>الأصناف</th>
              <th>التسجيل</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tenants.length === 0 && (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-400">
                  لا توجد منشآت مسجّلة بعد
                </td>
              </tr>
            )}
            {tenants.map((t) => (
              <tr key={t.id}>
                <td className="font-medium">{t.name}</td>
                <td className="font-mono text-xs">{t.slug}</td>
                <td>{t.businessType}</td>
                <td>
                  <StatusBadge status={t.status} />
                </td>
                <td>{t._count.users}</td>
                <td>{t._count.salesInvoices}</td>
                <td>{t._count.products}</td>
                <td>{formatDate(t.createdAt)}</td>
                <td>
                  <Link
                    href={`/admin/tenants/${t.id}`}
                    className="text-brand-600 hover:underline"
                  >
                    إدارة
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
