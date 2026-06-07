'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Truck,
  Package,
  Users,
  Building2,
  Wallet,
  BarChart3,
  Settings,
  LogOut,
  Receipt,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

const nav = [
  { href: '/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { href: '/sales', label: 'المبيعات', icon: ShoppingCart },
  { href: '/purchases', label: 'المشتريات', icon: Truck },
  { href: '/inventory', label: 'المخزون', icon: Package },
  { href: '/customers', label: 'العملاء', icon: Users },
  { href: '/suppliers', label: 'الموردون', icon: Building2 },
  { href: '/accounting', label: 'الحسابات', icon: Wallet },
  { href: '/expenses', label: 'المصروفات', icon: Receipt },
  { href: '/reports', label: 'التقارير', icon: BarChart3 },
  { href: '/settings', label: 'الإعدادات', icon: Settings },
];

export function Sidebar({ tenantName, userName }: { tenantName: string; userName: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-64 flex-col bg-slate-900 text-slate-200">
      <div className="border-b border-slate-800 p-5">
        <div className="text-lg font-bold text-white">A.H.Helwa ERP</div>
        <div className="mt-1 truncate text-xs text-slate-400">{tenantName}</div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition',
                active
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white',
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-800 p-3">
        <div className="mb-2 px-2 text-xs text-slate-400">{userName}</div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-300 hover:bg-slate-800"
        >
          <LogOut className="h-4 w-4" />
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}
