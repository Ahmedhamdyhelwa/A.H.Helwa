import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession } from '@/lib/auth';
import { can } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

const schema = z.object({
  category: z.string().min(1),
  accountId: z.string(),
  amount: z.number().positive(),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await requireSession();
  if (!can(session.role, 'accounting.manage')) {
    return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });
  }
  try {
    const data = schema.parse(await req.json());
    await prisma.$transaction(async (tx) => {
      await tx.expense.create({
        data: {
          tenantId: session.tenantId,
          accountId: data.accountId,
          category: data.category,
          amount: new Prisma.Decimal(data.amount),
          notes: data.notes,
        },
      });
      await tx.account.update({
        where: { id: data.accountId },
        data: { balance: { decrement: new Prisma.Decimal(data.amount) } },
      });
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
