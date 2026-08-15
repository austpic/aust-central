import { useNavigate } from 'react-router-dom';
import { MOCK_USER } from '../data/user';
import type { UserProfile } from '../models/user';

// Mirrors BookProfilePage in lib/screens/book_exchange/book_profile_page.dart
// (stateless — static "Your Name", a rating, and placeholder section tiles).
export function useBookProfileViewModel() {
  const navigate = useNavigate();
  const user: UserProfile = { name: MOCK_USER.name, email: MOCK_USER.email };
  const tiles: { icon: string; label: string }[] = [
    { icon: 'list', label: 'My Listings' },
    { icon: 'bookmark', label: 'Saved Books' },
    { icon: 'history', label: 'Exchange History' },
    { icon: 'settings', label: 'Settings' },
  ];
  return { user, rating: '4.9', tiles, goBack: () => navigate(-1) };
}
