import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { communityRepository } from '../repositories/community';
import type { UserProfile } from '../models/user';

// Mirrors BookProfilePage in lib/views/book_exchange/book_profile_page.dart —
// the signed-in user's own book-exchange profile, with a real average rating
// from their reviews rather than a hardcoded "4.9".
export function useBookProfileViewModel() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [rating, setRating] = useState<string | null>(null);

  useEffect(() => {
    if (!authUser) return;
    let cancelled = false;
    communityRepository
      .sellerReviews(authUser.id)
      .then(({ items }) => {
        if (cancelled || items.length === 0) return;
        const avg = items.reduce((sum: number, r) => sum + r.rating, 0) / items.length;
        setRating(avg.toFixed(1));
      })
      .catch(() => {
        /* no reviews yet is not an error state worth surfacing here */
      });
    return () => {
      cancelled = true;
    };
  }, [authUser]);

  const user: UserProfile = { name: authUser?.name ?? 'AUST Student', email: authUser?.email ?? '' };
  const tiles: { icon: string; label: string }[] = [
    { icon: 'list', label: 'My Listings' },
    { icon: 'bookmark', label: 'Saved Books' },
    { icon: 'history', label: 'Exchange History' },
    { icon: 'settings', label: 'Settings' },
  ];
  // Honest absence, not an invented score — matches the same fix made on the
  // seller-profile side of the app.
  return { user, rating: rating ?? '—', tiles, goBack: () => navigate(-1) };
}
