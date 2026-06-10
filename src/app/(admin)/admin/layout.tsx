import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LayoutDashboard, Building2, LogOut, ArrowRight } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { isSuperAdmin } from '@/lib/superAdmin';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');
  if (!isSuperAdmin(session)) redirect('/dashboard');

  return (
    <div className="flex min-h-screen">
      <aside className="flex h-screen w-64 flex-col bg-gradient-to-b from-purple-900 to-indigo-900 text-slate-200">
        <div className="border-b border-white/10 p-5">
          <div className="text-lg font-bold text-white">👑 Super Admin</div>
          <div className="mt-1 truncate text-xs text-slate-300">{session.email}</div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          <Link
            href="/admin"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-white/10"
          >
            <LayoutDashboard className="h-4 w-4" /> لوحة المنصة
          </Link>
          <Link
            href="/admin/tenants"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-white/10"
          >
            <Building2 className="h-4 w-4" /> المنشآت المشتركة
          </Link>
          <div className="my-3 border-t border-white/10" />
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-white/10"
          >
            <ArrowRight className="h-4 w-4" /> ارجع لحسابك
          </Link>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-300 hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" /> تسجيل الخروج
            </button>
          </form>
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto bg-slate-50 p-6">{children}</main>
    </div>
  );
}
