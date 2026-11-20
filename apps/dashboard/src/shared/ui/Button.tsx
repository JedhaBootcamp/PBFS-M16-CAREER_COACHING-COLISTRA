import type { ButtonHTMLAttributes } from 'react';
import { cn } from './cn';
import { Spinner } from './Spinner';

type Variant = 'primary' | 'secondary' | 'ghost';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-ink text-white hover:bg-ink/90 disabled:bg-ink/40',
  secondary: 'bg-white text-ink ring-1 ring-inset ring-clay-200 hover:bg-clay-100 disabled:text-ink/40',
  ghost: 'text-ink/70 hover:bg-clay-100 hover:text-ink',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'sm' | 'md';
  isLoading?: boolean;
}

export function Button({ variant = 'primary', size = 'md', isLoading = false, className, children, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap transition-colors disabled:cursor-not-allowed',
        size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2 text-sm',
        VARIANTS[variant],
        className,
      )}
      {...props}
    >
      {isLoading && <Spinner className="size-3.5" />}
      {children}
    </button>
  );
}
