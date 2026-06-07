import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';
import { formatCurrency, toNumber } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { PartnerForm } from '@/components/PartnerForm';

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
  const session = await requireSession();
  const [customers, tenant] = await Promise.all([
    prisma.customer.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { name: 'asc' },
    }),
    prisma.tenant.findUnique({ where: { id: session.tenantId } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">العملاء</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="card overflow-x-auto p-0">
            <table className="table">
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>الهاتف</th>
                  <th>البريد</th>
                  <th>الرصيد</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      لا يوجد عملاء
                    </td>
                  </tr>
                )}
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td className="font-medium">{c.name}</td>
                    <td>{c.phone || '-'}</td>
                    <td>{c.email || '-'}</td>
                    <td
                      className={
                        toNumber(c.balance) > 0
                          ? 'font-semibold text-red-600'
                          : 'text-slate-700'
                      }
                    >
                      {formatCurrency(toNumber(c.balance), tenant?.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <div className="card">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Plus className="h-5 w-5" /> عميل جديد
            </h3>
            <PartnerForm endpoint="/api/customers" type="customer" />
          </div>
        </div>
      </div>
    </div>
  );
}
