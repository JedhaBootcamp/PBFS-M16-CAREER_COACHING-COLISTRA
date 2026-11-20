import { describeError } from '../colistra/describeError';
import { Button } from './Button';
import { cn } from './cn';

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  /** Extra sentence shown under the message. */
  hint?: string;
  compact?: boolean;
}

/** Explains an error in plain language, with a way to try again when it makes sense. */
export function ErrorState({ error, onRetry, hint, compact = false }: ErrorStateProps) {
  const { title, message, canRetry, reference } = describeError(error);
  return (
    <div role="alert" className={cn('flex flex-wrap items-center justify-between gap-4 text-sm', compact ? 'rounded-xl bg-rose-50 px-4 py-3 ring-1 ring-rose-200' : 'px-6 py-12')}>
      <div className={cn(!compact && 'mx-auto max-w-md text-center')}>
        <p className="font-medium text-rose-900">{title}</p>
        <p className="mt-1 text-ink/70">{message}</p>
        {hint && <p className="mt-1 text-ink/70">{hint}</p>}
        {reference && <p className="mt-1 text-xs text-ink/40">Reference: {reference}</p>}
        {!compact && canRetry && onRetry && (
          <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
            Try again
          </Button>
        )}
      </div>
      {compact && canRetry && onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
