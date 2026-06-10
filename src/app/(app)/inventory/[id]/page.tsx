import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';
import { formatCurrency, formatDateTime, toNumber } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const MOVEMENT_LABELS: Record<string, string> = {
  PURCHASE: 'شراء',
  SALE: 'بيع',
  RETURN_IN: 'مرتجع وارد',
  RETURN_OUT: 'مرتجع صادر',
  ADJUSTMENT: 'تسوية',
  TRANSFER_IN: 'تحويل وارد',
  TRANSFER_OUT: 'تحويل صادر',
};

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const session = await requireSession();
  const product = await prisma.product.findFirst({
    where: { id: params.id, tenantId: session.tenantId },
    include: {
      category: true,
      stocks: { include: { branch: true } },
      movements: { orderBy: { createdAt: 'desc' }, take: 50, include: { branch: true } },
    },
  });
  if (!product) notFound();
  const tenant = await prisma.tenant.findUnique({ where: { id: session.tenantId } });
  const currency = tenant?.currency || 'EGP';
  const totalStock = product.stocks.reduce((s, st) => s + toNumber(st.quantity), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{product.name}</h1>
          <div className="text-sm text-slate-500">{product.category?.name}</div>
        </div>
        <Link href={`/inventory/${product.id}/edit`} className="btn-secondary">
          <Pencil className="h-4 w-4" />
          تعديل الصنف
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <div className="text-sm text-slate-500">SKU</div>
          <div className="mt-1 font-mono font-semibold">{product.sku}</div>
        </div>
        <div className="card">
          <div className="text-sm text-slate-500">الباركود</div>
          <div className="mt-1 font-mono font-semibold">{product.barcode || '-'}</div>
        </div>
        <div className="card">
          <div className="text-sm text-slate-500">سعر التكلفة</div>
          <div className="mt-1 text-lg font-bold">
            {formatCurrency(toNumber(product.costPrice), currency)}
          </div>
        </div>
        <div className="card">
          <div className="text-sm text-slate-500">سعر البيع</div>
          <div className="mt-1 text-lg font-bold text-brand-700">
            {formatCurrency(toNumber(product.sellingPrice), currency)}
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="mb-4 text-lg font-semibold">الرصيد بالفروع — إجمالي: {totalStock}</h3>
        <table className="table">
          <thead>
            <tr>
              <th>الفرع</th>
              <th>الكمية</th>
            </tr>
          </thead>
          <tbody>
            {product.stocks.map((s) => (
              <tr key={s.id}>
                <td>{s.branch.name}</td>
                <td className="font-semibold">{toNumber(s.quantity)}</td>
              </tr>
            ))}
            {product.stocks.length === 0 && (
              <tr>
                <td colSpan={2} className="py-4 text-center text-slate-400">
                  لا يوجد رصيد
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3 className="mb-4 text-lg font-semibold">سجل الحركات</h3>
        <table className="table">
          <thead>
            <tr>
              <th>التاريخ</th>
              <th>النوع</th>
              <th>الكمية</th>
              <th>الفرع</th>
              <th>المرجع</th>
            </tr>
          </thead>
          <tbody>
            {product.movements.map((m) => (
              <tr key={m.id}>
                <td>{formatDateTime(m.createdAt)}</td>
                <td>{MOVEMENT_LABELS[m.type] || m.type}</td>
                <td>{toNumber(m.quantity)}</td>
                <td>{m.branch.name}</td>
                <td className="font-mono text-xs">{m.reference || '-'}</td>
              </tr>
            ))}
            {product.movements.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-slate-400">
                  لا توجد حركات
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
