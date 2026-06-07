'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Plus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  costPrice: number;
}

interface Line {
  productId: string;
  quantity: number;
  unitCost: number;
  discount: number;
  taxRate: number;
}

export function PurchaseForm({
  products,
  suppliers,
  currency,
}: {
  products: Product[];
  suppliers: { id: string; name: string }[];
  currency: string;
}) {
  const router = useRouter();
  const [supplierId, setSupplierId] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [discount, setDiscount] = useState(0);
  const [paid, setPaid] = useState(0);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addLine() {
    setLines((prev) => [
      ...prev,
      { productId: products[0]?.id || '', quantity: 1, unitCost: 0, discount: 0, taxRate: 0 },
    ]);
  }

  function updateLine(i: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  function removeLine(i: number) {
    setLines((prev) => prev.filter((_, idx) => idx !== i));
  }

  const totals = useMemo(() => {
    let subtotal = 0;
    let tax = 0;
    for (const l of lines) {
      const gross = l.quantity * l.unitCost - l.discount;
      subtotal += gross;
      tax += (gross * l.taxRate) / 100;
    }
    return { subtotal, tax, total: subtotal - discount + tax };
  }, [lines, discount]);

  async function submit() {
    if (lines.length === 0) {
      setError('أضف أصناف للفاتورة');
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await fetch('/api/purchases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        supplierId: supplierId || null,
        discount,
        paid,
        notes,
        items: lines,
      }),
    });
    setSubmitting(false);
    if (res.ok) {
      router.push('/purchases');
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error || 'فشل الحفظ');
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div className="card overflow-x-auto p-0">
          <table className="table">
            <thead>
              <tr>
                <th>الصنف</th>
                <th>الكمية</th>
                <th>التكلفة</th>
                <th>خصم</th>
                <th>ضريبة %</th>
                <th>الإجمالي</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    لا توجد أصناف بعد
                  </td>
                </tr>
              )}
              {lines.map((l, i) => {
                const gross = l.quantity * l.unitCost - l.discount;
                const tax = (gross * l.taxRate) / 100;
                return (
                  <tr key={i}>
                    <td>
                      <select
                        className="input"
                        value={l.productId}
                        onChange={(e) => {
                          const p = products.find((x) => x.id === e.target.value);
                          updateLine(i, {
                            productId: e.target.value,
                            unitCost: p?.costPrice || l.unitCost,
                          });
                        }}
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0.001"
                        step="0.001"
                        className="input w-20"
                        value={l.quantity}
                        onChange={(e) =>
                          updateLine(i, { quantity: parseFloat(e.target.value) || 0 })
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="input w-24"
                        value={l.unitCost}
                        onChange={(e) =>
                          updateLine(i, { unitCost: parseFloat(e.target.value) || 0 })
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="input w-20"
                        value={l.discount}
                        onChange={(e) =>
                          updateLine(i, { discount: parseFloat(e.target.value) || 0 })
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="input w-16"
                        value={l.taxRate}
                        onChange={(e) =>
                          updateLine(i, { taxRate: parseFloat(e.target.value) || 0 })
                        }
                      />
                    </td>
                    <td className="font-semibold">{formatCurrency(gross + tax, currency)}</td>
                    <td>
                      <button onClick={() => removeLine(i)} className="text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <button onClick={addLine} className="btn-secondary">
          <Plus className="h-4 w-4" />
          إضافة صنف
        </button>
      </div>

      <div className="space-y-4">
        <div className="card space-y-3">
          <h3 className="text-lg font-semibold">تفاصيل الفاتورة</h3>
          <div>
            <label className="label">المورد</label>
            <select
              className="input"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
            >
              <option value="">بدون مورد</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">خصم على الفاتورة</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="input"
              value={discount}
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="label">المدفوع</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="input"
              value={paid}
              onChange={(e) => setPaid(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="label">ملاحظات</label>
            <textarea
              className="input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="card space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">قبل الخصم</span>
            <span>{formatCurrency(totals.subtotal, currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">خصم</span>
            <span>{formatCurrency(discount, currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">ضريبة</span>
            <span>{formatCurrency(totals.tax, currency)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 text-lg font-bold">
            <span>الإجمالي</span>
            <span className="text-brand-700">{formatCurrency(totals.total, currency)}</span>
          </div>
        </div>

        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <button onClick={submit} disabled={submitting} className="btn-primary w-full py-3">
          {submitting ? 'جاري الحفظ...' : 'حفظ الفاتورة'}
        </button>
      </div>
    </div>
  );
}
