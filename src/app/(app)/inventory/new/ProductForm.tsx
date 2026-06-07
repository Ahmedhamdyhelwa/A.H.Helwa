'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function ProductForm({
  categories,
  isPharmacy,
}: {
  categories: { id: string; name: string }[];
  isPharmacy: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    sku: '',
    barcode: '',
    name: '',
    categoryId: categories[0]?.id || '',
    unit: 'قطعة',
    costPrice: 0,
    sellingPrice: 0,
    taxRate: 0,
    reorderLevel: 0,
    initialStock: 0,
    batchNumber: '',
    expiryDate: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSubmitting(false);
    if (res.ok) {
      router.push('/inventory');
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error || 'فشل الحفظ');
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">كود الصنف (SKU)</label>
          <input
            className="input"
            value={form.sku}
            onChange={(e) => update('sku', e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">الباركود</label>
          <input
            className="input"
            value={form.barcode}
            onChange={(e) => update('barcode', e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="label">الاسم</label>
        <input
          className="input"
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          required
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">التصنيف</label>
          <select
            className="input"
            value={form.categoryId}
            onChange={(e) => update('categoryId', e.target.value)}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">الوحدة</label>
          <input
            className="input"
            value={form.unit}
            onChange={(e) => update('unit', e.target.value)}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="label">سعر التكلفة</label>
          <input
            type="number"
            step="0.01"
            className="input"
            value={form.costPrice}
            onChange={(e) => update('costPrice', parseFloat(e.target.value) || 0)}
          />
        </div>
        <div>
          <label className="label">سعر البيع</label>
          <input
            type="number"
            step="0.01"
            className="input"
            value={form.sellingPrice}
            onChange={(e) => update('sellingPrice', parseFloat(e.target.value) || 0)}
            required
          />
        </div>
        <div>
          <label className="label">ضريبة %</label>
          <input
            type="number"
            step="0.01"
            className="input"
            value={form.taxRate}
            onChange={(e) => update('taxRate', parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">حد إعادة الطلب</label>
          <input
            type="number"
            min="0"
            className="input"
            value={form.reorderLevel}
            onChange={(e) => update('reorderLevel', parseInt(e.target.value) || 0)}
          />
        </div>
        <div>
          <label className="label">الرصيد الافتتاحي</label>
          <input
            type="number"
            min="0"
            step="0.001"
            className="input"
            value={form.initialStock}
            onChange={(e) => update('initialStock', parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      {isPharmacy && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">رقم التشغيلة (Batch)</label>
            <input
              className="input"
              value={form.batchNumber}
              onChange={(e) => update('batchNumber', e.target.value)}
            />
          </div>
          <div>
            <label className="label">تاريخ الصلاحية</label>
            <input
              type="date"
              className="input"
              value={form.expiryDate}
              onChange={(e) => update('expiryDate', e.target.value)}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => router.back()} className="btn-secondary">
          إلغاء
        </button>
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? 'جاري الحفظ...' : 'حفظ الصنف'}
        </button>
      </div>
    </form>
  );
}
