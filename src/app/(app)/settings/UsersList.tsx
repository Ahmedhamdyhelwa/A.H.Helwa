'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Key } from 'lucide-react';
import { ROLE_LABELS } from '@/lib/rbac';
import type { UserRole } from '@prisma/client';

interface UserRow {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  branchName: string | null;
}

export function UsersList({ users, canReset }: { users: UserRow[]; canReset: boolean }) {
  const router = useRouter();
  const [resetting, setResetting] = useState<string | null>(null);
  const [newPasswordShown, setNewPasswordShown] = useState<{ name: string; password: string } | null>(null);

  async function resetPassword(user: UserRow) {
    const newPassword = prompt(
      `إعادة ضبط كلمة مرور ${user.fullName}\n\nاكتب كلمة المرور الجديدة (6 أحرف على الأقل):`,
    );
    if (!newPassword || newPassword.length < 6) {
      if (newPassword !== null) alert('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    setResetting(user.id);
    const res = await fetch(`/api/users/${user.id}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword }),
    });
    setResetting(null);
    if (res.ok) {
      setNewPasswordShown({ name: user.fullName, password: newPassword });
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      alert(d.error || 'فشل العملية');
    }
  }

  return (
    <>
      {newPasswordShown && (
        <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-emerald-200">
          <div className="font-semibold">تم تغيير كلمة مرور {newPasswordShown.name} بنجاح</div>
          <div className="mt-1">
            كلمة المرور الجديدة:{' '}
            <code className="rounded bg-white px-2 py-1 font-mono">{newPasswordShown.password}</code>
          </div>
          <button onClick={() => setNewPasswordShown(null)} className="mt-2 text-xs underline">
            إخفاء
          </button>
        </div>
      )}
      <table className="table">
        <thead>
          <tr>
            <th>الاسم</th>
            <th>البريد</th>
            <th>الدور</th>
            <th>الفرع</th>
            <th>الحالة</th>
            {canReset && <th></th>}
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td className="font-medium">{u.fullName}</td>
              <td>{u.email}</td>
              <td>
                <span className="badge bg-indigo-50 text-indigo-700">{ROLE_LABELS[u.role]}</span>
              </td>
              <td>{u.branchName || '-'}</td>
              <td>
                {u.isActive ? (
                  <span className="badge bg-emerald-50 text-emerald-700">نشط</span>
                ) : (
                  <span className="badge bg-slate-100 text-slate-700">معطل</span>
                )}
              </td>
              {canReset && (
                <td>
                  <button
                    onClick={() => resetPassword(u)}
                    disabled={resetting === u.id}
                    className="inline-flex items-center gap-1 text-amber-600 hover:underline"
                  >
                    <Key className="h-4 w-4" />
                    {resetting === u.id ? 'جاري...' : 'تغيير كلمة المرور'}
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
