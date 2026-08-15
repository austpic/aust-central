import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { platformRepository } from '../repositories/platform';
import { ApiError } from '../api/errors';
import type { AppNotification } from '../models/appNotification';
import { toAppNotification } from '../models/appNotification';

// Mirrors BookNotificationPage in lib/views/book_exchange/book_notification_page.dart,
// which is itself still a hardcoded TODO stub on the Flutter side. The
// server's general notification feed already covers book-message events
// (type BOOK_MESSAGE), so this screen scopes it to that type rather than
// showing invented "Shahidul Islam Arman replied to you" placeholder rows.
export function useBookNotificationsViewModel() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { items } = await platformRepository.notifications(false, 'BOOK_MESSAGE');
      setNotifications(items.map(toAppNotification));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { notifications, loading, error, reload: load, goBack: () => navigate(-1) };
}
