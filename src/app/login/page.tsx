'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const redirect = search.get('redirect') || '/dashboard';

  const [tenantSlug, setTenantSlug] = useState('demo');
  const [email, setEmail] = useState('admin@demo.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantSlug, email, password }),
    });
    setLoading(false);
    if (res.ok) {
      router.push(redirect);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'فشل تسجيل الدخول');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-brand-700">A.H.Helwa ERP</h1>
          <p className="mt-2 text-sm text-slate-600">نظام إدارة المبيعات والمخزون والحسابات</p>
        </div>
        <form onSubmit={handleSubmit} className="card space-y-4 shadow-lg">
          <h2 className="text-xl font-semibold">تسجيل الدخول</h2>
          <div>
            <label className="label">معرّف المنشأة (Slug)</label>
            <input
              className="input"
              value={tenantSlug}
              onChange={(e) => setTenantSlug(e.target.value)}
              placeholder="demo"
              required
            />
          </div>
          <div>
            <label className="label">البريد الإلكتروني</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">كلمة المرور</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100">
              {error}
            </div>
          )}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'جاري الدخول...' : 'دخول'}
          </button>
          <p className="text-center text-sm text-slate-600">
            ليس لديك حساب؟{' '}
            <Link href="/register" className="text-brand-600 hover:underline">
              أنشئ منشأة جديدة
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
