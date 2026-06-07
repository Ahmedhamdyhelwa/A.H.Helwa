import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession } from '@/lib/auth';
import { can } from '@/lib/rbac';
import { createSale } from '@/lib/services/sales';
import { prisma } from '@/lib/prisma';

const schema = z.object({
  customerId: z.string().nullable().optional(),
  discount: z.number().optional(),
  paid: z.number().optional(),
  notes: z.string().optional(),
  isReturn: z.boolean().optional(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().positive(),
        unitPrice: z.number().nonnegative(),
        discount: z.number().optional(),
        taxRate: z.number().optional(),
      }),
    )
    .min(1),
});

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    if (!can(session.role, 'sales.create')) {
      return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });
    }
    const body = schema.parse(await req.json());

    let branchId = session.branchId;
    if (!branchId) {
      const main = await prisma.branch.findFirst({
        where: { tenantId: session.tenantId, isMain: true },
      });
      branchId = main?.id;
    }
    if (!branchId) {
      return NextResponse.json({ error: 'لا يوجد فرع نشط' }, { status: 400 });
    }

    const invoice = await createSale({
      tenantId: session.tenantId,
      branchId,
      cashierId: session.userId,
      customerId: body.customerId,
      discount: body.discount,
      paid: body.paid,
      notes: body.notes,
      isReturn: body.isReturn,
      items: body.items,
    });

    return NextResponse.json({ id: invoice.id, number: invoice.number });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'بيانات غير صحيحة' }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: 'فشل حفظ الفاتورة' }, { status: 500 });
  }
}
