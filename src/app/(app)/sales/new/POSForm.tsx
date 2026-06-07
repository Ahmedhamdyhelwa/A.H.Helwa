'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Plus, Barcode } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  sellingPrice: number;
  taxRate: number;
  stock: number;
}

interface CartLine {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
}

export function POSForm({
  products,
  customers,
  currency,
}: {
  products: Product[];
  customers: { id: string; name: string }[];
  currency: string;
  defaultTaxRate: number;
}) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [barcode, setBarcode] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paid, setPaid] = useState(0);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search) return products.slice(0, 20);
    const q = search.toLowerCase();
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.barcode.toLowerCase().includes(q),
      )
      .slice(0, 20);
  }, [search, products]);

  function addProduct(p: Product) {
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === p.id);
      if (existing) {
        return prev.map((c) =>
          c.productId === p.id ? { ...c, quantity: c.quantity + 1 } : c,
        );
      }
      return [
        ...prev,
        {
          productId: p.id,
          name: p.name,
          quantity: 1,
          unitPrice: p.sellingPrice,
          discount: 0,
          taxRate: p.taxRate,
        },
      ];
    });
  }

  function handleBarcodeScan(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && barcode.trim()) {
      const p = products.find((x) => x.barcode === barcode.trim() || x.sku === barcode.trim());
      if (p) {
        addProduct(p);
        setBarcode('');
      } else {
        setError('لم يتم العثور على المنتج بهذا الباركود');
        setTimeout(() => setError(null), 2000);
      }
    }
  }

  function updateLine(index: number, patch: Partial<CartLine>) {
    setCart((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  }

  function removeLine(index: number) {
    setCart((prev) => prev.filter((_, i) => i !== index));
  }

  const totals = useMemo(() => {
    let subtotal = 0;
    let tax = 0;
    for (const line of cart) {
      const gross = line.quantity * line.unitPrice - line.discount;
      const lineTax = (gross * line.taxRate) / 100;
      subtotal += gross;
      tax += lineTax;
    }
    const total = subtotal - discount + tax;
    return { subtotal, tax, total };
  }, [cart, discount]);

  async function submit() {
    if (cart.length === 0) {
      setError('أضف منتجات إلى السلة');
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: customerId || null,
        discount,
        paid: paid || totals.total,
        notes,
        items: cart.map((c) => ({
          productId: c.productId,
          quantity: c.quantity,
          unitPrice: c.unitPrice,
          discount: c.discount,
          taxRate: c.taxRate,
        })),
      }),
    });
    setSubmitting(false);
    if (res.ok) {
      const data = await res.json();
      router.push(`/sales/${data.id}`);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'فشل حفظ الفاتورة');
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div className="card space-y-3">
          <div className="flex items-center gap-2">
            <Barcode className="h-5 w-5 text-slate-500" />
            <input
              className="input flex-1"
              placeholder="مسح الباركود أو SKU... (Enter)"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={handleBarcodeScan}
              autoFocus
            />
          </div>
          <input
            className="input"
            placeholder="بحث بالاسم أو الكود..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="grid max-h-72 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => addProduct(p)}
                className="rounded-lg border border-slate-200 bg-white p-3 text-right transition hover:border-brand-500 hover:shadow"
              >
                <div className="line-clamp-1 text-sm font-medium">{p.name}</div>
                <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                  <span>{formatCurrency(p.sellingPrice, currency)}</span>
                  <span className={p.stock <= 0 ? 'text-red-600' : ''}>
                    رصيد: {p.stock}
                  </span>
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full py-6 text-center text-sm text-slate-400">
                لا توجد منتجات
              </div>
            )}
          </div>
        </div>

        <div className="card overflow-x-auto p-0">
          <table className="table">
            <thead>
              <tr>
                <th>الصنف</th>
                <th>الكمية</th>
                <th>السعر</th>
                <th>خصم</th>
                <th>ضريبة %</th>
                <th>الإجمالي</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cart.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    أضف منتجات إلى الفاتورة
                  </td>
                </tr>
              )}
              {cart.map((line, i) => {
                const gross = line.quantity * line.unitPrice - line.discount;
                const tax = (gross * line.taxRate) / 100;
                return (
                  <tr key={`${line.productId}-${i}`}>
                    <td className="font-medium">{line.name}</td>
                    <td>
                      <input
                        type="number"
                        min="0.001"
                        step="0.001"
                        className="input w-20"
                        value={line.quantity}
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
                        value={line.unitPrice}
                        onChange={(e) =>
                          updateLine(i, { unitPrice: parseFloat(e.target.value) || 0 })
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="input w-20"
                        value={line.discount}
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
                        value={line.taxRate}
                        onChange={(e) =>
                          updateLine(i, { taxRate: parseFloat(e.target.value) || 0 })
                        }
                      />
                    </td>
                    <td className="font-semibold">{formatCurrency(gross + tax, currency)}</td>
                    <td>
                      <button
                        onClick={() => removeLine(i)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-4">
        <div className="card space-y-3">
          <h3 className="text-lg font-semibold">تفاصيل الفاتورة</h3>
          <div>
            <label className="label">العميل</label>
            <select
              className="input"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              <option value="">عميل نقدي</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
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
              placeholder={totals.total.toFixed(2)}
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
            <span className="text-slate-600">الإجمالي قبل الخصم</span>
            <span className="font-semibold">{formatCurrency(totals.subtotal, currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">خصم</span>
            <span className="font-semibold">{formatCurrency(discount, currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">ضريبة</span>
            <span className="font-semibold">{formatCurrency(totals.tax, currency)}</span>
          </div>
          <div className="border-t border-slate-200 pt-2">
            <div className="flex justify-between text-lg">
              <span className="font-bold">الإجمالي</span>
              <span className="font-bold text-brand-700">
                {formatCurrency(totals.total, currency)}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <button
          onClick={submit}
          disabled={submitting}
          className="btn-primary w-full py-3 text-base"
        >
          <Plus className="h-5 w-5" />
          {submitting ? 'جاري الحفظ...' : 'حفظ الفاتورة'}
        </button>
      </div>
    </div>
  );
}
