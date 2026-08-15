import { useNavigate, useParams } from 'react-router-dom';
import { SEED_BOOKS } from '../data/books';

// Mirrors ListingDetailPage in lib/screens/book_exchange/listing_detail_page.dart
export function useBookListingDetailViewModel() {
  const navigate = useNavigate();
  const { id } = useParams();
  const book = SEED_BOOKS.find((b) => b.id === id);

  return {
    book,
    goToSeller: () => navigate(`/book-exchange/seller/${book?.id}`),
    openChat: () => navigate(`/book-exchange/chat/${book?.id}`),
    goBack: () => navigate(-1),
  };
}
