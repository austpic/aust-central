import { Bell } from 'lucide-react';
import { useNotificationsViewModel } from '../viewmodels/useNotificationsViewModel';

// Mirrors notifications_screen.dart — a stub with the real page message.
export default function NotificationsView() {
  const vm = useNotificationsViewModel();

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center text-center">
      <div className="glass-tint flex h-20 w-20 items-center justify-center rounded-[24px] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] text-mint-ink">
        <Bell size={36} />
      </div>
      <div className="mt-6 font-display text-[18px] font-bold tracking-tight text-textdark">Notifications</div>
      <p className="mt-2 max-w-xs text-[14px] leading-[1.5] text-dim">
        {vm.message}
      </p>
    </div>
  );
}
