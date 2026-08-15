import notificationUrl from '../assets/notification.svg';
import profileIconUrl from '../assets/profile_icon.svg';

// Wraps the exact SVG assets used in the Flutter app
// (assets/icons/notification.svg + profile_icon.svg).
export function NotificationBell({ className = '' }: { className?: string }) {
  return <img src={notificationUrl} alt="Notifications" className={className} />;
}

export function ProfileIconSvg({ className = '' }: { className?: string }) {
  return <img src={profileIconUrl} alt="Profile" className={className} />;
}
