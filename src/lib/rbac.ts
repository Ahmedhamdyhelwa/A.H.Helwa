import type { UserRole } from '@prisma/client';

export const ROLE_LABELS: Record<UserRole, string> = {
  OWNER: 'مالك',
  MANAGER: 'مدير',
  CASHIER: 'كاشير',
  ACCOUNTANT: 'محاسب',
  STOCK_KEEPER: 'موظف مخزن',
};

export const PERMISSIONS = {
  // Sales
  'sales.view': ['OWNER', 'MANAGER', 'CASHIER', 'ACCOUNTANT'],
  'sales.create': ['OWNER', 'MANAGER', 'CASHIER'],
  'sales.return': ['OWNER', 'MANAGER'],
  // Purchases
  'purchases.view': ['OWNER', 'MANAGER', 'ACCOUNTANT', 'STOCK_KEEPER'],
  'purchases.create': ['OWNER', 'MANAGER', 'STOCK_KEEPER'],
  // Inventory
  'inventory.view': ['OWNER', 'MANAGER', 'STOCK_KEEPER', 'CASHIER'],
  'inventory.manage': ['OWNER', 'MANAGER', 'STOCK_KEEPER'],
  // Customers & Suppliers
  'partners.view': ['OWNER', 'MANAGER', 'CASHIER', 'ACCOUNTANT'],
  'partners.manage': ['OWNER', 'MANAGER', 'ACCOUNTANT'],
  // Accounting
  'accounting.view': ['OWNER', 'MANAGER', 'ACCOUNTANT'],
  'accounting.manage': ['OWNER', 'ACCOUNTANT'],
  // Reports
  'reports.view': ['OWNER', 'MANAGER', 'ACCOUNTANT'],
  // Settings & users
  'settings.manage': ['OWNER'],
  'users.manage': ['OWNER', 'MANAGER'],
} satisfies Record<string, UserRole[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: UserRole, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly UserRole[]).includes(role);
}
