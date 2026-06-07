import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession } from '@/lib/auth';
import { can } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

const schema = z.object({
  direction: z.enum(['RECEIPT', 'DISBURSEMENT']),
  accountId: z.string(),
  amount: z.number().positive(),
  customerId: z.string().nullable().optional(),
  supplierId: z.string().nullable().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await requireSession();
  if (!can(session.role, 'accounting.manage')) {
    return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });
  }
  try {
    const data = schema.parse(await req.json());
    const amountDelta = new Prisma.Decimal(
      data.direction === 'RECEIPT' ? data.amount : -data.amount,
    );

    await prisma.$transaction(async (tx) => {
      await tx.payment.create({
        data: {
          tenantId: session.tenantId,
          accountId: data.accountId,
          direction: data.direction,
          amount: new Prisma.Decimal(data.amount),
          customerId: data.customerId || null,
          supplierId: data.supplierId || null,
          reference: data.reference,
          notes: data.notes,
        },
      });
      await tx.account.update({
        where: { id: data.accountId },
        data: { balance: { increment: amountDelta } },
      });
      // Customer receipt reduces their debt; Supplier disbursement reduces our debt
      if (data.customerId) {
        await tx.customer.update({
          where: { id: data.customerId },
          data: {
            balance: { increment: new Prisma.Decimal(-data.amount * (data.direction === 'RECEIPT' ? 1 : -1)) },
          },
        });
      }
      if (data.supplierId) {
        await tx.supplier.update({
          where: { id: data.supplierId },
          data: {
            balance: {
              increment: new Prisma.Decimal(-data.amount * (data.direction === 'DISBURSEMENT' ? 1 : -1)),
            },
          },
        });
      }
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'بيانات غير صحيحة' }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: 'فشل الحفظ' }, { status: 500 });
  }
}
