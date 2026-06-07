'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function UserForm({
  branches,
  canManage,
}: {
  branches: { id: string; name: string }[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'CASHIER',
    branchId: branches[0]?.id || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canManage) {
    return <p className="text-sm text-slate-500">صلاحيات غير كافية</p>;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSubmitting(false);
    if (res.ok) {
      setForm({ ...form, fullName: '', email: '', password: '' });
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error || 'فشل الحفظ');
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        className="input"
        placeholder="الاسم الكامل"
        value={form.fullName}
        onChange={(e) => setForm({ ...form, fullName: e.target.value })}
        required
      />
      <input
        type="email"
        className="input"
        placeholder="البريد الإلكتروني"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        required
      />
      <input
        type="password"
        minLength={6}
        className="input"
        placeholder="كلمة المرور"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        required
      />
      <select
        className="input"
        value={form.role}
        onChange={(e) => setForm({ ...form, role: e.target.value })}
      >
        <option value="MANAGER">مدير</option>
        <option value="CASHIER">كاشير</option>
        <option value="ACCOUNTANT">محاسب</option>
        <option value="STOCK_KEEPER">موظف مخزن</option>
      </select>
      <select
        className="input"
        value={form.branchId}
        onChange={(e) => setForm({ ...form, branchId: e.target.value })}
      >
        {branches.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
      {error && <div className="text-sm text-red-600">{error}</div>}
      <button type="submit" disabled={submitting} className="btn-primary w-full">
        {submitting ? 'جاري الإضافة...' : 'إضافة المستخدم'}
      </button>
    </form>
  );
}
