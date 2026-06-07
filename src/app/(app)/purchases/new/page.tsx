import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';
import { toNumber } from '@/lib/utils';
import { PurchaseForm } from './PurchaseForm';

export const dynamic = 'force-dynamic';

export default async function NewPurchasePage() {
  const session = await requireSession();
  const [products, suppliers, tenant] = await Promise.all([
    prisma.product.findMany({
      where: { tenantId: session.tenantId, isActive: true },
      orderBy: { name: 'asc' },
    }),
    prisma.supplier.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { name: 'asc' },
    }),
    prisma.tenant.findUnique({ where: { id: session.tenantId } }),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">فاتورة شراء جديدة</h1>
      <PurchaseForm
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          costPrice: toNumber(p.costPrice),
        }))}
        suppliers={suppliers.map((s) => ({ id: s.id, name: s.name }))}
        currency={tenant?.currency || 'EGP'}
      />
    </div>
  );
}
