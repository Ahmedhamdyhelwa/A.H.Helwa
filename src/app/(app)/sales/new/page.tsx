import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';
import { toNumber } from '@/lib/utils';
import { POSForm } from './POSForm';

export const dynamic = 'force-dynamic';

export default async function NewSalePage() {
  const session = await requireSession();

  const [products, customers, tenant] = await Promise.all([
    prisma.product.findMany({
      where: { tenantId: session.tenantId, isActive: true },
      include: { stocks: { where: { branchId: session.branchId || undefined } } },
      orderBy: { name: 'asc' },
    }),
    prisma.customer.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { name: 'asc' },
    }),
    prisma.tenant.findUnique({ where: { id: session.tenantId } }),
  ]);

  const productData = products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    barcode: p.barcode || '',
    sellingPrice: toNumber(p.sellingPrice),
    taxRate: toNumber(p.taxRate),
    stock: p.stocks.reduce((s, st) => s + toNumber(st.quantity), 0),
  }));

  const customerData = customers.map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">فاتورة بيع جديدة</h1>
      <POSForm
        products={productData}
        customers={customerData}
        currency={tenant?.currency || 'EGP'}
        defaultTaxRate={toNumber(tenant?.taxRate)}
      />
    </div>
  );
}
