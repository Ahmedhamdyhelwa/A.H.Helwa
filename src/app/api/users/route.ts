import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession, hashPassword } from '@/lib/auth';
import { can } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';
import { Prisma, UserRole } from '@prisma/client';

const schema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.nativeEnum(UserRole),
  branchId: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await requireSession();
  if (!can(session.role, 'users.manage')) {
    return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });
  }
  try {
    const data = schema.parse(await req.json());
    // Only OWNER can create OWNER
    if (data.role === 'OWNER' && session.role !== 'OWNER') {
      return NextResponse.json({ error: 'لا يمكن إنشاء مالك' }, { status: 403 });
    }
    const passwordHash = await hashPassword(data.password);
    const u = await prisma.user.create({
      data: {
        tenantId: session.tenantId,
        email: data.email,
        passwordHash,
        fullName: data.fullName,
        role: data.role,
        branchId: data.branchId || null,
      },
    });
    return NextResponse.json({ id: u.id });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'بيانات غير صحيحة' }, { status: 400 });
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return NextResponse.json({ error: 'البريد مستخدم بالفعل' }, { status: 409 });
    }
    return NextResponse.json({ error: 'فشل الحفظ' }, { status: 500 });
  }
}
