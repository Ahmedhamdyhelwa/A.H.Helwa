import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession } from '@/lib/auth';
import { can } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

const updateSchema = z.object({
  sku: z.string().min(1).optional(),
  barcode: z.string().nullable().optional(),
  name: z.string().min(1).optional(),
  categoryId: z.string().nullable().optional(),
  unit: z.string().optional(),
  costPrice: z.number().nonnegative().optional(),
  sellingPrice: z.number().nonnegative().optional(),
  taxRate: z.number().nonnegative().optional(),
  reorderLevel: z.number().int().nonnegative().optional(),
  batchNumber: z.string().nullable().optional(),
  expiryDate: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!can(session.role, 'inventory.manage')) {
    return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });
  }

  const product = await prisma.product.findFirst({
    where: { id: params.id, tenantId: session.tenantId },
  });
  if (!product) return NextResponse.json({ error: 'الصنف غير موجود' }, { status: 404 });

  try {
    const data = updateSchema.parse(await req.json());
    const updateData: Prisma.ProductUpdateInput = {};
    if (data.sku !== undefined) updateData.sku = data.sku;
    if (data.barcode !== undefined) updateData.barcode = data.barcode || null;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.unit !== undefined) updateData.unit = data.unit;
    if (data.costPrice !== undefined) updateData.costPrice = new Prisma.Decimal(data.costPrice);
    if (data.sellingPrice !== undefined) updateData.sellingPrice = new Prisma.Decimal(data.sellingPrice);
    if (data.taxRate !== undefined) updateData.taxRate = new Prisma.Decimal(data.taxRate);
    if (data.reorderLevel !== undefined) updateData.reorderLevel = data.reorderLevel;
    if (data.batchNumber !== undefined) updateData.batchNumber = data.batchNumber || null;
    if (data.expiryDate !== undefined) {
      updateData.expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;
    }
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.categoryId !== undefined) {
      updateData.category = data.categoryId
        ? { connect: { id: data.categoryId } }
        : { disconnect: true };
    }

    const updated = await prisma.product.update({
      where: { id: params.id },
      data: updateData,
    });
    return NextResponse.json({ id: updated.id });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'بيانات غير صحيحة' }, { status: 400 });
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return NextResponse.json({ error: 'كود الصنف مستخدم بالفعل' }, { status: 409 });
    }
    console.error(e);
    return NextResponse.json({ error: 'فشل التحديث' }, { status: 500 });
  }
}
