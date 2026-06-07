import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';
import { formatCurrency, formatDateTime, toNumber } from '@/lib/utils';
import { ExpenseForm } from './ExpenseForm';

export const dynamic = 'force-dynamic';

export default async function ExpensesPage() {
  const session = await requireSession();
  const [expenses, accounts, tenant] = await Promise.all([
    prisma.expense.findMany({
      where: { tenantId: session.tenantId },
      include: { account: true },
      orderBy: { date: 'desc' },
      take: 100,
    }),
    prisma.account.findMany({ where: { tenantId: session.tenantId } }),
    prisma.tenant.findUnique({ where: { id: session.tenantId } }),
  ]);
  const currency = tenant?.currency || 'EGP';
  const total = expenses.reduce((s, e) => s + toNumber(e.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">المصروفات</h1>
          <p className="text-sm text-slate-500">
            إجمالي المصروفات: {formatCurrency(total, currency)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="card overflow-x-auto p-0">
            <table className="table">
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>التصنيف</th>
                  <th>الحساب</th>
                  <th>المبلغ</th>
                  <th>ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      لا توجد مصروفات
                    </td>
                  </tr>
                )}
                {expenses.map((e) => (
                  <tr key={e.id}>
                    <td>{formatDateTime(e.date)}</td>
                    <td>{e.category}</td>
                    <td>{e.account.name}</td>
                    <td className="font-semibold text-red-700">
                      {formatCurrency(toNumber(e.amount), currency)}
                    </td>
                    <td className="text-xs text-slate-500">{e.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="card">
            <h3 className="mb-4 text-lg font-semibold">مصروف جديد</h3>
            <ExpenseForm accounts={accounts.map((a) => ({ id: a.id, name: a.name }))} />
          </div>
        </div>
      </div>
    </div>
  );
}
