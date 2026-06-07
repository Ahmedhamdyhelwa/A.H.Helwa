'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const categories = [
  'إيجار',
  'مرتبات',
  'كهرباء ومياه',
  'إنترنت وهاتف',
  'صيانة',
  'مواصلات',
  'تسويق',
  'متنوعة',
];

export function ExpenseForm({ accounts }: { accounts: { id: string; name: string }[] }) {
  const router = useRouter();
  const [form, setForm] = useState({
    category: categories[0],
    accountId: accounts[0]?.id || '',
    amount: 0,
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSubmitting(false);
    if (res.ok) {
      setForm({ ...form, amount: 0, notes: '' });
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error || 'فشل الحفظ');
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <select
        className="input"
        value={form.category}
        onChange={(e) => setForm({ ...form, category: e.target.value })}
      >
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <select
        className="input"
        value={form.accountId}
        onChange={(e) => setForm({ ...form, accountId: e.target.value })}
      >
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>
      <input
        type="number"
        step="0.01"
        min="0.01"
        className="input"
        placeholder="المبلغ"
        value={form.amount}
        onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
        required
      />
      <textarea
        className="input"
        rows={2}
        placeholder="ملاحظات"
        value={form.notes}
        onChange={(e) => setForm({ ...form, notes: e.target.value })}
      />
      {error && <div className="text-sm text-red-600">{error}</div>}
      <button type="submit" disabled={submitting} className="btn-primary w-full">
        {submitting ? 'جاري الحفظ...' : 'حفظ المصروف'}
      </button>
    </form>
  );
}
