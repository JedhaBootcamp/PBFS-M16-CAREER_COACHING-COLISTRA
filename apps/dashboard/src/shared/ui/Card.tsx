import type { ReactNode } from 'react';
import { cn } from './cn';

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('rounded-xl bg-white shadow-sm ring-1 ring-clay-200', className)}>{children}</div>;
}
