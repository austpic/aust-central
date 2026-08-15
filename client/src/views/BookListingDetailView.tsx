import { ArrowLeft, BookOpen, MessageCircle, Star } from 'lucide-react';
import { useBookListingDetailViewModel } from '../viewmodels/useBookListingDetailViewModel';
import { LoadingState, ErrorState } from '../components/AsyncState';

// Mirrors ListingDetailPage in lib/screens/book_exchange/listing_detail_page.dart.
export default function BookListingDetailView() {
  const vm = useBookListingDetailViewModel();

  if (vm.loading) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-10">
        <LoadingState />
      </div>
    );
  }

  if (vm.error) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-10">
        <ErrorState message={vm.error} onRetry={vm.reload} />
      </div>
    );
  }

  if (!vm.book) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-10 text-center text-labgrey">
        Listing not found.
      </div>
    );
  }

  const book = vm.book;

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* Header */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={vm.goBack}
          aria-label="Back"
          className="glass flex h-11 w-11 items-center justify-center rounded-full text-darkgreen transition-transform duration-200 hover:-translate-y-0.5"
        >
          <ArrowLeft size={24} />
        </button>
        <span className="ml-2 font-display text-[20px] font-bold tracking-tight text-textdark">
          {book.course}
        </span>
      </div>

      <div className="mt-6">
        {/* Cover placeholder */}
        <div className="glass-tint flex h-[220px] w-full items-center justify-center rounded-[16px] text-mint-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
          <BookOpen size={48} />
        </div>

        <div className="mt-6 font-display text-[20px] font-bold tracking-tight text-ink">{book.title}</div>
        <div className="mt-2 text-[14px] text-black54">
          {book.course} • {book.condition}
        </div>
        <div className="tag-mint mt-2 inline-block rounded-[20px] px-3 py-1 text-[11px] font-bold">{book.tag}</div>

        <button
          type="button"
          onClick={vm.goToSeller}
          className="mt-6 flex items-center"
        >
          <span className="glass-tint flex h-10 w-10 items-center justify-center rounded-full text-mint-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
            <Star size={16} />
          </span>
          <span className="ml-3 font-display text-[15px] font-bold text-ink">{book.seller}</span>
        </button>

        <button
          type="button"
          onClick={vm.openChat}
          className="glass-accent glass-sheen mt-8 flex h-[50px] w-full items-center justify-center gap-2 rounded-[28px] font-bold text-white transition-transform duration-200 hover:-translate-y-0.5"
        >
          <MessageCircle size={18} />
          Message Seller
        </button>
      </div>
    </div>
  );
}
