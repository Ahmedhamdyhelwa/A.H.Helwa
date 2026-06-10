import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { formatCurrency, formatDateTime, toNumber } from '@/lib/utils';
import { TenantActions } from './TenantActions';

export const dynamic = 'force-dynamic';

export default async function TenantDetailPage({ params }: { params: { id: string } }) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: params.id },
    include: {
      users: { orderBy: { createdAt: 'asc' } },
      branches: true,
      _count: { select: { salesInvoices: true, products: true, customers: true } },
    },
  });

  if (!tenant) notFound();

  const salesAgg = await prisma.salesInvoice.aggregate({
    where: { tenantId: tenant.id, isReturn: false },
    _sum: { total: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{tenant.name}</h1>
        <div className="text-sm text-slate-500">المعرّف: <span className="font-mono">{tenant.slug}</span></div>
      </div>

      <TenantActions tenantId={tenant.id} status={tenant.status} suspendedReason={tenant.suspendedReason || ''} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="نوع النشاط" value={tenant.businessType} />
        <Card label="الخطة" value={tenant.plan} />
        <Card label="العملة" value={tenant.currency} />
        <Card
          label="تاريخ التسجيل"
          value={new Date(tenant.createdAt).toLocaleDateString('ar-EG')}
        />
        <Card label="عدد المستخدمين" value={String(tenant.users.length)} />
        <Card label="عدد الفروع" value={String(tenant.branches.length)} />
        <Card label="عدد الأصناف" value={String(tenant._count.products)} />
        <Card label="عدد الفواتير" value={String(tenant._count.salesInvoices)} />
        <Card
          label="إجمالي المبيعات (كل الوقت)"
          value={formatCurrency(toNumber(salesAgg._sum.total), tenant.currency)}
        />
        <Card label="عدد العملاء" value={String(tenant._count.customers)} />
        {tenant.suspendedAt && (
          <Card
            label="تاريخ التعليق"
            value={formatDateTime(tenant.suspendedAt)}
          />
        )}
      </div>

      <div className="card overflow-x-auto p-0">
        <div className="border-b border-slate-100 p-4">
          <h3 className="text-lg font-semibold">المستخدمون</h3>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>الاسم</th>
              <th>البريد</th>
              <th>الدور</th>
              <th>الحالة</th>
              <th>تاريخ الإنشاء</th>
            </tr>
          </thead>
          <tbody>
            {tenant.users.map((u) => (
              <tr key={u.id}>
                <td className="font-medium">{u.fullName}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{u.isActive ? 'نشط' : 'معطل'}</td>
                <td>{new Date(u.createdAt).toLocaleDateString('ar-EG')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="card">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-bold">{value}</div>
    </div>
  );
}
