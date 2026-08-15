import { Boxes, ChevronRight } from 'lucide-react';
import type { LostFoundItem } from '../models/lostFoundItem';

// Mirrors ItemCard in lib/screens/lost_found_screen.dart, rendered with the
// v7 list-item anatomy (tinted swatch + mono meta + trailing action).
export default function ItemCard({ item }: { item: LostFoundItem }) {
  return (
    <div className="glass glass-sheen flex w-full items-center gap-3 rounded-[20px] p-4 text-left transition-shadow duration-200 hover:shadow-glass-lg">
      <span className="glass-tint flex h-[64px] w-16 shrink-0 items-center justify-center rounded-[14px] text-mint-ink">
        <Boxes size={26} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-[16px] font-bold text-textdark">
          {item.name}
        </span>
        <span className="mt-1 block font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-dim">
          Found {item.date} · {item.room}
        </span>
        <span className="mt-1 block text-[12px] text-dim">Color: {item.color}</span>
      </span>
      <ChevronRight size={18} className="shrink-0 text-dim2" />
    </div>
  );
}
