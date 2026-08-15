import { ArrowLeft, Search } from 'lucide-react';
import ItemCard from '../components/ItemCard';
import { useLostFoundViewModel } from '../viewmodels/useLostFoundViewModel';
import { LoadingState, ErrorState } from '../components/AsyncState';

// Mirrors LostFoundScreen in lib/screens/lost_found_screen.dart.
export default function LostFoundView() {
  const vm = useLostFoundViewModel();

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* Header */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => history.back()}
          aria-label="Back"
          className="glass flex h-11 w-11 items-center justify-center rounded-full text-textdark transition-transform duration-200 hover:-translate-y-0.5"
        >
          <ArrowLeft size={24} />
        </button>
        <span className="ml-1 font-display text-[22px] font-bold tracking-tight text-textdark">Lost &amp; Found</span>
      </div>

      {/* Search */}
      <div className="glass-input mt-4 flex h-12 items-center rounded-[15px] px-4">
        <Search size={20} className="text-dim" />
        <input
          type="text"
          value={vm.search}
          onChange={(e) => vm.setSearch(e.target.value)}
          placeholder="Search items..."
          className="ml-3 w-full bg-transparent text-[14px] text-textdark outline-none placeholder:text-dim"
        />
      </div>

      {/* Category chips */}
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {vm.categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => vm.selectCategory(category)}
            className={`shrink-0 rounded-[20px] px-4 py-2 text-[13px] font-semibold transition-transform duration-200 hover:-translate-y-0.5 ${
              vm.selectedCategory === category
                ? 'glass-pill-active'
                : 'glass-pill text-textdark'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Items */}
      <div className="mt-4">
        {vm.loading ? (
          <LoadingState />
        ) : vm.error ? (
          <ErrorState message={vm.error} onRetry={vm.reload} />
        ) : vm.filtered.length === 0 ? (
          <div className="py-12 text-center">
            <div className="glass-tint mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
              <Search size={28} className="text-mint-ink" />
            </div>
            <div className="mt-4 font-display text-[15px] font-bold text-textdark">
              No items match your search.
            </div>
            <p className="mx-auto mt-1 max-w-xs text-[13px] leading-[1.5] text-dim">
              Try a different keyword or category — your lost item might be waiting in another category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {vm.filtered.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
