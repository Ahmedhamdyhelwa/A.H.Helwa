import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createSession, hashPassword } from '@/lib/auth';
import { BusinessType, UserRole, AccountType } from '@prisma/client';

const schema = z.object({
  businessName: z.string().min(2),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, 'حروف صغيرة وأرقام وشرطات فقط'),
  businessType: z.nativeEnum(BusinessType),
  ownerName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  try {
    const data = schema.parse(await req.json());

    const existing = await prisma.tenant.findUnique({ where: { slug: data.slug } });
    if (existing) {
      return NextResponse.json({ error: 'المعرّف مستخدم بالفعل' }, { status: 409 });
    }

    const passwordHash = await hashPassword(data.password);

    const tenant = await prisma.tenant.create({
      data: {
        name: data.businessName,
        slug: data.slug,
        businessType: data.businessType,
        currency: 'EGP',
        taxRate: 14,
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        branches: {
          create: { name: 'الفرع الرئيسي', isMain: true },
        },
        accounts: {
          create: [
            { name: 'الخزنة', type: AccountType.CASH },
            { name: 'البنك', type: AccountType.BANK },
          ],
        },
        categories: { create: { name: 'عام' } },
      },
      include: { branches: true },
    });

    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: data.email,
        passwordHash,
        fullName: data.ownerName,
        role: UserRole.OWNER,
        branchId: tenant.branches[0]?.id,
      },
    });

    await createSession({
      userId: user.id,
      tenantId: tenant.id,
      role: user.role,
      branchId: user.branchId,
      email: user.email,
    });

    return NextResponse.json({ ok: true, tenantSlug: tenant.slug });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message || 'بيانات غير صحيحة' }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}
