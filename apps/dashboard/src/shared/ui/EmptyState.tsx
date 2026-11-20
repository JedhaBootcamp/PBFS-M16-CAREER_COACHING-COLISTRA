import type { ReactNode } from 'react';

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="py-16 text-center">
      <p className="font-medium">{title}</p>
      {children && <div className="mt-1 text-sm text-ink/60">{children}</div>}
    </div>
  );
}
