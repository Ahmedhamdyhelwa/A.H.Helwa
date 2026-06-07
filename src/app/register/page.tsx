'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const businessTypes = [
  { value: 'PHARMACY', label: 'صيدلية' },
  { value: 'RESTAURANT', label: 'مطعم / كافيه' },
  { value: 'SUPERMARKET', label: 'سوبر ماركت' },
  { value: 'CLOTHING', label: 'محل ملابس' },
  { value: 'ELECTRONICS', label: 'إلكترونيات' },
  { value: 'GENERAL', label: 'نشاط عام' },
];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    businessName: '',
    slug: '',
    businessType: 'GENERAL',
    ownerName: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      router.push('/dashboard');
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'فشل إنشاء الحساب');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-slate-100 p-4">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-brand-700">إنشاء منشأة جديدة</h1>
          <p className="mt-2 text-sm text-slate-600">ابدأ نسختك المجانية الآن</p>
        </div>
        <form onSubmit={handleSubmit} className="card space-y-4 shadow-lg">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">اسم المنشأة</label>
              <input
                className="input"
                value={form.businessName}
                onChange={(e) => update('businessName', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">المعرّف (يستخدم في الدخول)</label>
              <input
                className="input"
                value={form.slug}
                onChange={(e) =>
                  update('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                }
                placeholder="my-shop"
                required
              />
            </div>
          </div>
          <div>
            <label className="label">نوع النشاط</label>
            <select
              className="input"
              value={form.businessType}
              onChange={(e) => update('businessType', e.target.value)}
            >
              {businessTypes.map((bt) => (
                <option key={bt.value} value={bt.value}>
                  {bt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">اسم المالك</label>
            <input
              className="input"
              value={form.ownerName}
              onChange={(e) => update('ownerName', e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">البريد الإلكتروني</label>
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">كلمة المرور</label>
              <input
                type="password"
                className="input"
                minLength={6}
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                required
              />
            </div>
          </div>
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100">
              {error}
            </div>
          )}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
          </button>
          <p className="text-center text-sm text-slate-600">
            لديك حساب؟{' '}
            <Link href="/login" className="text-brand-600 hover:underline">
              تسجيل الدخول
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
