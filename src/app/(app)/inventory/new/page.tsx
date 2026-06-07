import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';
import { ProductForm } from './ProductForm';

export const dynamic = 'force-dynamic';

export default async function NewProductPage() {
  const session = await requireSession();
  const [categories, tenant] = await Promise.all([
    prisma.category.findMany({ where: { tenantId: session.tenantId }, orderBy: { name: 'asc' } }),
    prisma.tenant.findUnique({ where: { id: session.tenantId } }),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">صنف جديد</h1>
      <ProductForm
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        isPharmacy={tenant?.businessType === 'PHARMACY'}
      />
    </div>
  );
}
