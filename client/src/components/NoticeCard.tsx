import { ChevronDown, Pin } from 'lucide-react';
import type { Notice } from '../models/notice';
import { NOTICE_CATEGORIES } from '../models/notice';
import { formatNoticeDate } from '../utils/dates';

const CATEGORY_TONES: Record<Notice['category'], string> = {
  academic: 'tag-mint',
  exam: 'tag-gold',
  event: 'tag-sky',
  general: 'tag-violet',
};

function CategoryTag({ category }: { category: Notice['category'] }) {
  const label = NOTICE_CATEGORIES.find((c) => c.name === category)?.label ?? category;
  return (
    <span
      className={`${CATEGORY_TONES[category]} inline-flex items-center gap-2 rounded-full px-3 py-1 font-mono text-[9.5px] font-bold uppercase tracking-[0.06em]`}
    >
      {label}
    </span>
  );
}

// Mirrors NoticeCard in lib/widgets/notice_card.dart — pinned renders as a
// full-bleed green gradient, default as a clean white card.
export default function NoticeCard({
  notice,
  expanded,
  onTap,
}: {
  notice: Notice;
  expanded: boolean;
  onTap: () => void;
}) {
  if (notice.pinned) {
    const body =
      expanded || notice.body.length <= 160
        ? notice.body
        : `${notice.body.slice(0, 160)}…`;
    return (
      <div>
        <button
          type="button"
          onClick={onTap}
          className="glass-accent glass-sheen w-full rounded-[22px] px-4 pb-4 pt-4 text-left transition-transform duration-200 hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 font-mono text-[9.5px] font-bold uppercase tracking-[0.1em] text-white">
              <Pin size={12} />
              Pinned
            </span>
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-white/85">
              {formatNoticeDate(notice.postedAt)}
            </span>
          </div>
          <div className="mt-3 font-display text-[17px] font-bold leading-[1.25] text-white">
            {notice.title}
          </div>
          <p className="mt-2 text-[13.5px] leading-[1.45] text-white/90">
            {body}
          </p>
        </button>
      </div>
    );
  }

  const body =
    expanded || notice.body.length <= 110
      ? notice.body
      : `${notice.body.slice(0, 110)}…`;

  return (
    <div>
      <button
        type="button"
        onClick={onTap}
        className="glass glass-sheen w-full rounded-[20px] p-4 text-left transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-glass-lg"
      >
        <div className="flex items-center justify-between">
          <CategoryTag category={notice.category} />
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-dim">
            {formatNoticeDate(notice.postedAt)}
          </span>
        </div>
        <div className="mt-3 font-display text-[16px] font-bold leading-[1.25] text-textdark">
          {notice.title}
        </div>
        <p className="mt-2 text-[13.5px] leading-[1.4] text-dim">
          {body}
        </p>
        {!expanded && notice.body.length > 110 && (
          <div className="mt-2 flex items-center gap-1 text-[13px] font-semibold text-mint-ink">
            Read more
            <ChevronDown size={18} />
          </div>
        )}
      </button>
    </div>
  );
}
