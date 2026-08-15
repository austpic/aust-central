import type { ReactNode } from 'react';

// Hero ticket card ported from campus_app_redesign_v7.html (.hero-ticket):
// mono live pill + who label, display title, supporting line, and a
// divider-separated footer row with icon + label. Used for Home's notice
// hero and the Transport receipt card.
export default function HeroTicket({
  pillLabel,
  live = false,
  who,
  title,
  sub,
  footerIcon,
  footerText,
  onTap,
  className = '',
}: {
  pillLabel: string;
  live?: boolean;
  who: string;
  title: string;
  sub: string;
  footerIcon: ReactNode;
  footerText: string;
  onTap: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onTap}
      className={`glass glass-sheen block w-full rounded-[20px] p-5 text-left transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-glass-lg ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-mint-ink">
          {live && <span className="live-dot" />}
          {pillLabel}
        </span>
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-dim">
          {who}
        </span>
      </div>
      <h3 className="mt-2 font-display text-[20px] font-bold leading-tight text-textdark">
        {title}
      </h3>
      <p className="mt-1 text-[12.5px] text-dim">{sub}</p>
      <div className="mt-4 flex items-center gap-2 border-t border-glass-border pt-3 text-[12px] font-semibold text-mint-ink">
        {footerIcon}
        {footerText}
      </div>
    </button>
  );
}
