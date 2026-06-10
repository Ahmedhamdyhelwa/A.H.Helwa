import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession } from '@/lib/auth';
import { isSuperAdmin } from '@/lib/superAdmin';
import { prisma } from '@/lib/prisma';
import { SubscriptionStatus } from '@prisma/client';

const schema = z.object({
  status: z.nativeEnum(SubscriptionStatus).optional(),
  suspendedReason: z.string().nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });
  }

  try {
    const data = schema.parse(await req.json());
    const isSuspending = data.status === 'PAST_DUE' || data.status === 'CANCELED';
    const isActivating = data.status === 'ACTIVE' || data.status === 'TRIAL';

    await prisma.tenant.update({
      where: { id: params.id },
      data: {
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.suspendedReason !== undefined ? { suspendedReason: data.suspendedReason } : {}),
        ...(isSuspending ? { suspendedAt: new Date() } : {}),
        ...(isActivating ? { suspendedAt: null, suspendedReason: null } : {}),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'بيانات غير صحيحة' }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: 'فشل العملية' }, { status: 500 });
  }
}
