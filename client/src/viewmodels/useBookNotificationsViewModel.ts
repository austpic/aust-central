import { useNavigate } from 'react-router-dom';
import { BOOK_NOTIFICATIONS } from '../data/bookNotifications';

// Mirrors BookNotificationPage in lib/screens/book_exchange/book_notification_page.dart
// (stateless — a hardcoded list with an empty state).
export function useBookNotificationsViewModel() {
  const navigate = useNavigate();
  return { notifications: BOOK_NOTIFICATIONS, goBack: () => navigate(-1) };
}
