import { useNavigate, useParams } from 'react-router-dom';
import { SEED_BOOKS } from '../data/books';

// Mirrors SellerProfilePage in lib/screens/book_exchange/seller_profile_page.dart
export function useSellerProfileViewModel() {
  const navigate = useNavigate();
  const { id } = useParams();
  const seller = SEED_BOOKS.find((b) => b.id === id);

  return {
    seller,
    rating: '4.9',
    openChat: () => navigate(`/book-exchange/chat/${seller?.id}`),
    goBack: () => navigate(-1),
  };
}
