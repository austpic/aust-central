import { ArrowLeft, Bell, Search, User } from 'lucide-react';
import BookCard from '../components/BookCard';
import { useBookExchangeViewModel } from '../viewmodels/useBookExchangeViewModel';

// Mirrors BookExchangeScreen in lib/screens/book_exchange/book_exchange_screen.dart.
export default function BookExchangeView() {
  const vm = useBookExchangeViewModel();

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => history.back()}
            aria-label="Back"
            className="glass flex h-11 w-11 items-center justify-center rounded-full text-darkgreen transition-transform duration-200 hover:-translate-y-0.5"
          >
            <ArrowLeft size={24} />
          </button>
          <span className="ml-3 font-display text-[24px] font-bold tracking-tight text-textdark">
            Book Exchange
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={vm.goToNotifications}
            aria-label="Notifications"
            className="glass-tint flex h-10 w-10 items-center justify-center rounded-full text-darkgreen shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]"
          >
            <Bell size={20} />
          </button>
          <button
            type="button"
            onClick={vm.goToProfile}
            aria-label="Profile"
            className="glass-tint flex h-10 w-10 items-center justify-center rounded-full text-darkgreen shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]"
          >
            <User size={22} />
          </button>
        </div>
      </div>

      {/* Hero banner */}
      <div className="glass-accent glass-sheen relative mt-4 overflow-hidden rounded-[24px] px-5 py-5 text-white">
        <div className="absolute -right-8 -top-8 h-[150px] w-[150px] rounded-full bg-white/5" />
        <div className="absolute -bottom-10 right-5 h-[120px] w-[120px] rounded-full bg-white/5" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="font-display text-[21px] font-bold leading-[1.25]">
            Give Your Old
            <br />
            Textbooks New Life
          </div>
          <button
            type="button"
            onClick={vm.goToPost}
            className="glass-strong shrink-0 rounded-[30px] px-5 py-3 text-[14px] font-bold text-darkgreen transition-transform duration-200 hover:-translate-y-0.5"
          >
            Post a Book
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-3">
        {vm.tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => vm.setSelectedTab(tab.key)}
            className={`rounded-[24px] px-4 py-2 text-[13px] font-bold transition-transform duration-200 hover:-translate-y-0.5 ${
              vm.selectedTab === tab.key
                ? 'glass-pill-active'
                : 'glass-pill text-textdark'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="glass-input mt-4 flex h-12 items-center rounded-[16px] px-4">
        <Search size={22} className="text-dim" />
        <input
          type="text"
          placeholder="Search by title, author, course..."
          className="ml-3 w-full bg-transparent text-[14px] text-ink outline-none placeholder:text-black38"
        />
      </div>

      {/* Filter chips */}
      <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
        {vm.filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => vm.setSelectedFilter(f.key)}
            className={`shrink-0 rounded-[20px] px-4 py-2 text-[13px] font-semibold transition-transform duration-200 hover:-translate-y-0.5 ${
              vm.selectedFilter === f.key
                ? 'glass-pill-active'
                : 'glass-pill text-textdark'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Book list */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {vm.visibleBooks.map((book) => (
          <BookCard
            key={book.id}
            book={book}
            bookmarked={vm.isBookmarked(book.id)}
            onOpen={() => vm.openDetail(book)}
            onToggleBookmark={() => vm.toggleBookmark(book.id)}
            onShare={() => vm.copyListingLink(book)}
            onMessage={() => vm.openChat(book)}
            onOpenSeller={() => vm.openSeller(book)}
          />
        ))}
      </div>
    </div>
  );
}
