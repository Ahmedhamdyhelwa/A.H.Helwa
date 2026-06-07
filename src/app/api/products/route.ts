import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession } from '@/lib/auth';
import { can } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';
import { Prisma, StockMovementType } from '@prisma/client';

const schema = z.object({
  sku: z.string().min(1),
  barcode: z.string().optional(),
  name: z.string().min(1),
  categoryId: z.string().optional().nullable(),
  unit: z.string().optional(),
  costPrice: z.number().nonnegative().optional(),
  sellingPrice: z.number().nonnegative(),
  taxRate: z.number().nonnegative().optional(),
  reorderLevel: z.number().int().nonnegative().optional(),
  initialStock: z.number().nonnegative().optional(),
  batchNumber: z.string().optional(),
  expiryDate: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    if (!can(session.role, 'inventory.manage')) {
      return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });
    }
    const data = schema.parse(await req.json());

    const branch = await prisma.branch.findFirst({
      where: { tenantId: session.tenantId, isMain: true },
    });

    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          tenantId: session.tenantId,
          sku: data.sku,
          barcode: data.barcode || null,
          name: data.name,
          categoryId: data.categoryId || null,
          unit: data.unit || 'قطعة',
          costPrice: new Prisma.Decimal(data.costPrice ?? 0),
          sellingPrice: new Prisma.Decimal(data.sellingPrice),
          taxRate: new Prisma.Decimal(data.taxRate ?? 0),
          reorderLevel: data.reorderLevel ?? 0,
          batchNumber: data.batchNumber || null,
          expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        },
      });

      if (data.initialStock && branch) {
        await tx.productStock.create({
          data: {
            productId: created.id,
            branchId: branch.id,
            quantity: new Prisma.Decimal(data.initialStock),
          },
        });
        await tx.stockMovement.create({
          data: {
            tenantId: session.tenantId,
            productId: created.id,
            branchId: branch.id,
            type: StockMovementType.ADJUSTMENT,
            quantity: new Prisma.Decimal(data.initialStock),
            reference: 'OPENING',
          },
        });
      }
      return created;
    });

    return NextResponse.json({ id: product.id });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'بيانات غير صحيحة' }, { status: 400 });
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return NextResponse.json({ error: 'كود الصنف مستخدم بالفعل' }, { status: 409 });
    }
    console.error(e);
    return NextResponse.json({ error: 'فشل حفظ الصنف' }, { status: 500 });
  }
}
