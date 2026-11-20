import { Spinner } from './Spinner';

export function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm text-ink/60">
      <Spinner className="size-4 text-clay-600" />
      {label}
    </div>
  );
}
