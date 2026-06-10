import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';
import { toNumber } from '@/lib/utils';
import { ProductEditForm } from './ProductEditForm';

export const dynamic = 'force-dynamic';

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const session = await requireSession();
  const [product, categories, tenant] = await Promise.all([
    prisma.product.findFirst({
      where: { id: params.id, tenantId: session.tenantId },
    }),
    prisma.category.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { name: 'asc' },
    }),
    prisma.tenant.findUnique({ where: { id: session.tenantId } }),
  ]);

  if (!product) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">تعديل الصنف</h1>
      <ProductEditForm
        product={{
          id: product.id,
          sku: product.sku,
          barcode: product.barcode || '',
          name: product.name,
          categoryId: product.categoryId || '',
          unit: product.unit,
          costPrice: toNumber(product.costPrice),
          sellingPrice: toNumber(product.sellingPrice),
          taxRate: toNumber(product.taxRate),
          reorderLevel: product.reorderLevel,
          batchNumber: product.batchNumber || '',
          expiryDate: product.expiryDate
            ? new Date(product.expiryDate).toISOString().slice(0, 10)
            : '',
          isActive: product.isActive,
        }}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        isPharmacy={tenant?.businessType === 'PHARMACY'}
      />
    </div>
  );
}
