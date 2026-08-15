import { BookOpen, Share, Bookmark, Star, MessageCircle } from 'lucide-react';
import type { BookListing } from '../models/bookListing';

// Mirrors buildBookCard in lib/screens/book_exchange/book_exchange_screen.dart
export default function BookCard({
  book,
  bookmarked,
  onOpen,
  onToggleBookmark,
  onShare,
  onMessage,
  onOpenSeller,
}: {
  book: BookListing;
  bookmarked: boolean;
  onOpen: () => void;
  onToggleBookmark: () => void;
  onShare: () => void;
  onMessage: () => void;
  onOpenSeller: () => void;
}) {
  return (
    <div className="glass glass-sheen rounded-[20px] p-4 transition-shadow duration-200 hover:shadow-glass-lg">
      <div className="flex items-start">
        <button
          type="button"
          onClick={onOpen}
          className="glass-tint flex h-[84px] w-16 shrink-0 items-center justify-center overflow-hidden rounded-[12px] text-mint-ink"
        >
          <BookOpen size={28} />
        </button>
        <div className="ml-4 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="tag-mint flex h-8 items-center rounded-full px-3 font-mono text-[10px] font-bold uppercase tracking-[0.06em]">
              {book.course}
            </span>
            <span className="tag-gold flex h-8 items-center rounded-full px-3 font-mono text-[10px] font-bold uppercase tracking-[0.06em]">
              {book.condition}
            </span>
            <span className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={onShare}
                aria-label="Share listing"
                className="glass-pill flex h-9 w-9 items-center justify-center rounded-full text-mint-ink hover:-translate-y-0.5"
              >
                <Share size={20} />
              </button>
              <button
                type="button"
                onClick={onToggleBookmark}
                aria-label="Bookmark listing"
                className={`glass-pill flex h-9 w-9 items-center justify-center rounded-full hover:-translate-y-0.5 ${
                  bookmarked ? 'text-gold-ink' : 'text-mint-ink'
                }`}
              >
                <Bookmark size={20} fill={bookmarked ? 'currentColor' : 'none'} />
              </button>
            </span>
          </div>
          <div className="mt-2 font-display text-[15px] font-bold leading-[1.25] text-textdark">
            {book.title}
          </div>
          <div className="mt-1 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-mint-ink">
            {book.tag}
          </div>
        </div>
      </div>
      <div className="my-4 h-px bg-glass-border" />
      <div className="flex items-center">
        <button
          type="button"
          onClick={onOpenSeller}
          className="glass-tint flex h-8 w-8 items-center justify-center rounded-full text-mint-ink"
        >
          <Star size={14} />
        </button>
        <button type="button" onClick={onOpenSeller} className="ml-3 min-w-0 flex-1 text-left">
          <div className="truncate font-display text-[13px] font-bold text-textdark">{book.seller}</div>
          <div className="flex items-center gap-1">
            <Star size={14} className="text-gold-ink" />
            <span className="text-xs text-dim">{book.rating}</span>
          </div>
        </button>
        <button
          type="button"
          onClick={onMessage}
          className="glass-accent flex items-center gap-2 rounded-full px-6 py-3 text-[13px] font-bold text-white"
        >
          <MessageCircle size={16} />
          Message
        </button>
      </div>
    </div>
  );
}
