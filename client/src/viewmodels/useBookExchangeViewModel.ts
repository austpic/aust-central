import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { SEED_BOOKS } from '../data/books';
import type { BookFilter, BookListing, BookTab } from '../models/bookListing';
import { BOOK_FILTERS, BOOK_TABS } from '../models/bookListing';

function isFreeOrSwap(tag: string): boolean {
  const lower = tag.toLowerCase();
  return lower.includes('swap') || lower.includes('free');
}

// Mirrors _BookExchangeScreenState in lib/screens/book_exchange/book_exchange_screen.dart
export function useBookExchangeViewModel() {
  const navigate = useNavigate();
  const toast = useToast();
  const [selectedTab, setSelectedTab] = useState<BookTab>('browse');
  const [selectedFilter, setSelectedFilter] = useState<BookFilter>('course');
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  const visibleBooks = useMemo(() => {
    const list =
      selectedTab === 'saved'
        ? SEED_BOOKS.filter((b) => bookmarkedIds.has(b.id))
        : [...SEED_BOOKS];

    switch (selectedFilter) {
      case 'department':
        list.sort((a, b) => a.department.localeCompare(b.department));
        break;
      case 'course':
        list.sort((a, b) => a.course.localeCompare(b.course));
        break;
      case 'semester':
        list.sort((a, b) => a.semester.localeCompare(b.semester));
        break;
      case 'freeswap':
        list.sort((a, b) => {
          const aFree = isFreeOrSwap(a.tag);
          const bFree = isFreeOrSwap(b.tag);
          if (aFree === bFree) return 0;
          return aFree ? -1 : 1;
        });
        break;
    }
    return list;
  }, [selectedTab, selectedFilter, bookmarkedIds]);

  function toggleBookmark(id: string) {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function copyListingLink(book: BookListing) {
    await navigator.clipboard?.writeText(`https://yourapp.com/listing/${book.id}`).catch(() => {});
    toast('Link copied to clipboard', 'success');
  }

  return {
    tabs: BOOK_TABS,
    selectedTab,
    setSelectedTab,
    filters: BOOK_FILTERS,
    selectedFilter,
    setSelectedFilter,
    visibleBooks,
    isBookmarked: (id: string) => bookmarkedIds.has(id),
    toggleBookmark,
    copyListingLink,
    goToNotifications: () => navigate('/book-exchange/notifications'),
    goToProfile: () => navigate('/book-exchange/profile'),
    goToPost: () => navigate('/book-exchange/post'),
    openDetail: (book: BookListing) => navigate(`/book-exchange/${book.id}`),
    openChat: (book: BookListing) => navigate(`/book-exchange/chat/${book.id}`),
    openSeller: (book: BookListing) => navigate(`/book-exchange/seller/${book.id}`),
  };
}
