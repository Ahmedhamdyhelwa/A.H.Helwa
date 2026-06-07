'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function PaymentForm({
  accounts,
  customers,
  suppliers,
}: {
  accounts: { id: string; name: string }[];
  customers: { id: string; name: string }[];
  suppliers: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    direction: 'RECEIPT',
    accountId: accounts[0]?.id || '',
    amount: 0,
    partyType: 'customer' as 'customer' | 'supplier' | 'none',
    partyId: '',
    reference: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        direction: form.direction,
        accountId: form.accountId,
        amount: form.amount,
        customerId: form.partyType === 'customer' ? form.partyId : null,
        supplierId: form.partyType === 'supplier' ? form.partyId : null,
        reference: form.reference,
        notes: form.notes,
      }),
    });
    setSubmitting(false);
    if (res.ok) {
      setForm({ ...form, amount: 0, reference: '', notes: '' });
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error || 'فشل الحفظ');
    }
  }

  const parties =
    form.partyType === 'customer'
      ? customers
      : form.partyType === 'supplier'
        ? suppliers
        : [];

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setForm({ ...form, direction: 'RECEIPT' })}
          className={`rounded-lg py-2 text-sm font-medium ${
            form.direction === 'RECEIPT'
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-100 text-slate-700'
          }`}
        >
          سند قبض
        </button>
        <button
          type="button"
          onClick={() => setForm({ ...form, direction: 'DISBURSEMENT' })}
          className={`rounded-lg py-2 text-sm font-medium ${
            form.direction === 'DISBURSEMENT'
              ? 'bg-red-600 text-white'
              : 'bg-slate-100 text-slate-700'
          }`}
        >
          سند صرف
        </button>
      </div>
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
      <select
        className="input"
        value={form.partyType}
        onChange={(e) =>
          setForm({
            ...form,
            partyType: e.target.value as 'customer' | 'supplier' | 'none',
            partyId: '',
          })
        }
      >
        <option value="none">بدون طرف</option>
        <option value="customer">عميل</option>
        <option value="supplier">مورد</option>
      </select>
      {form.partyType !== 'none' && (
        <select
          className="input"
          value={form.partyId}
          onChange={(e) => setForm({ ...form, partyId: e.target.value })}
        >
          <option value="">-- اختر --</option>
          {parties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      )}
      <input
        className="input"
        placeholder="المرجع"
        value={form.reference}
        onChange={(e) => setForm({ ...form, reference: e.target.value })}
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
        {submitting ? 'جاري الحفظ...' : 'حفظ السند'}
      </button>
    </form>
  );
}
