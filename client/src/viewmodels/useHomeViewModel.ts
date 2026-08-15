import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { platformRepository } from '../repositories/platform';
import { useAuth } from './AuthContext';

/**
 * Mirrors _HomePageState in lib/views/home/home_page.dart and
 * DashboardViewModel — greeting, live date/time, and every dashboard counter
 * in one round trip. The notice hero and unread badge were previously literal
 * strings ("Mid-term routine released…") baked into the view; they now come
 * from `/me/dashboard`, the same endpoint the Flutter app reads.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Dashboard = any;

export function useHomeViewModel() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [now, setNow] = useState(() => new Date());
  const [scrollOffset, setScrollOffset] = useState(0);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  const load = useCallback(async () => {
    try {
      const data = await platformRepository.dashboard();
      setDashboard(data);
      setLoadFailed(false);
    } catch {
      // Offline or server down: the dashboard still renders, just without
      // counters, rather than throwing the user to an error screen.
      setLoadFailed(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function onScroll(value: number) {
    setScrollOffset(value);
  }

  function greeting(): string {
    const hour = now.getHours();
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    if (hour < 20) return 'Evening';
    return 'Night';
  }

  function formattedDateTime(): string {
    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const weekday = weekdays[now.getDay() === 0 ? 6 : now.getDay() - 1];
    const hour12 = now.getHours() % 12 === 0 ? 12 : now.getHours() % 12;
    const minute = now.getMinutes().toString().padStart(2, '0');
    const period = now.getHours() >= 12 ? 'pm' : 'am';
    return `${weekday}, ${hour12}:${minute} ${period}`;
  }

  /** Falls back to the cached user while loading, so the header does not
   *  flicker through a placeholder on every open. */
  function userLastName(): string {
    const fromServer = dashboard?.greetingName as string | undefined;
    if (fromServer) return fromServer;
    const name = user?.name ?? 'there';
    const parts = name.trim().split(/\s+/);
    return parts.length > 1 ? parts[parts.length - 1] : parts[0];
  }

  const hasData = dashboard !== null && !loadFailed;
  const latestNotice = hasData ? dashboard.latestNotice : null;
  const unreadNotifications = hasData ? (dashboard.unreadNotifications ?? 0) : 0;

  return {
    greeting: greeting(),
    formattedDateTime: formattedDateTime(),
    userLastName: userLastName(),
    scrollOffset,
    onScroll,
    noticeTitle: latestNotice?.title ?? (hasData ? 'No notices yet' : 'Loading notices…'),
    noticeBody: latestNotice?.body ?? '',
    unreadNotifications,
    tasksDueToday: hasData ? dashboard.tasksDueToday : null,
    nextClassTime: hasData ? (dashboard.nextClass?.classTime ?? null) : null,
    cgpa: hasData ? dashboard.cgpa : null,
    labReportDrafts: hasData ? dashboard.labReportDrafts : null,
    openBloodRequests: hasData ? dashboard.openBloodRequests : null,
    activeListings: hasData ? dashboard.activeListings : null,
    openLostFoundItems: hasData ? dashboard.openLostFoundItems : null,
    goToNotifications: () => navigate('/notifications'),
    goToTodo: () => navigate('/todo'),
    goToClassReminder: () => navigate('/class-reminder'),
    goToTransport: () => navigate('/transport'),
    goToNoticeBoard: () => navigate('/notice-board'),
    goToCgpa: () => navigate('/cgpa'),
    goToLabReport: () => navigate('/lab-report'),
    goToProfile: () => navigate('/profile'),
    goToBloodBank: () => navigate('/blood-bank'),
    goToBookExchange: () => navigate('/book-exchange'),
    goToLostFound: () => navigate('/lost-found'),
  };
}
