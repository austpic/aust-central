import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_USER } from '../data/user';

// Mirrors _HomePageState in lib/screens/home_page.dart — greeting, live
// date/time, scroll pan for the transport card, and every navigation trigger.
export function useHomeViewModel() {
  const navigate = useNavigate();
  const [now, setNow] = useState(() => new Date());
  const [scrollOffset, setScrollOffset] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

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

  function userLastName(): string {
    const parts = MOCK_USER.name.trim().split(/\s+/);
    return parts.length > 1 ? parts[parts.length - 1] : parts[0];
  }

  return {
    greeting: greeting(),
    formattedDateTime: formattedDateTime(),
    userLastName: userLastName(),
    scrollOffset,
    onScroll,
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
