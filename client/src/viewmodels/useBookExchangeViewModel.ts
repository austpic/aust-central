import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { communityRepository } from '../repositories/community';
import { ApiError } from '../api/errors';
import type { BookFilter, BookListing, BookTab } from '../models/bookListing';
import { BOOK_FILTERS, BOOK_TABS, filterToSort, toBookListing } from '../models/bookListing';

// Mirrors BookExchangeViewModel in lib/viewmodels/book_exchange_view_model.dart.
// Tabs, sorting, and the saved list are all server-side queries now — the
// screen used to sort two hardcoded maps in memory, so "Saved" could only
// ever hold those two and no other student's books existed at all.
export function useBookExchangeViewModel() {
  const navigate = useNavigate();
  const toast = useToast();
  const [selectedTab, setSelectedTab] = useState<BookTab>('browse');
  const [selectedFilter, setSelectedFilter] = useState<BookFilter>('course');
  const [search, setSearch] = useState('');
  const [books, setBooks] = useState<BookListing[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { items } = await communityRepository.listings(
        selectedTab,
        filterToSort(selectedFilter),
        search.trim() || undefined,
      );
      const mapped = items.map(toBookListing);
      setBookmarkedIds(new Set(mapped.filter((b) => b.isBookmarked).map((b) => b.id)));
      setBooks(mapped);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load listings.');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTab, selectedFilter, search]);

  // Debounced: search is a live onChange but filtering is a server round
  // trip, so firing one on every keystroke would flood the API.
  useEffect(() => {
    const id = setTimeout(load, 300);
    return () => clearTimeout(id);
  }, [load]);

  const emptyMessage =
    selectedTab === 'mine'
      ? "You haven't listed any books yet"
      : selectedTab === 'saved'
        ? 'Nothing saved yet'
        : 'No listings right now';

  /** Saved listings persist per user, so the Saved tab survives a reinstall. */
  async function toggleBookmark(id: string) {
    const saved = !bookmarkedIds.has(id);
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (saved) next.add(id);
      else next.delete(id);
      return next;
    });

    try {
      await communityRepository.setBookmark(id, saved);
      if (!saved && selectedTab === 'saved') {
        // Un-saving while viewing Saved should drop the card from the list.
        setBooks((prev) => prev.filter((b) => b.id !== id));
      }
    } catch (err) {
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        if (saved) next.delete(id);
        else next.add(id);
        return next;
      });
      toast(err instanceof ApiError ? err.message : 'Could not update the bookmark.', 'error');
    }
  }

  async function copyListingLink(book: BookListing) {
    await navigator.clipboard?.writeText(`${window.location.origin}/book-exchange/${book.id}`).catch(() => {});
    toast('Link copied to clipboard', 'success');
  }

  return {
    tabs: BOOK_TABS,
    selectedTab,
    setSelectedTab,
    filters: BOOK_FILTERS,
    selectedFilter,
    setSelectedFilter,
    search,
    setSearch,
    visibleBooks: books,
    emptyMessage,
    loading,
    error,
    reload: load,
    isBookmarked: (id: string) => bookmarkedIds.has(id),
    toggleBookmark,
    copyListingLink,
    goToNotifications: () => navigate('/book-exchange/notifications'),
    goToProfile: () => navigate('/book-exchange/profile'),
    goToPost: () => navigate('/book-exchange/post'),
    openDetail: (book: BookListing) => navigate(`/book-exchange/${book.id}`),
    openChat: (book: BookListing) => navigate(`/book-exchange/chat/${book.id}`),
    openSeller: (book: BookListing) => navigate(`/book-exchange/seller/${book.sellerId}`),
  };
}
