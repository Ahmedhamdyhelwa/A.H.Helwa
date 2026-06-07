import { NextResponse } from 'next/server';
import { z } from 'zod';
import { loginUser } from '@/lib/auth';

const schema = z.object({
  tenantSlug: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = schema.parse(body);
    await loginUser(data.tenantSlug, data.email, data.password);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === 'TENANT_NOT_FOUND') {
      return NextResponse.json({ error: 'المنشأة غير موجودة' }, { status: 404 });
    }
    if (msg === 'INVALID_CREDENTIALS') {
      return NextResponse.json(
        { error: 'بيانات الدخول غير صحيحة' },
        { status: 401 },
      );
    }
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}
