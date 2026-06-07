'use client';

import { Printer } from 'lucide-react';

export function PrintButton({ label = 'طباعة' }: { label?: string }) {
  return (
    <button onClick={() => window.print()} className="btn-secondary no-print">
      <Printer className="h-4 w-4" />
      {label}
    </button>
  );
}
