'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pause, Play } from 'lucide-react';

export function TenantActions({
  tenantId,
  status,
  suspendedReason,
}: {
  tenantId: string;
  status: string;
  suspendedReason: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const isSuspended = status === 'PAST_DUE' || status === 'CANCELED';

  async function suspend() {
    const reason = prompt('سبب التعليق (اختياري):', 'عدم سداد الاشتراك');
    if (reason === null) return;
    if (!confirm('هل تريد تعليق هذه المنشأة؟ مستخدموها لن يستطيعوا الدخول.')) return;
    setBusy(true);
    const res = await fetch(`/api/admin/tenants/${tenantId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'PAST_DUE', suspendedReason: reason }),
    });
    setBusy(false);
    if (res.ok) router.refresh();
    else alert('فشل العملية');
  }

  async function activate() {
    setBusy(true);
    const res = await fetch(`/api/admin/tenants/${tenantId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'ACTIVE', suspendedReason: null }),
    });
    setBusy(false);
    if (res.ok) router.refresh();
    else alert('فشل العملية');
  }

  if (isSuspended) {
    return (
      <div className="rounded-lg bg-amber-50 px-5 py-4 ring-1 ring-amber-200">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-semibold text-amber-900">⚠️ هذه المنشأة معلّقة</div>
            <div className="mt-1 text-sm text-amber-800">
              المستخدمون لا يستطيعون تسجيل الدخول.
              {suspendedReason && <> السبب: <strong>{suspendedReason}</strong></>}
            </div>
          </div>
          <button onClick={activate} disabled={busy} className="btn-primary">
            <Play className="h-4 w-4" />
            إعادة تفعيل
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-emerald-50 px-5 py-4 ring-1 ring-emerald-200">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-semibold text-emerald-900">✅ المنشأة نشطة</div>
          <div className="mt-1 text-sm text-emerald-800">
            المستخدمون يستطيعون الدخول والعمل بشكل طبيعي.
          </div>
        </div>
        <button onClick={suspend} disabled={busy} className="btn-danger">
          <Pause className="h-4 w-4" />
          تعليق المنشأة
        </button>
      </div>
    </div>
  );
}
