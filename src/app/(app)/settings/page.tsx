import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';
import { ROLE_LABELS } from '@/lib/rbac';
import { UserForm } from './UserForm';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const session = await requireSession();
  const [tenant, users, branches] = await Promise.all([
    prisma.tenant.findUnique({ where: { id: session.tenantId } }),
    prisma.user.findMany({
      where: { tenantId: session.tenantId },
      include: { branch: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.branch.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { isMain: 'desc' },
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">الإعدادات</h1>

      <div className="card">
        <h3 className="mb-4 text-lg font-semibold">معلومات المنشأة</h3>
        <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div>
            <div className="text-slate-500">الاسم</div>
            <div className="font-medium">{tenant?.name}</div>
          </div>
          <div>
            <div className="text-slate-500">المعرّف (Slug)</div>
            <div className="font-mono font-medium">{tenant?.slug}</div>
          </div>
          <div>
            <div className="text-slate-500">نوع النشاط</div>
            <div className="font-medium">{tenant?.businessType}</div>
          </div>
          <div>
            <div className="text-slate-500">العملة</div>
            <div className="font-medium">{tenant?.currency}</div>
          </div>
          <div>
            <div className="text-slate-500">الخطة</div>
            <div className="font-medium">{tenant?.plan}</div>
          </div>
          <div>
            <div className="text-slate-500">الحالة</div>
            <div className="font-medium">{tenant?.status}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="mb-4 text-lg font-semibold">الفروع</h3>
        <table className="table">
          <thead>
            <tr>
              <th>الاسم</th>
              <th>العنوان</th>
              <th>الهاتف</th>
              <th>افتراضي</th>
            </tr>
          </thead>
          <tbody>
            {branches.map((b) => (
              <tr key={b.id}>
                <td className="font-medium">{b.name}</td>
                <td>{b.address || '-'}</td>
                <td>{b.phone || '-'}</td>
                <td>
                  {b.isMain ? (
                    <span className="badge bg-brand-50 text-brand-700">رئيسي</span>
                  ) : (
                    '-'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
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
                  <th>الفرع</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="font-medium">{u.fullName}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className="badge bg-indigo-50 text-indigo-700">
                        {ROLE_LABELS[u.role]}
                      </span>
                    </td>
                    <td>{u.branch?.name || '-'}</td>
                    <td>
                      {u.isActive ? (
                        <span className="badge bg-emerald-50 text-emerald-700">نشط</span>
                      ) : (
                        <span className="badge bg-slate-100 text-slate-700">معطل</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="card">
            <h3 className="mb-4 text-lg font-semibold">إضافة مستخدم</h3>
            <UserForm
              branches={branches.map((b) => ({ id: b.id, name: b.name }))}
              canManage={session.role === 'OWNER' || session.role === 'MANAGER'}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
