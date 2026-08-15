import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { communityRepository } from '../repositories/community';
import { ApiError } from '../api/errors';
import type { BookListing } from '../models/bookListing';
import { toBookListing } from '../models/bookListing';

// Mirrors ListingDetailPage in lib/views/book_exchange/listing_detail_page.dart.
// Flutter receives the listing as a navigation argument from the browse
// screen; the web route is a shareable URL, so it fetches by id instead —
// a direct link or a page reload still resolves to the real listing.
export function useBookListingDetailViewModel() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [book, setBook] = useState<BookListing | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const row = await communityRepository.listing(id);
      setBook(toBookListing(row));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load this listing.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    book,
    loading,
    error,
    reload: load,
    goToSeller: () => navigate(`/book-exchange/seller/${book?.sellerId}`),
    openChat: () => navigate(`/book-exchange/chat/${book?.id}`),
    goBack: () => navigate(-1),
  };
}
