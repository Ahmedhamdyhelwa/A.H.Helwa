import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession, hashPassword } from '@/lib/auth';
import { can } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';

const schema = z.object({
  newPassword: z.string().min(6),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!can(session.role, 'users.manage')) {
    return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });
  }

  const user = await prisma.user.findFirst({
    where: { id: params.id, tenantId: session.tenantId },
  });
  if (!user) return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });

  if (user.role === 'OWNER' && session.role !== 'OWNER') {
    return NextResponse.json({ error: 'لا يمكن إعادة ضبط كلمة مرور المالك' }, { status: 403 });
  }

  try {
    const { newPassword } = schema.parse(await req.json());
    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: params.id },
      data: { passwordHash },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }, { status: 400 });
    }
    return NextResponse.json({ error: 'فشل العملية' }, { status: 500 });
  }
}
