import { Loader2, CloudOff } from 'lucide-react';

/**
 * Shared loading / error states for API-backed views.
 *
 * Mirrors lib/views/widgets/async_views.dart on the Flutter side — one
 * loading spinner and one retry-capable error card, reused everywhere,
 * rather than each view inventing its own.
 */

export function LoadingState() {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <Loader2 size={28} className="animate-spin text-mint-ink" />
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <div className="glass-tint flex h-16 w-16 items-center justify-center rounded-[20px] text-coral-ink">
        <CloudOff size={28} />
      </div>
      <p className="mt-4 max-w-xs text-[13px] leading-[1.5] text-dim">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="glass-accent mt-4 rounded-full px-5 py-2 text-[13px] font-semibold text-white"
      >
        Try again
      </button>
    </div>
  );
}
