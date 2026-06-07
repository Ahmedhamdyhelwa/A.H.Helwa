import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'A.H.Helwa ERP - نظام إدارة المبيعات والمخزون',
  description: 'نظام سحابي متكامل لإدارة الحسابات والمبيعات والمخزون',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
