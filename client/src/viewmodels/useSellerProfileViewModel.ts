import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { communityRepository } from '../repositories/community';
import { ApiError } from '../api/errors';

// Mirrors SellerProfileViewModel in lib/viewmodels/seller_profile_view_model.dart.
// A seller's public profile: rating, reviews, and active listings — a real
// average, or honestly absent, rather than a hardcoded 4.9 shown for everyone.
export function useSellerProfileViewModel() {
  const navigate = useNavigate();
  const { id: sellerId } = useParams();

  const [sellerName, setSellerName] = useState<string | undefined>(undefined);
  const [reviewCount, setReviewCount] = useState(0);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [messageableListingId, setMessageableListingId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!sellerId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [{ items: reviews }, { items: listings }] = await Promise.all([
        communityRepository.sellerReviews(sellerId),
        communityRepository.listings(),
      ]);

      const total = reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0);
      setAverageRating(reviews.length === 0 ? null : total / reviews.length);
      setReviewCount(reviews.length);

      // Browse is already scoped to active listings; narrowing to this
      // seller keeps the profile to what is currently on offer.
      const sellerListings = listings.filter(
        (l: { seller: { id: string; name: string } }) => l.seller.id === sellerId,
      );
      setSellerName(sellerListings[0]?.seller.name);
      // A conversation is keyed to a listing, so messaging targets their newest.
      setMessageableListingId(sellerListings[0]?.id as string | undefined);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load this seller.');
    } finally {
      setLoading(false);
    }
  }, [sellerId]);

  useEffect(() => {
    load();
  }, [load]);

  const rating = averageRating === null ? '—' : averageRating.toFixed(1);

  return {
    sellerId,
    sellerName,
    rating,
    reviewCount,
    canMessage: messageableListingId !== undefined,
    loading,
    error,
    reload: load,
    openChat: () => navigate(`/book-exchange/chat/${messageableListingId}`),
    goBack: () => navigate(-1),
  };
}
