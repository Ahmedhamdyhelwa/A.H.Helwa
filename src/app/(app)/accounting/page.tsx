import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';
import { formatCurrency, formatDateTime, toNumber } from '@/lib/utils';
import { PaymentForm } from './PaymentForm';

export const dynamic = 'force-dynamic';

export default async function AccountingPage() {
  const session = await requireSession();
  const [accounts, payments, customers, suppliers, tenant] = await Promise.all([
    prisma.account.findMany({ where: { tenantId: session.tenantId } }),
    prisma.payment.findMany({
      where: { tenantId: session.tenantId },
      include: { account: true, customer: true, supplier: true },
      orderBy: { date: 'desc' },
      take: 50,
    }),
    prisma.customer.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { name: 'asc' },
    }),
    prisma.supplier.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { name: 'asc' },
    }),
    prisma.tenant.findUnique({ where: { id: session.tenantId } }),
  ]);

  const currency = tenant?.currency || 'EGP';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">الحسابات والخزينة</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {accounts.map((a) => (
          <div key={a.id} className="card">
            <div className="text-sm text-slate-500">{a.name}</div>
            <div className="mt-2 text-2xl font-bold">
              {formatCurrency(toNumber(a.balance), currency)}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              {a.type === 'CASH' ? 'خزنة' : a.type === 'BANK' ? 'بنك' : a.type}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="card overflow-x-auto p-0">
            <table className="table">
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>النوع</th>
                  <th>الحساب</th>
                  <th>الطرف</th>
                  <th>المبلغ</th>
                  <th>المرجع</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      لا توجد حركات
                    </td>
                  </tr>
                )}
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td>{formatDateTime(p.date)}</td>
                    <td>
                      {p.direction === 'RECEIPT' ? (
                        <span className="badge bg-emerald-50 text-emerald-700">
                          سند قبض
                        </span>
                      ) : (
                        <span className="badge bg-red-50 text-red-700">سند صرف</span>
                      )}
                    </td>
                    <td>{p.account.name}</td>
                    <td>{p.customer?.name || p.supplier?.name || '-'}</td>
                    <td
                      className={`font-semibold ${
                        p.direction === 'RECEIPT' ? 'text-emerald-700' : 'text-red-700'
                      }`}
                    >
                      {formatCurrency(toNumber(p.amount), currency)}
                    </td>
                    <td className="text-xs text-slate-500">{p.reference || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="card">
            <h3 className="mb-4 text-lg font-semibold">سند قبض / صرف جديد</h3>
            <PaymentForm
              accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
              customers={customers.map((c) => ({ id: c.id, name: c.name }))}
              suppliers={suppliers.map((s) => ({ id: s.id, name: s.name }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
