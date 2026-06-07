'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function PartnerForm({
  endpoint,
  type,
}: {
  endpoint: string;
  type: 'customer' | 'supplier';
}) {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSubmitting(false);
    if (res.ok) {
      setForm({ name: '', phone: '', email: '', address: '' });
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
        placeholder={type === 'customer' ? 'اسم العميل' : 'اسم المورد'}
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        required
      />
      <input
        className="input"
        placeholder="رقم الهاتف"
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
      />
      <input
        type="email"
        className="input"
        placeholder="البريد الإلكتروني"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <textarea
        className="input"
        rows={2}
        placeholder="العنوان"
        value={form.address}
        onChange={(e) => setForm({ ...form, address: e.target.value })}
      />
      {error && <div className="text-sm text-red-600">{error}</div>}
      <button type="submit" disabled={submitting} className="btn-primary w-full">
        {submitting ? 'جاري الحفظ...' : 'إضافة'}
      </button>
    </form>
  );
}
