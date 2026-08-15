import { SearchX } from 'lucide-react';

// Mirrors _EmptyState in lib/screens/notice_board_screen.dart
export default function EmptyState({
  title = 'No notices here yet.',
  subtitle = 'Try another keyword or filter — or check back soon for campus updates.',
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <div className="glass-tint flex h-16 w-16 items-center justify-center rounded-[20px] text-mint-ink">
        <SearchX size={28} />
      </div>
      <div className="mt-4 font-display text-[15px] font-bold text-textdark">{title}</div>
      <p className="mt-1 max-w-xs text-[13px] leading-[1.5] text-dim">
        {subtitle}
      </p>
    </div>
  );
}
