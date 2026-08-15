import { ArrowLeft, Star, MessageCircle } from 'lucide-react';
import { useSellerProfileViewModel } from '../viewmodels/useSellerProfileViewModel';
import { LoadingState, ErrorState } from '../components/AsyncState';

// Mirrors SellerProfilePage in lib/screens/book_exchange/seller_profile_page.dart.
export default function SellerProfileView() {
  const vm = useSellerProfileViewModel();

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

  if (!vm.sellerName) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-10 text-center text-labgrey">
        Seller not found.
      </div>
    );
  }

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
        <span className="ml-1 truncate font-display text-[20px] font-bold tracking-tight text-textdark">
          {vm.sellerName}
        </span>
      </div>

      <div className="mt-6 text-center">
        <div className="glass-tint mx-auto flex h-[88px] w-[88px] items-center justify-center rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
          <span className="text-[30px] font-bold text-darkgreen">
            {vm.sellerName.charAt(0)}
          </span>
        </div>
        <div className="mt-4 font-display text-[18px] font-bold tracking-tight text-ink">{vm.sellerName}</div>
        <div className="mt-2 flex items-center justify-center gap-2">
          <Star size={16} className="text-warning" />
          <span className="font-mono text-[11px] text-black54">
            {vm.rating}{vm.reviewCount > 0 ? ` (${vm.reviewCount})` : ''}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={vm.openChat}
        disabled={!vm.canMessage}
        className="glass-accent glass-sheen mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-[28px] font-bold text-white transition-transform duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <MessageCircle size={18} />
        Message
      </button>

      <div className="eyebrow-rule mt-8">Exchange History</div>
      <div className="glass mt-4 rounded-[16px] py-5 text-center font-mono text-[11px] uppercase tracking-[0.08em] text-black45">
        No past exchanges yet
      </div>
    </div>
  );
}
