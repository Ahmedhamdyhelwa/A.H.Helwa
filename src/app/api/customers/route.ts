import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession } from '@/lib/auth';
import { can } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';

const schema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await requireSession();
  if (!can(session.role, 'partners.manage')) {
    return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });
  }
  try {
    const data = schema.parse(await req.json());
    const c = await prisma.customer.create({
      data: { tenantId: session.tenantId, ...data },
    });
    return NextResponse.json({ id: c.id });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'بيانات غير صحيحة' }, { status: 400 });
    }
    return NextResponse.json({ error: 'فشل الحفظ' }, { status: 500 });
  }
}
