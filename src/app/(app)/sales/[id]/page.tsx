import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';
import { formatCurrency, formatDateTime, toNumber } from '@/lib/utils';
import { PrintButton } from '@/components/PrintButton';

export const dynamic = 'force-dynamic';

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const session = await requireSession();
  const invoice = await prisma.salesInvoice.findFirst({
    where: { id: params.id, tenantId: session.tenantId },
    include: {
      customer: true,
      cashier: true,
      branch: true,
      items: { include: { product: true } },
    },
  });

  if (!invoice) notFound();
  const tenant = await prisma.tenant.findUnique({ where: { id: session.tenantId } });
  const currency = tenant?.currency || 'EGP';

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between no-print">
        <h1 className="text-2xl font-bold">فاتورة بيع</h1>
        <PrintButton />
      </div>

      <div className="card space-y-6">
        <div className="flex items-start justify-between border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-xl font-bold">{tenant?.name}</h2>
            <div className="text-sm text-slate-500">{invoice.branch.name}</div>
          </div>
          <div className="text-left">
            <div className="text-sm text-slate-500">رقم الفاتورة</div>
            <div className="font-mono text-lg font-bold">{invoice.number}</div>
            <div className="mt-1 text-sm text-slate-500">{formatDateTime(invoice.date)}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-slate-500">العميل</div>
            <div className="font-medium">{invoice.customer?.name || 'عميل نقدي'}</div>
          </div>
          <div>
            <div className="text-slate-500">الكاشير</div>
            <div className="font-medium">{invoice.cashier?.fullName || '-'}</div>
          </div>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>الصنف</th>
              <th>الكمية</th>
              <th>السعر</th>
              <th>خصم</th>
              <th>ضريبة</th>
              <th>الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, i) => (
              <tr key={item.id}>
                <td>{i + 1}</td>
                <td>{item.product.name}</td>
                <td>{toNumber(item.quantity)}</td>
                <td>{formatCurrency(toNumber(item.unitPrice), currency)}</td>
                <td>{formatCurrency(toNumber(item.discount), currency)}</td>
                <td>{toNumber(item.taxRate)}%</td>
                <td className="font-semibold">
                  {formatCurrency(toNumber(item.total), currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="ms-auto w-full max-w-xs space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">المجموع</span>
            <span>{formatCurrency(toNumber(invoice.subtotal), currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">خصم</span>
            <span>{formatCurrency(toNumber(invoice.discount), currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">ضريبة</span>
            <span>{formatCurrency(toNumber(invoice.tax), currency)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 text-lg font-bold">
            <span>الإجمالي</span>
            <span className="text-brand-700">
              {formatCurrency(toNumber(invoice.total), currency)}
            </span>
          </div>
          <div className="flex justify-between text-emerald-700">
            <span>المدفوع</span>
            <span>{formatCurrency(toNumber(invoice.paid), currency)}</span>
          </div>
          <div className="flex justify-between text-red-700">
            <span>المتبقي</span>
            <span>
              {formatCurrency(
                toNumber(invoice.total) - toNumber(invoice.paid),
                currency,
              )}
            </span>
          </div>
        </div>

        {invoice.notes && (
          <div className="rounded-lg bg-slate-50 p-3 text-sm">
            <div className="mb-1 text-slate-500">ملاحظات</div>
            <div>{invoice.notes}</div>
          </div>
        )}

        <div className="border-t border-slate-200 pt-4 text-center text-xs text-slate-400">
          شكراً لتعاملكم معنا
        </div>
      </div>
    </div>
  );
}
